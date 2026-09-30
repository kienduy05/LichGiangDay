const TietHocService = require('../services/tiethoc.service');

class TietHocController {
  // Lấy danh sách tất cả tiết học
  getAll = async (req, res, next) => {
    try {
      const list = await TietHocService.getAll();
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách tiết học thành công.',
        metadata: list
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy danh sách tiết học.'
      });
    }
  };

  // Lấy chi tiết 1 tiết học
  getById = async (req, res, next) => {
    try {
      const { maTiet } = req.params;
      const item = await TietHocService.getById(Number(maTiet));
      if (!item) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: `Không tìm thấy tiết học có mã '${maTiet}'.`
        });
      }
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy thông tin tiết học thành công.',
        metadata: item
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy thông tin tiết học.'
      });
    }
  };

  // Tạo mới tiết học
  create = async (req, res, next) => {
    try {
      const { maTiet, tenTiet, gioBatDau, gioKetThuc } = req.body;

      // Validation cơ bản tại controller (không trống)
      if (!maTiet && maTiet !== 0) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Mã tiết không được để trống.' });
      }
      if (!tenTiet || !tenTiet.trim()) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Tên tiết không được để trống.' });
      }
      if (!gioBatDau) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Giờ bắt đầu không được để trống.' });
      }
      if (!gioKetThuc) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Giờ kết thúc không được để trống.' });
      }

      const result = await TietHocService.create({
        maTiet: Number(maTiet),
        tenTiet,
        gioBatDau,
        gioKetThuc
      });

      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Tạo tiết học mới thành công.',
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

  // Cập nhật tiết học (chỉ TenTiet, GioBatDau, GioKetThuc — MaTiet khóa cứng)
  update = async (req, res, next) => {
    try {
      const { maTiet } = req.params;
      const { tenTiet, gioBatDau, gioKetThuc } = req.body;

      if (!tenTiet || !tenTiet.trim()) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Tên tiết không được để trống.' });
      }
      if (!gioBatDau) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Giờ bắt đầu không được để trống.' });
      }
      if (!gioKetThuc) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Giờ kết thúc không được để trống.' });
      }

      const result = await TietHocService.update(Number(maTiet), { tenTiet, gioBatDau, gioKetThuc });

      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Cập nhật tiết học thành công.',
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

  // Xóa tiết học
  deleteTietHoc = async (req, res, next) => {
    try {
      const { maTiet } = req.params;
      const result = await TietHocService.delete(Number(maTiet));
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Xóa tiết học thành công.',
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
}

module.exports = new TietHocController();
