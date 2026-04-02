const express = require("express");
const router = express.Router();
const { login, changePassword } = require("../controllers/auth.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// Đăng nhập — public (không cần token)
router.post("/login", login);

// Đổi mật khẩu — cần đăng nhập
router.post("/change-password", verifyToken, changePassword);

module.exports = router;
