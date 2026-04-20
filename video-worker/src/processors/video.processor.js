const fs = require("fs");
const path = require("path");
const minioClient = require("../config/minio");
const aiService = require("../services/ai.service");

const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

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
    await job.updateProgress(2);
    await minioClient.fGetObject(bucketName, originalFilename, inputFilePath);
    await job.updateProgress(5);

    // Tìm độ dài video (duration) bằng ffprobe
    const videoDuration = await new Promise((resolve) => {
      ffmpeg.ffprobe(inputFilePath, (err, metadata) => {
        if (err || !metadata || !metadata.format) {
          resolve(0);
        } else {
          resolve(Math.round(metadata.format.duration) || 0);
        }
      });
    });
    console.log(`[WORKER] Độ dài video: ${videoDuration} giây`);

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
        .outputOptions([
          "-preset fast", // Cân bằng giữa tốc độ Server và độ nét Video

          // ==========================================
          // 🥇 Cặp 1: Luồng 720p (Cáp quang / Wifi khỏe)
          // ==========================================
          "-map 0:v",
          "-s:v:0 1280x720",
          "-r:v:0 30", // Khóa cứng 30 fps
          "-c:v:0 libx264",
          "-b:v:0 2500k",
          "-g:v:0 300", // [Kỷ luật] 30fps x 10s = 300 frame cắt 1 lần
          "-keyint_min:v:0 300",
          "-sc_threshold:v:0 0",
          "-map 0:a",
          "-c:a:0 aac",
          "-b:a:0 128k",
          "-filter:a:0 loudnorm", // [Bí thuật] Kích tiếng to rõ đều đặn

          // ==========================================
          // 🥈 Cặp 2: Luồng 360p (Mạng di động 4G)
          // ==========================================
          "-map 0:v",
          "-s:v:1 640x360",
          "-r:v:1 30", // Khóa cứng 30 fps
          "-c:v:1 libx264",
          "-b:v:1 800k",
          "-g:v:1 300", // [Kỷ luật] 30fps x 10s = 300 frame cắt 1 lần
          "-keyint_min:v:1 300",
          "-sc_threshold:v:1 0",
          "-map 0:a",
          "-c:a:1 aac",
          "-b:a:1 96k",
          "-filter:a:1 loudnorm",

          // ==========================================
          // 🥉 Cặp 3: Luồng 240p (Mạng siêu yếu / Cấp cứu < 200kbps)
          // ==========================================
          "-map 0:v",
          "-s:v:2 426x240",
          "-r:v:2 15",
          "-c:v:2 libx264",
          "-b:v:2 100k", // 1. Hạ mốc trung bình xuống 100k (Lùi 1 bước cho an toàn)
          "-maxrate:v:2 120k", // 2. [QUAN TRỌNG] Đặt trần tối đa: Tuyệt đối không được vượt quá 120k!
          "-bufsize:v:2 240k", // 3. [QUAN TRỌNG] Bộ đệm (Luôn set gấp đôi maxrate để FFmpeg tính toán)
          "-g:v:2 150",
          "-keyint_min:v:2 150",
          "-sc_threshold:v:2 0",
          "-map 0:a",
          "-c:a:2 aac",
          "-b:a:2 32k",
          "-filter:a:2 loudnorm",

          // ==========================================
          // ⚙️ Cấu hình lõi HLS
          // ==========================================
          "-f hls",
          "-hls_time 10", // Độ dài mỗi mảnh ts là 10 giây
          "-hls_playlist_type vod", // Chế độ VOD cho phép tua tới lui
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
        .on("progress", (progress) => {
          if (progress.percent) {
            // Mapping FFmpeg progress to 5% -> 60%
            const overallPercent = 5 + Math.floor((progress.percent / 100) * 55);
            job.updateProgress(Math.min(overallPercent, 60));
          }
        })
        .on("end", () => resolve())
        // FFmpeg có thể bị crash lúc tắt, nhưng nếu file m3u8 đã có rồi thì vẫn coi như thành công
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
      job,
    );

    // 5. Làm việc xong phải rửa "thớt" (Xóa file tạm kẻo sập ổ cứng)
    await job.updateProgress(98);
    fs.rmSync(tempDir, { recursive: true, force: true });
    await job.updateProgress(100);
    console.log(`[WORKER] Hoàn tất xử lý video ID: ${videoId}\n`);

    // Trả về đường link của file thực đơn (.m3u8) để sau này Frontend phát video
    return {
      hlsUrl: `${process.env.MINIO_PUBLIC_URL}/${bucketName}/hls/${videoId}/master.m3u8`,
      duration: videoDuration,
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
