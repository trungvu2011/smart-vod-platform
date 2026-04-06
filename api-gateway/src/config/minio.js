const Minio = require("minio");
require("dotenv").config();

// Khởi tạo MinIO Client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// Hàm tự động tạo Bucket nếu chưa có
const initBucket = async () => {
  const bucketName = process.env.MINIO_BUCKET_NAME;
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (exists) {
      console.log(`[API] MinIO bucket '${bucketName}' đã sẵn sàng.`);
    } else {
      await minioClient.makeBucket(bucketName, "us-east-1");
      console.log(`[API] Đã tạo mới MinIO bucket: '${bucketName}'.`);
    }
  } catch (err) {
    console.error("[ERROR] Lỗi kết nối MinIO:", err);
  }
};

initBucket();

module.exports = minioClient;
