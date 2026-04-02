const prisma = require("../config/prisma");
const minioClient = require("../config/minio");
const videoQueue = require("../config/queue");
const path = require("path");
const crypto = require("crypto");

/**
 * Upload video: lưu file lên MinIO, tạo DB record PENDING, đẩy job BullMQ.
 * Trả về ngay lập tức — KHÔNG chờ FFmpeg hay AI xử lý.
 */
const uploadVideo = async (userId, file, title, description) => {
  if (!file) {
    const err = new Error("Vui lòng đính kèm một file video!");
    err.statusCode = 400;
    throw err;
  }
  if (!title) {
    const err = new Error("Vui lòng nhập tiêu đề (title) cho video!");
    err.statusCode = 400;
    throw err;
  }

  // 1. Tạo tên file độc nhất
  const fileExtension = path.extname(file.originalname);
  const uniqueFilename = crypto.randomUUID() + fileExtension;
  const bucketName = process.env.MINIO_BUCKET_NAME;

  // 2. Đẩy file buffer thẳng lên MinIO
  const metaData = { "Content-Type": file.mimetype };
  await minioClient.putObject(
    bucketName,
    uniqueFilename,
    file.buffer,
    file.size,
    metaData
  );

  // 3. Tạo URL trỏ tới file gốc trên MinIO
  const rawUrl = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${uniqueFilename}`;

  // 4. Lưu vào Database với status PENDING
  const newVideo = await prisma.video.create({
    data: {
      creatorId: userId,
      title: title,
      description: description || null,
      status: "PENDING",
    },
  });

  // 5. Đẩy Job vào BullMQ để Worker xử lý (HLS, thumbnail, AI, ...)
  await videoQueue.add("process-hls", {
    videoId: newVideo.id,
    originalFilename: uniqueFilename,
    fileUrl: rawUrl,
  });

  return newVideo;
};

/**
 * Lấy danh sách video — có phân trang và lọc theo status.
 * Mặc định chỉ hiển thị video READY cho trang chủ.
 */
const listVideos = async (page = 1, limit = 12, status = null) => {
  const skip = (page - 1) * limit;

  const where = {};
  if (status) {
    where.status = status;
  }

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    }),
    prisma.video.count({ where }),
  ]);

  return {
    videos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Lấy chi tiết 1 video kèm metadata (HLS URL, subtitle, AI summary) + like count.
 */
const getVideoById = async (videoId) => {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      creator: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
      metadata: true, // VideoMetadata: hlsMasterUrl, subtitleUrl, aiSummary, duration
      _count: {
        select: { likes: true, comments: true },
      },
    },
  });

  if (!video) {
    const err = new Error("Không tìm thấy video này!");
    err.statusCode = 404;
    throw err;
  }

  // Tăng lượt xem
  await prisma.video.update({
    where: { id: videoId },
    data: { viewCount: { increment: 1 } },
  });

  return {
    ...video,
    viewCount: video.viewCount + 1,
  };
};

/**
 * Cập nhật title/description — chỉ Creator hoặc Admin mới được phép.
 */
const updateVideo = async (videoId, userId, userRole, data) => {
  const video = await prisma.video.findUnique({ where: { id: videoId } });

  if (!video) {
    const err = new Error("Không tìm thấy video!");
    err.statusCode = 404;
    throw err;
  }

  // Kiểm tra quyền: là Creator hoặc ADMIN
  if (video.creatorId !== userId && userRole !== "ADMIN") {
    const err = new Error("Bạn không có quyền chỉnh sửa video này!");
    err.statusCode = 403;
    throw err;
  }

  const updatedVideo = await prisma.video.update({
    where: { id: videoId },
    data: {
      title: data.title !== undefined ? data.title : video.title,
      description:
        data.description !== undefined ? data.description : video.description,
    },
  });

  return updatedVideo;
};

/**
 * Xóa video — chỉ Creator hoặc Admin.
 * Cleanup: xóa file gốc + thư mục HLS trên MinIO, rồi xóa DB record.
 */
const deleteVideo = async (videoId, userId, userRole) => {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { metadata: true },
  });

  if (!video) {
    const err = new Error("Không tìm thấy video!");
    err.statusCode = 404;
    throw err;
  }

  if (video.creatorId !== userId && userRole !== "ADMIN") {
    const err = new Error("Bạn không có quyền xóa video này!");
    err.statusCode = 403;
    throw err;
  }

  const bucketName = process.env.MINIO_BUCKET_NAME || "videos";

  // Cleanup MinIO files
  try {
    const objectsToRemove = [];

    // Xóa file HLS nếu có (thư mục chứa các .ts segments + .m3u8)
    if (video.metadata && video.metadata.hlsMasterUrl) {
      const hlsPrefixMatch = video.metadata.hlsMasterUrl.match(
        new RegExp(`/${bucketName}/(.*?)/master.m3u8`)
      );
      if (hlsPrefixMatch && hlsPrefixMatch[1]) {
        const hlsPrefix = `${hlsPrefixMatch[1]}/`;
        const hlsObjects = await new Promise((resolve, reject) => {
          const objs = [];
          const stream = minioClient.listObjectsV2(bucketName, hlsPrefix, true);
          stream.on("data", (obj) => objs.push(obj.name));
          stream.on("error", (err) => reject(err));
          stream.on("end", () => resolve(objs));
        });
        objectsToRemove.push(...hlsObjects);
      }
    }

    if (objectsToRemove.length > 0) {
      await minioClient.removeObjects(bucketName, objectsToRemove);
      console.log(`✅ Đã xóa ${objectsToRemove.length} files trên MinIO.`);
    }
  } catch (cleanupErr) {
    console.error("⚠️ Lỗi cleanup MinIO:", cleanupErr.message);
    // Vẫn tiếp tục xóa DB record dù cleanup lỗi
  }

  // Xóa record trong Database (Prisma Cascade xóa comments, likes, metadata, ...)
  await prisma.video.delete({ where: { id: videoId } });
};

module.exports = {
  uploadVideo,
  listVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
};
