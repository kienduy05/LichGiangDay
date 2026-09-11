const ToaNhaService = require('../services/toanha.service');

class ToaNhaController {
  // Lấy tất cả tòa nhà
  getAll = async (req, res, next) => {
    try {
      const list = await ToaNhaService.getAll();
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách tòa nhà thành công.',
        metadata: list
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy danh sách tòa nhà.'
      });
    }
  };

  // Lấy chi tiết 1 tòa nhà
  getById = async (req, res, next) => {
    try {
      const { maToaNha } = req.params;
      const building = await ToaNhaService.getById(maToaNha);
      if (!building) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: `Không tìm thấy tòa nhà '${maToaNha}'.`
        });
      }
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy thông tin tòa nhà thành công.',
        metadata: building
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy thông tin tòa nhà.'
      });
    }
  };

  // Tạo mới tòa nhà
  create = async (req, res, next) => {
    try {
      const { maToaNha, tenToaNha, coSo, diaChi } = req.body;
      if (!maToaNha || !tenToaNha) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Mã tòa nhà và Tên tòa nhà không được để trống.'
        });
      }

      const result = await ToaNhaService.create({ maToaNha, tenToaNha, coSo, diaChi });
      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Tạo tòa nhà mới thành công.',
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

  // Cập nhật thông tin tòa nhà
  update = async (req, res, next) => {
    try {
      const { maToaNha } = req.params;
      const { tenToaNha, coSo, diaChi } = req.body;
      if (!tenToaNha) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Tên tòa nhà không được để trống.'
        });
      }

      const result = await ToaNhaService.update(maToaNha, { tenToaNha, coSo, diaChi });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Cập nhật thông tin tòa nhà thành công.',
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

  // Xóa tòa nhà
  deleteToaNha = async (req, res, next) => {
    try {
      const { maToaNha } = req.params;
      const result = await ToaNhaService.delete(maToaNha);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Xóa tòa nhà thành công.',
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

module.exports = new ToaNhaController();
