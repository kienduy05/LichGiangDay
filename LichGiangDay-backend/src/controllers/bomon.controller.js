const BoMonService = require('../services/bomon.service');

class BoMonController {
  // 1. Lấy danh sách Bộ môn (hỗ trợ lọc theo ?maKhoa=...)
  getAll = async (req, res, next) => {
    try {
      const { maKhoa } = req.query;
      const list = await BoMonService.getAll(maKhoa);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách bộ môn thành công.',
        metadata: list
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy danh sách bộ môn.'
      });
    }
  };

  // 2. Lấy thông tin cơ bản 1 Bộ môn theo MaBoMon
  getById = async (req, res, next) => {
    try {
      const { maBoMon } = req.params;
      const boMon = await BoMonService.getById(maBoMon);
      if (!boMon) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: `Không tìm thấy bộ môn '${maBoMon}'.`
        });
      }
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy thông tin bộ môn thành công.',
        metadata: boMon
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy thông tin bộ môn.'
      });
    }
  };

  // 3. Xem chi tiết Bộ môn kèm danh sách GiangVien và MonHoc trực thuộc
  getChiTiet = async (req, res, next) => {
    try {
      const { maBoMon } = req.params;
      const result = await BoMonService.getChiTiet(maBoMon);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy chi tiết bộ môn thành công.',
        metadata: result
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
      return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        message: error.message
      });
    }
  };

  // 4. Tạo mới Bộ môn
  create = async (req, res, next) => {
    try {
      const { maBoMon, tenBoMon, maKhoa } = req.body;

      if (!maBoMon || !maBoMon.trim()) {
        return res.status(400).json({
          status: 'error', code: 400, message: 'Mã bộ môn không được để trống.'
        });
      }
      if (!tenBoMon || !tenBoMon.trim()) {
        return res.status(400).json({
          status: 'error', code: 400, message: 'Tên bộ môn không được để trống.'
        });
      }
      if (!maKhoa || !maKhoa.trim()) {
        return res.status(400).json({
          status: 'error', code: 400, message: 'Khoa trực thuộc không được để trống.'
        });
      }

      const result = await BoMonService.create({ maBoMon, tenBoMon, maKhoa });
      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Tạo bộ môn mới thành công.',
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

  // 5. Cập nhật TenBoMon và/hoặc MaKhoa
  update = async (req, res, next) => {
    try {
      const { maBoMon } = req.params;
      const { tenBoMon, maKhoa } = req.body;

      if (!tenBoMon || !tenBoMon.trim()) {
        return res.status(400).json({
          status: 'error', code: 400, message: 'Tên bộ môn không được để trống.'
        });
      }

      const result = await BoMonService.update(maBoMon, { tenBoMon, maKhoa });

      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Cập nhật bộ môn thành công.',
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

  // 6. Xóa Bộ môn (kiểm tra ràng buộc 3 bảng con)
  deleteBoMon = async (req, res, next) => {
    try {
      const { maBoMon } = req.params;
      const result = await BoMonService.delete(maBoMon);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Xóa bộ môn thành công.',
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

module.exports = new BoMonController();
