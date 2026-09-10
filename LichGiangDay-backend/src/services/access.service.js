const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const UserService = require('./user.service');
const KeyTokenService = require('./keyToken.service');
const { createTokenPair } = require('../auth/authUtils');

class AccessService {
  static login = async ({ username, password }) => {
    // 1. Find user by Username
    const foundUser = await UserService.findByUsername({ username });
    if (!foundUser) {
      const error = new Error('Lỗi: Tên đăng nhập không tồn tại hoặc tài khoản đã bị khóa.');
      error.status = 400;
      throw error;
    }

    // 2. Compare Password
    const match = bcrypt.compareSync(password, foundUser.PasswordHash);
    if (!match) {
      const error = new Error('Lỗi: Mật khẩu không chính xác.');
      error.status = 401;
      throw error;
    }

    // 3. Generate Keys
    const privateKey = crypto.randomBytes(64).toString('hex');
    const publicKey = crypto.randomBytes(64).toString('hex');

    // 4. Create Token Pair
    const tokens = await createTokenPair(
      {
        userId: foundUser.UserId,
        username: foundUser.Username,
        role: foundUser.Role
      },
      publicKey,
      privateKey
    );

    // 5. Store Keys in KeyTokens
    await KeyTokenService.createKeyToken({
      userId: foundUser.UserId,
      publicKey,
      privateKey,
      refreshToken: tokens.refreshToken
    });

    return {
      user: {
        userId: foundUser.UserId,
        username: foundUser.Username,
        fullName: foundUser.FullName,
        email: foundUser.Email,
        role: foundUser.Role
      },
      tokens
    };
  };

  static logout = async (keyStore) => {
    const delKey = await KeyTokenService.removeKeyById(keyStore.UserId);
    return delKey;
  };

  static updateProfile = async ({ userId, fullName, email }) => {
    const updatedUser = await UserService.updateUser({ userId, fullName, email });
    if (!updatedUser) {
      const error = new Error('Lỗi: Cập nhật thông tin thất bại.');
      error.status = 400;
      throw error;
    }
    return {
      userId: updatedUser.UserId,
      username: updatedUser.Username,
      fullName: updatedUser.FullName,
      email: updatedUser.Email,
      role: updatedUser.Role
    };
  };

  static changePassword = async ({ userId, oldPassword, newPassword }) => {
    return await UserService.updatePassword({ userId, oldPassword, newPassword });
  };
}

module.exports = AccessService;
