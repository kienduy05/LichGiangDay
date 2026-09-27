const HocKyService = require('../services/hocky.service');

class HocKyController {

  // 1. Lấy danh sách Học kỳ (?search=...)
  getAll = async (req, res, next) => {
    try {
      const { search } = req.query;
      const list = await HocKyService.getAll({ search });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách học kỳ thành công.',
        metadata: list
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy danh sách học kỳ.'
      });
    }
  };

  // 2. Lấy thông tin 1 Học kỳ theo MaHocKy
  getById = async (req, res, next) => {
    try {
      const { maHocKy } = req.params;
      const hocKy = await HocKyService.getById(maHocKy);
      if (!hocKy) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: `Không tìm thấy học kỳ '${maHocKy}'.`
        });
      }
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy thông tin học kỳ thành công.',
        metadata: hocKy
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server.'
      });
    }
  };

  // 3. Tạo mới Học kỳ
  create = async (req, res, next) => {
    try {
      const { maHocKy, tenHocKy, dot, namHoc, ngayBatDau, ngayKetThuc } = req.body;

      if (!maHocKy || !maHocKy.trim()) {
        return res.status(400).json({
          status: 'error', code: 400, message: 'Mã học kỳ không được để trống.'
        });
      }
      if (!tenHocKy || !tenHocKy.trim()) {
        return res.status(400).json({
          status: 'error', code: 400, message: 'Tên học kỳ không được để trống.'
        });
      }
      if (!ngayBatDau) {
        return res.status(400).json({
          status: 'error', code: 400, message: 'Ngày bắt đầu không được để trống.'
        });
      }
      if (!ngayKetThuc) {
        return res.status(400).json({
          status: 'error', code: 400, message: 'Ngày kết thúc không được để trống.'
        });
      }

      const result = await HocKyService.create({ maHocKy, tenHocKy, dot, namHoc, ngayBatDau, ngayKetThuc });

      // Trả 201 nhưng kèm overlapWarning nếu có
      return res.status(201).json({
        status: 'success',
        code: 201,
        message: result.overlapWarning
          ? 'Tạo học kỳ thành công. Lưu ý: học kỳ này có khoảng thời gian chồng lấn với một số học kỳ khác.'
          : 'Tạo học kỳ mới thành công.',
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

  // 4. Cập nhật Học kỳ
  update = async (req, res, next) => {
    try {
      const { maHocKy } = req.params;
      const { tenHocKy, dot, namHoc, ngayBatDau, ngayKetThuc } = req.body;

      if (!tenHocKy || !tenHocKy.trim()) {
        return res.status(400).json({
          status: 'error', code: 400, message: 'Tên học kỳ không được để trống.'
        });
      }
      if (!ngayBatDau || !ngayKetThuc) {
        return res.status(400).json({
          status: 'error', code: 400, message: 'Ngày bắt đầu và ngày kết thúc không được để trống.'
        });
      }

      const result = await HocKyService.update(maHocKy, { tenHocKy, dot, namHoc, ngayBatDau, ngayKetThuc });

      let message = 'Cập nhật học kỳ thành công.';
      if (result.dateNarrowWarning) {
        message += ' Cảnh báo: Bạn đã thu hẹp khoảng thời gian học kỳ — cần kiểm tra lại lịch dạy các lớp học phần trong học kỳ này.';
      }
      if (result.overlapWarning) {
        message += ' Lưu ý: Khoảng thời gian mới chồng lấn với một số học kỳ khác.';
      }

      return res.status(200).json({
        status: 'success',
        code: 200,
        message,
        metadata: result
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
      return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        message: error.message
      });
    }
  };

  // 5. Xóa Học kỳ (kiểm tra LopHocPhan)
  deleteHocKy = async (req, res, next) => {
    try {
      const { maHocKy } = req.params;
      const result = await HocKyService.delete(maHocKy);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Xóa học kỳ thành công.',
        metadata: result
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
      return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        message: error.message
      });
    }
  };
}

module.exports = new HocKyController();
