const UserService = require('../services/user.service');

class UserController {
  getAll = async (req, res, next) => {
    try {
      const users = await UserService.getAllUsers();
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách người dùng thành công',
        metadata: users
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message
      });
    }
  };

  getById = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const user = await UserService.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: 'Không tìm thấy tài khoản người dùng'
        });
      }
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy thông tin người dùng thành công',
        metadata: user
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message
      });
    }
  };

  create = async (req, res, next) => {
    try {
      const { username, password, fullName, email, role } = req.body;
      if (!username || !password || !role) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Tên tài khoản, Mật khẩu và Nhóm quyền không được để trống'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Mật khẩu phải từ 6 ký tự trở lên'
        });
      }

      const newUser = await UserService.createUser({ username, password, fullName, email, role });
      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Tạo tài khoản người dùng mới thành công',
        metadata: newUser
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: error.message
      });
    }
  };

  updateAdmin = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { fullName, email, role, isActive } = req.body;
      if (!role) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Nhóm quyền không được để trống'
        });
      }

      const updatedUser = await UserService.updateAdminUser(userId, { fullName, email, role, isActive });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Cập nhật tài khoản người dùng thành công',
        metadata: updatedUser
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: error.message
      });
    }
  };

  resetPassword = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }

      const result = await UserService.adminResetPassword(userId, { newPassword });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Đặt lại mật khẩu thành công',
        metadata: result
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: error.message
      });
    }
  };

  toggleStatus = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const currentAdminUserId = req.user?.userId;
      const updatedUser = await UserService.toggleStatus(userId, currentAdminUserId);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: `Đã ${updatedUser.IsActive === 1 ? 'mở khóa' : 'khóa'} tài khoản người dùng`,
        metadata: updatedUser
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: error.message
      });
    }
  };

  deleteUser = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const currentAdminUserId = req.user?.userId;
      const result = await UserService.deleteUser(userId, currentAdminUserId);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Xóa tài khoản người dùng thành công',
        metadata: result
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: error.message
      });
    }
  };
}

module.exports = new UserController();
