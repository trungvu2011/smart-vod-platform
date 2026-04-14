const authService = require("../services/auth.service");

// [POST] /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.status(200).json({
      message: "Login successful.",
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    await authService.changePassword(userId, oldPassword, newPassword);

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, changePassword };
