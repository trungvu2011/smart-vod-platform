const { exec } = require("child_process");
const util = require("util");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const Groq = require("groq-sdk");

const execPromise = util.promisify(exec);
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const getWhisperExecutable = () => {
  if (process.env.WHISPER_EXECUTABLE) return process.env.WHISPER_EXECUTABLE;
  if (process.platform === "win32") {
    return path.join(process.cwd(), "whisper-env", "Scripts", "whisper.exe");
  }
  return path.join(process.cwd(), "whisper-env", "bin", "whisper");
};

const extractAudio = async (rawFilePath, audioPath) => {
  console.log("[AI] [1/4] Extracting audio...");
  return new Promise((resolve, reject) => {
    ffmpeg(rawFilePath)
      .outputOptions(["-q:a 0", "-map a"])
      .output(audioPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
};

const transcribeAudio = async (audioPath, tempDir) => {
  console.log("[AI] [2/4] Running Whisper...");
  const whisperExe = getWhisperExecutable();
  if (!fs.existsSync(whisperExe)) {
    throw new Error(`Whisper executable not found: ${whisperExe}`);
  }

  const whisperModel = process.env.WHISPER_MODEL || "small";
  const whisperLanguage = process.env.WHISPER_LANGUAGE || "vi";
  const whisperCmd = `"${whisperExe}" "${audioPath}" --model ${whisperModel} --language ${whisperLanguage} --output_format vtt --output_dir "${tempDir}"`;

  const envPathKey =
    Object.keys(process.env).find((k) => k.toLowerCase() === "path") || "PATH";
  const ffmpegDir = path.dirname(ffmpegInstaller.path);

  const options = {
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
      [envPathKey]: `${ffmpegDir}${path.delimiter}${process.env[envPathKey] || ""}`,
    },
  };

  const { stdout, stderr } = await execPromise(whisperCmd, options);
  if (stdout) console.log("[AI] Whisper output:\n", stdout);
  if (stderr) console.log("[AI] Whisper warnings:", stderr);

  return path.join(tempDir, "audio.vtt");
};

const uploadSubtitleToMinIO = async (vttFilePath, minioClient) => {
  console.log("[AI] [3/4] Uploading subtitle...");
  const objectName = `captions/${Date.now()}_subtitles.vtt`;
  await minioClient.fPutObject(
    process.env.MINIO_BUCKET_NAME,
    objectName,
    vttFilePath,
    { "Content-Type": "text/vtt" },
  );
  return `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET_NAME}/${objectName}`;
};

const generateSummary = async (vttFilePath) => {
  console.log("[AI] [4/4] Generating summary...");
  if (!process.env.GROQ_API_KEY) {
    return "Summary skipped: missing GROQ_API_KEY.";
  }

  try {
    const vttContent = fs.readFileSync(vttFilePath, "utf-8");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `Bạn là một trợ lý phân tích video.

Hãy viết phần tóm tắt chi tiết, đầy đủ và dễ hiểu bằng tiếng Việt dựa trên nội dung phụ đề bên dưới.

Yêu cầu đầu ra:
- Tóm tắt theo cấu trúc rõ ràng, ưu tiên đủ ý thay vì quá ngắn.
- Viết thành 3 đến 5 đoạn ngắn hoặc 5 đến 8 gạch đầu dòng, tùy nội dung video.
- Nêu rõ chủ đề chính, các ý quan trọng, quy trình hoặc luồng nội dung nếu có, và kết luận hoặc thông điệp chính.
- Không chỉ liệt kê ý rời rạc, hãy diễn giải để người đọc hiểu được toàn cảnh video.
- Nếu video có nhiều phần, hãy nhóm theo từng phần hoặc từng chủ đề.
- Không nhắc tới "phụ đề" hay "transcript", chỉ viết phần tóm tắt nội dung video.

Nội dung video:
${vttContent}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
    });

    return completion.choices[0]?.message?.content || "No summary result.";
  } catch (error) {
    console.error("[AI] Summary error:", error.message);
    return "Could not generate summary due to API error.";
  }
};

const runLocalWhisper = async (rawFilePath, tempDir, minioClient, job) => {
  const aiRequired = process.env.AI_REQUIRED === "true";
  if (process.env.AI_WHISPER_ENABLED === "false") {
    console.log("[AI] AI_WHISPER_ENABLED=false, skipping AI pipeline.");
    return null;
  }

  try {
    const audioPath = path.join(tempDir, "audio.mp3");

    await extractAudio(rawFilePath, audioPath);
    if (job) await job.updateProgress(65);

    const vttFilePath = await transcribeAudio(audioPath, tempDir);
    if (job) await job.updateProgress(85);

    const transcriptUrl = await uploadSubtitleToMinIO(vttFilePath, minioClient);
    if (job) await job.updateProgress(90);

    const finalSummary = await generateSummary(vttFilePath);
    if (job) await job.updateProgress(95);

    return {
      transcript_url: transcriptUrl,
      ai_summary: finalSummary,
    };
  } catch (error) {
    console.error("[AI] Pipeline error:", error.message);
    if (!aiRequired) {
      console.warn("[AI] AI_REQUIRED=false, continue without subtitle/summary.");
      return null;
    }
    throw error;
  }
};

module.exports = {
  runLocalWhisper,
};
