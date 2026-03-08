const express = require("express");
const router = express.Router();
const { getChannelProfile } = require("../controllers/channel.controller");
const { optionalAuth } = require("../middlewares/auth.middleware");

// API Public: Xem trang cá nhân
router.get("/:id", optionalAuth, getChannelProfile);

module.exports = router;
