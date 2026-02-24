const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import Prisma Client
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

// Middlewares
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());

// Import và sử dụng các route
const authRoutes = require("./routes/auth.routes");

app.use("/api/auth", authRoutes);

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
