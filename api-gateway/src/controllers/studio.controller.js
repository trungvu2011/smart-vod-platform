const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const minioClient = require("../config/minio");

// [GET] Lấy danh sách video của user hiện tại
const getStudioVideos = async (req, res) => {
  try {
    const userId = req.user.id; // Từ auth middleware

    const videos = await prisma.video.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({
      message: "Lấy danh sách video thành công",
      videos,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách video studio:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách video studio" });
  }
};

// [PUT] Cập nhật thông tin video
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, thumbnail_url, visibility } = req.body;

    // Kiểm tra xem video có tồn tại và thuộc về user này không
    const video = await prisma.video.findFirst({
      where: { id, user_id: userId },
    });

    if (!video) {
      return res.status(404).json({ message: "Không tìm thấy video hoặc bạn không có quyền sửa!" });
    }

    const updatedVideo = await prisma.video.update({
      where: { id },
      data: {
        title: title || video.title,
        description: description !== undefined ? description : video.description,
        thumbnail_url: thumbnail_url !== undefined ? thumbnail_url : video.thumbnail_url,
        visibility: visibility || video.visibility,
      },
    });

    res.status(200).json({
      message: "Cập nhật video thành công",
      video: updatedVideo,
    });
  } catch (error) {
    console.error("❌ Lỗi cập nhật video:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật video" });
  }
};

// [DELETE] Xóa video
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 1. Lấy thông tin video để biết đường dẫn file
    const video = await prisma.video.findFirst({
      where: { id, user_id: userId },
    });

    if (!video) {
      return res.status(404).json({ message: "Không tìm thấy video hoặc bạn không có quyền xóa!" });
    }

    const bucketName = process.env.MINIO_BUCKET_NAME || 'videos';

    // 2. Xóa các file vật lý trên MinIO
    const objectsToRemove = [];

    // Xóa file gốc (raw_url)
    if (video.raw_url) {
      const rawUrlParts = video.raw_url.split(`/${bucketName}/`);
      if (rawUrlParts.length > 1) {
        objectsToRemove.push(rawUrlParts[1]); // Ví dụ: '123e4567.mp4'
      }
    }

    // Xóa file ảnh bìa (thumbnail_url)
    if (video.thumbnail_url) {
       // Cần cẩn thận với domain ngoài vs domain minio nội bộ. Giả sử lưu trên MinIO cùng bucket:
       const thumbParts = video.thumbnail_url.split(`/${bucketName}/`);
       if (thumbParts.length > 1) {
          objectsToRemove.push(thumbParts[1]);
       }
    }

    // Xóa thư mục HLS (xóa nhiều file bên trong thư mục)
    // HLS url thường có dạng: http://.../videos/hls/123/master.m3u8
    // Tên thư mục prefix sẽ là: hls/123/
    if (video.hls_url) {
        const hlsPrefixMatch = video.hls_url.match(new RegExp(`/${bucketName}/(.*?)/master.m3u8`));
        if (hlsPrefixMatch && hlsPrefixMatch[1]) {
            const hlsPrefix = `${hlsPrefixMatch[1]}/`; // Ví dụ: 'hls/123/'
            
            // Liệt kê và xóa tất cả object trong thư mục HLS này
             const hlsObjects = await new Promise((resolve, reject) => {
                const objs = [];
                const stream = minioClient.listObjectsV2(bucketName, hlsPrefix, true);
                stream.on('data', obj => objs.push(obj.name));
                stream.on('error', err => reject(err));
                stream.on('end', () => resolve(objs));
            });
            objectsToRemove.push(...hlsObjects);
        }
    }

    // Thực hiện xóa hàng loạt trên MinIO
    if (objectsToRemove.length > 0) {
        await minioClient.removeObjects(bucketName, objectsToRemove);
        console.log(`✅ Đã xóa ${objectsToRemove.length} files vật lý trên MinIO.`);
    }

    // 3. Xóa record trong Database (Prisma Cascade sẽ lo các bảng liên quan)
    await prisma.video.delete({
      where: { id },
    });

    res.status(200).json({ message: "Xóa video và file dữ liệu thành công" });
  } catch (error) {
    console.error("❌ Lỗi xóa video:", error);
    res.status(500).json({ message: "Lỗi server khi xóa video" });
  }
};

module.exports = { getStudioVideos, updateVideo, deleteVideo };
