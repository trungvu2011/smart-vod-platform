const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import Prisma Client
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

require("./config/minio");

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

// Middlewares
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());

// Import và sử dụng các route
const authRoutes = require("./routes/auth.routes");
const videoRoutes = require("./routes/video.routes");
const userRoutes = require("./routes/user.routes");
const studioRoutes = require("./routes/studio.routes");
const channelRoutes = require("./routes/channel.routes");

app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/users", userRoutes);
app.use("/api/studio", studioRoutes);
app.use("/api/channels", channelRoutes);

const PORT = process.env.PORT || 5000;

// Khởi chạy server và Test kết nối DB bằng Prisma
app.listen(PORT, async () => {
  console.log(`🚀 API Gateway đang chạy tại http://localhost:${PORT}`);

  try {
    // Thử kết nối vào Database thông qua Prisma
    await prisma.$connect();
    console.log("✅ Kết nối Database PostgreSQL bằng Prisma THÀNH CÔNG!");
  } catch (err) {
    console.error(
      "❌ LỖI KẾT NỐI DATABASE. Vui lòng kiểm tra lại file .env hoặc Docker!",
    );
    console.error(err);
  }
});
