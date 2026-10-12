const db = require('../../config/db');

class MonHocService {

  /**
   * 1. Lấy danh sách Môn học
   * Hỗ trợ lọc: maBoMon, search (MaMonHoc / TenMonHoc)
   * LEFT JOIN BoMon để hiển thị TenBoMon
   */
  static getAll = async ({ maKhoa = '', maBoMon = '', search = '' } = {}) => {
    let sql = `
      SELECT
        mh.MaMonHoc,
        mh.TenMonHoc,
        mh.SoTinChi,
        mh.MaBoMon,
        mh.LoaiMonHoc,
        bm.TenBoMon,
        bm.MaKhoa,
        k.TenKhoa,
        COUNT(DISTINCT lhp.MaLopHocPhan) AS SoLopHocPhan
      FROM MonHoc mh
      LEFT JOIN BoMon bm       ON mh.MaBoMon     = bm.MaBoMon
      LEFT JOIN Khoa k         ON bm.MaKhoa      = k.MaKhoa
      LEFT JOIN LopHocPhan lhp ON mh.MaMonHoc    = lhp.MaMonHoc
    `;

    const params = [];
    const conditions = [];

    if (maKhoa === '__NULL__') {
      conditions.push('bm.MaKhoa IS NULL');
    } else if (maKhoa && maKhoa.trim() !== '') {
      conditions.push('bm.MaKhoa = ?');
      params.push(maKhoa.trim());
    }

    if (maBoMon === '__NULL__') {
      conditions.push('mh.MaBoMon IS NULL');
    } else if (maBoMon && maBoMon.trim() !== '') {
      conditions.push('mh.MaBoMon = ?');
      params.push(maBoMon.trim());
    }

    if (search && search.trim() !== '') {
      conditions.push('(mh.MaMonHoc LIKE ? OR mh.TenMonHoc LIKE ?)');
      const kw = `%${search.trim()}%`;
      params.push(kw, kw);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += `
      GROUP BY mh.MaMonHoc, mh.TenMonHoc, mh.SoTinChi, mh.MaBoMon, mh.LoaiMonHoc, bm.TenBoMon, bm.MaKhoa, k.TenKhoa
      ORDER BY bm.MaKhoa ASC, mh.MaBoMon ASC, mh.MaMonHoc ASC
    `;

    const [rows] = await db.query(sql, params);
    return rows;
  };

  /**
   * Lấy thông tin 1 Môn học theo MaMonHoc
   */
  static getById = async (maMonHoc) => {
    const [rows] = await db.query(`
      SELECT
        mh.MaMonHoc,
        mh.TenMonHoc,
        mh.SoTinChi,
        mh.MaBoMon,
        mh.LoaiMonHoc,
        bm.TenBoMon,
        bm.MaKhoa,
        k.TenKhoa
      FROM MonHoc mh
      LEFT JOIN BoMon bm ON mh.MaBoMon = bm.MaBoMon
      LEFT JOIN Khoa k   ON bm.MaKhoa   = k.MaKhoa
      WHERE mh.MaMonHoc = ?
      LIMIT 1
    `, [maMonHoc]);
    return rows[0] || null;
  };

  /**
   * 4. Xem chi tiết Môn học: trả danh sách LopHocPhan kèm học kỳ, giảng viên, sĩ số
   */
  static getChiTiet = async (maMonHoc) => {
    const monHoc = await this.getById(maMonHoc);
    if (!monHoc) {
      throw new Error(`Không tìm thấy môn học có mã '${maMonHoc}'.`);
    }

    const [lopHocPhanList] = await db.query(`
      SELECT
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        lhp.LoaiHoc,
        lhp.SiSoDuKien,
        lhp.SiSoDangKy,
        lhp.TrangThaiPhanCong,
        lhp.NgayBatDau,
        lhp.NgayKetThuc,
        lhp.KhoaHoc,
        hk.TenHocKy,
        hk.NamHoc,
        gv.HoTen AS TenGiangVien,
        lhp.MaGiangVien
      FROM LopHocPhan lhp
      LEFT JOIN HocKy      hk ON lhp.MaHocKy     = hk.MaHocKy
      LEFT JOIN GiangVien  gv ON lhp.MaGiangVien  = gv.MaGiangVien
      WHERE lhp.MaMonHoc = ?
      ORDER BY lhp.NgayBatDau DESC
    `, [maMonHoc]);

    return { monHoc, lopHocPhanList };
  };

  /**
   * 2. Tạo mới Môn học
   * MaBoMon bắt buộc (không được NULL)
   */
  static create = async ({ maMonHoc, tenMonHoc, soTinChi, maBoMon, loaiMonHoc }) => {
    // Chuẩn hóa MaMonHoc
    const normalizedMa = maMonHoc.trim().toUpperCase();

    // Validation 1: MaBoMon bắt buộc
    if (!maBoMon || maBoMon.trim() === '') {
      throw new Error('Vui lòng chọn Bộ môn quản lý cho môn học này.');
    }

    // Validation 3: Check trùng mã
    const [existing] = await db.query(
      `SELECT MaMonHoc FROM MonHoc WHERE MaMonHoc = ? LIMIT 1`,
      [normalizedMa]
    );
    if (existing.length > 0) {
      throw new Error(`Mã môn học '${normalizedMa}' đã tồn tại.`);
    }

    // Validation 4: Bộ môn phải tồn tại
    const [bmRows] = await db.query(
      `SELECT MaBoMon FROM BoMon WHERE MaBoMon = ? LIMIT 1`,
      [maBoMon.trim()]
    );
    if (bmRows.length === 0) {
      throw new Error(`Không tìm thấy bộ môn có mã '${maBoMon}'.`);
    }

    // Validation 5: SoTinChi phải là số nguyên dương nếu có nhập
    let soTinChiVal = null;
    if (soTinChi !== undefined && soTinChi !== null && soTinChi !== '') {
      const parsed = parseInt(soTinChi, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error('Số tín chỉ phải là số nguyên dương (ví dụ: 2, 3, 4).');
      }
      soTinChiVal = parsed;
    }

    const loaiVal = loaiMonHoc && loaiMonHoc.trim() !== '' ? loaiMonHoc.trim() : 'Regular';

    await db.query(
      `INSERT INTO MonHoc (MaMonHoc, TenMonHoc, SoTinChi, MaBoMon, LoaiMonHoc)
       VALUES (?, ?, ?, ?, ?)`,
      [normalizedMa, tenMonHoc.trim(), soTinChiVal, maBoMon.trim(), loaiVal]
    );

    return await this.getById(normalizedMa);
  };

  /**
   * 3. Cập nhật Môn học
   * MaBoMon bắt buộc khi update — không cho về NULL
   */
  static update = async (maMonHoc, { tenMonHoc, soTinChi, maBoMon, loaiMonHoc }) => {
    const existing = await this.getById(maMonHoc);
    if (!existing) {
      throw new Error(`Không tìm thấy môn học có mã '${maMonHoc}'.`);
    }

    // Validation: MaBoMon bắt buộc khi update
    if (!maBoMon || maBoMon.trim() === '') {
      throw new Error('Bộ môn quản lý không được để trống khi cập nhật.');
    }

    // Validation: Bộ môn mới phải tồn tại
    const [bmRows] = await db.query(
      `SELECT MaBoMon FROM BoMon WHERE MaBoMon = ? LIMIT 1`,
      [maBoMon.trim()]
    );
    if (bmRows.length === 0) {
      throw new Error(`Không tìm thấy bộ môn có mã '${maBoMon}'.`);
    }

    // Validation: SoTinChi
    let soTinChiVal = null;
    if (soTinChi !== undefined && soTinChi !== null && soTinChi !== '') {
      const parsed = parseInt(soTinChi, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error('Số tín chỉ phải là số nguyên dương (ví dụ: 2, 3, 4).');
      }
      soTinChiVal = parsed;
    }

    const loaiVal = loaiMonHoc && loaiMonHoc.trim() !== '' ? loaiMonHoc.trim() : existing.LoaiMonHoc;

    await db.query(
      `UPDATE MonHoc SET TenMonHoc = ?, SoTinChi = ?, MaBoMon = ?, LoaiMonHoc = ?
       WHERE MaMonHoc = ?`,
      [tenMonHoc.trim(), soTinChiVal, maBoMon.trim(), loaiVal, maMonHoc]
    );

    return await this.getById(maMonHoc);
  };

  /**
   * 5. Xóa Môn học — kiểm tra duy nhất 1 ràng buộc: LopHocPhan
   */
  static delete = async (maMonHoc) => {
    const existing = await this.getById(maMonHoc);
    if (!existing) {
      throw new Error(`Không tìm thấy môn học có mã '${maMonHoc}'.`);
    }

    const [[lhpCount]] = await db.query(
      `SELECT COUNT(*) AS total FROM LopHocPhan WHERE MaMonHoc = ?`,
      [maMonHoc]
    );
    if (lhpCount.total > 0) {
      throw new Error(
        `Không thể xóa môn học '${maMonHoc}' vì đang có ${lhpCount.total} lớp học phần được mở cho môn này.`
      );
    }

    await db.query(`DELETE FROM MonHoc WHERE MaMonHoc = ?`, [maMonHoc]);
    return { success: true, maMonHoc };
  };
}

module.exports = MonHocService;
