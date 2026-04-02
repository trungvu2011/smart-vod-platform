/**
 * errorHandler - Global Error Handler Middleware.
 * Đặt cuối cùng trong chuỗi middleware của Express.
 * Bắt tất cả lỗi chưa được xử lý từ các route/controller.
 */
const errorHandler = (err, req, res, next) => {
  console.error("❌ [Global Error Handler]:", err.stack || err.message);

  // Lỗi từ Multer (file quá lớn, sai định dạng, ...)
  if (err.name === "MulterError") {
    return res.status(400).json({
      message: `Lỗi upload file: ${err.message}`,
    });
  }

  // Lỗi custom (có thể throw từ Service layer)
  if (err.message === "Chỉ cho phép tải lên các định dạng Video!") {
    return res.status(400).json({ message: err.message });
  }

  // Lỗi Prisma (trùng unique, record not found, ...)
  if (err.code === "P2002") {
    return res.status(409).json({ message: "Dữ liệu đã tồn tại (trùng lặp)!" });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ message: "Không tìm thấy bản ghi!" });
  }

  // Lỗi chung
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Đã xảy ra lỗi nội bộ server!",
  });
};

module.exports = { errorHandler };
