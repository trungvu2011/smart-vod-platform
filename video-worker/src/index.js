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
    await prisma.$transaction([
      prisma.video.update({
        where: { id: job.data.videoId },
        data: { status: "READY" },
      }),
      prisma.videoMetadata.upsert({
        where: { videoId: job.data.videoId },
        update: {
          hlsMasterUrl: returnvalue.hlsUrl,
          subtitleUrl: returnvalue.transcriptUrl || null,
          aiSummary: returnvalue.aiSummary || null,
        },
        create: {
          videoId: job.data.videoId,
          hlsMasterUrl: returnvalue.hlsUrl,
          subtitleUrl: returnvalue.transcriptUrl || null,
          aiSummary: returnvalue.aiSummary || null,
          duration: 0,
        },
      }),
    ]);
    console.log(
      `[WORKER] Đã cập nhật READY và metadata cho video ${job.data.videoId}.`,
    );
  } catch (error) {
    console.error("[ERROR] Lỗi cập nhật trạng thái video:", error);
  }
});

// Bắt sự kiện khi băm video THẤT BẠI
worker.on("failed", async (job, err) => {
  console.error(`[ERROR] Job ${job.id} thất bại:`, err.message);

  // Cập nhật trạng thái video trong database thành FAILED
  try {
    await prisma.video.update({
      where: { id: job.data.videoId },
      data: { status: "FAILED" },
    });
  } catch (dbErr) {
    console.error("[ERROR] Lỗi cập nhật trạng thái FAILED:", dbErr);
  }
});
