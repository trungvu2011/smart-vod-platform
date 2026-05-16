const express = require("express");
const router = express.Router();

const {
  createRoom,
  listRooms,
  joinRoom,
  getRoomDetails,
  startRecording,
  endRoom,
  handleWebhook,
} = require("../controllers/meeting.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// ====== LIVEKIT WEBHOOK (phải đặt TRƯỚC verifyToken) ======

// Webhook endpoint — LiveKit gửi event khi egress kết thúc
// Cần raw body để verify signature, đã được set ở server.js
router.post("/webhook/livekit", handleWebhook);

// ====== MEETING CRUD (cần xác thực) ======

// Danh sách phòng họp
router.get("/", verifyToken, listRooms);

// Tạo phòng họp mới
router.post("/", verifyToken, createRoom);

// Chi tiết phòng họp
router.get("/:roomName", verifyToken, getRoomDetails);

// Tham gia phòng họp
router.post("/:roomName/join", verifyToken, joinRoom);

// Bắt đầu ghi hình (chỉ host)
router.post("/:roomName/record", verifyToken, startRecording);

// Kết thúc phòng họp (chỉ host)
router.post("/:roomName/end", verifyToken, endRoom);

module.exports = router;
