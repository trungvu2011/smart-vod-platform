const adminService = require("../services/admin.service");

// --- USER MANAGEMENT ---

const createUser = async (req, res, next) => {
  try {
    const { fullName, email, role } = req.body;
    const result = await adminService.createUser({ fullName, email, role });
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
    const users = await adminService.listUsers();
    res.status(200).json({ users });
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

// --- CONTENT MODERATION ---

const getModerationQueue = async (req, res, next) => {
  try {
    const videos = await adminService.getModerationQueue();
    res.status(200).json({ videos });
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

module.exports = {
  createUser,
  listUsers,
  updateUserStatus,
  updateUserRole,
  getModerationQueue,
  approveVideo,
  rejectVideo,
  getDashboardMetrics,
  getAnalyticsMetrics,
};
