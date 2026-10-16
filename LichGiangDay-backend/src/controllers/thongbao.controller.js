const ThongBaoService = require('../services/thongbao.service');

class ThongBaoController {
  getMyNotifications = async (req, res, next) => {
    try {
      const list = await ThongBaoService.getMyNotifications(req.user.userId);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách thông báo thành công',
        metadata: list
      });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req, res, next) => {
    try {
      const { id } = req.params;
      await ThongBaoService.markAsRead(req.user.userId, id);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Đã đánh dấu thông báo là đã đọc',
        metadata: { success: true }
      });
    } catch (error) {
      next(error);
    }
  };

  countUnread = async (req, res, next) => {
    try {
      const unreadCount = await ThongBaoService.countUnread(req.user.userId);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy số lượng thông báo chưa đọc thành công',
        metadata: { unreadCount }
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ThongBaoController();
