const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const Groq = require("groq-sdk");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Hàm bóc tách âm thanh bằng FFmpeg
const extractAudio = async (rawFilePath, audioPath) => {
  console.log("[AI] [1/4] Bắt đầu trích xuất âm thanh...");
  return new Promise((resolve, reject) => {
    ffmpeg(rawFilePath)
      .outputOptions(["-q:a 0", "-map a"])
      .output(audioPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
};

// Hàm gọi AI Whisper (Local) để chép phụ đề
const transcribeAudio = async (audioPath, tempDir) => {
  console.log("[AI] [2/4] Bắt đầu chạy Whisper...");
  const isWindows = process.platform === "win32";
  const whisperExe = isWindows
    ? path.join(process.cwd(), "whisper-env", "Scripts", "whisper.exe") // Cho Windows hiện tại
    : path.join(process.cwd(), "whisper-env", "bin", "whisper"); // Cho Docker/Linux sau này

  const whisperCmd = `"${whisperExe}" "${audioPath}" --model small --language vi --output_format vtt --output_dir "${tempDir}"`;

  // 1. Quét tìm đúng tên biến Path đang dùng (xử lý vụ phân biệt hoa/thường trên Windows)
  const envPathKey =
    Object.keys(process.env).find((k) => k.toLowerCase() === "path") || "PATH";

  // 2. Lấy thư mục chứa file ffmpeg.exe của thư viện Node.js
  const ffmpegDir = path.dirname(ffmpegInstaller.path);

  // 3. Bơm vào cấu hình chạy Whisper
  const options = {
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
      // Ép Python phải dùng chung FFmpeg với Node.js
      [envPathKey]: `${ffmpegDir}${path.delimiter}${process.env[envPathKey]}`,
    },
  };
  const { stdout, stderr } = await execPromise(whisperCmd, options);

  console.log("[AI] Kết quả Whisper:\n", stdout);

  // Chỉ log lỗi/cảnh báo nếu có
  if (stderr) console.log("[AI] Cảnh báo Whisper:", stderr);

  return path.join(tempDir, "audio.vtt"); // Trả về đường dẫn file kết quả
};

// Hàm Upload file VTT lên kho lưu trữ MinIO
const uploadSubtitleToMinIO = async (vttFilePath, minioClient) => {
  console.log("[AI] [3/4] Đang lưu phụ đề lên MinIO...");
  const vttObjectName = `captions/${Date.now()}_subtitles.vtt`;

  await minioClient.fPutObject(
    process.env.MINIO_BUCKET_NAME,
    vttObjectName,
    vttFilePath,
    { "Content-Type": "text/vtt" },
  );

  return `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET_NAME}/${vttObjectName}`;
};

// Hàm gọi AI Groq (Llama 3) tóm tắt nội dung
const generateSummary = async (vttFilePath) => {
  console.log("[AI] [4/4] Đang tạo tóm tắt bằng LLM...");
  try {
    const vttContent = fs.readFileSync(vttFilePath, "utf-8");

    // Khởi tạo Groq bằng API Key trong .env
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `Bạn là một trợ lý ảo phân tích video. Dưới đây là nội dung phụ đề của một video. 
    Hãy tóm tắt nội dung cốt lõi của video này thành đúng 3 gạch đầu dòng ngắn gọn bằng tiếng Việt.
    
    Nội dung phụ đề:
    ${vttContent}`;

    // Gọi API của Groq (Sử dụng model Llama 3 cực kỳ thông minh và miễn phí)
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
    });

    const summary =
      chatCompletion.choices[0]?.message?.content || "Không có kết quả.";

    console.log("[AI] Đã tóm tắt xong.\n", summary);
    return summary;
  } catch (error) {
    console.error("[ERROR] Lỗi LLM:", error.message);
    return "Không thể tóm tắt do lỗi API hoặc video không có tiếng.";
  }
};

const runLocalWhisper = async (rawFilePath, tempDir, minioClient) => {
  try {
    const audioPath = path.join(tempDir, "audio.mp3");

    await extractAudio(rawFilePath, audioPath);

    const vttFilePath = await transcribeAudio(audioPath, tempDir);

    const transcriptUrl = await uploadSubtitleToMinIO(vttFilePath, minioClient);

    const finalSummary = await generateSummary(vttFilePath);

    return {
      transcript_url: transcriptUrl,
      ai_summary: finalSummary,
    };
  } catch (error) {
    console.error("[ERROR] Lỗi khi chạy AI pipeline:", error);
    throw error;
  }
};

module.exports = {
  runLocalWhisper,
};
