const multer = require("multer");

// Bí quyết: Dùng MemoryStorage để lấy luồng dữ liệu (buffer)
// bắn thẳng lên MinIO, KHÔNG lưu tạm vào ổ cứng của Server!
const storage = multer.memoryStorage();

// Cấu hình bộ lọc
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // Giới hạn kích thước file 500MB
  },
  fileFilter: (req, file, cb) => {
    // allow video and image
    if (file.mimetype.startsWith("video/") || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video and image formats are allowed!"), false);
    }
  },
});

module.exports = upload;
