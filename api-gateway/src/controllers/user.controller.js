const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// [GET] Lấy lịch sử xem của user hiện tại
const getHistory = async (req, res) => {
  try {
    const userId = req.user.id; // Từ auth middleware

    const history = await prisma.watchHistory.findMany({
      where: { user_id: userId },
      orderBy: { watched_at: 'desc' },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnail_url: true,
            duration: true,
            views: true,
            created_at: true,
            user: { // Channel owner
              select: {
                id: true,
                username: true,
                avatar_url: true
              }
            }
          }
        }
      }
    });

    res.status(200).json({
      message: "Lấy lịch sử xem thành công",
      history
    });
  } catch (error) {
    console.error("❌ Lỗi lấy lịch sử xem:", error);
    res.status(500).json({ message: "Lỗi server khi lấy lịch sử xem" });
  }
};

// [GET] Lấy danh sách đăng ký kênh của user hiện tại
const getSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await prisma.subscription.findMany({
      where: { subscriber_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        channel: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            bio: true
          }
        }
      }
    });

    res.status(200).json({
      message: "Lấy danh sách kênh đăng ký thành công",
      subscriptions
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách đăng ký:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách đăng ký" });
  }
};

module.exports = { getHistory, getSubscriptions };
