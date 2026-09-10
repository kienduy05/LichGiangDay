const db = require('../../config/db');

class RoleService {
  /**
   * Lấy danh sách tất cả các Nhóm người dùng (Roles) kèm số lượng tài khoản thuộc nhóm
   */
  static getAll = async () => {
    const [rows] = await db.query(`
      SELECT 
        r.RoleId,
        r.RoleName,
        r.Description,
        r.IsSystem,
        r.CreatedAt,
        r.UpdatedAt,
        COUNT(u.UserId) AS UserCount
      FROM Roles r
      LEFT JOIN Users u ON r.RoleId = u.Role
      GROUP BY r.RoleId, r.RoleName, r.Description, r.IsSystem, r.CreatedAt, r.UpdatedAt
      ORDER BY r.CreatedAt ASC
    `);
    return rows;
  };

  /**
   * Lấy thông tin chi tiết một Nhóm người dùng theo RoleId
   */
  static getById = async (roleId) => {
    const [rows] = await db.query(`
      SELECT 
        r.RoleId,
        r.RoleName,
        r.Description,
        r.IsSystem,
        r.CreatedAt,
        r.UpdatedAt,
        COUNT(u.UserId) AS UserCount
      FROM Roles r
      LEFT JOIN Users u ON r.RoleId = u.Role
      WHERE r.RoleId = ?
      GROUP BY r.RoleId, r.RoleName, r.Description, r.IsSystem, r.CreatedAt, r.UpdatedAt
    `, [roleId]);
    
    if (rows.length === 0) return null;
    return rows[0];
  };

  /**
   * Tạo Nhóm người dùng mới
   */
  static create = async ({ roleId, roleName, description }) => {
    const normalizedRoleId = roleId.trim().toUpperCase();

    // Kiểm tra trùng mã nhóm
    const [existing] = await db.query('SELECT RoleId FROM Roles WHERE RoleId = ?', [normalizedRoleId]);
    if (existing.length > 0) {
      throw new Error(`Mã nhóm '${normalizedRoleId}' đã tồn tại trong hệ thống.`);
    }

    await db.query(`
      INSERT INTO Roles (RoleId, RoleName, Description, IsSystem)
      VALUES (?, ?, ?, 0)
    `, [normalizedRoleId, roleName.trim(), description ? description.trim() : null]);

    return await this.getById(normalizedRoleId);
  };

  /**
   * Cập nhật thông tin Nhóm người dùng
   */
  static update = async (roleId, { roleName, description }) => {
    const [existing] = await db.query('SELECT * FROM Roles WHERE RoleId = ?', [roleId]);
    if (existing.length === 0) {
      throw new Error('Nhóm người dùng không tồn tại.');
    }

    await db.query(`
      UPDATE Roles 
      SET RoleName = ?, Description = ?, UpdatedAt = CURRENT_TIMESTAMP
      WHERE RoleId = ?
    `, [roleName.trim(), description ? description.trim() : null, roleId]);

    return await this.getById(roleId);
  };

  /**
   * Xóa Nhóm người dùng
   */
  static delete = async (roleId) => {
    const [existing] = await db.query('SELECT * FROM Roles WHERE RoleId = ?', [roleId]);
    if (existing.length === 0) {
      throw new Error('Nhóm người dùng không tồn tại.');
    }

    const role = existing[0];
    if (role.IsSystem === 1) {
      throw new Error('Không thể xóa nhóm người dùng mặc định của hệ thống.');
    }

    // Kiểm tra xem nhóm có đang gắn với tài khoản người dùng nào không
    const [users] = await db.query('SELECT COUNT(*) AS count FROM Users WHERE Role = ?', [roleId]);
    if (users[0].count > 0) {
      throw new Error(`Không thể xóa vì đang có ${users[0].count} tài khoản người dùng gắn với nhóm này.`);
    }

    await db.query('DELETE FROM Roles WHERE RoleId = ?', [roleId]);
    return { success: true, roleId };
  };
}

module.exports = RoleService;
