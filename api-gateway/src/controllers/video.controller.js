const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const minioClient = require("../config/minio");
const videoQueue = require("../config/queue");
const path = require("path");
const crypto = require("crypto");

// [POST] Upload Video
const uploadVideo = async (req, res) => {
  try {
    // 1. Kiểm tra xem user có gửi file lên không
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Vui lòng đính kèm một file video!" });
    }

    // Lấy thông tin từ request
    const userId = req.user.id; // Có được nhờ Auth Middleware
    const { title, description } = req.body;

    if (!title) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập tiêu đề (title) cho video!" });
    }

    // 2. Tạo tên file độc nhất để không bị trùng lặn (VD: 123e4567-e89b...mp4)
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = crypto.randomUUID() + fileExtension;
    const bucketName = process.env.MINIO_BUCKET_NAME;

    // 3. Đẩy file (Buffer) thẳng lên MinIO
    const metaData = {
      "Content-Type": req.file.mimetype,
    };

    // Hàm putObject sẽ stream dữ liệu từ RAM lên MinIO
    await minioClient.putObject(
      bucketName,
      uniqueFilename,
      req.file.buffer,
      req.file.size,
      metaData,
    );

    // 4. Tạo đường dẫn (URL) trỏ tới file gốc trong MinIO
    const rawUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${uniqueFilename}`;

    // 5. Lưu thông tin vào Database với trạng thái 'pending'
    const newVideo = await prisma.video.create({
      data: {
        user_id: userId,
        title: title,
        description: description || "",
        raw_url: rawUrl,
        status: "pending", // Khớp với Enum VideoStatus
        visibility: "public", // Khớp với Enum Visibility mới thêm
      },
    });

    // 6. Gửi tin nhắn vào BullMQ để Worker biết có video mới cần xử lý
    await videoQueue.add("process-hls", {
      videoId: newVideo.id,
      originalFilename: uniqueFilename,
    });

    res.status(201).json({
      message: "Tải video lên thành công! Đang chờ xử lý.",
      video: newVideo,
    });
  } catch (error) {
    console.error("❌ Lỗi upload video:", error);
    res.status(500).json({ message: "Lỗi server khi tải video lên" });
  }
};

// [GET] Lấy danh sách toàn bộ Video (Hiển thị trang chủ)
const getAllVideos = async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      orderBy: {
        created_at: "desc", // Sắp xếp video mới nhất lên đầu
      },
      include: {
        // Tự động JOIN sang bảng User để lấy username
        user: {
          select: { username: true },
        },
      },
    });

    res.status(200).json({
      message: "Lấy danh sách video thành công",
      videos,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách video:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách video" });
  }
};

// [GET] Lấy chi tiết 1 Video (Khi user click vào xem)
const getVideoById = async (req, res) => {
  try {
    const { id } = req.params; // Lấy ID từ trên thanh URL
    const userId = req.user ? req.user.id : null; // Có được nếu dùng optionalAuth

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            _count: { select: { subscribers: true } },
          },
        },
        _count: {
          select: {
            interactions: { where: { type: "like" } },
          },
        },
      },
    });

    if (!video) {
      return res.status(404).json({ message: "Không tìm thấy video này!" });
    }

    // Đếm số dislike
    const dislikeCount = await prisma.interaction.count({
      where: { video_id: id, type: "dislike" },
    });

    let hasLiked = false;
    let hasDisliked = false;
    let isSubscribed = false;

    if (userId) {
      // Thêm vào Lịch sử Xem
      await prisma.watchHistory.upsert({
        where: {
          user_id_video_id: {
            user_id: userId,
            video_id: id,
          },
        },
        update: { watched_at: new Date() },
        create: { user_id: userId, video_id: id },
      });

      // Kiểm tra lượt Like, Dislike
      const interaction = await prisma.interaction.findUnique({
        where: { user_id_video_id: { user_id: userId, video_id: id } },
      });
      if (interaction) {
        if (interaction.type === "like") hasLiked = true;
        if (interaction.type === "dislike") hasDisliked = true;
      }

      // Kiểm tra đăng ký kênh
      const subscription = await prisma.subscription.findUnique({
        where: {
          subscriber_id_channel_id: {
            subscriber_id: userId,
            channel_id: video.user_id,
          },
        },
      });
      if (subscription) {
        isSubscribed = true;
      }
    }

    // Tăng lượt xem (không bắt buộc nhưng tốt cho platform)
    await prisma.video.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    video.views += 1;

    res.status(200).json({
      video: {
        ...video,
        likes: video._count.interactions,
        dislikes: dislikeCount,
        channel: {
          ...video.user,
          totalSubscribers: video.user._count.subscribers,
        },
      },
      hasLiked,
      hasDisliked,
      isSubscribed,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy chi tiết video:", error);
    res.status(500).json({ message: "Lỗi server khi lấy chi tiết video" });
  }
};

// [GET] Danh sách bình luận của 1 video
const getVideoComments = async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: { video_id: id },
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: { id: true, username: true, avatar_url: true },
        },
      },
    });
    res.status(200).json({ message: "Lấy bình luận thành công", comments });
  } catch (error) {
    console.error("❌ Lỗi lấy bình luận:", error);
    res.status(500).json({ message: "Lỗi server khi lấy bình luận" });
  }
};

// [GET] Tìm kiếm Video
const searchVideos = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập từ khóa tìm kiếm (q)!" });
    }

    const videos = await prisma.video.findMany({
      where: {
        status: "ready",
        visibility: "public",
        title: {
          contains: q,
          mode: "insensitive", // PostgreSQL only
        },
      },
      orderBy: { created_at: "desc" },
      include: {
        user: { select: { id: true, username: true, avatar_url: true } },
      },
    });

    res.status(200).json({ message: "Tìm kiếm video thành công", videos });
  } catch (error) {
    console.error("❌ Lỗi tìm kiếm video:", error);
    res.status(500).json({ message: "Lỗi server khi tìm kiếm video" });
  }
};

module.exports = {
  uploadVideo,
  getAllVideos,
  getVideoById,
  getVideoComments,
  searchVideos,
};
