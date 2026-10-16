const db = require('../../config/db');

/**
 * Trợ giúp lấy phạm vi dữ liệu của User: maGiangVien, maBoMon, hoTen
 */
async function getUserScope(user, connection = db) {
  let maGiangVien = user?.maGiangVien || null;
  let maBoMon = user?.maBoMon || null;
  let hoTen = user?.fullName || null;

  if (user?.userId) {
    const [gvRows] = await connection.query(
      'SELECT MaGiangVien, HoTen, MaBoMon FROM GiangVien WHERE UserId = ? LIMIT 1',
      [user.userId]
    );
    if (gvRows.length > 0) {
      maGiangVien = gvRows[0].MaGiangVien;
      hoTen = gvRows[0].HoTen;
      if (!maBoMon) maBoMon = gvRows[0].MaBoMon;
    }
  }

  if (user?.role === 'BOMON') {
    const [bmRows] = await connection.query(
      'SELECT MaBoMon FROM BoMon WHERE MaBoMon = ? LIMIT 1',
      [user.username]
    );
    if (bmRows.length > 0) {
      maBoMon = bmRows[0].MaBoMon;
    }
  }

  return { maGiangVien, maBoMon, hoTen };
}

module.exports = {
  getUserScope
};
