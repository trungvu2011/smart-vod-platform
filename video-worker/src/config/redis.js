const IORedis = require("ioredis");
require("dotenv").config();

// Kết nối vào Redis Server (Đã chạy sẵn trong Docker ở Tuần 1)
const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: null, // Bắt buộc phải có dòng này khi dùng thư viện BullMQ
});

connection.on("connect", () => {
  console.log("📬 Worker đã kết nối thành công vào Hộp thư Redis!");
});

connection.on("error", (err) => {
  console.error("❌ Lỗi kết nối Redis:", err);
});

module.exports = connection;
