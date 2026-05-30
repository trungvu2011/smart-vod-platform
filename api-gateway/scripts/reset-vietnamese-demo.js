/**
 * Reset local demo content while keeping user accounts, then seed Vietnamese
 * demo videos from five authorized anchor sources.
 *
 * Usage:
 *   npm run seed:vietnamese-demo -- --manifest=scripts/demo-vietnamese-sources.json --count=50 --confirm=RESET_DEMO
 *
 * Notes:
 *   - The real manifest is intentionally gitignored.
 *   - YouTube downloads require either source.authorized=true in the manifest
 *     or --allow-youtube-download. Only use URLs you are allowed to download.
 */

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const os = require("os");
const http = require("http");
const https = require("https");
const { pipeline } = require("stream/promises");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { fileURLToPath } = require("url");
const Minio = require("minio");

process.env.DOTENV_CONFIG_QUIET = process.env.DOTENV_CONFIG_QUIET || "true";
require("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });
require("dotenv").config({ quiet: true });

const prisma = require("../src/config/prisma");
const videoQueue = require("../src/config/queue");
const redisClient = require("../src/config/redis");
const searchService = require("../src/services/search.service");
const {
  getElasticsearchClient,
  isElasticsearchEnabled,
} = require("../src/config/elasticsearch");

const execFileAsync = promisify(execFile);
let ffprobeCommand = null;
let ffmpegCommand = null;

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT || "9000", 10),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const DEFAULT_COUNT = 50;
const REQUIRED_ANCHOR_COUNT = 5;
const TARGET_MIN_DURATION_SECONDS = 15 * 60;
const TARGET_MAX_DURATION_SECONDS = 20 * 60;
const ABSOLUTE_MIN_DURATION_SECONDS = 8 * 60;
const ABSOLUTE_MAX_DURATION_SECONDS = 30 * 60;
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const WORKER_HEARTBEAT_KEY = "worker:video:heartbeat";
const VIDEO_INDEX = process.env.ELASTICSEARCH_INDEX_VIDEOS || "videos";

const DEFAULT_SEARCH_QUERIES = [
  "dao tao noi bo tieng Viet",
  "ky nang lam viec tieng Viet",
  "hoc truc tuyen tieng Viet",
];

const CATEGORY_SEARCH_QUERIES = {
  Engineering: [
    "lap trinh phan mem tieng Viet",
    "hoc backend tieng Viet",
    "hoc react nodejs tieng Viet",
    "postgresql docker kubernetes tieng Viet",
  ],
  Security: [
    "an toan thong tin tieng Viet",
    "bao mat mang tieng Viet",
    "cyber security tieng Viet",
    "bao mat du lieu doanh nghiep tieng Viet",
  ],
  Operations: [
    "van hanh he thong tieng Viet",
    "giam sat he thong tieng Viet",
    "devops monitoring tieng Viet",
    "quan tri ha tang tieng Viet",
  ],
  Marketing: [
    "marketing can ban tieng Viet",
    "digital marketing tieng Viet",
    "chien luoc noi dung tieng Viet",
    "truyen thong thuong hieu tieng Viet",
  ],
  Product: [
    "quan ly san pham tieng Viet",
    "thiet ke san pham tieng Viet",
    "product management tieng Viet",
  ],
  Sales: [
    "ky nang ban hang tieng Viet",
    "sales B2B tieng Viet",
    "cham soc khach hang tieng Viet",
  ],
  Leadership: [
    "ky nang lanh dao tieng Viet",
    "quan ly nhom tieng Viet",
    "giao tiep noi bo tieng Viet",
  ],
  Collaboration: [
    "lam viec nhom tieng Viet",
    "hop tac trong cong viec tieng Viet",
    "giao tiep nhom tieng Viet",
  ],
  Onboarding: [
    "dao tao nhan vien moi tieng Viet",
    "onboarding nhan vien tieng Viet",
    "huong dan nhan vien moi tieng Viet",
  ],
};

const PLAYLIST_SPECS = [
  {
    name: "Dao tao nhan vien moi",
    categories: ["Onboarding", "Leadership", "Collaboration"],
    limit: 12,
  },
  {
    name: "Ky nang cong nghe",
    categories: ["Engineering", "Security"],
    limit: 12,
  },
  {
    name: "Bao mat va van hanh",
    categories: ["Security", "Operations", "Engineering"],
    limit: 12,
  },
  {
    name: "San pham va thi truong",
    categories: ["Product", "Marketing", "Sales", "Customer Success"],
    limit: 12,
  },
  {
    name: "Lanh dao va hop tac",
    categories: ["Leadership", "Collaboration", "Operations"],
    limit: 12,
  },
];

const COMMENT_SAMPLES = [
  "Noi dung ro rang va rat phu hop cho dao tao noi bo.",
  "Video nay co the dua vao playlist onboarding cua nhom.",
  "Phan trinh bay de theo doi, vi du gan voi cong viec hang ngay.",
  "Tai lieu huu ich de chia se trong buoi hoc tiep theo.",
  "Minh da luu lai de xem lai khi can tham khao.",
  "Chu de nay nen duoc dua vao lo trinh hoc bat buoc.",
];

const CATEGORY_RULES = [
  {
    category: "Engineering",
    keywords: [
      "lap trinh",
      "react",
      "node",
      "javascript",
      "typescript",
      "python",
      "backend",
      "frontend",
      "database",
      "postgres",
      "sql",
      "api",
      "docker",
      "kubernetes",
      "devops",
    ],
  },
  {
    category: "Security",
    keywords: ["bao mat", "an toan thong tin", "security", "cyber"],
  },
  {
    category: "Operations",
    keywords: ["van hanh", "operations", "ha tang", "infrastructure", "monitoring"],
  },
  {
    category: "Product",
    keywords: ["san pham", "product", "thiet ke san pham", "ux", "ui"],
  },
  {
    category: "Marketing",
    keywords: ["marketing", "thuong hieu", "truyen thong", "content"],
  },
  {
    category: "Sales",
    keywords: ["sales", "ban hang", "kinh doanh", "khach hang"],
  },
  {
    category: "Leadership",
    keywords: ["lanh dao", "leader", "leadership", "quan ly", "giao tiep"],
  },
  {
    category: "Collaboration",
    keywords: ["hop tac", "teamwork", "nhom", "lam viec nhom"],
  },
  {
    category: "Onboarding",
    keywords: ["onboarding", "dao tao", "nhan vien moi", "huong dan"],
  },
];

const log = (message) => console.log(`[vn-demo] ${message}`);
const warn = (message) => console.warn(`[vn-demo] WARN: ${message}`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`${label} timed out after ${ms}ms.`));
      }, ms);
      promise.finally(() => clearTimeout(timer)).catch(() => {});
    }),
  ]);

const parseArgs = (argv) => {
  const args = {
    manifest: path.join("scripts", "demo-vietnamese-sources.json"),
    count: DEFAULT_COUNT,
    confirm: "",
    allowProd: false,
    allowYoutubeDownload: false,
    allowGeneratedMetadata: false,
    dryRun: false,
    runAi: false,
    waitTimeoutMinutes: 180,
    pollSeconds: 15,
  };

  const envFlag = (name) => {
    const value = process.env[name];
    return value === "true" || value === "1" || value === "";
  };

  for (const rawArg of argv.slice(2)) {
    if (!rawArg.startsWith("--")) continue;
    const [rawKey, rawValue] = rawArg.replace(/^--/, "").split("=");
    const value = rawValue === undefined ? true : rawValue;

    if (rawKey === "manifest" && typeof value === "string") args.manifest = value;
    if (rawKey === "count" && typeof value === "string") {
      const parsed = parseInt(value, 10);
      if (parsed > 0) args.count = parsed;
    }
    if (rawKey === "confirm" && typeof value === "string") args.confirm = value;
    if (rawKey === "allow-prod") args.allowProd = true;
    if (rawKey === "allow-youtube-download") args.allowYoutubeDownload = true;
    if (rawKey === "allow-generated-metadata") args.allowGeneratedMetadata = true;
    if (rawKey === "dry-run") args.dryRun = true;
    if (rawKey === "run-ai") args.runAi = true;
    if (rawKey === "wait-timeout-minutes" && typeof value === "string") {
      const parsed = parseInt(value, 10);
      if (parsed > 0) args.waitTimeoutMinutes = parsed;
    }
    if (rawKey === "poll-seconds" && typeof value === "string") {
      const parsed = parseInt(value, 10);
      if (parsed > 0) args.pollSeconds = parsed;
    }
  }

  if (process.env.npm_config_manifest) args.manifest = process.env.npm_config_manifest;
  if (process.env.npm_config_count) {
    const parsed = parseInt(process.env.npm_config_count, 10);
    if (parsed > 0) args.count = parsed;
  }
  if (process.env.npm_config_confirm) args.confirm = process.env.npm_config_confirm;
  if (envFlag("npm_config_allow_prod")) args.allowProd = true;
  if (envFlag("npm_config_allow_youtube_download")) args.allowYoutubeDownload = true;
  if (envFlag("npm_config_allow_generated_metadata")) args.allowGeneratedMetadata = true;
  if (envFlag("npm_config_dry_run")) args.dryRun = true;
  if (envFlag("npm_config_run_ai")) args.runAi = true;
  if (process.env.npm_config_wait_timeout_minutes) {
    const parsed = parseInt(process.env.npm_config_wait_timeout_minutes, 10);
    if (parsed > 0) args.waitTimeoutMinutes = parsed;
  }
  if (process.env.npm_config_poll_seconds) {
    const parsed = parseInt(process.env.npm_config_poll_seconds, 10);
    if (parsed > 0) args.pollSeconds = parsed;
  }

  return args;
};

const assertConfirmed = (args) => {
  if (args.dryRun) return;
  if (args.confirm !== "RESET_DEMO") {
    throw new Error(
      "Refusing to reset data. Re-run with --confirm=RESET_DEMO once you are ready.",
    );
  }
};

const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || ""));

const isYoutubeUrl = (value) => {
  if (!isHttpUrl(value)) return false;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "youtu.be" || host.endsWith(".youtube.com") || host === "youtube.com";
  } catch {
    return false;
  }
};

const resolveManifestPath = (manifestArg) => {
  if (path.isAbsolute(manifestArg)) return manifestArg;

  const cwdPath = path.resolve(process.cwd(), manifestArg);
  if (fs.existsSync(cwdPath)) return cwdPath;

  return path.resolve(__dirname, "..", manifestArg);
};

const loadManifest = async (manifestArg) => {
  const manifestPath = resolveManifestPath(manifestArg);
  if (!fs.existsSync(manifestPath)) {
    const examplePath = path.join("scripts", "demo-vietnamese-sources.example.json");
    throw new Error(
      `Manifest not found: ${manifestPath}. Copy ${examplePath} to ${manifestArg} and fill in your five authorized sources.`,
    );
  }

  const raw = await fsp.readFile(manifestPath, "utf8");
  const parsed = JSON.parse(raw);
  const sources = Array.isArray(parsed) ? parsed : parsed.sources;
  if (!Array.isArray(sources)) {
    throw new Error("Manifest must contain a sources array.");
  }
  if (sources.length !== REQUIRED_ANCHOR_COUNT) {
    throw new Error(
      `Manifest must contain exactly ${REQUIRED_ANCHOR_COUNT} sources. Found ${sources.length}.`,
    );
  }

  const normalizedSources = sources.map((source, index) => {
    const sourceValue = source.source || source.file || source.path || source.url;
    if (!sourceValue || typeof sourceValue !== "string") {
      throw new Error(`Source ${index + 1} is missing source/file/path/url.`);
    }
    return {
      ...source,
      source: sourceValue,
      title: source.title || `Vietnamese demo anchor ${index + 1}`,
      description: source.description || null,
      category: source.category || "Onboarding",
      thumbnailUrl: source.thumbnailUrl || null,
      authorized: source.authorized === true,
    };
  });

  return {
    manifestPath,
    manifestDir: path.dirname(manifestPath),
    sources: normalizedSources,
  };
};

const getDatabaseHost = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return null;
  }
};

const assertSafeDatabase = (args) => {
  const databaseUrl = process.env.DATABASE_URL || "";
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }
  if (args.allowProd) return;

  const envText = [
    process.env.NODE_ENV,
    process.env.APP_ENV,
    process.env.DEPLOY_ENV,
    process.env.ENVIRONMENT,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (envText.includes("prod")) {
    throw new Error("Production-like environment detected. Use --allow-prod only if you intend this.");
  }

  const host = getDatabaseHost();
  const localHosts = new Set([
    "localhost",
    "127.0.0.1",
    "::1",
    "host.docker.internal",
    "postgres",
    "db",
    "smart-vod-platform-postgres-1",
  ]);

  if (host && !localHosts.has(host.toLowerCase())) {
    throw new Error(
      `DATABASE_URL points to non-local host "${host}". Use --allow-prod only if you intend this.`,
    );
  }
};

const commandExists = async (command, args = ["--version"]) => {
  try {
    await execFileAsync(command, args, { timeout: 10000, maxBuffer: 1024 * 1024 });
    return true;
  } catch {
    return false;
  }
};

const resolveFfprobeCommand = async () => {
  if (ffprobeCommand) return ffprobeCommand;

  const candidates = [process.env.FFPROBE_PATH, "ffprobe"].filter(Boolean);

  try {
    const installer = require(path.resolve(
      __dirname,
      "../../video-worker/node_modules/@ffprobe-installer/ffprobe",
    ));
    if (installer?.path) candidates.push(installer.path);
  } catch {}

  for (const candidate of candidates) {
    if (await commandExists(candidate, ["-version"])) {
      ffprobeCommand = candidate;
      return ffprobeCommand;
    }
  }

  return null;
};

const resolveFfmpegCommand = async () => {
  if (ffmpegCommand) return ffmpegCommand;

  const candidates = [process.env.FFMPEG_PATH, "ffmpeg"].filter(Boolean);

  try {
    const installer = require(path.resolve(
      __dirname,
      "../../video-worker/node_modules/@ffmpeg-installer/ffmpeg",
    ));
    if (installer?.path) candidates.push(installer.path);
  } catch {}

  for (const candidate of candidates) {
    if (await commandExists(candidate, ["-version"])) {
      ffmpegCommand = candidate;
      return ffmpegCommand;
    }
  }

  return null;
};

const preflight = async ({ args, sources }) => {
  assertConfirmed(args);
  assertSafeDatabase(args);

  const userCount = await withTimeout(prisma.user.count(), 10000, "PostgreSQL user count");
  const adminCount = await withTimeout(
    prisma.user.count({ where: { role: "ADMIN" } }),
    10000,
    "PostgreSQL admin count",
  );
  if (!userCount) throw new Error("No users found. This reset keeps users, so seed users first.");
  if (!adminCount) throw new Error("No ADMIN user found. At least one admin is required.");

  const bucketName = await withTimeout(
    ensureBucket({ createIfMissing: !args.dryRun }),
    10000,
    "MinIO bucket check",
  );

  const resolvedFfprobe = await resolveFfprobeCommand();
  if (!resolvedFfprobe) {
    throw new Error(
      "ffprobe is required to validate 15-20 minute sources. Install ffmpeg/ffprobe or rebuild the api-gateway image.",
    );
  }
  log(`ffprobe ready: ${resolvedFfprobe}`);

  const resolvedFfmpeg = await resolveFfmpegCommand();
  if (resolvedFfmpeg) {
    log(`ffmpeg ready: ${resolvedFfmpeg}`);
  } else {
    warn("ffmpeg was not found for yt-dlp merge fallback. Combined MP4 formats will still work.");
  }

  const youtubeSources = sources.filter((source) => isYoutubeUrl(source.source));
  if (youtubeSources.length) {
    const ytDlpOk = await commandExists("yt-dlp", ["--version"]);
    if (!ytDlpOk) {
      throw new Error("yt-dlp is required for YouTube sources.");
    }
    const unauthorized = youtubeSources.filter(
      (source) => !source.authorized && !args.allowYoutubeDownload,
    );
    if (unauthorized.length) {
      throw new Error(
        "YouTube source found without authorization. Set authorized=true for each allowed YouTube source or pass --allow-youtube-download.",
      );
    }
  }

  if (!process.env.YOUTUBE_API_KEY && !args.allowGeneratedMetadata) {
    throw new Error(
      "YOUTUBE_API_KEY is required for Vietnamese titles/thumbnails. Use --allow-generated-metadata only for fallback data.",
    );
  }

  const heartbeat = await withTimeout(
    redisClient.get(WORKER_HEARTBEAT_KEY),
    5000,
    "Redis worker heartbeat check",
  );
  if (!heartbeat) {
    throw new Error(
      "video-worker heartbeat is missing. Start video-worker before running this seeder.",
    );
  }

  const queueCounts = await withTimeout(
    videoQueue.getJobCounts(),
    5000,
    "BullMQ job count check",
  );
  if ((queueCounts.active || 0) > 0) {
    throw new Error(
      `video-jobs has ${queueCounts.active} active job(s). Wait for them to finish before resetting demo data.`,
    );
  }

  log(`Preflight OK. Users: ${userCount}, admins: ${adminCount}, bucket: ${bucketName}.`);
  return { bucketName, userCount };
};

const ensureBucket = async ({ createIfMissing = true } = {}) => {
  const bucketName = process.env.MINIO_BUCKET_NAME;
  if (!bucketName) throw new Error("MINIO_BUCKET_NAME is not set.");
  if (!process.env.MINIO_PUBLIC_URL) throw new Error("MINIO_PUBLIC_URL is not set.");

  const exists = await minioClient.bucketExists(bucketName);
  if (!exists && createIfMissing) {
    await minioClient.makeBucket(bucketName, "us-east-1");
    log(`Created MinIO bucket ${bucketName}.`);
  } else if (!exists) {
    log(`MinIO bucket ${bucketName} does not exist yet; dry run would create it.`);
  }
  return bucketName;
};

const publicMinioBaseUrl = () => process.env.MINIO_PUBLIC_URL.replace(/\/+$/, "");

const objectNameFromUrl = (value, bucketName) => {
  if (!value || !bucketName) return null;
  try {
    const parsed = new URL(value);
    const parts = parsed.pathname.replace(/^\/+/, "").split("/");
    const bucketIndex = parts.findIndex((part) => part === bucketName);
    if (bucketIndex === -1) return null;
    const objectName = parts.slice(bucketIndex + 1).join("/");
    return objectName ? decodeURIComponent(objectName) : null;
  } catch {
    const marker = `/${bucketName}/`;
    const index = value.indexOf(marker);
    if (index === -1) return null;
    return value.slice(index + marker.length);
  }
};

const dirnamePrefix = (objectName) => {
  if (!objectName || !objectName.includes("/")) return null;
  return objectName.slice(0, objectName.lastIndexOf("/") + 1);
};

const listObjectsByPrefix = async (bucketName, prefix) => {
  const objects = [];
  await new Promise((resolve, reject) => {
    const stream = minioClient.listObjectsV2(bucketName, prefix, true);
    stream.on("data", (item) => {
      if (item.name) objects.push(item.name);
    });
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return objects;
};

const collectStorageObjects = async (bucketName) => {
  const videos = await prisma.video.findMany({ include: { metadata: true } });
  const objects = new Set();
  const prefixes = new Set(["demo/raw/"]);

  for (const video of videos) {
    prefixes.add(`hls/${video.id}/`);

    const hlsObject = objectNameFromUrl(video.metadata?.hlsMasterUrl, bucketName);
    const hlsPrefix = dirnamePrefix(hlsObject);
    if (hlsPrefix) prefixes.add(hlsPrefix);

    const thumbnailObject = objectNameFromUrl(video.thumbnailUrl, bucketName);
    if (thumbnailObject) objects.add(thumbnailObject);

    const subtitleObject = objectNameFromUrl(video.metadata?.subtitleUrl, bucketName);
    if (subtitleObject) objects.add(subtitleObject);
  }

  return {
    videoCount: videos.length,
    explicitObjects: [...objects],
    prefixes: [...prefixes],
  };
};

const removeStorageObjects = async (bucketName, storagePlan) => {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    warn(`MinIO bucket ${bucketName} does not exist. Storage cleanup skipped.`);
    return 0;
  }

  const objects = new Set(storagePlan.explicitObjects);
  for (const prefix of storagePlan.prefixes) {
    const listed = await listObjectsByPrefix(bucketName, prefix);
    for (const objectName of listed) objects.add(objectName);
  }

  const objectList = [...objects].filter(Boolean);
  if (!objectList.length) {
    log("No MinIO objects matched deleted video content.");
    return 0;
  }

  const chunkSize = 1000;
  for (let index = 0; index < objectList.length; index += chunkSize) {
    const chunk = objectList.slice(index, index + chunkSize);
    await minioClient.removeObjects(bucketName, chunk);
  }

  log(`Removed ${objectList.length} MinIO object(s).`);
  return objectList.length;
};

const clearQueue = async () => {
  const before = await videoQueue.getJobCounts();
  if ((before.active || 0) > 0) {
    throw new Error("Cannot clear queue while jobs are active.");
  }

  await videoQueue.drain(true);
  for (const state of ["completed", "failed", "delayed", "wait", "paused", "prioritized"]) {
    try {
      await videoQueue.clean(0, 10000, state);
    } catch (error) {
      warn(`Queue clean skipped for ${state}: ${error.message}`);
    }
  }

  const after = await videoQueue.getJobCounts();
  log(
    `Queue cleaned. waiting=${after.waiting || 0}, delayed=${after.delayed || 0}, failed=${after.failed || 0}.`,
  );
};

const clearSearchIndex = async () => {
  if (!isElasticsearchEnabled()) {
    log("Elasticsearch disabled; search index cleanup skipped.");
    return;
  }

  try {
    const client = getElasticsearchClient();
    if (!client) return;
    const exists = await client.indices.exists({ index: VIDEO_INDEX });
    if (exists) {
      await client.indices.delete({ index: VIDEO_INDEX });
      log(`Deleted Elasticsearch index ${VIDEO_INDEX}.`);
    }
  } catch (error) {
    warn(`Elasticsearch index cleanup skipped: ${error.message}`);
  }
};

const resetDatabaseContent = async (expectedUserCount) => {
  const deleted = {};

  const deleteAndTrack = async (label, operation) => {
    const result = await operation();
    deleted[label] = result.count;
    log(`Deleted ${label}: ${result.count}`);
  };

  await deleteAndTrack("sessions", () => prisma.session.deleteMany({}));
  await deleteAndTrack("notifications", () => prisma.notification.deleteMany({}));
  await deleteAndTrack("participants", () => prisma.participant.deleteMany({}));
  await deleteAndTrack("meeting_recordings", () => prisma.meetingRecording.deleteMany({}));
  await deleteAndTrack("rooms", () => prisma.room.deleteMany({}));
  await deleteAndTrack("playlist_items", () => prisma.playlistItem.deleteMany({}));
  await deleteAndTrack("watch_history", () => prisma.watchHistory.deleteMany({}));
  await deleteAndTrack("comment_likes", () => prisma.commentLike.deleteMany({}));
  await deleteAndTrack("comments", () => prisma.comment.deleteMany({}));
  await deleteAndTrack("likes", () => prisma.like.deleteMany({}));
  await deleteAndTrack("video_metadata", () => prisma.videoMetadata.deleteMany({}));
  await deleteAndTrack("videos", () => prisma.video.deleteMany({}));
  await deleteAndTrack("playlists", () => prisma.playlist.deleteMany({}));

  const userCountAfter = await prisma.user.count();
  if (userCountAfter !== expectedUserCount) {
    throw new Error(
      `User count changed during reset. Expected ${expectedUserCount}, got ${userCountAfter}.`,
    );
  }

  log(`Database reset complete. Preserved users: ${userCountAfter}.`);
  return deleted;
};

const fileExtensionFor = (filePath) => {
  const extension = path.extname(filePath || "").toLowerCase();
  return extension || ".mp4";
};

const contentTypeFor = (filePath) => {
  const extension = fileExtensionFor(filePath);
  if (extension === ".webm") return "video/webm";
  if (extension === ".mov") return "video/quicktime";
  if (extension === ".mkv") return "video/x-matroska";
  return "video/mp4";
};

const downloadHttpFile = async (url, targetPath, redirectsLeft = 5) => {
  const parsed = new URL(url);
  const client = parsed.protocol === "https:" ? https : http;

  await new Promise((resolve, reject) => {
    const request = client.get(
      parsed,
      {
        headers: {
          "User-Agent": "smart-vod-demo-seeder/1.0",
        },
      },
      async (response) => {
        const status = response.statusCode || 0;
        if (status >= 300 && status < 400 && response.headers.location) {
          response.resume();
          if (redirectsLeft <= 0) {
            reject(new Error(`Too many redirects for ${url}`));
            return;
          }
          try {
            const redirected = new URL(response.headers.location, parsed).toString();
            await downloadHttpFile(redirected, targetPath, redirectsLeft - 1);
            resolve();
          } catch (error) {
            reject(error);
          }
          return;
        }

        if (status < 200 || status >= 300) {
          response.resume();
          reject(new Error(`Download failed with HTTP ${status}: ${url}`));
          return;
        }

        try {
          await pipeline(response, fs.createWriteStream(targetPath));
          resolve();
        } catch (error) {
          reject(error);
        }
      },
    );

    request.on("error", reject);
    request.setTimeout(30000, () => {
      request.destroy(new Error(`Download timed out: ${url}`));
    });
  });
};

const downloadYoutubeSource = async (source, tempDir, index) => {
  const outputPattern = path.join(tempDir, `youtube-${index}-%(id)s.%(ext)s`);
  const ffmpeg = await resolveFfmpegCommand();
  const args = [
    "-f",
    "b[ext=mp4][vcodec!=none][acodec!=none][height<=720]/18/bv*[vcodec^=avc1][height<=720][ext=mp4]+ba[ext=m4a]/bv*[vcodec!=none][height<=720]+ba[acodec!=none]",
    "--merge-output-format",
    "mp4",
    "--windows-filenames",
    "--no-playlist",
    "-o",
    outputPattern,
  ];
  if (ffmpeg) args.push("--ffmpeg-location", ffmpeg);
  args.push(source.source);

  log(`Downloading authorized YouTube source ${index + 1} with yt-dlp...`);
  await execFileAsync("yt-dlp", args, {
    timeout: 1000 * 60 * 60,
    maxBuffer: 1024 * 1024 * 20,
  });

  const files = await fsp.readdir(tempDir);
  const downloaded = files
    .filter((file) => file.startsWith(`youtube-${index}-`) && !file.endsWith(".part"))
    .map((file) => path.join(tempDir, file))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];

  if (!downloaded) throw new Error(`yt-dlp did not produce a file for source ${index + 1}.`);
  return downloaded;
};

const resolveSourceFile = async ({ source, manifestDir, tempDir, index }) => {
  if (isYoutubeUrl(source.source)) {
    return {
      filePath: await downloadYoutubeSource(source, tempDir, index),
      isTemp: true,
    };
  }

  if (isHttpUrl(source.source)) {
    const urlPath = new URL(source.source).pathname;
    const extension = path.extname(urlPath) || ".mp4";
    const targetPath = path.join(tempDir, `http-${index}${extension}`);
    log(`Downloading HTTP source ${index + 1}...`);
    await downloadHttpFile(source.source, targetPath);
    return { filePath: targetPath, isTemp: true };
  }

  const localPath = source.source.startsWith("file://")
    ? fileURLToPath(source.source)
    : source.source;
  const filePath =
    path.isAbsolute(localPath)
      ? localPath
      : path.resolve(manifestDir, localPath);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Local source file not found: ${filePath}`);
  }

  return { filePath, isTemp: false };
};

const getMediaDurationSeconds = async (filePath) => {
  const ffprobe = await resolveFfprobeCommand();
  if (!ffprobe) throw new Error("ffprobe is not available.");

  const { stdout } = await execFileAsync(
    ffprobe,
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ],
    { timeout: 30000, maxBuffer: 1024 * 1024 },
  );

  const duration = Math.round(parseFloat(stdout.trim()));
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not read duration with ffprobe: ${filePath}`);
  }
  return duration;
};

const getMediaStreamInfo = async (filePath) => {
  const ffprobe = await resolveFfprobeCommand();
  if (!ffprobe) throw new Error("ffprobe is not available.");

  const { stdout } = await execFileAsync(
    ffprobe,
    [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_type",
      "-of",
      "json",
      filePath,
    ],
    { timeout: 30000, maxBuffer: 1024 * 1024 },
  );

  const parsed = JSON.parse(stdout || "{}");
  const streams = Array.isArray(parsed.streams) ? parsed.streams : [];
  return {
    hasVideo: streams.some((stream) => stream.codec_type === "video"),
    hasAudio: streams.some((stream) => stream.codec_type === "audio"),
  };
};

const assertAnchorDuration = (duration, sourceLabel) => {
  if (duration < ABSOLUTE_MIN_DURATION_SECONDS || duration > ABSOLUTE_MAX_DURATION_SECONDS) {
    throw new Error(
      `${sourceLabel} duration is too far from the demo range. Expected roughly 8-30 minutes, found ${formatDuration(duration)}.`,
    );
  }
  if (duration < TARGET_MIN_DURATION_SECONDS || duration > TARGET_MAX_DURATION_SECONDS) {
    warn(
      `${sourceLabel} is ${formatDuration(duration)}, outside the preferred 15-20 minute range. Continuing for demo seed.`,
    );
  }
};

const assertAnchorHasVideo = (streamInfo, sourceLabel) => {
  if (!streamInfo.hasVideo) {
    throw new Error(
      `${sourceLabel} downloaded without a video stream. Check the URL or yt-dlp format availability.`,
    );
  }
};

const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${String(remaining).padStart(2, "0")}s`;
};

const stageAnchorSources = async ({ sources, manifestDir, tempDir }) => {
  const staged = [];

  for (const [index, source] of sources.entries()) {
    const resolved = await resolveSourceFile({ source, manifestDir, tempDir, index });
    const duration = await getMediaDurationSeconds(resolved.filePath);
    const streamInfo = await getMediaStreamInfo(resolved.filePath);
    assertAnchorHasVideo(streamInfo, `Source ${index + 1}`);
    assertAnchorDuration(duration, `Source ${index + 1}`);
    staged.push({
      ...source,
      filePath: resolved.filePath,
      isTemp: resolved.isTemp,
      duration,
    });
    log(
      `Validated source ${index + 1}: ${formatDuration(duration)}, video=${streamInfo.hasVideo ? "yes" : "no"}, audio=${streamInfo.hasAudio ? "yes" : "no"}.`,
    );
  }

  return staged;
};

const uploadAnchorVideo = async ({ source, filePath, duration, bucketName, creatorId, args }) => {
  const video = await prisma.video.create({
    data: {
      creatorId,
      title: source.title,
      description: source.description,
      thumbnailUrl: source.thumbnailUrl,
      category: source.category,
      visibility: "PUBLIC",
      status: "PENDING",
      viewCount: 0,
    },
  });

  const extension = fileExtensionFor(filePath);
  const objectName = `demo/raw/${video.id}${extension}`;
  const rawUrl = `${publicMinioBaseUrl()}/${bucketName}/${objectName}`;

  try {
    await minioClient.fPutObject(bucketName, objectName, filePath, {
      "Content-Type": contentTypeFor(filePath),
    });

    await videoQueue.add(
      "process-hls",
      {
        videoId: video.id,
        originalFilename: objectName,
        fileUrl: rawUrl,
        shouldGenerateThumbnail: !source.thumbnailUrl,
        skipAi: !args.runAi,
        seedDurationSeconds: duration,
      },
      {
        jobId: video.id,
        attempts: 1,
        removeOnComplete: { age: 24 * 60 * 60, count: 100 },
        removeOnFail: { age: 7 * 24 * 60 * 60, count: 100 },
      },
    );

    log(`Queued anchor "${video.title}" (${video.id}) from ${formatDuration(duration)} source.`);
    return video;
  } catch (error) {
    await prisma.video.delete({ where: { id: video.id } }).catch(() => {});
    await minioClient.removeObject(bucketName, objectName).catch(() => {});
    throw error;
  }
};

const ingestAnchorVideos = async ({ stagedSources, bucketName, users, args }) => {
  const admin = users.find((user) => user.role === "ADMIN") || users[0];
  const anchors = [];

  for (const source of stagedSources) {
    const anchor = await uploadAnchorVideo({
      source,
      filePath: source.filePath,
      duration: source.duration,
      bucketName,
      creatorId: admin.id,
      args,
    });
    anchors.push(anchor);
  }

  return anchors;
};

const waitForAnchorProcessing = async ({ anchors, timeoutMinutes, pollSeconds }) => {
  const anchorIds = anchors.map((anchor) => anchor.id);
  const deadline = Date.now() + timeoutMinutes * 60 * 1000;
  let lastProgressMessage = "";

  while (Date.now() < deadline) {
    const rows = await prisma.video.findMany({
      where: { id: { in: anchorIds } },
      include: { metadata: true },
      orderBy: { createdAt: "asc" },
    });

    const failed = rows.filter((video) => video.status === "FAILED");
    if (failed.length) {
      throw new Error(`Anchor processing failed: ${failed.map((video) => video.title).join(", ")}`);
    }

    const processed = rows.filter((video) => video.metadata?.hlsMasterUrl);
    for (const video of processed) {
      if (video.status !== "READY") {
        await prisma.video.update({
          where: { id: video.id },
          data: { status: "READY" },
        });
      }
    }

    if (processed.length === anchorIds.length) {
      log("All anchor videos have HLS metadata. Marked anchors READY.");
      return prisma.video.findMany({
        where: { id: { in: anchorIds } },
        include: { metadata: true },
        orderBy: { createdAt: "asc" },
      });
    }

    const message = `${processed.length}/${anchorIds.length} anchors processed. Waiting ${pollSeconds}s...`;
    if (message !== lastProgressMessage) {
      log(message);
      lastProgressMessage = message;
    }
    await sleep(pollSeconds * 1000);
  }

  throw new Error(`Timed out after ${timeoutMinutes} minutes waiting for anchor HLS processing.`);
};

const decodeHtmlEntities = (value) =>
  String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const normalizeText = (value) =>
  decodeHtmlEntities(value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stripVietnameseMarks = (value) =>
  normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const detectCategory = (title, description, fallback = "Onboarding") => {
  const text = stripVietnameseMarks(`${title} ${description}`);
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) return rule.category;
  }
  return fallback;
};

const normalizeCategory = (category) => {
  const normalized = String(category || "").trim().toLowerCase();
  const match = CATEGORY_RULES.find((rule) => rule.category.toLowerCase() === normalized);
  return match?.category || "Onboarding";
};

const getBestThumbnail = (thumbnails) => {
  if (!thumbnails) return null;
  return (
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    null
  );
};

const parseIsoDuration = (isoDuration) => {
  if (!isoDuration) return 0;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    parseInt(match[1] || "0", 10) * 3600 +
    parseInt(match[2] || "0", 10) * 60 +
    parseInt(match[3] || "0", 10)
  );
};

const cleanDescription = (description) =>
  normalizeText(description)
    .replace(/https?:\/\/[^\s]+/g, "")
    .slice(0, 1000)
    .trim();

const youtubeSearch = async (apiKey, query, maxResults = 25) => {
  const url = new URL(`${YOUTUBE_API_BASE}/search`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("order", "relevance");
  url.searchParams.set("videoDuration", "medium");
  url.searchParams.set("relevanceLanguage", "vi");
  url.searchParams.set("regionCode", "VN");
  url.searchParams.set("safeSearch", "strict");

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube Search API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.items || [];
};

const youtubeVideoDetails = async (apiKey, videoIds) => {
  if (!videoIds.length) return [];

  const url = new URL(`${YOUTUBE_API_BASE}/videos`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("part", "contentDetails,statistics");
  url.searchParams.set("id", videoIds.join(","));

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube Videos API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.items || [];
};

const crawlMetadataForQuery = async (apiKey, query, targetCategory = null) => {
  const searchItems = await youtubeSearch(apiKey, query, 25);
  const ids = searchItems.map((item) => item.id?.videoId).filter(Boolean);
  const details = await youtubeVideoDetails(apiKey, ids);
  const detailsById = new Map(details.map((item) => [item.id, item]));

  return searchItems
    .filter((item) => item.id?.videoId && item.snippet)
    .map((item) => {
      const detail = detailsById.get(item.id.videoId);
      const duration = parseIsoDuration(detail?.contentDetails?.duration);
      const title = normalizeText(item.snippet.title || "Untitled");
      const description = cleanDescription(item.snippet.description || "");
      return {
        youtubeId: item.id.videoId,
        title,
        description,
        thumbnailUrl: getBestThumbnail(item.snippet.thumbnails),
        duration,
        viewCount: parseInt(detail?.statistics?.viewCount || "0", 10),
        category: targetCategory || detectCategory(title, description),
      };
    })
    .filter(
      (item) =>
        item.title &&
        item.thumbnailUrl &&
        item.duration >= ABSOLUTE_MIN_DURATION_SECONDS &&
        item.duration <= ABSOLUTE_MAX_DURATION_SECONDS,
    );
};

const generateFallbackMetadata = (count, anchors, preferredCategory = null) => {
  const templates = [
    "Dao tao noi bo phan",
    "Huong dan thuc hanh phan",
    "Kien thuc cong viec phan",
    "Chia se kinh nghiem phan",
    "Ky nang lam viec phan",
  ];

  return Array.from({ length: count }, (_, index) => {
    const anchor = anchors[index % anchors.length];
    const category = preferredCategory || anchor.category || "Onboarding";
    return {
      youtubeId: `generated-${index + 1}`,
      title: `${category} - ${templates[index % templates.length]} ${index + 1}`,
      description: `Du lieu metadata du phong cho category ${category}.`,
      thumbnailUrl: anchor.thumbnailUrl,
      duration: anchor.metadata?.duration || 900,
      viewCount: 100 + index * 27,
      category,
    };
  });
};

const fetchVietnameseYouTubeMetadata = async (count, category = null) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const seen = new Set();
  const metadata = [];
  const targetCategory = category ? normalizeCategory(category) : null;
  const queries = targetCategory
    ? CATEGORY_SEARCH_QUERIES[targetCategory] || DEFAULT_SEARCH_QUERIES
    : DEFAULT_SEARCH_QUERIES;

  for (const query of queries) {
    log(
      `Fetching Vietnamese YouTube metadata${targetCategory ? ` for ${targetCategory}` : ""}: "${query}"...`,
    );
    const items = await crawlMetadataForQuery(apiKey, query, targetCategory);
    for (const item of items) {
      const dedupeKey = item.youtubeId || stripVietnameseMarks(item.title);
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      metadata.push(item);
      if (metadata.length >= count) break;
    }
    if (metadata.length >= count) break;
    await sleep(250);
  }

  return metadata.slice(0, count);
};

const categoryCountsForAnchors = (count, anchorsOrSources) => {
  const categories = anchorsOrSources.map((item) => normalizeCategory(item.category));
  const counts = new Map();
  for (let index = 0; index < count; index += 1) {
    const category = categories[index % categories.length] || "Onboarding";
    counts.set(category, (counts.get(category) || 0) + 1);
  }
  return counts;
};

const selectMetadataForAnchorDistribution = (count, metadata, anchorsOrSources) => {
  const pool = [...metadata];
  const selected = [];

  for (let index = 0; index < count; index += 1) {
    const category = normalizeCategory(anchorsOrSources[index % anchorsOrSources.length]?.category);
    let itemIndex = pool.findIndex((item) => normalizeCategory(item.category) === category);
    if (itemIndex === -1) itemIndex = 0;
    const item = pool.splice(itemIndex, 1)[0];
    if (!item) break;
    selected.push({
      ...item,
      category,
    });
  }

  return selected;
};

const fetchVietnameseMetadataForCategories = async (count, anchorsOrSources) => {
  const items = [];
  const categories = categoryCountsForAnchors(count, anchorsOrSources);

  for (const [category, categoryCount] of categories.entries()) {
    const categoryItems = await fetchVietnameseYouTubeMetadata(categoryCount, category);
    items.push(...categoryItems.slice(0, categoryCount));
    log(`Preloaded ${categoryItems.length}/${categoryCount} Vietnamese metadata item(s) for ${category}.`);
  }

  return items;
};

const getVietnameseMetadata = async ({
  count,
  anchors,
  allowGeneratedMetadata,
  preloadedItems = null,
}) => {
  const metadata = preloadedItems
    ? [...preloadedItems]
    : await fetchVietnameseMetadataForCategories(count, anchors);
  const requiredByCategory = categoryCountsForAnchors(count, anchors);

  if (metadata.length < count) {
    if (!allowGeneratedMetadata) {
      throw new Error(
        `Only found ${metadata.length}/${count} Vietnamese YouTube metadata items. Add more queries or use --allow-generated-metadata.`,
      );
    }
    if (!anchors.length) {
      throw new Error("Generated metadata fallback needs processed anchor videos.");
    }
    warn(`Only found ${metadata.length}/${count} metadata items. Filling the rest with generated data.`);
    metadata.push(...generateFallbackMetadata(count - metadata.length, anchors));
  }

  for (const [category, requiredCount] of requiredByCategory.entries()) {
    const currentCount = metadata.filter((item) => normalizeCategory(item.category) === category).length;
    if (currentCount >= requiredCount) continue;

    if (!allowGeneratedMetadata) {
      throw new Error(
        `Only found ${currentCount}/${requiredCount} Vietnamese YouTube metadata item(s) for ${category}. Add more category queries or use --allow-generated-metadata.`,
      );
    }

      const categoryAnchors = anchors.filter((anchor) => normalizeCategory(anchor.category) === category);
      const fallbackAnchors = categoryAnchors.length ? categoryAnchors : anchors;
      const missing = requiredCount - currentCount;
      warn(`Only found ${currentCount}/${requiredCount} metadata item(s) for ${category}. Filling ${missing} fallback item(s).`);
      metadata.push(...generateFallbackMetadata(missing, fallbackAnchors, category));
  }

  return selectMetadataForAnchorDistribution(count, metadata, anchors);
};

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const uniqueUsersForCreators = (users) => {
  const admin = users.find((user) => user.role === "ADMIN");
  const ordered = [admin, ...users].filter(Boolean);
  const seen = new Set();
  return ordered.filter((user) => {
    if (seen.has(user.id)) return false;
    seen.add(user.id);
    return true;
  });
};

const buildDemoSummary = (metadata, anchor) =>
  [
    "Demo seed generated for Smart VOD.",
    `Displayed metadata comes from Vietnamese learning content: ${metadata.title}.`,
    `Playback reuses authorized anchor content: ${anchor.title}.`,
  ].join(" ");

const takeMetadataForCategory = (metadataItems, category) => {
  const normalizedCategory = normalizeCategory(category);
  let index = metadataItems.findIndex((item) => normalizeCategory(item.category) === normalizedCategory);
  if (index === -1) index = 0;
  return metadataItems.splice(index, 1)[0] || null;
};

const createDemoCloneVideos = async ({ metadataItems, anchors, users }) => {
  const creators = uniqueUsersForCreators(users);
  const created = [];
  const targetCount = metadataItems.length;

  for (let index = 0; index < targetCount; index += 1) {
    const anchor = anchors[index % anchors.length];
    const item = takeMetadataForCategory(metadataItems, anchor.category);
    if (!item) break;
    const creator = creators[index % creators.length];
    const viewCount = Math.max(40, Math.min(9000, Math.floor((item.viewCount || 0) / 1000) + index * 9));

    const video = await prisma.video.create({
      data: {
        creatorId: creator.id,
        title: item.title,
        description: item.description || null,
        thumbnailUrl: item.thumbnailUrl || anchor.thumbnailUrl,
        category: normalizeCategory(anchor.category),
        visibility: "PUBLIC",
        status: "READY",
        viewCount,
        createdAt: daysAgo((index % 28) + 1),
        metadata: {
          create: {
            hlsMasterUrl: anchor.metadata.hlsMasterUrl,
            subtitleUrl: anchor.metadata.subtitleUrl,
            aiSummary: anchor.metadata.aiSummary || buildDemoSummary(item, anchor),
            duration: anchor.metadata.duration || item.duration || TARGET_MIN_DURATION_SECONDS,
          },
        },
      },
      include: { metadata: true },
    });

    created.push(video);
  }

  log(`Created ${created.length} demo clone video(s).`);
  return created;
};

const seedPlaylists = async ({ users, videos }) => {
  const owner = users.find((user) => user.role === "ADMIN") || users[0];
  let itemCount = 0;

  for (const spec of PLAYLIST_SPECS) {
    const playlist = await prisma.playlist.create({
      data: {
        userId: owner.id,
        name: spec.name,
        isPrivate: false,
      },
    });

    const matching = videos.filter((video) => spec.categories.includes(video.category || ""));
    const selected = (matching.length ? matching : videos).slice(0, spec.limit);

    for (const [index, video] of selected.entries()) {
      await prisma.playlistItem.create({
        data: {
          playlistId: playlist.id,
          videoId: video.id,
          order: index + 1,
        },
      });
      itemCount += 1;
    }
  }

  log(`Created ${PLAYLIST_SPECS.length} playlist(s) with ${itemCount} item(s).`);
};

const rotateUsers = (users, start, limit) => {
  if (!users.length) return [];
  const rotated = [];
  for (let offset = 0; offset < Math.min(limit, users.length); offset += 1) {
    rotated.push(users[(start + offset) % users.length]);
  }
  return rotated;
};

const seedSocialData = async ({ users, videos }) => {
  let likeCount = 0;
  let historyCount = 0;
  let commentCount = 0;

  for (const [index, video] of videos.entries()) {
    const pool = users.length > 1 ? users.filter((user) => user.id !== video.creatorId) : users;
    const selectedUsers = rotateUsers(pool, index % Math.max(pool.length, 1), 5);

    if (selectedUsers.length) {
      const likeResult = await prisma.like.createMany({
        data: selectedUsers.map((user) => ({
          userId: user.id,
          videoId: video.id,
          createdAt: daysAgo((index + 1) % 20),
        })),
        skipDuplicates: true,
      });
      likeCount += likeResult.count;

      const duration = video.metadata?.duration || TARGET_MIN_DURATION_SECONDS;
      const historyResult = await prisma.watchHistory.createMany({
        data: selectedUsers.slice(0, 4).map((user, userIndex) => ({
          userId: user.id,
          videoId: video.id,
          watchedAt: daysAgo((index + userIndex + 2) % 30),
          lastSecond: Math.min(duration - 10, Math.floor(duration * (0.2 + userIndex * 0.15))),
        })),
      });
      historyCount += historyResult.count;
    }

    const commentUsers = selectedUsers.slice(0, 2);
    for (const [commentIndex, user] of commentUsers.entries()) {
      await prisma.comment.create({
        data: {
          userId: user.id,
          videoId: video.id,
          content: COMMENT_SAMPLES[(index + commentIndex) % COMMENT_SAMPLES.length],
          createdAt: daysAgo((index + commentIndex + 1) % 14),
        },
      });
      commentCount += 1;
    }

    const targetViewCount = Math.max(video.viewCount || 0, 90 + index * 23);
    await prisma.video.update({
      where: { id: video.id },
      data: { viewCount: targetViewCount },
    });
  }

  log(
    `Seeded social data: ${likeCount} like(s), ${historyCount} watch history row(s), ${commentCount} comment(s).`,
  );
};

const reindexSearch = async () => {
  if (!isElasticsearchEnabled()) {
    log("Elasticsearch disabled; reindex skipped.");
    return;
  }

  try {
    const total = await searchService.reindexAllReadyVideos();
    log(`Reindexed ${total} READY video(s) into Elasticsearch.`);
  } catch (error) {
    warn(`Elasticsearch reindex failed: ${error.message}`);
  }
};

const main = async () => {
  const args = parseArgs(process.argv);
  const manifest = await loadManifest(args.manifest);
  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "smartvod-vn-demo-"));

  try {
    log("Smart VOD Vietnamese demo reset starting.");
    log(`Manifest: ${manifest.manifestPath}`);
    log(`Demo clone count: ${args.count}`);
    log(`Dry run: ${args.dryRun ? "yes" : "no"}`);

    const { bucketName, userCount } = await preflight({ args, sources: manifest.sources });
    if (args.dryRun) {
      log("Dry run completed. No data was changed. Source files are validated during a real run.");
      return;
    }

    const users = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });
    if (!users.length) throw new Error("No ACTIVE users found.");

    let metadataItems = [];
    if (process.env.YOUTUBE_API_KEY) {
      try {
        metadataItems = await fetchVietnameseMetadataForCategories(args.count, manifest.sources);
      } catch (error) {
        if (!args.allowGeneratedMetadata) throw error;
        warn(`YouTube metadata preload failed, generated metadata will be used: ${error.message}`);
      }

      if (metadataItems.length < args.count && !args.allowGeneratedMetadata) {
        throw new Error(
          `Only found ${metadataItems.length}/${args.count} Vietnamese YouTube metadata items. Add more queries or use --allow-generated-metadata.`,
        );
      }
      log(`Preloaded ${metadataItems.length}/${args.count} Vietnamese metadata item(s).`);
    } else {
      log("YOUTUBE_API_KEY is missing; generated metadata fallback is enabled.");
    }

    const stagedSources = await stageAnchorSources({
      sources: manifest.sources,
      manifestDir: manifest.manifestDir,
      tempDir,
    });

    await clearQueue();

    const storagePlan = await collectStorageObjects(bucketName);
    log(`Existing videos to remove: ${storagePlan.videoCount}.`);
    await removeStorageObjects(bucketName, storagePlan);
    await clearSearchIndex();
    await resetDatabaseContent(userCount);

    const queuedAnchors = await ingestAnchorVideos({
      bucketName,
      stagedSources,
      users,
      args,
    });

    const readyAnchors = await waitForAnchorProcessing({
      anchors: queuedAnchors,
      timeoutMinutes: args.waitTimeoutMinutes,
      pollSeconds: args.pollSeconds,
    });

    await prisma.notification.deleteMany({});

    metadataItems = await getVietnameseMetadata({
      count: args.count,
      anchors: readyAnchors,
      allowGeneratedMetadata: args.allowGeneratedMetadata,
      preloadedItems: metadataItems,
    });

    const clones = await createDemoCloneVideos({
      metadataItems,
      anchors: readyAnchors,
      users,
    });

    const allReadyVideos = [...readyAnchors, ...clones];
    await seedPlaylists({ users, videos: allReadyVideos });
    await seedSocialData({ users, videos: allReadyVideos });
    await reindexSearch();

    const finalCounts = await Promise.all([
      prisma.user.count(),
      prisma.video.count(),
      prisma.playlist.count(),
      prisma.watchHistory.count(),
      prisma.like.count(),
      prisma.comment.count(),
    ]);

    log("Done.");
    log(`Users preserved: ${finalCounts[0]}`);
    log(`Videos: ${finalCounts[1]} (${readyAnchors.length} anchors + ${clones.length} clones)`);
    log(`Playlists: ${finalCounts[2]}`);
    log(`Watch history: ${finalCounts[3]}, likes: ${finalCounts[4]}, comments: ${finalCounts[5]}`);
  } finally {
    await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
};

main()
  .catch((error) => {
    console.error("[vn-demo] Fatal error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await withTimeout(videoQueue.close(), 3000, "BullMQ close");
    } catch {}
    try {
      await withTimeout(redisClient.quit(), 3000, "Redis quit");
    } catch {}
    try {
      if (typeof videoQueue.disconnect === "function") await videoQueue.disconnect();
    } catch {}
    try {
      redisClient.disconnect();
    } catch {}
    await prisma.$disconnect();
  });
