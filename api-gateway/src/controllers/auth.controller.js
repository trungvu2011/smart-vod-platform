const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ms = require("ms");

const prisma = new PrismaClient();

// [POST] Đăng ký tài khoản
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp đầy đủ thông tin!" });
    }

    // Kiểm tra xem user hoặc email đã tồn tại chưa
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username hoặc Email đã được sử dụng!" });
    }

    // Băm mật khẩu (Hash password)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Lưu vào Database cực kỳ nhàn nhã với Prisma
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
      },
    });

    res.status(201).json({
      message: "Đăng ký thành công!",
      user: { id: newUser.id, username: newUser.username },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi đăng ký" });
  }
};

// [POST] Đăng nhập
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp tên đăng nhập và mật khẩu!" });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res
        .status(400)
        .json({ message: "Sai tên đăng nhập hoặc mật khẩu!" });
    }

    // Tạo Access Token (Sống 15 phút)
    const accessToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN },
    );

    // Tạo Refresh Token (Sống 7 ngày)
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN },
    );

    // Lưu Refresh Token vào Database để quản lý
    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: refreshToken },
    });

    // Gắn Refresh Token vào HttpOnly Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: ms(process.env.JWT_REFRESH_EXPIRES_IN),
    });

    res.status(200).json({
      message: "Đăng nhập thành công!",
      accessToken,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [POST] Làm mới Access Token (Khi Access Token hết hạn)
const refreshToken = async (req, res) => {
  try {
    // Lấy Refresh Token từ Cookie
    const token = req.cookies.refreshToken;

    if (!token)
      return res.status(401).json({ message: "Không tìm thấy Refresh Token!" });

    // Kiểm tra xem token này có hợp lệ và có trong DB không
    const user = await prisma.user.findFirst({
      where: { refresh_token: token },
    });
    if (!user)
      return res
        .status(403)
        .json({ message: "Refresh Token không hợp lệ hoặc đã bị thu hồi!" });

    // Xác thực Refresh Token với Secret Key
    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err)
        return res.status(403).json({ message: "Refresh Token đã hết hạn!" });

      // Cấp lại Access Token mới (15 phút)
      const newAccessToken = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN },
      );

      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [POST] Đăng xuất (Xóa Refresh Token khỏi DB)
const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { refresh_token: null }, // Xóa refresh token trong DB
    });

    res.clearCookie("refreshToken");

    res.status(200).json({ message: "Đăng xuất thành công!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi đăng xuất" });
  }
};

module.exports = { register, login, refreshToken, logout };
