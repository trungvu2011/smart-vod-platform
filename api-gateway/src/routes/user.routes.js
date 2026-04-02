const express = require("express");
const router = express.Router();
const { getHistory, upsertHistory } = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// Tất cả route user đều cần đăng nhập
router.get("/history", verifyToken, getHistory);
router.post("/history", verifyToken, upsertHistory);

module.exports = router;
