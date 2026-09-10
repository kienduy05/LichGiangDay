const AccessService = require('../services/access.service');

class AccessController {
  login = async (req, res, next) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Username và Password không được để trống.'
        });
      }

      const result = await AccessService.login({ username, password });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Đăng nhập thành công!',
        metadata: result
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi hệ thống khi đăng nhập.'
      });
    }
  };

  logout = async (req, res, next) => {
    try {
      await AccessService.logout(req.keyStore);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Đăng xuất thành công!'
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi hệ thống khi đăng xuất.'
      });
    }
  };

  getMe = async (req, res, next) => {
    try {
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy thông tin tài khoản thành công.',
        metadata: req.user
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi khi lấy thông tin tài khoản.'
      });
    }
  };

  updateProfile = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { fullName, email } = req.body;
      if (!fullName || !email) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Họ tên và Email không được để trống.'
        });
      }

      const updatedUser = await AccessService.updateProfile({ userId, fullName, email });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Cập nhật thông tin thành công!',
        metadata: updatedUser
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi cập nhật thông tin.'
      });
    }
  };

  changePassword = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Mật khẩu cũ và Mật khẩu mới không được để trống.'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Mật khẩu mới phải từ 6 ký tự trở lên.'
        });
      }

      await AccessService.changePassword({ userId, oldPassword, newPassword });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Đổi mật khẩu thành công!'
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi đổi mật khẩu.'
      });
    }
  };
}

module.exports = new AccessController();
