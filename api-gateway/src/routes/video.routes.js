const express = require("express");
const router = express.Router();

const {
  uploadVideo,
  getAllVideos,
  getVideoById,
} = require("../controllers/video.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// API Public: Bất kỳ ai vào web cũng xem được danh sách video (Không cần anh bảo vệ)
router.get("/", getAllVideos);
router.get("/:id", getVideoById);

// API Protected: Chỉ người có thẻ (Token) mới được Upload
router.post("/upload", verifyToken, upload.single("videoFile"), uploadVideo);

module.exports = router;
