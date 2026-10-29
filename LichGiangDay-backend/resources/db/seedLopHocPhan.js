const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/**
 * Seed script: Nạp danh sách Lớp học phần mẫu đúng chuẩn định dạng tín chỉ (UTC)
 */
async function seedLopHocPhan() {
  console.log('=== SEEDING LỚP HỌC PHẦN CHUẨN ĐỊNH DẠNG ===');
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false }
    });

    console.log(`✓ Đã kết nối tới CSDL MySQL: ${process.env.DB_NAME}`);

    const danhSachLopHocPhan = [
      {
        MaLopHocPhan: 'IT1.217.3.2627.1.QT01.K65',
        TenLopHocPhan: 'Lập trình Web 1-1-26 (QT01)',
        MaMonHoc: 'IT1.217.3',
        MaHocKy: 'HK1_26_27',
        LoaiHoc: 'LT',
        SiSoDuKien: 60,
        SiSoDangKy: 58,
        TrangThaiPhanCong: 'Unassigned',
        MaGiangVien: null,
        MaBoMon: 'MHT',
        KhoaHoc: 'K65',
        NgayBatDau: '2026-08-10',
        NgayKetThuc: '2026-11-18',
        SoTuan: 15,
        LopSinhVien: ['CNTTVA1.65']
      },
      {
        MaLopHocPhan: 'IT1.217.3.2627.1.TH1.QT01.K65',
        TenLopHocPhan: 'Lập trình Web 1-1-26 TH1 (QT01)',
        MaMonHoc: 'IT1.217.3',
        MaHocKy: 'HK1_26_27',
        LoaiHoc: 'TH',
        SiSoDuKien: 30,
        SiSoDangKy: 29,
        TrangThaiPhanCong: 'Unassigned',
        MaGiangVien: null,
        MaBoMon: 'MHT',
        KhoaHoc: 'K65',
        NgayBatDau: '2026-08-10',
        NgayKetThuc: '2026-11-18',
        SoTuan: 15,
        LopSinhVien: ['CNTTVA1.65']
      },
      {
        MaLopHocPhan: 'IT1.217.3.2627.1.TH2.QT01.K65',
        TenLopHocPhan: 'Lập trình Web 1-1-26 TH2 (QT01)',
        MaMonHoc: 'IT1.217.3',
        MaHocKy: 'HK1_26_27',
        LoaiHoc: 'TH',
        SiSoDuKien: 30,
        SiSoDangKy: 29,
        TrangThaiPhanCong: 'Unassigned',
        MaGiangVien: null,
        MaBoMon: 'MHT',
        KhoaHoc: 'K65',
        NgayBatDau: '2026-08-10',
        NgayKetThuc: '2026-11-18',
        SoTuan: 15,
        LopSinhVien: ['CNTTVA1.65']
      },
      {
        MaLopHocPhan: 'IT1.230.3.2627.1.QT01.K64',
        TenLopHocPhan: 'Quản trị mạng 1-1-26 (QT01)',
        MaMonHoc: 'IT1.230.3',
        MaHocKy: 'HK1_26_27',
        LoaiHoc: 'LT',
        SiSoDuKien: 55,
        SiSoDangKy: 50,
        TrangThaiPhanCong: 'Unassigned',
        MaGiangVien: null,
        MaBoMon: 'MHT',
        KhoaHoc: 'K64',
        NgayBatDau: '2026-08-10',
        NgayKetThuc: '2026-11-18',
        SoTuan: 15,
        LopSinhVien: ['CNTT1.64', 'CNTT2.64']
      },
      {
        MaLopHocPhan: 'IT1.230.3.2627.1.TH1.QT01.K64',
        TenLopHocPhan: 'Quản trị mạng 1-1-26 TH1 (QT01)',
        MaMonHoc: 'IT1.230.3',
        MaHocKy: 'HK1_26_27',
        LoaiHoc: 'TH',
        SiSoDuKien: 28,
        SiSoDangKy: 25,
        TrangThaiPhanCong: 'Unassigned',
        MaGiangVien: null,
        MaBoMon: 'MHT',
        KhoaHoc: 'K64',
        NgayBatDau: '2026-08-10',
        NgayKetThuc: '2026-11-18',
        SoTuan: 15,
        LopSinhVien: ['CNTT1.64']
      },
      {
        MaLopHocPhan: 'IT1.230.3.2627.1.TH2.QT01.K64',
        TenLopHocPhan: 'Quản trị mạng 1-1-26 TH2 (QT01)',
        MaMonHoc: 'IT1.230.3',
        MaHocKy: 'HK1_26_27',
        LoaiHoc: 'TH',
        SiSoDuKien: 27,
        SiSoDangKy: 25,
        TrangThaiPhanCong: 'Unassigned',
        MaGiangVien: null,
        MaBoMon: 'MHT',
        KhoaHoc: 'K64',
        NgayBatDau: '2026-08-10',
        NgayKetThuc: '2026-11-18',
        SoTuan: 15,
        LopSinhVien: ['CNTT2.64']
      },
      {
        MaLopHocPhan: 'IT1.106.3.2627.1.QT01.K65',
        TenLopHocPhan: 'Thiết kế Web 1-1-26 (QT01)',
        MaMonHoc: 'IT1.106.3',
        MaHocKy: 'HK1_26_27',
        LoaiHoc: 'LT',
        SiSoDuKien: 50,
        SiSoDangKy: 48,
        TrangThaiPhanCong: 'Unassigned',
        MaGiangVien: null,
        MaBoMon: 'MHT',
        KhoaHoc: 'K65',
        NgayBatDau: '2026-08-10',
        NgayKetThuc: '2026-11-18',
        SoTuan: 15,
        LopSinhVien: ['CNTTVA2.65']
      },
      {
        MaLopHocPhan: 'IT1.106.3.2627.1.TH1.QT01.K65',
        TenLopHocPhan: 'Thiết kế Web 1-1-26 TH (QT01)',
        MaMonHoc: 'IT1.106.3',
        MaHocKy: 'HK1_26_27',
        LoaiHoc: 'TH',
        SiSoDuKien: 50,
        SiSoDangKy: 48,
        TrangThaiPhanCong: 'Unassigned',
        MaGiangVien: null,
        MaBoMon: 'MHT',
        KhoaHoc: 'K65',
        NgayBatDau: '2026-08-10',
        NgayKetThuc: '2026-11-18',
        SoTuan: 15,
        LopSinhVien: ['CNTTVA2.65']
      },
      {
        MaLopHocPhan: 'IT1.112.3.2627.1.QT01.K66',
        TenLopHocPhan: 'Nguyên lý hệ điều hành 1-1-26 (QT01)',
        MaMonHoc: 'IT1.112.3',
        MaHocKy: 'HK1_26_27',
        LoaiHoc: 'LT',
        SiSoDuKien: 70,
        SiSoDangKy: 65,
        TrangThaiPhanCong: 'Unassigned',
        MaGiangVien: null,
        MaBoMon: 'MHT',
        KhoaHoc: 'K66',
        NgayBatDau: '2026-08-10',
        NgayKetThuc: '2026-11-18',
        SoTuan: 15,
        LopSinhVien: ['CNTT3.64']
      },
      {
        MaLopHocPhan: 'IT1.112.3.2627.1.2.QT01.K66',
        TenLopHocPhan: 'Nguyên lý hệ điều hành 1-1-26 BT (QT01)',
        MaMonHoc: 'IT1.112.3',
        MaHocKy: 'HK1_26_27',
        LoaiHoc: 'BT',
        SiSoDuKien: 70,
        SiSoDangKy: 65,
        TrangThaiPhanCong: 'Unassigned',
        MaGiangVien: null,
        MaBoMon: 'MHT',
        KhoaHoc: 'K66',
        NgayBatDau: '2026-08-10',
        NgayKetThuc: '2026-11-18',
        SoTuan: 15,
        LopSinhVien: ['CNTT3.64']
      },
      {
        MaLopHocPhan: 'IT1.305.3.2627.1.QT01.K64',
        TenLopHocPhan: 'Lưu trữ và xử lý dữ liệu lớn 1-1-26 (QT01)',
        MaMonHoc: 'IT1.305.3',
        MaHocKy: 'HK1_26_27',
        LoaiHoc: 'LT',
        SiSoDuKien: 45,
        SiSoDangKy: 42,
        TrangThaiPhanCong: 'Unassigned',
        MaGiangVien: null,
        MaBoMon: 'MHT',
        KhoaHoc: 'K64',
        NgayBatDau: '2026-08-10',
        NgayKetThuc: '2026-11-18',
        SoTuan: 15,
        LopSinhVien: ['CNTTVA2.64']
      },
      {
        MaLopHocPhan: 'IT1.649.3.2627.1.QT01.K64',
        TenLopHocPhan: 'An toàn và bảo mật mạng 1-1-26 (QT01)',
        MaMonHoc: 'IT1.649.3',
        MaHocKy: 'HK1_26_27',
        LoaiHoc: 'LT',
        SiSoDuKien: 50,
        SiSoDangKy: 47,
        TrangThaiPhanCong: 'Unassigned',
        MaGiangVien: null,
        MaBoMon: 'MHT',
        KhoaHoc: 'K64',
        NgayBatDau: '2026-08-10',
        NgayKetThuc: '2026-11-18',
        SoTuan: 15,
        LopSinhVien: ['KNTTVA1.64']
      }
    ];

    console.log(`Bắt đầu lưu ${danhSachLopHocPhan.length} lớp học phần vào bảng LopHocPhan...`);

    let countLHP = 0;
    let countLHL = 0;

    for (const lhp of danhSachLopHocPhan) {
      await connection.query(`
        INSERT INTO LopHocPhan (
          MaLopHocPhan, TenLopHocPhan, MaMonHoc, MaHocKy, LoaiHoc, 
          SiSoDuKien, SiSoDangKy, TrangThaiPhanCong, MaGiangVien, 
          MaBoMon, KhoaHoc, NgayBatDau, NgayKetThuc, SoTuan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          TenLopHocPhan = VALUES(TenLopHocPhan),
          MaMonHoc = VALUES(MaMonHoc),
          MaHocKy = VALUES(MaHocKy),
          LoaiHoc = VALUES(LoaiHoc),
          SiSoDuKien = VALUES(SiSoDuKien),
          SiSoDangKy = VALUES(SiSoDangKy),
          MaBoMon = VALUES(MaBoMon),
          KhoaHoc = VALUES(KhoaHoc),
          NgayBatDau = VALUES(NgayBatDau),
          NgayKetThuc = VALUES(NgayKetThuc),
          SoTuan = VALUES(SoTuan);
      `, [
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        lhp.MaMonHoc,
        lhp.MaHocKy,
        lhp.LoaiHoc,
        lhp.SiSoDuKien,
        lhp.SiSoDangKy,
        lhp.TrangThaiPhanCong,
        lhp.MaGiangVien,
        lhp.MaBoMon,
        lhp.KhoaHoc,
        lhp.NgayBatDau,
        lhp.NgayKetThuc,
        lhp.SoTuan
      ]);
      countLHP++;

      if (lhp.LopSinhVien && lhp.LopSinhVien.length > 0) {
        for (const maLopSV of lhp.LopSinhVien) {
          await connection.query(`
            INSERT INTO LopHocPhan_LopSinhVien (MaLopHocPhan, MaLopSinhVien)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE MaLopSinhVien = VALUES(MaLopSinhVien);
          `, [lhp.MaLopHocPhan, maLopSV]);
          countLHL++;
        }
      }
    }

    console.log(`✓ Đã nạp thành công ${countLHP} Lớp học phần chuẩn.`);
    console.log(`✓ Đã liên kết ${countLHL} quan hệ lớp học phần - lớp sinh viên (LopHocPhan_LopSinhVien).`);
    console.log('=== HOÀN TẤT SEED LỚP HỌC PHẦN ===\n');

  } catch (error) {
    console.error('✗ Lỗi khi nạp Lớp học phần:', error);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Đã đóng kết nối CSDL.');
    }
  }
}

seedLopHocPhan();

module.exports = seedLopHocPhan;

