const db = require('../../config/db');

class KeyTokenService {
  static createKeyToken = async ({ userId, publicKey, privateKey, refreshToken }) => {
    try {
      const [result] = await db.query(`
        INSERT INTO KeyTokens (UserId, PublicKey, PrivateKey, RefreshToken, RefreshTokensUsed)
        VALUES (?, ?, ?, ?, '[]')
        ON DUPLICATE KEY UPDATE 
          PublicKey = VALUES(PublicKey), 
          PrivateKey = VALUES(PrivateKey), 
          RefreshToken = VALUES(RefreshToken);
      `, [userId, publicKey, privateKey, refreshToken]);

      return result;
    } catch (error) {
      console.error('KeyTokenService createKeyToken Error:', error);
      throw error;
    }
  };

  static findByUserId = async (userId) => {
    try {
      const [rows] = await db.query('SELECT * FROM KeyTokens WHERE UserId = ? LIMIT 1', [userId]);
      return rows[0] || null;
    } catch (error) {
      console.error('KeyTokenService findByUserId Error:', error);
      throw error;
    }
  };

  static removeKeyById = async (userId) => {
    try {
      const [result] = await db.query('DELETE FROM KeyTokens WHERE UserId = ?', [userId]);
      return result;
    } catch (error) {
      console.error('KeyTokenService removeKeyById Error:', error);
      throw error;
    }
  };
}

module.exports = KeyTokenService;
