const db = require('../../config/db');

/**
 * Trợ giúp lấy phạm vi dữ liệu của User: maGiangVien, maBoMon, hoTen
 */
async function getUserScope(user, connection = db) {
  let maGiangVien = user?.maGiangVien || null;
  let maBoMon = user?.maBoMon || null;
  let hoTen = user?.fullName || null;

  // 1. Tìm thông qua UserId trong bảng GiangVien
  if (user?.userId) {
    const [gvRows] = await connection.query(
      'SELECT MaGiangVien, HoTen, MaBoMon FROM GiangVien WHERE UserId = ? LIMIT 1',
      [user.userId]
    );
    if (gvRows.length > 0) {
      maGiangVien = maGiangVien || gvRows[0].MaGiangVien;
      hoTen = hoTen || gvRows[0].HoTen;
      if (!maBoMon) maBoMon = gvRows[0].MaBoMon;
    }
  }

  // 2. Tìm thông qua username hoặc mã giảng viên trong bảng GiangVien
  if (!maBoMon && (user?.username || maGiangVien)) {
    const [gvRows] = await connection.query(
      'SELECT MaGiangVien, HoTen, MaBoMon FROM GiangVien WHERE MaGiangVien = ? OR MaGiangVien = ? LIMIT 1',
      [user?.username, maGiangVien]
    );
    if (gvRows.length > 0) {
      maGiangVien = maGiangVien || gvRows[0].MaGiangVien;
      hoTen = hoTen || gvRows[0].HoTen;
      maBoMon = gvRows[0].MaBoMon;
    }
  }

  // 3. Nếu là vai trò BOMON: kiểm tra username trùng MaBoMon hoặc MaTruongBoMon
  if (user?.role === 'BOMON') {
    if (!maBoMon) {
      const [bmRows] = await connection.query(
        'SELECT MaBoMon FROM BoMon WHERE MaBoMon = ? OR MaTruongBoMon = ? OR MaTruongBoMon = ? LIMIT 1',
        [user?.username, user?.username, maGiangVien]
      );
      if (bmRows.length > 0) {
        maBoMon = bmRows[0].MaBoMon;
      }
    }
  }

  return { maGiangVien, maBoMon, hoTen };
}

module.exports = {
  getUserScope
};
