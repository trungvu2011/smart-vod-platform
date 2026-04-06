const Minio = require("minio");
require("dotenv").config();

// Khởi tạo MinIO Client cho Worker
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

console.log("[WORKER] Sẵn sàng kết nối MinIO.");

module.exports = minioClient;
