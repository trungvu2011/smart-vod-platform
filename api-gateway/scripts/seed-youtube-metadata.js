/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SEED YOUTUBE METADATA — Chiến thuật "Crawl Metadata + Video Mồi"
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Mục đích:
 *   Tạo dữ liệu demo trông chuyên nghiệp bằng cách:
 *   1. Crawl metadata (title, description, thumbnail) từ YouTube Data API v3
 *   2. Ghép metadata đó với HLS/Subtitle từ các "Video Gốc" đã xử lý sẵn
 *
 * Yêu cầu:
 *   - Đã có ít nhất 1 video READY trong DB (có hlsMasterUrl + subtitleUrl)
 *   - YOUTUBE_API_KEY trong file .env
 *
 * Cách chạy:
 *   npm run seed:youtube
 *   npm run seed:youtube -- --limit=100
 *   npm run seed:youtube -- --dry-run
 *   npm run seed:youtube -- --queries="React,Node.js,Python"
 *   npm run seed:youtube -- --clean   (xóa tất cả video seed YouTube cũ)
 */

require("dotenv").config();

const prisma = require("../src/config/prisma");
const redisClient = require("../src/config/redis");

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SEED_MARKER = "YouTube Metadata Seed";
const DEFAULT_LIMIT = 50;
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

// Các từ khóa search để có metadata đa dạng, chuyên nghiệp
const DEFAULT_SEARCH_QUERIES = [
  "Software Engineering Course",
  "React JS Tutorial 2024",
  "Node.js Backend Development",
  "System Design Interview",
  "Cloud Computing AWS Tutorial",
  "Python Machine Learning",
  "Docker Kubernetes DevOps",
  "TypeScript Full Course",
  "Data Structures Algorithms",
  "Web Development Full Stack",
  "Microservices Architecture",
  "Git GitHub Advanced",
  "REST API Design Best Practices",
  "Database SQL PostgreSQL",
  "Agile Scrum Project Management",
];

// Map categories cho video
const CATEGORY_MAP = {
  "software engineering": "Engineering",
  react: "Engineering",
  "node.js": "Engineering",
  node: "Engineering",
  backend: "Engineering",
  "system design": "Engineering",
  cloud: "Operations",
  aws: "Operations",
  python: "Engineering",
  "machine learning": "Engineering",
  docker: "Operations",
  kubernetes: "Operations",
  devops: "Operations",
  typescript: "Engineering",
  "data structures": "Engineering",
  algorithms: "Engineering",
  "web development": "Engineering",
  "full stack": "Engineering",
  microservices: "Engineering",
  git: "Engineering",
  github: "Collaboration",
  api: "Engineering",
  database: "Engineering",
  sql: "Engineering",
  agile: "Product",
  scrum: "Product",
  project: "Product",
  management: "Leadership",
  security: "Security",
  leadership: "Leadership",
  design: "Design",
  product: "Product",
  tutorial: "Onboarding",
  course: "Onboarding",
};

// ─── UTILS ────────────────────────────────────────────────────────────────────

const log = (msg) => console.log(`[seed-youtube] ${msg}`);
const warn = (msg) => console.warn(`[seed-youtube] ⚠ ${msg}`);
const success = (msg) => console.log(`[seed-youtube] ✅ ${msg}`);
const error = (msg) => console.error(`[seed-youtube] ❌ ${msg}`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseArgs = (argv) => {
  const args = {
    limit: DEFAULT_LIMIT,
    dryRun: false,
    clean: false,
    queries: null,
  };

  for (const rawArg of argv.slice(2)) {
    const [key, value] = rawArg.replace(/^--/, "").split("=");
    if (key === "limit" && value) {
      const parsed = parseInt(value, 10);
      if (parsed > 0) args.limit = parsed;
    }
    if (key === "dry-run") args.dryRun = true;
    if (key === "clean") args.clean = true;
    if (key === "queries" && value) {
      args.queries = value.split(",").map((q) => q.trim()).filter(Boolean);
    }
  }

  return args;
};

/**
 * Xác định category dựa trên title/description
 */
const detectCategory = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(keyword)) return category;
  }
  return "Engineering"; // default
};

/**
 * Chọn thumbnail chất lượng cao nhất từ YouTube snippet
 */
const getBestThumbnail = (thumbnails) => {
  if (!thumbnails) return null;
  // Ưu tiên: maxres > standard > high > medium > default
  return (
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    null
  );
};

/**
 * Parse ISO 8601 duration (PT1H2M3S) sang giây
 */
const parseDuration = (isoDuration) => {
  if (!isoDuration) return 0;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Làm sạch description YouTube (bỏ link, rút gọn)
 */
const cleanDescription = (desc) => {
  if (!desc) return "";
  return desc
    .replace(/https?:\/\/[^\s]+/g, "") // Bỏ URLs
    .replace(/\n{3,}/g, "\n\n") // Giảm xuống dòng liên tiếp
    .trim()
    .slice(0, 1000); // Giới hạn 1000 ký tự
};

// ─── YOUTUBE API ──────────────────────────────────────────────────────────────

/**
 * Gọi YouTube Data API v3 — Search videos
 */
const youtubeSearch = async (apiKey, query, maxResults = 25) => {
  const url = new URL(`${YOUTUBE_API_BASE}/search`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("order", "relevance");
  url.searchParams.set("videoDuration", "medium"); // 4-20 phút
  url.searchParams.set("relevanceLanguage", "en");
  url.searchParams.set("safeSearch", "strict");

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube Search API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.items || [];
};

/**
 * Gọi YouTube Data API v3 — Lấy chi tiết video (duration, stats)
 */
const youtubeVideoDetails = async (apiKey, videoIds) => {
  if (!videoIds.length) return [];

  const url = new URL(`${YOUTUBE_API_BASE}/videos`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("part", "contentDetails,statistics");
  url.searchParams.set("id", videoIds.join(","));

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube Videos API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.items || [];
};

/**
 * Crawl metadata từ YouTube cho một query
 */
const crawlYouTubeMetadata = async (apiKey, query, maxResults = 25) => {
  log(`Searching YouTube: "${query}" (max ${maxResults})...`);

  const searchResults = await youtubeSearch(apiKey, query, maxResults);
  if (!searchResults.length) {
    warn(`No results for "${query}"`);
    return [];
  }

  // Lấy video IDs để query thêm duration + stats
  const videoIds = searchResults.map((item) => item.id.videoId).filter(Boolean);
  const details = await youtubeVideoDetails(apiKey, videoIds);

  // Merge search results + details
  const detailsMap = new Map(details.map((d) => [d.id, d]));

  const results = searchResults
    .filter((item) => item.id.videoId && item.snippet)
    .map((item) => {
      const snippet = item.snippet;
      const detail = detailsMap.get(item.id.videoId);

      return {
        youtubeId: item.id.videoId,
        title: snippet.title || "Untitled",
        description: cleanDescription(snippet.description),
        channelName: snippet.channelTitle || "Unknown Creator",
        thumbnailUrl: getBestThumbnail(snippet.thumbnails),
        publishedAt: snippet.publishedAt,
        duration: detail
          ? parseDuration(detail.contentDetails?.duration)
          : 600, // default 10 phút
        viewCount: detail
          ? parseInt(detail.statistics?.viewCount || "0", 10)
          : 0,
        category: detectCategory(snippet.title, snippet.description),
        searchQuery: query,
      };
    });

  log(`  → Got ${results.length} results for "${query}"`);
  return results;
};

// ─── DATABASE OPERATIONS ──────────────────────────────────────────────────────

/**
 * Lấy tất cả "Video Gốc" đã xử lý xong (READY + có HLS)
 */
const getAnchorVideos = async () => {
  const videos = await prisma.video.findMany({
    where: {
      status: "READY",
      metadata: {
        is: {
          hlsMasterUrl: { not: null },
        },
      },
    },
    include: {
      metadata: true,
      creator: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Ưu tiên video có đầy đủ subtitle + AI summary
  const premium = videos.filter(
    (v) => v.metadata?.subtitleUrl && v.metadata?.aiSummary,
  );

  // Nếu có premium anchors, chỉ dùng những cái đó (demo đẹp hơn nhiều)
  if (premium.length > 0) {
    log(`Found ${premium.length} premium anchor(s) (with subtitle + AI summary) — using these only.`);
    return premium;
  }

  return videos;
};

/**
 * Lấy danh sách demo users để phân bổ làm creator
 */
const getDemoUsers = async () => {
  const users = await prisma.user.findMany({
    where: {
      email: { contains: "waypoint.com" },
      status: "ACTIVE",
    },
    select: { id: true, fullName: true, email: true, role: true },
  });

  // Fallback: lấy bất kỳ user nào nếu không có demo users
  if (!users.length) {
    return prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true, email: true, role: true },
      take: 5,
    });
  }

  return users;
};

/**
 * Kiểm tra video YouTube đã được seed chưa (tránh trùng lặp)
 */
const isAlreadySeeded = async (youtubeId) => {
  const existing = await prisma.video.findFirst({
    where: {
      description: { contains: `${SEED_MARKER}:${youtubeId}` },
    },
    select: { id: true },
  });
  return !!existing;
};

/**
 * Insert một video metadata vào DB, ghép với Video Gốc ngẫu nhiên
 */
const insertSeededVideo = async ({ metadata, anchorVideo, creator }) => {
  // Tạo description có marker để dễ quản lý
  const fullDescription = [
    metadata.description,
    "",
    `───────────────────────────────────`,
    `${SEED_MARKER}:${metadata.youtubeId}`,
    `Source: YouTube (${metadata.channelName})`,
    `Original URL: https://youtube.com/watch?v=${metadata.youtubeId}`,
    `Anchor Video: ${anchorVideo.id}`,
    `Seed note: Metadata demo for Smart VOD showcase.`,
  ].join("\n");

  // Tạo Video record — status READY luôn, bỏ qua moderation
  const video = await prisma.video.create({
    data: {
      creatorId: creator.id,
      title: metadata.title,
      description: fullDescription,
      thumbnailUrl: metadata.thumbnailUrl, // Thumbnail từ YouTube
      category: metadata.category,
      visibility: "PUBLIC",
      status: "READY", // Bypass moderation
      viewCount: Math.floor(Math.random() * 450) + 50, // Random 50-500
    },
  });

  // Tạo VideoMetadata — ghép HLS + Subtitle từ Video Gốc
  await prisma.videoMetadata.create({
    data: {
      videoId: video.id,
      hlsMasterUrl: anchorVideo.metadata.hlsMasterUrl, // ← Ghép từ Video Gốc
      subtitleUrl: anchorVideo.metadata.subtitleUrl, // ← Ghép từ Video Gốc
      aiSummary: anchorVideo.metadata.aiSummary, // ← Ghép từ Video Gốc
      duration: metadata.duration || anchorVideo.metadata.duration || 600,
    },
  });

  return video;
};

/**
 * Xóa tất cả video seed YouTube cũ
 */
const cleanSeededVideos = async () => {
  const seeded = await prisma.video.findMany({
    where: { description: { contains: SEED_MARKER } },
    select: { id: true, title: true },
  });

  if (!seeded.length) {
    log("No seeded YouTube videos found to clean.");
    return 0;
  }

  // Xóa metadata trước (FK constraint)
  await prisma.videoMetadata.deleteMany({
    where: { videoId: { in: seeded.map((v) => v.id) } },
  });

  // Xóa likes, comments, watch history
  await prisma.like.deleteMany({
    where: { videoId: { in: seeded.map((v) => v.id) } },
  });
  await prisma.comment.deleteMany({
    where: { videoId: { in: seeded.map((v) => v.id) } },
  });
  await prisma.watchHistory.deleteMany({
    where: { videoId: { in: seeded.map((v) => v.id) } },
  });
  await prisma.playlistItem.deleteMany({
    where: { videoId: { in: seeded.map((v) => v.id) } },
  });

  // Xóa videos
  await prisma.video.deleteMany({
    where: { id: { in: seeded.map((v) => v.id) } },
  });

  success(`Cleaned ${seeded.length} seeded YouTube video(s).`);
  return seeded.length;
};

// ─── SOCIAL DATA SEEDING ──────────────────────────────────────────────────────

/**
 * Tạo likes, comments, watch history cho videos đã seed
 */
const seedSocialData = async (videos, users) => {
  const commentTemplates = [
    "Excellent content! This is exactly what our team needed for the quarterly review.",
    "Very clear explanation. I've bookmarked this for our onboarding playlist.",
    "Great production quality. The examples are practical and easy to follow.",
    "This would be perfect for our internal training program. Sharing with the team!",
    "Solid overview of the topic. Would love to see a deeper dive in part 2.",
    "The pacing is just right — not too fast, not too slow. Well done!",
    "I appreciate the real-world examples. Makes it much easier to understand.",
    "Useful reference material. Our engineering team will benefit from this.",
    "Clear and concise. This is how technical content should be presented.",
    "Adding this to our required learning path. Essential viewing for new hires.",
  ];

  let totalLikes = 0;
  let totalComments = 0;
  let totalHistory = 0;

  for (const [index, video] of videos.entries()) {
    // Chọn random 3-6 users để tương tác
    const interactingUsers = users
      .filter((u) => u.id !== video.creatorId)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 4) + 3);

    for (const user of interactingUsers) {
      // Like
      try {
        await prisma.like.create({
          data: { userId: user.id, videoId: video.id },
        });
        totalLikes++;
      } catch {
        // Duplicate — ignore
      }

      // Watch History
      const lastSecond = Math.floor(Math.random() * 300) + 30;
      const daysAgo = Math.floor(Math.random() * 30);
      const watchedAt = new Date();
      watchedAt.setDate(watchedAt.getDate() - daysAgo);

      try {
        const existing = await prisma.watchHistory.findFirst({
          where: { userId: user.id, videoId: video.id },
        });
        if (!existing) {
          await prisma.watchHistory.create({
            data: {
              userId: user.id,
              videoId: video.id,
              lastSecond,
              watchedAt,
            },
          });
          totalHistory++;
        }
      } catch {
        // Ignore duplicates
      }
    }

    // Comments (2-3 per video)
    const numComments = Math.floor(Math.random() * 2) + 2;
    const commentUsers = interactingUsers.slice(0, numComments);

    for (const [ci, user] of commentUsers.entries()) {
      const content =
        commentTemplates[(index * 3 + ci) % commentTemplates.length];
      try {
        const existing = await prisma.comment.findFirst({
          where: { userId: user.id, videoId: video.id, content },
        });
        if (!existing) {
          const commentDate = new Date();
          commentDate.setDate(
            commentDate.getDate() - Math.floor(Math.random() * 14),
          );
          await prisma.comment.create({
            data: {
              userId: user.id,
              videoId: video.id,
              content,
              createdAt: commentDate,
            },
          });
          totalComments++;
        }
      } catch {
        // Ignore
      }
    }
  }

  log(
    `Social data: ${totalLikes} likes, ${totalComments} comments, ${totalHistory} history entries.`,
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const run = async () => {
  const args = parseArgs(process.argv);
  const apiKey = process.env.YOUTUBE_API_KEY;

  log("═══════════════════════════════════════════════════════════════");
  log("  Smart VOD — YouTube Metadata Seeder");
  log("═══════════════════════════════════════════════════════════════");
  log(`  Limit: ${args.limit} videos`);
  log(`  Dry Run: ${args.dryRun}`);
  log(`  Clean Mode: ${args.clean}`);
  log("");

  // ── CLEAN MODE ──
  if (args.clean) {
    await cleanSeededVideos();
    log("Done.");
    return;
  }

  // ── VALIDATE ──
  if (!apiKey) {
    error("YOUTUBE_API_KEY is not set in .env file!");
    error("Get your free API key at: https://console.cloud.google.com");
    error('  1. Create project → Enable "YouTube Data API v3"');
    error("  2. Create API Key → Add to .env as YOUTUBE_API_KEY=...");
    process.exitCode = 1;
    return;
  }

  // ── CHECK ANCHOR VIDEOS ──
  const anchorVideos = await getAnchorVideos();
  if (!anchorVideos.length) {
    error("No READY videos with HLS found in database!");
    error("Please upload and process at least 1-3 videos first.");
    error("These will serve as anchor videos for the seeding strategy.");
    process.exitCode = 1;
    return;
  }

  log(`Found ${anchorVideos.length} anchor video(s):`);
  for (const v of anchorVideos) {
    log(`  → "${v.title}" (${v.id})`);
    log(`    HLS: ${v.metadata?.hlsMasterUrl ? "✅" : "❌"}`);
    log(`    Subtitle: ${v.metadata?.subtitleUrl ? "✅" : "❌"}`);
    log(`    AI Summary: ${v.metadata?.aiSummary ? "✅" : "❌"}`);
  }
  log("");

  // ── GET DEMO USERS ──
  const users = await getDemoUsers();
  if (!users.length) {
    error("No active users found. Run seed-demo-content.js first.");
    process.exitCode = 1;
    return;
  }
  log(`Using ${users.length} user(s) as creators.\n`);

  // ── CRAWL YOUTUBE METADATA ──
  const queries = args.queries || DEFAULT_SEARCH_QUERIES;
  const allMetadata = [];
  const seenYoutubeIds = new Set();

  // Tính toán: cần bao nhiêu kết quả mỗi query
  const resultsPerQuery = Math.ceil(args.limit / queries.length) + 5; // +5 buffer

  for (const query of queries) {
    if (allMetadata.length >= args.limit * 1.5) break; // Đủ rồi, dừng

    try {
      const results = await crawlYouTubeMetadata(
        apiKey,
        query,
        Math.min(resultsPerQuery, 50), // YouTube API max 50/request
      );

      for (const item of results) {
        if (seenYoutubeIds.has(item.youtubeId)) continue;
        seenYoutubeIds.add(item.youtubeId);
        allMetadata.push(item);
      }

      // Rate limiting — chờ 200ms giữa các request
      await sleep(200);
    } catch (err) {
      warn(`Failed to crawl "${query}": ${err.message}`);
    }
  }

  log(`\nTotal unique metadata crawled: ${allMetadata.length}`);

  if (!allMetadata.length) {
    error("No metadata crawled from YouTube. Check your API key and quota.");
    process.exitCode = 1;
    return;
  }

  // ── INSERT INTO DATABASE ──
  log(`\nInserting up to ${args.limit} video(s) into database...\n`);

  let inserted = 0;
  let skipped = 0;

  for (const metadata of allMetadata) {
    if (inserted >= args.limit) break;

    // Check trùng lặp
    if (await isAlreadySeeded(metadata.youtubeId)) {
      skipped++;
      continue;
    }

    if (args.dryRun) {
      log(`  [DRY] Would seed: "${metadata.title}" → Anchor: ${anchorVideos[inserted % anchorVideos.length].title}`);
      inserted++;
      continue;
    }

    // ═══ ĐIỂM ĂN TIỀN: Random chọn Video Gốc ═══
    const anchorVideo =
      anchorVideos[Math.floor(Math.random() * anchorVideos.length)];

    // Random chọn creator
    const creator = users[Math.floor(Math.random() * users.length)];

    try {
      const video = await insertSeededVideo({
        metadata,
        anchorVideo,
        creator,
      });

      inserted++;
      if (inserted % 10 === 0 || inserted === args.limit) {
        log(`  Progress: ${inserted}/${args.limit} inserted`);
      }
    } catch (err) {
      warn(`Failed to insert "${metadata.title}": ${err.message}`);
    }
  }

  log(`\n╔═══════════════════════════════════════╗`);
  log(`║  SEEDING COMPLETE                     ║`);
  log(`╠═══════════════════════════════════════╣`);
  log(`║  Inserted: ${String(inserted).padEnd(25)}║`);
  log(`║  Skipped (duplicates): ${String(skipped).padEnd(14)}║`);
  log(`║  Anchor videos used: ${String(anchorVideos.length).padEnd(16)}║`);
  log(`╚═══════════════════════════════════════╝`);

  // ── SEED SOCIAL DATA ──
  if (!args.dryRun && inserted > 0) {
    log("\nSeeding social data (likes, comments, watch history)...");
    const seededVideos = await prisma.video.findMany({
      where: { description: { contains: SEED_MARKER } },
      select: { id: true, creatorId: true },
    });
    await seedSocialData(seededVideos, users);
  }

  success("All done! Your frontend should now show a beautiful library of content.");
  log("");
};

// ─── EXECUTE ──────────────────────────────────────────────────────────────────

run()
  .catch((err) => {
    console.error("[seed-youtube] Fatal error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await redisClient.quit();
    } catch {
      // ignore
    }
    await prisma.$disconnect();
  });
