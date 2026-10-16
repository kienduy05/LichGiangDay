const BienDongLichService = require('../services/biendonglich.service');

class BienDongLichController {
  // GET /v1/api/biendong-lich/all (Chỉ ADMIN, PHONGDAOTAO)
  getAll = async (req, res, next) => {
    try {
      if (!['ADMIN', 'PHONGDAOTAO'].includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          code: 403,
          message: 'Từ chối truy cập: API toàn trường chỉ dành cho Quản trị viên và Phòng Đào Tạo.'
        });
      }

      const { maHocKy, maKhoa, maBoMon, loaiBienDong, trangThai, search } = req.query;
      const data = await BienDongLichService.getBienDongLich(req.user, {
        maHocKy,
        maKhoa,
        maBoMon,
        loaiBienDong,
        trangThai,
        search
      });

      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách biến động lịch toàn trường thành công',
        metadata: data
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi lấy biến động lịch toàn trường',
        metadata: null
      });
    }
  };

  // GET /v1/api/biendong-lich/bomon (Dành cho BOMON, giới hạn phạm vi bộ môn)
  getBoMon = async (req, res, next) => {
    try {
      const { maHocKy, loaiBienDong, trangThai, search } = req.query;
      const data = await BienDongLichService.getBienDongLich(req.user, {
        maHocKy,
        loaiBienDong,
        trangThai,
        search
      });

      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách biến động lịch bộ môn thành công',
        metadata: data
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi lấy biến động lịch bộ môn',
        metadata: null
      });
    }
  };

  // POST /v1/api/biendong-lich/:id/revoke (Chỉ ADMIN, PHONGDAOTAO)
  revoke = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { lyDoThuHoi } = req.body;
      const result = await BienDongLichService.revokeBienDong(req.user, id, { lyDoThuHoi });

      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Thu hồi biến động lịch thành công',
        metadata: result
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi thu hồi biến động lịch',
        metadata: null
      });
    }
  };
}

module.exports = new BienDongLichController();
