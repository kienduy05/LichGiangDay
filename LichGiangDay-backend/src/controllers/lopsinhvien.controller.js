const LopSinhVienService = require('../services/lopsinhvien.service');

class LopSinhVienController {

  // 1. Lấy danh sách Lớp sinh viên (?maKhoa=...&search=...)
  getAll = async (req, res, next) => {
    try {
      const { maKhoa, search } = req.query;
      const list = await LopSinhVienService.getAll({ maKhoa, search });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách lớp sinh viên thành công.',
        metadata: list
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy danh sách lớp sinh viên.'
      });
    }
  };

  // 2. Lấy thông tin 1 Lớp sinh viên theo MaLopSinhVien
  getById = async (req, res, next) => {
    try {
      const { maLopSinhVien } = req.params;
      const lsv = await LopSinhVienService.getById(maLopSinhVien);
      if (!lsv) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: `Không tìm thấy lớp sinh viên '${maLopSinhVien}'.`
        });
      }
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy thông tin lớp sinh viên thành công.',
        metadata: lsv
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy thông tin lớp sinh viên.'
      });
    }
  };

  // 3. Tạo mới Lớp sinh viên
  create = async (req, res, next) => {
    try {
      const { maLopSinhVien, tenLopSinhVien, maKhoa } = req.body;

      if (!maLopSinhVien || !maLopSinhVien.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Mã lớp sinh viên không được để trống.'
        });
      }
      if (!tenLopSinhVien || !tenLopSinhVien.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Tên lớp sinh viên không được để trống.'
        });
      }
      if (!maKhoa || !maKhoa.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Khoa quản lý không được để trống.'
        });
      }

      const result = await LopSinhVienService.create({ maLopSinhVien, tenLopSinhVien, maKhoa });
      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Tạo lớp sinh viên mới thành công.',
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

  // 4. Cập nhật TenLopSinhVien và/hoặc MaKhoa
  update = async (req, res, next) => {
    try {
      const { maLopSinhVien } = req.params;
      const { tenLopSinhVien, maKhoa } = req.body;

      if (!tenLopSinhVien || !tenLopSinhVien.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Tên lớp sinh viên không được để trống.'
        });
      }
      if (!maKhoa || !maKhoa.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Khoa quản lý không được để trống.'
        });
      }

      const result = await LopSinhVienService.update(maLopSinhVien, { tenLopSinhVien, maKhoa });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Cập nhật lớp sinh viên thành công.',
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

  // 5. Xóa Lớp sinh viên (kiểm tra LopHocPhan_LopSinhVien)
  deleteLopSinhVien = async (req, res, next) => {
    try {
      const { maLopSinhVien } = req.params;
      const result = await LopSinhVienService.delete(maLopSinhVien);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Xóa lớp sinh viên thành công.',
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

module.exports = new LopSinhVienController();
