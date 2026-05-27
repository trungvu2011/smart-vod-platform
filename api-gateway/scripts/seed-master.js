/**
 * MASTER SEED SCRIPT
 * Chạy 1 lệnh duy nhất để:
 * 1. Xóa sạch database (Clean)
 * 2. Tải 3 video TEDx ngắn bằng yt-dlp
 * 3. Upload qua API để hệ thống tự xử lý HLS + Subtitle
 * 4. Chờ (polling) cho đến khi video xử lý xong (READY)
 * 5. Chạy seed 50 video từ YouTube API trỏ vào 3 video gốc này.
 *
 * Cách chạy trên VM:
 * docker exec smartvod-api npm run seed:master
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const prisma = require("../src/config/prisma");

const TEMP_DIR = path.join(__dirname, "..", "temp");

const log = (msg) => console.log(`[MASTER] ${msg}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runCmd = (cmd) => {
  log(`Executing: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

const run = async () => {
  log("═══════════════════════════════════════════════════════════════");
  log("  🚀 SMART VOD - END-TO-END MASTER SEED");
  log("═══════════════════════════════════════════════════════════════\n");

  // 1. CLEAN DATABASE
  log("▶ BƯỚC 1: Xóa sạch database và MinIO...");
  runCmd("node scripts/clean-all-videos.js");

  // 2. TẠO THƯ MỤC TEMP
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
  const anchorDir = path.join(TEMP_DIR, "anchor-videos");
  if (!fs.existsSync(anchorDir)) fs.mkdirSync(anchorDir, { recursive: true });

  // Xóa file thừa nếu có
  runCmd(`rm -rf ${anchorDir}/*`);

  // 3. TẢI VIDEO TEDx NGẮN (Khoảng 20-30MB/video)
  log("\n▶ BƯỚC 2: Tải video gốc (TED talks)...");
  try {
    execSync("yt-dlp --version");
  } catch (e) {
    log("yt-dlp không khả dụng! Vui lòng đảm bảo Dockerfile đã cài yt-dlp.");
    process.exit(1);
  }

  const downloads = [
    { name: "ted1", url: "https://www.youtube.com/watch?v=arj7oStGLkU" }, // Tim Urban
    { name: "ted2", url: "https://www.youtube.com/watch?v=8jPQjjsBbIc" }, // Scott Geller
    { name: "ted3", url: "https://www.youtube.com/watch?v=UF8uR6Z6KLc" }, // Steve Jobs
  ];

  for (const d of downloads) {
    runCmd(`yt-dlp -f "best[height<=720][ext=mp4]" --no-playlist -o "${anchorDir}/${d.name}-%(id)s.%(ext)s" "${d.url}"`);
  }

  // 4. UPLOAD QUA API
  log("\n▶ BƯỚC 3: Upload lên hệ thống...");
  // Khởi động bằng cách gọi script upload-anchors-to-prod, override API_BASE về localhost do chạy bên trong container
  runCmd("node scripts/upload-anchors-to-prod.js --api=http://localhost:5000");

  // 5. CHỜ XỬ LÝ (POLLING)
  log("\n▶ BƯỚC 4: Chờ Worker xử lý (HLS + AI Whisper)...");
  
  let allReady = false;
  let attempts = 0;
  
  while (!allReady && attempts < 120) { // Đợi tối đa 60 phút
    attempts++;
    const videos = await prisma.video.findMany({ select: { id: true, title: true, status: true } });
    
    if (videos.length === 0) {
      log(`[Wait] Chưa thấy video trong DB, đợi thêm...`);
      await sleep(30000); // 30s
      continue;
    }

    const readyCount = videos.filter(v => v.status === "READY").length;
    log(`[Wait] Đã xử lý xong: ${readyCount}/${videos.length} videos...`);

    if (readyCount === videos.length && videos.length === downloads.length) {
      allReady = true;
      break;
    }

    // Đợi 30 giây rồi check lại
    await sleep(30000);
  }

  if (!allReady) {
    log("❌ Quá thời gian chờ Worker xử lý. Hãy kiểm tra lại log của smartvod-worker.");
    process.exit(1);
  }

  // 6. CHẠY SEED YOUTUBE
  log("\n▶ BƯỚC 5: Tự động seed 50 videos metadata từ YouTube...");
  runCmd("node scripts/seed-youtube-metadata.js --limit=50");

  log("\n╔═══════════════════════════════════════════════════════╗");
  log("║  🎉 MASTER SEED COMPLETE! TẤT CẢ ĐÃ SẴN SÀNG!         ║");
  log("╚═══════════════════════════════════════════════════════╝");
  
  process.exit(0);
};

run();
