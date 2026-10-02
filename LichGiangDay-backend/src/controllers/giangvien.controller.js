const GiangVienService = require('../services/giangvien.service');

class GiangVienController {

  // 1. Lấy danh sách Giảng viên (lọc: maKhoa, maBoMon, trangThai, search)
  getAll = async (req, res, next) => {
    try {
      const { maKhoa, maBoMon, trangThai, search } = req.query;
      const list = await GiangVienService.getAll({ maKhoa, maBoMon, trangThai, search });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách giảng viên thành công.',
        metadata: list
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy danh sách giảng viên.'
      });
    }
  };

  // 2. Lấy thông tin cơ bản 1 Giảng viên
  getById = async (req, res, next) => {
    try {
      const { maGiangVien } = req.params;
      const giangVien = await GiangVienService.getById(maGiangVien);
      if (!giangVien) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: `Không tìm thấy giảng viên '${maGiangVien}'.`
        });
      }
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy thông tin giảng viên thành công.',
        metadata: giangVien
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy thông tin giảng viên.'
      });
    }
  };

  // 3. Xem chi tiết Giảng viên (kèm lịch sử hoạt động)
  getChiTiet = async (req, res, next) => {
    try {
      const { maGiangVien } = req.params;
      const result = await GiangVienService.getChiTiet(maGiangVien);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy chi tiết giảng viên thành công.',
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

  // 4. Tạo mới Giảng viên
  create = async (req, res, next) => {
    try {
      const { maGiangVien, hoTen, email, soDienThoai, maBoMon } = req.body;

      if (!maGiangVien || !maGiangVien.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Mã giảng viên không được để trống.'
        });
      }
      if (!hoTen || !hoTen.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Họ tên giảng viên không được để trống.'
        });
      }

      const result = await GiangVienService.create({ maGiangVien, hoTen, email, soDienThoai, maBoMon });
      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Tạo giảng viên mới thành công.',
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

  // 5. Cập nhật thông tin Giảng viên
  update = async (req, res, next) => {
    try {
      const { maGiangVien } = req.params;
      const { hoTen, email, soDienThoai, maBoMon } = req.body;

      if (!hoTen || !hoTen.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Họ tên giảng viên không được để trống.'
        });
      }

      const result = await GiangVienService.update(maGiangVien, { hoTen, email, soDienThoai, maBoMon });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Cập nhật giảng viên thành công.',
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

  // 6. Toggle TrangThai: Active ↔ Inactive
  toggleTrangThai = async (req, res, next) => {
    try {
      const { maGiangVien } = req.params;
      const result = await GiangVienService.toggleTrangThai(maGiangVien);

      // Nếu có cảnh báo (chuyển Inactive khi còn lớp/buổi học), vẫn trả 200
      // nhưng kèm warnHoatDong để frontend hiện confirm
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: `Đã chuyển trạng thái sang ${result.TrangThai}.`,
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

  // 7. Xóa Giảng viên (kiểm tra 7 ràng buộc)
  deleteGiangVien = async (req, res, next) => {
    try {
      const { maGiangVien } = req.params;
      const result = await GiangVienService.delete(maGiangVien);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Xóa giảng viên thành công.',
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

module.exports = new GiangVienController();
