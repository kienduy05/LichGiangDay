const db = require('../../config/db');

class TietHocService {
  /**
   * 1. Lấy danh sách tất cả tiết học, sắp xếp theo GioBatDau tăng dần.
   * Cột GioBatDau / GioKetThuc lưu dưới dạng TIME (HH:MM:SS trong MySQL),
   * ta trả về chuỗi HH:MM để frontend xử lý đơn giản.
   */
  static getAll = async () => {
    const [rows] = await db.query(`
      SELECT
        th.MaTiet,
        th.TenTiet,
        TIME_FORMAT(th.GioBatDau, '%H:%i') AS GioBatDau,
        TIME_FORMAT(th.GioKetThuc, '%H:%i') AS GioKetThuc,
        (SELECT COUNT(*) FROM ThoiKhoaBieu WHERE MaTietBatDau = th.MaTiet OR MaTietKetThuc = th.MaTiet) AS SoThoiKhoaBieu,
        (SELECT COUNT(*) FROM BuoiHoc WHERE MaTietBatDau = th.MaTiet OR MaTietKetThuc = th.MaTiet) AS SoBuoiHoc
      FROM TietHoc th
      ORDER BY th.GioBatDau ASC
    `);
    return rows;
  };

  /**
   * Lấy chi tiết 1 tiết học theo MaTiet (số nguyên).
   */
  static getById = async (maTiet) => {
    const [rows] = await db.query(`
      SELECT
        MaTiet,
        TenTiet,
        TIME_FORMAT(GioBatDau, '%H:%i') AS GioBatDau,
        TIME_FORMAT(GioKetThuc, '%H:%i') AS GioKetThuc
      FROM TietHoc
      WHERE MaTiet = ?
      LIMIT 1
    `, [maTiet]);
    return rows[0] || null;
  };

  /**
   * Đếm số bản ghi ThoiKhoaBieu + BuoiHoc đang tham chiếu tới maTiet.
   * Dùng cho cảnh báo khi sửa và chặn khi xóa.
   */
  static countUsages = async (maTiet) => {
    const [[tkb]] = await db.query(`
      SELECT COUNT(*) AS total FROM ThoiKhoaBieu
      WHERE MaTietBatDau = ? OR MaTietKetThuc = ?
    `, [maTiet, maTiet]);

    const [[bh]] = await db.query(`
      SELECT COUNT(*) AS total FROM BuoiHoc
      WHERE MaTietBatDau = ? OR MaTietKetThuc = ?
    `, [maTiet, maTiet]);

    return { soThoiKhoaBieu: tkb.total, soBuoiHoc: bh.total };
  };

  /**
   * Chuyển chuỗi "HH:MM" thành số phút từ 00:00 để so sánh.
   */
  static _toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  /**
   * Kiểm tra chồng lấn giờ với các tiết đã có.
   * Hai khoảng chỉ chồng khi: batDauMoi < ketThucCu AND ketThucMoi > batDauCu.
   * Hai ca chạm đúng mốc nhau (VD: 18:00 – 18:00) KHÔNG bị coi là chồng lấn.
   * excludeMaTiet: bỏ qua chính tiết đang sửa.
   */
  static checkOverlap = async (gioBatDau, gioKetThuc, excludeMaTiet = null) => {
    let sql = `
      SELECT MaTiet, TenTiet,
             TIME_FORMAT(GioBatDau, '%H:%i') AS GioBatDau,
             TIME_FORMAT(GioKetThuc, '%H:%i') AS GioKetThuc
      FROM TietHoc
      WHERE GioBatDau < ? AND GioKetThuc > ?
    `;
    const params = [gioKetThuc, gioBatDau];

    if (excludeMaTiet !== null) {
      sql += ` AND MaTiet != ?`;
      params.push(excludeMaTiet);
    }

    const [rows] = await db.query(sql, params);
    return rows;
  };

  /**
   * 2. Tạo mới tiết học.
   */
  static create = async ({ maTiet, tenTiet, gioBatDau, gioKetThuc }) => {
    // Validate 1: Trùng mã
    const existing = await this.getById(maTiet);
    if (existing) {
      throw new Error('Mã tiết đã tồn tại.');
    }

    // Validate 2: GioBatDau < GioKetThuc
    if (this._toMinutes(gioBatDau) >= this._toMinutes(gioKetThuc)) {
      throw new Error('Giờ bắt đầu phải nhỏ hơn giờ kết thúc.');
    }

    // Validate 3: Kiểm tra chồng lấn
    const overlaps = await this.checkOverlap(gioBatDau, gioKetThuc);
    if (overlaps.length > 0) {
      const first = overlaps[0];
      throw new Error(`Khung giờ của tiết này trùng với '${first.TenTiet}' đã tồn tại.`);
    }

    await db.query(`
      INSERT INTO TietHoc (MaTiet, TenTiet, GioBatDau, GioKetThuc)
      VALUES (?, ?, ?, ?)
    `, [maTiet, tenTiet.trim(), gioBatDau, gioKetThuc]);

    return this.getById(maTiet);
  };

  /**
   * 3. Cập nhật thông tin tiết học.
   * MaTiet khóa cứng — không cho sửa.
   * Trả về thêm usages để frontend hiển thị cảnh báo.
   */
  static update = async (maTiet, { tenTiet, gioBatDau, gioKetThuc }) => {
    const existing = await this.getById(maTiet);
    if (!existing) {
      throw new Error(`Không tìm thấy tiết học có mã '${maTiet}'.`);
    }

    // Validate GioBatDau < GioKetThuc
    if (this._toMinutes(gioBatDau) >= this._toMinutes(gioKetThuc)) {
      throw new Error('Giờ bắt đầu phải nhỏ hơn giờ kết thúc.');
    }

    // Kiểm tra chồng lấn (loại trừ chính tiết đang sửa)
    const overlaps = await this.checkOverlap(gioBatDau, gioKetThuc, maTiet);
    if (overlaps.length > 0) {
      const first = overlaps[0];
      throw new Error(`Khung giờ của tiết này trùng với '${first.TenTiet}' đã tồn tại.`);
    }

    // Đếm usages để controller trả về thông tin cảnh báo
    const usages = await this.countUsages(maTiet);

    await db.query(`
      UPDATE TietHoc
      SET TenTiet = ?, GioBatDau = ?, GioKetThuc = ?
      WHERE MaTiet = ?
    `, [tenTiet.trim(), gioBatDau, gioKetThuc, maTiet]);

    const updated = await this.getById(maTiet);
    return { ...updated, usages };
  };

  /**
   * 4. Xóa tiết học.
   * Kiểm tra tuần tự ThoiKhoaBieu → BuoiHoc, dừng khi vướng.
   */
  static delete = async (maTiet) => {
    const existing = await this.getById(maTiet);
    if (!existing) {
      throw new Error(`Không tìm thấy tiết học có mã '${maTiet}'.`);
    }

    // Bước 1: ThoiKhoaBieu
    const [[tkb]] = await db.query(`
      SELECT COUNT(*) AS total FROM ThoiKhoaBieu
      WHERE MaTietBatDau = ? OR MaTietKetThuc = ?
    `, [maTiet, maTiet]);

    if (tkb.total > 0) {
      throw new Error(
        `Không thể xóa tiết học vì đang được dùng trong ${tkb.total} giai đoạn thời khóa biểu.`
      );
    }

    // Bước 2: BuoiHoc
    const [[bh]] = await db.query(`
      SELECT COUNT(*) AS total FROM BuoiHoc
      WHERE MaTietBatDau = ? OR MaTietKetThuc = ?
    `, [maTiet, maTiet]);

    if (bh.total > 0) {
      throw new Error(
        `Không thể xóa tiết học vì đang được dùng trong ${bh.total} buổi học.`
      );
    }

    await db.query(`DELETE FROM TietHoc WHERE MaTiet = ?`, [maTiet]);
    return { success: true, maTiet };
  };
}

module.exports = TietHocService;
