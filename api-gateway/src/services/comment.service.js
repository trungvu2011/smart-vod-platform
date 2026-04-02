const prisma = require("../config/prisma");

/**
 * Thêm bình luận — hỗ trợ parentId cho comment lồng nhau (reply).
 */
const addComment = async (videoId, userId, content, parentId = null) => {
  if (!content || !content.trim()) {
    const err = new Error("Nội dung bình luận không được để trống!");
    err.statusCode = 400;
    throw err;
  }

  // Kiểm tra video tồn tại
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    const err = new Error("Không tìm thấy video!");
    err.statusCode = 404;
    throw err;
  }

  // Nếu có parentId, kiểm tra parent comment tồn tại
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
    });
    if (!parentComment) {
      const err = new Error("Không tìm thấy bình luận cha!");
      err.statusCode = 404;
      throw err;
    }
  }

  const comment = await prisma.comment.create({
    data: {
      videoId,
      userId,
      content: content.trim(),
      parentId: parentId || null,
    },
    include: {
      user: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
    },
  });

  return comment;
};

/**
 * Lấy danh sách bình luận theo cấu trúc phân cấp (hierarchical).
 * Trả về top-level comments kèm theo mảng replies lồng nhau.
 */
const getComments = async (videoId) => {
  // Lấy tất cả comments của video
  const allComments = await prisma.comment.findMany({
    where: { videoId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
    },
  });

  // Xây dựng cây phân cấp (hierarchical tree)
  const commentMap = {};
  const rootComments = [];

  // Bước 1: Tạo map từ id → comment (kèm mảng replies rỗng)
  allComments.forEach((comment) => {
    commentMap[comment.id] = { ...comment, replies: [] };
  });

  // Bước 2: Gắn replies vào parent tương ứng
  allComments.forEach((comment) => {
    if (comment.parentId && commentMap[comment.parentId]) {
      commentMap[comment.parentId].replies.push(commentMap[comment.id]);
    } else {
      rootComments.push(commentMap[comment.id]);
    }
  });

  return rootComments;
};

/**
 * Toggle Like — thêm nếu chưa like, xóa nếu đã like.
 * Sử dụng composite key [userId, videoId] trong bảng Like.
 */
const toggleLike = async (videoId, userId) => {
  // Kiểm tra video tồn tại
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    const err = new Error("Không tìm thấy video!");
    err.statusCode = 404;
    throw err;
  }

  // Kiểm tra đã like chưa
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_videoId: { userId, videoId },
    },
  });

  if (existingLike) {
    // Đã like → xóa (unlike)
    await prisma.like.delete({
      where: {
        userId_videoId: { userId, videoId },
      },
    });
    return { liked: false };
  } else {
    // Chưa like → thêm
    await prisma.like.create({
      data: { userId, videoId },
    });
    return { liked: true };
  }
};

module.exports = { addComment, getComments, toggleLike };
