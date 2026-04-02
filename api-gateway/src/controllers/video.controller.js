const videoService = require("../services/video.service");

// [POST] /api/videos/upload — Upload video (async: MinIO + DB + BullMQ)
const uploadVideo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, description } = req.body;

    const video = await videoService.uploadVideo(
      userId,
      req.file,
      title,
      description
    );

    res.status(201).json({
      message: "Tải video lên thành công! Đang chờ xử lý.",
      video,
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/videos — Danh sách video phân trang
const listVideos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const status = req.query.status || null;

    const result = await videoService.listVideos(page, limit, status);

    res.status(200).json({
      message: "Lấy danh sách video thành công!",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/videos/:id — Chi tiết video kèm metadata
const getVideoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const video = await videoService.getVideoById(id);

    res.status(200).json({
      message: "Lấy chi tiết video thành công!",
      video,
    });
  } catch (error) {
    next(error);
  }
};

// [PUT] /api/videos/:id — Cập nhật title/description (Creator or Admin)
const updateVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { title, description } = req.body;

    const video = await videoService.updateVideo(id, userId, userRole, {
      title,
      description,
    });

    res.status(200).json({
      message: "Cập nhật video thành công!",
      video,
    });
  } catch (error) {
    next(error);
  }
};

// [DELETE] /api/videos/:id — Xóa video + cleanup MinIO (Creator or Admin)
const deleteVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    await videoService.deleteVideo(id, userId, userRole);

    res.status(200).json({
      message: "Xóa video và dữ liệu liên quan thành công!",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadVideo, listVideos, getVideoById, updateVideo, deleteVideo };
