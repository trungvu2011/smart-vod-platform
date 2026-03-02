const fs = require("fs");
const path = require("path");
const minioClient = require("../config/minio");

const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const processVideo = async (job) => {
  // Lấy thông tin video cần xử lý từ job data
  const { videoId, originalFilename } = job.data;
  const bucketName = process.env.MINIO_BUCKET_NAME;

  console.log(`\n🎬 BẮT ĐẦU XỬ LÝ VIDEO ID: ${videoId}`);

  // 1. Dọn sẵn cái "thớt" (thư mục tạm) cho video này
  const tempDir = path.join(__dirname, "../../../temp", videoId);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const inputFilePath = path.join(tempDir, originalFilename);
  const outputHlsPath = path.join(tempDir, "master.m3u8");

  try {
    // 2. Tải video gốc từ kho MinIO xuống "thớt"
    console.log("⬇️ [1/3] Đang tải file gốc từ MinIO về Worker...");
    await minioClient.fGetObject(bucketName, originalFilename, inputFilePath);

    // 3. Dùng FFmpeg băm nhỏ video ra chuẩn HLS
    console.log(
      "🔪 [2/3] Đang băm video thành các mảnh nhỏ (HLS)... Tốn chút thời gian nhé!",
    );
    await new Promise((resolve, reject) => {
      ffmpeg(inputFilePath)
        .outputOptions([
          "-codec: copy", // Giữ nguyên chất lượng gốc (chạy cực nhanh)
          "-start_number 0",
          "-hls_time 10", // Cắt mỗi mảnh đúng 10 giây
          "-hls_list_size 0", // Không giới hạn số lượng mảnh
          "-f hls", // Định dạng đầu ra là HLS
        ])
        .output(outputHlsPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    // 4. Quét lại cái "thớt" xem có bao nhiêu mảnh, đẩy hết lên MinIO
    console.log("⬆️ [3/3] Đang đẩy các mảnh HLS lên lại MinIO...");
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      if (file.endsWith(".m3u8") || file.endsWith(".ts")) {
        const filePath = path.join(tempDir, file);
        // Tạo một thư mục ảo trên MinIO: hls/ID_Video/ten-file.ts
        const minioObjectName = `hls/${videoId}/${file}`;
        await minioClient.fPutObject(bucketName, minioObjectName, filePath);
      }
    }

    // 5. Làm việc xong phải rửa "thớt" (Xóa file tạm kẻo sập ổ cứng)
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`✅ HOÀN TẤT XỬ LÝ VIDEO ID: ${videoId}\n`);

    // Trả về đường link của file thực đơn (.m3u8) để sau này Frontend phát video
    return {
      hlsUrl: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/hls/${videoId}/master.m3u8`,
    };
  } catch (error) {
    console.error(`❌ LỖI XỬ LÝ VIDEO ${videoId}:`, error);
    // Nếu lỗi, phải rửa sạch "thớt" trước khi báo cáo thất bại
    if (fs.existsSync(tempDir))
      fs.rmSync(tempDir, { recursive: true, force: true });
    throw error; // Quăng lỗi để Hộp thư BullMQ biết mà dán nhãn "Failed"
  }
};

module.exports = processVideo;
