const db = require('../../config/db');
const bcrypt = require('bcryptjs');

class UserService {
  static findByUsername = async ({ username }) => {
    try {
      const [rows] = await db.query(
        'SELECT * FROM Users WHERE Username = ? AND IsActive = 1 LIMIT 1',
        [username]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('UserService findByUsername Error:', error);
      throw error;
    }
  };

  static findById = async (userId) => {
    try {
      const [rows] = await db.query(
        `SELECT u.UserId, u.Username, u.FullName, u.Email, u.Role, r.RoleName, u.IsActive, u.CreatedAt, u.UpdatedAt 
         FROM Users u 
         LEFT JOIN Roles r ON u.Role = r.RoleId 
         WHERE u.UserId = ? LIMIT 1`,
        [userId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('UserService findById Error:', error);
      throw error;
    }
  };

  static updateUser = async ({ userId, fullName, email }) => {
    try {
      await db.query(
        'UPDATE Users SET FullName = ?, Email = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE UserId = ?',
        [fullName, email, userId]
      );
      return await UserService.findById(userId);
    } catch (error) {
      console.error('UserService updateUser Error:', error);
      throw error;
    }
  };

  static updatePassword = async ({ userId, oldPassword, newPassword }) => {
    try {
      const [rows] = await db.query(
        'SELECT * FROM Users WHERE UserId = ? LIMIT 1',
        [userId]
      );
      const user = rows[0];
      if (!user) {
        const error = new Error('Tài khoản không tồn tại.');
        error.status = 404;
        throw error;
      }

      const match = bcrypt.compareSync(oldPassword, user.PasswordHash);
      if (!match) {
        const error = new Error('Mật khẩu hiện tại không chính xác.');
        error.status = 400;
        throw error;
      }

      const newHash = bcrypt.hashSync(newPassword, 10);
      await db.query(
        'UPDATE Users SET PasswordHash = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE UserId = ?',
        [newHash, userId]
      );
      return true;
    } catch (error) {
      console.error('UserService updatePassword Error:', error);
      throw error;
    }
  };

  // ==========================================
  // ADMIN USER MANAGEMENT METHODS
  // ==========================================

  /**
   * Lấy danh sách tất cả tài khoản người dùng kèm tên Nhóm quyền
   */
  static getAllUsers = async () => {
    const [rows] = await db.query(`
      SELECT 
        u.UserId,
        u.Username,
        u.FullName,
        u.Email,
        u.Role,
        r.RoleName,
        u.IsActive,
        u.CreatedAt,
        u.UpdatedAt
      FROM Users u
      LEFT JOIN Roles r ON u.Role = r.RoleId
      ORDER BY u.CreatedAt DESC
    `);
    return rows;
  };

  /**
   * Tạo tài khoản người dùng mới
   */
  static createUser = async ({ username, password, fullName, email, role }) => {
    const normalizedUsername = username.trim();

    // Kiểm tra trùng username
    const [existing] = await db.query('SELECT UserId FROM Users WHERE Username = ?', [normalizedUsername]);
    if (existing.length > 0) {
      throw new Error(`Tên tài khoản '${normalizedUsername}' đã tồn tại.`);
    }

    // Kiểm tra role tồn tại
    const [roleExists] = await db.query('SELECT RoleId FROM Roles WHERE RoleId = ?', [role]);
    if (roleExists.length === 0) {
      throw new Error('Nhóm quyền được chọn không hợp lệ.');
    }

    // Sinh mã UserId định dạng tự động tăng tịnh tiến (VD: USR000000000001, USR000000000002...)
    const [maxResult] = await db.query(`
      SELECT UserId FROM Users 
      WHERE UserId LIKE 'USR%' 
      ORDER BY UserId DESC 
      LIMIT 1
    `);

    let nextNumber = 1;
    if (maxResult.length > 0) {
      const currentMaxId = maxResult[0].UserId;
      const numericPart = currentMaxId.replace('USR', '');
      if (!isNaN(numericPart)) {
        nextNumber = parseInt(numericPart, 10) + 1;
      }
    }

    const userId = `USR${nextNumber.toString().padStart(12, '0')}`;

    const passwordHash = bcrypt.hashSync(password, 10);

    await db.query(`
      INSERT INTO Users (UserId, Username, PasswordHash, FullName, Email, Role, IsActive)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [userId, normalizedUsername, passwordHash, fullName ? fullName.trim() : null, email ? email.trim() : null, role]);

    return await this.findById(userId);
  };

  /**
   * Cập nhật thông tin tài khoản người dùng bởi Admin
   */
  static updateAdminUser = async (userId, { fullName, email, role, isActive }) => {
    const [existing] = await db.query('SELECT * FROM Users WHERE UserId = ?', [userId]);
    if (existing.length === 0) {
      throw new Error('Tài khoản người dùng không tồn tại.');
    }

    const user = existing[0];

    // Bảo vệ tài khoản ADMIN.0001
    let finalRole = role;
    let finalIsActive = isActive !== undefined ? (isActive ? 1 : 0) : user.IsActive;

    if (user.Username === 'ADMIN.0001' || user.UserId === 'USR000000000001') {
      finalRole = 'ADMIN';
      finalIsActive = 1; // Luôn luôn kích hoạt cho Admin tối cao
    }

    await db.query(`
      UPDATE Users 
      SET FullName = ?, Email = ?, Role = ?, IsActive = ?, UpdatedAt = CURRENT_TIMESTAMP
      WHERE UserId = ?
    `, [fullName ? fullName.trim() : null, email ? email.trim() : null, finalRole, finalIsActive, userId]);

    return await this.findById(userId);
  };

  /**
   * Đặt lại mật khẩu bởi Admin
   */
  static adminResetPassword = async (userId, { newPassword }) => {
    const [existing] = await db.query('SELECT UserId FROM Users WHERE UserId = ?', [userId]);
    if (existing.length === 0) {
      throw new Error('Tài khoản người dùng không tồn tại.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải từ 6 ký tự trở lên.');
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);

    await db.query(`
      UPDATE Users 
      SET PasswordHash = ?, UpdatedAt = CURRENT_TIMESTAMP
      WHERE UserId = ?
    `, [passwordHash, userId]);

    return { success: true, userId };
  };

  /**
   * Bật / Tắt trạng thái khóa tài khoản người dùng
   */
  static toggleStatus = async (userId, currentAdminUserId) => {
    const [existing] = await db.query('SELECT * FROM Users WHERE UserId = ?', [userId]);
    if (existing.length === 0) {
      throw new Error('Tài khoản người dùng không tồn tại.');
    }

    const user = existing[0];

    if (user.UserId === currentAdminUserId) {
      throw new Error('Bạn không thể khóa tài khoản của chính mình.');
    }

    if (user.Username === 'ADMIN.0001' || user.UserId === 'USR000000000001') {
      throw new Error('Không thể khóa tài khoản Quản trị viên tối cao của hệ thống.');
    }

    const newStatus = user.IsActive === 1 ? 0 : 1;

    await db.query(`
      UPDATE Users 
      SET IsActive = ?, UpdatedAt = CURRENT_TIMESTAMP
      WHERE UserId = ?
    `, [newStatus, userId]);

    return await this.findById(userId);
  };

  /**
   * Xóa tài khoản người dùng
   */
  static deleteUser = async (userId, currentAdminUserId) => {
    const [existing] = await db.query('SELECT * FROM Users WHERE UserId = ?', [userId]);
    if (existing.length === 0) {
      throw new Error('Tài khoản người dùng không tồn tại.');
    }

    const user = existing[0];

    if (user.UserId === currentAdminUserId) {
      throw new Error('Bạn không thể xóa tài khoản của chính mình.');
    }

    if (user.Username === 'ADMIN.0001' || user.UserId === 'USR000000000001') {
      throw new Error('Không thể xóa tài khoản Quản trị viên tối cao của hệ thống.');
    }

    await db.query('DELETE FROM Users WHERE UserId = ?', [userId]);
    return { success: true, userId };
  };
}

module.exports = UserService;
