const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// [GET] Lấy hồ sơ Kênh (User) và danh sách video công khai
const getChannelProfile = async (req, res) => {
  try {
    const { id } = req.params; // Lấy ID kênh

    // 1. Tìm thông tin User (Kênh) kèm theo số lượng người đăng ký
    const channel = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatar_url: true,
        bio: true,
        created_at: true,
        _count: {
          select: {
            subscribers: true // Lấy tổng số lượng subscriber
          }
        }
      }
    });

    if (!channel) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ kênh này!" });
    }

    // 2. Tìm danh sách video của kênh (chỉ lấy video 'ready' và 'public')
    const videos = await prisma.video.findMany({
      where: {
        user_id: id,
        status: 'ready',
        visibility: 'public'
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({
      message: "Lấy thông tin kênh thành công",
      channel: {
         id: channel.id,
         username: channel.username,
         avatar_url: channel.avatar_url,
         bio: channel.bio,
         created_at: channel.created_at,
         totalSubscribers: channel._count.subscribers
      },
      videos
    });
  } catch (error) {
    console.error("❌ Lỗi lấy hồ sơ kênh:", error);
    res.status(500).json({ message: "Lỗi server khi lấy hồ sơ kênh" });
  }
};

module.exports = { getChannelProfile };
