const express = require("express");
const router = express.Router();

const {
  uploadVideo,
  listVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  getAiSummary,
} = require("../controllers/video.controller");
const {
  addComment,
  getComments,
  toggleLike,
} = require("../controllers/comment.controller");
const { verifyToken, optionalAuth } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// ====== VIDEO CRUD ======

// Public: Danh sách video phân trang
router.get("/", listVideos);

// Public (optionalAuth): Chi tiết video — nếu đăng nhập thì biết thêm thông tin
router.get("/:id", optionalAuth, getVideoById);

// Public: Get AI Summary
router.get("/:id/ai-summary", optionalAuth, getAiSummary);

// Protected: Upload video (multipart/form-data)
router.post("/upload", verifyToken, upload.fields([{ name: 'videoFile', maxCount: 1 }, { name: 'thumbnailFile', maxCount: 1 }]), uploadVideo);

// Protected: Cập nhật video (Creator or Admin)
router.put("/:id", verifyToken, updateVideo);

// Protected: Xóa video (Creator or Admin)
router.delete("/:id", verifyToken, deleteVideo);

// ====== SOCIAL: COMMENTS & LIKES ======

// Public: Lấy bình luận phân cấp
router.get("/:id/comments", getComments);

// Protected: Thêm bình luận
router.post("/:id/comments", verifyToken, addComment);

// Protected: Toggle like
router.post("/:id/like", verifyToken, toggleLike);

module.exports = router;
