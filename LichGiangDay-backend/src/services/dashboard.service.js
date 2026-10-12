const db = require('../../config/db');

// ============================================================
// In-memory cache: key = "dashboard:<maHocKy>:<maKhoa>:<sections>"
// TTL = 5 phút (300 000 ms)
// ============================================================
const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map();

/**
 * Xóa tất cả cache bắt đầu bằng "dashboard:"
 * Gọi hàm này từ các service khác khi có thay đổi dữ liệu nền
 */
const invalidateDashboardCache = () => {
  for (const key of cache.keys()) {
    if (key.startsWith('dashboard:')) {
      cache.delete(key);
    }
  }
};

class DashboardService {
  /**
   * Lấy toàn bộ số liệu dashboard
   * @param {Object} params
   * @param {string} params.maHocKy - Mã học kỳ (bắt buộc cho các thống kê LHP)
   * @param {string} params.maKhoa  - Mã khoa (tùy chọn, thu hẹp theo khoa)
   * @param {string} params.sections - Danh sách sections cần lấy, phân tách bằng dấu phẩy (mặc định: tất cả)
   */
  static getMasterData = async ({ maHocKy, maKhoa, sections }) => {
    // --- Parse sections ---
    const allSections = ['kpi', 'pie', 'bar', 'warnings'];
    const requestedSections = sections
      ? sections.split(',').map(s => s.trim().toLowerCase()).filter(s => allSections.includes(s))
      : allSections;

    // --- Kiểm tra cache ---
    const cacheKey = `dashboard:${maHocKy || 'ALL'}:${maKhoa || 'ALL'}:${requestedSections.sort().join(',')}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // --- Chạy song song tất cả truy vấn ---
    const tasks = {};

    // ========================================================
    // KHU VỰC A: Thẻ số liệu (KPI)
    // ========================================================
    if (requestedSections.includes('kpi')) {
      tasks.kpi = this._getKPI({ maHocKy, maKhoa });
    }

    // ========================================================
    // KHU VỰC B: Biểu đồ tròn
    // ========================================================
    if (requestedSections.includes('pie')) {
      tasks.pie = this._getPieCharts({ maHocKy, maKhoa });
    }

    // ========================================================
    // KHU VỰC C: Biểu đồ cột
    // ========================================================
    if (requestedSections.includes('bar')) {
      tasks.bar = this._getBarCharts({ maHocKy, maKhoa });
    }

    // ========================================================
    // KHU VỰC D: Cảnh báo chất lượng dữ liệu
    // ========================================================
    if (requestedSections.includes('warnings')) {
      tasks.warnings = this._getWarnings({ maHocKy, maKhoa });
    }

    // Chạy tất cả song song
    const keys = Object.keys(tasks);
    const values = await Promise.all(Object.values(tasks));
    const result = { generatedAt: new Date().toISOString() };
    keys.forEach((key, i) => {
      result[key] = values[i];
    });

    // --- Lưu cache ---
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  };

  // ============================================================
  // KHU VỰC A: KPI
  // ============================================================
  static _getKPI = async ({ maHocKy, maKhoa }) => {
    const queries = [];

    // 1. Tổng số Tòa nhà
    queries.push(db.query('SELECT COUNT(*) AS total FROM ToaNha'));

    // 2. Tổng số Phòng học
    queries.push(db.query('SELECT COUNT(*) AS total FROM PhongHoc'));

    // 3. Tổng số Khoa
    queries.push(db.query('SELECT COUNT(*) AS total FROM Khoa'));

    // 4. Tổng số Bộ môn (lọc theo khoa nếu có)
    if (maKhoa) {
      queries.push(db.query('SELECT COUNT(*) AS total FROM BoMon WHERE MaKhoa = ?', [maKhoa]));
    } else {
      queries.push(db.query('SELECT COUNT(*) AS total FROM BoMon'));
    }

    // 5. Tổng số Giảng viên (lọc theo bộ môn thuộc khoa nếu có)
    if (maKhoa) {
      queries.push(db.query(`
        SELECT COUNT(*) AS total FROM GiangVien gv
        LEFT JOIN BoMon bm ON gv.MaBoMon = bm.MaBoMon
        WHERE bm.MaKhoa = ? OR gv.MaBoMon IS NULL
      `, [maKhoa]));
    } else {
      queries.push(db.query('SELECT COUNT(*) AS total FROM GiangVien'));
    }

    // 6. Tổng số Môn học (lọc theo bộ môn thuộc khoa nếu có)
    if (maKhoa) {
      queries.push(db.query(`
        SELECT COUNT(*) AS total FROM MonHoc mh
        LEFT JOIN BoMon bm ON mh.MaBoMon = bm.MaBoMon
        WHERE bm.MaKhoa = ? OR mh.MaBoMon IS NULL
      `, [maKhoa]));
    } else {
      queries.push(db.query('SELECT COUNT(*) AS total FROM MonHoc'));
    }

    // 7. Tổng số Lớp sinh viên
    if (maKhoa) {
      queries.push(db.query('SELECT COUNT(*) AS total FROM LopSinhVien WHERE MaKhoa = ?', [maKhoa]));
    } else {
      queries.push(db.query('SELECT COUNT(*) AS total FROM LopSinhVien'));
    }

    // 8. Tổng số Khóa sinh viên
    queries.push(db.query('SELECT COUNT(*) AS total FROM KhoaSinhVien'));

    // 9. Tổng số Lớp học phần theo học kỳ
    if (maHocKy) {
      if (maKhoa) {
        queries.push(db.query(`
          SELECT COUNT(*) AS total FROM LopHocPhan lhp
          JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon
          WHERE lhp.MaHocKy = ? AND bm.MaKhoa = ?
        `, [maHocKy, maKhoa]));
      } else {
        queries.push(db.query('SELECT COUNT(*) AS total FROM LopHocPhan WHERE MaHocKy = ?', [maHocKy]));
      }
    } else {
      queries.push(Promise.resolve([[{ total: 0 }]]));
    }

    // 10. Tổng sức chứa toàn bộ phòng học
    queries.push(db.query('SELECT COALESCE(SUM(SucChua), 0) AS total FROM PhongHoc'));

    const results = await Promise.all(queries);

    return {
      tongToaNha: results[0][0][0].total,
      tongPhongHoc: results[1][0][0].total,
      tongKhoa: results[2][0][0].total,
      tongBoMon: results[3][0][0].total,
      tongGiangVien: results[4][0][0].total,
      tongMonHoc: results[5][0][0].total,
      tongLopSinhVien: results[6][0][0].total,
      tongKhoaSinhVien: results[7][0][0].total,
      tongLopHocPhan: results[8][0][0].total,
      tongSucChua: results[9][0][0].total
    };
  };

  // ============================================================
  // KHU VỰC B: Biểu đồ tròn
  // ============================================================
  static _getPieCharts = async ({ maHocKy, maKhoa }) => {
    const queries = {};

    // B1: Phòng học theo trạng thái (Ready / Maintenance)
    queries.phongHocTheoTrangThai = db.query(`
      SELECT TrangThai AS label, COUNT(*) AS value
      FROM PhongHoc
      GROUP BY TrangThai
      ORDER BY TrangThai
    `);

    // B2: Phòng học theo loại phòng
    queries.phongHocTheoLoaiPhong = db.query(`
      SELECT COALESCE(LoaiPhong, 'Chưa phân loại') AS label, COUNT(*) AS value
      FROM PhongHoc
      GROUP BY LoaiPhong
      ORDER BY value DESC
    `);

    // B3: Giảng viên theo trạng thái (Active / Inactive)
    if (maKhoa) {
      queries.giangVienTheoTrangThai = db.query(`
        SELECT gv.TrangThai AS label, COUNT(*) AS value
        FROM GiangVien gv
        LEFT JOIN BoMon bm ON gv.MaBoMon = bm.MaBoMon
        WHERE bm.MaKhoa = ? OR gv.MaBoMon IS NULL
        GROUP BY gv.TrangThai
        ORDER BY gv.TrangThai
      `, [maKhoa]);
    } else {
      queries.giangVienTheoTrangThai = db.query(`
        SELECT TrangThai AS label, COUNT(*) AS value
        FROM GiangVien
        GROUP BY TrangThai
        ORDER BY TrangThai
      `);
    }

    // B4: Giảng viên đã/chưa có tài khoản (UserId NULL hay không)
    if (maKhoa) {
      queries.giangVienTaiKhoan = db.query(`
        SELECT
          CASE WHEN gv.UserId IS NOT NULL THEN 'Đã có tài khoản' ELSE 'Chưa có tài khoản' END AS label,
          COUNT(*) AS value
        FROM GiangVien gv
        LEFT JOIN BoMon bm ON gv.MaBoMon = bm.MaBoMon
        WHERE bm.MaKhoa = ? OR gv.MaBoMon IS NULL
        GROUP BY label
        ORDER BY label
      `, [maKhoa]);
    } else {
      queries.giangVienTaiKhoan = db.query(`
        SELECT
          CASE WHEN UserId IS NOT NULL THEN 'Đã có tài khoản' ELSE 'Chưa có tài khoản' END AS label,
          COUNT(*) AS value
        FROM GiangVien
        GROUP BY label
        ORDER BY label
      `);
    }

    // B5: Lớp học phần theo kiểu học (LT / BT / TH / BTL)
    if (maHocKy) {
      const params = [maHocKy];
      let whereExtra = '';
      if (maKhoa) {
        whereExtra = ' AND bm.MaKhoa = ?';
        params.push(maKhoa);
      }
      queries.lopHocPhanTheoLoaiHoc = db.query(`
        SELECT lhp.LoaiHoc AS label, COUNT(*) AS value
        FROM LopHocPhan lhp
        ${maKhoa ? 'JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon' : ''}
        WHERE lhp.MaHocKy = ?${whereExtra}
        GROUP BY lhp.LoaiHoc
        ORDER BY lhp.LoaiHoc
      `, params);
    } else {
      queries.lopHocPhanTheoLoaiHoc = Promise.resolve([[]]); 
    }

    // B6: Môn học theo số tín chỉ (nhóm 1, 2, 3, 4, chưa khai báo)
    if (maKhoa) {
      queries.monHocTheoTinChi = db.query(`
        SELECT
          CASE
            WHEN mh.SoTinChi IS NULL THEN 'Chưa khai báo'
            WHEN mh.SoTinChi >= 4 THEN '4+'
            ELSE CAST(mh.SoTinChi AS CHAR)
          END AS label,
          COUNT(*) AS value
        FROM MonHoc mh
        LEFT JOIN BoMon bm ON mh.MaBoMon = bm.MaBoMon
        WHERE bm.MaKhoa = ? OR mh.MaBoMon IS NULL
        GROUP BY label
        ORDER BY label
      `, [maKhoa]);
    } else {
      queries.monHocTheoTinChi = db.query(`
        SELECT
          CASE
            WHEN SoTinChi IS NULL THEN 'Chưa khai báo'
            WHEN SoTinChi >= 4 THEN '4+'
            ELSE CAST(SoTinChi AS CHAR)
          END AS label,
          COUNT(*) AS value
        FROM MonHoc
        GROUP BY label
        ORDER BY label
      `);
    }

    // B7: Lớp học phần theo khóa sinh viên (K62 đến K65, chưa gán)
    if (maHocKy) {
      const params = [maHocKy];
      let whereExtra = '';
      if (maKhoa) {
        whereExtra = ' AND bm.MaKhoa = ?';
        params.push(maKhoa);
      }
      queries.lopHocPhanTheoKhoaSV = db.query(`
        SELECT COALESCE(lhp.KhoaHoc, 'Chưa gán') AS label, COUNT(*) AS value
        FROM LopHocPhan lhp
        ${maKhoa ? 'JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon' : ''}
        WHERE lhp.MaHocKy = ?${whereExtra}
        GROUP BY label
        ORDER BY label
      `, params);
    } else {
      queries.lopHocPhanTheoKhoaSV = Promise.resolve([[]]);
    }

    // Chạy song song
    const keys = Object.keys(queries);
    const results = await Promise.all(Object.values(queries));
    const pie = {};
    keys.forEach((key, i) => {
      pie[key] = results[i][0] || [];
    });
    return pie;
  };

  // ============================================================
  // KHU VỰC C: Biểu đồ cột
  // ============================================================
  static _getBarCharts = async ({ maHocKy, maKhoa }) => {
    const queries = {};

    // C1: Số phòng theo tòa nhà
    queries.soPhongTheoToaNha = db.query(`
      SELECT tn.TenToaNha AS label, COUNT(ph.MaPhong) AS value
      FROM ToaNha tn
      LEFT JOIN PhongHoc ph ON tn.MaToaNha = ph.MaToaNha
      GROUP BY tn.MaToaNha, tn.TenToaNha
      ORDER BY value DESC
    `);

    // C2: Tổng sức chứa theo tòa nhà
    queries.sucChuaTheoToaNha = db.query(`
      SELECT tn.TenToaNha AS label, COALESCE(SUM(ph.SucChua), 0) AS value
      FROM ToaNha tn
      LEFT JOIN PhongHoc ph ON tn.MaToaNha = ph.MaToaNha
      GROUP BY tn.MaToaNha, tn.TenToaNha
      ORDER BY value DESC
    `);

    // C3: Số bộ môn theo khoa
    if (maKhoa) {
      queries.soBoMonTheoKhoa = db.query(`
        SELECT k.TenKhoa AS label, COUNT(bm.MaBoMon) AS value
        FROM Khoa k
        LEFT JOIN BoMon bm ON k.MaKhoa = bm.MaKhoa
        WHERE k.MaKhoa = ?
        GROUP BY k.MaKhoa, k.TenKhoa
        ORDER BY value DESC
      `, [maKhoa]);
    } else {
      queries.soBoMonTheoKhoa = db.query(`
        SELECT k.TenKhoa AS label, COUNT(bm.MaBoMon) AS value
        FROM Khoa k
        LEFT JOIN BoMon bm ON k.MaKhoa = bm.MaKhoa
        GROUP BY k.MaKhoa, k.TenKhoa
        ORDER BY value DESC
      `);
    }

    // C4: Số giảng viên theo bộ môn (top 10 + Chưa phân bộ môn)
    if (maKhoa) {
      queries.soGiangVienTheoBM = db.query(`
        (
          SELECT bm.TenBoMon AS label, COUNT(gv.MaGiangVien) AS value
          FROM BoMon bm
          LEFT JOIN GiangVien gv ON bm.MaBoMon = gv.MaBoMon
          WHERE bm.MaKhoa = ?
          GROUP BY bm.MaBoMon, bm.TenBoMon
          ORDER BY value DESC
          LIMIT 10
        )
        UNION ALL
        (
          SELECT 'Chưa phân bộ môn' AS label, COUNT(*) AS value
          FROM GiangVien
          WHERE MaBoMon IS NULL
        )
      `, [maKhoa]);
    } else {
      queries.soGiangVienTheoBM = db.query(`
        (
          SELECT bm.TenBoMon AS label, COUNT(gv.MaGiangVien) AS value
          FROM BoMon bm
          LEFT JOIN GiangVien gv ON bm.MaBoMon = gv.MaBoMon
          GROUP BY bm.MaBoMon, bm.TenBoMon
          ORDER BY value DESC
          LIMIT 10
        )
        UNION ALL
        (
          SELECT 'Chưa phân bộ môn' AS label, COUNT(*) AS value
          FROM GiangVien
          WHERE MaBoMon IS NULL
        )
      `);
    }

    // C5: Số môn học theo bộ môn
    if (maKhoa) {
      queries.soMonHocTheoBM = db.query(`
        SELECT bm.TenBoMon AS label, COUNT(mh.MaMonHoc) AS value
        FROM BoMon bm
        LEFT JOIN MonHoc mh ON bm.MaBoMon = mh.MaBoMon
        WHERE bm.MaKhoa = ?
        GROUP BY bm.MaBoMon, bm.TenBoMon
        ORDER BY value DESC
      `, [maKhoa]);
    } else {
      queries.soMonHocTheoBM = db.query(`
        SELECT bm.TenBoMon AS label, COUNT(mh.MaMonHoc) AS value
        FROM BoMon bm
        LEFT JOIN MonHoc mh ON bm.MaBoMon = mh.MaBoMon
        GROUP BY bm.MaBoMon, bm.TenBoMon
        ORDER BY value DESC
      `);
    }

    // C6: Số lớp sinh viên theo khoa
    if (maKhoa) {
      queries.soLopSVTheoKhoa = db.query(`
        SELECT k.TenKhoa AS label, COUNT(lsv.MaLopSinhVien) AS value
        FROM Khoa k
        LEFT JOIN LopSinhVien lsv ON k.MaKhoa = lsv.MaKhoa
        WHERE k.MaKhoa = ?
        GROUP BY k.MaKhoa, k.TenKhoa
        ORDER BY value DESC
      `, [maKhoa]);
    } else {
      queries.soLopSVTheoKhoa = db.query(`
        SELECT k.TenKhoa AS label, COUNT(lsv.MaLopSinhVien) AS value
        FROM Khoa k
        LEFT JOIN LopSinhVien lsv ON k.MaKhoa = lsv.MaKhoa
        GROUP BY k.MaKhoa, k.TenKhoa
        ORDER BY value DESC
      `);
    }

    // C7: Số lớp học phần theo môn học (top 10 mở nhiều lớp nhất)
    if (maHocKy) {
      const params = [maHocKy];
      let whereExtra = '';
      if (maKhoa) {
        whereExtra = ' AND bm.MaKhoa = ?';
        params.push(maKhoa);
      }
      queries.soLHPTheoMonHoc = db.query(`
        SELECT mh.TenMonHoc AS label, COUNT(lhp.MaLopHocPhan) AS value
        FROM MonHoc mh
        JOIN LopHocPhan lhp ON mh.MaMonHoc = lhp.MaMonHoc
        ${maKhoa ? 'JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon' : ''}
        WHERE lhp.MaHocKy = ?${whereExtra}
        GROUP BY mh.MaMonHoc, mh.TenMonHoc
        ORDER BY value DESC
        LIMIT 10
      `, params);
    } else {
      queries.soLHPTheoMonHoc = Promise.resolve([[]]);
    }

    // C8: Số lớp học phần theo bộ môn (trong học kỳ đang chọn)
    if (maHocKy) {
      const params = [maHocKy];
      let whereExtra = '';
      if (maKhoa) {
        whereExtra = ' AND bm.MaKhoa = ?';
        params.push(maKhoa);
      }
      queries.soLHPTheoBM = db.query(`
        SELECT bm.TenBoMon AS label, COUNT(lhp.MaLopHocPhan) AS value
        FROM BoMon bm
        LEFT JOIN LopHocPhan lhp ON bm.MaBoMon = lhp.MaBoMon AND lhp.MaHocKy = ?
        ${maKhoa ? `WHERE bm.MaKhoa = ?` : ''}
        GROUP BY bm.MaBoMon, bm.TenBoMon
        ORDER BY value DESC
      `, params);
    } else {
      queries.soLHPTheoBM = Promise.resolve([[]]);
    }

    // C9: Sĩ số dự kiến vs đăng ký (top 10 môn, 2 chuỗi dữ liệu)
    if (maHocKy) {
      const params = [maHocKy];
      let whereExtra = '';
      if (maKhoa) {
        whereExtra = ' AND bm.MaKhoa = ?';
        params.push(maKhoa);
      }
      queries.siSoDuKienVsDangKy = db.query(`
        SELECT
          mh.TenMonHoc AS label,
          COALESCE(SUM(lhp.SiSoDuKien), 0) AS siSoDuKien,
          COALESCE(SUM(lhp.SiSoDangKy), 0) AS siSoDangKy
        FROM MonHoc mh
        JOIN LopHocPhan lhp ON mh.MaMonHoc = lhp.MaMonHoc
        ${maKhoa ? 'JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon' : ''}
        WHERE lhp.MaHocKy = ?${whereExtra}
        GROUP BY mh.MaMonHoc, mh.TenMonHoc
        ORDER BY (COALESCE(SUM(lhp.SiSoDuKien), 0) - COALESCE(SUM(lhp.SiSoDangKy), 0)) DESC
        LIMIT 10
      `, params);
    } else {
      queries.siSoDuKienVsDangKy = Promise.resolve([[]]);
    }

    // C10: Phòng học theo sức chứa (nhóm: dưới 40, 40-60, 60-100, trên 100)
    queries.phongHocTheoSucChua = db.query(`
      SELECT
        CASE
          WHEN SucChua IS NULL THEN 'Chưa khai báo'
          WHEN SucChua < 40 THEN 'Dưới 40'
          WHEN SucChua <= 60 THEN '40 - 60'
          WHEN SucChua <= 100 THEN '60 - 100'
          ELSE 'Trên 100'
        END AS label,
        COUNT(*) AS value
      FROM PhongHoc
      GROUP BY label
      ORDER BY
        CASE label
          WHEN 'Dưới 40' THEN 1
          WHEN '40 - 60' THEN 2
          WHEN '60 - 100' THEN 3
          WHEN 'Trên 100' THEN 4
          ELSE 5
        END
    `);

    // Chạy song song
    const keys = Object.keys(queries);
    const results = await Promise.all(Object.values(queries));
    const bar = {};
    keys.forEach((key, i) => {
      bar[key] = results[i][0] || [];
    });
    return bar;
  };

  // ============================================================
  // KHU VỰC D: Cảnh báo chất lượng dữ liệu
  // ============================================================
  static _getWarnings = async ({ maHocKy, maKhoa }) => {
    const queries = {};

    // D1: Khoa chưa có Trưởng khoa
    queries.khoaChuaCoTruongKhoa = db.query(`
      SELECT COUNT(*) AS total FROM Khoa WHERE MaTruongKhoa IS NULL
    `);

    // D2: Bộ môn chưa có Trưởng bộ môn
    if (maKhoa) {
      queries.boMonChuaCoTruongBM = db.query(`
        SELECT COUNT(*) AS total FROM BoMon WHERE MaTruongBoMon IS NULL AND MaKhoa = ?
      `, [maKhoa]);
    } else {
      queries.boMonChuaCoTruongBM = db.query(`
        SELECT COUNT(*) AS total FROM BoMon WHERE MaTruongBoMon IS NULL
      `);
    }

    // D3: Bộ môn chưa có giảng viên nào
    if (maKhoa) {
      queries.boMonChuaCoGV = db.query(`
        SELECT COUNT(*) AS total FROM BoMon bm
        WHERE bm.MaKhoa = ?
          AND NOT EXISTS (SELECT 1 FROM GiangVien gv WHERE gv.MaBoMon = bm.MaBoMon)
      `, [maKhoa]);
    } else {
      queries.boMonChuaCoGV = db.query(`
        SELECT COUNT(*) AS total FROM BoMon bm
        WHERE NOT EXISTS (SELECT 1 FROM GiangVien gv WHERE gv.MaBoMon = bm.MaBoMon)
      `);
    }

    // D4: Giảng viên chưa phân bộ môn
    queries.giangVienChuaPhanBM = db.query(`
      SELECT COUNT(*) AS total FROM GiangVien WHERE MaBoMon IS NULL
    `);

    // D5: Môn học chưa gán bộ môn
    queries.monHocChuaGanBM = db.query(`
      SELECT COUNT(*) AS total FROM MonHoc WHERE MaBoMon IS NULL
    `);

    // D6: Môn học chưa mở lớp nào trong học kỳ đang chọn
    if (maHocKy) {
      if (maKhoa) {
        queries.monHocChuaMoLop = db.query(`
          SELECT COUNT(*) AS total FROM MonHoc mh
          LEFT JOIN BoMon bm ON mh.MaBoMon = bm.MaBoMon
          WHERE (bm.MaKhoa = ? OR mh.MaBoMon IS NULL)
            AND NOT EXISTS (
              SELECT 1 FROM LopHocPhan lhp
              WHERE lhp.MaMonHoc = mh.MaMonHoc AND lhp.MaHocKy = ?
            )
        `, [maKhoa, maHocKy]);
      } else {
        queries.monHocChuaMoLop = db.query(`
          SELECT COUNT(*) AS total FROM MonHoc mh
          WHERE NOT EXISTS (
            SELECT 1 FROM LopHocPhan lhp
            WHERE lhp.MaMonHoc = mh.MaMonHoc AND lhp.MaHocKy = ?
          )
        `, [maHocKy]);
      }
    } else {
      queries.monHocChuaMoLop = Promise.resolve([[{ total: 0 }]]);
    }

    // D7: Phòng học đang bảo trì
    queries.phongHocBaoTri = db.query(`
      SELECT COUNT(*) AS total FROM PhongHoc WHERE TrangThai = 'Maintenance'
    `);

    // D8: Lớp học phần chưa gắn khóa sinh viên
    if (maHocKy) {
      const params = [maHocKy];
      let whereExtra = '';
      if (maKhoa) {
        whereExtra = ' AND bm.MaKhoa = ?';
        params.push(maKhoa);
      }
      queries.lopHocPhanChuaGanKhoaSV = db.query(`
        SELECT COUNT(*) AS total FROM LopHocPhan lhp
        ${maKhoa ? 'JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon' : ''}
        WHERE lhp.MaHocKy = ? AND lhp.KhoaHoc IS NULL${whereExtra}
      `, params);
    } else {
      queries.lopHocPhanChuaGanKhoaSV = Promise.resolve([[{ total: 0 }]]);
    }

    // Chạy song song
    const keys = Object.keys(queries);
    const results = await Promise.all(Object.values(queries));
    const warnings = {};
    keys.forEach((key, i) => {
      warnings[key] = results[i][0][0].total;
    });
    return warnings;
  };
}

module.exports = { DashboardService, invalidateDashboardCache };
