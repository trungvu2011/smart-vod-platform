const fs = require("fs");
const path = require("path");
const minioClient = require("../config/minio");
const aiService = require("../services/ai.service");

const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const processVideo = async (job) => {
  // Lấy thông tin video cần xử lý từ job data
  const { videoId, originalFilename } = job.data;
  const bucketName = process.env.MINIO_BUCKET_NAME;

  console.log(`\n[WORKER] Bắt đầu xử lý video ID: ${videoId}`);

  // 1. Dọn sẵn cái "thớt" (thư mục tạm) cho video này
  const tempDir = path.join(__dirname, "../../../temp", videoId);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const inputFilePath = path.join(tempDir, originalFilename);
  const outputHlsPath = path.join(tempDir, "master.m3u8");

  try {
    // 2. Tải video gốc từ kho MinIO xuống "thớt"
    console.log("[WORKER] [1/4] Đang tải file gốc từ MinIO về worker...");
    await minioClient.fGetObject(bucketName, originalFilename, inputFilePath);

    // 3. Dùng FFmpeg băm nhỏ video ra chuẩn HLS đa độ phân giải (ABR)
    // 3. Dùng FFmpeg băm nhỏ video ra chuẩn HLS đa độ phân giải (ABR)
    console.log(
      "[WORKER] [2/4] Đang băm ABR (720p, 360p, 144p) - Chế độ SAFE MODE...",
    );
    await new Promise((resolve, reject) => {
      const segmentPattern = path
        .join(tempDir, "stream_%v_%03d.ts")
        .replace(/\\/g, "/");
      const playlistPattern = path
        .join(tempDir, "stream_%v.m3u8")
        .replace(/\\/g, "/");

      ffmpeg(inputFilePath)
        // KHÔNG DÙNG complexFilter nữa để tránh tràn RAM cho bản FFmpeg rút gọn
        .outputOptions([
          "-preset ultrafast",

          // Cặp 1: Luồng 720p (Video 0 + Audio 0)
          "-map 0:v",
          "-s:v:0 1280x720",
          "-c:v:0 libx264",
          "-b:v:0 2500k",
          "-map 0:a",
          "-c:a:0 aac",
          "-b:a:0 128k",

          // Cặp 2: Luồng 360p (Video 1 + Audio 1)
          "-map 0:v",
          "-s:v:1 640x360",
          "-c:v:1 libx264",
          "-b:v:1 800k",
          "-map 0:a",
          "-c:a:1 aac",
          "-b:a:1 128k",

          // Cặp 3: Luồng 144p (Video 2 + Audio 2)
          "-map 0:v",
          "-s:v:2 256x144",
          "-c:v:2 libx264",
          "-b:v:2 100k",
          "-map 0:a",
          "-c:a:2 aac",
          "-b:a:2 48k",

          // Cấu hình HLS
          "-f hls",
          "-hls_time 10",
          "-hls_playlist_type vod",
          "-hls_flags independent_segments",
          "-master_pl_name master.m3u8",
          "-hls_segment_filename",
          segmentPattern,

          "-var_stream_map",
          "v:0,a:0 v:1,a:1 v:2,a:2",
        ])
        .output(playlistPattern)
        // Gắn "máy nghe lén" xem FFmpeg sinh ra câu lệnh gì
        .on("start", (commandLine) => {
          console.log("🚀 Lệnh FFmpeg đang chạy:\n", commandLine);
        })
        .on("end", () => resolve())
        // FFmpeg có thể bị crash lúc tắt, nhưng nếu file m3u8 đã có rồi thì vẫn coi như thành công và đi tiếp sang Bước 4
        .on("error", (err, stdout, stderr) => {
          const masterPlaylistPath = path.join(tempDir, "master.m3u8");

          // Kiểm tra xem file m3u8 có thực sự tồn tại trên ổ cứng không
          if (fs.existsSync(masterPlaylistPath)) {
            console.log(
              "⚠️ [WORKER] FFmpeg bị Crash lúc tắt, NHƯNG video đã băm thành công! Ép luồng chạy tiếp...",
            );
            resolve(); // Ép hệ thống coi như thành công và đi tiếp sang Bước 4
          } else {
            console.error("🚨 FFmpeg STDERR (Lỗi gốc):", stderr);
            reject(err); // Nếu không có file thật thì mới báo lỗi
          }
        })
        .run();
    });

    // 4. Quét lại cái "thớt" xem có bao nhiêu mảnh, dọn dẹp đường dẫn và đẩy lên MinIO
    console.log(
      "[WORKER] [3/4] Đang dọn dẹp HLS, tự tạo Master Playlist và đẩy lên mây...",
    );

    // // Tạo chuỗi đường dẫn tuyệt đối mà FFmpeg đã lỡ ghi vào (chuyển \ thành /)
    // const absolutePrefix = tempDir.replace(/\\/g, "/") + "/";

    // const files = fs.readdirSync(tempDir);
    // for (const file of files) {
    //   const filePath = path.join(tempDir, file);

    //   // === ĐOẠN FIX LỖI: TẨY RỬA ĐƯỜNG DẪN TRONG FILE M3U8 ===
    //   if (file.endsWith(".m3u8")) {
    //     let content = fs.readFileSync(filePath, "utf-8");
    //     // Xóa sạch tiền tố ổ đĩa (VD: D:/.../temp/ID/), chỉ giữ lại tên file tương đối
    //     content = content.split(absolutePrefix).join("");
    //     fs.writeFileSync(filePath, content);
    //   }
    //   // =======================================================

    //   if (file.endsWith(".m3u8") || file.endsWith(".ts")) {
    //     const minioObjectName = `hls/${videoId}/${file}`;

    //     // Gán Content-Type chuẩn để VLC và Trình duyệt web đọc HLS mượt mà
    //     const contentType = file.endsWith(".m3u8")
    //       ? "application/x-mpegURL"
    //       : "video/MP2T";

    //     await minioClient.fPutObject(bucketName, minioObjectName, filePath, {
    //       "Content-Type": contentType,
    //     });
    //   }
    // }

    const masterContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=148000,RESOLUTION=256x144,CODECS="avc1.4d400c,mp4a.40.2"
stream_2.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1.4d401e,mp4a.40.2"
stream_1.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.4d401f,mp4a.40.2"
stream_0.m3u8`;

    const masterPlaylistPath = path.join(tempDir, "master.m3u8");
    fs.writeFileSync(masterPlaylistPath, masterContent); // Ghi đè file rỗng của FFmpeg luôn!
    // =========================================================================

    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      const filePath = path.join(tempDir, file);

      // ĐOẠN FIX TỐI THƯỢNG: Chỉ quét và tẩy rửa các file stream_X.m3u8 con
      if (file.endsWith(".m3u8") && file !== "master.m3u8") {
        let content = fs.readFileSync(filePath, "utf-8");
        let lines = content.split(/\r?\n/);
        let cleanedLines = lines.map((line) => {
          line = line.trim();
          if (line && !line.startsWith("#")) {
            // Chặt lấy đúng tên file .ts cuối cùng
            return line.split("/").pop().split("\\").pop();
          }
          return line;
        });
        fs.writeFileSync(filePath, cleanedLines.join("\n"));
      }

      // Đẩy lên MinIO
      if (file.endsWith(".m3u8") || file.endsWith(".ts")) {
        const minioObjectName = `hls/${videoId}/${file}`;
        const contentType = file.endsWith(".m3u8")
          ? "application/x-mpegURL"
          : "video/MP2T";

        await minioClient.fPutObject(bucketName, minioObjectName, filePath, {
          "Content-Type": contentType,
        });
      }
    }

    console.log("[WORKER] [4/4] Đang chạy AI pipeline (Whisper + Summary)...");
    const aiResult = await aiService.runLocalWhisper(
      inputFilePath,
      tempDir,
      minioClient,
    );

    // 5. Làm việc xong phải rửa "thớt" (Xóa file tạm kẻo sập ổ cứng)
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`[WORKER] Hoàn tất xử lý video ID: ${videoId}\n`);

    // Trả về đường link của file thực đơn (.m3u8) để sau này Frontend phát video
    return {
      hlsUrl: `${process.env.MINIO_PUBLIC_URL}/${bucketName}/hls/${videoId}/master.m3u8`,
      ...(aiResult && {
        transcriptUrl: aiResult.transcript_url,
        aiSummary: aiResult.ai_summary,
      }),
    };
  } catch (error) {
    console.error(`[ERROR] Lỗi xử lý video ${videoId}:`, error);
    if (fs.existsSync(tempDir))
      fs.rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }
};

module.exports = processVideo;
