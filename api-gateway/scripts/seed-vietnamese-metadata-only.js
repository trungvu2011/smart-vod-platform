/**
 * Update demo video shells only: title, description, thumbnail, category, view count.
 * This does not download videos, touch MinIO, enqueue BullMQ jobs, or modify HLS metadata.
 *
 * Usage:
 *   npm run seed:vietnamese-metadata-only -- --count=50 --allow-generated-metadata
 *   npm run seed:vietnamese-metadata-only -- --count=50 --use-youtube --allow-generated-metadata
 *   npm run seed:vietnamese-metadata-only -- --count=50 --use-youtube --paired-only
 */

const path = require("path");

process.env.DOTENV_CONFIG_QUIET = process.env.DOTENV_CONFIG_QUIET || "true";
require("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });
require("dotenv").config({ quiet: true });

const prisma = require("../src/config/prisma");
const searchService = require("../src/services/search.service");

const DEFAULT_COUNT = 50;
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const MIN_DURATION_SECONDS = 8 * 60;
const MAX_DURATION_SECONDS = 30 * 60;

const DEFAULT_SEARCH_QUERIES = [
  "dao tao noi bo tieng Viet",
  "ky nang lam viec tieng Viet",
  "hoc truc tuyen tieng Viet",
];

const CATEGORY_SEARCH_QUERIES = {
  Engineering: [
    "webinar lap trinh phan mem doanh nghiep tieng Viet",
    "dao tao backend nodejs doanh nghiep tieng Viet",
    "hoi thao cong nghe phan mem tieng Viet",
    "khoa hoc devops docker kubernetes tieng Viet",
  ],
  Security: [
    "webinar an toan thong tin doanh nghiep tieng Viet",
    "dao tao bao mat du lieu doanh nghiep tieng Viet",
    "hoi thao cyber security tieng Viet",
    "khoa hoc bao mat mang tieng Viet",
  ],
  Operations: [
    "webinar van hanh he thong doanh nghiep tieng Viet",
    "dao tao monitoring devops tieng Viet",
    "hoi thao quan tri ha tang cloud tieng Viet",
    "khoa hoc system administration tieng Viet",
  ],
  Marketing: [
    "webinar digital marketing doanh nghiep tieng Viet",
    "dao tao chien luoc noi dung marketing tieng Viet",
    "hoi thao truyen thong thuong hieu tieng Viet",
    "khoa hoc marketing B2B tieng Viet",
  ],
  Product: [
    "quan ly san pham tieng Viet",
    "thiet ke san pham tieng Viet",
    "product management tieng Viet",
  ],
  Sales: [
    "ky nang ban hang tieng Viet",
    "sales B2B tieng Viet",
    "cham soc khach hang tieng Viet",
  ],
  Leadership: [
    "ky nang lanh dao tieng Viet",
    "quan ly nhom tieng Viet",
    "giao tiep noi bo tieng Viet",
  ],
  Collaboration: [
    "lam viec nhom tieng Viet",
    "hop tac trong cong viec tieng Viet",
    "giao tiep nhom tieng Viet",
  ],
  Onboarding: [
    "dao tao nhan vien moi tieng Viet",
    "onboarding nhan vien tieng Viet",
    "huong dan nhan vien moi tieng Viet",
  ],
};

const CATEGORIES = Object.keys(CATEGORY_SEARCH_QUERIES);

const PROFESSIONAL_KEYWORDS = [
  "dao tao",
  "khoa hoc",
  "webinar",
  "hoi thao",
  "workshop",
  "training",
  "course",
  "doanh nghiep",
  "business",
  "professional",
  "kien thuc",
  "huong dan",
  "thuc hanh",
];

const CATEGORY_ACCEPT_KEYWORDS = {
  Engineering: [
    "lap trinh",
    "phan mem",
    "backend",
    "frontend",
    "node",
    "react",
    "api",
    "postgres",
    "docker",
    "kubernetes",
    "devops",
    "cong nghe thong tin",
  ],
  Security: [
    "bao mat",
    "an toan thong tin",
    "security",
    "cyber",
    "an ninh mang",
    "phishing",
    "token",
  ],
  Operations: [
    "van hanh he thong",
    "monitoring",
    "giam sat",
    "ha tang",
    "cloud",
    "devops",
    "server",
    "system administration",
    "data center",
  ],
  Marketing: [
    "marketing",
    "thuong hieu",
    "truyen thong",
    "content",
    "noi dung",
    "digital",
    "chien luoc",
  ],
  Product: ["san pham", "product", "ux", "ui", "backlog", "nguoi dung"],
  Sales: ["sales", "ban hang", "kinh doanh", "khach hang", "tu van"],
  Leadership: ["lanh dao", "quan ly", "leader", "leadership", "giao tiep", "team"],
  Collaboration: ["hop tac", "lam viec nhom", "teamwork", "giao tiep", "phoi hop"],
  Onboarding: ["onboarding", "nhan vien moi", "dao tao", "hoi nhap", "employee"],
};

const REJECT_KEYWORDS = [
  "bong da",
  "tin nhanh",
  "thoi su",
  "chinh tri",
  "cong an",
  "canh sat",
  "khoi to",
  "bat giu",
  "to lam",
  "nguyen phuong hang",
  "showbiz",
  "giai tri",
  "phim",
  "truyen",
  "hoat hinh",
  "baby doll",
  "bup be",
  "tre em",
  "cho be",
  "mau giao",
  "tieu hoc",
  "hoc sinh",
  "tieng trung",
  "tieng anh tre em",
  "nang tien ca",
  "sieu giau",
  "giau vs ngheo",
  "sadhguru",
  "tu vi",
  "bat dong san",
  "hang gia",
  "kim cuong",
  "tieng xo dang",
  "trung tam tieng",
  "lop hoc",
  "quan ly lop",
  "cnc",
  "crm",
  "ban hang",
  "pos",
  "bat dong san",
  "ke toan",
  "excel",
  "tai chinh",
  "du hoc",
  "tuyen dung",
  "phong van",
  "music video",
  "official mv",
  "lyric video",
];

const log = (message) => console.log(`[vn-metadata] ${message}`);
const warn = (message) => console.warn(`[vn-metadata] WARN: ${message}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseArgs = (argv) => {
  const args = {
    count: DEFAULT_COUNT,
    allowGeneratedMetadata: false,
    dryRun: false,
    useYoutube: false,
    pairedOnly: false,
  };

  const envFlag = (name) => {
    const value = process.env[name];
    return value === "true" || value === "1" || value === "";
  };

  for (const rawArg of argv.slice(2)) {
    if (!rawArg.startsWith("--")) continue;
    const [rawKey, rawValue] = rawArg.replace(/^--/, "").split("=");
    const value = rawValue === undefined ? true : rawValue;
    if (rawKey === "count" && typeof value === "string") {
      const parsed = parseInt(value, 10);
      if (parsed > 0) args.count = parsed;
    }
    if (rawKey === "allow-generated-metadata") args.allowGeneratedMetadata = true;
    if (rawKey === "dry-run") args.dryRun = true;
    if (rawKey === "use-youtube") args.useYoutube = true;
    if (rawKey === "paired-only") args.pairedOnly = true;
  }

  if (process.env.npm_config_count) {
    const parsed = parseInt(process.env.npm_config_count, 10);
    if (parsed > 0) args.count = parsed;
  }
  if (envFlag("npm_config_allow_generated_metadata")) args.allowGeneratedMetadata = true;
  if (envFlag("npm_config_dry_run")) args.dryRun = true;
  if (envFlag("npm_config_use_youtube")) args.useYoutube = true;
  if (envFlag("npm_config_paired_only")) args.pairedOnly = true;

  return args;
};

const normalizeCategory = (category) => {
  const normalized = String(category || "").trim().toLowerCase();
  return CATEGORIES.find((item) => item.toLowerCase() === normalized) || "Onboarding";
};

const decodeHtmlEntities = (value) =>
  String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const normalizeText = (value) =>
  decodeHtmlEntities(value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stripVietnameseMarks = (value) =>
  normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const hasAnyKeyword = (text, keywords) =>
  keywords.some((keyword) => text.includes(stripVietnameseMarks(keyword)));

const isProfessionalYoutubeMetadata = (item, category) => {
  const text = stripVietnameseMarks(
    `${item.title} ${item.description} ${item.channelName || ""}`,
  );
  const titleText = stripVietnameseMarks(`${item.title} ${item.channelName || ""}`);

  if (hasAnyKeyword(text, REJECT_KEYWORDS)) return false;

  const categoryKeywords =
    CATEGORY_ACCEPT_KEYWORDS[category] || CATEGORY_ACCEPT_KEYWORDS.Onboarding;
  const hasCategorySignal = hasAnyKeyword(titleText, categoryKeywords) || hasAnyKeyword(text, categoryKeywords);
  const hasProfessionalSignal = hasAnyKeyword(text, PROFESSIONAL_KEYWORDS);

  return hasCategorySignal && (hasProfessionalSignal || hasAnyKeyword(titleText, categoryKeywords));
};

const parseIsoDuration = (isoDuration) => {
  if (!isoDuration) return 0;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    parseInt(match[1] || "0", 10) * 3600 +
    parseInt(match[2] || "0", 10) * 60 +
    parseInt(match[3] || "0", 10)
  );
};

const cleanDescription = (description) =>
  normalizeText(description)
    .replace(/https?:\/\/[^\s]+/g, "")
    .slice(0, 1000)
    .trim();

const getBestThumbnail = (thumbnails) => {
  if (!thumbnails) return null;
  return (
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    null
  );
};

const youtubeSearch = async (apiKey, query, maxResults = 25) => {
  const url = new URL(`${YOUTUBE_API_BASE}/search`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("order", "relevance");
  url.searchParams.set("videoDuration", "medium");
  url.searchParams.set("relevanceLanguage", "vi");
  url.searchParams.set("regionCode", "VN");
  url.searchParams.set("safeSearch", "strict");

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text();
    if (response.status === 403 || response.status === 429) {
      const error = new Error(`YouTube quota/rate limit ${response.status}: ${body}`);
      error.isYoutubeQuotaError = true;
      throw error;
    }
    throw new Error(`YouTube Search API error ${response.status}: ${body}`);
  }
  const data = await response.json();
  return data.items || [];
};

const youtubeVideoDetails = async (apiKey, videoIds) => {
  if (!videoIds.length) return [];

  const url = new URL(`${YOUTUBE_API_BASE}/videos`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("part", "contentDetails,statistics");
  url.searchParams.set("id", videoIds.join(","));

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text();
    if (response.status === 403 || response.status === 429) {
      const error = new Error(`YouTube quota/rate limit ${response.status}: ${body}`);
      error.isYoutubeQuotaError = true;
      throw error;
    }
    throw new Error(`YouTube Videos API error ${response.status}: ${body}`);
  }
  const data = await response.json();
  return data.items || [];
};

const crawlMetadataForQuery = async (apiKey, query, category) => {
  const searchItems = await youtubeSearch(apiKey, query, 25);
  const ids = searchItems.map((item) => item.id?.videoId).filter(Boolean);
  const details = await youtubeVideoDetails(apiKey, ids);
  const detailsById = new Map(details.map((item) => [item.id, item]));

  return searchItems
    .filter((item) => item.id?.videoId && item.snippet)
    .map((item) => {
      const detail = detailsById.get(item.id.videoId);
      return {
        youtubeId: item.id.videoId,
        title: normalizeText(item.snippet.title || "Untitled"),
        description: cleanDescription(item.snippet.description || ""),
        channelName: normalizeText(item.snippet.channelTitle || ""),
        thumbnailUrl: getBestThumbnail(item.snippet.thumbnails),
        duration: parseIsoDuration(detail?.contentDetails?.duration),
        viewCount: parseInt(detail?.statistics?.viewCount || "0", 10),
        category,
      };
    })
    .filter((item) => {
      const valid =
        item.title &&
        item.thumbnailUrl &&
        item.duration >= MIN_DURATION_SECONDS &&
        item.duration <= MAX_DURATION_SECONDS &&
        isProfessionalYoutubeMetadata(item, category);

      return valid;
    });
};

const fetchMetadataForCategory = async (category, count) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const queries = CATEGORY_SEARCH_QUERIES[category] || DEFAULT_SEARCH_QUERIES;
  const seen = new Set();
  const items = [];

  for (const query of queries) {
    log(`Fetching ${category} metadata: "${query}"...`);
    let batch = [];
    try {
      batch = await crawlMetadataForQuery(apiKey, query, category);
    } catch (error) {
      if (error.isYoutubeQuotaError) {
        warn(`YouTube quota/rate limit hit while fetching ${category}; using curated fallback for remaining items.`);
        break;
      }
      throw error;
    }
    for (const item of batch) {
      if (seen.has(item.youtubeId)) continue;
      seen.add(item.youtubeId);
      items.push(item);
      if (items.length >= count) break;
    }
    if (items.length >= count) break;
    await sleep(7000);
  }

  return items.slice(0, count);
};

const CATEGORY_DEMO_TITLES = {
  Engineering: [
    "Kiến trúc backend cho hệ thống video nội bộ",
    "Thiết kế API ổn định cho nền tảng học trực tuyến",
    "Tối ưu PostgreSQL cho ứng dụng có nhiều người dùng",
    "Quản lý job xử lý video với Redis và BullMQ",
    "Quy trình review code và release an toàn",
    "Xây dựng frontend React để bảo trì dài hạn",
    "Giới thiệu Docker Compose cho môi trường dev",
    "Giám sát lỗi và hiệu năng trong ứng dụng Node.js",
    "Thực hành logging và tracing cho microservices",
    "Nền tảng HLS và lưu trữ media trong sản phẩm VOD",
  ],
  Security: [
    "Bảo mật tài khoản và phân quyền trong hệ thống nội bộ",
    "Nhận diện rủi ro phishing trong môi trường doanh nghiệp",
    "Nguyên tắc bảo vệ dữ liệu người dùng",
    "Kiểm soát truy cập cho admin và người dùng",
    "Quy trình xử lý sự cố an toàn thông tin",
    "Bảo mật API và token trong ứng dụng web",
    "Thực hành cấu hình môi trường production an toàn",
    "Checklist bảo mật trước khi release",
  ],
  Operations: [
    "Giám sát tình trạng server và các service quan trọng",
    "Vận hành PostgreSQL Redis MinIO và Elasticsearch",
    "Quy trình xử lý incident trong hệ thống Smart VOD",
    "Theo dõi queue xử lý video và worker heartbeat",
    "Quản lý tài nguyên CPU RAM disk trên VM",
    "Backup restore database cho môi trường demo",
    "Kiểm tra health check trước và sau deployment",
    "Vận hành LiveKit và dịch vụ streaming nội bộ",
  ],
  Marketing: [
    "Lập kế hoạch nội dung cho chiến dịch truyền thông",
    "Xây dựng thông điệp sản phẩm cho khách hàng mục tiêu",
    "Phân tích hành vi người xem để tối ưu nội dung",
    "Quy trình sản xuất video marketing ngắn gọn",
    "Đo lường hiệu quả chiến dịch bằng analytics",
    "Xây dựng thương hiệu qua nội dung đào tạo",
    "Từ ý tưởng đến lịch đăng nội dung hằng tháng",
    "Tối ưu thumbnail và tiêu đề cho nội dung nội bộ",
  ],
  Product: [
    "Xác định nhu cầu người dùng trước khi phát triển tính năng",
    "Ưu tiên backlog bằng tác động và độ phức tạp",
    "Viết yêu cầu sản phẩm rõ ràng cho team kỹ thuật",
    "Đọc analytics để cải thiện trải nghiệm học tập",
    "Quy trình feedback và lập kế hoạch iteration",
    "Thiết kế luồng người dùng cho tính năng video",
  ],
  Sales: [
    "Kỹ năng trình bày giá trị sản phẩm cho khách hàng",
    "Xây dựng kịch bản demo ngắn gọn và thuyết phục",
    "Quản lý pipeline và theo dõi cơ hội bán hàng",
    "Xử lý phản đối trong quá trình tư vấn",
    "Đồng bộ sales và marketing trong chiến dịch mới",
  ],
  Leadership: [
    "Kỹ năng giao tiếp cho quản lý nhóm",
    "Ra quyết định dựa trên dữ liệu và mục tiêu",
    "Xây dựng văn hóa feedback trong team",
    "Dẫn dắt cuộc họp ngắn gọn và có kết quả",
    "Ủy quyền và theo dõi tiến độ công việc",
    "Quản lý thay đổi trong giai đoạn tăng trưởng",
  ],
  Collaboration: [
    "Làm việc nhóm hiệu quả trong môi trường hybrid",
    "Phối hợp giữa product engineering và operations",
    "Chuẩn hóa tài liệu để chia sẻ tri thức nội bộ",
    "Quy tắc giao tiếp bất đồng bộ trong team",
    "Tổ chức retrospective để cải thiện quy trình",
  ],
  Onboarding: [
    "Giới thiệu Smart VOD cho nhân viên mới",
    "Lộ trình học tập tuần đầu tiên tại công ty",
    "Các công cụ nội bộ cần biết khi bắt đầu công việc",
    "Văn hóa làm việc và nguyên tắc phối hợp",
    "Hướng dẫn sử dụng playlist đào tạo bắt buộc",
    "Checklist hoàn thành onboarding cho nhân viên mới",
  ],
};

const CATEGORY_DESCRIPTIONS = {
  Engineering: "Nội dung đào tạo kỹ thuật dành cho đội ngũ phát triển sản phẩm và nền tảng.",
  Security: "Nội dung giúp nhân viên nắm các nguyên tắc bảo mật và bảo vệ dữ liệu.",
  Operations: "Nội dung vận hành hệ thống, theo dõi hạ tầng và xử lý sự cố dịch vụ.",
  Marketing: "Nội dung về chiến lược truyền thông, sản xuất nội dung và đo lường hiệu quả.",
  Product: "Nội dung về quản lý sản phẩm, ưu tiên tính năng và cải thiện trải nghiệm người dùng.",
  Sales: "Nội dung hỗ trợ tư vấn, demo sản phẩm và quản lý cơ hội kinh doanh.",
  Leadership: "Nội dung phát triển năng lực quản lý, giao tiếp và ra quyết định.",
  Collaboration: "Nội dung cải thiện cách phối hợp, chia sẻ tri thức và làm việc liên phòng ban.",
  Onboarding: "Nội dung hướng dẫn nhân viên mới làm quen với công cụ, quy trình và văn hóa.",
};

const CATEGORY_THUMBNAILS = {
  Engineering: "https://img.youtube.com/vi/70j3UJO-_uY/hqdefault.jpg",
  Security: "https://img.youtube.com/vi/prBFBAh46NM/hqdefault.jpg",
  Operations: "https://img.youtube.com/vi/VV0kaiZI6ik/hqdefault.jpg",
  Marketing: "https://img.youtube.com/vi/_54cN5BkONg/hqdefault.jpg",
  Product: "https://img.youtube.com/vi/_54cN5BkONg/hqdefault.jpg",
  Sales: "https://img.youtube.com/vi/_54cN5BkONg/hqdefault.jpg",
  Leadership: "https://img.youtube.com/vi/VV0kaiZI6ik/hqdefault.jpg",
  Collaboration: "https://img.youtube.com/vi/70j3UJO-_uY/hqdefault.jpg",
  Onboarding: "https://img.youtube.com/vi/70j3UJO-_uY/hqdefault.jpg",
};

const generateFallbackMetadata = (category, count) =>
  Array.from({ length: count }, (_, index) => {
    const titles = CATEGORY_DEMO_TITLES[category] || CATEGORY_DEMO_TITLES.Onboarding;
    const title = titles[index % titles.length];
    const part = Math.floor(index / titles.length) + 1;
    return {
      title: part > 1 ? `${title} - Phần ${part}` : title,
      description: CATEGORY_DESCRIPTIONS[category] || CATEGORY_DESCRIPTIONS.Onboarding,
      thumbnailUrl: CATEGORY_THUMBNAILS[category] || CATEGORY_THUMBNAILS.Onboarding,
      viewCount: 100 + index * 31,
      category,
    };
  });

const applyYoutubeThumbnails = (curatedItems, youtubeItems) => {
  if (!youtubeItems.length) return curatedItems;

  return curatedItems.map((item, index) => {
    const youtubeItem = youtubeItems[index % youtubeItems.length];
    return {
      ...item,
      thumbnailUrl: youtubeItem.thumbnailUrl || item.thumbnailUrl,
      youtubeSourceTitle: youtubeItem.title,
    };
  });
};

const takeMetadataForCategory = (pool, category) => {
  let index = pool.findIndex((item) => item.category === category);
  if (index === -1) index = 0;
  return pool.splice(index, 1)[0] || null;
};

const takePairedMetadataForCategory = (pool, category) => {
  const index = pool.findIndex((item) => item.category === category && item.youtubeId);
  if (index === -1) return null;
  return pool.splice(index, 1)[0];
};

const loadTargetVideos = async (count) => {
  const videos = await prisma.video.findMany({
    where: {
      status: "READY",
      metadata: {
        is: {
          hlsMasterUrl: { not: null },
        },
      },
    },
    take: count,
    orderBy: { createdAt: "desc" },
    include: { metadata: true },
  });

  return videos.map((video) => ({
    ...video,
    category: normalizeCategory(video.category),
  }));
};

const buildMetadataPool = async ({ videos, allowGeneratedMetadata, useYoutube, pairedOnly }) => {
  const pool = [];
  const categoryCounts = new Map();

  for (const video of videos) {
    categoryCounts.set(video.category, (categoryCounts.get(video.category) || 0) + 1);
  }

  for (const [category, count] of categoryCounts.entries()) {
    let items = pairedOnly ? [] : generateFallbackMetadata(category, count);

    if (useYoutube) {
      const youtubeItems = await fetchMetadataForCategory(category, count);
      if (!youtubeItems.length && !allowGeneratedMetadata && !pairedOnly) {
        throw new Error(`No professional YouTube thumbnail candidates found for ${category}. Re-run with --allow-generated-metadata.`);
      }
      if (youtubeItems.length < count) {
        warn(`Only found ${youtubeItems.length}/${count} YouTube thumbnail candidate(s) for ${category}; reusing/falling back where needed.`);
      }
      items = youtubeItems.map((item) => ({
        ...item,
        description: item.description || CATEGORY_DESCRIPTIONS[category] || CATEGORY_DESCRIPTIONS.Onboarding,
      }));

      if (!pairedOnly && items.length < count) {
        const fallbackItems = generateFallbackMetadata(category, count);
        items.push(...applyYoutubeThumbnails(fallbackItems.slice(items.length), youtubeItems));
      }
    }

    pool.push(...items.slice(0, count));
  }

  return pool;
};

const updateVideos = async ({ videos, metadataPool, dryRun, pairedOnly }) => {
  let updated = 0;
  let skipped = 0;

  for (const [index, video] of videos.entries()) {
    const item = pairedOnly
      ? takePairedMetadataForCategory(metadataPool, video.category)
      : takeMetadataForCategory(metadataPool, video.category);
    if (!item) {
      skipped += 1;
      warn(`Skipping ${video.id} [${video.category}] because no paired YouTube metadata is available.`);
      continue;
    }

    const viewCount = Math.max(
      video.viewCount || 0,
      Math.min(9000, Math.floor((item.viewCount || 0) / 1000) + index * 11 + 90),
    );

    log(`${dryRun ? "Would update" : "Updating"} ${video.id} [${video.category}] -> ${item.title}`);

    if (!dryRun) {
      await prisma.video.update({
        where: { id: video.id },
        data: {
          title: item.title,
          description: item.description || null,
          thumbnailUrl: item.thumbnailUrl || video.thumbnailUrl,
          category: video.category,
          viewCount,
        },
      });
    }

    updated += 1;
  }

  return { updated, skipped };
};

const reindexSearch = async () => {
  try {
    const total = await searchService.reindexAllReadyVideos();
    log(`Reindexed ${total} READY video(s).`);
  } catch (error) {
    warn(`Search reindex skipped/failed: ${error.message}`);
  }
};

const main = async () => {
  const args = parseArgs(process.argv);
  const videos = await loadTargetVideos(args.count);

  if (!videos.length) {
    throw new Error(
      "No READY videos with HLS were found. Run the full Vietnamese demo seed successfully once before metadata-only updates.",
    );
  }

  log(`Found ${videos.length} READY video(s) to update.`);
  log(args.pairedOnly ? "Using paired YouTube title + thumbnail only." : args.useYoutube ? "Using YouTube metadata with curated fallback." : "Using curated in-system metadata.");
  const metadataPool = await buildMetadataPool({
    videos,
    allowGeneratedMetadata: args.allowGeneratedMetadata,
    useYoutube: args.useYoutube,
    pairedOnly: args.pairedOnly,
  });
  const { updated, skipped } = await updateVideos({
    videos,
    metadataPool,
    dryRun: args.dryRun,
    pairedOnly: args.pairedOnly,
  });

  if (!args.dryRun) await reindexSearch();
  log(`${args.dryRun ? "Dry run complete" : "Done"}. Updated ${updated} video shell(s), skipped ${skipped}.`);
};

main()
  .catch((error) => {
    console.error("[vn-metadata] Fatal error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
