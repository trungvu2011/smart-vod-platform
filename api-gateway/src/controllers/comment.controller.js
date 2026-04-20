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
      parentId,
    );

    res.status(201).json({
      message: "Comment added successfully.",
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
    const userId = req.user?.id || null;
    const comments = await commentService.getComments(videoId, userId);

    res.status(200).json({
      message: "Comments retrieved successfully.",
      comments,
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/videos/:id/comments/:commentId/like — Toggle like/unlike cho comment
const toggleCommentLike = async (req, res, next) => {
  try {
    const { id: videoId, commentId } = req.params;
    const userId = req.user.id;

    const result = await commentService.toggleCommentLike(
      videoId,
      commentId,
      userId,
    );

    res.status(200).json({
      message: result.liked ? "Comment liked." : "Comment unliked.",
      liked: result.liked,
      likes: result.likes,
      commentId,
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
      message: result.liked ? "Video liked." : "Video unliked.",
      liked: result.liked,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, getComments, toggleLike, toggleCommentLike };
