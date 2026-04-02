const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = require("../config/prisma");

/**
 * ADMIN tạo tài khoản nhân sự mới.
 * Tự động sinh mật khẩu ngẫu nhiên (12 ký tự).
 * Trả về thông tin user + mật khẩu mặc định (chỉ hiển thị 1 lần).
 */
const createUser = async ({ fullName, email, role }) => {
  if (!fullName || !email) {
    const err = new Error("Vui lòng cung cấp fullName và email!");
    err.statusCode = 400;
    throw err;
  }

  // Kiểm tra email đã tồn tại chưa
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email này đã được sử dụng!");
    err.statusCode = 409;
    throw err;
  }

  // Tạo mật khẩu ngẫu nhiên
  const defaultPassword = crypto.randomBytes(6).toString("hex"); // 12 ký tự hex

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(defaultPassword, salt);

  const newUser = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash: hashedPassword,
      role: role || "USER", // Mặc định là USER nếu không truyền
    },
  });

  return {
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    },
    defaultPassword, // Trả về cho Admin để cấp cho nhân viên
  };
};

/**
 * Lấy danh sách tất cả nhân sự (không trả về passwordHash).
 */
const listUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return users;
};

module.exports = { createUser, listUsers };
