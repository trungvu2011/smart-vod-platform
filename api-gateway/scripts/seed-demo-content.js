require("dotenv").config();

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { Readable, Transform } = require("stream");
const { pipeline } = require("stream/promises");
const bcrypt = require("bcryptjs");

const prisma = require("../src/config/prisma");
const minioClient = require("../src/config/minio");
const videoQueue = require("../src/config/queue");
const redisClient = require("../src/config/redis");
const adminService = require("../src/services/admin.service");

const DEMO_MARKER = "Demo seed source:";
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "Demo@123456";
const DEFAULT_LIMIT = 10;
const DEFAULT_WAIT_MINUTES = 45;
const DEFAULT_MAX_VIDEO_MB = 180;
const USER_AGENT = "SmartVODDemoSeeder/1.0 (seed demo content)";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const lessons = [
  {
    title: "Welcome to WayPoint Academy",
    category: "Onboarding",
    query: "corporate training team office",
    description:
      "A short orientation module for new employees to understand the learning platform, team culture, and daily workflows.",
  },
  {
    title: "Security Awareness Essentials",
    category: "Security",
    query: "cyber security office computer",
    description:
      "An introductory lesson on secure habits, safe collaboration, and practical risk awareness for every department.",
  },
  {
    title: "Product Launch Readiness",
    category: "Product",
    query: "product launch business presentation",
    description:
      "A product readiness session covering launch planning, cross-functional ownership, and go-to-market coordination.",
  },
  {
    title: "Engineering Knowledge Share",
    category: "Engineering",
    query: "software engineering coding teamwork",
    description:
      "A technical knowledge-sharing video for engineering teams, focused on collaboration and delivery quality.",
  },
  {
    title: "Customer Success Playbook",
    category: "Customer Success",
    query: "customer support call center business",
    description:
      "A practical customer success module about communication quality, escalation patterns, and account health.",
  },
  {
    title: "Data-Driven Operations Review",
    category: "Operations",
    query: "data dashboard analytics office",
    description:
      "An operations review module showing how teams can use data to improve delivery, response time, and planning.",
  },
  {
    title: "Remote Collaboration Standards",
    category: "Collaboration",
    query: "remote work video meeting",
    description:
      "A collaboration guide for distributed teams, including meeting hygiene, async updates, and decision tracking.",
  },
  {
    title: "Leadership Townhall Highlights",
    category: "Leadership",
    query: "leadership presentation conference",
    description:
      "A townhall-style update for leaders and teams, summarizing priorities, outcomes, and next-step alignment.",
  },
  {
    title: "Sales Enablement Briefing",
    category: "Sales",
    query: "sales meeting business team",
    description:
      "A sales enablement briefing about positioning, discovery conversations, and internal handoff discipline.",
  },
  {
    title: "Design Review Fundamentals",
    category: "Design",
    query: "design review product team",
    description:
      "A design review module for product teams, focused on critique, user context, and practical iteration.",
  },
  {
    title: "Cloud Platform Overview",
    category: "Engineering",
    query: "cloud computing data center technology",
    description:
      "A platform overview for technical and non-technical teams to understand cloud operations at a high level.",
  },
  {
    title: "Quality and Release Checklist",
    category: "Operations",
    query: "quality assurance checklist team",
    description:
      "A release readiness module covering quality gates, review practices, and post-launch follow-up.",
  },
];

const demoUsers = [
  {
    fullName: "An Nguyen",
    email: "demo.admin@waypoint.com",
    role: "ADMIN",
    department: "Learning Operations",
    title: "Platform Administrator",
  },
  {
    fullName: "Linh Tran",
    email: "demo.hr@waypoint.com",
    role: "USER",
    department: "People",
    title: "People Partner",
  },
  {
    fullName: "Minh Pham",
    email: "demo.engineering@waypoint.com",
    role: "USER",
    department: "Engineering",
    title: "Engineering Manager",
  },
  {
    fullName: "Huy Le",
    email: "demo.product@waypoint.com",
    role: "USER",
    department: "Product",
    title: "Product Lead",
  },
  {
    fullName: "Mai Vo",
    email: "demo.sales@waypoint.com",
    role: "USER",
    department: "Sales",
    title: "Account Executive",
  },
  {
    fullName: "Khoa Do",
    email: "demo.success@waypoint.com",
    role: "USER",
    department: "Customer Success",
    title: "Customer Success Manager",
  },
  {
    fullName: "Trang Bui",
    email: "demo.operations@waypoint.com",
    role: "USER",
    department: "Operations",
    title: "Operations Analyst",
  },
  {
    fullName: "Quang Ho",
    email: "demo.security@waypoint.com",
    role: "USER",
    department: "Security",
    title: "Security Specialist",
  },
];

const playlists = [
  {
    name: "Employee Onboarding",
    categories: ["Onboarding", "Collaboration", "Leadership"],
  },
  {
    name: "Security Essentials",
    categories: ["Security", "Engineering"],
  },
  {
    name: "Product and Go-to-Market",
    categories: ["Product", "Sales", "Customer Success", "Design"],
  },
  {
    name: "Engineering and Operations",
    categories: ["Engineering", "Operations"],
  },
];

const openSampleCandidates = [
  {
    sourceKey: "archive:BigBuckBunny_328/BigBuckBunny_512kb.mp4",
    sourceName: "Internet Archive",
    sourceUrl: "https://archive.org/details/BigBuckBunny_328",
    downloadUrl:
      "https://archive.org/download/BigBuckBunny_328/BigBuckBunny_512kb.mp4",
    author: "Blender Foundation",
    license: "Creative Commons Attribution 3.0",
    query: "open movie onboarding",
  },
  {
    sourceKey: "archive:ElephantsDream/ed_1024_512kb.mp4",
    sourceName: "Internet Archive",
    sourceUrl: "https://archive.org/details/ElephantsDream",
    downloadUrl: "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4",
    author: "Blender Foundation",
    license: "Creative Commons Attribution 2.5",
    query: "open movie engineering",
  },
  {
    sourceKey: "archive:Sintel/sintel-2048-stereo_512kb.mp4",
    sourceName: "Internet Archive",
    sourceUrl: "https://archive.org/details/Sintel",
    downloadUrl:
      "https://archive.org/download/Sintel/sintel-2048-stereo_512kb.mp4",
    author: "Blender Foundation",
    license: "Creative Commons Attribution 3.0",
    query: "open movie leadership",
  },
];

const parseArgs = (argv) => {
  const args = {
    limit: DEFAULT_LIMIT,
    source: "auto",
    waitMinutes: DEFAULT_WAIT_MINUTES,
    maxVideoMb: DEFAULT_MAX_VIDEO_MB,
    approveReady: false,
    noWait: false,
    dryRun: false,
  };

  for (const rawArg of argv.slice(2)) {
    const [key, value] = rawArg.replace(/^--/, "").split("=");
    if (key === "limit" && value) args.limit = parsePositiveInt(value, args.limit);
    if (key === "source" && value) args.source = value;
    if (key === "wait-minutes" && value) {
      args.waitMinutes = parsePositiveInt(value, args.waitMinutes);
    }
    if (key === "max-video-mb" && value) {
      args.maxVideoMb = parsePositiveInt(value, args.maxVideoMb);
    }
    if (key === "approve-ready") args.approveReady = true;
    if (key === "no-wait") args.noWait = true;
    if (key === "dry-run") args.dryRun = true;
  }

  if (!["auto", "pexels", "fallback"].includes(args.source)) {
    throw new Error("--source must be one of: auto, pexels, fallback");
  }

  return args;
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const log = (message) => console.log(`[seed-demo] ${message}`);
const warn = (message) => console.warn(`[seed-demo] ${message}`);

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const avatarUrlFor = (name) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

const uniqueBySourceKey = (items) => {
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    if (!item?.sourceKey || !item?.downloadUrl || seen.has(item.sourceKey)) continue;
    seen.add(item.sourceKey);
    unique.push(item);
  }
  return unique;
};

const safeJsonFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} from ${url}`);
  }
  return response.json();
};

const ensureBucket = async () => {
  const bucketName = process.env.MINIO_BUCKET_NAME;
  if (!bucketName) throw new Error("MINIO_BUCKET_NAME is required.");

  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, "us-east-1");
  }
  return bucketName;
};

const ensureDemoUsers = async () => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = [];

  for (const user of demoUsers) {
    const saved = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        role: user.role,
        status: "ACTIVE",
        department: user.department,
        title: user.title,
        avatarUrl: avatarUrlFor(user.fullName),
        passwordHash,
      },
      create: {
        ...user,
        status: "ACTIVE",
        avatarUrl: avatarUrlFor(user.fullName),
        passwordHash,
        videosViewed: 0,
        certifications: 0,
      },
    });
    users.push(saved);
  }

  log(`Ensured ${users.length} demo user(s). Default password: ${DEMO_PASSWORD}`);
  return users;
};

const countSeedVideos = async () =>
  prisma.video.count({
    where: {
      description: { contains: DEMO_MARKER },
      status: { notIn: ["FAILED", "BANNED"] },
    },
  });

const getReadySeedVideos = async () =>
  prisma.video.findMany({
    where: {
      description: { contains: DEMO_MARKER },
      status: "READY",
    },
    include: {
      metadata: true,
      creator: { select: { id: true, fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

const sourceAlreadySeeded = async (sourceKey) => {
  const existing = await prisma.video.findFirst({
    where: {
      description: { contains: `${DEMO_MARKER} ${sourceKey}` },
      status: { notIn: ["FAILED", "BANNED"] },
    },
    select: { id: true, title: true, status: true },
  });
  return existing;
};

const fetchPexelsCandidates = async (limit) => {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    if (limit > 0) warn("PEXELS_API_KEY is not set. Skipping Pexels.");
    return [];
  }

  const candidates = [];
  for (const lesson of lessons) {
    if (candidates.length >= limit) break;
    const url = new URL("https://api.pexels.com/v1/videos/search");
    url.searchParams.set("query", lesson.query);
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("per_page", "5");

    try {
      const payload = await safeJsonFetch(url.toString(), {
        headers: { Authorization: apiKey },
      });

      for (const video of payload.videos || []) {
        const file = choosePexelsVideoFile(video.video_files || []);
        if (!file) continue;

        candidates.push({
          sourceKey: `pexels:${video.id}`,
          sourceName: "Pexels",
          sourceUrl: video.url,
          downloadUrl: file.link,
          thumbnailUrl: video.image || null,
          author: video.user?.name || "Pexels contributor",
          license: "Pexels License",
          duration: video.duration || null,
          query: lesson.query,
        });
        if (candidates.length >= limit) break;
      }
    } catch (error) {
      warn(`Pexels query failed for "${lesson.query}": ${error.message}`);
    }
  }

  log(`Fetched ${candidates.length} Pexels candidate(s).`);
  return uniqueBySourceKey(candidates);
};

const choosePexelsVideoFile = (files) => {
  const mp4Files = files
    .filter((file) => file.file_type === "video/mp4" && file.link)
    .map((file) => ({
      ...file,
      height: Number(file.height || 0),
      width: Number(file.width || 0),
    }));

  if (!mp4Files.length) return null;

  const ranked = mp4Files.sort((a, b) => {
    const aScore = scoreVideoSize(a.width, a.height);
    const bScore = scoreVideoSize(b.width, b.height);
    return bScore - aScore;
  });

  return ranked[0];
};

const scoreVideoSize = (width, height) => {
  if (!width || !height) return 1;
  if (height <= 720 && height >= 360) return 1000 + height;
  if (height < 360) return 100 + height;
  return 500 - height;
};

const fetchFallbackCandidates = async (limit) => {
  const candidates = [...openSampleCandidates];

  if (candidates.length < limit) {
    candidates.push(...(await fetchNasaCandidates(limit - candidates.length)));
  }
  if (candidates.length < limit) {
    candidates.push(
      ...(await fetchWikimediaCandidates(limit - candidates.length)),
    );
  }
  if (candidates.length < limit) {
    candidates.push(
      ...(await fetchInternetArchiveCandidates(limit - candidates.length)),
    );
  }

  const unique = uniqueBySourceKey(candidates);
  log(`Fetched ${unique.length} fallback candidate(s).`);
  return unique;
};

const fetchNasaCandidates = async (limit) => {
  const candidates = [];
  const queries = [
    "technology",
    "mission control",
    "space station",
    "engineering",
    "data visualization",
  ];

  for (const query of queries) {
    if (candidates.length >= limit) break;
    const url = new URL("https://images-api.nasa.gov/search");
    url.searchParams.set("q", query);
    url.searchParams.set("media_type", "video");

    try {
      const payload = await safeJsonFetch(url.toString());
      const items = payload.collection?.items || [];

      for (const item of items.slice(0, 5)) {
        if (candidates.length >= limit) break;
        const data = item.data?.[0] || {};
        if (!data.nasa_id) continue;

        const asset = await findNasaVideoAsset(data.nasa_id);
        if (!asset) continue;

        candidates.push({
          sourceKey: `nasa:${data.nasa_id}`,
          sourceName: "NASA Image and Video Library",
          sourceUrl: item.href || `https://images.nasa.gov/details/${data.nasa_id}`,
          downloadUrl: asset,
          thumbnailUrl: item.links?.[0]?.href || null,
          author: data.center || "NASA",
          license: "NASA media usage guidelines",
          query,
        });
      }
    } catch (error) {
      warn(`NASA query failed for "${query}": ${error.message}`);
    }
  }

  return candidates;
};

const findNasaVideoAsset = async (nasaId) => {
  try {
    const payload = await safeJsonFetch(
      `https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`,
    );
    const hrefs = (payload.collection?.items || [])
      .map((item) => item.href)
      .filter(Boolean);

    const mp4s = hrefs.filter((href) => /\.mp4($|\?)/i.test(href));
    return (
      mp4s.find((href) => /~small|~mobile|preview/i.test(href)) ||
      mp4s.find((href) => !/~orig|~large/i.test(href)) ||
      mp4s[0] ||
      null
    );
  } catch {
    return null;
  }
};

const fetchWikimediaCandidates = async (limit) => {
  const candidates = [];
  const queries = [
    "technology filetype:video",
    "training filetype:video",
    "conference filetype:video",
    "computer filetype:video",
    "NASA filetype:video",
  ];

  for (const query of queries) {
    if (candidates.length >= limit) break;
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", query);
    url.searchParams.set("gsrnamespace", "6");
    url.searchParams.set("gsrlimit", "10");
    url.searchParams.set("prop", "imageinfo");
    url.searchParams.set("iiprop", "url|mime|size|extmetadata");
    url.searchParams.set("iiurlwidth", "1280");
    url.searchParams.set("iiextmetadatalanguage", "en");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    try {
      const payload = await safeJsonFetch(url.toString());
      const pages = Object.values(payload.query?.pages || {});
      for (const page of pages) {
        if (candidates.length >= limit) break;
        const info = page.imageinfo?.[0];
        if (!info?.url || !String(info.mime || "").startsWith("video/")) {
          continue;
        }
        const size = Number(info.size || 0);
        if (size && size > DEFAULT_MAX_VIDEO_MB * 1024 * 1024) continue;

        const metadata = info.extmetadata || {};
        candidates.push({
          sourceKey: `wikimedia:${page.title}`,
          sourceName: "Wikimedia Commons",
          sourceUrl:
            info.descriptionurl ||
            `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
          downloadUrl: info.url,
          thumbnailUrl: info.thumburl || null,
          author: cleanMetadataValue(metadata.Artist?.value) || "Wikimedia contributor",
          license:
            cleanMetadataValue(metadata.LicenseShortName?.value) ||
            cleanMetadataValue(metadata.UsageTerms?.value) ||
            "See Wikimedia file page",
          query,
        });
      }
    } catch (error) {
      warn(`Wikimedia query failed for "${query}": ${error.message}`);
    }
  }

  return candidates;
};

const cleanMetadataValue = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const fetchInternetArchiveCandidates = async (limit) => {
  const candidates = [];
  const queries = [
    "training",
    "technology",
    "education",
    "conference",
    "science",
    "software",
  ];

  for (const term of queries) {
    if (candidates.length >= limit) break;

    const searchUrl = new URL("https://archive.org/advancedsearch.php");
    searchUrl.searchParams.set(
      "q",
      `collection:(opensource_movies) AND mediatype:(movies) AND ${term}`,
    );
    searchUrl.searchParams.append("fl[]", "identifier");
    searchUrl.searchParams.append("fl[]", "title");
    searchUrl.searchParams.append("fl[]", "creator");
    searchUrl.searchParams.append("fl[]", "licenseurl");
    searchUrl.searchParams.set("rows", "10");
    searchUrl.searchParams.set("page", "1");
    searchUrl.searchParams.set("output", "json");

    try {
      const payload = await safeJsonFetch(searchUrl.toString());
      const docs = payload.response?.docs || [];
      for (const doc of docs) {
        if (candidates.length >= limit) break;
        const asset = await findInternetArchiveVideoAsset(doc.identifier);
        if (!asset) continue;

        candidates.push({
          sourceKey: `archive:${doc.identifier}/${asset.name}`,
          sourceName: "Internet Archive",
          sourceUrl: `https://archive.org/details/${doc.identifier}`,
          downloadUrl: `https://archive.org/download/${doc.identifier}/${encodeURIComponent(asset.name)}`,
          thumbnailUrl: null,
          author: Array.isArray(doc.creator)
            ? doc.creator.join(", ")
            : doc.creator || "Internet Archive contributor",
          license: Array.isArray(doc.licenseurl)
            ? doc.licenseurl.join(", ")
            : doc.licenseurl || "See Internet Archive item page",
          query: term,
        });
      }
    } catch (error) {
      warn(`Internet Archive query failed for "${term}": ${error.message}`);
    }
  }

  return candidates;
};

const findInternetArchiveVideoAsset = async (identifier) => {
  if (!identifier) return null;

  try {
    const metadata = await safeJsonFetch(
      `https://archive.org/metadata/${encodeURIComponent(identifier)}`,
    );
    const files = (metadata.files || [])
      .filter((file) => /\.(mp4|webm|ogv)$/i.test(file.name || ""))
      .filter((file) => {
        const size = Number(file.size || 0);
        return !size || size <= DEFAULT_MAX_VIDEO_MB * 1024 * 1024;
      })
      .sort((a, b) => Number(a.size || 0) - Number(b.size || 0));

    return files.find((file) => /\.mp4$/i.test(file.name)) || files[0] || null;
  } catch {
    return null;
  }
};

const fetchCandidates = async (args, needed) => {
  if (needed <= 0) return [];

  if (args.source === "pexels") {
    return fetchPexelsCandidates(needed * 2);
  }

  if (args.source === "fallback") {
    return fetchFallbackCandidates(needed * 3);
  }

  const pexelsCandidates = await fetchPexelsCandidates(needed * 2);
  if (pexelsCandidates.length >= needed) return pexelsCandidates;

  const fallbackCandidates = await fetchFallbackCandidates(
    Math.max(needed * 3, needed - pexelsCandidates.length),
  );
  return uniqueBySourceKey([...pexelsCandidates, ...fallbackCandidates]);
};

const buildDescription = ({ lesson, candidate }) => {
  const sourceLines = [
    "",
    `${DEMO_MARKER} ${candidate.sourceKey}`,
    `Provider: ${candidate.sourceName}`,
    `Source URL: ${candidate.sourceUrl || "N/A"}`,
    `Author: ${candidate.author || "N/A"}`,
    `License: ${candidate.license || "See source page"}`,
    "Seed note: Demo content for Smart VOD LMS showcase. Verify source terms before production use.",
  ];

  return [lesson.description, ...sourceLines].join("\n");
};

const chooseCreator = (users, index) => {
  const creators = users.filter((user) => user.role !== "ADMIN");
  return creators[index % creators.length] || users[0];
};

const extensionFrom = (url, mimeType) => {
  const pathname = (() => {
    try {
      return new URL(url).pathname;
    } catch {
      return "";
    }
  })();
  const ext = path.extname(pathname).toLowerCase();
  if ([".mp4", ".webm", ".ogv", ".mov", ".m4v"].includes(ext)) return ext;

  if (String(mimeType || "").includes("webm")) return ".webm";
  if (String(mimeType || "").includes("ogg")) return ".ogv";
  if (String(mimeType || "").includes("quicktime")) return ".mov";
  return ".mp4";
};

const contentTypeFrom = (mimeType, ext) => {
  if (mimeType && String(mimeType).startsWith("video/")) return mimeType;
  if (ext === ".webm") return "video/webm";
  if (ext === ".ogv") return "video/ogg";
  if (ext === ".mov") return "video/quicktime";
  return "video/mp4";
};

const downloadToTemp = async (url, maxBytes) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "smartvod-seed-"));
  const tempPath = path.join(tempDir, "source-video");
  let received = 0;

  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "video/*,*/*;q=0.8",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > maxBytes) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw new Error(
      `Source video is too large (${Math.ceil(contentLength / 1024 / 1024)} MB).`,
    );
  }

  const limiter = new Transform({
    transform(chunk, encoding, callback) {
      received += chunk.length;
      if (received > maxBytes) {
        callback(
          new Error(
            `Source video exceeded max size (${Math.ceil(maxBytes / 1024 / 1024)} MB).`,
          ),
        );
        return;
      }
      callback(null, chunk);
    },
  });

  try {
    await pipeline(
      Readable.fromWeb(response.body),
      limiter,
      fs.createWriteStream(tempPath),
    );
  } catch (error) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }

  return {
    tempDir,
    tempPath,
    bytes: received,
    mimeType: response.headers.get("content-type"),
  };
};

const createVideoFromCandidate = async ({
  candidate,
  lesson,
  creator,
  seedIndex,
  maxBytes,
  dryRun,
}) => {
  const existing = await sourceAlreadySeeded(candidate.sourceKey);
  if (existing) {
    log(`Skip existing video: ${existing.title} (${existing.status})`);
    return { created: false, video: existing };
  }

  const title = lesson.title;
  if (dryRun) {
    log(`Dry run: would seed "${title}" from ${candidate.sourceName}.`);
    return { created: false, video: null };
  }

  log(`Downloading "${title}" from ${candidate.sourceName}...`);
  const downloaded = await downloadToTemp(candidate.downloadUrl, maxBytes);

  try {
    const sourceHash = crypto
      .createHash("sha1")
      .update(candidate.sourceKey)
      .digest("hex")
      .slice(0, 16);
    const ext = extensionFrom(candidate.downloadUrl, downloaded.mimeType);
    const objectName = `demo/raw/${sourceHash}-${normalizeText(title)}${ext}`;
    const bucketName = await ensureBucket();
    const contentType = contentTypeFrom(downloaded.mimeType, ext);

    await minioClient.fPutObject(bucketName, objectName, downloaded.tempPath, {
      "Content-Type": contentType,
      "X-Amz-Meta-Seed-Source": sourceHash,
    });

    const video = await prisma.video.create({
      data: {
        creatorId: creator.id,
        title,
        description: buildDescription({ lesson, candidate }),
        category: lesson.category,
        visibility: "PUBLIC",
        status: "PENDING",
        viewCount: 25 + seedIndex * 7,
      },
    });

    const rawUrl = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${objectName}`;
    await videoQueue.add(
      "process-hls",
      {
        videoId: video.id,
        originalFilename: objectName,
        fileUrl: rawUrl,
        shouldGenerateThumbnail: true,
      },
      { jobId: video.id },
    );

    log(
      `Queued "${title}" (${Math.ceil(downloaded.bytes / 1024 / 1024)} MB) as ${video.id}.`,
    );
    return { created: true, video };
  } finally {
    fs.rmSync(downloaded.tempDir, { recursive: true, force: true });
  }
};

const seedVideos = async ({ args, users }) => {
  const existingCount = await countSeedVideos();
  const needed = Math.max(args.limit - existingCount, 0);

  if (needed <= 0) {
    log(`Found ${existingCount} demo video(s). Target ${args.limit} already met.`);
    return [];
  }

  const candidates = await fetchCandidates(args, needed);
  if (!candidates.length) {
    warn("No source candidates found. Nothing to seed.");
    return [];
  }

  const created = [];
  const maxBytes = args.maxVideoMb * 1024 * 1024;
  let lessonOffset = existingCount;

  for (const candidate of candidates) {
    if (created.length >= needed) break;

    const lesson = lessons[lessonOffset % lessons.length];
    const creator = chooseCreator(users, lessonOffset);
    lessonOffset += 1;

    try {
      const result = await createVideoFromCandidate({
        candidate,
        lesson,
        creator,
        seedIndex: existingCount + created.length,
        maxBytes,
        dryRun: args.dryRun,
      });
      if (result.created) created.push(result.video);
    } catch (error) {
      warn(`Skipping candidate ${candidate.sourceKey}: ${error.message}`);
    }
  }

  log(`Created ${created.length} new video job(s).`);
  return created;
};

const approveReadyDemoVideos = async () => {
  const readyForApproval = await prisma.video.findMany({
    where: {
      description: { contains: DEMO_MARKER },
      status: "PENDING",
      metadata: { is: { hlsMasterUrl: { not: null } } },
    },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  let approved = 0;
  for (const video of readyForApproval) {
    try {
      await adminService.approveVideo(video.id);
      approved += 1;
      log(`Approved "${video.title}".`);
    } catch (error) {
      warn(`Could not approve "${video.title}": ${error.message}`);
    }
  }

  return approved;
};

const waitForProcessingAndApprove = async ({ targetReadyCount, waitMinutes }) => {
  const deadline = Date.now() + waitMinutes * 60 * 1000;
  let lastStatusLine = "";

  while (Date.now() <= deadline) {
    await approveReadyDemoVideos();

    const [ready, pending, failed] = await Promise.all([
      prisma.video.count({
        where: { description: { contains: DEMO_MARKER }, status: "READY" },
      }),
      prisma.video.count({
        where: { description: { contains: DEMO_MARKER }, status: "PENDING" },
      }),
      prisma.video.count({
        where: { description: { contains: DEMO_MARKER }, status: "FAILED" },
      }),
    ]);

    const statusLine = `Processing status: READY=${ready}, PENDING=${pending}, FAILED=${failed}.`;
    if (statusLine !== lastStatusLine) {
      log(statusLine);
      lastStatusLine = statusLine;
    }

    if (ready >= targetReadyCount) return;
    if (waitMinutes <= 0) return;

    await sleep(30000);
  }

  warn(
    `Wait timed out after ${waitMinutes} minute(s). Run "node scripts/seed-demo-content.js --approve-ready" later.`,
  );
};

const ensurePlaylist = async (ownerId, name) => {
  const existing = await prisma.playlist.findFirst({
    where: { userId: ownerId, name },
  });
  if (existing) return existing;

  return prisma.playlist.create({
    data: {
      userId: ownerId,
      name,
      isPrivate: false,
    },
  });
};

const addPlaylistItemIfMissing = async (playlistId, videoId, order) => {
  const existing = await prisma.playlistItem.findUnique({
    where: { playlistId_videoId: { playlistId, videoId } },
  });
  if (existing) return existing;

  return prisma.playlistItem.create({
    data: { playlistId, videoId, order },
  });
};

const seedPlaylists = async ({ users, videos }) => {
  if (!videos.length) {
    warn("No READY demo videos available for playlists.");
    return;
  }

  const owner = users.find((user) => user.email === "demo.admin@waypoint.com") || users[0];
  let createdItems = 0;

  for (const playlistSpec of playlists) {
    const playlist = await ensurePlaylist(owner.id, playlistSpec.name);
    const matchingVideos = videos.filter((video) =>
      playlistSpec.categories.includes(video.category || ""),
    );
    const selectedVideos = matchingVideos.length ? matchingVideos : videos.slice(0, 3);

    let order = 1;
    for (const video of selectedVideos.slice(0, 8)) {
      await addPlaylistItemIfMissing(playlist.id, video.id, order);
      createdItems += 1;
      order += 1;
    }
  }

  log(`Ensured ${playlists.length} public playlist(s), touched ${createdItems} item slot(s).`);
};

const seedCommentsAndLikes = async ({ users, videos }) => {
  if (!videos.length) return;

  const commentSamples = [
    "Great overview. This is useful for onboarding new team members.",
    "Clear and practical. I would add this to our next training path.",
    "The examples make the topic much easier to discuss with the team.",
    "Good reference material for async learning.",
  ];

  let comments = 0;
  let likes = 0;
  let histories = 0;

  for (const [index, video] of videos.entries()) {
    const activeUsers = users.filter((user) => user.id !== video.creatorId);
    for (const user of activeUsers.slice(0, 4)) {
      const existingLike = await prisma.like.findUnique({
        where: { userId_videoId: { userId: user.id, videoId: video.id } },
      });
      if (!existingLike) {
        await prisma.like.create({ data: { userId: user.id, videoId: video.id } });
        likes += 1;
      }

      const duration = video.metadata?.duration || 600;
      const lastSecond = Math.max(15, Math.floor(duration * (0.2 + (index % 5) * 0.12)));
      const existingHistory = await prisma.watchHistory.findFirst({
        where: { userId: user.id, videoId: video.id },
      });
      if (existingHistory) {
        await prisma.watchHistory.update({
          where: { id: existingHistory.id },
          data: { lastSecond, watchedAt: daysAgo((index + 1) % 12) },
        });
      } else {
        await prisma.watchHistory.create({
          data: {
            userId: user.id,
            videoId: video.id,
            lastSecond,
            watchedAt: daysAgo((index + 1) % 12),
          },
        });
      }
      histories += 1;
    }

    for (const user of activeUsers.slice(0, 2)) {
      const content = commentSamples[(index + comments) % commentSamples.length];
      const existingComment = await prisma.comment.findFirst({
        where: { userId: user.id, videoId: video.id, content },
      });
      if (!existingComment) {
        await prisma.comment.create({
          data: { userId: user.id, videoId: video.id, content },
        });
        comments += 1;
      }
    }

    const targetViewCount = 80 + index * 37;
    if ((video.viewCount || 0) < targetViewCount) {
      await prisma.video.update({
        where: { id: video.id },
        data: { viewCount: targetViewCount },
      });
    }
  }

  log(`Ensured social data: ${likes} like(s), ${comments} comment(s), ${histories} history row touch(es).`);
};

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const seedSessionsAndNotifications = async (users) => {
  for (const [index, user] of users.entries()) {
    const existingSession = await prisma.session.findFirst({
      where: { userId: user.id, device: "Demo Browser - Chrome" },
    });
    if (!existingSession) {
      await prisma.session.create({
        data: {
          userId: user.id,
          device: "Demo Browser - Chrome",
          location: "Ho Chi Minh City, VN",
          lastActive: daysAgo(index % 5),
          isCurrent: index === 0,
        },
      });
    }

    const title = "Welcome to WayPoint Academy";
    const existingNotification = await prisma.notification.findFirst({
      where: { userId: user.id, title, type: "training" },
    });
    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "training",
          title,
          message: "Your demo learning library has been prepared with starter courses.",
          actionUrl: "/courses",
          read: index % 3 === 0,
        },
      });
    }
  }

  log(`Ensured sessions and welcome notifications for ${users.length} demo user(s).`);
};

const run = async () => {
  const args = parseArgs(process.argv);
  log(
    `Starting with limit=${args.limit}, source=${args.source}, wait=${args.noWait ? 0 : args.waitMinutes}m, maxVideo=${args.maxVideoMb}MB.`,
  );

  await ensureBucket();
  const users = await ensureDemoUsers();

  if (!args.approveReady) {
    await seedVideos({ args, users });
  }

  if (!args.noWait && !args.dryRun) {
    await waitForProcessingAndApprove({
      targetReadyCount: args.limit,
      waitMinutes: args.approveReady ? 0 : args.waitMinutes,
    });
  } else if (args.approveReady && !args.dryRun) {
    await approveReadyDemoVideos();
  }

  if (!args.dryRun) {
    const readyVideos = await getReadySeedVideos();
    await seedPlaylists({ users, videos: readyVideos });
    await seedCommentsAndLikes({ users, videos: readyVideos });
    await seedSessionsAndNotifications(users);
  }

  log("Done.");
};

run()
  .catch((error) => {
    console.error("[seed-demo] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await videoQueue.close();
    } catch {
      // ignore close errors
    }
    try {
      await redisClient.quit();
    } catch {
      // ignore close errors
    }
    await prisma.$disconnect();
  });
