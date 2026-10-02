const GiangVienService = require('../services/giangvien.service');

class GiangVienController {

  // 1. Lấy danh sách Giảng viên (lọc: maKhoa, maBoMon, trangThai, search)
  // Nếu là role BOMON: tự động ép maBoMon theo username tài khoản đăng nhập
  getAll = async (req, res, next) => {
    try {
      let { maKhoa, maBoMon, trangThai, search } = req.query;

      if (req.user?.role === 'BOMON') {
        maBoMon = req.user.username; // Lấy động từ username tài khoản BOMON
      }

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

      // Phân quyền dữ liệu Bộ môn:
      if (req.user?.role === 'BOMON' && giangVien.MaBoMon !== req.user.username) {
        return res.status(403).json({
          status: 'error',
          code: 403,
          message: `Từ chối truy cập: Giảng viên '${maGiangVien}' không thuộc bộ môn '${req.user.username}'.`
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
      const giangVien = await GiangVienService.getById(maGiangVien);
      if (!giangVien) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: `Không tìm thấy giảng viên '${maGiangVien}'.`
        });
      }

      // Phân quyền dữ liệu Bộ môn:
      if (req.user?.role === 'BOMON' && giangVien.MaBoMon !== req.user.username) {
        return res.status(403).json({
          status: 'error',
          code: 403,
          message: `Từ chối truy cập: Giảng viên '${maGiangVien}' không thuộc bộ môn '${req.user.username}'.`
        });
      }

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
      let { maGiangVien, hoTen, email, soDienThoai, maBoMon } = req.body;

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

      // Nếu là role BOMON: ép cố định maBoMon là username của tài khoản
      if (req.user?.role === 'BOMON') {
        maBoMon = req.user.username;
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
      let { hoTen, email, soDienThoai, maBoMon } = req.body;

      if (!hoTen || !hoTen.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Họ tên giảng viên không được để trống.'
        });
      }

      // Phân quyền dữ liệu Bộ môn:
      if (req.user?.role === 'BOMON') {
        const existing = await GiangVienService.getById(maGiangVien);
        if (!existing) {
          return res.status(404).json({
            status: 'error', code: 404,
            message: `Không tìm thấy giảng viên '${maGiangVien}'.`
          });
        }
        if (existing.MaBoMon !== req.user.username) {
          return res.status(403).json({
            status: 'error', code: 403,
            message: `Từ chối truy cập: Bạn không có quyền chỉnh sửa giảng viên của bộ môn khác.`
          });
        }
        maBoMon = req.user.username; // Cố định bộ môn
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

      // Phân quyền dữ liệu Bộ môn:
      if (req.user?.role === 'BOMON') {
        const existing = await GiangVienService.getById(maGiangVien);
        if (!existing) {
          return res.status(404).json({
            status: 'error', code: 404,
            message: `Không tìm thấy giảng viên '${maGiangVien}'.`
          });
        }
        if (existing.MaBoMon !== req.user.username) {
          return res.status(403).json({
            status: 'error', code: 403,
            message: `Từ chối truy cập: Bạn không có quyền thay đổi trạng thái giảng viên của bộ môn khác.`
          });
        }
      }

      const result = await GiangVienService.toggleTrangThai(maGiangVien);

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

      // Phân quyền dữ liệu Bộ môn:
      if (req.user?.role === 'BOMON') {
        const existing = await GiangVienService.getById(maGiangVien);
        if (!existing) {
          return res.status(404).json({
            status: 'error', code: 404,
            message: `Không tìm thấy giảng viên '${maGiangVien}'.`
          });
        }
        if (existing.MaBoMon !== req.user.username) {
          return res.status(403).json({
            status: 'error', code: 403,
            message: `Từ chối truy cập: Bạn không có quyền xóa giảng viên của bộ môn khác.`
          });
        }
      }

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
