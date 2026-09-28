const KhoaSinhVienService = require('../services/khoasinhvien.service');

class KhoaSinhVienController {

  // 1. Lấy danh sách Khóa sinh viên (?search=...)
  getAll = async (req, res, next) => {
    try {
      const { search } = req.query;
      const list = await KhoaSinhVienService.getAll({ search });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách khóa sinh viên thành công.',
        metadata: list
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy danh sách khóa sinh viên.'
      });
    }
  };

  // 2. Lấy thông tin 1 Khóa sinh viên theo MaKhoaSinhVien
  getById = async (req, res, next) => {
    try {
      const { maKhoaSinhVien } = req.params;
      const item = await KhoaSinhVienService.getById(maKhoaSinhVien);
      if (!item) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: `Không tìm thấy khóa sinh viên '${maKhoaSinhVien}'.`
        });
      }
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy thông tin khóa sinh viên thành công.',
        metadata: item
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server.'
      });
    }
  };

  // 3. Tạo mới Khóa sinh viên
  create = async (req, res, next) => {
    try {
      const { maKhoaSinhVien, tenKhoaSinhVien } = req.body;

      if (!maKhoaSinhVien || !maKhoaSinhVien.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Mã khóa sinh viên không được để trống.'
        });
      }
      if (!tenKhoaSinhVien || !tenKhoaSinhVien.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Tên khóa sinh viên không được để trống.'
        });
      }

      const result = await KhoaSinhVienService.create({ maKhoaSinhVien, tenKhoaSinhVien });
      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Tạo khóa sinh viên mới thành công.',
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

  // 4. Cập nhật TenKhoaSinhVien
  update = async (req, res, next) => {
    try {
      const { maKhoaSinhVien } = req.params;
      const { tenKhoaSinhVien } = req.body;

      if (!tenKhoaSinhVien || !tenKhoaSinhVien.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Tên khóa sinh viên không được để trống.'
        });
      }

      const result = await KhoaSinhVienService.update(maKhoaSinhVien, { tenKhoaSinhVien });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Cập nhật khóa sinh viên thành công.',
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

  // 5. Xóa Khóa sinh viên (kiểm tra LopHocPhan.KhoaHoc)
  deleteKhoaSinhVien = async (req, res, next) => {
    try {
      const { maKhoaSinhVien } = req.params;
      const result = await KhoaSinhVienService.delete(maKhoaSinhVien);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Xóa khóa sinh viên thành công.',
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

module.exports = new KhoaSinhVienController();
