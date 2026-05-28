const { Worker } = require("bullmq");
const redisConnection = require("./config/redis");
const { PrismaClient } = require("@prisma/client");
const processVideo = require("./processors/video.processor");
const searchService = require("./services/search.service");
require("dotenv").config();

const prisma = new PrismaClient();
const WORKER_HEARTBEAT_KEY = "worker:video:heartbeat";
const WORKER_HEARTBEAT_TTL_SECONDS = 45;
const WORKER_HEARTBEAT_INTERVAL_MS = 15000;

console.log("[WORKER] Khoi dong video-worker...");

const writeHeartbeat = async () => {
  try {
    await redisConnection.set(
      WORKER_HEARTBEAT_KEY,
      JSON.stringify({
        status: "OPERATIONAL",
        checkedAt: new Date().toISOString(),
        pid: process.pid,
        uptimeSeconds: Math.floor(process.uptime()),
      }),
      "EX",
      WORKER_HEARTBEAT_TTL_SECONDS,
    );
  } catch (error) {
    console.error("[WORKER] Khong the ghi heartbeat:", error.message);
  }
};

writeHeartbeat();
setInterval(writeHeartbeat, WORKER_HEARTBEAT_INTERVAL_MS);

const worker = new Worker(
  "video-jobs",
  async (job) => {
    return await processVideo(job);
  },
  {
    connection: redisConnection,
    concurrency: 1,
    lockDuration: 300000,
  },
);

worker.on("completed", async (job, returnvalue) => {
  console.log(`[WORKER] Job ${job.id} da hoan thanh.`);
  console.log(`[WORKER] Link HLS: ${returnvalue.hlsUrl}`);

  // Meeting recording auto-publishes, regular uploads stay pending admin review.
  try {
    const aiSummary = returnvalue.aiSummary ? returnvalue.aiSummary : null;
    const subtitleUrl = returnvalue.transcriptUrl ? returnvalue.transcriptUrl : null;
    const duration = returnvalue.duration || 0;
    const isMeetingRecording = Boolean(job?.data?.isMeetingRecording);
    const nextStatus = isMeetingRecording ? "READY" : "PENDING";

    const [updatedVideo] = await prisma.$transaction([
      prisma.video.update({
        where: { id: job.data.videoId },
        data: {
          status: nextStatus,
          ...(returnvalue.thumbnailUrl && {
            thumbnailUrl: returnvalue.thumbnailUrl,
          }),
        },
      }),
      prisma.videoMetadata.upsert({
        where: { videoId: job.data.videoId },
        update: {
          hlsMasterUrl: returnvalue.hlsUrl,
          subtitleUrl,
          aiSummary,
          duration,
        },
        create: {
          videoId: job.data.videoId,
          hlsMasterUrl: returnvalue.hlsUrl,
          subtitleUrl,
          aiSummary,
          duration,
        },
      }),
    ]);

    console.log(
      `[WORKER] Da cap nhat ${nextStatus} va metadata cho video ${job.data.videoId}.`,
    );

    if (nextStatus === "READY") {
      try {
        await searchService.indexVideoById(job.data.videoId);
      } catch (error) {
        console.error("[Search] Failed to index completed video:", error.message);
      }
    }

    if (updatedVideo && updatedVideo.creatorId) {
      const notificationTitle = isMeetingRecording
        ? "Video Processing Complete"
        : "Video Submitted For Review";
      const notificationMessage = isMeetingRecording
        ? `Your video "${updatedVideo.title}" is ready to be watched.`
        : `Your video "${updatedVideo.title}" has finished processing and is waiting for admin approval.`;

      const notification = await prisma.notification.create({
        data: {
          userId: updatedVideo.creatorId,
          type: "system",
          title: notificationTitle,
          message: notificationMessage,
          actionUrl: isMeetingRecording ? `/watch/${updatedVideo.id}` : "/my-videos",
        },
      });

      await redisConnection.publish(
        "notification_channel",
        JSON.stringify({
          userId: updatedVideo.creatorId,
          eventName: "new_notification",
          payload: notification,
        }),
      );
    }
  } catch (error) {
    console.error("[ERROR] Loi cap nhat trang thai video:", error);
  }
});

worker.on("failed", async (job, err) => {
  console.error(`[ERROR] Job ${job.id} that bai:`, err.message);

  try {
    const updatedVideo = await prisma.video.update({
      where: { id: job.data.videoId },
      data: { status: "FAILED" },
    });

    try {
      await searchService.deleteVideoFromIndex(job.data.videoId);
    } catch (error) {
      console.error("[Search] Failed to delete failed video from index:", error.message);
    }

    if (updatedVideo && updatedVideo.creatorId) {
      const notification = await prisma.notification.create({
        data: {
          userId: updatedVideo.creatorId,
          type: "system",
          title: "Video Processing Failed",
          message: `Your video "${updatedVideo.title}" failed to process. Please try uploading again.`,
          actionUrl: "/profile",
        },
      });

      await redisConnection.publish(
        "notification_channel",
        JSON.stringify({
          userId: updatedVideo.creatorId,
          eventName: "new_notification",
          payload: notification,
        }),
      );
    }
  } catch (dbErr) {
    console.error("[ERROR] Loi cap nhat trang thai FAILED:", dbErr);
  }
});
