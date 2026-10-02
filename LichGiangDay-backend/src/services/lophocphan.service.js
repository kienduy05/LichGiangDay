const db = require('../../config/db');

const LOAI_HOC_VALID = ['LT', 'BT', 'TH', 'BTL'];
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

// Parse số nguyên không âm. Rỗng/undefined/null -> defaultVal
const parseSoNguyen = (value, label, defaultVal = null) => {
  if (value === undefined || value === null || value === '') return defaultVal;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 0) {
    throw new Error(`${label} phải là số nguyên không âm.`);
  }
  return parsed;
};

const tinhSoTuan = (ngayBatDau, ngayKetThuc) =>
  Math.ceil((new Date(ngayKetThuc) - new Date(ngayBatDau)) / MS_PER_WEEK);

// Cột dùng chung cho getAll / getById (DATE_FORMAT tránh lệch ngày do múi giờ)
const DATE_COLS = `
        DATE_FORMAT(lhp.NgayBatDau,  '%Y-%m-%d') AS NgayBatDau,
        DATE_FORMAT(lhp.NgayKetThuc, '%Y-%m-%d') AS NgayKetThuc,
        lhp.SoTuan`;

class LopHocPhanService {

  // ================================================================
  // 1. Lọc & Hiển thị danh sách (bắt buộc maHocKy)
  // ================================================================
  static getAll = async ({
    maHocKy,
    maKhoa = '',
    maBoMon = '',
    maMonHoc = '',
    loaiHoc = '',
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
        ${DATE_COLS},
        lhp.MaBoMon,
        bm.TenBoMon,
        bm.MaKhoa,
        k.TenKhoa,
        lhp.KhoaHoc,
        ksv.TenKhoaSinhVien,
        (SELECT COUNT(*) FROM LopHocPhan_LopSinhVien x
          WHERE x.MaLopHocPhan = lhp.MaLopHocPhan) AS SoLopSinhVienGhep
      FROM LopHocPhan lhp
      LEFT JOIN MonHoc        mh  ON lhp.MaMonHoc = mh.MaMonHoc
      LEFT JOIN BoMon         bm  ON lhp.MaBoMon  = bm.MaBoMon
      LEFT JOIN Khoa          k   ON bm.MaKhoa    = k.MaKhoa
      LEFT JOIN KhoaSinhVien  ksv ON lhp.KhoaHoc  = ksv.MaKhoaSinhVien
    `;

    const params = [maHocKy.trim()];
    const conditions = ['lhp.MaHocKy = ?'];

    if (maKhoa === '__NULL__') {
      conditions.push('bm.MaKhoa IS NULL');
    } else if (maKhoa && maKhoa.trim() !== '') {
      conditions.push('bm.MaKhoa = ?');
      params.push(maKhoa.trim());
    }

    if (maBoMon === '__NULL__') {
      conditions.push('lhp.MaBoMon IS NULL');
    } else if (maBoMon && maBoMon.trim() !== '') {
      conditions.push('lhp.MaBoMon = ?');
      params.push(maBoMon.trim());
    }

    if (maMonHoc && maMonHoc.trim() !== '') {
      conditions.push('lhp.MaMonHoc = ?');
      params.push(maMonHoc.trim());
    }
    if (loaiHoc && loaiHoc.trim() !== '') {
      conditions.push('lhp.LoaiHoc = ?');
      params.push(loaiHoc.trim().toUpperCase());
    }
    if (search && search.trim() !== '') {
      conditions.push('(lhp.MaLopHocPhan LIKE ? OR mh.TenMonHoc LIKE ? OR lhp.TenLopHocPhan LIKE ?)');
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw);
    }

    sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY bm.MaKhoa ASC, lhp.MaBoMon ASC, lhp.MaMonHoc ASC, lhp.MaLopHocPhan ASC';

    const [rows] = await db.query(sql, params);
    return rows;
  };

  // ================================================================
  // Lấy thông tin 1 Lớp học phần
  // ================================================================
  static getById = async (maLopHocPhan) => {
    const [rows] = await db.query(`
      SELECT
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        lhp.MaMonHoc,
        mh.TenMonHoc,
        lhp.MaHocKy,
        hk.TenHocKy,
        hk.NamHoc,
        lhp.LoaiHoc,
        lhp.SiSoDuKien,
        lhp.SiSoDangKy,
        ${DATE_COLS},
        lhp.MaBoMon,
        bm.TenBoMon,
        lhp.KhoaHoc,
        ksv.TenKhoaSinhVien,
        lhp.MaGiangVien,
        gv.HoTen AS TenGiangVien,
        lhp.TrangThaiPhanCong
      FROM LopHocPhan lhp
      LEFT JOIN MonHoc        mh  ON lhp.MaMonHoc    = mh.MaMonHoc
      LEFT JOIN HocKy         hk  ON lhp.MaHocKy     = hk.MaHocKy
      LEFT JOIN BoMon         bm  ON lhp.MaBoMon     = bm.MaBoMon
      LEFT JOIN KhoaSinhVien  ksv ON lhp.KhoaHoc     = ksv.MaKhoaSinhVien
      LEFT JOIN GiangVien     gv  ON lhp.MaGiangVien = gv.MaGiangVien
      WHERE lhp.MaLopHocPhan = ?
      LIMIT 1
    `, [maLopHocPhan]);
    return rows[0] || null;
  };

  // ================================================================
  // 4. Xem chi tiết — trả cả lopSinhVienList để DetailView không bị thiếu
  // ================================================================
  static getChiTiet = async (maLopHocPhan) => {
    const lopHocPhan = await LopHocPhanService.getById(maLopHocPhan);
    if (!lopHocPhan) {
      throw new Error(`Không tìm thấy lớp học phần có mã '${maLopHocPhan}'.`);
    }
    const lopSinhVienList = await LopHocPhanService.getLopSinhVienGhep(maLopHocPhan);
    return { lopHocPhan, lopSinhVienList };
  };

  // ================================================================
  // 2. Thêm mới thủ công
  //    Ngày/số tuần: ưu tiên giá trị nhập, không có thì lấy theo học kỳ.
  // ================================================================
  static create = async ({
    maLopHocPhan, tenLopHocPhan, maMonHoc, maHocKy, loaiHoc,
    maBoMon, siSoDuKien, siSoDangKy, khoaHoc,
    ngayBatDau: nbdInput, ngayKetThuc: nktInput, soTuan: soTuanInput
  }) => {
    if (!maLopHocPhan || maLopHocPhan.trim() === '') {
      throw new Error('Mã lớp môn tín chỉ không được để trống.');
    }
    if (!maMonHoc || maMonHoc.trim() === '') {
      throw new Error('Mã môn học không được để trống.');
    }
    if (!maHocKy || maHocKy.trim() === '') {
      throw new Error('Vui lòng chọn Học kỳ.');
    }
    if (!maBoMon || maBoMon.trim() === '') {
      throw new Error('Vui lòng chọn Bộ môn.');
    }
    if (!loaiHoc || loaiHoc.trim() === '') {
      throw new Error('Loại học không được để trống (LT/BT/TH/BTL).');
    }
    const loaiHocVal = loaiHoc.trim().toUpperCase();
    if (!LOAI_HOC_VALID.includes(loaiHocVal)) {
      throw new Error(`Loại học '${loaiHoc}' không hợp lệ. Chỉ chấp nhận: ${LOAI_HOC_VALID.join(', ')}.`);
    }

    const maLHP = maLopHocPhan.trim();

    const [existing] = await db.query(
      `SELECT MaLopHocPhan FROM LopHocPhan WHERE MaLopHocPhan = ? LIMIT 1`,
      [maLHP]
    );
    if (existing.length > 0) {
      throw new Error(`Mã lớp học phần '${maLHP}' đã tồn tại.`);
    }

    // --- Khóa ngoại ---
    const [mhRows] = await db.query(
      `SELECT MaMonHoc FROM MonHoc WHERE MaMonHoc = ? LIMIT 1`,
      [maMonHoc.trim()]
    );
    if (mhRows.length === 0) {
      throw new Error(`Không tìm thấy môn học có mã '${maMonHoc}'.`);
    }

    const [hkRows] = await db.query(
      `SELECT MaHocKy, NgayBatDau, NgayKetThuc FROM HocKy WHERE MaHocKy = ? LIMIT 1`,
      [maHocKy.trim()]
    );
    if (hkRows.length === 0) {
      throw new Error(`Không tìm thấy học kỳ có mã '${maHocKy}'.`);
    }
    const hocKy = hkRows[0];

    const [bmRows] = await db.query(
      `SELECT MaBoMon FROM BoMon WHERE MaBoMon = ? LIMIT 1`,
      [maBoMon.trim()]
    );
    if (bmRows.length === 0) {
      throw new Error(`Không tìm thấy bộ môn có mã '${maBoMon}'.`);
    }

    const khoaHocVal = khoaHoc && String(khoaHoc).trim() !== '' ? String(khoaHoc).trim() : null;
    if (khoaHocVal) {
      const [ksvRows] = await db.query(
        `SELECT MaKhoaSinhVien FROM KhoaSinhVien WHERE MaKhoaSinhVien = ? LIMIT 1`,
        [khoaHocVal]
      );
      if (ksvRows.length === 0) {
        throw new Error(`Không tìm thấy khóa sinh viên có mã '${khoaHocVal}'.`);
      }
    }

    // --- Ngày / số tuần ---
    const ngayBatDau = nbdInput || hocKy.NgayBatDau;
    const ngayKetThuc = nktInput || hocKy.NgayKetThuc;
   
    const soTuan = parseSoNguyen(soTuanInput, 'Số tuần') || tinhSoTuan(ngayBatDau, ngayKetThuc);

    const tenLHP = tenLopHocPhan && tenLopHocPhan.trim() !== '' ? tenLopHocPhan.trim() : null;
    const siSoDuKienVal = parseSoNguyen(siSoDuKien, 'Sĩ số dự kiến', null);
    const siSoDangKyVal = parseSoNguyen(siSoDangKy, 'Sĩ số đăng ký', 0);
     if (new Date(ngayKetThuc) < new Date(ngayBatDau)) {
      throw new Error('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
    }
    await db.query(`
      INSERT INTO LopHocPhan
        (MaLopHocPhan, TenLopHocPhan, MaMonHoc, MaHocKy, LoaiHoc,
         SiSoDuKien, SiSoDangKy, MaGiangVien, NgayBatDau, NgayKetThuc,
         SoTuan, MaBoMon, KhoaHoc, TrangThaiPhanCong)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, 'Unassigned')
    `, [
      maLHP, tenLHP, maMonHoc.trim(), maHocKy.trim(), loaiHocVal,
      siSoDuKienVal, siSoDangKyVal, ngayBatDau, ngayKetThuc,
      soTuan, maBoMon.trim(), khoaHocVal
    ]);

    return await LopHocPhanService.getById(maLHP);
  };

  // ================================================================
  // 3. Cập nhật. Trường nào không gửi (undefined) thì giữ giá trị cũ.
  // ================================================================
  static update = async (maLopHocPhan, {
    tenLopHocPhan, siSoDuKien, siSoDangKy, loaiHoc, khoaHoc,
    ngayBatDau, ngayKetThuc, soTuan
  }) => {
    const existing = await LopHocPhanService.getById(maLopHocPhan);
    if (!existing) {
      throw new Error(`Không tìm thấy lớp học phần có mã '${maLopHocPhan}'.`);
    }

    if (!loaiHoc || loaiHoc.trim() === '') {
      throw new Error('Loại học không được để trống.');
    }
    const loaiHocVal = loaiHoc.trim().toUpperCase();
    if (!LOAI_HOC_VALID.includes(loaiHocVal)) {
      throw new Error(`Loại học '${loaiHoc}' không hợp lệ. Chỉ chấp nhận: ${LOAI_HOC_VALID.join(', ')}.`);
    }
if (siSoDuKien !== null && siSoDangKy !== null && siSoDangKy > siSoDuKien) {
  throw new Error(`SV đăng ký (${siSoDangKy}) lớn hơn SV dự kiến (${siSoDuKien}).`);
}

    // KhoaHoc
    let khoaHocVal = existing.KhoaHoc;
    if (khoaHoc !== undefined) {
      khoaHocVal = khoaHoc && String(khoaHoc).trim() !== '' ? String(khoaHoc).trim() : null;
      if (khoaHocVal) {
        const [ksvRows] = await db.query(
          `SELECT MaKhoaSinhVien FROM KhoaSinhVien WHERE MaKhoaSinhVien = ? LIMIT 1`,
          [khoaHocVal]
        );
        if (ksvRows.length === 0) {
          throw new Error(`Không tìm thấy khóa sinh viên có mã '${khoaHocVal}'.`);
        }
      }
    }

    const tenLHP = tenLopHocPhan !== undefined
      ? (tenLopHocPhan && tenLopHocPhan.trim() !== '' ? tenLopHocPhan.trim() : null)
      : existing.TenLopHocPhan;

    const siSoDuKienVal = siSoDuKien !== undefined
      ? parseSoNguyen(siSoDuKien, 'Sĩ số dự kiến', null)
      : existing.SiSoDuKien;
    const siSoDangKyVal = siSoDangKy !== undefined
      ? parseSoNguyen(siSoDangKy, 'Sĩ số đăng ký', 0)
      : existing.SiSoDangKy;

    const nbd = ngayBatDau || existing.NgayBatDau;
    const nkt = ngayKetThuc || existing.NgayKetThuc;
    if (new Date(nkt) < new Date(nbd)) {
      throw new Error('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
    }
    const soTuanVal = parseSoNguyen(soTuan, 'Số tuần') || tinhSoTuan(nbd, nkt);

    await db.query(`
      UPDATE LopHocPhan SET
        TenLopHocPhan = ?, SiSoDuKien = ?, SiSoDangKy = ?, LoaiHoc = ?, KhoaHoc = ?,
        NgayBatDau = ?, NgayKetThuc = ?, SoTuan = ?
      WHERE MaLopHocPhan = ?
    `, [
      tenLHP, siSoDuKienVal, siSoDangKyVal, loaiHocVal, khoaHocVal,
      nbd, nkt, soTuanVal,
      maLopHocPhan
    ]);

    return await LopHocPhanService.getById(maLopHocPhan);
  };

  // ================================================================
  // 5. Xóa Lớp học phần
  // ================================================================
  static delete = async (maLopHocPhan) => {
    const existing = await LopHocPhanService.getById(maLopHocPhan);
    if (!existing) {
      throw new Error(`Không tìm thấy lớp học phần có mã '${maLopHocPhan}'.`);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `DELETE FROM LopHocPhan_LopSinhVien WHERE MaLopHocPhan = ?`,
        [maLopHocPhan]
      );

      // Gỡ liên kết ChiTietNhap (SET NULL, không xóa lịch sử import)
      await conn.query(
        `UPDATE ChiTietNhap SET MaLopHocPhanDaTao = NULL WHERE MaLopHocPhanDaTao = ?`,
        [maLopHocPhan]
      );

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
  // 6. Import từ Excel (6 cột dữ liệu nền)
  // ================================================================
  static importFromExcel = async ({ userId, maBoMon, maHocKy, rows: excelRows }) => {
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
    const ngayBatDauHK = hocKy.NgayBatDau;
    const ngayKetThucHK = hocKy.NgayKetThuc;
    const soTuanHK = tinhSoTuan(ngayBatDauHK, ngayKetThucHK);

    // Đọc ô Excel: giữ nguyên số 0, chỉ coi '' / null / undefined là trống
    const pick = (row, ...keys) => {
      for (const k of keys) {
        const v = row[k];
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          return String(v).trim();
        }
      }
      return null;
    };
    const toInt = (s) => {
      if (s === null) return null;
      const n = parseInt(s, 10);
      return isNaN(n) || n < 0 ? NaN : n;
    };

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

        const maLopHocPhan = pick(row, 'Mã lớp môn tín chỉ', 'Lớp môn tín chỉ');
        const maMonHocGoc = pick(row, 'Mã học phần', 'Mã môn học');
        const kieuHoc = pick(row, 'Kiểu học');
        const svDuKienRaw = pick(row, 'SV dự kiến', 'Số SV DK');
        const svDangKyRaw = pick(row, 'SV đăng ký', 'Số SV ĐK');
        const khoaHocGoc = pick(row, 'Khóa');

        if (!maLopHocPhan) {
          await conn.query(`
            INSERT INTO ChiTietNhap
              (MaTepNhap, SoThuTuDong, MaMonHocGoc, TenLopHocPhanGoc, LoaiHocGoc,
               KhoaHoc, TrangThaiXuLy, GhiChuLoi)
            VALUES (?, ?, ?, ?, ?, ?, 'Skipped', 'Dòng không có Mã lớp môn tín chỉ — bỏ qua.')
          `, [maTepNhap, stt, maMonHocGoc, maLopHocPhan, kieuHoc, khoaHocGoc]);
          continue;
        }

        let ghiChuLoi = null;
        let trangThaiXuLy = 'Success';

        try {
          if (!maMonHocGoc) {
            throw new Error('Thiếu mã học phần.');
          }

          // Loại học: mặc định LT nếu trống, sai giá trị thì báo lỗi
          let loaiHocVal = 'LT';
          if (kieuHoc) {
            const upper = kieuHoc.toUpperCase();
            if (!LOAI_HOC_VALID.includes(upper)) {
              throw new Error(`Kiểu học '${kieuHoc}' không hợp lệ (chỉ nhận ${LOAI_HOC_VALID.join('/')}).`);
            }
            loaiHocVal = upper;
          }

          const svDuKien = toInt(svDuKienRaw);
          const svDangKy = toInt(svDangKyRaw);
          if (Number.isNaN(svDuKien)) throw new Error(`SV dự kiến '${svDuKienRaw}' không hợp lệ.`);
          if (Number.isNaN(svDangKy)) throw new Error(`SV đăng ký '${svDangKyRaw}' không hợp lệ.`);

          const [mhCheck] = await conn.query(
            `SELECT MaMonHoc FROM MonHoc WHERE MaMonHoc = ? LIMIT 1`,
            [maMonHocGoc]
          );
          if (mhCheck.length === 0) {
            throw new Error(`Không tìm thấy môn học '${maMonHocGoc}'. Vui lòng import Môn học trước.`);
          }

          const [lhpCheck] = await conn.query(
            `SELECT MaLopHocPhan FROM LopHocPhan WHERE MaLopHocPhan = ? LIMIT 1`,
            [maLopHocPhan]
          );

          if (lhpCheck.length > 0) {
            trangThaiXuLy = 'Skipped';
            ghiChuLoi = `Lớp '${maLopHocPhan}' đã tồn tại — bỏ qua.`;
          } else {
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

            await conn.query(`
              INSERT INTO LopHocPhan
                (MaLopHocPhan, TenLopHocPhan, MaMonHoc, MaHocKy, LoaiHoc,
                 SiSoDuKien, SiSoDangKy, MaGiangVien, NgayBatDau, NgayKetThuc,
                 SoTuan, MaBoMon, KhoaHoc, TrangThaiPhanCong)
              VALUES (?, NULL, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, 'Unassigned')
            `, [
              maLopHocPhan, maMonHocGoc, maHocKy, loaiHocVal,
              svDuKien, svDangKy ?? 0,
              ngayBatDauHK, ngayKetThucHK,
              soTuanHK, maBoMon, khoaHocVal
            ]);

            dongThanhCong++;
          }
        } catch (rowErr) {
          dongLoi++;
          trangThaiXuLy = 'Error';
          ghiChuLoi = rowErr.message;
          errors.push(`Dòng ${stt}: ${rowErr.message}`);
        }

        await conn.query(`
          INSERT INTO ChiTietNhap
            (MaTepNhap, SoThuTuDong, MaMonHocGoc, TenLopHocPhanGoc, LoaiHocGoc,
             KhoaHoc, TrangThaiXuLy, MaLopHocPhanDaTao, GhiChuLoi)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          maTepNhap, stt, maMonHocGoc, maLopHocPhan, kieuHoc,
          khoaHocGoc, trangThaiXuLy,
          trangThaiXuLy === 'Success' ? maLopHocPhan : null,
          ghiChuLoi
        ]);
      }

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
  // 7. Dữ liệu export (6 cột dữ liệu nền)
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
        lhp.LoaiHoc,
        lhp.SiSoDuKien,
        lhp.SiSoDangKy,
        lhp.KhoaHoc,
        lhp.MaBoMon,
        bm.TenBoMon
      FROM LopHocPhan lhp
      LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      LEFT JOIN BoMon  bm ON lhp.MaBoMon  = bm.MaBoMon
      WHERE lhp.MaHocKy = ?
    `;
    const params = [maHocKy.trim()];

    if (maBoMon && maBoMon.trim() !== '') {
      sql += ' AND lhp.MaBoMon = ?';
      params.push(maBoMon.trim());
    }

    sql += ' ORDER BY lhp.MaBoMon ASC, lhp.MaMonHoc ASC, lhp.MaLopHocPhan ASC';

    const [rows] = await db.query(sql, params);
    return rows;
  };

  // ================================================================
  // Các phương thức giữ cho module sau (Lớp SV ghép, Giảng viên)
  // ================================================================

  static getLopSinhVienGhep = async (maLopHocPhan) => {
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
      const [lsvRows] = await db.query(`SELECT MaLopSinhVien FROM LopSinhVien WHERE MaLopSinhVien = ? LIMIT 1`, [trimmed]);
      if (lsvRows.length === 0) { results.errors.push(`Không tìm thấy lớp sinh viên '${trimmed}'.`); continue; }
      const [existingLink] = await db.query(`SELECT MaLopHocPhan FROM LopHocPhan_LopSinhVien WHERE MaLopHocPhan = ? AND MaLopSinhVien = ? LIMIT 1`, [maLopHocPhan, trimmed]);
      if (existingLink.length > 0) { results.skipped.push(trimmed); continue; }
      await db.query(`INSERT INTO LopHocPhan_LopSinhVien (MaLopHocPhan, MaLopSinhVien) VALUES (?, ?)`, [maLopHocPhan, trimmed]);
      results.added.push(trimmed);
    }
    return results;
  };

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

  static assignGiangVien = async (maLopHocPhan, maGiangVien) => {
    const existing = await LopHocPhanService.getById(maLopHocPhan);
    if (!existing) {
      throw new Error(`Không tìm thấy lớp học phần có mã '${maLopHocPhan}'.`);
    }
    if (!maGiangVien || maGiangVien.trim() === '') {
      await db.query(`UPDATE LopHocPhan SET MaGiangVien = NULL, TrangThaiPhanCong = 'Unassigned' WHERE MaLopHocPhan = ?`, [maLopHocPhan]);
      return await LopHocPhanService.getById(maLopHocPhan);
    }
    const [gvRows] = await db.query(`SELECT MaGiangVien, HoTen, MaBoMon, TrangThai FROM GiangVien WHERE MaGiangVien = ? LIMIT 1`, [maGiangVien.trim()]);
    if (gvRows.length === 0) { throw new Error(`Không tìm thấy giảng viên có mã '${maGiangVien}'.`); }
    const gv = gvRows[0];
    if (gv.TrangThai !== 'Active') { throw new Error(`Giảng viên '${gv.HoTen}' đang có trạng thái '${gv.TrangThai}', không thể phân công.`); }
    let warnBoMonKhac = false;
    if (gv.MaBoMon && existing.MaBoMon && gv.MaBoMon !== existing.MaBoMon) { warnBoMonKhac = true; }
    await db.query(`UPDATE LopHocPhan SET MaGiangVien = ?, TrangThaiPhanCong = 'Assigned' WHERE MaLopHocPhan = ?`, [maGiangVien.trim(), maLopHocPhan]);
    const updated = await LopHocPhanService.getById(maLopHocPhan);
    return { ...updated, warnBoMonKhac };
  };

  static getSuggestedLopSinhVien = async (maLopHocPhan) => {
    const existing = await LopHocPhanService.getById(maLopHocPhan);
    if (!existing) {
      throw new Error(`Không tìm thấy lớp học phần có mã '${maLopHocPhan}'.`);
    }
    const [rows] = await db.query(`
      SELECT lsv.MaLopSinhVien, lsv.TenLopSinhVien, lsv.MaKhoa, k.TenKhoa,
        CASE WHEN lhl.MaLopHocPhan IS NOT NULL THEN 1 ELSE 0 END AS DaGhep
      FROM LopSinhVien lsv
      LEFT JOIN Khoa k ON lsv.MaKhoa = k.MaKhoa
      LEFT JOIN LopHocPhan_LopSinhVien lhl ON lsv.MaLopSinhVien = lhl.MaLopSinhVien AND lhl.MaLopHocPhan = ?
      ORDER BY lsv.MaKhoa ASC, lsv.MaLopSinhVien ASC
    `, [maLopHocPhan]);
    return rows;
  };
}

module.exports = LopHocPhanService;