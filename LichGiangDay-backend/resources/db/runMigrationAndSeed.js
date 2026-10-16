const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  console.log('=== RUNNING MIGRATION AND SEED ===');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
  });

  try {
    // 1. Run SQL migration
    const sqlPath = path.join(__dirname, 'Migration_BienDongLich.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Executing Migration_BienDongLich.sql...');
    await connection.query(sql);
    console.log('✓ Migration executed successfully.');

    // 2. Ensure CNPM1 lecturer user exists
    const [existingDung] = await connection.query("SELECT * FROM Users WHERE Username = 'dung.lm'");
    let dungUserId = 'USR_DUNG_LM';
    if (existingDung.length === 0) {
      const passwordHash = bcrypt.hashSync('123456', 10);
      await connection.query(
        "INSERT INTO Users (UserId, Username, PasswordHash, FullName, Email, Role, IsActive) VALUES (?, ?, ?, ?, ?, ?, 1)",
        [dungUserId, 'dung.lm', passwordHash, 'Lại Mạnh Dũng', 'lmd@lms.utc.edu.vn', 'GIANGVIEN']
      );
      await connection.query(
        "UPDATE GiangVien SET UserId = ? WHERE MaGiangVien = 'LMD001'",
        [dungUserId]
      );
      console.log('✓ Created user dung.lm (CNPM1 lecturer)');
    }

    // Ensure TruongBoMon is set and linked to BOMON users
    await connection.query("UPDATE BoMon SET MaTruongBoMon = 'NTH001' WHERE MaBoMon = 'MHT'");
    await connection.query("UPDATE BoMon SET MaTruongBoMon = 'NDD001' WHERE MaBoMon = 'CNPM1'");
    await connection.query("UPDATE GiangVien SET UserId = 'USR034665199161' WHERE MaGiangVien = 'NTH001'");
    await connection.query("UPDATE GiangVien SET UserId = 'USR034665199162' WHERE MaGiangVien = 'NDD001'");

    // Ensure LopHocPhan for CNPM1 has LMD001 assigned
    await connection.query(
      "UPDATE LopHocPhan SET MaGiangVien = 'LMD001' WHERE MaLopHocPhan = 'NMCNTT.NMCNTT.CSH.LT1'"
    );

    // 3. Generate BuoiHoc for demo
    console.log('Seeding demo BuoiHoc...');
    // We will seed BuoiHoc for:
    // NLM001 (MHT) - IT1.110.3.2627.1.QT01.K66 (Mon/Fri, Tiet 1, Tiet 3, Room 101_A3)
    // NQT001 (MHT) - IT1.231.3.2627.1.QT01.K64 (Mon/Fri, Tiet 2, Room 201_A3)
    // LMD001 (CNPM1) - NMCNTT.NMCNTT.CSH.LT1 (Wed, Tiet 3, Room 102_A3)

    // Ensure rooms exist
    await connection.query(`
      INSERT IGNORE INTO PhongHoc (MaPhong, TenPhong, MaToaNha, SucChua, LoaiPhong, TrangThai)
      VALUES 
      ('101_A3', 'Phòng 101 - A3', 'A3', 60, 'LyThuyet', 'Ready'),
      ('102_A3', 'Phòng 102 - A3', 'A3', 75, 'LyThuyet', 'Ready'),
      ('201_A3', 'Phòng 201 - A3', 'A3', 50, 'LyThuyet', 'Ready'),
      ('202_A3', 'Phòng 202 - A3', 'A3', 45, 'LyThuyet', 'Ready'),
      ('301_A3', 'Phòng 301 - A3', 'A3', 80, 'LyThuyet', 'Ready'),
      ('LAB_01', 'Phòng Thực Hành 01', 'A3', 40, 'ThucHanh', 'Ready')
    `);

    // Clean existing test seed in BuoiHoc
    await connection.query("DELETE FROM DangKyDayBu WHERE MaDangKyDayBu LIKE 'DKDB_%'");
    await connection.query("DELETE FROM PhanCongDayThay WHERE MaPhanCongDayThay LIKE 'PCDT_%'");
    await connection.query("DELETE FROM YeuCauNghi WHERE MaYeuCauNghi LIKE 'YCN_%'");
    await connection.query("UPDATE BuoiHoc SET MaBuoiHocGoc = NULL WHERE MaBuoiHoc LIKE 'BH_%'");
    await connection.query("DELETE FROM BuoiHoc WHERE MaBuoiHoc LIKE 'BH_%'");
    await connection.query("DELETE FROM ThongBao WHERE MaThongBao LIKE 'TB_%'");

    const sampleSessions = [
      // Week 1 (Oct 05 - Oct 11, 2026)
      { ma: 'BH_20261005_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_1', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-05', tiet: 1, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261005_02', tkb: 'TKB_IT1.231.3.2627.1.QT01.K64_1', lhp: 'IT1.231.3.2627.1.QT01.K64', date: '2026-10-05', tiet: 2, phong: '201_A3', gv: 'NQT001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261007_01', tkb: null, lhp: 'NMCNTT.NMCNTT.CSH.LT1', date: '2026-10-07', tiet: 3, phong: '102_A3', gv: 'LMD001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261009_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_2', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-09', tiet: 3, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261009_02', tkb: 'TKB_IT1.231.3.2627.1.QT01.K64_2', lhp: 'IT1.231.3.2627.1.QT01.K64', date: '2026-10-09', tiet: 3, phong: '201_A3', gv: 'NQT001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },

      // Week 2 (Current week: Oct 12 - Oct 18, 2026, today is Wednesday Oct 14)
      // Monday Oct 12 (Past)
      { ma: 'BH_20261012_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_1', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-12', tiet: 1, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Absent', gvGoc: null, daDayBu: 0, ghiChu: 'Đã báo nghỉ, chưa dạy bù' },
      { ma: 'BH_20261012_02', tkb: 'TKB_IT1.231.3.2627.1.QT01.K64_1', lhp: 'IT1.231.3.2627.1.QT01.K64', date: '2026-10-12', tiet: 2, phong: '201_A3', gv: 'NQT001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      
      // Wednesday Oct 14 (TODAY)
      { ma: 'BH_20261014_01', tkb: null, lhp: 'NMCNTT.NMCNTT.CSH.LT1', date: '2026-10-14', tiet: 3, phong: '102_A3', gv: 'LMD001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261014_02', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_1', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-14', tiet: 1, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },

      // Friday Oct 16 (Future)
      { ma: 'BH_20261016_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_2', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-16', tiet: 3, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Absence_Pending', gvGoc: null, daDayBu: 0, ghiChu: 'Đang xin nghỉ' },
      { ma: 'BH_20261016_02', tkb: 'TKB_IT1.231.3.2627.1.QT01.K64_2', lhp: 'IT1.231.3.2627.1.QT01.K64', date: '2026-10-16', tiet: 3, phong: '201_A3', gv: 'NQT001', loai: 'Regular', status: 'Substitute_Pending', gvGoc: null, daDayBu: 0 },

      // Week 3 (Oct 19 - Oct 25, 2026)
      { ma: 'BH_20261019_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_1', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-19', tiet: 1, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261019_02', tkb: 'TKB_IT1.231.3.2627.1.QT01.K64_1', lhp: 'IT1.231.3.2627.1.QT01.K64', date: '2026-10-19', tiet: 2, phong: '201_A3', gv: 'NQT001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261021_01', tkb: null, lhp: 'NMCNTT.NMCNTT.CSH.LT1', date: '2026-10-21', tiet: 3, phong: '102_A3', gv: 'LMD001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261023_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_2', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-23', tiet: 3, phong: '101_A3', gv: 'NQT001', loai: 'Regular', status: 'Substituted', gvGoc: 'NLM001', daDayBu: 0, ghiChu: 'NQT001 dạy thay cho NLM001' },
      { ma: 'BH_20261023_02', tkb: 'TKB_IT1.231.3.2627.1.QT01.K64_2', lhp: 'IT1.231.3.2627.1.QT01.K64', date: '2026-10-23', tiet: 3, phong: '201_A3', gv: 'NQT001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },

      // Week 4 (Oct 26 - Nov 01, 2026)
      { ma: 'BH_20261026_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_1', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-26', tiet: 1, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      // Swapped session on Tuesday Oct 27 (moved from Friday Oct 30)
      { ma: 'BH_20261027_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_2', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-27', tiet: 2, phong: '202_A3', gv: 'NLM001', loai: 'Regular', status: 'Swapped', gvGoc: null, daDayBu: 0, ngayGoc: '2026-10-30', tietGoc: 3, phongGoc: '101_A3', ghiChu: 'Đã đổi ca từ 30/10' },
      // Makeup session on Thursday Oct 29 (for Oct 12 absence)
      { ma: 'BH_20261029_01', tkb: null, lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-29', tiet: 2, phong: '301_A3', gv: 'NLM001', loai: 'Makeup', status: 'Normal', gvGoc: null, daDayBu: 0, maGoc: 'BH_20261012_01', ghiChu: 'Dạy bù cho ca 12/10' }
    ];

    for (const s of sampleSessions) {
      await connection.query(`
        INSERT INTO BuoiHoc 
        (MaBuoiHoc, MaThoiKhoaBieu, MaLopHocPhan, NgayHoc, MaTiet, MaPhong, MaGiangVien, MaGiangVienGoc, LoaiBuoiHoc, TrangThai, MaBuoiHocGoc, DaDayBu, GhiChu, NgayGocDoiCa, MaTietGocDoiCa, MaPhongGocDoiCa)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        s.ma, s.tkb || null, s.lhp, s.date, s.tiet, s.phong, s.gv, s.gvGoc || null, s.loai, s.status, s.maGoc || null, s.daDayBu || 0, s.ghiChu || null, s.ngayGoc || null, s.tietGoc || null, s.phongGoc || null
      ]);
    }
    console.log(`✓ Seeded ${sampleSessions.length} BuoiHoc.`);

    // 4. Seed Requests (YeuCauNghi, PhanCongDayThay, DangKyDayBu)
    // 4.1. Pending absence request for BH_20261016_01
    await connection.query(`
      INSERT INTO YeuCauNghi (MaYeuCauNghi, MaBuoiHoc, MaGiangVien, LoaiYeuCau, LyDo, MinhChungUrl, ThoiGianGui, TrangThai)
      VALUES ('YCN_20261014_0001', 'BH_20261016_01', 'NLM001', 'ABSENCE', 'Đi công tác hội thảo khoa học tại Đà Nẵng', 'https://example.com/giay-cong-tac.pdf', NOW(), 'Pending')
    `);

    // 4.2. Pending substitute request for BH_20261016_02 (NQT001 asks NLM001 to substitute)
    await connection.query(`
      INSERT INTO YeuCauNghi (MaYeuCauNghi, MaBuoiHoc, MaGiangVien, LoaiYeuCau, LyDo, MaGiangVienDeXuat, ThoiGianGui, TrangThai)
      VALUES ('YCN_20261014_0002', 'BH_20261016_02', 'NQT001', 'SUBSTITUTE', 'Bận việc gia đình đột xuất', 'NLM001', NOW(), 'Pending')
    `);

    await connection.query(`
      INSERT INTO PhanCongDayThay (MaPhanCongDayThay, MaYeuCauNghi, MaBuoiHoc, MaGiangVienDayThay, ThoiGianPhanCong, TrangThai)
      VALUES ('PCDT_20261014_0001', 'YCN_20261014_0002', 'BH_20261016_02', 'NLM001', NOW(), 'Assigned')
    `);

    // 4.3. Approved substitute request in the past (BH_20261023_01)
    await connection.query(`
      INSERT INTO YeuCauNghi (MaYeuCauNghi, MaBuoiHoc, MaGiangVien, LoaiYeuCau, LyDo, MaGiangVienDeXuat, ThoiGianGui, TrangThai, MaGiangVienDuyet, ThoiGianDuyet)
      VALUES ('YCN_20261010_0001', 'BH_20261023_01', 'NLM001', 'SUBSTITUTE', 'Tham gia tập huấn chuyên môn Bộ Giáo Dục', 'NQT001', '2026-10-10 09:00:00', 'Approved', 'NTH001', '2026-10-10 14:00:00')
    `);

    await connection.query(`
      INSERT INTO PhanCongDayThay (MaPhanCongDayThay, MaYeuCauNghi, MaBuoiHoc, MaGiangVienDayThay, ThoiGianPhanCong, TrangThai)
      VALUES ('PCDT_20261010_0001', 'YCN_20261010_0001', 'BH_20261023_01', 'NQT001', '2026-10-10 14:00:00', 'Confirmed')
    `);

    // 4.4. Approved swap request (BH_20261027_01)
    await connection.query(`
      INSERT INTO YeuCauNghi (MaYeuCauNghi, MaBuoiHoc, MaGiangVien, LoaiYeuCau, LyDo, NgayDeXuat, MaTietDeXuat, MaPhongDeXuat, ThoiGianGui, TrangThai, MaGiangVienDuyet, ThoiGianDuyet)
      VALUES ('YCN_20261011_0001', 'BH_20261027_01', 'NLM001', 'SWAP', 'Trùng lịch họp khoa thứ Sáu', '2026-10-27', 2, '202_A3', '2026-10-11 08:30:00', 'Approved', 'NTH001', '2026-10-11 11:00:00')
    `);

    // 4.5. Approved absence on 12/10 and registered makeup session on 29/10
    await connection.query(`
      INSERT INTO YeuCauNghi (MaYeuCauNghi, MaBuoiHoc, MaGiangVien, LoaiYeuCau, LyDo, ThoiGianGui, TrangThai, MaGiangVienDuyet, ThoiGianDuyet)
      VALUES ('YCN_20261008_0001', 'BH_20261012_01', 'NLM001', 'ABSENCE', 'Nghỉ ốm sốt siêu vi', '2026-10-08 10:00:00', 'Approved', 'NTH001', '2026-10-08 15:00:00')
    `);

    await connection.query(`
      INSERT INTO DangKyDayBu (MaDangKyDayBu, MaYeuCauNghi, MaGiangVien, MaLopHocPhan, ThoiGianDangKy, NgayDeXuat, MaTiet, MaPhong, TrangThai, ThoiGianXacNhan, MaBuoiHocTao)
      VALUES ('DKDB_20261013_0001', 'YCN_20261008_0001', 'NLM001', 'IT1.110.3.2627.1.QT01.K66', '2026-10-13 14:00:00', '2026-10-29', 2, '301_A3', 'Confirmed', '2026-10-13 14:00:00', 'BH_20261029_01')
    `);

    // 4.6. CNPM1 request (Pending)
    await connection.query(`
      INSERT INTO YeuCauNghi (MaYeuCauNghi, MaBuoiHoc, MaGiangVien, LoaiYeuCau, LyDo, ThoiGianGui, TrangThai)
      VALUES ('YCN_20261014_0003', 'BH_20261021_01', 'LMD001', 'ABSENCE', 'Xin nghỉ để hướng dẫn sinh viên NCKH', NOW(), 'Pending')
    `);

    // Update BuoiHoc BH_20261021_01 status to Absence_Pending
    await connection.query("UPDATE BuoiHoc SET TrangThai = 'Absence_Pending' WHERE MaBuoiHoc = 'BH_20261021_01'");

    // 5. Seed sample notifications
    await connection.query(`
      INSERT INTO ThongBao (MaThongBao, UserId, TieuDe, NoiDung, LoaiThongBao, ThoiGianGui, DaDoc, MaDoiTuongLienQuan)
      VALUES 
      ('TB_001', 'USR034665199163', 'Yêu cầu đổi ca đã được duyệt', 'Yêu cầu đổi ca ngày 30/10 sang 27/10 lớp Cơ sở dữ liệu đã được Trưởng bộ môn chấp thuận.', 'Approved', NOW(), 0, 'YCN_20261011_0001'),
      ('TB_002', 'USR034665199163', 'Xác nhận đăng ký dạy bù', 'Đăng ký dạy bù vào ngày 29/10/2026 tại phòng 301_A3 đã được xác nhận thành công.', 'Makeup', NOW(), 0, 'DKDB_20261013_0001'),
      ('TB_003', 'USR034665199161', 'Có yêu cầu nghỉ mới cần duyệt', 'Giảng viên ThS. Nguyễn Lê Minh gửi đơn báo nghỉ ca ngày 16/10/2026.', 'NewRequest', NOW(), 0, 'YCN_20261014_0001')
    `);

    console.log('✓ Requests and notifications seeded successfully.');
    console.log('=== MIGRATION & SEED COMPLETED ===');
  } catch (error) {
    console.error('Error during migration/seed:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

run();
