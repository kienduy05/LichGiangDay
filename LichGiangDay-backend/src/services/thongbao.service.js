const db = require('../../config/db');

class ThongBaoService {
  /**
   * Tạo thông báo mới vào bảng ThongBao (Chưa đọc)
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
   * Tạo thông báo cho Bộ môn (gửi đồng thời cho tài khoản role BOMON và tài khoản Giảng viên Trưởng bộ môn)
   */
  static notifyBoMon = async (maBoMon, { tieuDe, noiDung, loaiThongBao, maDoiTuongLienQuan, deduplicate = false }, connection = db) => {
    if (!maBoMon) return [];

    const targetUserIds = new Set();

    // 1. Tìm user đại diện bộ môn (Role = 'BOMON' và Username = maBoMon)
    const [uRows] = await connection.query(
      "SELECT UserId FROM Users WHERE Username = ? AND Role = 'BOMON' AND IsActive = 1",
      [maBoMon]
    );
    uRows.forEach(u => targetUserIds.add(u.UserId));

    // 2. Tìm user của Giảng viên đang giữ chức vụ Trưởng bộ môn
    const [bmRows] = await connection.query(
      `SELECT gv.UserId 
       FROM BoMon bm 
       JOIN GiangVien gv ON bm.MaTruongBoMon = gv.MaGiangVien 
       JOIN Users u ON gv.UserId = u.UserId
       WHERE bm.MaBoMon = ? AND u.IsActive = 1`,
      [maBoMon]
    );
    bmRows.forEach(bm => {
      if (bm.UserId) targetUserIds.add(bm.UserId);
    });

    // 3. Bắn thông báo đến từng UserId (chỉ lưu vào ThongBao chưa đọc)
    const createdIds = [];
    for (const uId of targetUserIds) {
      if (deduplicate && maDoiTuongLienQuan) {
        const [existing] = await connection.query(`
          SELECT MaThongBao FROM ThongBao WHERE UserId = ? AND LoaiThongBao = ? AND MaDoiTuongLienQuan = ?
          UNION ALL
          SELECT MaThongBao FROM ThongBaoDaDoc WHERE UserId = ? AND LoaiThongBao = ? AND MaDoiTuongLienQuan = ? LIMIT 1`,
        [uId, loaiThongBao, maDoiTuongLienQuan, uId, loaiThongBao, maDoiTuongLienQuan]);
        if (existing.length) { createdIds.push(existing[0].MaThongBao); continue; }
      }
      const id = await this.createNotification({
        userId: uId,
        tieuDe,
        noiDung,
        loaiThongBao,
        maDoiTuongLienQuan
      }, connection);
      if (id) createdIds.push(id);
    }

    return createdIds;
  };

  /**
   * Lấy danh sách thông báo của tôi:
   * - tab = 'unread' (mặc định): lấy từ ThongBao (chưa đọc)
   * - tab = 'read': lấy từ ThongBaoDaDoc (đã đọc)
   * - tab = 'all': lấy cả 2 (chưa đọc trước, đã đọc sau)
   */
  static getMyNotifications = async (userId, { tab = 'all', limit = 50, page = 1 } = {}) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    if (tab === 'unread') {
      const [rows] = await db.query(`
        SELECT MaThongBao, UserId, TieuDe, NoiDung, LoaiThongBao, ThoiGianGui, 0 AS DaDoc, NULL AS ThoiGianDoc, MaDoiTuongLienQuan
        FROM ThongBao
        WHERE UserId = ?
        ORDER BY ThoiGianGui DESC
        LIMIT ? OFFSET ?
      `, [userId, limitNum, offset]);
      return rows;
    }

    if (tab === 'read') {
      const [rows] = await db.query(`
        SELECT MaThongBao, UserId, TieuDe, NoiDung, LoaiThongBao, ThoiGianGui, 1 AS DaDoc, ThoiGianDoc, MaDoiTuongLienQuan
        FROM ThongBaoDaDoc
        WHERE UserId = ?
        ORDER BY ThoiGianDoc DESC, ThoiGianGui DESC
        LIMIT ? OFFSET ?
      `, [userId, limitNum, offset]);
      return rows;
    }

    // tab = 'all' (ghép unread lên trước, read theo sau)
    const [rows] = await db.query(`
      (
        SELECT MaThongBao, UserId, TieuDe, NoiDung, LoaiThongBao, ThoiGianGui, 0 AS DaDoc, NULL AS ThoiGianDoc, MaDoiTuongLienQuan
        FROM ThongBao
        WHERE UserId = ?
      )
      UNION ALL
      (
        SELECT MaThongBao, UserId, TieuDe, NoiDung, LoaiThongBao, ThoiGianGui, 1 AS DaDoc, ThoiGianDoc, MaDoiTuongLienQuan
        FROM ThongBaoDaDoc
        WHERE UserId = ?
      )
      ORDER BY DaDoc ASC, ThoiGianGui DESC
      LIMIT ? OFFSET ?
    `, [userId, userId, limitNum, offset]);

    return rows;
  };

  /**
   * Đánh dấu đã đọc: Di chuyển bản ghi từ ThongBao sang ThongBaoDaDoc
   * - maThongBao: mã cụ thể hoặc 'all'
   */
  static markAsRead = async (userId, maThongBao) => {
    const isAll = !maThongBao || maThongBao === 'all';
    
    // 1. Copy sang ThongBaoDaDoc
    let insertSql = `
      INSERT INTO ThongBaoDaDoc (MaThongBao, UserId, TieuDe, NoiDung, LoaiThongBao, ThoiGianGui, ThoiGianDoc, MaDoiTuongLienQuan)
      SELECT MaThongBao, UserId, TieuDe, NoiDung, LoaiThongBao, ThoiGianGui, NOW(), MaDoiTuongLienQuan
      FROM ThongBao
      WHERE UserId = ?
    `;
    const params = [userId];

    if (!isAll) {
      insertSql += ' AND MaThongBao = ?';
      params.push(maThongBao);
    }
    insertSql += ' ON DUPLICATE KEY UPDATE ThoiGianDoc = VALUES(ThoiGianDoc)';

    await db.query(insertSql, params);

    // 2. Xóa khỏi ThongBao để tránh đầy bảng
    let deleteSql = 'DELETE FROM ThongBao WHERE UserId = ?';
    const delParams = [userId];
    if (!isAll) {
      deleteSql += ' AND MaThongBao = ?';
      delParams.push(maThongBao);
    }
    await db.query(deleteSql, delParams);

    return true;
  };

  /**
   * Đếm số thông báo chưa đọc trong bảng ThongBao
   */
  static countUnread = async (userId) => {
    const [rows] = await db.query(`
      SELECT COUNT(*) AS unreadCount
      FROM ThongBao
      WHERE UserId = ?
    `, [userId]);
    return Number(rows[0]?.unreadCount) || 0;
  };
}

module.exports = ThongBaoService;
