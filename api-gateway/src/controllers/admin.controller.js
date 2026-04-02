const adminService = require("../services/admin.service");

// [POST] /api/admin/users — ADMIN tạo tài khoản nhân sự
const createUser = async (req, res, next) => {
  try {
    const { fullName, email, role } = req.body;
    const result = await adminService.createUser({ fullName, email, role });

    res.status(201).json({
      message: "Tạo tài khoản nhân sự thành công!",
      user: result.user,
      defaultPassword: result.defaultPassword,
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /api/admin/users — ADMIN lấy danh sách nhân sự
const listUsers = async (req, res, next) => {
  try {
    const users = await adminService.listUsers();

    res.status(200).json({
      message: "Lấy danh sách nhân sự thành công!",
      users,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createUser, listUsers };
