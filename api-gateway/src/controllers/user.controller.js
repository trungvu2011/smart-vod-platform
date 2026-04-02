const userService = require("../services/user.service");

// [GET] /api/users/history — Lấy lịch sử xem
const getHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await userService.getHistory(userId);

    res.status(200).json({
      message: "Lấy lịch sử xem thành công!",
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
      message: "Cập nhật lịch sử xem thành công!",
      history: record,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHistory, upsertHistory };
