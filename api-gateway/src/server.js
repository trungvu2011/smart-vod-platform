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
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ====================================
// ROUTES
// ====================================
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const videoRoutes = require("./routes/video.routes");
const userRoutes = require("./routes/user.routes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/users", userRoutes);

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
  console.log(`🚀 API Gateway đang chạy tại http://localhost:${PORT}`);

  try {
    await prisma.$connect();
    console.log("✅ Kết nối Database PostgreSQL bằng Prisma THÀNH CÔNG!");
  } catch (err) {
    console.error(
      "❌ LỖI KẾT NỐI DATABASE. Vui lòng kiểm tra lại file .env hoặc Docker!"
    );
    console.error(err);
  }
});
