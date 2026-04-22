const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { roleGuard } = require("../middlewares/role.middleware");

// Tất cả route admin đều yêu cầu: đăng nhập + role ADMIN
router.use(verifyToken, roleGuard("ADMIN"));

// Users
router.post("/users", adminController.createUser);
router.get("/users", adminController.listUsers);
router.put("/users/:id/status", adminController.updateUserStatus);
router.put("/users/:id/role", adminController.updateUserRole);

// Moderation
router.get("/moderation/queue", adminController.getModerationQueue);
router.post("/moderation/:videoId/approve", adminController.approveVideo);
router.post("/moderation/:videoId/reject", adminController.rejectVideo);

// Dashboard & Analytics
router.get("/metrics/dashboard", adminController.getDashboardMetrics);
router.get("/metrics/analytics", adminController.getAnalyticsMetrics);

module.exports = router;
