const db = require('../../config/db');

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
        'SELECT UserId, Username, FullName, Email, Role, IsActive, CreatedAt FROM Users WHERE UserId = ? LIMIT 1',
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

      const bcrypt = require('bcryptjs');
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
}

module.exports = UserService;
