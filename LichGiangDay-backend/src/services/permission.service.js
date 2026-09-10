const db = require('../../config/db');

class PermissionService {
  /**
   * Lấy danh sách tất cả các tài nguyên trong hệ thống
   */
  static getResources = async () => {
    const [rows] = await db.query('SELECT * FROM Resources ORDER BY ResourceId ASC');
    return rows;
  };

  /**
   * Lấy ma trận phân quyền của một Nhóm quyền (RoleId)
   * Sử dụng LEFT JOIN + COALESCE để luôn trả về đủ 26 tài nguyên với giá trị mặc định là 0 nếu chưa phân quyền
   */
  static getPermissionsByRoleId = async (roleId) => {
    const [rows] = await db.query(`
      SELECT 
        r.ResourceId,
        r.ResourceName,
        r.Description,
        COALESCE(p.CanCreate, 0) AS CanCreate,
        COALESCE(p.CanRead, 0) AS CanRead,
        COALESCE(p.CanUpdate, 0) AS CanUpdate,
        COALESCE(p.CanDelete, 0) AS CanDelete
      FROM Resources r
      LEFT JOIN RolePermissions p 
        ON r.ResourceId = p.ResourceId AND p.RoleId = ?
      ORDER BY r.ResourceId ASC
    `, [roleId]);
    
    return rows;
  };

  /**
   * Lưu hàng loạt ma trận phân quyền cho một Nhóm quyền (RoleId)
   */
  static updateRolePermissions = async (roleId, permissions) => {
    // Kiểm tra Nhóm quyền có tồn tại không
    const [roleExists] = await db.query('SELECT RoleId FROM Roles WHERE RoleId = ?', [roleId]);
    if (roleExists.length === 0) {
      throw new Error('Nhóm người dùng không tồn tại.');
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      throw new Error('Dữ liệu phân quyền không được để trống.');
    }

    // Upsert từng dòng tài nguyên vào bảng RolePermissions
    for (const item of permissions) {
      const { resourceId, canCreate, canRead, canUpdate, canDelete } = item;
      await db.query(`
        INSERT INTO RolePermissions (RoleId, ResourceId, CanCreate, CanRead, CanUpdate, CanDelete)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          CanCreate = VALUES(CanCreate),
          CanRead = VALUES(CanRead),
          CanUpdate = VALUES(CanUpdate),
          CanDelete = VALUES(CanDelete),
          UpdatedAt = CURRENT_TIMESTAMP
      `, [
        roleId,
        resourceId,
        canCreate ? 1 : 0,
        canRead ? 1 : 0,
        canUpdate ? 1 : 0,
        canDelete ? 1 : 0
      ]);
    }

    return await this.getPermissionsByRoleId(roleId);
  };
}

module.exports = PermissionService;
