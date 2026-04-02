const express = require("express");
const router = express.Router();
const { createUser, listUsers } = require("../controllers/admin.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { roleGuard } = require("../middlewares/role.middleware");

// Tất cả route admin đều yêu cầu: đăng nhập + role ADMIN
router.post("/users", verifyToken, roleGuard("ADMIN"), createUser);
router.get("/users", verifyToken, roleGuard("ADMIN"), listUsers);

module.exports = router;
