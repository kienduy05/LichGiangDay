const db = require('../../config/db');

class KhoaService {
  /**
   * Lấy danh sách tất cả các khoa, hỗ trợ tìm kiếm theo MaKhoa hoặc TenKhoa.
   * JOIN BoMon để đếm số bộ môn trực thuộc, JOIN GiangVien để lấy tên Trưởng khoa.
   */
  static getAll = async (search = '') => {
    let sql = `
      SELECT
        k.MaKhoa,
        k.TenKhoa,
        k.MaTruongKhoa,
        gv.HoTen AS TenTruongKhoa,
        COUNT(DISTINCT bm.MaBoMon) AS SoBoMon
      FROM Khoa k
      LEFT JOIN GiangVien gv ON k.MaTruongKhoa = gv.MaGiangVien
      LEFT JOIN BoMon bm ON k.MaKhoa = bm.MaKhoa
    `;

    const params = [];
    if (search && search.trim() !== '') {
      sql += ` WHERE k.MaKhoa LIKE ? OR k.TenKhoa LIKE ?`;
      const keyword = `%${search.trim()}%`;
      params.push(keyword, keyword);
    }

    sql += `
      GROUP BY k.MaKhoa, k.TenKhoa, k.MaTruongKhoa, gv.HoTen
      ORDER BY k.MaKhoa ASC
    `;

    const [rows] = await db.query(sql, params);
    return rows;
  };

  /**
   * Lấy thông tin chi tiết 1 khoa theo MaKhoa (kèm tên Trưởng khoa).
   */
  static getById = async (maKhoa) => {
    const [rows] = await db.query(`
      SELECT
        k.MaKhoa,
        k.TenKhoa,
        k.MaTruongKhoa,
        gv.HoTen AS TenTruongKhoa
      FROM Khoa k
      LEFT JOIN GiangVien gv ON k.MaTruongKhoa = gv.MaGiangVien
      WHERE k.MaKhoa = ?
      LIMIT 1
    `, [maKhoa]);
    return rows[0] || null;
  };

  /**
   * Lấy danh sách Bộ môn trực thuộc 1 khoa, kèm số lượng Giảng viên của từng Bộ môn.
   * Dùng cho trang chi tiết Khoa (mục 5).
   */
  static getBoMonByKhoa = async (maKhoa) => {
    const khoa = await this.getById(maKhoa);
    if (!khoa) {
      throw new Error(`Không tìm thấy khoa có mã '${maKhoa}'.`);
    }

    const [boMonList] = await db.query(`
      SELECT
        bm.MaBoMon,
        bm.TenBoMon,
        bm.MaKhoa,
        COUNT(DISTINCT gv.MaGiangVien) AS SoGiangVien
      FROM BoMon bm
      LEFT JOIN GiangVien gv ON bm.MaBoMon = gv.MaBoMon
      WHERE bm.MaKhoa = ?
      GROUP BY bm.MaBoMon, bm.TenBoMon, bm.MaKhoa
      ORDER BY bm.MaBoMon ASC
    `, [maKhoa]);

    return {
      khoa,
      boMonList
    };
  };

  /**
   * Lấy danh sách Giảng viên Active thuộc Khoa (qua BoMon) để chọn Trưởng khoa.
   * Chỉ liệt kê giảng viên có Bộ môn nằm trong chính Khoa đó.
   */
  static getGiangVienByKhoa = async (maKhoa) => {
    const khoa = await this.getById(maKhoa);
    if (!khoa) {
      throw new Error(`Không tìm thấy khoa có mã '${maKhoa}'.`);
    }

    const [rows] = await db.query(`
      SELECT
        gv.MaGiangVien,
        gv.HoTen,
        gv.Email,
        bm.MaBoMon,
        bm.TenBoMon
      FROM GiangVien gv
      JOIN BoMon bm ON gv.MaBoMon = bm.MaBoMon
      WHERE bm.MaKhoa = ?
        AND gv.TrangThai = 'Active'
      ORDER BY gv.HoTen ASC
    `, [maKhoa]);

    return rows;
  };

  /**
   * Tạo khoa mới. MaTruongKhoa mặc định NULL (gán sau bằng assignTruongKhoa).
   */
  static create = async ({ maKhoa, tenKhoa }) => {
    // Chuẩn hóa MaKhoa: viết hoa, xóa khoảng trắng thừa
    const normalizedMaKhoa = maKhoa.trim().toUpperCase();

    // Kiểm tra trùng mã
    const [existing] = await db.query(`
      SELECT MaKhoa FROM Khoa WHERE MaKhoa = ? LIMIT 1
    `, [normalizedMaKhoa]);

    if (existing.length > 0) {
      throw new Error(`Mã khoa '${normalizedMaKhoa}' đã tồn tại.`);
    }

    await db.query(`
      INSERT INTO Khoa (MaKhoa, TenKhoa, MaTruongKhoa)
      VALUES (?, ?, NULL)
    `, [normalizedMaKhoa, tenKhoa.trim()]);

    return await this.getById(normalizedMaKhoa);
  };

  /**
   * Cập nhật TenKhoa (MaKhoa cố định, không được đổi).
   */
  static update = async (maKhoa, { tenKhoa }) => {
    const existing = await this.getById(maKhoa);
    if (!existing) {
      throw new Error(`Không tìm thấy khoa có mã '${maKhoa}'.`);
    }

    await db.query(`
      UPDATE Khoa
      SET TenKhoa = ?
      WHERE MaKhoa = ?
    `, [tenKhoa.trim(), maKhoa]);

    return await this.getById(maKhoa);
  };

  /**
   * Gán hoặc bãi nhiệm Trưởng khoa.
   * - maGiangVien = null/undefined: bãi nhiệm (set NULL).
   * - maGiangVien có giá trị: kiểm tra GV tồn tại, Active, và thuộc khoa này.
   */
  static assignTruongKhoa = async (maKhoa, maGiangVien) => {
    const existing = await this.getById(maKhoa);
    if (!existing) {
      throw new Error(`Không tìm thấy khoa có mã '${maKhoa}'.`);
    }

    // Trường hợp bãi nhiệm (truyền null)
    if (!maGiangVien) {
      await db.query(`
        UPDATE Khoa SET MaTruongKhoa = NULL WHERE MaKhoa = ?
      `, [maKhoa]);
      return await this.getById(maKhoa);
    }

    // Kiểm tra giảng viên tồn tại và đang Active
    const [gvRows] = await db.query(`
      SELECT gv.MaGiangVien, gv.HoTen, gv.TrangThai, bm.MaKhoa AS MaKhoaGV
      FROM GiangVien gv
      JOIN BoMon bm ON gv.MaBoMon = bm.MaBoMon
      WHERE gv.MaGiangVien = ?
      LIMIT 1
    `, [maGiangVien]);

    if (gvRows.length === 0) {
      throw new Error(`Không tìm thấy giảng viên có mã '${maGiangVien}'.`);
    }

    const gv = gvRows[0];

    if (gv.TrangThai !== 'Active') {
      throw new Error(`Giảng viên '${gv.HoTen}' không ở trạng thái Active, không thể phân công làm Trưởng khoa.`);
    }

    if (gv.MaKhoaGV !== maKhoa) {
      throw new Error(`Giảng viên '${gv.HoTen}' không thuộc Khoa '${maKhoa}', không thể phân công làm Trưởng khoa.`);
    }

    await db.query(`
      UPDATE Khoa SET MaTruongKhoa = ? WHERE MaKhoa = ?
    `, [maGiangVien, maKhoa]);

    return await this.getById(maKhoa);
  };

  /**
   * Xóa khoa. Chỉ cho phép xóa nếu không còn Bộ môn trực thuộc.
   */
  static delete = async (maKhoa) => {
    const existing = await this.getById(maKhoa);
    if (!existing) {
      throw new Error(`Không tìm thấy khoa có mã '${maKhoa}'.`);
    }

    // Kiểm tra ràng buộc: đếm số Bộ môn thuộc khoa này
    const [boMonCount] = await db.query(`
      SELECT COUNT(*) AS total FROM BoMon WHERE MaKhoa = ?
    `, [maKhoa]);

    if (boMonCount[0]?.total > 0) {
      throw new Error(
        `Không thể xóa Khoa '${maKhoa}' vì đang chứa ${boMonCount[0].total} bộ môn. ` +
        `Vui lòng xóa hoặc chuyển các bộ môn sang khoa khác trước.`
      );
    }

    await db.query(`
      DELETE FROM Khoa WHERE MaKhoa = ?
    `, [maKhoa]);

    return { success: true, maKhoa };
  };
}

module.exports = KhoaService;
