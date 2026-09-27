const db = require('../../config/db');

class GiangVienService {

  /**
   * 1. Lấy danh sách Giảng viên
   * Hỗ trợ lọc: maBoMon, trangThai, search (HoTen / Email / MaGiangVien)
   * LEFT JOIN BoMon → TenBoMon; LEFT JOIN Users → biết có tài khoản không
   */
  static getAll = async ({ maBoMon = '', trangThai = '', search = '' } = {}) => {
    let sql = `
      SELECT
        gv.MaGiangVien,
        gv.HoTen,
        gv.Email,
        gv.SoDienThoai,
        gv.MaBoMon,
        gv.TrangThai,
        bm.TenBoMon,
        CASE WHEN gv.UserId IS NOT NULL THEN 1 ELSE 0 END AS DaLienKetTaiKhoan
      FROM GiangVien gv
      LEFT JOIN BoMon bm ON gv.MaBoMon = bm.MaBoMon
      LEFT JOIN Users u  ON gv.UserId   = u.UserId
    `;

    const params = [];
    const conditions = [];

    // Lọc theo MaBoMon:
    //   - '' hoặc undefined → tất cả
    //   - '__NULL__'        → chỉ lấy GV chưa phân bộ môn (MaBoMon IS NULL)
    //   - giá trị thực     → lọc theo bộ môn đó
    if (maBoMon === '__NULL__') {
      conditions.push('gv.MaBoMon IS NULL');
    } else if (maBoMon && maBoMon.trim() !== '') {
      conditions.push('gv.MaBoMon = ?');
      params.push(maBoMon.trim());
    }

    if (trangThai && trangThai.trim() !== '') {
      conditions.push('gv.TrangThai = ?');
      params.push(trangThai.trim());
    }

    if (search && search.trim() !== '') {
      conditions.push('(gv.HoTen LIKE ? OR gv.Email LIKE ? OR gv.MaGiangVien LIKE ?)');
      const keyword = `%${search.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY gv.MaBoMon ASC, gv.HoTen ASC';

    const [rows] = await db.query(sql, params);
    return rows;
  };

  /**
   * Lấy thông tin cơ bản 1 Giảng viên theo MaGiangVien
   */
  static getById = async (maGiangVien) => {
    const [rows] = await db.query(`
      SELECT
        gv.MaGiangVien,
        gv.HoTen,
        gv.Email,
        gv.SoDienThoai,
        gv.MaBoMon,
        gv.TrangThai,
        gv.UserId,
        bm.TenBoMon,
        CASE WHEN gv.UserId IS NOT NULL THEN 1 ELSE 0 END AS DaLienKetTaiKhoan
      FROM GiangVien gv
      LEFT JOIN BoMon bm ON gv.MaBoMon = bm.MaBoMon
      WHERE gv.MaGiangVien = ?
      LIMIT 1
    `, [maGiangVien]);
    return rows[0] || null;
  };

  /**
   * 2. Thêm mới Giảng viên
   */
  static create = async ({ maGiangVien, hoTen, email, soDienThoai, maBoMon }) => {
    // Chuẩn hóa
    const normalizedMa = maGiangVien.trim().toUpperCase();

    // Validation 3: trùng mã
    const [existing] = await db.query(
      `SELECT MaGiangVien FROM GiangVien WHERE MaGiangVien = ? LIMIT 1`,
      [normalizedMa]
    );
    if (existing.length > 0) {
      throw new Error(`Mã giảng viên '${normalizedMa}' đã tồn tại.`);
    }

    // Validation 5: email định dạng (nếu có nhập)
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Địa chỉ email không đúng định dạng.');
      }
    }

    // Validation 5: SĐT định dạng (nếu có nhập)
    if (soDienThoai && soDienThoai.trim() !== '') {
      const sdtRegex = /^(0|\+84)[0-9]{8,10}$/;
      if (!sdtRegex.test(soDienThoai.trim())) {
        throw new Error('Số điện thoại không đúng định dạng (VD: 0912345678).');
      }
    }

    // Validation 4: MaBoMon tồn tại (nếu có chọn)
    const boMonValue = maBoMon && maBoMon.trim() !== '' ? maBoMon.trim() : null;
    if (boMonValue) {
      const [bmRows] = await db.query(
        `SELECT MaBoMon FROM BoMon WHERE MaBoMon = ? LIMIT 1`,
        [boMonValue]
      );
      if (bmRows.length === 0) {
        throw new Error(`Không tìm thấy bộ môn có mã '${boMonValue}'.`);
      }
    }

    await db.query(
      `INSERT INTO GiangVien (MaGiangVien, HoTen, Email, SoDienThoai, MaBoMon, TrangThai, UserId)
       VALUES (?, ?, ?, ?, ?, 'Active', NULL)`,
      [
        normalizedMa,
        hoTen.trim(),
        email && email.trim() !== '' ? email.trim() : null,
        soDienThoai && soDienThoai.trim() !== '' ? soDienThoai.trim() : null,
        boMonValue
      ]
    );

    return await this.getById(normalizedMa);
  };

  /**
   * 3. Cập nhật thông tin Giảng viên
   * Trả thêm cờ warnLanhDao nếu đổi MaBoMon mà GV đang là TruongBoMon/TruongKhoa
   */
  static update = async (maGiangVien, { hoTen, email, soDienThoai, maBoMon }) => {
    const existing = await this.getById(maGiangVien);
    if (!existing) {
      throw new Error(`Không tìm thấy giảng viên có mã '${maGiangVien}'.`);
    }

    // Validation email (nếu có nhập)
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Địa chỉ email không đúng định dạng.');
      }
    }

    // Validation SĐT (nếu có nhập)
    if (soDienThoai && soDienThoai.trim() !== '') {
      const sdtRegex = /^(0|\+84)[0-9]{8,10}$/;
      if (!sdtRegex.test(soDienThoai.trim())) {
        throw new Error('Số điện thoại không đúng định dạng (VD: 0912345678).');
      }
    }

    // Validation MaBoMon (nếu có chọn)
    const newBoMon = maBoMon !== undefined
      ? (maBoMon && maBoMon.trim() !== '' ? maBoMon.trim() : null)
      : existing.MaBoMon;

    if (newBoMon) {
      const [bmRows] = await db.query(
        `SELECT MaBoMon FROM BoMon WHERE MaBoMon = ? LIMIT 1`,
        [newBoMon]
      );
      if (bmRows.length === 0) {
        throw new Error(`Không tìm thấy bộ môn có mã '${newBoMon}'.`);
      }
    }

    await db.query(
      `UPDATE GiangVien SET HoTen=?, Email=?, SoDienThoai=?, MaBoMon=? WHERE MaGiangVien=?`,
      [
        hoTen.trim(),
        email && email.trim() !== '' ? email.trim() : null,
        soDienThoai && soDienThoai.trim() !== '' ? soDienThoai.trim() : null,
        newBoMon,
        maGiangVien
      ]
    );

    const updated = await this.getById(maGiangVien);

    // Cảnh báo nếu đổi MaBoMon mà GV đang là lãnh đạo
    let warnLanhDao = false;
    if (newBoMon !== existing.MaBoMon) {
      const [[bmCheck]] = await db.query(
        `SELECT COUNT(*) AS cnt FROM BoMon WHERE MaTruongBoMon = ? LIMIT 1`,
        [maGiangVien]
      );
      const [[khoaCheck]] = await db.query(
        `SELECT COUNT(*) AS cnt FROM Khoa WHERE MaTruongKhoa = ? LIMIT 1`,
        [maGiangVien]
      );
      warnLanhDao = bmCheck.cnt > 0 || khoaCheck.cnt > 0;
    }

    return { ...updated, warnLanhDao };
  };

  /**
   * 4. Đổi trạng thái Active ↔ Inactive
   */
  static toggleTrangThai = async (maGiangVien) => {
    const existing = await this.getById(maGiangVien);
    if (!existing) {
      throw new Error(`Không tìm thấy giảng viên có mã '${maGiangVien}'.`);
    }

    const newTrangThai = existing.TrangThai === 'Active' ? 'Inactive' : 'Active';

    // Cảnh báo khi chuyển sang Inactive: kiểm tra lớp học phần & buổi học sắp tới
    let warnHoatDong = null;
    if (newTrangThai === 'Inactive') {
      const [[lhpCheck]] = await db.query(
        `SELECT COUNT(*) AS cnt FROM LopHocPhan
         WHERE MaGiangVien = ? AND TrangThaiPhanCong NOT IN ('Completed', 'Cancelled')`,
        [maGiangVien]
      );
      const [[buoiCheck]] = await db.query(
        `SELECT COUNT(*) AS cnt FROM BuoiHoc
         WHERE MaGiangVien = ? AND NgayHoc >= CURDATE()`,
        [maGiangVien]
      );
      if (lhpCheck.cnt > 0 || buoiCheck.cnt > 0) {
        warnHoatDong = `Giảng viên đang có ${lhpCheck.cnt} lớp học phần chưa hoàn tất` +
          (buoiCheck.cnt > 0 ? ` và ${buoiCheck.cnt} buổi học sắp diễn ra` : '') +
          '. Xác nhận vẫn muốn ngừng công tác?';
      }
    }

    await db.query(
      `UPDATE GiangVien SET TrangThai = ? WHERE MaGiangVien = ?`,
      [newTrangThai, maGiangVien]
    );

    return { MaGiangVien: maGiangVien, TrangThai: newTrangThai, warnHoatDong };
  };

  /**
   * 5. Xem chi tiết Giảng viên (kèm các hoạt động liên quan)
   */
  static getChiTiet = async (maGiangVien) => {
    const giangVien = await this.getById(maGiangVien);
    if (!giangVien) {
      throw new Error(`Không tìm thấy giảng viên có mã '${maGiangVien}'.`);
    }

    const [
      [lopHocPhanList],
      [yeuCauNghiList],
      [dayThayList],
      [dayBuList]
    ] = await Promise.all([
      // Lớp học phần đang phụ trách
      db.query(`
        SELECT
          lhp.MaLopHocPhan,
          lhp.TenLopHocPhan,
          mh.TenMonHoc,
          hk.TenHocKy,
          lhp.LoaiHoc,
          lhp.TrangThaiPhanCong,
          lhp.NgayBatDau,
          lhp.NgayKetThuc
        FROM LopHocPhan lhp
        LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
        LEFT JOIN HocKy  hk ON lhp.MaHocKy  = hk.MaHocKy
        WHERE lhp.MaGiangVien = ?
        ORDER BY lhp.NgayBatDau DESC
      `, [maGiangVien]),

      // Lịch sử yêu cầu nghỉ
      db.query(`
        SELECT
          ycn.MaYeuCauNghi,
          ycn.LoaiYeuCau,
          ycn.LyDo,
          ycn.ThoiGianGui,
          ycn.TrangThai,
          bh.NgayHoc
        FROM YeuCauNghi ycn
        LEFT JOIN BuoiHoc bh ON ycn.MaBuoiHoc = bh.MaBuoiHoc
        WHERE ycn.MaGiangVien = ?
        ORDER BY ycn.ThoiGianGui DESC
        LIMIT 50
      `, [maGiangVien]),

      // Lịch sử dạy thay
      db.query(`
        SELECT
          pcdt.MaPhanCongDayThay,
          pcdt.ThoiGianPhanCong,
          pcdt.TrangThai,
          bh.NgayHoc,
          bh.MaLopHocPhan
        FROM PhanCongDayThay pcdt
        LEFT JOIN BuoiHoc bh ON pcdt.MaBuoiHoc = bh.MaBuoiHoc
        WHERE pcdt.MaGiangVienDayThay = ?
        ORDER BY pcdt.ThoiGianPhanCong DESC
        LIMIT 50
      `, [maGiangVien]),

      // Lịch sử đăng ký dạy bù
      db.query(`
        SELECT
          dkdb.MaDangKyDayBu,
          dkdb.ThoiGianDangKy,
          dkdb.NgayDeXuat,
          dkdb.TrangThai,
          dkdb.MaLopHocPhan
        FROM DangKyDayBu dkdb
        WHERE dkdb.MaGiangVien = ?
        ORDER BY dkdb.ThoiGianDangKy DESC
        LIMIT 50
      `, [maGiangVien])
    ]);

    return { giangVien, lopHocPhanList, yeuCauNghiList, dayThayList, dayBuList };
  };

  /**
   * 6. Xóa Giảng viên — kiểm tra tuần tự 7 bảng ràng buộc
   */
  static delete = async (maGiangVien) => {
    const existing = await this.getById(maGiangVien);
    if (!existing) {
      throw new Error(`Không tìm thấy giảng viên có mã '${maGiangVien}'.`);
    }

    // 1. Khoa.MaTruongKhoa
    const [[khoaCheck]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM Khoa WHERE MaTruongKhoa = ?`,
      [maGiangVien]
    );
    if (khoaCheck.cnt > 0) {
      throw new Error(
        `Không thể xóa: Giảng viên đang là Trưởng khoa của ${khoaCheck.cnt} khoa. ` +
        `Vui lòng gỡ phân công Trưởng khoa trước.`
      );
    }

    // 2. BoMon.MaTruongBoMon
    const [[bmCheck]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM BoMon WHERE MaTruongBoMon = ?`,
      [maGiangVien]
    );
    if (bmCheck.cnt > 0) {
      throw new Error(
        `Không thể xóa: Giảng viên đang là Trưởng bộ môn của ${bmCheck.cnt} bộ môn. ` +
        `Vui lòng gỡ phân công Trưởng bộ môn trước.`
      );
    }

    // 3. LopHocPhan.MaGiangVien
    const [[lhpCheck]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM LopHocPhan WHERE MaGiangVien = ?`,
      [maGiangVien]
    );
    if (lhpCheck.cnt > 0) {
      throw new Error(
        `Không thể xóa: Giảng viên đang phụ trách ${lhpCheck.cnt} lớp học phần. ` +
        `Vui lòng gỡ phân công lớp học phần trước.`
      );
    }

    // 4. BuoiHoc.MaGiangVien
    const [[bhCheck]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM BuoiHoc WHERE MaGiangVien = ?`,
      [maGiangVien]
    );
    if (bhCheck.cnt > 0) {
      throw new Error(
        `Không thể xóa: Giảng viên có ${bhCheck.cnt} buổi học trong lịch sử. ` +
        `Dữ liệu lịch sử không thể xóa. Hãy dùng chức năng "Ngừng công tác" thay thế.`
      );
    }

    // 5. YeuCauNghi.MaGiangVien hoặc MaGiangVienDuyet
    const [[ycnCheck]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM YeuCauNghi
       WHERE MaGiangVien = ? OR MaGiangVienDuyet = ?`,
      [maGiangVien, maGiangVien]
    );
    if (ycnCheck.cnt > 0) {
      throw new Error(
        `Không thể xóa: Giảng viên liên quan đến ${ycnCheck.cnt} yêu cầu nghỉ trong lịch sử.`
      );
    }

    // 6. PhanCongDayThay.MaGiangVienDayThay
    const [[pcdtCheck]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM PhanCongDayThay WHERE MaGiangVienDayThay = ?`,
      [maGiangVien]
    );
    if (pcdtCheck.cnt > 0) {
      throw new Error(
        `Không thể xóa: Giảng viên có ${pcdtCheck.cnt} bản ghi phân công dạy thay trong lịch sử.`
      );
    }

    // 7. DangKyDayBu.MaGiangVien
    const [[dkdbCheck]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM DangKyDayBu WHERE MaGiangVien = ?`,
      [maGiangVien]
    );
    if (dkdbCheck.cnt > 0) {
      throw new Error(
        `Không thể xóa: Giảng viên có ${dkdbCheck.cnt} bản ghi đăng ký dạy bù trong lịch sử.`
      );
    }

    await db.query(`DELETE FROM GiangVien WHERE MaGiangVien = ?`, [maGiangVien]);
    return { success: true, maGiangVien };
  };
}

module.exports = GiangVienService;
