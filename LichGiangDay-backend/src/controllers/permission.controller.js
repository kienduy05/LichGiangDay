const PermissionService = require('../services/permission.service');

class PermissionController {
  getResources = async (req, res, next) => {
    try {
      const resources = await PermissionService.getResources();
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách tài nguyên hệ thống thành công',
        metadata: resources
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message
      });
    }
  };

  getPermissionsByRole = async (req, res, next) => {
    try {
      const { roleId } = req.params;
      const permissions = await PermissionService.getPermissionsByRoleId(roleId);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: `Lấy ma trận phân quyền của nhóm '${roleId}' thành công`,
        metadata: permissions
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message
      });
    }
  };

  updatePermissions = async (req, res, next) => {
    try {
      const { roleId } = req.params;
      const { permissions } = req.body;

      if (!permissions || !Array.isArray(permissions)) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Dữ liệu phân quyền gửi lên không hợp lệ'
        });
      }

      const updatedPermissions = await PermissionService.updateRolePermissions(roleId, permissions);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: `Lưu ma trận phân quyền cho nhóm '${roleId}' thành công`,
        metadata: updatedPermissions
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

module.exports = new PermissionController();
