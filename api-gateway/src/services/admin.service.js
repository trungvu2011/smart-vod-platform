const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { parse } = require("csv-parse/sync");
const prisma = require("../config/prisma");
const sseManager = require("./sse");
const redisClient = require("../config/redis");
const videoQueue = require("../config/queue");

const IMPORT_EMAIL_DOMAIN = "waypoint.com";
const VALID_ROLES = new Set(["USER", "ADMIN"]);

// ─── USER MANAGEMENT ──────────────────────────────────────────────────────────

const createUser = async ({ fullName, email, role, department, title }) => {
  if (!fullName || !email) {
    const err = new Error("Vui lòng cung cấp fullName và email!");
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email này đã được sử dụng!");
    err.statusCode = 409;
    throw err;
  }

  const defaultPassword = crypto.randomBytes(6).toString("hex"); 
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(defaultPassword, salt);

  const newUser = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash: hashedPassword,
      role: role || "USER",
      department: department || null,
      title: title || null,
    },
  });

  return {
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      department: newUser.department,
      title: newUser.title,
      createdAt: newUser.createdAt,
    },
    defaultPassword,
  };
};

const normalizeVietnameseText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

const toEmailToken = (value) =>
  normalizeVietnameseText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const buildEmailLocalPart = (fullName) => {
  const tokens = String(fullName || "")
    .trim()
    .split(/\s+/)
    .map(toEmailToken)
    .filter(Boolean);

  if (tokens.length === 0) return "";
  const givenName = tokens[tokens.length - 1];
  const initials = tokens.slice(0, -1).map((token) => token[0]).join("");
  return `${givenName}${initials}`;
};

const buildUniqueEmail = (fullName, usedEmails) => {
  const localPart = buildEmailLocalPart(fullName);
  if (!localPart) return "";

  let suffix = 1;
  let email = `${localPart}@${IMPORT_EMAIL_DOMAIN}`;
  while (usedEmails.has(email.toLowerCase())) {
    suffix += 1;
    email = `${localPart}${suffix}@${IMPORT_EMAIL_DOMAIN}`;
  }

  usedEmails.add(email.toLowerCase());
  return email;
};

const escapeCsvValue = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const rowsToCsv = (headers, rows) => [
  headers.join(","),
  ...rows.map((row) => row.map(escapeCsvValue).join(",")),
].join("\n");

const parseImportCsvRecords = (buffer) => {
  const encodings = ["utf8", "utf16le"];
  const delimiters = [",", ";", "\t"];
  const parsedCandidates = [];

  for (const encoding of encodings) {
    const text = buffer.toString(encoding);
    for (const delimiter of delimiters) {
      try {
        const records = parse(text, {
          bom: true,
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
          delimiter,
        });

        if (!records.length) continue;

        const firstRecord = records[0] || {};
        const keys = Object.keys(firstRecord).map((key) => key.toLowerCase().trim());
        const hasExpectedHeader = keys.some((key) => ["fullname", "full name"].includes(key));

        parsedCandidates.push({
          records,
          score: hasExpectedHeader ? 10 : 1,
        });
      } catch {
        // Try next encoding/delimiter candidate.
      }
    }
  }

  if (!parsedCandidates.length) {
    const err = new Error(
      "Invalid CSV format. Please use UTF-8/UTF-16 CSV with columns: fullName,department,title,role."
    );
    err.statusCode = 400;
    throw err;
  }

  parsedCandidates.sort((a, b) => b.score - a.score);
  return parsedCandidates[0].records;
};

const importUsersCsv = async (buffer) => {
  if (!buffer || !buffer.length) {
    const err = new Error("Please upload a CSV file.");
    err.statusCode = 400;
    throw err;
  }

  const records = parseImportCsvRecords(buffer);
  if (!records.length) {
    const err = new Error("CSV file has no data rows.");
    err.statusCode = 400;
    throw err;
  }

  const existingUsers = await prisma.user.findMany({ select: { email: true } });
  const usedEmails = new Set(existingUsers.map((user) => user.email.toLowerCase()));
  const rows = [];

  for (const [index, record] of records.entries()) {
    const rowNumber = index + 2;
    const fullName = String(record.fullName || record["Full Name"] || "").trim();
    const department = String(record.department || record.Department || "").trim();
    const title = String(record.title || record.Title || "").trim();
    const role = String(record.role || record.Role || "USER").trim().toUpperCase() || "USER";

    const baseOutput = [rowNumber, "", fullName, "", role, department, title, "", ""];

    try {
      if (!fullName) {
        throw new Error("fullName is required");
      }
      if (!VALID_ROLES.has(role)) {
        throw new Error("role must be USER or ADMIN");
      }

      const email = buildUniqueEmail(fullName, usedEmails);
      if (!email) {
        throw new Error("Cannot generate account email from fullName");
      }

      const defaultPassword = crypto.randomBytes(6).toString("hex");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      await prisma.user.create({
        data: {
          fullName,
          email,
          passwordHash: hashedPassword,
          role,
          department: department || null,
          title: title || null,
        },
      });

      rows.push([rowNumber, "CREATED", fullName, email, role, department, title, defaultPassword, ""]);
    } catch (error) {
      rows.push([...baseOutput.slice(0, 1), "FAILED", ...baseOutput.slice(2, 8), error.message]);
    }
  }

  const headers = ["row", "status", "fullName", "email", "role", "department", "title", "password", "error"];
  return rowsToCsv(headers, rows);
};

/**
 * Lấy danh sách user với search, filter, và pagination.
 */
const listUsers = async ({ search, department, status, role, page = 1, limit = 20 } = {}) => {
  const where = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (department) {
    where.department = department;
  }
  if (status) {
    where.status = status;
  }
  if (role) {
    where.role = role;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        department: true,
        title: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: { videos: true, playlists: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Cập nhật trạng thái người dùng
 */
const updateUserStatus = async (id, status) => {
  if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
    const err = new Error("Status không hợp lệ!");
    err.statusCode = 400;
    throw err;
  }
  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, status: true, email: true, fullName: true }
  });

  try {
    const notification = await prisma.notification.create({
      data: {
        userId: id,
        type: "system",
        title: status === 'ACTIVE' ? "Account Activated" : "Account Suspended",
        message: status === 'ACTIVE' ? "Your account has been reactivated." : "Your account has been suspended by an admin.",
        actionUrl: `/profile`,
      },
    });
    sseManager.sendToUser(id, "new_notification", notification);
  } catch (err) {
    console.error("[Notification Error]", err);
  }

  return updated;
};

/**
 * Cập nhật role người dùng
 */
const updateUserRole = async (id, role) => {
  if (!['USER', 'ADMIN'].includes(role)) {
    const err = new Error("Role không hợp lệ!");
    err.statusCode = 400;
    throw err;
  }
  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, role: true, email: true, fullName: true }
  });
  return updated;
};

/**
 * Cập nhật thông tin user (admin edit)
 */
const updateUser = async (id, data) => {
  const { fullName, department, title, role } = data;
  const updateData = {};
  if (fullName !== undefined) updateData.fullName = fullName;
  if (department !== undefined) updateData.department = department;
  if (title !== undefined) updateData.title = title;
  if (role !== undefined) {
    if (!['USER', 'ADMIN'].includes(role)) {
      const err = new Error("Role không hợp lệ!");
      err.statusCode = 400;
      throw err;
    }
    updateData.role = role;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true, fullName: true, email: true, role: true,
      status: true, department: true, title: true, avatarUrl: true, createdAt: true,
    },
  });
  return updated;
};

// ─── CONTENT MODERATION ───────────────────────────────────────────────────────

/**
 * Lấy danh sách video cho moderation (hỗ trợ filter theo status)
 */
const getModerationQueue = async (statusFilter = null) => {
  const where = {};
  if (statusFilter) {
    where.status = statusFilter;
  } else {
    where.status = { in: ['PENDING', 'PROCESSING'] };
  }

  const videos = await prisma.video.findMany({
    where,
    include: {
      creator: { select: { fullName: true, email: true, avatarUrl: true } },
      metadata: { select: { duration: true, hlsMasterUrl: true } },
    },
    orderBy: { createdAt: 'desc' }
  });
  return videos;
};

/**
 * Lấy tất cả video (cho admin, mọi status)
 */
const getAllVideos = async ({ status, page = 1, limit = 20 } = {}) => {
  const where = {};
  if (status) where.status = status;

  const skip = (page - 1) * limit;
  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        creator: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        metadata: { select: { duration: true, hlsMasterUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.video.count({ where }),
  ]);

  return {
    videos,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Duyệt video
 */
const approveVideo = async (videoId) => {
  const existingVideo = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      metadata: {
        select: { hlsMasterUrl: true },
      },
    },
  });

  if (!existingVideo) {
    const err = new Error("Video not found.");
    err.statusCode = 404;
    throw err;
  }

  if (existingVideo.status !== "PENDING") {
    const err = new Error("Only videos in PENDING status can be approved.");
    err.statusCode = 400;
    throw err;
  }

  if (!existingVideo.metadata?.hlsMasterUrl) {
    const err = new Error("Video is not ready for review yet. Please wait for processing to finish.");
    err.statusCode = 400;
    throw err;
  }

  const updated = await prisma.video.update({
    where: { id: videoId },
    data: { status: 'READY' }
  });

  try {
    const notification = await prisma.notification.create({
      data: {
        userId: updated.creatorId,
        type: "system",
        title: "Video Approved",
        message: `Your video "${updated.title}" has been approved and is now live.`,
        actionUrl: `/watch/${updated.id}`,
      },
    });
    sseManager.sendToUser(updated.creatorId, "new_notification", notification);
  } catch (err) {
    console.error("[Notification Error]", err);
  }

  return updated;
};

/**
 * Từ chối video
 */
const rejectVideo = async (videoId, reason) => {
  const updated = await prisma.video.update({
    where: { id: videoId },
    data: { status: 'BANNED' }
  });

  try {
    const notification = await prisma.notification.create({
      data: {
        userId: updated.creatorId,
        type: "system",
        title: "Video Rejected",
        message: `Your video "${updated.title}" has been rejected. Reason: ${reason || "Violates community guidelines."}`,
        actionUrl: `/profile`,
      },
    });
    sseManager.sendToUser(updated.creatorId, "new_notification", notification);
  } catch (err) {
    console.error("[Notification Error]", err);
  }

  return updated;
};

/**
 * Bulk approve nhiều video
 */
const bulkApproveVideos = async (videoIds) => {
  const results = [];
  for (const id of videoIds) {
    try {
      const video = await approveVideo(id);
      results.push({ id, success: true, video });
    } catch (err) {
      results.push({ id, success: false, error: err.message });
    }
  }
  return results;
};

/**
 * Bulk reject nhiều video
 */
const bulkRejectVideos = async (videoIds, reason) => {
  const results = [];
  for (const id of videoIds) {
    try {
      const video = await rejectVideo(id, reason);
      results.push({ id, success: true, video });
    } catch (err) {
      results.push({ id, success: false, error: err.message });
    }
  }
  return results;
};

// ─── DASHBOARD METRICS (REAL DATA) ───────────────────────────────────────────

const getDashboardMetrics = async () => {
  // Đếm users
  const [totalUsers, activeUsers, suspendedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'SUSPENDED' } }),
  ]);

  // Đếm videos theo status
  const [totalVideos, readyVideos, pendingVideos, processingVideos, failedVideos, bannedVideos] = await Promise.all([
    prisma.video.count(),
    prisma.video.count({ where: { status: 'READY' } }),
    prisma.video.count({ where: { status: 'PENDING' } }),
    prisma.video.count({ where: { status: 'PROCESSING' } }),
    prisma.video.count({ where: { status: 'FAILED' } }),
    prisma.video.count({ where: { status: 'BANNED' } }),
  ]);

  // Tổng views
  const viewsAgg = await prisma.video.aggregate({ _sum: { viewCount: true } });
  const totalViews = viewsAgg._sum.viewCount || 0;

  // Tổng comments, likes, playlists
  const [totalComments, totalLikes, totalPlaylists] = await Promise.all([
    prisma.comment.count(),
    prisma.like.count(),
    prisma.playlist.count(),
  ]);

  // User growth - 7 ngày gần nhất
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const userGrowth = buildDailyCountsArray(recentUsers, 'createdAt', 7);

  // Video growth - 7 ngày gần nhất
  const recentVideos = await prisma.video.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const videoGrowth = buildDailyCountsArray(recentVideos, 'createdAt', 7);

  // Top 5 videos by views
  const topVideos = await prisma.video.findMany({
    where: { status: 'READY' },
    orderBy: { viewCount: 'desc' },
    take: 5,
    select: {
      id: true, title: true, viewCount: true, thumbnailUrl: true, createdAt: true,
      creator: { select: { fullName: true, avatarUrl: true } },
    },
  });

  // Top 5 creators by video count
  const topCreators = await prisma.user.findMany({
    orderBy: { videos: { _count: 'desc' } },
    take: 5,
    select: {
      id: true, fullName: true, avatarUrl: true, department: true,
      _count: { select: { videos: true } },
    },
  });

  // 5 video mới nhất
  const recentUploads = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      creator: { select: { fullName: true, avatarUrl: true } },
      metadata: { select: { duration: true } },
    },
  });

  return {
    users: { total: totalUsers, active: activeUsers, suspended: suspendedUsers },
    videos: {
      total: totalVideos, ready: readyVideos, pending: pendingVideos,
      processing: processingVideos, failed: failedVideos, banned: bannedVideos,
    },
    totalViews,
    totalComments,
    totalLikes,
    totalPlaylists,
    userGrowth,
    videoGrowth,
    topVideos,
    topCreators,
    recentUploads,
  };
};

// ─── ANALYTICS METRICS (REAL DATA) ───────────────────────────────────────────

const getAnalyticsMetrics = async () => {
  // Video stats theo category
  const videosByCategory = await prisma.video.groupBy({
    by: ['category'],
    _count: { id: true },
    _sum: { viewCount: true },
  });

  // Views timeline - 7 ngày gần nhất (dựa trên WatchHistory)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentWatches = await prisma.watchHistory.findMany({
    where: { watchedAt: { gte: sevenDaysAgo } },
    select: { watchedAt: true },
    orderBy: { watchedAt: 'asc' },
  });

  const viewsTimeline = buildDailyCountsArray(recentWatches, 'watchedAt', 7);

  // Transcoding jobs from BullMQ
  let transcodingJobs = [];
  try {
    const [activeJobs, waitingJobs, completedJobs, failedJobs] = await Promise.all([
      videoQueue.getJobs(['active'], 0, 10),
      videoQueue.getJobs(['waiting'], 0, 10),
      videoQueue.getJobs(['completed'], 0, 5),
      videoQueue.getJobs(['failed'], 0, 5),
    ]);

    const mapJob = (job, statusOverride) => ({
      id: job.id,
      source: job.data?.originalFilename || 'Unknown',
      videoId: job.data?.videoId || null,
      status: statusOverride,
      progress: typeof job.progress === 'number' ? job.progress : 0,
      createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : null,
    });

    transcodingJobs = [
      ...activeJobs.map(j => mapJob(j, 'PROCESSING')),
      ...waitingJobs.map(j => mapJob(j, 'WAITING')),
      ...completedJobs.map(j => mapJob(j, 'COMPLETE')),
      ...failedJobs.map(j => mapJob(j, 'FAILED')),
    ];
  } catch (err) {
    console.error("[Queue Error]", err.message);
  }

  // System health
  let systemHealth = {
    database: 'UNKNOWN',
    redis: 'UNKNOWN',
    queue: 'UNKNOWN',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    systemHealth.database = 'OPERATIONAL';
  } catch {
    systemHealth.database = 'DOWN';
  }

  try {
    await redisClient.ping();
    systemHealth.redis = 'OPERATIONAL';
  } catch {
    systemHealth.redis = 'DOWN';
  }

  try {
    const queueCounts = await videoQueue.getJobCounts();
    systemHealth.queue = 'OPERATIONAL';
    systemHealth.queueCounts = queueCounts;
  } catch {
    systemHealth.queue = 'DOWN';
  }

  // Storage estimate from DB
  const totalVideoCount = await prisma.video.count();
  const readyVideoCount = await prisma.video.count({ where: { status: 'READY' } });

  return {
    videosByCategory: videosByCategory.map(v => ({
      category: v.category || 'Uncategorized',
      count: v._count.id,
      totalViews: v._sum.viewCount || 0,
    })),
    viewsTimeline,
    transcodingJobs,
    systemHealth,
    storageEstimate: {
      totalVideos: totalVideoCount,
      processedVideos: readyVideoCount,
    },
  };
};

/**
 * Export users to CSV string
 */
const exportUsersCsv = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true, fullName: true, email: true, role: true,
      status: true, department: true, title: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers = ['ID', 'Full Name', 'Email', 'Role', 'Status', 'Department', 'Title', 'Created At'];
  const rows = users.map(u => [
    u.id, u.fullName, u.email, u.role, u.status,
    u.department || '', u.title || '', u.createdAt.toISOString(),
  ]);

  return rowsToCsv(headers, rows);
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Build an array of daily counts for the last N days.
 * Returns [{ date: 'YYYY-MM-DD', count: N }, ...]
 */
function buildDailyCountsArray(records, dateField, days) {
  const counts = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    counts[key] = 0;
  }

  for (const record of records) {
    const key = new Date(record[dateField]).toISOString().slice(0, 10);
    if (counts[key] !== undefined) {
      counts[key]++;
    }
  }

  return Object.entries(counts).map(([date, count]) => ({ date, count }));
}

module.exports = {
  createUser,
  listUsers,
  updateUserStatus,
  updateUserRole,
  updateUser,
  getModerationQueue,
  getAllVideos,
  approveVideo,
  rejectVideo,
  bulkApproveVideos,
  bulkRejectVideos,
  getDashboardMetrics,
  getAnalyticsMetrics,
  exportUsersCsv,
  importUsersCsv,
};
