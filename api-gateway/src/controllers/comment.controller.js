const commentService = require("../services/comment.service");

// [POST] /api/videos/:id/comments — Thêm bình luận (hỗ trợ reply lồng nhau)
const addComment = async (req, res, next) => {
  try {
    const { id: videoId } = req.params;
    const userId = req.user.id;
    const { content, parentId } = req.body;

    const comment = await commentService.addComment(
      videoId,
      userId,
      content,
      parentId
    );

    res.status(201).json({
      message: "Thêm bình luận thành công!",
      comment,
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/videos/:id/comments — Lấy bình luận phân cấp (hierarchical)
const getComments = async (req, res, next) => {
  try {
    const { id: videoId } = req.params;
    const comments = await commentService.getComments(videoId);

    res.status(200).json({
      message: "Lấy bình luận thành công!",
      comments,
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/videos/:id/like — Toggle like/unlike
const toggleLike = async (req, res, next) => {
  try {
    const { id: videoId } = req.params;
    const userId = req.user.id;

    const result = await commentService.toggleLike(videoId, userId);

    res.status(200).json({
      message: result.liked ? "Đã thích video!" : "Đã bỏ thích video!",
      liked: result.liked,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, getComments, toggleLike };
