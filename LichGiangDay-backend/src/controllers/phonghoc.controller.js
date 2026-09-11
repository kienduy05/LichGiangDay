const PhongHocService = require('../services/phonghoc.service');

class PhongHocController {
  // Lấy danh sách tất cả phòng học
  getAll = async (req, res, next) => {
    try {
      const list = await PhongHocService.getAll();
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách phòng học thành công.',
        metadata: list
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy danh sách phòng học.'
      });
    }
  };

  // Lấy chi tiết 1 phòng học
  getById = async (req, res, next) => {
    try {
      const { maPhong } = req.params;
      const room = await PhongHocService.getById(maPhong);
      if (!room) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: `Không tìm thấy phòng học '${maPhong}'.`
        });
      }
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy thông tin phòng học thành công.',
        metadata: room
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy thông tin phòng học.'
      });
    }
  };

  // Tạo mới phòng học
  create = async (req, res, next) => {
    try {
      const { maPhong, tenPhong, maToaNha, sucChua, loaiPhong, trangThai } = req.body;
      if (!maPhong || !tenPhong || !maToaNha) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Mã phòng, Tên phòng và Tòa nhà không được để trống.'
        });
      }

      const result = await PhongHocService.create({ maPhong, tenPhong, maToaNha, sucChua, loaiPhong, trangThai });
      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Tạo phòng học mới thành công.',
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

  // Cập nhật thông tin phòng học
  update = async (req, res, next) => {
    try {
      const { maPhong } = req.params;
      const { tenPhong, maToaNha, sucChua, loaiPhong, trangThai } = req.body;
      if (!tenPhong) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Tên phòng học không được để trống.'
        });
      }

      const result = await PhongHocService.update(maPhong, { tenPhong, maToaNha, sucChua, loaiPhong, trangThai });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Cập nhật thông tin phòng học thành công.',
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

  // Thay đổi nhanh trạng thái phòng học
  toggleStatus = async (req, res, next) => {
    try {
      const { maPhong } = req.params;
      const result = await PhongHocService.toggleStatus(maPhong);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Cập nhật trạng thái phòng học thành công.',
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

  // Xóa phòng học
  deletePhongHoc = async (req, res, next) => {
    try {
      const { maPhong } = req.params;
      const result = await PhongHocService.delete(maPhong);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Xóa phòng học thành công.',
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

module.exports = new PhongHocController();
