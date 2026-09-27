const db = require('../../config/db');

class BoMonService {
  /**
   * Lấy danh sách tất cả Bộ môn, hỗ trợ lọc theo MaKhoa.
   * JOIN Khoa để lấy TenKhoa, JOIN GiangVien (qua MaTruongBoMon) để lấy tên Trưởng bộ môn.
   * Đếm riêng số GiangVien và số MonHoc thuộc từng bộ môn.
   */
  static getAll = async (maKhoa = '') => {
    let sql = `
      SELECT
        bm.MaBoMon,
        bm.TenBoMon,
        bm.MaKhoa,
        bm.MaTruongBoMon,
        k.TenKhoa,
        gv.HoTen         AS TenTruongBoMon,
        COUNT(DISTINCT gv2.MaGiangVien)  AS SoGiangVien,
        COUNT(DISTINCT mh.MaMonHoc)      AS SoMonHoc
      FROM BoMon bm
      LEFT JOIN Khoa k   ON bm.MaKhoa        = k.MaKhoa
      LEFT JOIN GiangVien gv  ON bm.MaTruongBoMon = gv.MaGiangVien
      LEFT JOIN GiangVien gv2 ON bm.MaBoMon       = gv2.MaBoMon
      LEFT JOIN MonHoc mh ON bm.MaBoMon       = mh.MaBoMon
    `;

    const params = [];
    if (maKhoa && maKhoa.trim() !== '') {
      sql += ` WHERE bm.MaKhoa = ?`;
      params.push(maKhoa.trim());
    }

    sql += `
      GROUP BY bm.MaBoMon, bm.TenBoMon, bm.MaKhoa, bm.MaTruongBoMon,
               k.TenKhoa, gv.HoTen
      ORDER BY bm.MaKhoa ASC, bm.MaBoMon ASC
    `;

    const [rows] = await db.query(sql, params);
    return rows;
  };

  /**
   * Lấy thông tin 1 Bộ môn theo MaBoMon (kèm TenKhoa, TenTruongBoMon).
   */
  static getById = async (maBoMon) => {
    const [rows] = await db.query(`
      SELECT
        bm.MaBoMon,
        bm.TenBoMon,
        bm.MaKhoa,
        bm.MaTruongBoMon,
        k.TenKhoa,
        gv.HoTen AS TenTruongBoMon
      FROM BoMon bm
      LEFT JOIN Khoa k  ON bm.MaKhoa        = k.MaKhoa
      LEFT JOIN GiangVien gv ON bm.MaTruongBoMon = gv.MaGiangVien
      WHERE bm.MaBoMon = ?
      LIMIT 1
    `, [maBoMon]);
    return rows[0] || null;
  };

  /**
   * Xem chi tiết Bộ môn: truy vấn song song danh sách GiangVien và MonHoc trực thuộc.
   */
  static getChiTiet = async (maBoMon) => {
    const boMon = await this.getById(maBoMon);
    if (!boMon) {
      throw new Error(`Không tìm thấy bộ môn có mã '${maBoMon}'.`);
    }

    const [[giangVienList], [monHocList]] = await Promise.all([
      db.query(`
        SELECT
          gv.MaGiangVien,
          gv.HoTen,
          gv.Email,
          gv.SoDienThoai,
          gv.TrangThai
        
        FROM GiangVien gv
        WHERE gv.MaBoMon = ?
        ORDER BY gv.HoTen ASC
      `, [maBoMon]),
      db.query(`
        SELECT
          mh.MaMonHoc,
          mh.TenMonHoc,
          mh.SoTinChi,
          mh.LoaiMonHoc
        FROM MonHoc mh
        WHERE mh.MaBoMon = ?
        ORDER BY mh.MaMonHoc ASC
      `, [maBoMon])
    ]);

    return { boMon, giangVienList, monHocList };
  };

  /**
   * Tạo mới Bộ môn.
   * MaTruongBoMon luôn = NULL khi tạo mới.
   */
  static create = async ({ maBoMon, tenBoMon, maKhoa }) => {
    // Chuẩn hóa MaBoMon
    const normalizedMa = maBoMon.trim().toUpperCase();

    // Kiểm tra trùng mã
    const [existing] = await db.query(
      `SELECT MaBoMon FROM BoMon WHERE MaBoMon = ? LIMIT 1`,
      [normalizedMa]
    );
    if (existing.length > 0) {
      throw new Error(`Mã bộ môn '${normalizedMa}' đã tồn tại.`);
    }

    // Kiểm tra Khoa tồn tại
    const [khoaRows] = await db.query(
      `SELECT MaKhoa FROM Khoa WHERE MaKhoa = ? LIMIT 1`,
      [maKhoa.trim()]
    );
    if (khoaRows.length === 0) {
      throw new Error(`Không tìm thấy khoa có mã '${maKhoa}'.`);
    }

    await db.query(
      `INSERT INTO BoMon (MaBoMon, TenBoMon, MaKhoa, MaTruongBoMon) VALUES (?, ?, ?, NULL)`,
      [normalizedMa, tenBoMon.trim(), maKhoa.trim()]
    );

    return await this.getById(normalizedMa);
  };

  /**
   * Cập nhật TenBoMon và/hoặc MaKhoa của Bộ môn.
   * Trả thêm cờ `warnTruongBoMon` khi đổi Khoa mà bộ môn đang có Trưởng.
   */
  static update = async (maBoMon, { tenBoMon, maKhoa }) => {
    const existing = await this.getById(maBoMon);
    if (!existing) {
      throw new Error(`Không tìm thấy bộ môn có mã '${maBoMon}'.`);
    }

    // Kiểm tra Khoa mới tồn tại
    const newMaKhoa = maKhoa ? maKhoa.trim() : existing.MaKhoa;
    if (maKhoa && maKhoa.trim() !== existing.MaKhoa) {
      const [khoaRows] = await db.query(
        `SELECT MaKhoa FROM Khoa WHERE MaKhoa = ? LIMIT 1`,
        [newMaKhoa]
      );
      if (khoaRows.length === 0) {
        throw new Error(`Không tìm thấy khoa có mã '${maKhoa}'.`);
      }
    }

    await db.query(
      `UPDATE BoMon SET TenBoMon = ?, MaKhoa = ? WHERE MaBoMon = ?`,
      [tenBoMon.trim(), newMaKhoa, maBoMon]
    );

    const updated = await this.getById(maBoMon);

    // Cảnh báo nếu đổi Khoa khi bộ môn đang có Trưởng bộ môn được gán
    const warnTruongBoMon =
      maKhoa &&
      maKhoa.trim() !== existing.MaKhoa &&
      existing.MaTruongBoMon != null;

    return { ...updated, warnTruongBoMon: !!warnTruongBoMon };
  };

  /**
   * Xóa Bộ môn. Kiểm tra tuần tự 3 ràng buộc: GiangVien → MonHoc → TepNhap.
   */
  static delete = async (maBoMon) => {
    const existing = await this.getById(maBoMon);
    if (!existing) {
      throw new Error(`Không tìm thấy bộ môn có mã '${maBoMon}'.`);
    }

    // Kiểm tra 1: GiangVien
    const [[gvCount]] = await db.query(
      `SELECT COUNT(*) AS total FROM GiangVien WHERE MaBoMon = ?`,
      [maBoMon]
    );
    if (gvCount.total > 0) {
      throw new Error(
        `Không thể xóa Bộ môn '${maBoMon}' vì đang có ${gvCount.total} giảng viên trực thuộc. ` +
        `Vui lòng chuyển giảng viên sang bộ môn khác trước.`
      );
    }

    // Kiểm tra 2: MonHoc
    const [[mhCount]] = await db.query(
      `SELECT COUNT(*) AS total FROM MonHoc WHERE MaBoMon = ?`,
      [maBoMon]
    );
    if (mhCount.total > 0) {
      throw new Error(
        `Không thể xóa Bộ môn '${maBoMon}' vì đang có ${mhCount.total} môn học trực thuộc. ` +
        `Vui lòng xóa hoặc chuyển các môn học sang bộ môn khác trước.`
      );
    }

    // Kiểm tra 3: TepNhap
    const [[tepCount]] = await db.query(
      `SELECT COUNT(*) AS total FROM TepNhap WHERE MaBoMon = ?`,
      [maBoMon]
    );
    if (tepCount.total > 0) {
      throw new Error(
        `Không thể xóa Bộ môn '${maBoMon}' vì đang có ${tepCount.total} tệp nhập liên quan. ` +
        `Không thể xóa để bảo toàn lịch sử nhập liệu.`
      );
    }

    await db.query(`DELETE FROM BoMon WHERE MaBoMon = ?`, [maBoMon]);
    return { success: true, maBoMon };
  };
}

module.exports = BoMonService;
