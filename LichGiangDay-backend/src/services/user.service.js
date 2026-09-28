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
        `SELECT 
           u.UserId, 
           u.Username, 
           u.FullName, 
           u.Email, 
           u.Role, 
           r.RoleName, 
           u.IsActive, 
           u.CreatedAt, 
           u.UpdatedAt,
           gv.MaGiangVien,
           gv.HoTen AS TenGiangVien
         FROM Users u 
         LEFT JOIN Roles r ON u.Role = r.RoleId 
         LEFT JOIN GiangVien gv ON u.UserId = gv.UserId
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
   * Lấy danh sách tất cả tài khoản người dùng kèm tên Nhóm quyền & Giảng viên liên kết
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
        u.UpdatedAt,
        gv.MaGiangVien,
        gv.HoTen AS TenGiangVien
      FROM Users u
      LEFT JOIN Roles r ON u.Role = r.RoleId
      LEFT JOIN GiangVien gv ON u.UserId = gv.UserId
      ORDER BY u.CreatedAt DESC
    `);
    return rows;
  };

  /**
   * Tạo tài khoản người dùng mới (kèm liên kết Giảng viên nếu có)
   */
  static createUser = async ({ username, password, fullName, email, role, maGiangVien }) => {
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

    // Nếu chọn role là Giảng viên và có maGiangVien, kiểm tra giảng viên tồn tại
    const isGvRole = role === 'GIANGVIEN' || role.toUpperCase().includes('GIANGVIEN') || role.toUpperCase().includes('GV');
    if (isGvRole && maGiangVien && maGiangVien.trim() !== '') {
      const [gvRows] = await db.query('SELECT MaGiangVien, UserId, HoTen FROM GiangVien WHERE MaGiangVien = ? LIMIT 1', [maGiangVien.trim()]);
      if (gvRows.length === 0) {
        throw new Error(`Giảng viên có mã '${maGiangVien}' không tồn tại.`);
      }
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

    // Nếu là Giảng viên và có chọn giảng viên liên kết, cập nhật UserId vào bảng GiangVien
    if (isGvRole && maGiangVien && maGiangVien.trim() !== '') {
      await db.query('UPDATE GiangVien SET UserId = ? WHERE MaGiangVien = ?', [userId, maGiangVien.trim()]);
    }

    return await this.findById(userId);
  };

  /**
   * Cập nhật thông tin tài khoản người dùng bởi Admin (kèm liên kết Giảng viên)
   */
  static updateAdminUser = async (userId, { fullName, email, role, isActive, maGiangVien }) => {
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

    // Xử lý liên kết giảng viên
    const isGvRole = finalRole === 'GIANGVIEN' || finalRole.toUpperCase().includes('GIANGVIEN') || finalRole.toUpperCase().includes('GV');
    if (isGvRole) {
      if (maGiangVien && maGiangVien.trim() !== '') {
        const [gvRows] = await db.query('SELECT MaGiangVien FROM GiangVien WHERE MaGiangVien = ? LIMIT 1', [maGiangVien.trim()]);
        if (gvRows.length === 0) {
          throw new Error(`Giảng viên có mã '${maGiangVien}' không tồn tại.`);
        }
        // Xóa liên kết cũ của tài khoản này nếu có ở giảng viên khác
        await db.query('UPDATE GiangVien SET UserId = NULL WHERE UserId = ? AND MaGiangVien != ?', [userId, maGiangVien.trim()]);
        // Cập nhật liên kết mới
        await db.query('UPDATE GiangVien SET UserId = ? WHERE MaGiangVien = ?', [userId, maGiangVien.trim()]);
      } else {
        // Nếu bỏ chọn giảng viên (để trống)
        await db.query('UPDATE GiangVien SET UserId = NULL WHERE UserId = ?', [userId]);
      }
    } else {
      // Nếu đổi role sang nhóm khác không phải giảng viên, gỡ bỏ liên kết nếu có
      await db.query('UPDATE GiangVien SET UserId = NULL WHERE UserId = ?', [userId]);
    }

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

    // Gỡ liên kết trong bảng GiangVien trước khi xóa
    await db.query('UPDATE GiangVien SET UserId = NULL WHERE UserId = ?', [userId]);

    await db.query('DELETE FROM Users WHERE UserId = ?', [userId]);
    return { success: true, userId };
  };
}

module.exports = UserService;
