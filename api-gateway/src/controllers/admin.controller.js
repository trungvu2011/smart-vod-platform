const adminService = require("../services/admin.service");

// --- USER MANAGEMENT ---

const createUser = async (req, res, next) => {
  try {
    const { fullName, email, role, department, title } = req.body;
    const result = await adminService.createUser({ fullName, email, role, department, title });
    res.status(201).json({
      message: "User created successfully.",
      user: result.user,
      defaultPassword: result.defaultPassword,
    });
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const { search, department, status, role, page, limit } = req.query;
    const result = await adminService.listUsers({
      search,
      department,
      status,
      role,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = await adminService.updateUserStatus(id, status);
    res.status(200).json({ message: "User status updated.", user });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await adminService.updateUserRole(id, role);
    res.status(200).json({ message: "User role updated.", user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await adminService.updateUser(id, req.body);
    res.status(200).json({ message: "User updated.", user });
  } catch (error) {
    next(error);
  }
};

// --- CONTENT MODERATION ---

const getModerationQueue = async (req, res, next) => {
  try {
    const { status } = req.query;
    const videos = await adminService.getModerationQueue(status || null);
    res.status(200).json({ videos });
  } catch (error) {
    next(error);
  }
};

const getAllVideos = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await adminService.getAllVideos({
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const approveVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const video = await adminService.approveVideo(videoId);
    res.status(200).json({ message: "Video approved successfully.", video });
  } catch (error) {
    next(error);
  }
};

const rejectVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { reason } = req.body;
    const video = await adminService.rejectVideo(videoId, reason);
    res.status(200).json({ message: "Video rejected.", video });
  } catch (error) {
    next(error);
  }
};

const bulkApproveVideos = async (req, res, next) => {
  try {
    const { videoIds } = req.body;
    if (!videoIds || !Array.isArray(videoIds)) {
      return res.status(400).json({ message: "videoIds array is required." });
    }
    const results = await adminService.bulkApproveVideos(videoIds);
    res.status(200).json({ message: "Bulk approve completed.", results });
  } catch (error) {
    next(error);
  }
};

const bulkRejectVideos = async (req, res, next) => {
  try {
    const { videoIds, reason } = req.body;
    if (!videoIds || !Array.isArray(videoIds)) {
      return res.status(400).json({ message: "videoIds array is required." });
    }
    const results = await adminService.bulkRejectVideos(videoIds, reason);
    res.status(200).json({ message: "Bulk reject completed.", results });
  } catch (error) {
    next(error);
  }
};

// --- SYSTEM ANALYTICS ---

const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await adminService.getDashboardMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    next(error);
  }
};

const getAnalyticsMetrics = async (req, res, next) => {
  try {
    const metrics = await adminService.getAnalyticsMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    next(error);
  }
};

const exportUsersCsv = async (req, res, next) => {
  try {
    const csv = await adminService.exportUsersCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

const importUsersCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required." });
    }

    const csv = await adminService.importUsersCsv(req.file.buffer);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=created_accounts.csv");
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  listUsers,
  updateUserStatus,
  updateUserRole,
  updateUser,
  getModerationQueue,
  getAllVideos,
  approveVideo,
  rejectVideo,
  bulkApproveVideos,
  bulkRejectVideos,
  getDashboardMetrics,
  getAnalyticsMetrics,
  exportUsersCsv,
  importUsersCsv,
};
