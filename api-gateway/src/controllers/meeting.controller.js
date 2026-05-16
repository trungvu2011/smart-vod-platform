const meetingService = require("../services/meeting.service");
const { WebhookReceiver } = require("livekit-server-sdk");

const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
const apiSecret = process.env.LIVEKIT_API_SECRET || "secret";

// =========================================
// [POST] /api/meetings — Tạo phòng họp mới
// =========================================
const createRoom = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { displayName, maxParticipants } = req.body;

    const result = await meetingService.createRoom(userId, displayName, maxParticipants);

    res.status(201).json({
      message: "Tạo phòng họp thành công.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// [GET] /api/meetings — Danh sách phòng họp
// =========================================
const listRooms = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const status = req.query.status || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const result = await meetingService.listRooms(userId, status, page, limit);

    res.status(200).json({
      message: "Danh sách phòng họp.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// [POST] /api/meetings/:roomName/join — Tham gia phòng
// =========================================
const joinRoom = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { roomName } = req.params;

    const result = await meetingService.joinRoom(userId, roomName);

    res.status(200).json({
      message: "Tham gia phòng thành công.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// [GET] /api/meetings/:roomName — Chi tiết phòng
// =========================================
const getRoomDetails = async (req, res, next) => {
  try {
    const { roomName } = req.params;

    const room = await meetingService.getRoomDetails(roomName);

    res.status(200).json({
      message: "Chi tiết phòng họp.",
      room,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// [POST] /api/meetings/:roomName/record — Bắt đầu ghi hình
// =========================================
const startRecording = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { roomName } = req.params;

    const result = await meetingService.startRecording(roomName, userId);

    res.status(200).json({
      message: "Bắt đầu ghi hình thành công.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// [POST] /api/meetings/:roomName/end — Kết thúc phòng
// =========================================
const endRoom = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { roomName } = req.params;

    const room = await meetingService.endRoom(roomName, userId);

    res.status(200).json({
      message: "Đã kết thúc phòng họp.",
      room,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// [POST] /api/meetings/webhook/livekit — LiveKit Webhook
// =========================================
const handleWebhook = async (req, res) => {
  try {
    const receiver = new WebhookReceiver(apiKey, apiSecret);

    // Lấy raw body (đã được parse bởi express.raw() middleware)
    const body = req.body.toString();
    const authHeader = req.get("Authorization");

    // Verify signature và parse event
    const event = await receiver.receive(body, authHeader);

    console.log(`[LIVEKIT WEBHOOK] Event verified: ${event.event}`);

    const result = await meetingService.handleEgressWebhook(event);

    res.status(200).json(result);
  } catch (error) {
    console.error("[LIVEKIT WEBHOOK] Error:", error.message);
    // Luôn trả 200 cho webhook để LiveKit không retry vô hạn
    res.status(200).json({ acknowledged: true, error: error.message });
  }
};

module.exports = {
  createRoom,
  listRooms,
  joinRoom,
  getRoomDetails,
  startRecording,
  endRoom,
  handleWebhook,
};
