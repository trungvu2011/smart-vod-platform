const express = require("express");
const router = express.Router();

const { uploadVideo } = require("../controllers/video.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// Tuyến đường Upload:
// 1. Phải có thẻ (verifyToken) -> 2. Hứng file (upload.single) -> 3. Xử lý lưu (uploadVideo)
router.post("/upload", verifyToken, upload.single("videoFile"), uploadVideo);

module.exports = router;
