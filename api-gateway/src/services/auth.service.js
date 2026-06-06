const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

/**
 * Xử lý đăng nhập bằng email & password.
 * Trả về accessToken và thông tin user.
 */
const login = async (email, password, sessionMeta = {}) => {
  if (!email || !password) {
    const err = new Error("Vui lòng cung cấp email và mật khẩu!");
    err.statusCode = 400;
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const err = new Error("Email hoặc mật khẩu không chính xác!");
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const err = new Error("Email hoặc mật khẩu không chính xác!");
    err.statusCode = 401;
    throw err;
  }

  // Tạo Access Token — payload chứa id, email, role
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );

  // Ghi lại phiên đăng nhập (best-effort: lỗi session không được chặn đăng nhập).
  // Đánh dấu các phiên cũ không còn là "current" để chúng có thể bị thu hồi.
  try {
    await prisma.session.updateMany({
      where: { userId: user.id, isCurrent: true },
      data: { isCurrent: false },
    });
    await prisma.session.create({
      data: {
        userId: user.id,
        device: (sessionMeta.device || "Unknown device").slice(0, 255),
        location: (sessionMeta.location || "Unknown").slice(0, 255),
        isCurrent: true,
      },
    });
  } catch (sessionError) {
    console.error("[AUTH] Khong the tao session:", sessionError.message);
  }

  return {
    accessToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
  };
};

/**
 * Đổi mật khẩu cho user đang đăng nhập.
 */
const changePassword = async (userId, oldPassword, newPassword) => {
  if (!oldPassword || !newPassword) {
    const err = new Error("Vui lòng cung cấp mật khẩu cũ và mật khẩu mới!");
    err.statusCode = 400;
    throw err;
  }

  if (newPassword.length < 6) {
    const err = new Error("Mật khẩu mới phải có ít nhất 6 ký tự!");
    err.statusCode = 400;
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error("Không tìm thấy người dùng!");
    err.statusCode = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) {
    const err = new Error("Mật khẩu cũ không chính xác!");
    err.statusCode = 401;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });
};

module.exports = { login, changePassword };
