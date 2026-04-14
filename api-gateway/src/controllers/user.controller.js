const userService = require("../services/user.service");

// [GET] /api/users/history — Lấy lịch sử xem
const getHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await userService.getHistory(userId);

    res.status(200).json({
      message: "Watch history retrieved successfully.",
      history,
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/users/history — Upsert lịch sử xem (lưu lastSecond)
const upsertHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { videoId, lastSecond } = req.body;

    const record = await userService.upsertHistory(userId, videoId, lastSecond);

    res.status(200).json({
      message: "Watch progress updated successfully.",
      history: record,
    });
  } catch (error) {
    next(error);
  }
};

const getLikedVideos = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const videos = await userService.getLikedVideos(userId);

    res.status(200).json({
      message: "Liked videos retrieved successfully.",
      videos,
    });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = await userService.getNotifications(userId);

    res.status(200).json({
      message: "Notifications retrieved successfully.",
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

const getActivities = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const activities = await userService.getActivities(userId);

    res.status(200).json({
      message: "Activities retrieved successfully.",
      activities,
    });
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessions = await userService.getSessions(userId);

    res.status(200).json({
      message: "Sessions retrieved successfully.",
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getHistory, 
  upsertHistory,
  getLikedVideos,
  getNotifications,
  getActivities,
  getSessions
};
