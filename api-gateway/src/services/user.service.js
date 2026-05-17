const prisma = require("../config/prisma");

/**
 * Lấy lịch sử xem của user hiện tại.
 * Sắp xếp theo thời gian xem gần nhất.
 */
const getHistory = async (userId) => {
  const history = await prisma.watchHistory.findMany({
    where: { userId },
    orderBy: { watchedAt: "desc" },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          status: true,
          viewCount: true,
          createdAt: true,
          category: true,
          metadata: { select: { duration: true, hlsMasterUrl: true } },
          creator: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
      },
    },
  });

  return history;
};

/**
 * Upsert lịch sử xem — lưu lại lastSecond (giây cuối cùng đã xem)
 * để hỗ trợ tính năng "Xem tiếp".
 */
const upsertHistory = async (userId, videoId, lastSecond = 0) => {
  if (!videoId) {
    const err = new Error("Please provide a videoId!");
    err.statusCode = 400;
    throw err;
  }

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    const err = new Error("Video not found!");
    err.statusCode = 404;
    throw err;
  }

  const existing = await prisma.watchHistory.findFirst({
    where: { userId, videoId },
  });

  if (existing) {
    const updated = await prisma.watchHistory.update({
      where: { id: existing.id },
      data: { lastSecond, watchedAt: new Date() },
    });
    return updated;
  } else {
    const created = await prisma.watchHistory.create({
      data: { userId, videoId, lastSecond },
    });
    return created;
  }
};

/**
 * Lấy danh sách video đã like của user.
 * Trả về array { likedAt, video } để frontend biết thời gian like.
 */
const getLikedVideos = async (userId) => {
  const likes = await prisma.like.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      video: {
        include: {
          creator: { select: { id: true, fullName: true, avatarUrl: true } },
          metadata: { select: { duration: true, hlsMasterUrl: true } },
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
  });

  return likes.map((l) => ({
    likedAt: l.createdAt,
    video: l.video,
  }));
};

const getNotifications = async (userId, cursor = null, limit = 10) => {
  const queryOptions = {
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1, // Lấy thêm 1 để biết có trang tiếp không
  };

  if (cursor) {
    queryOptions.cursor = { id: cursor };
    queryOptions.skip = 1; // Bỏ qua record cursor hiện tại
  }

  const results = await prisma.notification.findMany(queryOptions);

  const hasMore = results.length > limit;
  const notifications = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore ? notifications[notifications.length - 1].id : null;

  return { notifications, nextCursor };
};

const getDepartments = async () => {
  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      department: { not: null },
    },
    select: { department: true },
  });

  const counts = new Map();
  for (const user of users) {
    const department = user.department?.trim();
    if (!department) continue;
    counts.set(department, (counts.get(department) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, userCount]) => ({ name, userCount }))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
};

const getActivities = async (userId) => {
  // Model Activity chưa có trong schema — trả về array rỗng
  return [];
};

const getSessions = async (userId) => {
  return await prisma.session.findMany({
    where: { userId },
    orderBy: { lastActive: "desc" },
  });
};

// ─── NEW: GET /api/users/me ───────────────────────────────────────────────────
/**
 * Lấy thông tin profile đầy đủ của user đang đăng nhập.
 */
const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      avatarUrl: true,
      title: true,
      department: true,
      videosViewed: true,
      certifications: true,
      createdAt: true,
      _count: {
        select: {
          playlists: true,
          watchHistory: true,
        },
      },
    },
  });

  if (!user) {
    const err = new Error("User not found!");
    err.statusCode = 404;
    throw err;
  }

  return user;
};

/**
 * Lấy danh sách video do chính user tạo ra (bao gồm pending, processing, ready, failed).
 */
const getMyVideos = async (userId) => {
  const videos = await prisma.video.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, fullName: true, avatarUrl: true } },
      metadata: { select: { duration: true } },
    },
  });
  return videos;
};

// ─── NEW: PUT /api/users/me ───────────────────────────────────────────────────
/**
 * Cập nhật thông tin profile của user đang đăng nhập.
 * Các field được phép update: fullName, avatarUrl, title, department.
 */
const updateMe = async (userId, data) => {
  const { fullName, avatarUrl, title, department } = data;

  if (fullName !== undefined && fullName.trim().length === 0) {
    const err = new Error("Full name cannot be empty!");
    err.statusCode = 400;
    throw err;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(fullName !== undefined && { fullName: fullName.trim() }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(title !== undefined && { title }),
      ...(department !== undefined && { department }),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      avatarUrl: true,
      title: true,
      department: true,
      videosViewed: true,
      certifications: true,
      createdAt: true,
    },
  });

  return updated;
};

// ─── NEW: PATCH /api/users/notifications/:id/read ────────────────────────────
/**
 * Đánh dấu một notification là đã đọc.
 */
const markNotificationRead = async (userId, notificationId) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    const err = new Error("Notification not found!");
    err.statusCode = 404;
    throw err;
  }

  return await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
};

// ─── NEW: POST /api/users/notifications/read-all ─────────────────────────────
/**
 * Đánh dấu tất cả notifications của user là đã đọc.
 */
const markAllNotificationsRead = async (userId) => {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return result.count;
};

// ─── NEW: DELETE /api/users/sessions/:id ─────────────────────────────────────
/**
 * Thu hồi một session. Không cho phép revoke session hiện tại.
 */
const revokeSession = async (userId, sessionId) => {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    const err = new Error("Session not found!");
    err.statusCode = 404;
    throw err;
  }

  if (session.isCurrent) {
    const err = new Error(
      "Cannot revoke the current active session! Please logout instead."
    );
    err.statusCode = 400;
    throw err;
  }

  await prisma.session.delete({ where: { id: sessionId } });
};

module.exports = {
  getHistory,
  upsertHistory,
  getLikedVideos,
  getNotifications,
  getDepartments,
  getActivities,
  getSessions,
  getMe,
  updateMe,
  markNotificationRead,
  markAllNotificationsRead,
  revokeSession,
  getMyVideos,
};
