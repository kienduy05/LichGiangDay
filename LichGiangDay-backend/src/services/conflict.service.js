const db = require('../../config/db');

/**
 * Service kiểm tra xung đột thời khóa biểu và lịch giảng dạy dùng chung
 * Quy tắc giao khoảng: hai buổi trùng khi cùng ngày và khoảng thời gian giao nhau:
 * (GioBatDau1 < GioKetThuc2 AND GioBatDau2 < GioKetThuc1)
 */
class ConflictService {

  /**
   * Lấy thông tin tiết học theo MaTiet
   */
  static getTietHocInfo = async (maTiet, connection = db) => {
    const [rows] = await connection.query(
      'SELECT MaTiet, TenTiet, GioBatDau, GioKetThuc FROM TietHoc WHERE MaTiet = ? LIMIT 1',
      [maTiet]
    );
    return rows[0] || null;
  };

  /**
   * Kiểm tra giao khoảng thời gian thuần túy (dành cho unit test / so sánh logic)
   */
  static isTimeOverlap = (start1, end1, start2, end2) => {
    // start1 < end2 && start2 < end1
    return start1 < end2 && start2 < end1;
  };

  /**
   * Kiểm tra giao khoảng ngày hiệu lực (start_date1 <= end_date2 AND start_date2 <= end_date1)
   */
  static isDateRangeOverlap = (startDate1, endDate1, startDate2, endDate2) => {
    const s1 = new Date(startDate1);
    const e1 = new Date(endDate1);
    const s2 = new Date(startDate2);
    const e2 = new Date(endDate2);
    return s1 <= e2 && s2 <= e1;
  };

  /**
   * Kiểm tra xung đột toàn diện cho một buổi học dự kiến
   * @param {Object} params
   * @param {string} [params.maBuoiHocHienTai] - Mã buổi học hiện tại (bỏ qua khi kiểm tra trùng chính nó)
   * @param {string} params.maLopHocPhan - Mã lớp học phần
   * @param {string} params.ngayHoc - Ngày học (YYYY-MM-DD)
   * @param {number} params.maTiet - Mã tiết học
   * @param {string} params.maPhong - Mã phòng học
   * @param {string} params.maGiangVien - Mã giảng viên
   * @param {Object} [connection] - MySQL connection (dành cho transaction)
   * @returns {Promise<{ok: boolean, conflicts: Array<{type: string, message: string}>}>}
   */
  static checkConflict = async ({
    maBuoiHocHienTai = null,
    maLopHocPhan,
    ngayHoc,
    maTiet,
    maPhong,
    maGiangVien
  }, connection = db) => {
    const conflicts = [];

    // 1. Lấy thông tin tiết học dự kiến
    const tietDuKien = await this.getTietHocInfo(maTiet, connection);
    if (!tietDuKien) {
      conflicts.push({
        type: 'INVALID_DATA',
        message: `Tiết học mã '${maTiet}' không tồn tại trong hệ thống.`
      });
      return { ok: false, conflicts };
    }

    // 2. Lấy thông tin lớp học phần (Sĩ số, Loại học, Tên lớp)
    let lhpInfo = null;
    if (maLopHocPhan) {
      const [lhpRows] = await connection.query(
        `SELECT lhp.MaLopHocPhan, lhp.TenLopHocPhan, lhp.LoaiHoc, 
                COALESCE(lhp.SiSoDangKy, lhp.SiSoDuKien, 0) AS SiSo,
                mh.TenMonHoc
         FROM LopHocPhan lhp
         LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
         WHERE lhp.MaLopHocPhan = ? LIMIT 1`,
        [maLopHocPhan]
      );
      lhpInfo = lhpRows[0] || null;
    }

    // 3. Kiểm tra thông tin & trạng thái PHÒNG HỌC
    if (maPhong) {
      const [phongRows] = await connection.query(
        'SELECT MaPhong, TenPhong, SucChua, LoaiPhong, TrangThai FROM PhongHoc WHERE MaPhong = ? LIMIT 1',
        [maPhong]
      );
      const phongInfo = phongRows[0];

      if (!phongInfo) {
        conflicts.push({
          type: 'ROOM',
          message: `Phòng học '${maPhong}' không tồn tại.`
        });
      } else {
        // 3.1. Trạng thái phòng
        if (phongInfo.TrangThai !== 'Ready') {
          conflicts.push({
            type: 'ROOM_STATUS',
            message: `Phòng học '${phongInfo.TenPhong || maPhong}' không ở trạng thái sẵn sàng (Hiện tại: ${phongInfo.TrangThai}).`
          });
        }

        // 3.2. Sức chứa phòng
        if (lhpInfo && phongInfo.SucChua && lhpInfo.SiSo > phongInfo.SucChua) {
          conflicts.push({
            type: 'CAPACITY',
            message: `Sức chứa phòng '${phongInfo.TenPhong}' (${phongInfo.SucChua} chỗ) không đủ cho sĩ số lớp (${lhpInfo.SiSo} sinh viên).`
          });
        }

        // 3.3. Loại phòng phù hợp loại học
        if (lhpInfo && phongInfo.LoaiPhong && lhpInfo.LoaiHoc) {
          const lhpType = lhpInfo.LoaiHoc.toLowerCase();
          const roomType = phongInfo.LoaiPhong.toLowerCase();
          if ((lhpType === 'th' || lhpType === 'thuchanh') && !roomType.includes('thuc') && !roomType.includes('lab')) {
            conflicts.push({
              type: 'ROOM_TYPE',
              message: `Lớp thực hành cần phòng thực hành/LAB, nhưng phòng '${phongInfo.TenPhong}' là phòng '${phongInfo.LoaiPhong}'.`
            });
          }
        }

        // 3.4. Trùng lịch phòng (so theo giao khoảng tiết học trên cùng ngày)
        // Bỏ qua các buổi có TrangThai IN ('Absent', 'Swapped', 'Cancelled')
        let roomQuery = `
          SELECT bh.MaBuoiHoc, bh.MaLopHocPhan, bh.NgayHoc, bh.MaTiet, bh.MaPhong,
                 th.TenTiet, th.GioBatDau, th.GioKetThuc, lhp.TenLopHocPhan, gv.HoTen AS TenGiangVien
          FROM BuoiHoc bh
          JOIN TietHoc th ON bh.MaTiet = th.MaTiet
          LEFT JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
          LEFT JOIN GiangVien gv ON bh.MaGiangVien = gv.MaGiangVien
          WHERE bh.MaPhong = ?
            AND bh.NgayHoc = ?
            AND bh.TrangThai NOT IN ('Absent', 'Swapped', 'Cancelled')
            AND (th.GioBatDau < ? AND ? < th.GioKetThuc)
        `;
        const roomParams = [maPhong, ngayHoc, tietDuKien.GioKetThuc, tietDuKien.GioBatDau];

        if (maBuoiHocHienTai) {
          roomQuery += ' AND bh.MaBuoiHoc != ?';
          roomParams.push(maBuoiHocHienTai);
        }

        const [roomClashes] = await connection.query(roomQuery, roomParams);
        if (roomClashes.length > 0) {
          const clash = roomClashes[0];
          conflicts.push({
            type: 'ROOM',
            message: `Phòng '${maPhong}' đã có lớp '${clash.TenLopHocPhan || clash.MaLopHocPhan}' do GV '${clash.TenGiangVien || 'chưa gán'}' giảng dạy vào ${clash.TenTiet} (${clash.GioBatDau} - ${clash.GioKetThuc}).`
          });
        }
      }
    }

    // 4. Kiểm tra GIẢNG VIÊN
    if (maGiangVien) {
      // 4.1. Trạng thái giảng viên
      const [gvRows] = await connection.query(
        'SELECT MaGiangVien, HoTen, TrangThai, MaBoMon FROM GiangVien WHERE MaGiangVien = ? LIMIT 1',
        [maGiangVien]
      );
      const gvInfo = gvRows[0];
      if (!gvInfo) {
        conflicts.push({
          type: 'LECTURER',
          message: `Giảng viên '${maGiangVien}' không tồn tại.`
        });
      } else if (gvInfo.TrangThai !== 'Active') {
        conflicts.push({
          type: 'LECTURER',
          message: `Giảng viên '${gvInfo.HoTen}' hiện không ở trạng thái hoạt động (Trạng thái: ${gvInfo.TrangThai}).`
        });
      } else {
        // 4.2. Trùng lịch giảng viên
        let gvQuery = `
          SELECT bh.MaBuoiHoc, bh.MaLopHocPhan, bh.NgayHoc, bh.MaTiet, bh.MaPhong,
                 th.TenTiet, th.GioBatDau, th.GioKetThuc, lhp.TenLopHocPhan
          FROM BuoiHoc bh
          JOIN TietHoc th ON bh.MaTiet = th.MaTiet
          LEFT JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
          WHERE bh.MaGiangVien = ?
            AND bh.NgayHoc = ?
            AND bh.TrangThai NOT IN ('Absent', 'Swapped', 'Cancelled')
            AND (th.GioBatDau < ? AND ? < th.GioKetThuc)
        `;
        const gvParams = [maGiangVien, ngayHoc, tietDuKien.GioKetThuc, tietDuKien.GioBatDau];

        if (maBuoiHocHienTai) {
          gvQuery += ' AND bh.MaBuoiHoc != ?';
          gvParams.push(maBuoiHocHienTai);
        }

        const [gvClashes] = await connection.query(gvQuery, gvParams);
        if (gvClashes.length > 0) {
          const clash = gvClashes[0];
          conflicts.push({
            type: 'LECTURER',
            message: `Giảng viên '${gvInfo.HoTen}' đã có lịch dạy lớp '${clash.TenLopHocPhan || clash.MaLopHocPhan}' tại phòng '${clash.MaPhong}' vào ${clash.TenTiet} (${clash.GioBatDau} - ${clash.GioKetThuc}).`
          });
        }
      }
    }

    // 5. Kiểm tra LỚP SINH VIÊN (Kể cả lớp ghép)
    if (maLopHocPhan) {
      let svClassQuery = `
        SELECT DISTINCT lhp2.TenLopHocPhan, lhp2.MaLopHocPhan, th.TenTiet, th.GioBatDau, th.GioKetThuc, lsv.MaLopSinhVien
        FROM LopHocPhan_LopSinhVien map1
        JOIN LopHocPhan_LopSinhVien map2 ON map1.MaLopSinhVien = map2.MaLopSinhVien
        JOIN BuoiHoc bh2 ON map2.MaLopHocPhan = bh2.MaLopHocPhan
        JOIN TietHoc th ON bh2.MaTiet = th.MaTiet
        JOIN LopHocPhan lhp2 ON bh2.MaLopHocPhan = lhp2.MaLopHocPhan
        JOIN LopSinhVien lsv ON map1.MaLopSinhVien = lsv.MaLopSinhVien
        WHERE map1.MaLopHocPhan = ?
          AND map2.MaLopHocPhan != ?
          AND bh2.NgayHoc = ?
          AND bh2.TrangThai NOT IN ('Absent', 'Swapped', 'Cancelled')
          AND (th.GioBatDau < ? AND ? < th.GioKetThuc)
      `;
      const svParams = [maLopHocPhan, maLopHocPhan, ngayHoc, tietDuKien.GioKetThuc, tietDuKien.GioBatDau];

      if (maBuoiHocHienTai) {
        svClassQuery += ' AND bh2.MaBuoiHoc != ?';
        svParams.push(maBuoiHocHienTai);
      }

      const [svClashes] = await connection.query(svClassQuery, svParams);
      if (svClashes.length > 0) {
        const clash = svClashes[0];
        conflicts.push({
          type: 'STUDENT_CLASS',
          message: `Lớp sinh viên '${clash.MaLopSinhVien}' bị trùng lịch học lớp '${clash.TenLopHocPhan}' vào ${clash.TenTiet} (${clash.GioBatDau} - ${clash.GioKetThuc}).`
        });
      }
    }

    return {
      ok: conflicts.length === 0,
      conflicts
    };
  };

  /**
   * Tìm danh sách phòng trống trong N ngày (mặc định 7 ngày kể từ tuNgay)
   * Thỏa mãn: Sức chứa >= sĩ số, TrangThai = 'Ready', không bị chiếm vào (ngayHoc, maTiet)
   */
  static findAvailableRooms = async ({
    maLopHocPhan,
    tuNgay,
    soNgay = 7,
    maTiet = null,
    connection = db
  }) => {
    // 1. Sĩ số lớp
    let siSo = 0;
    let loaiHoc = 'LyThuyet';
    if (maLopHocPhan) {
      const [lhpRows] = await connection.query(
        'SELECT COALESCE(SiSoDangKy, SiSoDuKien, 0) AS SiSo, LoaiHoc FROM LopHocPhan WHERE MaLopHocPhan = ? LIMIT 1',
        [maLopHocPhan]
      );
      if (lhpRows.length > 0) {
        siSo = lhpRows[0].SiSo;
        loaiHoc = lhpRows[0].LoaiHoc;
      }
    }

    // 2. Danh sách ngày từ tuNgay
    const startDate = new Date(tuNgay);
    const dates = [];
    for (let i = 0; i < soNgay; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    // 3. Lấy tất cả phòng Ready có sức chứa đủ
    const [allRooms] = await connection.query(`
      SELECT p.MaPhong, p.TenPhong, p.MaToaNha, p.SucChua, p.LoaiPhong, p.TrangThai, tn.TenToaNha
      FROM PhongHoc p
      LEFT JOIN ToaNha tn ON p.MaToaNha = tn.MaToaNha
      WHERE p.TrangThai = 'Ready' AND p.SucChua >= ?
      ORDER BY p.SucChua ASC, p.MaPhong ASC
    `, [siSo]);

    // 4. Lấy tất cả tiết học (hoặc tiết chỉ định)
    let tietQuery = 'SELECT MaTiet, TenTiet, GioBatDau, GioKetThuc FROM TietHoc';
    const tietParams = [];
    if (maTiet) {
      tietQuery += ' WHERE MaTiet = ?';
      tietParams.push(maTiet);
    }
    tietQuery += ' ORDER BY MaTiet ASC';
    const [allTiets] = await connection.query(tietQuery, tietParams);

    // 5. Lấy các buổi học đang chiếm phòng trong khoảng ngày
    const [occupied] = await connection.query(`
      SELECT bh.MaPhong, DATE_FORMAT(bh.NgayHoc, '%Y-%m-%d') AS NgayHocStr, th.GioBatDau, th.GioKetThuc
      FROM BuoiHoc bh
      JOIN TietHoc th ON bh.MaTiet = th.MaTiet
      WHERE bh.NgayHoc >= ? AND bh.NgayHoc <= ?
        AND bh.TrangThai NOT IN ('Absent', 'Swapped', 'Cancelled')
    `, [dates[0], dates[dates.length - 1]]);

    const availableSlots = [];

    for (const d of dates) {
      for (const t of allTiets) {
        for (const r of allRooms) {
          // Kiểm tra xem phòng r có bị chiếm vào d ở tiết t không
          const isBusy = occupied.some(occ => {
            return occ.MaPhong === r.MaPhong &&
                   occ.NgayHocStr === d &&
                   ConflictService.isTimeOverlap(t.GioBatDau, t.GioKetThuc, occ.GioBatDau, occ.GioKetThuc);
          });

          if (!isBusy) {
            availableSlots.push({
              ngayHoc: d,
              maTiet: t.MaTiet,
              tenTiet: t.TenTiet,
              gioBatDau: t.GioBatDau,
              gioKetThuc: t.GioKetThuc,
              maPhong: r.MaPhong,
              tenPhong: r.TenPhong,
              tenToaNha: r.TenToaNha,
              sucChua: r.SucChua,
              loaiPhong: r.LoaiPhong
            });
          }
        }
      }
    }

    return availableSlots;
  };
}

module.exports = ConflictService;
