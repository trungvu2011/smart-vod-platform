const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Import Prisma Client (Singleton)
const prisma = require("./config/prisma");

// Khởi tạo MinIO bucket
require("./config/minio");

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

// ====================================
// MIDDLEWARES
// ====================================
app.use(
  cors({
    // origin: frontendUrl, trung_cmt
    origin: true,
    credentials: true,
  }),
);
// Raw body parser cho LiveKit webhook (phải đặt TRƯỚC express.json())
app.use("/api/meetings/webhook", express.raw({ type: "*/*" }));
app.use(express.json());
app.use(cookieParser());

// ====================================
// ROUTES
// ====================================
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const videoRoutes = require("./routes/video.routes");
const userRoutes = require("./routes/user.routes");
const playlistRoutes = require("./routes/playlist.routes");
const meetingRoutes = require("./routes/meeting.routes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/users", userRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/meetings", meetingRoutes);

// ====================================
// GLOBAL ERROR HANDLER (phải đặt cuối cùng)
// ====================================
const { errorHandler } = require("./middlewares/error.middleware");
app.use(errorHandler);

// ====================================
// START SERVER
// ====================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`[API] API Gateway đang chạy tại http://localhost:${PORT}`);

  try {
    await prisma.$connect();
    console.log("[API] Kết nối Database PostgreSQL bằng Prisma thành công.");
  } catch (err) {
    console.error(
      "[ERROR] Lỗi kết nối Database. Vui lòng kiểm tra lại file .env hoặc Docker!",
    );
    console.error("[ERROR] Chi tiết lỗi kết nối Database:", err);
  }
});
