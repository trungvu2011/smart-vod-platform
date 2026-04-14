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
 * Nếu chưa có record → tạo mới. Đã có → cập nhật lastSecond + watchedAt.
 */
const upsertHistory = async (userId, videoId, lastSecond = 0) => {
  if (!videoId) {
    const err = new Error("Please provide a videoId!");
    err.statusCode = 400;
    throw err;
  }

  // Kiểm tra video tồn tại
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    const err = new Error("Video not found!");
    err.statusCode = 404;
    throw err;
  }

  // Tìm record history hiện có (cùng userId + videoId)
  const existing = await prisma.watchHistory.findFirst({
    where: { userId, videoId },
  });

  if (existing) {
    // Cập nhật
    const updated = await prisma.watchHistory.update({
      where: { id: existing.id },
      data: {
        lastSecond: lastSecond,
        watchedAt: new Date(),
      },
    });
    return updated;
  } else {
    // Tạo mới
    const created = await prisma.watchHistory.create({
      data: {
        userId,
        videoId,
        lastSecond: lastSecond,
      },
    });
    return created;
  }
};

const getLikedVideos = async (userId) => {
  const likes = await prisma.like.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      video: {
        include: {
          creator: { select: { id: true, fullName: true, avatarUrl: true } },
          metadata: { select: { duration: true } }
        }
      }
    }
  });
  return likes.map(l => l.video);
};

const getNotifications = async (userId) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
};

const getActivities = async (userId) => {
  return await prisma.activity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
};

const getSessions = async (userId) => {
  return await prisma.session.findMany({
    where: { userId },
    orderBy: { lastActive: "desc" }
  });
};

module.exports = { getHistory, upsertHistory, getLikedVideos, getNotifications, getActivities, getSessions };
