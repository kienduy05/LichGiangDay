const db = require('../../config/db');
const { getUserScope } = require('./userScope.helper');

class DashboardBoMonService {
  /**
   * Lấy số liệu Dashboard chuyên biệt cho Bộ môn (Role BOMON)
   * Tập trung cao độ vào Lịch giảng dạy, Giảng viên và Biến động lịch
   */
  static getBoMonDashboard = async (user, { maHocKy, maBoMonOverride }) => {
    const scope = await getUserScope(user);
    let maBoMon = scope.maBoMon;

    // Nếu là ADMIN / PHONGDAOTAO thì cho phép truyền maBoMonOverride để xem dashboard của BM bất kỳ
    if (['ADMIN', 'PHONGDAOTAO'].includes(user.role) && maBoMonOverride) {
      maBoMon = maBoMonOverride;
    }

    if (!maBoMon) {
      const err = new Error('Tài khoản không được liên kết với Bộ môn nào.');
      err.status = 400;
      throw err;
    }

    // 1. Lấy thông tin Bộ môn & Học kỳ hiệu lực
    const [bmRows] = await db.query(`
      SELECT bm.MaBoMon, bm.TenBoMon, bm.MaKhoa, k.TenKhoa, bm.MaTruongBoMon, gv.HoTen AS TenTruongBoMon
      FROM BoMon bm
      LEFT JOIN Khoa k ON bm.MaKhoa = k.MaKhoa
      LEFT JOIN GiangVien gv ON bm.MaTruongBoMon = gv.MaGiangVien
      WHERE bm.MaBoMon = ?
      LIMIT 1
    `, [maBoMon]);

    const boMonInfo = bmRows.length > 0 ? bmRows[0] : { MaBoMon: maBoMon, TenBoMon: `Bộ môn ${maBoMon}` };

    // Xác định học kỳ
    let effectiveHocKy = maHocKy;
    if (!effectiveHocKy) {
      const [hkRows] = await db.query(`
        SELECT MaHocKy FROM HocKy 
        ORDER BY NgayBatDau DESC LIMIT 1
      `);
      if (hkRows.length > 0) effectiveHocKy = hkRows[0].MaHocKy;
    }

    // 2. Tính toán ngày Thứ 2 & Chủ nhật của tuần hiện tại theo giờ địa phương
    const formatLocalDate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.getFullYear(), today.getMonth(), diffToMonday);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

    const mondayStr = formatLocalDate(monday);
    const sundayStr = formatLocalDate(sunday);
    const todayStr = formatLocalDate(today);

    // ========================================================
    // 3. KPI CHÍNH CỦA BỘ MÔN (Đều lọc đúng theo effectiveHocKy)
    // ========================================================
    const [
      [gvCount],
      [gvActiveSchedule],
      [lhpCount],
      [weekScheduleCount],
      [pendingRequests],
      [uncompensatedAbsences]
    ] = await Promise.all([
      // 1. Tổng số giảng viên thuộc bộ môn
      db.query(
        "SELECT COUNT(*) AS total FROM GiangVien WHERE MaBoMon = ? AND TrangThai = 'Active'",
        [maBoMon]
      ),
      // 2. Số giảng viên đang có lịch/lớp dạy trong học kỳ
      db.query(`
        SELECT COUNT(DISTINCT maGV) AS total
        FROM (
          SELECT bh.MaGiangVien AS maGV
          FROM BuoiHoc bh
          JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
          WHERE lhp.MaBoMon = ?
            AND (? IS NULL OR lhp.MaHocKy = ?)
            AND (bh.TrangThai IS NULL OR bh.TrangThai != 'Cancelled')
            AND bh.MaGiangVien IS NOT NULL
          UNION
          SELECT lhp.MaGiangVien AS maGV
          FROM LopHocPhan lhp
          WHERE lhp.MaBoMon = ?
            AND (? IS NULL OR lhp.MaHocKy = ?)
            AND lhp.MaGiangVien IS NOT NULL
        ) t
      `, [maBoMon, effectiveHocKy, effectiveHocKy, maBoMon, effectiveHocKy, effectiveHocKy]),
      // 3. Tổng số lớp học phần do bộ môn phụ trách trong học kỳ
      db.query(`
        SELECT COUNT(*) AS total 
        FROM LopHocPhan 
        WHERE MaBoMon = ? AND (? IS NULL OR MaHocKy = ?)
      `, [maBoMon, effectiveHocKy, effectiveHocKy]),
      // 4. Tổng số buổi học / ca dạy trong tuần này thuộc học kỳ đang chọn
      db.query(`
        SELECT COUNT(*) AS total
        FROM BuoiHoc bh
        JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
        WHERE lhp.MaBoMon = ?
          AND (? IS NULL OR lhp.MaHocKy = ?)
          AND bh.NgayHoc BETWEEN ? AND ?
          AND (bh.TrangThai IS NULL OR bh.TrangThai != 'Cancelled')
      `, [maBoMon, effectiveHocKy, effectiveHocKy, mondayStr, sundayStr]),
      // 5. Yêu cầu đang chờ Bộ môn duyệt thuộc học kỳ đang chọn
      db.query(`
        SELECT COUNT(*) AS total
        FROM YeuCauNghi ycn
        JOIN BuoiHoc bh ON ycn.MaBuoiHoc = bh.MaBuoiHoc
        JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
        WHERE lhp.MaBoMon = ?
          AND (? IS NULL OR lhp.MaHocKy = ?)
          AND ycn.TrangThai = 'Pending'
      `, [maBoMon, effectiveHocKy, effectiveHocKy]),
      // 6. Số buổi học đã báo nghỉ nhưng chưa dạy bù thuộc học kỳ đang chọn
      db.query(`
        SELECT COUNT(*) AS total
        FROM BuoiHoc bh
        JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
        WHERE lhp.MaBoMon = ? 
          AND (? IS NULL OR lhp.MaHocKy = ?)
          AND bh.TrangThai = 'Absent' 
          AND (bh.DaDayBu = 0 OR bh.DaDayBu IS NULL)
      `, [maBoMon, effectiveHocKy, effectiveHocKy])
    ]);

    const kpi = {
      tongGiangVien: gvCount[0]?.total || 0,
      giangVienDangDay: gvActiveSchedule[0]?.total || 0,
      tongLopHocPhan: lhpCount[0]?.total || 0,
      buoiHocTuanNay: weekScheduleCount[0]?.total || 0,
      yeuCauChoDuyet: pendingRequests[0]?.total || 0,
      buoiNghiChuaBu: uncompensatedAbsences[0]?.total || 0
    };

    // ========================================================
    // 4. LỊCH HÔM NAY CỦA BỘ MÔN (Lọc đúng học kỳ đang chọn)
    // ========================================================
    const [todayClasses] = await db.query(`
      SELECT bh.MaBuoiHoc, bh.MaThoiKhoaBieu, bh.MaLopHocPhan, 
             DATE_FORMAT(bh.NgayHoc, '%Y-%m-%d') AS NgayHoc,
             bh.MaTiet, bh.MaPhong, bh.MaGiangVien, bh.MaGiangVienGoc,
             bh.LoaiBuoiHoc, bh.TrangThai, bh.DaDayBu, bh.GhiChu,
             bh.NgayGocDoiCa, bh.MaTietGocDoiCa, bh.MaPhongGocDoiCa,
             bh.ThoiGianXacNhanCaDay,
             lhp.TenLopHocPhan, lhp.LoaiHoc, lhp.SiSoDangKy,
             mh.MaMonHoc, mh.TenMonHoc,
             ph.TenPhong, ph.MaToaNha,
             th.TenTiet, th.GioBatDau, th.GioKetThuc,
             gv.HoTen AS TenGiangVien,
             gvGoc.HoTen AS TenGiangVienGoc
      FROM BuoiHoc bh
      JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
      JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      JOIN PhongHoc ph ON bh.MaPhong = ph.MaPhong
      JOIN TietHoc th ON bh.MaTiet = th.MaTiet
      LEFT JOIN GiangVien gv ON bh.MaGiangVien = gv.MaGiangVien
      LEFT JOIN GiangVien gvGoc ON bh.MaGiangVienGoc = gvGoc.MaGiangVien
      WHERE lhp.MaBoMon = ?
        AND (? IS NULL OR lhp.MaHocKy = ?)
        AND DATE(bh.NgayHoc) = ?
        AND (bh.TrangThai IS NULL OR bh.TrangThai != 'Cancelled')
      ORDER BY th.GioBatDau ASC
    `, [maBoMon, effectiveHocKy, effectiveHocKy, todayStr]);

    // ========================================================
    // 5. VIỆC CẦN XỬ LÝ GẤP (Lọc đúng học kỳ đang chọn)
    // ========================================================
    const [actionItems] = await db.query(`
      SELECT ycn.MaYeuCauNghi, ycn.LoaiYeuCau, ycn.LyDo, 
             DATE_FORMAT(ycn.ThoiGianGui, '%Y-%m-%d %H:%i') AS ThoiGianGui,
             ycn.NgayDeXuat,
             DATE_FORMAT(bh.NgayHoc, '%Y-%m-%d') AS NgayHoc,
             th.TenTiet, ph.TenPhong,
             lhp.TenLopHocPhan, mh.TenMonHoc,
             gv.HoTen AS TenGiangVienGui,
             gvThay.HoTen AS TenGiangVienDeXuat
      FROM YeuCauNghi ycn
      JOIN BuoiHoc bh ON ycn.MaBuoiHoc = bh.MaBuoiHoc
      JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
      JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      JOIN PhongHoc ph ON bh.MaPhong = ph.MaPhong
      JOIN TietHoc th ON bh.MaTiet = th.MaTiet
      LEFT JOIN GiangVien gv ON ycn.MaGiangVien = gv.MaGiangVien
      LEFT JOIN GiangVien gvThay ON ycn.MaGiangVienDeXuat = gvThay.MaGiangVien
      WHERE lhp.MaBoMon = ?
        AND (? IS NULL OR lhp.MaHocKy = ?)
        AND ycn.TrangThai = 'Pending'
      ORDER BY ycn.ThoiGianGui DESC
      LIMIT 8
    `, [maBoMon, effectiveHocKy, effectiveHocKy]);

    // ========================================================
    // 6. THỐNG KÊ TẢI GIẢNG DẠY CỦA GIẢNG VIÊN TRONG BỘ MÔN (Đúng học kỳ đang chọn)
    // ========================================================
    const [workloadData] = await db.query(`
      SELECT gv.MaGiangVien, gv.HoTen, gv.DinhMucGioChuan,
             COALESCE(lhpAgg.SoLopHocPhan, COALESCE(bhAgg.SoLopCoBuoi, 0)) AS SoLopHocPhan,
             COALESCE(bhAgg.TongSoBuoiDay, 0) AS TongSoBuoiDay
      FROM GiangVien gv
      LEFT JOIN (
        SELECT lhp.MaGiangVien, COUNT(DISTINCT lhp.MaLopHocPhan) AS SoLopHocPhan
        FROM LopHocPhan lhp
        WHERE lhp.MaBoMon = ? AND (? IS NULL OR lhp.MaHocKy = ?) AND lhp.MaGiangVien IS NOT NULL
        GROUP BY lhp.MaGiangVien
      ) lhpAgg ON gv.MaGiangVien = lhpAgg.MaGiangVien
      LEFT JOIN (
        SELECT bh.MaGiangVien,
               COUNT(DISTINCT bh.MaLopHocPhan) AS SoLopCoBuoi,
               COUNT(bh.MaBuoiHoc) AS TongSoBuoiDay
        FROM BuoiHoc bh
        JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
        WHERE (? IS NULL OR lhp.MaHocKy = ?)
          AND (bh.TrangThai IS NULL OR bh.TrangThai NOT IN ('Absent', 'Cancelled'))
        GROUP BY bh.MaGiangVien
      ) bhAgg ON gv.MaGiangVien = bhAgg.MaGiangVien
      WHERE gv.MaBoMon = ? AND gv.TrangThai = 'Active'
      ORDER BY TongSoBuoiDay DESC, SoLopHocPhan DESC, gv.HoTen ASC
    `, [maBoMon, effectiveHocKy, effectiveHocKy, effectiveHocKy, effectiveHocKy, maBoMon]);

    // ========================================================
    // 7. BIẾN ĐỘNG LỊCH CỦA BỘ MÔN TRONG HỌC KỲ
    // ========================================================
    const [variationStats] = await db.query(`
      SELECT 
        COUNT(*) AS TongBuoi,
        SUM(CASE WHEN bh.TrangThai = 'Normal' AND bh.NgayGocDoiCa IS NULL AND (bh.MaGiangVienGoc IS NULL OR bh.MaGiangVien = bh.MaGiangVienGoc) THEN 1 ELSE 0 END) AS SoBuoiBinhThuong,
        SUM(CASE WHEN bh.TrangThai = 'Absent' THEN 1 ELSE 0 END) AS SoBuoiNghi,
        SUM(CASE WHEN bh.NgayGocDoiCa IS NOT NULL THEN 1 ELSE 0 END) AS SoBuoiDoiCa,
        SUM(CASE WHEN bh.MaGiangVienGoc IS NOT NULL AND bh.MaGiangVien != bh.MaGiangVienGoc THEN 1 ELSE 0 END) AS SoBuoiDayThay,
        SUM(CASE WHEN bh.LoaiBuoiHoc = 'Makeup' THEN 1 ELSE 0 END) AS SoBuoiDayBu
      FROM BuoiHoc bh
      JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
      WHERE lhp.MaBoMon = ?
        AND (? IS NULL OR lhp.MaHocKy = ?)
        AND (bh.TrangThai IS NULL OR bh.TrangThai != 'Cancelled')
    `, [maBoMon, effectiveHocKy, effectiveHocKy]);

    return {
      boMon: boMonInfo,
      maHocKy: effectiveHocKy,
      tuanHienTai: {
        tuNgay: mondayStr,
        denNgay: sundayStr,
        homNay: todayStr
      },
      kpi,
      homNay: todayClasses,
      viecCanXuLy: actionItems,
      workload: workloadData,
      bienDong: variationStats[0] || {
        TongBuoi: 0,
        SoBuoiBinhThuong: 0,
        SoBuoiNghi: 0,
        SoBuoiDoiCa: 0,
        SoBuoiDayThay: 0,
        SoBuoiDayBu: 0
      }
    };
  };
}

module.exports = {
  DashboardBoMonService
};
