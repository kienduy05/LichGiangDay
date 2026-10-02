const db = require('../../config/db');

class LopSinhVienService {

  /**
   * 1. Lấy danh sách Lớp sinh viên
   * Hỗ trợ lọc: maKhoa, search (MaLopSinhVien / TenLopSinhVien)
   * INNER JOIN Khoa (MaKhoa NOT NULL nên INNER JOIN là đủ)
   * Đếm số lớp học phần đã/đang tham gia qua bảng trung gian
   */
  static getAll = async ({ maKhoa = '', search = '' } = {}) => {
    let sql = `
      SELECT
        lsv.MaLopSinhVien,
        lsv.TenLopSinhVien,
        lsv.MaKhoa,
        k.TenKhoa,
        COUNT(DISTINCT lhl.MaLopHocPhan) AS SoLopHocPhan
      FROM LopSinhVien lsv
      INNER JOIN Khoa k ON lsv.MaKhoa = k.MaKhoa
      LEFT JOIN LopHocPhan_LopSinhVien lhl ON lsv.MaLopSinhVien = lhl.MaLopSinhVien
    `;

    const params = [];
    const conditions = [];

    if (maKhoa === '__NULL__') {
      conditions.push('lsv.MaKhoa IS NULL');
    } else if (maKhoa && maKhoa.trim() !== '') {
      conditions.push('lsv.MaKhoa = ?');
      params.push(maKhoa.trim());
    }

    if (search && search.trim() !== '') {
      conditions.push('(lsv.MaLopSinhVien LIKE ? OR lsv.TenLopSinhVien LIKE ?)');
      const kw = `%${search.trim()}%`;
      params.push(kw, kw);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += `
      GROUP BY lsv.MaLopSinhVien, lsv.TenLopSinhVien, lsv.MaKhoa, k.TenKhoa
      ORDER BY lsv.MaKhoa ASC, lsv.MaLopSinhVien ASC
    `;

    const [rows] = await db.query(sql, params);
    return rows;
  };

  /**
   * Lấy thông tin 1 Lớp sinh viên theo MaLopSinhVien
   */
  static getById = async (maLopSinhVien) => {
    const [rows] = await db.query(`
      SELECT
        lsv.MaLopSinhVien,
        lsv.TenLopSinhVien,
        lsv.MaKhoa,
        k.TenKhoa,
        COUNT(DISTINCT lhl.MaLopHocPhan) AS SoLopHocPhan
      FROM LopSinhVien lsv
      LEFT JOIN Khoa k ON lsv.MaKhoa = k.MaKhoa
      LEFT JOIN LopHocPhan_LopSinhVien lhl ON lsv.MaLopSinhVien = lhl.MaLopSinhVien
      WHERE lsv.MaLopSinhVien = ?
      GROUP BY lsv.MaLopSinhVien, lsv.TenLopSinhVien, lsv.MaKhoa, k.TenKhoa
      LIMIT 1
    `, [maLopSinhVien]);
    return rows[0] || null;
  };

  /**
   * Lấy chi tiết Lớp sinh viên kèm danh sách Lớp học phần tham gia
   */
  static getChiTiet = async (maLopSinhVien) => {
    const lopSinhVien = await this.getById(maLopSinhVien);
    if (!lopSinhVien) {
      throw new Error(`Không tìm thấy lớp sinh viên có mã '${maLopSinhVien}'.`);
    }

    const [lopHocPhanList] = await db.query(`
      SELECT
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        lhp.MaMonHoc,
        mh.TenMonHoc,
        mh.SoTinChi,
        lhp.LoaiHoc,
        lhp.MaHocKy,
        hk.TenHocKy,
        hk.NamHoc,
        lhp.MaGiangVien,
        gv.HoTen AS TenGiangVien,
        lhp.TrangThaiPhanCong
      FROM LopHocPhan_LopSinhVien lhl
      INNER JOIN LopHocPhan lhp ON lhl.MaLopHocPhan = lhp.MaLopHocPhan
      LEFT JOIN MonHoc      mh  ON lhp.MaMonHoc     = mh.MaMonHoc
      LEFT JOIN HocKy       hk  ON lhp.MaHocKy      = hk.MaHocKy
      LEFT JOIN GiangVien   gv  ON lhp.MaGiangVien  = gv.MaGiangVien
      WHERE lhl.MaLopSinhVien = ?
      ORDER BY lhp.MaLopHocPhan ASC
    `, [maLopSinhVien]);

    return { lopSinhVien, lopHocPhanList };
  };

  /**
   * 2. Tạo mới Lớp sinh viên
   * Cả 3 trường đều bắt buộc
   */
  static create = async ({ maLopSinhVien, tenLopSinhVien, maKhoa }) => {
    // Chuẩn hóa mã
    const normalizedMa = maLopSinhVien.trim().toUpperCase();

    // Check trùng mã
    const [existing] = await db.query(
      `SELECT MaLopSinhVien FROM LopSinhVien WHERE MaLopSinhVien = ? LIMIT 1`,
      [normalizedMa]
    );
    if (existing.length > 0) {
      throw new Error(`Mã lớp sinh viên '${normalizedMa}' đã tồn tại.`);
    }

    // Check Khoa tồn tại
    const [khoaRows] = await db.query(
      `SELECT MaKhoa FROM Khoa WHERE MaKhoa = ? LIMIT 1`,
      [maKhoa.trim()]
    );
    if (khoaRows.length === 0) {
      throw new Error(`Không tìm thấy khoa có mã '${maKhoa}'.`);
    }

    await db.query(
      `INSERT INTO LopSinhVien (MaLopSinhVien, TenLopSinhVien, MaKhoa) VALUES (?, ?, ?)`,
      [normalizedMa, tenLopSinhVien.trim(), maKhoa.trim()]
    );

    return await this.getById(normalizedMa);
  };

  /**
   * 3. Cập nhật TenLopSinhVien và/hoặc MaKhoa
   * MaLopSinhVien khóa cứng — không sửa được
   */
  static update = async (maLopSinhVien, { tenLopSinhVien, maKhoa }) => {
    const existing = await this.getById(maLopSinhVien);
    if (!existing) {
      throw new Error(`Không tìm thấy lớp sinh viên có mã '${maLopSinhVien}'.`);
    }

    const newMaKhoa = maKhoa ? maKhoa.trim() : existing.MaKhoa;

    // Check Khoa mới tồn tại nếu có đổi
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
      `UPDATE LopSinhVien SET TenLopSinhVien = ?, MaKhoa = ? WHERE MaLopSinhVien = ?`,
      [tenLopSinhVien.trim(), newMaKhoa, maLopSinhVien]
    );

    return await this.getById(maLopSinhVien);
  };

  /**
   * 4. Xóa Lớp sinh viên
   * Kiểm tra duy nhất 1 ràng buộc: LopHocPhan_LopSinhVien
   */
  static delete = async (maLopSinhVien) => {
    const existing = await this.getById(maLopSinhVien);
    if (!existing) {
      throw new Error(`Không tìm thấy lớp sinh viên có mã '${maLopSinhVien}'.`);
    }

    const [[count]] = await db.query(
      `SELECT COUNT(*) AS total FROM LopHocPhan_LopSinhVien WHERE MaLopSinhVien = ?`,
      [maLopSinhVien]
    );
    if (count.total > 0) {
      throw new Error(
        `Không thể xóa lớp sinh viên '${maLopSinhVien}' vì đang tham gia ${count.total} lớp học phần.`
      );
    }

    await db.query(`DELETE FROM LopSinhVien WHERE MaLopSinhVien = ?`, [maLopSinhVien]);
    return { success: true, maLopSinhVien };
  };
}

module.exports = LopSinhVienService;
