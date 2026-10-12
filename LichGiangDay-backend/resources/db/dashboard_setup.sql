-- ============================================================
-- Thêm resource Dashboard vào bảng Resources
-- và cấp quyền CanRead cho role ADMIN (các role khác cần cấp thêm thủ công)
-- ============================================================

INSERT INTO Resources (ResourceId, ResourceName, Description)
VALUES ('Dashboard', 'Dashboard Thống Kê', 'Xem tổng quan số liệu dữ liệu nền')
ON DUPLICATE KEY UPDATE ResourceName = VALUES(ResourceName);

-- Cấp quyền CanRead cho ADMIN (nếu chưa có)
INSERT INTO RolePermissions (RoleId, ResourceId, CanRead, CanCreate, CanUpdate, CanDelete)
VALUES ('ADMIN', 'Dashboard', 1, 0, 0, 0)
ON DUPLICATE KEY UPDATE CanRead = 1;

-- ============================================================
-- Bổ sung INDEX cho các cột khóa ngoại hay dùng GROUP BY / JOIN
-- trong dashboard (kiểm tra trước khi chạy, một số có thể đã có)
-- ============================================================

-- PhongHoc.MaToaNha
CREATE INDEX IF NOT EXISTS IX_PhongHoc_MaToaNha ON PhongHoc (MaToaNha);

-- BoMon.MaKhoa
CREATE INDEX IF NOT EXISTS IX_BoMon_MaKhoa ON BoMon (MaKhoa);

-- GiangVien.MaBoMon
CREATE INDEX IF NOT EXISTS IX_GiangVien_MaBoMon ON GiangVien (MaBoMon);

-- MonHoc.MaBoMon
CREATE INDEX IF NOT EXISTS IX_MonHoc_MaBoMon ON MonHoc (MaBoMon);

-- LopSinhVien.MaKhoa
CREATE INDEX IF NOT EXISTS IX_LopSinhVien_MaKhoa ON LopSinhVien (MaKhoa);

-- LopHocPhan.MaHocKy (có thể đã có trong IX_LopHocPhan_HocKy_BoMon)
CREATE INDEX IF NOT EXISTS IX_LopHocPhan_MaHocKy ON LopHocPhan (MaHocKy);

-- LopHocPhan.MaMonHoc
CREATE INDEX IF NOT EXISTS IX_LopHocPhan_MaMonHoc ON LopHocPhan (MaMonHoc);

-- LopHocPhan.MaBoMon (có thể đã có trong IX_LopHocPhan_HocKy_BoMon)
CREATE INDEX IF NOT EXISTS IX_LopHocPhan_MaBoMon ON LopHocPhan (MaBoMon);
