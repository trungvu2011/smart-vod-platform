/**
 * roleGuard - Middleware kiểm tra vai trò (RBAC).
 * Sử dụng: roleGuard('ADMIN') hoặc roleGuard('ADMIN', 'USER')
 * Phải đặt SAU verifyToken để req.user đã tồn tại.
 */
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user được gắn bởi verifyToken middleware
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Không xác thực được người dùng!" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập tài nguyên này!",
      });
    }

    next();
  };
};

module.exports = { roleGuard };
