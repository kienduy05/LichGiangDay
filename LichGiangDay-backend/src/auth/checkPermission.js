const db = require('../../config/db');

/**
 * Middleware kiểm tra quyền thao tác (RBAC Authorization)
 * @param {string} resourceId - Mã tài nguyên (VD: 'Roles', 'Users', 'RolePermissions', 'ToaNha', 'BoMon'...)
 * @param {string} action - Hành động kiểm tra: 'CanRead' | 'CanCreate' | 'CanUpdate' | 'CanDelete'
 */
const checkPermission = (resourceId, action) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role;
      if (!userRole) {
        return res.status(403).json({
          status: 'error',
          code: 403,
          message: 'Không tìm thấy thông tin nhóm quyền của người dùng.'
        });
      }

      // Nhóm ADMIN có toàn quyền không cần kiểm tra
      if (userRole === 'ADMIN') {
        return next();
      }

      // Nếu người dùng chỉ đang lấy ma trận phân quyền của CHÍNH NHÓM MÌNH để hiển thị giao diện
      if (resourceId === 'RolePermissions' && action === 'CanRead' && req.params?.roleId === userRole) {
        return next();
      }

      // Truy vấn kiểm tra quyền trong CSDL
      const [rows] = await db.query(`
        SELECT CanRead, CanCreate, CanUpdate, CanDelete 
        FROM RolePermissions 
        WHERE RoleId = ? AND ResourceId = ? 
        LIMIT 1
      `, [userRole, resourceId]);

      if (rows.length === 0) {
        return res.status(403).json({
          status: 'error',
          code: 403,
          message: `Từ chối truy cập: Nhóm quyền '${userRole}' chưa được phân quyền cho tài nguyên '${resourceId}'.`
        });
      }

      const permissionRow = rows[0];
      const hasAccess = permissionRow[action] === 1;

      if (!hasAccess) {
        return res.status(403).json({
          status: 'error',
          code: 403,
          message: `Từ chối truy cập: Nhóm quyền '${userRole}' không có quyền '${action}' trên tài nguyên '${resourceId}'.`
        });
      }

      return next();
    } catch (error) {
      console.error('CheckPermission Error:', error);
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: 'Lỗi kiểm tra quyền truy cập hệ thống.'
      });
    }
  };
};

module.exports = {
  checkPermission
};
