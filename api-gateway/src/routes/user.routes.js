const express = require("express");
const router = express.Router();
const { getHistory, getSubscriptions } = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// Cần đăng nhập
router.get("/history", verifyToken, getHistory);
router.get("/subscriptions", verifyToken, getSubscriptions);

module.exports = router;
