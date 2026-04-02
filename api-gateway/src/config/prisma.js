const { PrismaClient } = require("@prisma/client");

// Singleton: Chỉ tạo DUY NHẤT một instance PrismaClient cho toàn bộ ứng dụng
const prisma = new PrismaClient();

module.exports = prisma;
