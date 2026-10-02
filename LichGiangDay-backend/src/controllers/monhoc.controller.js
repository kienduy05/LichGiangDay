const MonHocService = require('../services/monhoc.service');

class MonHocController {

  // 1. Lấy danh sách Môn học (lọc: ?maKhoa=...&maBoMon=...&search=...)
  getAll = async (req, res, next) => {
    try {
      const { maKhoa, maBoMon, search } = req.query;
      const list = await MonHocService.getAll({ maKhoa, maBoMon, search });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách môn học thành công.',
        metadata: list
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy danh sách môn học.'
      });
    }
  };

  // 2. Lấy thông tin cơ bản 1 Môn học theo MaMonHoc
  getById = async (req, res, next) => {
    try {
      const { maMonHoc } = req.params;
      const monHoc = await MonHocService.getById(maMonHoc);
      if (!monHoc) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: `Không tìm thấy môn học '${maMonHoc}'.`
        });
      }
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy thông tin môn học thành công.',
        metadata: monHoc
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy thông tin môn học.'
      });
    }
  };

  // 3. Xem chi tiết Môn học kèm danh sách LopHocPhan
  getChiTiet = async (req, res, next) => {
    try {
      const { maMonHoc } = req.params;
      const result = await MonHocService.getChiTiet(maMonHoc);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy chi tiết môn học thành công.',
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

  // 4. Tạo mới Môn học
  create = async (req, res, next) => {
    try {
      const { maMonHoc, tenMonHoc, soTinChi, maBoMon, loaiMonHoc } = req.body;

      if (!maMonHoc || !maMonHoc.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Mã môn học không được để trống.'
        });
      }
      if (!tenMonHoc || !tenMonHoc.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Tên môn học không được để trống.'
        });
      }
      if (!maBoMon || !maBoMon.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Vui lòng chọn Bộ môn quản lý cho môn học này.'
        });
      }

      const result = await MonHocService.create({ maMonHoc, tenMonHoc, soTinChi, maBoMon, loaiMonHoc });
      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Tạo môn học mới thành công.',
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

  // 5. Cập nhật thông tin Môn học
  update = async (req, res, next) => {
    try {
      const { maMonHoc } = req.params;
      const { tenMonHoc, soTinChi, maBoMon, loaiMonHoc } = req.body;

      if (!tenMonHoc || !tenMonHoc.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Tên môn học không được để trống.'
        });
      }
      if (!maBoMon || !maBoMon.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Bộ môn quản lý không được để trống khi cập nhật.'
        });
      }

      const result = await MonHocService.update(maMonHoc, { tenMonHoc, soTinChi, maBoMon, loaiMonHoc });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Cập nhật môn học thành công.',
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

  // 6. Xóa Môn học (kiểm tra LopHocPhan)
  deleteMonHoc = async (req, res, next) => {
    try {
      const { maMonHoc } = req.params;
      const result = await MonHocService.delete(maMonHoc);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Xóa môn học thành công.',
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

module.exports = new MonHocController();
