const db = require('../../config/db');

class ThongBaoService {
  /**
   * Tạo thông báo mới
   */
  static createNotification = async ({
    userId,
    tieuDe,
    noiDung,
    loaiThongBao = 'System',
    maDoiTuongLienQuan = null
  }, connection = db) => {
    if (!userId) return null;
    const maThongBao = `TB_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await connection.query(`
      INSERT INTO ThongBao (MaThongBao, UserId, TieuDe, NoiDung, LoaiThongBao, ThoiGianGui, DaDoc, MaDoiTuongLienQuan)
      VALUES (?, ?, ?, ?, ?, NOW(), 0, ?)
    `, [maThongBao, userId, tieuDe, noiDung, loaiThongBao, maDoiTuongLienQuan]);
    return maThongBao;
  };

  /**
   * Tạo thông báo theo Mã giảng viên
   */
  static notifyGiangVien = async (maGiangVien, { tieuDe, noiDung, loaiThongBao, maDoiTuongLienQuan }, connection = db) => {
    const [gvRows] = await connection.query('SELECT UserId FROM GiangVien WHERE MaGiangVien = ? LIMIT 1', [maGiangVien]);
    if (gvRows.length > 0 && gvRows[0].UserId) {
      return await this.createNotification({
        userId: gvRows[0].UserId,
        tieuDe,
        noiDung,
        loaiThongBao,
        maDoiTuongLienQuan
      }, connection);
    }
    return null;
  };

  /**
   * Tạo thông báo cho Trưởng bộ môn
   */
  static notifyBoMon = async (maBoMon, { tieuDe, noiDung, loaiThongBao, maDoiTuongLienQuan }, connection = db) => {
    // 1. Thử gửi cho user có username = maBoMon
    const [uRows] = await connection.query("SELECT UserId FROM Users WHERE Username = ? AND Role = 'BOMON' LIMIT 1", [maBoMon]);
    if (uRows.length > 0) {
      return await this.createNotification({
        userId: uRows[0].UserId,
        tieuDe,
        noiDung,
        loaiThongBao,
        maDoiTuongLienQuan
      }, connection);
    }
    // 2. Thử qua MaTruongBoMon trong BoMon
    const [bmRows] = await connection.query("SELECT gv.UserId FROM BoMon bm JOIN GiangVien gv ON bm.MaTruongBoMon = gv.MaGiangVien WHERE bm.MaBoMon = ? LIMIT 1", [maBoMon]);
    if (bmRows.length > 0 && bmRows[0].UserId) {
      return await this.createNotification({
        userId: bmRows[0].UserId,
        tieuDe,
        noiDung,
        loaiThongBao,
        maDoiTuongLienQuan
      }, connection);
    }
    return null;
  };

  /**
   * Lấy danh sách thông báo của tôi
   */
  static getMyNotifications = async (userId) => {
    const [rows] = await db.query(`
      SELECT MaThongBao, TieuDe, NoiDung, LoaiThongBao, ThoiGianGui, DaDoc, MaDoiTuongLienQuan
      FROM ThongBao
      WHERE UserId = ?
      ORDER BY ThoiGianGui DESC
      LIMIT 50
    `, [userId]);
    return rows;
  };

  /**
   * Đánh dấu đã đọc
   */
  static markAsRead = async (userId, maThongBao) => {
    await db.query(`
      UPDATE ThongBao
      SET DaDoc = 1
      WHERE UserId = ? AND (MaThongBao = ? OR ? = 'all')
    `, [userId, maThongBao, maThongBao]);
    return true;
  };

  /**
   * Đếm số thông báo chưa đọc
   */
  static countUnread = async (userId) => {
    const [rows] = await db.query(`
      SELECT COUNT(*) AS unreadCount
      FROM ThongBao
      WHERE UserId = ? AND DaDoc = 0
    `, [userId]);
    return rows[0]?.unreadCount || 0;
  };
}

module.exports = ThongBaoService;
