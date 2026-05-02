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
router.put("/users/:id", adminController.updateUser);
router.put("/users/:id/status", adminController.updateUserStatus);
router.put("/users/:id/role", adminController.updateUserRole);
router.get("/users/export-csv", adminController.exportUsersCsv);

// Moderation
router.get("/moderation/queue", adminController.getModerationQueue);
router.post("/moderation/:videoId/approve", adminController.approveVideo);
router.post("/moderation/:videoId/reject", adminController.rejectVideo);
router.post("/moderation/bulk-approve", adminController.bulkApproveVideos);
router.post("/moderation/bulk-reject", adminController.bulkRejectVideos);

// Videos (all statuses)
router.get("/videos", adminController.getAllVideos);

// Dashboard & Analytics
router.get("/metrics/dashboard", adminController.getDashboardMetrics);
router.get("/metrics/analytics", adminController.getAnalyticsMetrics);

module.exports = router;
