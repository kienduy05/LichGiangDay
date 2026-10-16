const YeuCauNghiService = require('../services/yeucaunghi.service');

class YeuCauNghiController {
  // GET /v1/api/lich-giang-vien
  getLichGiangVien = async (req, res, next) => {
    try {
      const { tuNgay, denNgay } = req.query;
      const data = await YeuCauNghiService.getLichGiangVien(req.user, { tuNgay, denNgay });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy lịch giảng dạy thành công',
        metadata: data
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi server khi lấy lịch giảng dạy',
        metadata: error.metadata || null
      });
    }
  };

  // POST /v1/api/yeucaunghi
  createYeuCau = async (req, res, next) => {
    try {
      const result = await YeuCauNghiService.createYeuCau(req.user, req.body);
      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Tạo yêu cầu thành công',
        metadata: result
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi tạo yêu cầu',
        metadata: error.metadata || null
      });
    }
  };

  // GET /v1/api/yeucaunghi/cua-toi
  getCuaToi = async (req, res, next) => {
    try {
      const { loaiYeuCau, trangThai } = req.query;
      const list = await YeuCauNghiService.getCuaToi(req.user, { loaiYeuCau, trangThai });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách yêu cầu của tôi thành công',
        metadata: list
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi lấy danh sách yêu cầu',
        metadata: null
      });
    }
  };

  // PUT /v1/api/yeucaunghi/:id/huy
  huyYeuCau = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await YeuCauNghiService.huyYeuCau(req.user, id);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Hủy yêu cầu thành công',
        metadata: result
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi hủy yêu cầu',
        metadata: null
      });
    }
  };

  // GET /v1/api/giangvien/dong-nghiep-trong
  getDongNghiepTrong = async (req, res, next) => {
    try {
      const { maBuoiHoc } = req.query;
      if (!maBuoiHoc) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Vui lòng cung cấp maBuoiHoc'
        });
      }
      const colleagues = await YeuCauNghiService.getDongNghiepTrong(req.user, maBuoiHoc);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách đồng nghiệp rảnh thành công',
        metadata: colleagues
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi tìm đồng nghiệp rảnh',
        metadata: null
      });
    }
  };

  // GET /v1/api/yeucaunghi/bomon
  getDanhSachBoMon = async (req, res, next) => {
    try {
      const { maHocKy, loaiYeuCau, trangThai, search } = req.query;
      const list = await YeuCauNghiService.getDanhSachBoMon(req.user, { maHocKy, loaiYeuCau, trangThai, search });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách yêu cầu bộ môn thành công',
        metadata: list
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi lấy danh sách yêu cầu bộ môn',
        metadata: null
      });
    }
  };

  // GET /v1/api/yeucaunghi/:id/kiem-tra-xung-dot
  checkConflict = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await YeuCauNghiService.checkConflictForYeuCau(req.user, id);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Kiểm tra xung đột thành công',
        metadata: result
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi kiểm tra xung đột',
        metadata: null
      });
    }
  };

  // PUT /v1/api/yeucaunghi/:id/duyet
  duyetYeuCau = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { trangThai, lyDoTuChoi } = req.body;
      const result = await YeuCauNghiService.duyetYeuCau(req.user, id, { trangThai, lyDoTuChoi });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: trangThai === 'Approved' ? 'Duyệt yêu cầu thành công' : 'Từ chối yêu cầu thành công',
        metadata: result
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi duyệt yêu cầu',
        metadata: null
      });
    }
  };

  // POST /v1/api/yeucaunghi/phan-cong-day-thay
  phanCongDayThay = async (req, res, next) => {
    try {
      const { maBuoiHoc, maGiangVienDayThay, lyDo } = req.body;
      const result = await YeuCauNghiService.phanCongDayThay(req.user, { maBuoiHoc, maGiangVienDayThay, lyDo });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Phân công giảng viên dạy thay thành công',
        metadata: result
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi phân công dạy thay',
        metadata: null
      });
    }
  };

  // GET /v1/api/dashboard/hom-nay
  getDashboardHomNay = async (req, res, next) => {
    try {
      const result = await YeuCauNghiService.getDashboardHomNay(req.user);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy dữ liệu dashboard hôm nay thành công',
        metadata: result
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi lấy dashboard hôm nay',
        metadata: null
      });
    }
  };
}

module.exports = new YeuCauNghiController();
