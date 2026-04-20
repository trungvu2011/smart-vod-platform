const videoService = require("../services/video.service");

// [POST] /api/videos/upload — Upload video (async: MinIO + DB + BullMQ)
const uploadVideo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, description, category, visibility } = req.body;

    let videoFile = null;
    let thumbnailFile = null;
    if (req.files) {
      if (req.files.videoFile) videoFile = req.files.videoFile[0];
      if (req.files.thumbnailFile) thumbnailFile = req.files.thumbnailFile[0];
    }

    const video = await videoService.uploadVideo(
      userId,
      videoFile,
      thumbnailFile,
      title,
      description,
      category,
      visibility
    );

    res.status(201).json({
      message: "Video uploaded successfully. Pending processing.",
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
    const category = req.query.category || null;

    const result = await videoService.listVideos(page, limit, status, category);

    res.status(200).json({
      message: "Videos retrieved successfully.",
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
      message: "Video details retrieved successfully.",
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
      message: "Video updated successfully.",
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
      message: "Video deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/videos/:id/ai-summary — Lấy AI Summary (parse JSON string ra object)
const getAiSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const summaryStr = await videoService.getAiSummary(id);
    let parsedSummary = null;

    if (summaryStr) {
      try {
        parsedSummary = JSON.parse(summaryStr);
      } catch (e) {
        // If it's not a JSON string, wrap it in a default structure
        parsedSummary = {
          keyTakeaways: [summaryStr],
          sentimentAnalysis: "Neutral",
          requiredActions: []
        };
      }
    } else {
      parsedSummary = { keyTakeaways: [], sentimentAnalysis: "N/A", requiredActions: [] };
    }

    res.status(200).json({
      message: "AI Summary retrieved successfully.",
      summary: parsedSummary,
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/videos/:id/progress — SSE Endpoint to stream job progress
const streamVideoProgress = async (req, res) => {
  const { id } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ status: "connected", progress: 0 })}\n\n`);

  const pollInterval = setInterval(async () => {
    try {
      const progressInfo = await videoService.getVideoProgress(id);

      if (progressInfo) {
        res.write(`data: ${JSON.stringify(progressInfo)}\n\n`);

        if (progressInfo.state === "completed" || progressInfo.state === "failed") {
          clearInterval(pollInterval);
          res.end();
        }
      }
    } catch (error) {
      console.error("[SSE ERROR]", error);
      clearInterval(pollInterval);
      res.end();
    }
  }, 1000); // Báo cáo mỗi 1 giây

  req.on("close", () => {
    clearInterval(pollInterval);
    res.end();
  });
};

module.exports = { 
  uploadVideo, 
  listVideos, 
  getVideoById, 
  updateVideo, 
  deleteVideo, 
  getAiSummary,
  streamVideoProgress
};
