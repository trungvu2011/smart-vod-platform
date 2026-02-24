const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  refreshToken,
} = require("../controllers/auth.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// Khai báo các endpoint
router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.post("/refresh-token", refreshToken);

module.exports = router;
