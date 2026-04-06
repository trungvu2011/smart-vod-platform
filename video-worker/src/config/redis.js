const IORedis = require("ioredis");
require("dotenv").config();

// Kết nối vào Redis Server
const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: null, // Bắt buộc phải có dòng này khi dùng thư viện BullMQ
});

connection.on("connect", () => {
  console.log("[REDIS] Đã kết nối Redis thành công.");
});

connection.on("error", (err) => {
  console.error("[ERROR] Lỗi kết nối Redis:", err);
});

module.exports = connection;
