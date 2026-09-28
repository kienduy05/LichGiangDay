const db = require('../../config/db');

class KhoaSinhVienService {

  /**
   * 1. Lấy danh sách Khóa sinh viên
   * Hỗ trợ tìm kiếm theo MaKhoaSinhVien / TenKhoaSinhVien.
   * Đếm số LopHocPhan gắn niên khóa này qua cột KhoaHoc (NULL-safe: LEFT JOIN).
   */
  static getAll = async ({ search = '' } = {}) => {
    let sql = `
      SELECT
        ksv.MaKhoaSinhVien,
        ksv.TenKhoaSinhVien,
        COUNT(DISTINCT lhp.MaLopHocPhan) AS SoLopHocPhan
      FROM KhoaSinhVien ksv
      LEFT JOIN LopHocPhan lhp ON ksv.MaKhoaSinhVien = lhp.KhoaHoc
    `;

    const params = [];
    if (search && search.trim() !== '') {
      sql += ` WHERE (ksv.MaKhoaSinhVien LIKE ? OR ksv.TenKhoaSinhVien LIKE ?)`;
      const kw = `%${search.trim()}%`;
      params.push(kw, kw);
    }

    sql += `
      GROUP BY ksv.MaKhoaSinhVien, ksv.TenKhoaSinhVien
      ORDER BY ksv.MaKhoaSinhVien ASC
    `;

    const [rows] = await db.query(sql, params);
    return rows;
  };

  /**
   * Lấy thông tin 1 Khóa sinh viên theo MaKhoaSinhVien
   */
  static getById = async (maKhoaSinhVien) => {
    const [rows] = await db.query(`
      SELECT
        ksv.MaKhoaSinhVien,
        ksv.TenKhoaSinhVien,
        COUNT(DISTINCT lhp.MaLopHocPhan) AS SoLopHocPhan
      FROM KhoaSinhVien ksv
      LEFT JOIN LopHocPhan lhp ON ksv.MaKhoaSinhVien = lhp.KhoaHoc
      WHERE ksv.MaKhoaSinhVien = ?
      GROUP BY ksv.MaKhoaSinhVien, ksv.TenKhoaSinhVien
      LIMIT 1
    `, [maKhoaSinhVien]);
    return rows[0] || null;
  };

  /**
   * 2. Tạo mới Khóa sinh viên
   */
  static create = async ({ maKhoaSinhVien, tenKhoaSinhVien }) => {
    // Chuẩn hóa mã
    const normalizedMa = maKhoaSinhVien.trim().toUpperCase();

    // Check trùng mã
    const [existing] = await db.query(
      `SELECT MaKhoaSinhVien FROM KhoaSinhVien WHERE MaKhoaSinhVien = ? LIMIT 1`,
      [normalizedMa]
    );
    if (existing.length > 0) {
      throw new Error(`Mã khóa sinh viên '${normalizedMa}' đã tồn tại.`);
    }

    await db.query(
      `INSERT INTO KhoaSinhVien (MaKhoaSinhVien, TenKhoaSinhVien) VALUES (?, ?)`,
      [normalizedMa, tenKhoaSinhVien.trim()]
    );

    return await this.getById(normalizedMa);
  };

  /**
   * 3. Cập nhật TenKhoaSinhVien
   * MaKhoaSinhVien khóa cứng — không sửa được
   */
  static update = async (maKhoaSinhVien, { tenKhoaSinhVien }) => {
    const existing = await this.getById(maKhoaSinhVien);
    if (!existing) {
      throw new Error(`Không tìm thấy khóa sinh viên có mã '${maKhoaSinhVien}'.`);
    }

    await db.query(
      `UPDATE KhoaSinhVien SET TenKhoaSinhVien = ? WHERE MaKhoaSinhVien = ?`,
      [tenKhoaSinhVien.trim(), maKhoaSinhVien]
    );

    return await this.getById(maKhoaSinhVien);
  };

  /**
   * 4. Xóa Khóa sinh viên
   * Kiểm tra duy nhất 1 ràng buộc: LopHocPhan.KhoaHoc
   */
  static delete = async (maKhoaSinhVien) => {
    const existing = await this.getById(maKhoaSinhVien);
    if (!existing) {
      throw new Error(`Không tìm thấy khóa sinh viên có mã '${maKhoaSinhVien}'.`);
    }

    // Đếm LopHocPhan gắn niên khóa này (cột KhoaHoc nullable)
    const [[count]] = await db.query(
      `SELECT COUNT(*) AS total FROM LopHocPhan WHERE KhoaHoc = ?`,
      [maKhoaSinhVien]
    );
    if (count.total > 0) {
      throw new Error(
        `Không thể xóa khóa sinh viên '${maKhoaSinhVien}' vì đang có ${count.total} lớp học phần gắn với niên khóa này.`
      );
    }

    await db.query(`DELETE FROM KhoaSinhVien WHERE MaKhoaSinhVien = ?`, [maKhoaSinhVien]);
    return { success: true, maKhoaSinhVien };
  };
}

module.exports = KhoaSinhVienService;
