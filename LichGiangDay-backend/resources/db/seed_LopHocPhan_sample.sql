-- ============================================================
-- SCRIPT NẠP LỚP HỌC PHẦN MẪU ĐÚNG ĐỊNH DẠNG TÊN (CHUẨN TÍN CHỈ)
-- ============================================================

-- 1. Nạp Lớp học phần vào bảng LopHocPhan
INSERT INTO LopHocPhan (
  MaLopHocPhan, TenLopHocPhan, MaMonHoc, MaHocKy, LoaiHoc, 
  SiSoDuKien, SiSoDangKy, TrangThaiPhanCong, MaGiangVien, 
  MaBoMon, KhoaHoc, NgayBatDau, NgayKetThuc, SoTuan
) VALUES 
('IT1.217.3.2627.1.QT01.K65', 'Lập trình Web 1-1-26 (QT01)', 'IT1.217.3', 'HK1_26_27', 'LT', 60, 58, 'Unassigned', NULL, 'MHT', 'K65', '2026-08-10', '2026-11-18', 15),
('IT1.217.3.2627.1.TH1.QT01.K65', 'Lập trình Web 1-1-26 TH1 (QT01)', 'IT1.217.3', 'HK1_26_27', 'TH', 30, 29, 'Unassigned', NULL, 'MHT', 'K65', '2026-08-10', '2026-11-18', 15),
('IT1.217.3.2627.1.TH2.QT01.K65', 'Lập trình Web 1-1-26 TH2 (QT01)', 'IT1.217.3', 'HK1_26_27', 'TH', 30, 29, 'Unassigned', NULL, 'MHT', 'K65', '2026-08-10', '2026-11-18', 15),
('IT1.230.3.2627.1.QT01.K64', 'Quản trị mạng 1-1-26 (QT01)', 'IT1.230.3', 'HK1_26_27', 'LT', 55, 50, 'Unassigned', NULL, 'MHT', 'K64', '2026-08-10', '2026-11-18', 15),
('IT1.230.3.2627.1.TH1.QT01.K64', 'Quản trị mạng 1-1-26 TH1 (QT01)', 'IT1.230.3', 'HK1_26_27', 'TH', 28, 25, 'Unassigned', NULL, 'MHT', 'K64', '2026-08-10', '2026-11-18', 15),
('IT1.230.3.2627.1.TH2.QT01.K64', 'Quản trị mạng 1-1-26 TH2 (QT01)', 'IT1.230.3', 'HK1_26_27', 'TH', 27, 25, 'Unassigned', NULL, 'MHT', 'K64', '2026-08-10', '2026-11-18', 15),
('IT1.106.3.2627.1.QT01.K65', 'Thiết kế Web 1-1-26 (QT01)', 'IT1.106.3', 'HK1_26_27', 'LT', 50, 48, 'Unassigned', NULL, 'MHT', 'K65', '2026-08-10', '2026-11-18', 15),
('IT1.106.3.2627.1.TH1.QT01.K65', 'Thiết kế Web 1-1-26 TH (QT01)', 'IT1.106.3', 'HK1_26_27', 'TH', 50, 48, 'Unassigned', NULL, 'MHT', 'K65', '2026-08-10', '2026-11-18', 15),
('IT1.112.3.2627.1.QT01.K66', 'Nguyên lý hệ điều hành 1-1-26 (QT01)', 'IT1.112.3', 'HK1_26_27', 'LT', 70, 65, 'Unassigned', NULL, 'MHT', 'K66', '2026-08-10', '2026-11-18', 15),
('IT1.112.3.2627.1.2.QT01.K66', 'Nguyên lý hệ điều hành 1-1-26 BT (QT01)', 'IT1.112.3', 'HK1_26_27', 'BT', 70, 65, 'Unassigned', NULL, 'MHT', 'K66', '2026-08-10', '2026-11-18', 15),
('IT1.305.3.2627.1.QT01.K64', 'Lưu trữ và xử lý dữ liệu lớn 1-1-26 (QT01)', 'IT1.305.3', 'HK1_26_27', 'LT', 45, 42, 'Unassigned', NULL, 'MHT', 'K64', '2026-08-10', '2026-11-18', 15),
('IT1.649.3.2627.1.QT01.K64', 'An toàn và bảo mật mạng 1-1-26 (QT01)', 'IT1.649.3', 'HK1_26_27', 'LT', 50, 47, 'Unassigned', NULL, 'MHT', 'K64', '2026-08-10', '2026-11-18', 15)
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

-- 2. Gắn lớp sinh viên vào Lớp học phần ghép (LopHocPhan_LopSinhVien)
INSERT INTO LopHocPhan_LopSinhVien (MaLopHocPhan, MaLopSinhVien) VALUES
('IT1.217.3.2627.1.QT01.K65', 'CNTTVA1.65'),
('IT1.217.3.2627.1.TH1.QT01.K65', 'CNTTVA1.65'),
('IT1.217.3.2627.1.TH2.QT01.K65', 'CNTTVA1.65'),
('IT1.230.3.2627.1.QT01.K64', 'CNTT1.64'),
('IT1.230.3.2627.1.QT01.K64', 'CNTT2.64'),
('IT1.230.3.2627.1.TH1.QT01.K64', 'CNTT1.64'),
('IT1.230.3.2627.1.TH2.QT01.K64', 'CNTT2.64'),
('IT1.106.3.2627.1.QT01.K65', 'CNTTVA2.65'),
('IT1.106.3.2627.1.TH1.QT01.K65', 'CNTTVA2.65'),
('IT1.112.3.2627.1.QT01.K66', 'CNTT3.64'),
('IT1.112.3.2627.1.2.QT01.K66', 'CNTT3.64'),
('IT1.305.3.2627.1.QT01.K64', 'CNTTVA2.64'),
('IT1.649.3.2627.1.QT01.K64', 'KNTTVA1.64')
ON DUPLICATE KEY UPDATE MaLopSinhVien = VALUES(MaLopSinhVien);

