/**
 * XÓA SẠCH TẤT CẢ VIDEO trong database.
 * Dùng khi cần reset hoàn toàn dữ liệu video demo.
 *
 * Cách chạy: node scripts/clean-all-videos.js
 */

require("dotenv").config();
const prisma = require("../src/config/prisma");
const minioClient = require("../src/config/minio");
const redisClient = require("../src/config/redis");

const log = (msg) => console.log(`[clean] ${msg}`);

const run = async () => {
  log("═══════════════════════════════════════════════════");
  log("  CLEANING ALL VIDEOS FROM DATABASE");
  log("═══════════════════════════════════════════════════\n");

  const videoCount = await prisma.video.count();
  log(`Found ${videoCount} video(s) in database.\n`);

  if (videoCount === 0) {
    log("Nothing to clean. Done.");
    return;
  }

  // 1. Xóa tất cả dữ liệu liên quan (FK constraints)
  log("Deleting related data...");

  const deletedMeetingRecordings = await prisma.meetingRecording.deleteMany({});
  log(`  Meeting recordings: ${deletedMeetingRecordings.count}`);

  const deletedPlaylistItems = await prisma.playlistItem.deleteMany({});
  log(`  Playlist items: ${deletedPlaylistItems.count}`);

  const deletedWatchHistory = await prisma.watchHistory.deleteMany({});
  log(`  Watch history: ${deletedWatchHistory.count}`);

  const deletedCommentLikes = await prisma.commentLike.deleteMany({});
  log(`  Comment likes: ${deletedCommentLikes.count}`);

  const deletedComments = await prisma.comment.deleteMany({});
  log(`  Comments: ${deletedComments.count}`);

  const deletedLikes = await prisma.like.deleteMany({});
  log(`  Likes: ${deletedLikes.count}`);

  const deletedMetadata = await prisma.videoMetadata.deleteMany({});
  log(`  Video metadata: ${deletedMetadata.count}`);

  // 2. Xóa tất cả video
  const deletedVideos = await prisma.video.deleteMany({});
  log(`  Videos: ${deletedVideos.count}`);

  // 3. Cleanup MinIO (optional — xóa file vật lý)
  log("\nCleaning MinIO storage...");
  const bucketName = process.env.MINIO_BUCKET_NAME || "videos";
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (exists) {
      const objects = await new Promise((resolve, reject) => {
        const objs = [];
        const stream = minioClient.listObjectsV2(bucketName, "", true);
        stream.on("data", (obj) => objs.push(obj.name));
        stream.on("error", (err) => reject(err));
        stream.on("end", () => resolve(objs));
      });

      if (objects.length > 0) {
        await minioClient.removeObjects(bucketName, objects);
        log(`  Removed ${objects.length} file(s) from MinIO.`);
      } else {
        log("  MinIO bucket is already empty.");
      }
    }
  } catch (err) {
    log(`  MinIO cleanup skipped: ${err.message}`);
  }

  log("\n╔═══════════════════════════════════════════════╗");
  log("║  ALL VIDEOS CLEANED SUCCESSFULLY              ║");
  log(`║  Deleted: ${String(deletedVideos.count).padEnd(35)}║`);
  log("╚═══════════════════════════════════════════════╝\n");
};

run()
  .catch((err) => {
    console.error("[clean] Fatal error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await redisClient.quit(); } catch {}
    await prisma.$disconnect();
  });
