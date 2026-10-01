const db = require('../../config/db');

class LopHocPhanService {

  // ================================================================
  // 1. Lấy danh sách Lớp học phần
  //    Bắt buộc: maHocKy
  //    Lọc thêm: maBoMon, maMonHoc, maGiangVien, trangThaiPhanCong, search
  // ================================================================
  static getAll = async ({
    maHocKy,
    maBoMon = '',
    maMonHoc = '',
    maGiangVien = '',
    trangThaiPhanCong = '',
    search = ''
  } = {}) => {
    if (!maHocKy || maHocKy.trim() === '') {
      throw new Error('Vui lòng chọn Học kỳ để lọc danh sách lớp học phần.');
    }

    let sql = `
      SELECT
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        lhp.MaMonHoc,
        mh.TenMonHoc,
        mh.SoTinChi,
        lhp.MaHocKy,
        lhp.LoaiHoc,
        lhp.SiSoDuKien,
        lhp.SiSoDangKy,
        lhp.MaGiangVien,
        gv.HoTen AS TenGiangVien,
        lhp.NgayBatDau,
        lhp.NgayKetThuc,
        lhp.SoTuan,
        lhp.MaBoMon,
        bm.TenBoMon,
        lhp.KhoaHoc,
        ksv.TenKhoaSinhVien,
        lhp.TrangThaiPhanCong,
        COUNT(DISTINCT lhl.MaLopSinhVien) AS SoLopSinhVienGhep
      FROM LopHocPhan lhp
      LEFT JOIN MonHoc        mh  ON lhp.MaMonHoc    = mh.MaMonHoc
      LEFT JOIN GiangVien     gv  ON lhp.MaGiangVien = gv.MaGiangVien
      LEFT JOIN BoMon         bm  ON lhp.MaBoMon     = bm.MaBoMon
      LEFT JOIN KhoaSinhVien  ksv ON lhp.KhoaHoc      = ksv.MaKhoaSinhVien
      LEFT JOIN LopHocPhan_LopSinhVien lhl ON lhp.MaLopHocPhan = lhl.MaLopHocPhan
    `;

    const params = [];
    const conditions = ['lhp.MaHocKy = ?'];
    params.push(maHocKy.trim());

    if (maBoMon && maBoMon.trim() !== '') {
      conditions.push('lhp.MaBoMon = ?');
      params.push(maBoMon.trim());
    }

    if (maMonHoc && maMonHoc.trim() !== '') {
      conditions.push('lhp.MaMonHoc = ?');
      params.push(maMonHoc.trim());
    }

    if (maGiangVien && maGiangVien.trim() !== '') {
      if (maGiangVien === '__NULL__') {
        conditions.push('lhp.MaGiangVien IS NULL');
      } else {
        conditions.push('lhp.MaGiangVien = ?');
        params.push(maGiangVien.trim());
      }
    }

    if (trangThaiPhanCong && trangThaiPhanCong.trim() !== '') {
      conditions.push('lhp.TrangThaiPhanCong = ?');
      params.push(trangThaiPhanCong.trim());
    }

    if (search && search.trim() !== '') {
      conditions.push('(lhp.MaLopHocPhan LIKE ? OR lhp.TenLopHocPhan LIKE ? OR mh.TenMonHoc LIKE ?)');
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw);
    }

    sql += ' WHERE ' + conditions.join(' AND ');

    sql += `
      GROUP BY lhp.MaLopHocPhan, lhp.TenLopHocPhan, lhp.MaMonHoc, mh.TenMonHoc, mh.SoTinChi,
               lhp.MaHocKy, lhp.LoaiHoc, lhp.SiSoDuKien, lhp.SiSoDangKy, lhp.MaGiangVien,
               gv.HoTen, lhp.NgayBatDau, lhp.NgayKetThuc, lhp.SoTuan, lhp.MaBoMon, bm.TenBoMon,
               lhp.KhoaHoc, ksv.TenKhoaSinhVien, lhp.TrangThaiPhanCong
      ORDER BY lhp.MaBoMon ASC, lhp.MaMonHoc ASC, lhp.MaLopHocPhan ASC
    `;

    const [rows] = await db.query(sql, params);
    return rows;
  };

  // ================================================================
  // Lấy thông tin 1 Lớp học phần theo MaLopHocPhan
  // ================================================================
  static getById = async (maLopHocPhan) => {
    const [rows] = await db.query(`
      SELECT
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        lhp.MaMonHoc,
        mh.TenMonHoc,
        mh.SoTinChi,
        lhp.MaHocKy,
        hk.TenHocKy,
        hk.NamHoc,
        lhp.LoaiHoc,
        lhp.SiSoDuKien,
        lhp.SiSoDangKy,
        lhp.MaGiangVien,
        gv.HoTen AS TenGiangVien,
        lhp.NgayBatDau,
        lhp.NgayKetThuc,
        lhp.SoTuan,
        lhp.MaBoMon,
        bm.TenBoMon,
        lhp.KhoaHoc,
        ksv.TenKhoaSinhVien,
        lhp.TrangThaiPhanCong
      FROM LopHocPhan lhp
      LEFT JOIN MonHoc        mh  ON lhp.MaMonHoc    = mh.MaMonHoc
      LEFT JOIN HocKy         hk  ON lhp.MaHocKy     = hk.MaHocKy
      LEFT JOIN GiangVien     gv  ON lhp.MaGiangVien = gv.MaGiangVien
      LEFT JOIN BoMon         bm  ON lhp.MaBoMon     = bm.MaBoMon
      LEFT JOIN KhoaSinhVien  ksv ON lhp.KhoaHoc      = ksv.MaKhoaSinhVien
      WHERE lhp.MaLopHocPhan = ?
      LIMIT 1
    `, [maLopHocPhan]);
    return rows[0] || null;
  };

  // ================================================================
  // 6. Xem chi tiết: thông tin cơ bản + danh sách lớp sinh viên ghép
  // ================================================================
  static getChiTiet = async (maLopHocPhan) => {
    const lopHocPhan = await LopHocPhanService.getById(maLopHocPhan);
    if (!lopHocPhan) {
      throw new Error(`Không tìm thấy lớp học phần có mã '${maLopHocPhan}'.`);
    }

    const [lopSinhVienList] = await db.query(`
      SELECT
        lsv.MaLopSinhVien,
        lsv.TenLopSinhVien,
        lsv.MaKhoa,
        k.TenKhoa
      FROM LopHocPhan_LopSinhVien lhl
      INNER JOIN LopSinhVien lsv ON lhl.MaLopSinhVien = lsv.MaLopSinhVien
      LEFT JOIN Khoa k ON lsv.MaKhoa = k.MaKhoa
      WHERE lhl.MaLopHocPhan = ?
      ORDER BY lsv.MaLopSinhVien ASC
    `, [maLopHocPhan]);

    return { lopHocPhan, lopSinhVienList };
  };

  // ================================================================
  // Helper: Validate ngày nằm trong Học kỳ
  // ================================================================
  static _validateDatesInHocKy = async (ngayBatDau, ngayKetThuc, maHocKy) => {
    const start = new Date(ngayBatDau);
    const end = new Date(ngayKetThuc);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Ngày bắt đầu hoặc ngày kết thúc không đúng định dạng.');
    }

    if (start >= end) {
      throw new Error('Ngày bắt đầu phải trước ngày kết thúc.');
    }

    const [hkRows] = await db.query(
      `SELECT MaHocKy, NgayBatDau, NgayKetThuc FROM HocKy WHERE MaHocKy = ? LIMIT 1`,
      [maHocKy]
    );
    if (hkRows.length === 0) {
      throw new Error(`Không tìm thấy học kỳ có mã '${maHocKy}'.`);
    }

    const hk = hkRows[0];
    const hkStart = new Date(hk.NgayBatDau);
    const hkEnd = new Date(hk.NgayKetThuc);

    if (start < hkStart || end > hkEnd) {
      throw new Error(
        `Khoảng ngày (${ngayBatDau} → ${ngayKetThuc}) nằm ngoài phạm vi Học kỳ '${maHocKy}' ` +
        `(${hk.NgayBatDau} → ${hk.NgayKetThuc}).`
      );
    }

    return hk;
  };

  // ================================================================
  // 2. Thêm mới thủ công
  // ================================================================
  static create = async ({
    maMonHoc, maNhom, tenLopHocPhan, maHocKy, loaiHoc,
    maBoMon, siSoDuKien, khoaHoc, ngayBatDau, ngayKetThuc, soTuan
  }) => {
    // --- Validate NOT NULL ---
    if (!maMonHoc || maMonHoc.trim() === '') {
      throw new Error('Mã môn học không được để trống.');
    }
    if (!maNhom || maNhom.trim() === '') {
      throw new Error('Mã nhóm (VD: BT1, LT01) không được để trống.');
    }
    if (!maHocKy || maHocKy.trim() === '') {
      throw new Error('Vui lòng chọn Học kỳ.');
    }
    if (!maBoMon || maBoMon.trim() === '') {
      throw new Error('Vui lòng chọn Bộ môn.');
    }

    // Whitelist loại học
    const LOAI_HOC_VALID = ['LT', 'BT', 'TH', 'BTL'];
    if (!loaiHoc || loaiHoc.trim() === '') {
      throw new Error('Loại học không được để trống (LT/BT/TH/BTL).');
    }
    const loaiHocVal = loaiHoc.trim().toUpperCase();
    if (!LOAI_HOC_VALID.includes(loaiHocVal)) {
      throw new Error(`Loại học '${loaiHoc}' không hợp lệ. Chỉ chấp nhận: ${LOAI_HOC_VALID.join(', ')}.`);
    }

    if (!ngayBatDau) throw new Error('Ngày bắt đầu không được để trống.');
    if (!ngayKetThuc) throw new Error('Ngày kết thúc không được để trống.');
    if (soTuan === undefined || soTuan === null || soTuan === '') {
      throw new Error('Số tuần không được để trống.');
    }
    const soTuanVal = parseInt(soTuan, 10);
    if (isNaN(soTuanVal) || soTuanVal <= 0) {
      throw new Error('Số tuần phải là số nguyên dương.');
    }

    // --- Sinh MaLopHocPhan ---
    const maLopHocPhan = `${maMonHoc.trim()}.${maNhom.trim()}`;

    // Check trùng mã
    const [existing] = await db.query(
      `SELECT MaLopHocPhan FROM LopHocPhan WHERE MaLopHocPhan = ? LIMIT 1`,
      [maLopHocPhan]
    );
    if (existing.length > 0) {
      throw new Error(`Mã lớp học phần '${maLopHocPhan}' đã tồn tại.`);
    }

    // --- Validate khóa ngoại ---
    // MonHoc
    const [mhRows] = await db.query(
      `SELECT MaMonHoc FROM MonHoc WHERE MaMonHoc = ? LIMIT 1`,
      [maMonHoc.trim()]
    );
    if (mhRows.length === 0) {
      throw new Error(`Không tìm thấy môn học có mã '${maMonHoc}'.`);
    }

    // HocKy (validated bên trong _validateDatesInHocKy)
    // BoMon
    const [bmRows] = await db.query(
      `SELECT MaBoMon FROM BoMon WHERE MaBoMon = ? LIMIT 1`,
      [maBoMon.trim()]
    );
    if (bmRows.length === 0) {
      throw new Error(`Không tìm thấy bộ môn có mã '${maBoMon}'.`);
    }

    // KhoaHoc (nếu có)
    const khoaHocVal = khoaHoc && khoaHoc.trim() !== '' ? khoaHoc.trim() : null;
    if (khoaHocVal) {
      const [ksvRows] = await db.query(
        `SELECT MaKhoaSinhVien FROM KhoaSinhVien WHERE MaKhoaSinhVien = ? LIMIT 1`,
        [khoaHocVal]
      );
      if (ksvRows.length === 0) {
        throw new Error(`Không tìm thấy khóa sinh viên có mã '${khoaHocVal}'.`);
      }
    }

    // --- Validate ngày nằm trong Học kỳ ---
    await LopHocPhanService._validateDatesInHocKy(ngayBatDau, ngayKetThuc, maHocKy.trim());

    // --- SiSoDuKien ---
    let siSoDuKienVal = null;
    if (siSoDuKien !== undefined && siSoDuKien !== null && siSoDuKien !== '') {
      const parsed = parseInt(siSoDuKien, 10);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error('Sĩ số dự kiến phải là số nguyên không âm.');
      }
      siSoDuKienVal = parsed;
    }

    const tenLHP = tenLopHocPhan && tenLopHocPhan.trim() !== '' ? tenLopHocPhan.trim() : null;

    // --- INSERT ---
    await db.query(`
      INSERT INTO LopHocPhan
        (MaLopHocPhan, TenLopHocPhan, MaMonHoc, MaHocKy, LoaiHoc,
         SiSoDuKien, SiSoDangKy, MaGiangVien, NgayBatDau, NgayKetThuc,
         SoTuan, MaBoMon, KhoaHoc, TrangThaiPhanCong)
      VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, 'Unassigned')
    `, [
      maLopHocPhan, tenLHP, maMonHoc.trim(), maHocKy.trim(), loaiHocVal,
      siSoDuKienVal, ngayBatDau, ngayKetThuc,
      soTuanVal, maBoMon.trim(), khoaHocVal
    ]);

    return await LopHocPhanService.getById(maLopHocPhan);
  };

  // ================================================================
  // 3. Cập nhật thông tin cơ bản
  //    MaLopHocPhan, MaMonHoc, MaHocKy khóa cứng
  // ================================================================
  static update = async (maLopHocPhan, {
    tenLopHocPhan, siSoDuKien, siSoDangKy, loaiHoc,
    maBoMon, khoaHoc, ngayBatDau, ngayKetThuc, soTuan
  }) => {
    const existing = await LopHocPhanService.getById(maLopHocPhan);
    if (!existing) {
      throw new Error(`Không tìm thấy lớp học phần có mã '${maLopHocPhan}'.`);
    }

    // LoaiHoc validate
    const LOAI_HOC_VALID = ['LT', 'BT', 'TH', 'BTL'];
    if (!loaiHoc || loaiHoc.trim() === '') {
      throw new Error('Loại học không được để trống.');
    }
    const loaiHocVal = loaiHoc.trim().toUpperCase();
    if (!LOAI_HOC_VALID.includes(loaiHocVal)) {
      throw new Error(`Loại học '${loaiHoc}' không hợp lệ. Chỉ chấp nhận: ${LOAI_HOC_VALID.join(', ')}.`);
    }

    // MaBoMon bắt buộc
    if (!maBoMon || maBoMon.trim() === '') {
      throw new Error('Bộ môn không được để trống.');
    }
    const [bmRows] = await db.query(
      `SELECT MaBoMon FROM BoMon WHERE MaBoMon = ? LIMIT 1`,
      [maBoMon.trim()]
    );
    if (bmRows.length === 0) {
      throw new Error(`Không tìm thấy bộ môn có mã '${maBoMon}'.`);
    }

    // KhoaHoc (nếu có)
    const khoaHocVal = khoaHoc && khoaHoc.trim() !== '' ? khoaHoc.trim() : null;
    if (khoaHocVal) {
      const [ksvRows] = await db.query(
        `SELECT MaKhoaSinhVien FROM KhoaSinhVien WHERE MaKhoaSinhVien = ? LIMIT 1`,
        [khoaHocVal]
      );
      if (ksvRows.length === 0) {
        throw new Error(`Không tìm thấy khóa sinh viên có mã '${khoaHocVal}'.`);
      }
    }

    // Ngày bắt buộc
    if (!ngayBatDau) throw new Error('Ngày bắt đầu không được để trống.');
    if (!ngayKetThuc) throw new Error('Ngày kết thúc không được để trống.');
    if (soTuan === undefined || soTuan === null || soTuan === '') {
      throw new Error('Số tuần không được để trống.');
    }
    const soTuanVal = parseInt(soTuan, 10);
    if (isNaN(soTuanVal) || soTuanVal <= 0) {
      throw new Error('Số tuần phải là số nguyên dương.');
    }

    // Validate ngày nằm trong Học kỳ (lấy maHocKy từ bản ghi hiện tại — khóa cứng)
    await LopHocPhanService._validateDatesInHocKy(ngayBatDau, ngayKetThuc, existing.MaHocKy);

    // SiSoDuKien
    let siSoDuKienVal = null;
    if (siSoDuKien !== undefined && siSoDuKien !== null && siSoDuKien !== '') {
      const parsed = parseInt(siSoDuKien, 10);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error('Sĩ số dự kiến phải là số nguyên không âm.');
      }
      siSoDuKienVal = parsed;
    }

    // SiSoDangKy
    let siSoDangKyVal = null;
    if (siSoDangKy !== undefined && siSoDangKy !== null && siSoDangKy !== '') {
      const parsed = parseInt(siSoDangKy, 10);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error('Sĩ số đăng ký phải là số nguyên không âm.');
      }
      siSoDangKyVal = parsed;
    }

    const tenLHP = tenLopHocPhan && tenLopHocPhan.trim() !== '' ? tenLopHocPhan.trim() : null;

    await db.query(`
      UPDATE LopHocPhan SET
        TenLopHocPhan = ?, SiSoDuKien = ?, SiSoDangKy = ?, LoaiHoc = ?,
        MaBoMon = ?, KhoaHoc = ?, NgayBatDau = ?, NgayKetThuc = ?, SoTuan = ?
      WHERE MaLopHocPhan = ?
    `, [
      tenLHP, siSoDuKienVal, siSoDangKyVal, loaiHocVal,
      maBoMon.trim(), khoaHocVal, ngayBatDau, ngayKetThuc, soTuanVal,
      maLopHocPhan
    ]);

    return await LopHocPhanService.getById(maLopHocPhan);
  };

  // ================================================================
  // 4. Gắn / Gỡ lớp sinh viên ghép
  // ================================================================
  static getLopSinhVienGhep = async (maLopHocPhan) => {
    const existing = await LopHocPhanService.getById(maLopHocPhan);
    if (!existing) {
      throw new Error(`Không tìm thấy lớp học phần có mã '${maLopHocPhan}'.`);
    }

    const [rows] = await db.query(`
      SELECT
        lsv.MaLopSinhVien,
        lsv.TenLopSinhVien,
        lsv.MaKhoa,
        k.TenKhoa
      FROM LopHocPhan_LopSinhVien lhl
      INNER JOIN LopSinhVien lsv ON lhl.MaLopSinhVien = lsv.MaLopSinhVien
      LEFT JOIN Khoa k ON lsv.MaKhoa = k.MaKhoa
      WHERE lhl.MaLopHocPhan = ?
      ORDER BY lsv.MaLopSinhVien ASC
    `, [maLopHocPhan]);

    return rows;
  };

  /**
   * Gắn lớp sinh viên vào lớp học phần
   * @param {string} maLopHocPhan
   * @param {string[]} dsLopSinhVien - mảng MaLopSinhVien
   */
  static attachLopSinhVien = async (maLopHocPhan, dsLopSinhVien) => {
    const existing = await LopHocPhanService.getById(maLopHocPhan);
    if (!existing) {
      throw new Error(`Không tìm thấy lớp học phần có mã '${maLopHocPhan}'.`);
    }

    if (!Array.isArray(dsLopSinhVien) || dsLopSinhVien.length === 0) {
      throw new Error('Danh sách lớp sinh viên cần gắn không được để trống.');
    }

    const results = { added: [], skipped: [], errors: [] };

    for (const maLSV of dsLopSinhVien) {
      const trimmed = maLSV.trim();
      // Check lớp sinh viên tồn tại
      const [lsvRows] = await db.query(
        `SELECT MaLopSinhVien FROM LopSinhVien WHERE MaLopSinhVien = ? LIMIT 1`,
        [trimmed]
      );
      if (lsvRows.length === 0) {
        results.errors.push(`Không tìm thấy lớp sinh viên '${trimmed}'.`);
        continue;
      }

      // Check đã gắn chưa
      const [existingLink] = await db.query(
        `SELECT MaLopHocPhan FROM LopHocPhan_LopSinhVien WHERE MaLopHocPhan = ? AND MaLopSinhVien = ? LIMIT 1`,
        [maLopHocPhan, trimmed]
      );
      if (existingLink.length > 0) {
        results.skipped.push(trimmed);
        continue;
      }

      await db.query(
        `INSERT INTO LopHocPhan_LopSinhVien (MaLopHocPhan, MaLopSinhVien) VALUES (?, ?)`,
        [maLopHocPhan, trimmed]
      );
      results.added.push(trimmed);
    }

    return results;
  };

  /**
   * Gỡ lớp sinh viên khỏi lớp học phần
   * @param {string} maLopHocPhan
   * @param {string[]} dsLopSinhVien - mảng MaLopSinhVien
   */
  static detachLopSinhVien = async (maLopHocPhan, dsLopSinhVien) => {
    const existing = await LopHocPhanService.getById(maLopHocPhan);
    if (!existing) {
      throw new Error(`Không tìm thấy lớp học phần có mã '${maLopHocPhan}'.`);
    }

    if (!Array.isArray(dsLopSinhVien) || dsLopSinhVien.length === 0) {
      throw new Error('Danh sách lớp sinh viên cần gỡ không được để trống.');
    }

    const placeholders = dsLopSinhVien.map(() => '?').join(', ');
    const result = await db.query(
      `DELETE FROM LopHocPhan_LopSinhVien WHERE MaLopHocPhan = ? AND MaLopSinhVien IN (${placeholders})`,
      [maLopHocPhan, ...dsLopSinhVien.map(m => m.trim())]
    );

    return { removed: result[0].affectedRows };
  };

  // ================================================================
  // 5. Phân công / Đổi / Gỡ Giảng viên
  // ================================================================
  static assignGiangVien = async (maLopHocPhan, maGiangVien) => {
    const existing = await LopHocPhanService.getById(maLopHocPhan);
    if (!existing) {
      throw new Error(`Không tìm thấy lớp học phần có mã '${maLopHocPhan}'.`);
    }

    // Nếu maGiangVien = null / '' → bỏ phân công
    if (!maGiangVien || maGiangVien.trim() === '') {
      await db.query(
        `UPDATE LopHocPhan SET MaGiangVien = NULL, TrangThaiPhanCong = 'Unassigned' WHERE MaLopHocPhan = ?`,
        [maLopHocPhan]
      );
      return await LopHocPhanService.getById(maLopHocPhan);
    }

    // Kiểm tra giảng viên tồn tại và Active
    const [gvRows] = await db.query(
      `SELECT MaGiangVien, HoTen, MaBoMon, TrangThai FROM GiangVien WHERE MaGiangVien = ? LIMIT 1`,
      [maGiangVien.trim()]
    );
    if (gvRows.length === 0) {
      throw new Error(`Không tìm thấy giảng viên có mã '${maGiangVien}'.`);
    }
    const gv = gvRows[0];
    if (gv.TrangThai !== 'Active') {
      throw new Error(`Giảng viên '${gv.HoTen}' (${maGiangVien}) đang có trạng thái '${gv.TrangThai}', không thể phân công.`);
    }

    // Cảnh báo nếu bộ môn khác (không chặn cứng, chỉ ghi chú)
    let warnBoMonKhac = false;
    if (gv.MaBoMon && existing.MaBoMon && gv.MaBoMon !== existing.MaBoMon) {
      warnBoMonKhac = true;
    }

    await db.query(
      `UPDATE LopHocPhan SET MaGiangVien = ?, TrangThaiPhanCong = 'Assigned' WHERE MaLopHocPhan = ?`,
      [maGiangVien.trim(), maLopHocPhan]
    );

    const updated = await LopHocPhanService.getById(maLopHocPhan);
    return { ...updated, warnBoMonKhac };
  };

  // ================================================================
  // 7. Xóa Lớp học phần
  // ================================================================
  static delete = async (maLopHocPhan) => {
    const existing = await LopHocPhanService.getById(maLopHocPhan);
    if (!existing) {
      throw new Error(`Không tìm thấy lớp học phần có mã '${maLopHocPhan}'.`);
    }

    // Kiểm tra ràng buộc: ThoiKhoaBieu
    const [[tkbCount]] = await db.query(
      `SELECT COUNT(*) AS total FROM ThoiKhoaBieu WHERE MaLopHocPhan = ?`,
      [maLopHocPhan]
    );
    if (tkbCount.total > 0) {
      throw new Error(
        `Không thể xóa: Lớp học phần đang có ${tkbCount.total} giai đoạn thời khóa biểu.`
      );
    }

    // Kiểm tra ràng buộc: BuoiHoc
    const [[bhCount]] = await db.query(
      `SELECT COUNT(*) AS total FROM BuoiHoc WHERE MaLopHocPhan = ?`,
      [maLopHocPhan]
    );
    if (bhCount.total > 0) {
      throw new Error(
        `Không thể xóa: Lớp học phần đang có ${bhCount.total} buổi học đã sinh.`
      );
    }

    // Kiểm tra ràng buộc: DangKyDayBu
    const [[dkdbCount]] = await db.query(
      `SELECT COUNT(*) AS total FROM DangKyDayBu WHERE MaLopHocPhan = ?`,
      [maLopHocPhan]
    );
    if (dkdbCount.total > 0) {
      throw new Error(
        `Không thể xóa: Lớp học phần đang có ${dkdbCount.total} bản ghi đăng ký dạy bù.`
      );
    }

    // Kiểm tra ràng buộc: ChiTietNhap
    const [[ctnCount]] = await db.query(
      `SELECT COUNT(*) AS total FROM ChiTietNhap WHERE MaLopHocPhanDaTao = ?`,
      [maLopHocPhan]
    );

    // Xóa trong transaction
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Xóa bảng trung gian trước
      await conn.query(
        `DELETE FROM LopHocPhan_LopSinhVien WHERE MaLopHocPhan = ?`,
        [maLopHocPhan]
      );

      // Gỡ liên kết ChiTietNhap nếu có (SET NULL thay vì xóa ChiTietNhap)
      if (ctnCount.total > 0) {
        await conn.query(
          `UPDATE ChiTietNhap SET MaLopHocPhanDaTao = NULL WHERE MaLopHocPhanDaTao = ?`,
          [maLopHocPhan]
        );
      }

      // Xóa LopHocPhan
      await conn.query(
        `DELETE FROM LopHocPhan WHERE MaLopHocPhan = ?`,
        [maLopHocPhan]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return { success: true, maLopHocPhan };
  };

  // ================================================================
  // 8. Import từ Excel (chỉ dữ liệu nền)
  //    Luồng: TepNhap + ChiTietNhap
  // ================================================================
  static importFromExcel = async ({ userId, maBoMon, maHocKy, rows: excelRows }) => {
    // --- Validate bộ môn + học kỳ ---
    const [bmRows] = await db.query(
      `SELECT MaBoMon FROM BoMon WHERE MaBoMon = ? LIMIT 1`,
      [maBoMon]
    );
    if (bmRows.length === 0) {
      throw new Error(`Không tìm thấy bộ môn có mã '${maBoMon}'.`);
    }

    const [hkRows] = await db.query(
      `SELECT MaHocKy, NgayBatDau, NgayKetThuc FROM HocKy WHERE MaHocKy = ? LIMIT 1`,
      [maHocKy]
    );
    if (hkRows.length === 0) {
      throw new Error(`Không tìm thấy học kỳ có mã '${maHocKy}'.`);
    }
    const hocKy = hkRows[0];

    // Ngày placeholder = khoảng ngày của Học kỳ
    const ngayBatDauPlaceholder = hocKy.NgayBatDau;
    const ngayKetThucPlaceholder = hocKy.NgayKetThuc;
    // Tính số tuần placeholder
    const diffMs = new Date(ngayKetThucPlaceholder) - new Date(ngayBatDauPlaceholder);
    const soTuanPlaceholder = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));

    // --- Tạo TepNhap ---
    const maTepNhap = `IMP${Date.now()}`;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(`
        INSERT INTO TepNhap (MaTepNhap, TenTepGoc, UserId, MaBoMon, MaHocKy, ThoiGianNhap, TrangThai, TongSoDong)
        VALUES (?, ?, ?, ?, ?, NOW(), 'Processing', ?)
      `, [maTepNhap, 'excel_import', userId, maBoMon, maHocKy, excelRows.length]);

      let dongThanhCong = 0;
      let dongLoi = 0;
      const errors = [];

      for (let i = 0; i < excelRows.length; i++) {
        const row = excelRows[i];
        const stt = i + 1;

        const maMonHocGoc = row['Mã học phần'] ? String(row['Mã học phần']).trim() : null;
        const soTC = row['Số TC'] ? String(row['Số TC']).trim() : null;
        const tenLopGoc = row['Lớp môn tín chỉ'] ? String(row['Lớp môn tín chỉ']).trim() : null;
        const soSVDK = row['Số SV DK'] ? parseInt(String(row['Số SV DK']).trim(), 10) : null;
        const soSVDangKy = row['Số SV ĐK'] ? parseInt(String(row['Số SV ĐK']).trim(), 10) : null;
        const kieuHoc = row['Kiểu học'] ? String(row['Kiểu học']).trim() : null;
        const tenGiangVien = row['Giảng viên'] ? String(row['Giảng viên']).trim() : null;
        const khoaHocGoc = row['Khóa'] ? String(row['Khóa']).trim() : null;
        const tenLopGhep = row['Tên các lớp ghép'] ? String(row['Tên các lớp ghép']).trim() : null;

        // Lưu dữ liệu lịch gốc vào ChiTietNhap (giữ nguyên, không xử lý)
        const khoangThoiGianGoc = row['Thời gian'] ? String(row['Thời gian']).trim() : null;
        const soTuanGoc = row['Số tuần'] ? parseInt(String(row['Số tuần']).trim(), 10) : null;

        // Thu thập dữ liệu lịch học hàng tuần (Thứ 2 → CN)
        const lichHocObj = {};
        const thuNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
        for (const thu of thuNames) {
          const tietKey = `${thu} - Tiết học`;
          const phongKey = `${thu} - Phòng học`;
          const tiet = row[tietKey] ? String(row[tietKey]).trim() : null;
          const phong = row[phongKey] ? String(row[phongKey]).trim() : null;
          if (tiet || phong) {
            lichHocObj[thu] = { tiet, phong };
          }
        }
        const lichHocHangTuanGoc = Object.keys(lichHocObj).length > 0 ? JSON.stringify(lichHocObj) : null;

        // Quy tắc: nếu "Lớp môn tín chỉ" trống → bỏ qua dòng
        if (!tenLopGoc || tenLopGoc === '') {
          // Vẫn lưu ChiTietNhap nhưng đánh dấu Skipped
          await conn.query(`
            INSERT INTO ChiTietNhap
              (MaTepNhap, SoThuTuDong, MaMonHocGoc, TenLopHocPhanGoc, LoaiHocGoc,
               TenGiangVienGoc, KhoangThoiGianGoc, SoTuanGoc, LichHocHangTuanGoc,
               TenLopGhepGoc, KhoaHoc, TrangThaiXuLy, GhiChuLoi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Skipped', 'Dòng không có Lớp môn tín chỉ — bỏ qua.')
          `, [maTepNhap, stt, maMonHocGoc, tenLopGoc, kieuHoc,
              tenGiangVien, khoangThoiGianGoc, soTuanGoc, lichHocHangTuanGoc,
              tenLopGhep, khoaHocGoc]);
          continue;
        }

        // Xác định MaLopHocPhan = tenLopGoc (vì đó là tên lớp môn tín chỉ, VD: "QT01.LT1")
        const maLopHocPhan = tenLopGoc;

        // Xử lý loại học
        let loaiHocVal = 'LT'; // mặc định
        if (kieuHoc) {
          const upper = kieuHoc.toUpperCase();
          if (['LT', 'BT', 'TH', 'BTL'].includes(upper)) {
            loaiHocVal = upper;
          } else {
            loaiHocVal = upper.substring(0, 3);
          }
        }

        let ghiChuLoi = null;
        let trangThaiXuLy = 'Success';

        try {
          // Check MaMonHoc tồn tại
          if (!maMonHocGoc) {
            throw new Error('Thiếu mã học phần.');
          }
          const [mhCheck] = await conn.query(
            `SELECT MaMonHoc FROM MonHoc WHERE MaMonHoc = ? LIMIT 1`,
            [maMonHocGoc]
          );
          if (mhCheck.length === 0) {
            throw new Error(`Không tìm thấy môn học '${maMonHocGoc}'.`);
          }

          // Check trùng MaLopHocPhan
          const [lhpCheck] = await conn.query(
            `SELECT MaLopHocPhan FROM LopHocPhan WHERE MaLopHocPhan = ? LIMIT 1`,
            [maLopHocPhan]
          );

          if (lhpCheck.length > 0) {
            // Đã tồn tại → cập nhật SiSoDuKien, SiSoDangKy nếu cần, không tạo mới
            trangThaiXuLy = 'Skipped';
            ghiChuLoi = `Lớp '${maLopHocPhan}' đã tồn tại — bỏ qua.`;
          } else {
            // Tìm giảng viên theo tên (nếu có)
            let maGiangVien = null;
            let trangThaiPhanCong = 'Unassigned';
            if (tenGiangVien && tenGiangVien !== '') {
              const [gvSearch] = await conn.query(
                `SELECT MaGiangVien FROM GiangVien WHERE HoTen = ? AND TrangThai = 'Active' LIMIT 1`,
                [tenGiangVien]
              );
              if (gvSearch.length > 0) {
                maGiangVien = gvSearch[0].MaGiangVien;
                trangThaiPhanCong = 'Assigned';
              } else {
                ghiChuLoi = `Không tìm thấy giảng viên '${tenGiangVien}' (Active) — để Unassigned.`;
              }
            }

            // KhoaHoc → validate
            let khoaHocVal = null;
            if (khoaHocGoc) {
              const khoaKey = khoaHocGoc.startsWith('K') ? khoaHocGoc : `K${khoaHocGoc}`;
              const [ksvCheck] = await conn.query(
                `SELECT MaKhoaSinhVien FROM KhoaSinhVien WHERE MaKhoaSinhVien = ? LIMIT 1`,
                [khoaKey]
              );
              if (ksvCheck.length > 0) {
                khoaHocVal = khoaKey;
              }
            }

            // Tạo LopHocPhan
            await conn.query(`
              INSERT INTO LopHocPhan
                (MaLopHocPhan, TenLopHocPhan, MaMonHoc, MaHocKy, LoaiHoc,
                 SiSoDuKien, SiSoDangKy, MaGiangVien, NgayBatDau, NgayKetThuc,
                 SoTuan, MaBoMon, KhoaHoc, TrangThaiPhanCong)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              maLopHocPhan, tenLopGoc, maMonHocGoc, maHocKy, loaiHocVal,
              isNaN(soSVDK) ? null : soSVDK,
              isNaN(soSVDangKy) ? null : soSVDangKy,
              maGiangVien, ngayBatDauPlaceholder, ngayKetThucPlaceholder,
              soTuanPlaceholder, maBoMon, khoaHocVal, trangThaiPhanCong
            ]);

            // Xử lý lớp ghép
            if (tenLopGhep && tenLopGhep !== '') {
              const lopGhepArr = tenLopGhep.split(',').map(s => s.trim()).filter(s => s !== '');
              for (const tenLSV of lopGhepArr) {
                // Tìm LopSinhVien theo tên hoặc mã
                const [lsvCheck] = await conn.query(
                  `SELECT MaLopSinhVien FROM LopSinhVien WHERE MaLopSinhVien = ? OR TenLopSinhVien = ? LIMIT 1`,
                  [tenLSV, tenLSV]
                );
                if (lsvCheck.length > 0) {
                  // Check đã gắn chưa
                  const [linkCheck] = await conn.query(
                    `SELECT 1 FROM LopHocPhan_LopSinhVien WHERE MaLopHocPhan = ? AND MaLopSinhVien = ? LIMIT 1`,
                    [maLopHocPhan, lsvCheck[0].MaLopSinhVien]
                  );
                  if (linkCheck.length === 0) {
                    await conn.query(
                      `INSERT INTO LopHocPhan_LopSinhVien (MaLopHocPhan, MaLopSinhVien) VALUES (?, ?)`,
                      [maLopHocPhan, lsvCheck[0].MaLopSinhVien]
                    );
                  }
                }
              }
            }

            dongThanhCong++;
          }
        } catch (rowErr) {
          dongLoi++;
          trangThaiXuLy = 'Error';
          ghiChuLoi = rowErr.message;
          errors.push(`Dòng ${stt}: ${rowErr.message}`);
        }

        // Lưu ChiTietNhap
        await conn.query(`
          INSERT INTO ChiTietNhap
            (MaTepNhap, SoThuTuDong, MaMonHocGoc, TenLopHocPhanGoc, LoaiHocGoc,
             TenGiangVienGoc, KhoangThoiGianGoc, SoTuanGoc, LichHocHangTuanGoc,
             TenLopGhepGoc, KhoaHoc, TrangThaiXuLy, MaLopHocPhanDaTao, GhiChuLoi)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          maTepNhap, stt, maMonHocGoc, tenLopGoc, kieuHoc,
          tenGiangVien, khoangThoiGianGoc, soTuanGoc, lichHocHangTuanGoc,
          tenLopGhep, khoaHocGoc, trangThaiXuLy,
          trangThaiXuLy === 'Success' ? maLopHocPhan : null,
          ghiChuLoi
        ]);
      }

      // Cập nhật TepNhap
      const trangThaiTep = dongLoi > 0 ? 'CompletedWithErrors' : 'Completed';
      await conn.query(`
        UPDATE TepNhap SET
          TrangThai = ?, SoDongThanhCong = ?, SoDongLoi = ?,
          ThongTinLoi = ?
        WHERE MaTepNhap = ?
      `, [trangThaiTep, dongThanhCong, dongLoi,
          errors.length > 0 ? JSON.stringify(errors) : null,
          maTepNhap]);

      await conn.commit();

      return {
        maTepNhap,
        tongSoDong: excelRows.length,
        dongThanhCong,
        dongLoi,
        trangThai: trangThaiTep,
        errors
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  };

  // ================================================================
  // 9. Export ra Excel (chỉ dữ liệu nền)
  // ================================================================
  static getExportData = async ({ maHocKy, maBoMon = '' }) => {
    if (!maHocKy || maHocKy.trim() === '') {
      throw new Error('Vui lòng chọn Học kỳ để xuất dữ liệu.');
    }

    let sql = `
      SELECT
        lhp.MaLopHocPhan,
        lhp.MaMonHoc,
        mh.TenMonHoc,
        mh.SoTinChi,
        lhp.TenLopHocPhan,
        lhp.LoaiHoc,
        lhp.SiSoDuKien,
        lhp.SiSoDangKy,
        gv.HoTen AS TenGiangVien,
        lhp.KhoaHoc,
        lhp.MaBoMon,
        bm.TenBoMon,
        lhp.TrangThaiPhanCong
      FROM LopHocPhan lhp
      LEFT JOIN MonHoc    mh ON lhp.MaMonHoc    = mh.MaMonHoc
      LEFT JOIN GiangVien gv ON lhp.MaGiangVien = gv.MaGiangVien
      LEFT JOIN BoMon     bm ON lhp.MaBoMon     = bm.MaBoMon
      WHERE lhp.MaHocKy = ?
    `;
    const params = [maHocKy.trim()];

    if (maBoMon && maBoMon.trim() !== '') {
      sql += ' AND lhp.MaBoMon = ?';
      params.push(maBoMon.trim());
    }

    sql += ' ORDER BY lhp.MaBoMon ASC, lhp.MaMonHoc ASC, lhp.MaLopHocPhan ASC';

    const [rows] = await db.query(sql, params);

    // Bổ sung danh sách lớp ghép cho mỗi LHP
    for (const row of rows) {
      const [lsvList] = await db.query(`
        SELECT lsv.MaLopSinhVien, lsv.TenLopSinhVien
        FROM LopHocPhan_LopSinhVien lhl
        INNER JOIN LopSinhVien lsv ON lhl.MaLopSinhVien = lsv.MaLopSinhVien
        WHERE lhl.MaLopHocPhan = ?
        ORDER BY lsv.MaLopSinhVien ASC
      `, [row.MaLopHocPhan]);
      row.TenCacLopGhep = lsvList.map(l => l.TenLopSinhVien).join(', ');
    }

    return rows;
  };

  // ================================================================
  // Lấy danh sách LopSinhVien gợi ý (theo KhoaHoc của LHP)
  // ================================================================
  static getSuggestedLopSinhVien = async (maLopHocPhan) => {
    const existing = await LopHocPhanService.getById(maLopHocPhan);
    if (!existing) {
      throw new Error(`Không tìm thấy lớp học phần có mã '${maLopHocPhan}'.`);
    }

    // Lấy tất cả lớp sinh viên, ưu tiên hiển thị lớp cùng khoa trước
    let sql = `
      SELECT
        lsv.MaLopSinhVien,
        lsv.TenLopSinhVien,
        lsv.MaKhoa,
        k.TenKhoa,
        CASE WHEN lhl.MaLopHocPhan IS NOT NULL THEN 1 ELSE 0 END AS DaGhep
      FROM LopSinhVien lsv
      LEFT JOIN Khoa k ON lsv.MaKhoa = k.MaKhoa
      LEFT JOIN LopHocPhan_LopSinhVien lhl
        ON lsv.MaLopSinhVien = lhl.MaLopSinhVien AND lhl.MaLopHocPhan = ?
      ORDER BY lsv.MaKhoa ASC, lsv.MaLopSinhVien ASC
    `;

    const [rows] = await db.query(sql, [maLopHocPhan]);
    return rows;
  };
}

module.exports = LopHocPhanService;
