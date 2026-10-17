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
      { ma: 'BH_20261005_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_1', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-05', tiet: 3, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261005_02', tkb: 'TKB_IT1.231.3.2627.1.QT01.K64_1', lhp: 'IT1.231.3.2627.1.QT01.K64', date: '2026-10-05', tiet: 3, phong: '201_A3', gv: 'NQT001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261007_01', tkb: null, lhp: 'NMCNTT.NMCNTT.CSH.LT1', date: '2026-10-07', tiet: 3, phong: '102_A3', gv: 'LMD001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261009_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_2', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-09', tiet: 3, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261009_02', tkb: 'TKB_IT1.231.3.2627.1.QT01.K64_2', lhp: 'IT1.231.3.2627.1.QT01.K64', date: '2026-10-09', tiet: 3, phong: '201_A3', gv: 'NQT001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },

      // Week 2 (Oct 12 - Oct 18, 2026)
      { ma: 'BH_20261012_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_1', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-12', tiet: 3, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261012_02', tkb: 'TKB_IT1.231.3.2627.1.QT01.K64_1', lhp: 'IT1.231.3.2627.1.QT01.K64', date: '2026-10-12', tiet: 3, phong: '201_A3', gv: 'NQT001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261014_01', tkb: null, lhp: 'NMCNTT.NMCNTT.CSH.LT1', date: '2026-10-14', tiet: 3, phong: '102_A3', gv: 'LMD001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261016_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_2', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-16', tiet: 3, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261016_02', tkb: 'TKB_IT1.231.3.2627.1.QT01.K64_2', lhp: 'IT1.231.3.2627.1.QT01.K64', date: '2026-10-16', tiet: 3, phong: '201_A3', gv: 'NQT001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },

      // Week 3 (Oct 19 - Oct 25, 2026)
      { ma: 'BH_20261019_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_1', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-19', tiet: 3, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261019_02', tkb: 'TKB_IT1.231.3.2627.1.QT01.K64_1', lhp: 'IT1.231.3.2627.1.QT01.K64', date: '2026-10-19', tiet: 3, phong: '201_A3', gv: 'NQT001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261021_01', tkb: null, lhp: 'NMCNTT.NMCNTT.CSH.LT1', date: '2026-10-21', tiet: 3, phong: '102_A3', gv: 'LMD001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261023_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_2', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-23', tiet: 3, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261023_02', tkb: 'TKB_IT1.231.3.2627.1.QT01.K64_2', lhp: 'IT1.231.3.2627.1.QT01.K64', date: '2026-10-23', tiet: 3, phong: '201_A3', gv: 'NQT001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },

      // Week 4 (Oct 26 - Nov 01, 2026)
      { ma: 'BH_20261026_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_1', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-26', tiet: 3, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 },
      { ma: 'BH_20261027_01', tkb: 'TKB_IT1.110.3.2627.1.QT01.K66_2', lhp: 'IT1.110.3.2627.1.QT01.K66', date: '2026-10-30', tiet: 3, phong: '101_A3', gv: 'NLM001', loai: 'Regular', status: 'Normal', gvGoc: null, daDayBu: 0 }
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
    console.log(`✓ Seeded ${sampleSessions.length} clean BuoiHoc.`);
    console.log('=== MIGRATION & SEED COMPLETED ===');
  } catch (error) {
    console.error('Error during migration/seed:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

run();
