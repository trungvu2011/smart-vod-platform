const { Worker } = require("bullmq");
const redisConnection = require("./config/redis");
const { PrismaClient } = require("@prisma/client");
const processVideo = require("./processors/video.processor");
require("dotenv").config();

const prisma = new PrismaClient();

console.log("🚀 Hệ thống Video Worker đang khởi động...");

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
  console.log(`🎉 Tuyệt vời! Job ${job.id} đã hoàn thành.`);
  console.log(`🔗 Link HLS của video: ${returnvalue.hlsUrl}`);

  // Cập nhật trạng thái video trong database thành 'ready' và lưu URL HLS
  try {
    await prisma.video.update({
      where: { id: job.data.videoId },
      data: {
        status: "ready",
        hls_url: returnvalue.hlsUrl,
      },
    });
    console.log(
      `✅ Đã cập nhật trạng thái 'ready' vào Database cho video ${job.data.videoId}!`,
    );
  } catch (error) {
    console.error("🚨 Lỗi khi cập nhật trạng thái video:", error);
  }
});

// Bắt sự kiện khi băm video THẤT BẠI
worker.on("failed", async (job, err) => {
  console.error(`🚨 Job ${job.id} đã thất bại với lỗi:`, err.message);

  // Cập nhật trạng thái video trong database thành 'failed'
  try {
    await prisma.video.update({
      where: { id: job.data.videoId },
      data: { status: "failed" },
    });
  } catch (dbErr) {}
});
