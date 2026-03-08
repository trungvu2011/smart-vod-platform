const express = require("express");
const router = express.Router();

const {
  uploadVideo,
  getAllVideos,
  getVideoById,
  getVideoComments,
  searchVideos,
} = require("../controllers/video.controller");
const { verifyToken, optionalAuth } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// API Public: Bất kỳ ai vào web cũng xem được danh sách video (Không cần anh bảo vệ)
router.get("/", getAllVideos);

// Đặt /search LÊN TRƯỚC /:id để Express không nhầm "search" là một ID
router.get("/search", searchVideos);

router.get("/:id/comments", getVideoComments);

// Dùng optionalAuth cho /:id để nếu có đăng nhập thì trả về thêm hasLiked, isSubscribed
router.get("/:id", optionalAuth, getVideoById);

// API Protected: Chỉ người có thẻ (Token) mới được Upload
router.post("/upload", verifyToken, upload.single("videoFile"), uploadVideo);

module.exports = router;
