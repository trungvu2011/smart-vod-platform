const userService = require("../services/user.service");
const sseManager = require("../services/sse");
const jwt = require("jsonwebtoken");

// ─── Existing ────────────────────────────────────────────────────────────────

// [GET] /api/users/history
const getHistory = async (req, res, next) => {
  try {
    const history = await userService.getHistory(req.user.id);
    res.status(200).json({ message: "Watch history retrieved successfully.", history });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/users/history
const upsertHistory = async (req, res, next) => {
  try {
    const { videoId, lastSecond } = req.body;
    const record = await userService.upsertHistory(req.user.id, videoId, lastSecond);
    res.status(200).json({ message: "Watch progress updated successfully.", history: record });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/users/liked-videos
const getLikedVideos = async (req, res, next) => {
  try {
    const likedVideos = await userService.getLikedVideos(req.user.id);
    res.status(200).json({ message: "Liked videos retrieved successfully.", likedVideos });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/users/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { cursor, limit } = req.query;
    const parsedLimit = limit ? Math.min(parseInt(limit, 10), 50) : 10;
    const result = await userService.getNotifications(
      req.user.id,
      cursor || null,
      parsedLimit
    );
    res.status(200).json({
      message: "Notifications retrieved successfully.",
      notifications: result.notifications,
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/users/departments
const getDepartments = async (req, res, next) => {
  try {
    const departments = await userService.getDepartments();
    res.status(200).json({
      message: "Departments retrieved successfully.",
      departments,
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/users/notifications/stream — SSE endpoint
const streamNotifications = (req, res) => {
  // Auth via query param (EventSource không hỗ trợ custom headers)
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ message: "Missing token for SSE." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }

  const userId = decoded.id;

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no", // Disable nginx buffering
  });

  // Send initial connection confirmation
  res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

  // Register connection
  sseManager.addClient(userId, res);

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch (err) {
      clearInterval(heartbeat);
    }
  }, 30000);

  // Cleanup on disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    sseManager.removeClient(userId, res);
  });
};

// [GET] /api/users/activities
const getActivities = async (req, res, next) => {
  try {
    const activities = await userService.getActivities(req.user.id);
    res.status(200).json({ message: "Activities retrieved successfully.", activities });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/users/sessions
const getSessions = async (req, res, next) => {
  try {
    const sessions = await userService.getSessions(req.user.id);
    res.status(200).json({ message: "Sessions retrieved successfully.", sessions });
  } catch (error) {
    next(error);
  }
};

// ─── NEW ─────────────────────────────────────────────────────────────────────

// [GET] /api/users/me — Lấy profile đầy đủ của user hiện tại
const getMe = async (req, res, next) => {
  try {
    const user = await userService.getMe(req.user.id);
    res.status(200).json({ message: "Profile retrieved successfully.", user });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/users/me/videos — Lấy video đã tạo
const getMyVideos = async (req, res, next) => {
  try {
    const videos = await userService.getMyVideos(req.user.id);
    res.status(200).json({ message: "My videos retrieved.", videos });
  } catch (error) {
    next(error);
  }
};

// [PUT] /api/users/me — Cập nhật profile
const updateMe = async (req, res, next) => {
  try {
    const user = await userService.updateMe(req.user.id, req.body);
    res.status(200).json({ message: "Profile updated successfully.", user });
  } catch (error) {
    next(error);
  }
};

// [PATCH] /api/users/notifications/:id/read — Đánh dấu 1 notification đã đọc
const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await userService.markNotificationRead(
      req.user.id,
      req.params.id
    );
    res.status(200).json({ message: "Notification marked as read.", notification });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/users/notifications/read-all — Đánh dấu tất cả đã đọc
const markAllNotificationsRead = async (req, res, next) => {
  try {
    const count = await userService.markAllNotificationsRead(req.user.id);
    res.status(200).json({
      message: `Marked ${count} notification(s) as read.`,
      updatedCount: count,
    });
  } catch (error) {
    next(error);
  }
};

// [DELETE] /api/users/sessions/:id — Thu hồi session
const revokeSession = async (req, res, next) => {
  try {
    await userService.revokeSession(req.user.id, req.params.id);
    res.status(200).json({ message: "Session revoked successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHistory,
  upsertHistory,
  getLikedVideos,
  getNotifications,
  getDepartments,
  streamNotifications,
  getActivities,
  getSessions,
  getMe,
  updateMe,
  markNotificationRead,
  markAllNotificationsRead,
  revokeSession,
  getMyVideos,
};
