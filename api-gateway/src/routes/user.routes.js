const express = require("express");
const router = express.Router();
const {
  getHistory,
  upsertHistory,
  getLikedVideos,
  getNotifications,
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

// Tất cả route user đều cần đăng nhập
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
