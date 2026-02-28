const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const minioClient = require("../config/minio");
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
        original_filename: req.file.originalname,
        raw_url: rawUrl,
        status: "pending", // Chờ hệ thống Worker lấy đi xử lý HLS
      },
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

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        user: {
          select: { username: true },
        },
      },
    });

    if (!video) {
      return res.status(404).json({ message: "Không tìm thấy video này!" });
    }

    res.status(200).json({ video });
  } catch (error) {
    console.error("❌ Lỗi lấy chi tiết video:", error);
    res.status(500).json({ message: "Lỗi server khi lấy chi tiết video" });
  }
};

module.exports = { uploadVideo, getAllVideos, getVideoById };
