const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function seedData() {
  console.log('--- DB Data Seeding ---');
  console.log(`Connecting to: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('✓ Connected to MySQL server.');

    // 1. Seed Roles
    console.log('Seeding Roles...');
    await connection.query(`
      INSERT INTO Roles (RoleId, RoleName, Description, IsSystem)
      VALUES ('ADMIN', 'Administrator', 'Quản trị viên hệ thống', 1)
      ON DUPLICATE KEY UPDATE RoleName=VALUES(RoleName), Description=VALUES(Description);
    `);
    console.log('✓ Role Administrator (ADMIN) inserted/updated.');

    // 2. Seed Resources
    console.log('Seeding Resources...');
    const resources = [
      { id: 'ToaNha', name: 'Quản lý Tòa nhà' },
      { id: 'Khoa', name: 'Quản lý Khoa' },
      { id: 'BoMon', name: 'Quản lý Bộ môn' },
      { id: 'Roles', name: 'Quản lý Quyền' },
      { id: 'Resources', name: 'Quản lý Tài nguyên' },
      { id: 'RolePermissions', name: 'Quản lý Phân quyền' },
      { id: 'Users', name: 'Quản lý Người dùng' },
      { id: 'ApiKeys', name: 'Quản lý API Keys' },
      { id: 'KeyTokens', name: 'Quản lý Tokens' },
      { id: 'GiangVien', name: 'Quản lý Giảng viên' },
      { id: 'PhongHoc', name: 'Quản lý Phòng học' },
      { id: 'TietHoc', name: 'Quản lý Tiết học' },
      { id: 'HocKy', name: 'Quản lý Học kỳ' },
      { id: 'MonHoc', name: 'Quản lý Môn học' },
      { id: 'LopSinhVien', name: 'Quản lý Lớp sinh viên' },
      { id: 'LopHocPhan', name: 'Quản lý Lớp học phần' },
      { id: 'LopHocPhan_LopSinhVien', name: 'Quản lý Lớp HP - Sinh viên' },
      { id: 'ThoiKhoaBieu', name: 'Quản lý Thời khóa biểu' },
      { id: 'BuoiHoc', name: 'Quản lý Buổi học' },
      { id: 'YeuCauNghi', name: 'Quản lý Yêu cầu nghỉ' },
      { id: 'PhanCongDayThay', name: 'Quản lý Dạy thay' },
      { id: 'DangKyDayBu', name: 'Quản lý Dạy bù' },
      { id: 'TepNhap', name: 'Quản lý Tệp nhập' },
      { id: 'ChiTietNhap', name: 'Quản lý Chi tiết nhập' },
      { id: 'ThongBao', name: 'Quản lý Thông báo' },
      { id: 'NhatKyHeThong', name: 'Quản lý Nhật ký hệ thống' }
    ];

    for (const res of resources) {
      await connection.query(`
        INSERT INTO Resources (ResourceId, ResourceName, Description)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE ResourceName=VALUES(ResourceName);
      `, [res.id, res.name, `Tài nguyên ${res.name}`]);
    }
    console.log(`✓ Inserted/Updated ${resources.length} resources.`);

    // 3. Seed RolePermissions for ADMIN (Full permissions on all resources)
    console.log('Seeding ADMIN Permissions...');
    for (const res of resources) {
      await connection.query(`
        INSERT INTO RolePermissions (RoleId, ResourceId, CanCreate, CanRead, CanUpdate, CanDelete)
        VALUES ('ADMIN', ?, 1, 1, 1, 1)
        ON DUPLICATE KEY UPDATE CanCreate=1, CanRead=1, CanUpdate=1, CanDelete=1;
      `, [res.id]);
    }
    console.log('✓ Granted FULL permissions (Create, Read, Update, Delete) to ADMIN role on all resources.');

    // 4. Seed Admin User: ADMIN.0001 / 123456
    console.log('Seeding Admin User (ADMIN.0001)...');
    const passwordHash = bcrypt.hashSync('123456', 10);
    await connection.query(`
      INSERT INTO Users (UserId, Username, PasswordHash, FullName, Email, Role, IsActive)
      VALUES ('USR000000000001', 'ADMIN.0001', ?, 'Quản trị viên hệ thống', 'admin@lichgiangday.edu.vn', 'ADMIN', 1)
      ON DUPLICATE KEY UPDATE PasswordHash=VALUES(PasswordHash), Role='ADMIN', IsActive=1;
    `, [passwordHash]);
    console.log('✓ Account ADMIN.0001 / password: 123456 seeded successfully.');

    // 5. Seed Default ApiKey
    console.log('Seeding Default ApiKey...');
    const defaultApiKey = 'lichgiangday_secret_apikey_2026';
    await connection.query(`
      INSERT INTO ApiKeys (\`Key\`, Status, Permissions)
      VALUES (?, 1, '0000')
      ON DUPLICATE KEY UPDATE Status=1;
    `, [defaultApiKey]);
    console.log(`✓ ApiKey '${defaultApiKey}' seeded successfully.`);

    console.log('\n✅ All seed data completed successfully!');

  } catch (error) {
    console.error('✗ Error seeding data:', error);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connection closed.');
    }
  }
}

seedData();
