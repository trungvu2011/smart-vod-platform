require("dotenv").config();

const { URL } = require("url");
const Minio = require("minio");
const prisma = require("../src/config/prisma");
const videoQueue = require("../src/config/queue");
const redisClient = require("../src/config/redis");

const log = (message) => console.log(`[demo-ai] ${message}`);
const warn = (message) => console.warn(`[demo-ai] WARN: ${message}`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const args = process.argv.slice(2).reduce((acc, item) => {
  if (!item.startsWith("--")) return acc;
  const [key, rawValue] = item.slice(2).split("=");
  acc[key] = rawValue === undefined ? true : rawValue;
  return acc;
}, {});

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT || "9000", 10),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const parseObjectNameFromUrl = (value, bucketName) => {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const bucketIndex = parts.findIndex((part) => part === bucketName);
    if (bucketIndex === -1) return null;
    return parts.slice(bucketIndex + 1).join("/");
  } catch (_) {
    const marker = `/${bucketName}/`;
    const index = value.indexOf(marker);
    if (index === -1) return null;
    return value.slice(index + marker.length);
  }
};

const anchorIdFromHlsUrl = (value, bucketName) => {
  const objectName = parseObjectNameFromUrl(value, bucketName);
  if (!objectName) return null;
  const match = objectName.match(/^hls\/([^/]+)\/master\.m3u8$/);
  return match?.[1] || null;
};

const statFirstExistingObject = async (bucketName, candidates) => {
  for (const objectName of candidates) {
    try {
      await minioClient.statObject(bucketName, objectName);
      return objectName;
    } catch (_) {
      // Try the next likely extension.
    }
  }
  return null;
};

const findAnchors = async (bucketName) => {
  const videos = await prisma.video.findMany({
    where: {
      status: { in: ["READY", "PENDING"] },
      metadata: { is: { hlsMasterUrl: { not: null } } },
    },
    include: { metadata: true },
    orderBy: { createdAt: "asc" },
  });

  const anchors = [];
  for (const video of videos) {
    const hlsAnchorId = anchorIdFromHlsUrl(video.metadata?.hlsMasterUrl, bucketName);
    if (hlsAnchorId !== video.id) continue;

    const rawObjectName = await statFirstExistingObject(bucketName, [
      `demo/raw/${video.id}.mp4`,
      `demo/raw/${video.id}.webm`,
      `demo/raw/${video.id}.mkv`,
      `demo/raw/${video.id}.mov`,
      `${video.id}.mp4`,
      `${video.id}.webm`,
      `${video.id}.mkv`,
      `${video.id}.mov`,
    ]);

    if (!rawObjectName) {
      warn(`Skipping ${video.id} (${video.title}) because raw source object was not found.`);
      continue;
    }

    anchors.push({ ...video, rawObjectName });
  }

  return anchors;
};

const queueAnchors = async (anchors, bucketName) => {
  const publicBase = String(process.env.MINIO_PUBLIC_URL || "").replace(/\/+$/, "");

  for (const anchor of anchors) {
    await prisma.video.update({
      where: { id: anchor.id },
      data: { status: "PENDING" },
    });

    await videoQueue.add(
      "process-hls",
      {
        videoId: anchor.id,
        originalFilename: anchor.rawObjectName,
        fileUrl: `${publicBase}/${bucketName}/${anchor.rawObjectName}`,
        shouldGenerateThumbnail: false,
        skipAi: false,
      },
      {
        jobId: `${anchor.id}:ai:${Date.now()}`,
        attempts: 1,
        removeOnComplete: { age: 24 * 60 * 60, count: 100 },
        removeOnFail: { age: 7 * 24 * 60 * 60, count: 100 },
      },
    );

    log(`Queued AI reprocess for anchor ${anchor.id}: ${anchor.title}`);
  }
};

const waitForAnchors = async (anchors, timeoutMinutes, pollSeconds) => {
  const anchorIds = anchors.map((anchor) => anchor.id);
  const deadline = Date.now() + timeoutMinutes * 60 * 1000;
  let lastMessage = "";

  while (Date.now() < deadline) {
    const rows = await prisma.video.findMany({
      where: { id: { in: anchorIds } },
      include: { metadata: true },
      orderBy: { createdAt: "asc" },
    });

    const failed = rows.filter((video) => video.status === "FAILED");
    if (failed.length) {
      throw new Error(`Anchor AI reprocess failed: ${failed.map((video) => video.title).join(", ")}`);
    }

    const ready = rows.filter((video) => video.metadata?.subtitleUrl && video.metadata?.aiSummary);
    const message = `${ready.length}/${anchorIds.length} anchors have subtitle + summary. Waiting ${pollSeconds}s...`;
    if (message !== lastMessage) {
      log(message);
      lastMessage = message;
    }

    if (ready.length === anchorIds.length) {
      await prisma.video.updateMany({
        where: { id: { in: anchorIds } },
        data: { status: "READY" },
      });
      return rows;
    }

    await sleep(pollSeconds * 1000);
  }

  throw new Error(`Timed out after ${timeoutMinutes} minutes waiting for anchor AI processing.`);
};

const propagateAnchorMetadata = async (anchors, bucketName) => {
  let updated = 0;

  for (const anchor of anchors) {
    const freshAnchor = await prisma.video.findUnique({
      where: { id: anchor.id },
      include: { metadata: true },
    });

    if (!freshAnchor?.metadata?.hlsMasterUrl) continue;
    if (!freshAnchor.metadata.subtitleUrl && !freshAnchor.metadata.aiSummary) continue;

    const result = await prisma.videoMetadata.updateMany({
      where: {
        videoId: { not: freshAnchor.id },
        hlsMasterUrl: freshAnchor.metadata.hlsMasterUrl,
      },
      data: {
        subtitleUrl: freshAnchor.metadata.subtitleUrl,
        aiSummary: freshAnchor.metadata.aiSummary,
        duration: freshAnchor.metadata.duration,
      },
    });

    updated += result.count;
    log(`Propagated ${result.count} clone(s) for anchor ${freshAnchor.id}.`);
  }

  const anchorIds = anchors.map((anchor) => anchor.id);
  await prisma.video.updateMany({
    where: { id: { in: anchorIds } },
    data: { status: "READY" },
  });

  return updated;
};

const main = async () => {
  const bucketName = process.env.MINIO_BUCKET_NAME;
  if (!bucketName) throw new Error("MINIO_BUCKET_NAME is not set.");

  const bucketReady = await minioClient.bucketExists(bucketName);
  if (!bucketReady) throw new Error(`MinIO bucket ${bucketName} is not available.`);

  const timeoutMinutes = parseInt(args.timeoutMinutes || "120", 10);
  const pollSeconds = parseInt(args.pollSeconds || "15", 10);

  const anchors = await findAnchors(bucketName);
  if (!anchors.length) {
    throw new Error("No anchor videos found. Expected videos whose own id appears in hls/<video_id>/master.m3u8.");
  }

  log(`Found ${anchors.length} anchor video(s).`);

  if (!args.propagateOnly) {
    await queueAnchors(anchors, bucketName);
    await waitForAnchors(anchors, timeoutMinutes, pollSeconds);
  } else {
    log("propagateOnly enabled; skipping queue/wait.");
  }

  const updated = await propagateAnchorMetadata(anchors, bucketName);

  const counts = await prisma.videoMetadata.aggregate({
    _count: {
      id: true,
      subtitleUrl: true,
      aiSummary: true,
    },
  });

  log(`Updated ${updated} clone metadata row(s).`);
  log(
    `Done. total=${counts._count.id}, hasSubtitle=${counts._count.subtitleUrl}, hasSummary=${counts._count.aiSummary}.`,
  );
};

main()
  .catch((error) => {
    console.error("[demo-ai] Fatal error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await videoQueue.close().catch(() => {});
    await redisClient.quit().catch(() => {});
    await prisma.$disconnect().catch(() => {});
  });
