const express = require("express");
const router = express.Router();
const {
  getHistory,
  upsertHistory,
  getLikedVideos,
  getNotifications,
  streamNotifications,
  getActivities,
  getSessions,
  getMe,
  updateMe,
  markNotificationRead,
  markAllNotificationsRead,
  revokeSession,
  getMyVideos,
} = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// ── SSE Stream (auth via query param, TRƯỚC verifyToken) ─────────────────────
// EventSource không hỗ trợ custom headers nên không dùng được verifyToken middleware.
// Controller tự xác thực token từ query param.
router.get("/notifications/stream", streamNotifications);

// Tất cả route user còn lại đều cần đăng nhập
router.use(verifyToken);

// ── Profile ──────────────────────────────────────────────────────────────────
router.get("/me", getMe);
router.put("/me", updateMe);
router.get("/me/videos", getMyVideos);

// ── Watch History ─────────────────────────────────────────────────────────────
router.get("/history", getHistory);
router.post("/history", upsertHistory);

// ── Liked Videos ──────────────────────────────────────────────────────────────
router.get("/liked-videos", getLikedVideos);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get("/notifications", getNotifications);
router.post("/notifications/read-all", markAllNotificationsRead);
router.patch("/notifications/:id/read", markNotificationRead);

// ── Activities ────────────────────────────────────────────────────────────────
router.get("/activities", getActivities);

// ── Sessions ──────────────────────────────────────────────────────────────────
router.get("/sessions", getSessions);
router.delete("/sessions/:id", revokeSession);

module.exports = router;
