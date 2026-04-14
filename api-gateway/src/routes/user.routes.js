const express = require("express");
const router = express.Router();
const { 
  getHistory, 
  upsertHistory,
  getLikedVideos,
  getNotifications,
  getActivities,
  getSessions
} = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// Tất cả route user đều cần đăng nhập
router.get("/history", verifyToken, getHistory);
router.post("/history", verifyToken, upsertHistory);

router.get("/liked-videos", verifyToken, getLikedVideos);
router.get("/notifications", verifyToken, getNotifications);
router.get("/activities", verifyToken, getActivities);
router.get("/sessions", verifyToken, getSessions);

module.exports = router;
