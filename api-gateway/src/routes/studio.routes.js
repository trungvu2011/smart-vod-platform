const express = require("express");
const router = express.Router();
const { getStudioVideos, updateVideo, deleteVideo } = require("../controllers/studio.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// Cần đăng nhập để quản lý video của mình
router.get("/videos", verifyToken, getStudioVideos);
router.put("/videos/:id", verifyToken, updateVideo);
router.delete("/videos/:id", verifyToken, deleteVideo);

module.exports = router;
