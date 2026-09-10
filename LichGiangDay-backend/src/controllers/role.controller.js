const RoleService = require('../services/role.service');

class RoleController {
  getAll = async (req, res, next) => {
    try {
      const roles = await RoleService.getAll();
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách nhóm người dùng thành công',
        metadata: roles
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message
      });
    }
  };

  getById = async (req, res, next) => {
    try {
      const { roleId } = req.params;
      const role = await RoleService.getById(roleId);
      if (!role) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: 'Không tìm thấy nhóm người dùng'
        });
      }
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy thông tin nhóm người dùng thành công',
        metadata: role
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message
      });
    }
  };

  create = async (req, res, next) => {
    try {
      const { roleId, roleName, description } = req.body;
      if (!roleId || !roleName) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Mã nhóm và Tên nhóm người dùng không được để trống'
        });
      }

      const newRole = await RoleService.create({ roleId, roleName, description });
      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Tạo nhóm người dùng mới thành công',
        metadata: newRole
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: error.message
      });
    }
  };

  update = async (req, res, next) => {
    try {
      const { roleId } = req.params;
      const { roleName, description } = req.body;
      if (!roleName) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Tên nhóm người dùng không được để trống'
        });
      }

      const updatedRole = await RoleService.update(roleId, { roleName, description });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Cập nhật thông tin nhóm người dùng thành công',
        metadata: updatedRole
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: error.message
      });
    }
  };

  deleteRole = async (req, res, next) => {
    try {
      const { roleId } = req.params;
      const result = await RoleService.delete(roleId);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Xóa nhóm người dùng thành công',
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

module.exports = new RoleController();
