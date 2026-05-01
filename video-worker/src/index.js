const { Worker } = require("bullmq");
const redisConnection = require("./config/redis");
const { PrismaClient } = require("@prisma/client");
const processVideo = require("./processors/video.processor");
require("dotenv").config();

const prisma = new PrismaClient();

console.log("[WORKER] Khởi động video-worker...");

// Khởi tạo Worker, dán mắt vào hàng đợi có tên là 'video-jobs'
const worker = new Worker(
  "video-jobs",
  async (job) => {
    // Khi có việc rớt vào hàng đợi, quăng nó cho bộ vi xử lý FFmpeg
    return await processVideo(job);
  },
  {
    connection: redisConnection,
    concurrency: 1, // Chỉ xử lý 1 video tại một thời điểm để tránh nổ RAM/CPU server
    lockDuration: 300000,
  },
);

// Bắt sự kiện khi băm video THÀNH CÔNG
worker.on("completed", async (job, returnvalue) => {
  console.log(`[WORKER] Job ${job.id} đã hoàn thành.`);
  console.log(`[WORKER] Link HLS: ${returnvalue.hlsUrl}`);

  // Cập nhật video sang READY và upsert metadata theo schema DB mới.
  try {
    const aiSummary = returnvalue.aiSummary ? returnvalue.aiSummary : null;
    const subtitleUrl = returnvalue.transcriptUrl ? returnvalue.transcriptUrl : null;
    const duration = returnvalue.duration || 0;

    const [updatedVideo] = await prisma.$transaction([
      prisma.video.update({
        where: { id: job.data.videoId },
        data: { status: "READY" },
      }),
      prisma.videoMetadata.upsert({
        where: { videoId: job.data.videoId },
        update: {
          hlsMasterUrl: returnvalue.hlsUrl,
          subtitleUrl: subtitleUrl,
          aiSummary: aiSummary,
          duration: duration,
        },
        create: {
          videoId: job.data.videoId,
          hlsMasterUrl: returnvalue.hlsUrl,
          subtitleUrl: subtitleUrl,
          aiSummary: aiSummary,
          duration: duration,
        },
      }),
    ]);
    console.log(
      `[WORKER] Đã cập nhật READY và metadata cho video ${job.data.videoId}.`,
    );

    // Create Notification
    if (updatedVideo && updatedVideo.creatorId) {
      const notification = await prisma.notification.create({
        data: {
          userId: updatedVideo.creatorId,
          type: "system",
          title: "Video Processing Complete",
          message: `Your video "${updatedVideo.title}" is ready to be watched.`,
          actionUrl: `/watch/${updatedVideo.id}`,
        },
      });

      // Publish to Redis for SSE real-time push
      redisConnection.publish("notification_channel", JSON.stringify({
        userId: updatedVideo.creatorId,
        eventName: "new_notification",
        payload: notification
      }));
    }

  } catch (error) {
    console.error("[ERROR] Lỗi cập nhật trạng thái video:", error);
  }
});

// Bắt sự kiện khi băm video THẤT BẠI
worker.on("failed", async (job, err) => {
  console.error(`[ERROR] Job ${job.id} thất bại:`, err.message);

  // Cập nhật trạng thái video trong database thành FAILED
  try {
    const updatedVideo = await prisma.video.update({
      where: { id: job.data.videoId },
      data: { status: "FAILED" },
    });

    if (updatedVideo && updatedVideo.creatorId) {
      const notification = await prisma.notification.create({
        data: {
          userId: updatedVideo.creatorId,
          type: "system",
          title: "Video Processing Failed",
          message: `Your video "${updatedVideo.title}" failed to process. Please try uploading again.`,
          actionUrl: `/profile`,
        },
      });

      // Publish to Redis for SSE real-time push
      redisConnection.publish("notification_channel", JSON.stringify({
        userId: updatedVideo.creatorId,
        eventName: "new_notification",
        payload: notification
      }));
    }
  } catch (dbErr) {
    console.error("[ERROR] Lỗi cập nhật trạng thái FAILED:", dbErr);
  }
});
