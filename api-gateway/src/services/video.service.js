const prisma = require("../config/prisma");
const minioClient = require("../config/minio");
const videoQueue = require("../config/queue");
const redisClient = require("../config/redis");
const path = require("path");
const crypto = require("crypto");

const canViewNonReadyVideo = (video, requester) => {
  if (!video || video.status === "READY") return true;
  if (!requester) return false;
  return requester.role === "ADMIN" || requester.id === video.creatorId;
};

/**
 * Upload video: lưu file lên MinIO, tạo DB record PENDING, đẩy job BullMQ.
 * Trả về ngay lập tức — KHÔNG chờ FFmpeg hay AI xử lý.
 */
const uploadVideo = async (userId, file, thumbnailFile, title, description, category, visibility) => {
  if (!file) {
    const err = new Error("Please attach a video file!");
    err.statusCode = 400;
    throw err;
  }
  if (!title) {
    const err = new Error("Please enter a title for the video!");
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
    metaData,
  );

  // 3. Tạo URL trỏ tới file gốc trên MinIO
  const rawUrl = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${uniqueFilename}`;

  // 3.5. Upload thumbnail if exists
  let thumbUrl = null;
  if (thumbnailFile) {
    const tExt = path.extname(thumbnailFile.originalname);
    const tName = `thumbnails/${crypto.randomUUID()}${tExt}`;
    await minioClient.putObject(bucketName, tName, thumbnailFile.buffer, thumbnailFile.size, { "Content-Type": thumbnailFile.mimetype });
    thumbUrl = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${tName}`;
  }

  // 4. Lưu vào Database với status PENDING
  const newVideo = await prisma.video.create({
    data: {
      creatorId: userId,
      title: title,
      description: description || null,
      category: category || null,
      visibility: visibility || "ORG",
      status: "PENDING",
      thumbnailUrl: thumbUrl,
    },
  });

  // 5. Đẩy Job vào BullMQ để Worker xử lý (HLS, thumbnail, AI, ...)
  await videoQueue.add(
    "process-hls", 
    {
      videoId: newVideo.id,
      originalFilename: uniqueFilename,
      fileUrl: rawUrl,
      shouldGenerateThumbnail: !thumbUrl,
    },
    { jobId: newVideo.id } // Set custom jobId to easily track progress
  );

  return newVideo;
};

/**
 * Lấy danh sách video — có phân trang và lọc theo status.
 * Mặc định chỉ hiển thị video READY cho trang chủ.
 */
const listVideos = async (page = 1, limit = 12, status = null, category = null, q = null) => {
  const skip = (page - 1) * limit;

  const where = {};
  if (status) {
    where.status = status;
  } else {
    where.status = "READY";
  }
  if (category) {
    where.category = category;
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { creator: { fullName: { contains: q, mode: 'insensitive' } } },
    ];
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
        metadata: {
          select: { duration: true }
        }
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
const getVideoById = async (videoId, requester = null) => {
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
  if (!canViewNonReadyVideo(video, requester)) {
    const err = new Error("Video is pending moderation and is not publicly available.");
    err.statusCode = 403;
    throw err;
  }

  return video;
};

/**
 * Ghi nhận 1 lượt xem với cơ chế chống Spam IP bằng Redis.
 * Mỗi IP chỉ được tính 1 view cho 1 video trong vòng 15 phút.
 */
const recordView = async (videoId, ipAddress) => {
  if (!videoId) {
    const err = new Error("Video ID is required");
    err.statusCode = 400;
    throw err;
  }

  const redisKey = `view:${videoId}:${ipAddress}`;
  
  // Kiểm tra xem IP này đã xem video này trong vòng 15 phút qua chưa
  const existingView = await redisClient.get(redisKey);
  if (existingView) {
    return { success: false, message: "View already counted recently for this IP" };
  }

  // Cập nhật lượt xem vào database
  await prisma.video.update({
    where: { id: videoId },
    data: { viewCount: { increment: 1 } },
  });

  // Đặt key chặn spam trong 900 giây (15 phút)
  await redisClient.setex(redisKey, 900, "1");

  return { success: true, message: "View recorded successfully" };
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
        new RegExp(`/${bucketName}/(.*?)/master.m3u8`),
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
      console.log(`[API] Đã xóa ${objectsToRemove.length} file trên MinIO.`);
    }
  } catch (cleanupErr) {
    console.error("[ERROR] Lỗi cleanup MinIO:", cleanupErr.message);
    // Vẫn tiếp tục xóa DB record dù cleanup lỗi
  }

  // Xóa record trong Database (Prisma Cascade xóa comments, likes, metadata, ...)
  await prisma.video.delete({ where: { id: videoId } });
};

const getAiSummary = async (videoId, requester = null) => {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, status: true, creatorId: true },
  });
  if (!video) {
    const err = new Error("Không tìm thấy video này!");
    err.statusCode = 404;
    throw err;
  }
  if (!canViewNonReadyVideo(video, requester)) {
    const err = new Error("Video is pending moderation and is not publicly available.");
    err.statusCode = 403;
    throw err;
  }

  const metadata = await prisma.videoMetadata.findUnique({
    where: { videoId }
  });
  if (!metadata) return null;
  return metadata.aiSummary;
};

/**
 * Get job progress from BullMQ using videoId (which is used as jobId)
 */
const getVideoProgress = async (videoId) => {
  const job = await videoQueue.getJob(videoId);
  if (!job) return null;
  const state = await job.getState();
  let progress = job.progress || 0;
  
  return {
    state,
    progress: typeof progress === 'number' ? progress : 0,
  };
};

module.exports = {
  uploadVideo,
  listVideos,
  getVideoById,
  recordView,
  updateVideo,
  deleteVideo,
  getAiSummary,
  getVideoProgress,
};
