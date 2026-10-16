const DangKyDayBuService = require('../services/dangkydaybu.service');

class DangKyDayBuController {
  // GET /v1/api/dangkydaybu/ca-chua-bu
  getCaChuaBu = async (req, res, next) => {
    try {
      const list = await DangKyDayBuService.getCaChuaBu(req.user);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách ca chưa dạy bù thành công',
        metadata: list
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi lấy ca chưa dạy bù',
        metadata: null
      });
    }
  };

  // GET /v1/api/dangkydaybu/phong-trong
  getPhongTrong = async (req, res, next) => {
    try {
      const { maBuoiHoc, tuNgay, maTiet } = req.query;
      const rooms = await DangKyDayBuService.getPhongTrong(req.user, { maBuoiHoc, tuNgay, maTiet });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách phòng trống thành công',
        metadata: rooms
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi tìm phòng trống',
        metadata: null
      });
    }
  };

  // POST /v1/api/dangkydaybu
  createDangKyDayBu = async (req, res, next) => {
    try {
      const result = await DangKyDayBuService.createDangKyDayBu(req.user, req.body);
      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Đăng ký dạy bù thành công và đã được xác nhận',
        metadata: result
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi đăng ký dạy bù',
        metadata: error.metadata || null
      });
    }
  };
}

module.exports = new DangKyDayBuController();
