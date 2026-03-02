const { Queue } = require("bullmq");
const IORedis = require("ioredis");
require("dotenv").config();

// Nối dây vào Redis
const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

// Khởi tạo trạm bưu điện gửi đi, đặt tên đúng chuẩn 'video-jobs' để bên kia nhận được
const videoQueue = new Queue("video-jobs", { connection });

console.log("📮 Trạm bưu điện BullMQ đã sẵn sàng gửi việc!");

module.exports = videoQueue;
