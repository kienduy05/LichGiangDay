-- Migration for BienDongLich Module (YeuCauNghi, PhanCongDayThay, DangKyDayBu, BuoiHoc, ThongBao, RBAC)
-- Idempotent script for MySQL

-- 1. Bổ sung cột cho BuoiHoc nếu chưa có
SET @dbname = DATABASE();

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'BuoiHoc' AND COLUMN_NAME = 'MaGiangVienGoc') > 0,
  'SELECT 1',
  'ALTER TABLE BuoiHoc ADD COLUMN MaGiangVienGoc VARCHAR(10) NULL AFTER MaGiangVien'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'BuoiHoc' AND COLUMN_NAME = 'DaDayBu') > 0,
  'SELECT 1',
  'ALTER TABLE BuoiHoc ADD COLUMN DaDayBu TINYINT(1) NOT NULL DEFAULT 0 AFTER MaBuoiHocGoc'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'BuoiHoc' AND COLUMN_NAME = 'GhiChu') > 0,
  'SELECT 1',
  'ALTER TABLE BuoiHoc ADD COLUMN GhiChu VARCHAR(255) NULL AFTER DaDayBu'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'BuoiHoc' AND COLUMN_NAME = 'NgayGocDoiCa') > 0,
  'SELECT 1',
  'ALTER TABLE BuoiHoc ADD COLUMN NgayGocDoiCa DATE NULL AFTER GhiChu'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'BuoiHoc' AND COLUMN_NAME = 'MaTietGocDoiCa') > 0,
  'SELECT 1',
  'ALTER TABLE BuoiHoc ADD COLUMN MaTietGocDoiCa TINYINT NULL AFTER NgayGocDoiCa'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'BuoiHoc' AND COLUMN_NAME = 'MaPhongGocDoiCa') > 0,
  'SELECT 1',
  'ALTER TABLE BuoiHoc ADD COLUMN MaPhongGocDoiCa VARCHAR(30) NULL AFTER MaTietGocDoiCa'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Bổ sung cột cho YeuCauNghi
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'YeuCauNghi' AND COLUMN_NAME = 'MinhChungUrl') > 0,
  'SELECT 1',
  'ALTER TABLE YeuCauNghi ADD COLUMN MinhChungUrl VARCHAR(500) NULL AFTER LyDo'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'YeuCauNghi' AND COLUMN_NAME = 'NgayDeXuat') > 0,
  'SELECT 1',
  'ALTER TABLE YeuCauNghi ADD COLUMN NgayDeXuat DATE NULL AFTER MinhChungUrl'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'YeuCauNghi' AND COLUMN_NAME = 'MaTietDeXuat') > 0,
  'SELECT 1',
  'ALTER TABLE YeuCauNghi ADD COLUMN MaTietDeXuat TINYINT NULL AFTER NgayDeXuat'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'YeuCauNghi' AND COLUMN_NAME = 'MaPhongDeXuat') > 0,
  'SELECT 1',
  'ALTER TABLE YeuCauNghi ADD COLUMN MaPhongDeXuat VARCHAR(30) NULL AFTER MaTietDeXuat'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'YeuCauNghi' AND COLUMN_NAME = 'MaGiangVienDeXuat') > 0,
  'SELECT 1',
  'ALTER TABLE YeuCauNghi ADD COLUMN MaGiangVienDeXuat VARCHAR(10) NULL AFTER MaPhongDeXuat'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. Bổ sung cột TieuDe cho ThongBao
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'ThongBao' AND COLUMN_NAME = 'TieuDe') > 0,
  'SELECT 1',
  'ALTER TABLE ThongBao ADD COLUMN TieuDe VARCHAR(255) NULL AFTER UserId'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 4. Bổ sung Resources mới
INSERT IGNORE INTO Resources (ResourceId, ResourceName, Description) VALUES
('BienDongLich', 'Giám sát biến động lịch', 'Quản lý và giám sát biến động lịch giảng dạy toàn trường và theo bộ môn'),
('DuyetYeuCau', 'Duyệt yêu cầu lịch giảng dạy', 'Duyệt các yêu cầu nghỉ, đổi ca, phân công dạy thay');

-- 5. Cấp quyền RolePermissions
-- ADMIN: Toàn quyền
INSERT INTO RolePermissions (RoleId, ResourceId, CanCreate, CanRead, CanUpdate, CanDelete)
VALUES 
('ADMIN', 'BienDongLich', 1, 1, 1, 1),
('ADMIN', 'DuyetYeuCau', 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE CanCreate=1, CanRead=1, CanUpdate=1, CanDelete=1;

-- PHONGDAOTAO: Toàn quyền xem, duyệt, thu hồi (CanRead=1, CanUpdate=1)
INSERT INTO RolePermissions (RoleId, ResourceId, CanCreate, CanRead, CanUpdate, CanDelete)
VALUES 
('PHONGDAOTAO', 'BienDongLich', 1, 1, 1, 1),
('PHONGDAOTAO', 'DuyetYeuCau', 1, 1, 1, 1),
('PHONGDAOTAO', 'YeuCauNghi', 1, 1, 1, 1),
('PHONGDAOTAO', 'PhanCongDayThay', 1, 1, 1, 1),
('PHONGDAOTAO', 'DangKyDayBu', 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE CanCreate=1, CanRead=1, CanUpdate=1, CanDelete=1;

-- BOMON: Xem biến động bộ môn (CanRead=1), duyệt yêu cầu (CanRead=1, CanUpdate=1), phân công dạy thay (CanCreate=1, CanRead=1, CanUpdate=1)
INSERT INTO RolePermissions (RoleId, ResourceId, CanCreate, CanRead, CanUpdate, CanDelete)
VALUES 
('BOMON', 'BienDongLich', 0, 1, 0, 0),
('BOMON', 'DuyetYeuCau', 0, 1, 1, 0),
('BOMON', 'YeuCauNghi', 0, 1, 1, 0),
('BOMON', 'PhanCongDayThay', 1, 1, 1, 0),
('BOMON', 'DangKyDayBu', 0, 1, 0, 0)
ON DUPLICATE KEY UPDATE CanRead=VALUES(CanRead), CanUpdate=VALUES(CanUpdate), CanCreate=VALUES(CanCreate);

-- GIANGVIEN: Đơn của mình
INSERT INTO RolePermissions (RoleId, ResourceId, CanCreate, CanRead, CanUpdate, CanDelete)
VALUES 
('GIANGVIEN', 'YeuCauNghi', 1, 1, 1, 1),
('GIANGVIEN', 'DangKyDayBu', 1, 1, 0, 0),
('GIANGVIEN', 'PhanCongDayThay', 1, 1, 0, 0),
('GIANGVIEN', 'ThongBao', 0, 1, 1, 0)
ON DUPLICATE KEY UPDATE CanRead=VALUES(CanRead), CanCreate=VALUES(CanCreate), CanUpdate=VALUES(CanUpdate);
