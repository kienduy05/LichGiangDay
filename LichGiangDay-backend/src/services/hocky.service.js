const db = require('../../config/db');

class HocKyService {

  /**
   * 1. Lấy danh sách Học kỳ
   * Sắp xếp theo NgayBatDau giảm dần (mới nhất lên đầu).
   * Đếm số LopHocPhan thuộc từng học kỳ.
   * Hỗ trợ tìm kiếm theo TenHocKy / NamHoc.
   */
  static getAll = async ({ search = '' } = {}) => {
    let sql = `
      SELECT
        hk.MaHocKy,
        hk.TenHocKy,
        hk.Dot,
        hk.NamHoc,
        hk.NgayBatDau,
        hk.NgayKetThuc,
        COUNT(DISTINCT lhp.MaLopHocPhan) AS SoLopHocPhan
      FROM HocKy hk
      LEFT JOIN LopHocPhan lhp ON hk.MaHocKy = lhp.MaHocKy
    `;

    const params = [];
    if (search && search.trim() !== '') {
      sql += ` WHERE (hk.TenHocKy LIKE ? OR hk.NamHoc LIKE ? OR hk.MaHocKy LIKE ?)`;
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw);
    }

    sql += `
      GROUP BY hk.MaHocKy, hk.TenHocKy, hk.Dot, hk.NamHoc, hk.NgayBatDau, hk.NgayKetThuc
      ORDER BY hk.NgayBatDau DESC
    `;

    const [rows] = await db.query(sql, params);
    return rows;
  };

  /**
   * Lấy thông tin 1 Học kỳ theo MaHocKy (kèm SoLopHocPhan)
   */
  static getById = async (maHocKy) => {
    const [rows] = await db.query(`
      SELECT
        hk.MaHocKy,
        hk.TenHocKy,
        hk.Dot,
        hk.NamHoc,
        hk.NgayBatDau,
        hk.NgayKetThuc,
        COUNT(DISTINCT lhp.MaLopHocPhan) AS SoLopHocPhan
      FROM HocKy hk
      LEFT JOIN LopHocPhan lhp ON hk.MaHocKy = lhp.MaHocKy
      WHERE hk.MaHocKy = ?
      GROUP BY hk.MaHocKy, hk.TenHocKy, hk.Dot, hk.NamHoc, hk.NgayBatDau, hk.NgayKetThuc
      LIMIT 1
    `, [maHocKy]);
    return rows[0] || null;
  };

  /**
   * Kiểm tra chồng lấn ngày với các học kỳ khác đã tồn tại.
   * Trả về danh sách học kỳ bị chồng lấn (empty = không chồng).
   * excludeMaHocKy: bỏ qua chính học kỳ đang update.
   */
  static checkOverlap = async (ngayBatDau, ngayKetThuc, excludeMaHocKy = null) => {
    let sql = `
      SELECT MaHocKy, TenHocKy, NgayBatDau, NgayKetThuc
      FROM HocKy
      WHERE NgayBatDau < ? AND NgayKetThuc > ?
    `;
    const params = [ngayKetThuc, ngayBatDau];

    if (excludeMaHocKy) {
      sql += ` AND MaHocKy != ?`;
      params.push(excludeMaHocKy);
    }

    const [rows] = await db.query(sql, params);
    return rows;
  };

  /**
   * 2. Tạo mới Học kỳ
   * Trả thêm cờ overlapWarning nếu trùng thời gian với học kỳ khác.
   */
  static create = async ({ maHocKy, tenHocKy, dot, namHoc, ngayBatDau, ngayKetThuc }) => {
    const normalizedMa = maHocKy.trim().toUpperCase();

    // Validate 1: check trùng mã
    const [existing] = await db.query(
      `SELECT MaHocKy FROM HocKy WHERE MaHocKy = ? LIMIT 1`,
      [normalizedMa]
    );
    if (existing.length > 0) {
      throw new Error(`Mã học kỳ '${normalizedMa}' đã tồn tại.`);
    }

    // Validate 2: NgayBatDau < NgayKetThuc
    if (new Date(ngayBatDau) >= new Date(ngayKetThuc)) {
      throw new Error('Ngày bắt đầu phải trước ngày kết thúc.');
    }

    // Validate 3: overlap check (cảnh báo, không chặn cứng)
    const overlapList = await this.checkOverlap(ngayBatDau, ngayKetThuc);

    // Ghi dữ liệu
    const dotVal = (dot !== undefined && dot !== null && dot !== '') ? parseInt(dot, 10) : null;
    const namHocVal = (namHoc && namHoc.trim() !== '') ? namHoc.trim() : null;

    await db.query(
      `INSERT INTO HocKy (MaHocKy, TenHocKy, Dot, NamHoc, NgayBatDau, NgayKetThuc)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [normalizedMa, tenHocKy.trim(), dotVal, namHocVal, ngayBatDau, ngayKetThuc]
    );

    const created = await this.getById(normalizedMa);
    return {
      ...created,
      overlapWarning: overlapList.length > 0 ? overlapList : null
    };
  };

  /**
   * 3. Cập nhật thông tin Học kỳ
   * MaHocKy khóa cứng.
   * Cảnh báo nếu thu hẹp khoảng ngày khi đã có LopHocPhan.
   * Cảnh báo nếu trùng lấn ngày với học kỳ khác.
   */
  static update = async (maHocKy, { tenHocKy, dot, namHoc, ngayBatDau, ngayKetThuc }) => {
    const existing = await this.getById(maHocKy);
    if (!existing) {
      throw new Error(`Không tìm thấy học kỳ có mã '${maHocKy}'.`);
    }

    // Validate: NgayBatDau < NgayKetThuc
    if (new Date(ngayBatDau) >= new Date(ngayKetThuc)) {
      throw new Error('Ngày bắt đầu phải trước ngày kết thúc.');
    }

    // Cảnh báo thu hẹp: có LopHocPhan + ngày mới khác cũ
    let dateNarrowWarning = false;
    if (existing.SoLopHocPhan > 0) {
      const oldStart = new Date(existing.NgayBatDau);
      const oldEnd = new Date(existing.NgayKetThuc);
      const newStart = new Date(ngayBatDau);
      const newEnd = new Date(ngayKetThuc);
      if (newStart > oldStart || newEnd < oldEnd) {
        dateNarrowWarning = true;
      }
    }

    // Overlap check với các học kỳ khác (bỏ qua chính nó)
    const overlapList = await this.checkOverlap(ngayBatDau, ngayKetThuc, maHocKy);

    const dotVal = (dot !== undefined && dot !== null && dot !== '') ? parseInt(dot, 10) : null;
    const namHocVal = (namHoc && namHoc.trim() !== '') ? namHoc.trim() : null;

    await db.query(
      `UPDATE HocKy
       SET TenHocKy = ?, Dot = ?, NamHoc = ?, NgayBatDau = ?, NgayKetThuc = ?
       WHERE MaHocKy = ?`,
      [tenHocKy.trim(), dotVal, namHocVal, ngayBatDau, ngayKetThuc, maHocKy]
    );

    const updated = await this.getById(maHocKy);
    return {
      ...updated,
      dateNarrowWarning,
      overlapWarning: overlapList.length > 0 ? overlapList : null
    };
  };

  /**
   * 4. Xóa Học kỳ — kiểm tra 1 ràng buộc: LopHocPhan
   */
  static delete = async (maHocKy) => {
    const existing = await this.getById(maHocKy);
    if (!existing) {
      throw new Error(`Không tìm thấy học kỳ có mã '${maHocKy}'.`);
    }

    const [[count]] = await db.query(
      `SELECT COUNT(*) AS total FROM LopHocPhan WHERE MaHocKy = ?`,
      [maHocKy]
    );
    if (count.total > 0) {
      throw new Error(
        `Không thể xóa học kỳ '${maHocKy}' vì đang có ${count.total} lớp học phần thuộc học kỳ này.`
      );
    }

    await db.query(`DELETE FROM HocKy WHERE MaHocKy = ?`, [maHocKy]);
    return { success: true, maHocKy };
  };
}

module.exports = HocKyService;
