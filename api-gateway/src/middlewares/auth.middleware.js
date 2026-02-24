const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Lấy token từ header (chuẩn là: Authorization: Bearer <token>)
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Từ chối truy cập! Không tìm thấy Token." });
  }

  try {
    // Giải mã token xem có hợp lệ/hết hạn không
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Dán thông tin user (đã giải mã) vào request để các hàm phía sau xài
    req.user = decoded;

    next(); // Cho phép đi tiếp vào Controller
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};

module.exports = { verifyToken };
