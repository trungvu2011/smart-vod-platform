const jwt = require("jsonwebtoken");

/**
 * verifyToken - Middleware xác thực JWT bắt buộc.
 * Lấy token từ header: Authorization: Bearer <token>
 * Giải mã và gắn payload (id, email, role) vào req.user.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Từ chối truy cập! Không tìm thấy Token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded chứa: { id, email, role, iat, exp }
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};

/**
 * optionalAuth - Middleware xác thực tùy chọn.
 * Nếu có token hợp lệ → gắn req.user.
 * Nếu không có hoặc token lỗi → req.user = null, vẫn cho đi tiếp.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    req.user = null;
  }
  next();
};

module.exports = { verifyToken, optionalAuth };
