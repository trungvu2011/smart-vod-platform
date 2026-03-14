const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const fs = require("fs");
const path = require("path");

const runLocalWhisper = async (rawFilePath, tempDir, minioClient) => {
  try {
    console.log("🤖 [AI Service] Bắt đầu trích xuất âm thanh...");
    const audioPath = path.join(tempDir, "audio.mp3");

    // Tách Audio
    await new Promise((resolve, reject) => {
      ffmpeg(rawFilePath)
        .outputOptions([
          "-q:a 0", // Chất lượng âm thanh tốt nhất
          "-map a", // Chỉ lấy stream audio
        ])
        .output(audioPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    console.log(
      "🤖 [AI Service] Trích xuất âm thanh thành công, bắt đầu chạy Whisper...",
    );

    // Gọi Whisper để chuyển đổi thành text
    const whisperExe = path.join(
      process.cwd(),
      "whisper-env",
      "Scripts",
      "whisper.exe",
    );
    const whisperCmd = `set PYTHONIOENCODING=utf-8 && "${whisperExe}" "${audioPath}" --model small --language vi --output_format vtt --output_dir "${tempDir}"`;
    const { stdout, stderr } = await execPromise(whisperCmd);

    console.log("🗣️ [Whisper Output]:", stdout);
    if (stderr) {
      console.log("⚠️ [Whisper Warning/Error]:", stderr);
    }

    // Đọc kết quả
    const vttFilePath = path.join(tempDir, "audio.vtt");

    // Upload MinIO
    const vttObjectName = `captions/${Date.now()}_subtitles.vtt`;
    await minioClient.fPutObject(
      process.env.MINIO_BUCKET_NAME,
      vttObjectName,
      vttFilePath,
      {
        "Content-Type": "text/vtt",
      },
    );

    const transcriptUrl = `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET_NAME}/${vttObjectName}`;
    console.log(
      `🤖 [AI Service] Đã tạo xong Phụ đề! Transcript URL: ${transcriptUrl}`,
    );

    const dummySummary =
      "1. AI đã nhận diện giọng nói thành công.\n2. Phụ đề tiếng Việt đã được tạo.\n3. Hãy gắn API LLM để tóm tắt chi tiết hơn.";

    return {
      transcript_url: transcriptUrl,
      ai_summary: dummySummary,
    };
  } catch (error) {
    console.error("🤖 [AI Service] Lỗi khi chạy Whisper:", error);
    return null;
  }
};

module.exports = {
  runLocalWhisper,
};
