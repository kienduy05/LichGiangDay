const KhoaService = require('../services/khoa.service');

class KhoaController {
  // 1. Lấy danh sách tất cả khoa (hỗ trợ tìm kiếm theo MaKhoa hoặc TenKhoa)
  getAll = async (req, res, next) => {
    try {
      const { search } = req.query;
      const list = await KhoaService.getAll(search);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách khoa thành công.',
        metadata: list
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy danh sách khoa.'
      });
    }
  };

  // 2. Lấy chi tiết 1 khoa theo MaKhoa
  getById = async (req, res, next) => {
    try {
      const { maKhoa } = req.params;
      const khoa = await KhoaService.getById(maKhoa);
      if (!khoa) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: `Không tìm thấy khoa '${maKhoa}'.`
        });
      }
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy thông tin khoa thành công.',
        metadata: khoa
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy thông tin khoa.'
      });
    }
  };

  // 3. Lấy chi tiết Khoa kèm danh sách Bộ môn trực thuộc (mục 5 - xem chi tiết)
  getChiTiet = async (req, res, next) => {
    try {
      const { maKhoa } = req.params;
      const result = await KhoaService.getBoMonByKhoa(maKhoa);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy chi tiết khoa và danh sách bộ môn thành công.',
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

  // 4. Lấy danh sách Giảng viên Active thuộc Khoa (để chọn Trưởng khoa)
  getGiangVien = async (req, res, next) => {
    try {
      const { maKhoa } = req.params;
      const list = await KhoaService.getGiangVienByKhoa(maKhoa);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách giảng viên của khoa thành công.',
        metadata: list
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

  // 5. Tạo mới khoa
  create = async (req, res, next) => {
    try {
      const { maKhoa, tenKhoa } = req.body;

      if (!maKhoa || !maKhoa.trim()) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Mã khoa không được để trống.'
        });
      }
      if (!tenKhoa || !tenKhoa.trim()) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Tên khoa không được để trống.'
        });
      }

      const result = await KhoaService.create({ maKhoa, tenKhoa });
      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Tạo khoa mới thành công.',
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

  // 6. Cập nhật TenKhoa (MaKhoa không được đổi)
  update = async (req, res, next) => {
    try {
      const { maKhoa } = req.params;
      const { tenKhoa } = req.body;

      if (!tenKhoa || !tenKhoa.trim()) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Tên khoa không được để trống.'
        });
      }

      const result = await KhoaService.update(maKhoa, { tenKhoa });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Cập nhật khoa thành công.',
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

  // 7. Gán / Bãi nhiệm Trưởng khoa
  assignTruongKhoa = async (req, res, next) => {
    try {
      const { maKhoa } = req.params;
      // maGiangVien = null nghĩa là bãi nhiệm
      const { maGiangVien } = req.body;

      const result = await KhoaService.assignTruongKhoa(maKhoa, maGiangVien || null);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: maGiangVien
          ? 'Phân công Trưởng khoa thành công.'
          : 'Bãi nhiệm Trưởng khoa thành công.',
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

  // 8. Xóa khoa
  deleteKhoa = async (req, res, next) => {
    try {
      const { maKhoa } = req.params;
      const result = await KhoaService.delete(maKhoa);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Xóa khoa thành công.',
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

module.exports = new KhoaController();
