/* ============================================================
   HE THONG QUAN LY THOI KHOA BIEU GIANG VIEN
   Target: MySQL
   ============================================================ */


-- ============================================================
-- 1. DU LIEU DANH MUC
-- ============================================================

CREATE TABLE ToaNha (
    MaToaNha       VARCHAR(10)     NOT NULL,
    TenToaNha      VARCHAR(100)   NOT NULL,
    CoSo           VARCHAR(100)   NULL,
    DiaChi         VARCHAR(255)   NULL,

    CONSTRAINT PK_ToaNha
        PRIMARY KEY (MaToaNha)
);


CREATE TABLE Khoa (
    MaKhoa         VARCHAR(10)     NOT NULL,
    TenKhoa        VARCHAR(150)   NOT NULL,
    MaTruongKhoa   VARCHAR(10)     NULL,

    CONSTRAINT PK_Khoa
        PRIMARY KEY (MaKhoa)
);


CREATE TABLE BoMon (
    MaBoMon        VARCHAR(10)     NOT NULL,
    TenBoMon       VARCHAR(150)   NOT NULL,
    MaKhoa         VARCHAR(10)     NOT NULL,
    MaTruongBoMon  VARCHAR(10)     NULL,

    CONSTRAINT PK_BoMon
        PRIMARY KEY (MaBoMon),

    CONSTRAINT FK_BoMon_Khoa
        FOREIGN KEY (MaKhoa)
        REFERENCES Khoa (MaKhoa)
);


CREATE TABLE Roles (
    RoleId         VARCHAR(30)     NOT NULL,
    RoleName       VARCHAR(100)   NOT NULL,
    Description    VARCHAR(255)   NULL,
    IsSystem       TINYINT(1)             NOT NULL DEFAULT 0,
    CreatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT PK_Roles
        PRIMARY KEY (RoleId)
);

CREATE TABLE Resources (
    ResourceId     VARCHAR(50)     NOT NULL,
    ResourceName   VARCHAR(150)   NOT NULL,
    Description    VARCHAR(255)   NULL,
    CreatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT PK_Resources
        PRIMARY KEY (ResourceId)
);

CREATE TABLE RolePermissions (
    RoleId         VARCHAR(30)     NOT NULL,
    ResourceId     VARCHAR(50)     NOT NULL,
    CanCreate      TINYINT(1)             NOT NULL DEFAULT 0,
    CanRead        TINYINT(1)             NOT NULL DEFAULT 0,
    CanUpdate      TINYINT(1)             NOT NULL DEFAULT 0,
    CanDelete      TINYINT(1)             NOT NULL DEFAULT 0,
    CreatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT PK_RolePermissions
        PRIMARY KEY (RoleId, ResourceId),

    CONSTRAINT FK_RolePermissions_Roles
        FOREIGN KEY (RoleId)
        REFERENCES Roles (RoleId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT FK_RolePermissions_Resources
        FOREIGN KEY (ResourceId)
        REFERENCES Resources (ResourceId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Users (
    UserId         VARCHAR(15)     NOT NULL,
    Username       VARCHAR(50)     NOT NULL,
    PasswordHash   VARCHAR(255)    NOT NULL,
    FullName       VARCHAR(100)   NULL,
    Email          VARCHAR(150)   NULL,
    Role           VARCHAR(30)     NOT NULL,
    IsActive       TINYINT(1)             NOT NULL DEFAULT 1,
    CreatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT PK_Users
        PRIMARY KEY (UserId),

    CONSTRAINT UQ_Users_Username
        UNIQUE (Username),

    CONSTRAINT FK_Users_Roles
        FOREIGN KEY (Role)
        REFERENCES Roles (RoleId)
);

CREATE TABLE ApiKeys (
    ApiKeyId       INT AUTO_INCREMENT NOT NULL,
    `Key`          VARCHAR(255)   NOT NULL,
    Status         TINYINT(1)             NOT NULL DEFAULT 1,
    Permissions    LONGTEXT   NULL,
    CreatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT PK_ApiKeys
        PRIMARY KEY (ApiKeyId),

    CONSTRAINT UQ_ApiKeys_Key
        UNIQUE (`Key`)
);

CREATE TABLE KeyTokens (
    KeyTokenId     INT AUTO_INCREMENT NOT NULL,
    UserId         VARCHAR(15)     NOT NULL,
    PrivateKey     LONGTEXT   NOT NULL,
    PublicKey      LONGTEXT   NOT NULL,
    RefreshToken   LONGTEXT   NULL,
    RefreshTokensUsed LONGTEXT NULL,
    CreatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT PK_KeyTokens
        PRIMARY KEY (KeyTokenId),

    CONSTRAINT UQ_KeyTokens_UserId
        UNIQUE (UserId),

    CONSTRAINT FK_KeyTokens_Users
        FOREIGN KEY (UserId)
        REFERENCES Users (UserId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


CREATE TABLE GiangVien (
    MaGiangVien    VARCHAR(10)     NOT NULL,
    UserId         VARCHAR(15)     NULL,
    HoTen          VARCHAR(100)   NOT NULL,
    Email          VARCHAR(100)    NULL,
    SoDienThoai    VARCHAR(15)     NULL,
    MaBoMon        VARCHAR(10)     NULL,
    TrangThai      VARCHAR(20)     NOT NULL DEFAULT 'Active',

    CONSTRAINT PK_GiangVien
        PRIMARY KEY (MaGiangVien),

    CONSTRAINT FK_GiangVien_Users
        FOREIGN KEY (UserId)
        REFERENCES Users (UserId),

    CONSTRAINT FK_GiangVien_BoMon
        FOREIGN KEY (MaBoMon)
        REFERENCES BoMon (MaBoMon)
);


-- Dong tham chieu vong Khoa <-> GiangVien
ALTER TABLE Khoa
    ADD CONSTRAINT FK_Khoa_TruongKhoa
        FOREIGN KEY (MaTruongKhoa)
        REFERENCES GiangVien (MaGiangVien);

-- Dong tham chieu vong BoMon <-> GiangVien
ALTER TABLE BoMon
    ADD CONSTRAINT FK_BoMon_TruongBoMon
        FOREIGN KEY (MaTruongBoMon)
        REFERENCES GiangVien (MaGiangVien);


CREATE TABLE PhongHoc (
    MaPhong        VARCHAR(30)     NOT NULL,
    TenPhong       VARCHAR(50)     NOT NULL,
    MaToaNha       VARCHAR(10)     NOT NULL,
    SucChua        INT             NULL,
    LoaiPhong      VARCHAR(30)     NULL,
    TrangThai      VARCHAR(20)     NOT NULL DEFAULT 'Ready',

    CONSTRAINT PK_PhongHoc
        PRIMARY KEY (MaPhong),

    CONSTRAINT FK_PhongHoc_ToaNha
        FOREIGN KEY (MaToaNha)
        REFERENCES ToaNha (MaToaNha)
);


CREATE TABLE TietHoc (
    MaTiet         TINYINT         NOT NULL,
    TenTiet        VARCHAR(50)    NOT NULL,
    GioBatDau      TIME            NOT NULL,
    GioKetThuc     TIME            NOT NULL,

    CONSTRAINT PK_TietHoc
        PRIMARY KEY (MaTiet)
);


CREATE TABLE HocKy (
    MaHocKy        VARCHAR(10)     NOT NULL,
    TenHocKy       VARCHAR(50)    NOT NULL,
    Dot            TINYINT         NULL,
    NamHoc         VARCHAR(9)      NULL,
    NgayBatDau     DATE            NOT NULL,
    NgayKetThuc    DATE            NOT NULL,

    CONSTRAINT PK_HocKy
        PRIMARY KEY (MaHocKy)
);


CREATE TABLE MonHoc (
    MaMonHoc       VARCHAR(10)     NOT NULL,
    TenMonHoc      VARCHAR(150)   NOT NULL,
    SoTinChi       INT             NULL,
    MaBoMon        VARCHAR(10)     NULL,
    LoaiMonHoc     VARCHAR(20)     NOT NULL DEFAULT 'Regular',

    CONSTRAINT PK_MonHoc
        PRIMARY KEY (MaMonHoc),

    CONSTRAINT FK_MonHoc_BoMon
        FOREIGN KEY (MaBoMon)
        REFERENCES BoMon (MaBoMon)
);


-- Khoa sinh vien (nien khoa K62..K65)
CREATE TABLE KhoaSinhVien (
    MaKhoaSinhVien VARCHAR(10)  NOT NULL,
    TenKhoaSinhVien VARCHAR(50) NOT NULL,

    CONSTRAINT PK_KhoaSinhVien
        PRIMARY KEY (MaKhoaSinhVien)
);

INSERT INTO KhoaSinhVien (MaKhoaSinhVien, TenKhoaSinhVien) VALUES
    ('K62', 'Khoa 62'),
    ('K63', 'Khoa 63'),
    ('K64', 'Khoa 64'),
    ('K65', 'Khoa 65');


-- ============================================================
-- 2. LOP SINH VIEN
-- ============================================================

CREATE TABLE LopSinhVien (
    MaLopSinhVien      VARCHAR(20)     NOT NULL,
    TenLopSinhVien     VARCHAR(150)   NOT NULL,
    MaKhoa             VARCHAR(10)     NOT NULL,

    CONSTRAINT PK_LopSinhVien
        PRIMARY KEY (MaLopSinhVien),

    CONSTRAINT FK_LopSinhVien_Khoa
        FOREIGN KEY (MaKhoa)
        REFERENCES Khoa (MaKhoa)
);

-- ============================================================
-- 3. LOP HOC PHAN
-- ============================================================
CREATE TABLE LopHocPhan (
    MaLopHocPhan       VARCHAR(100)    NOT NULL,
    TenLopHocPhan      VARCHAR(255)    NULL,
    MaMonHoc           VARCHAR(10)     NOT NULL,
    MaHocKy            VARCHAR(10)     NOT NULL,
    LoaiHoc            VARCHAR(5)      NOT NULL,
    SiSoDuKien         INT             NULL,
    SiSoDangKy         INT             NULL,
    MaGiangVien        VARCHAR(10)     NULL,
    NgayBatDau         DATE            NOT NULL,
    NgayKetThuc        DATE            NOT NULL,
    SoTuan             INT             NOT NULL,
    MaBoMon            VARCHAR(10)     NOT NULL,
    KhoaHoc            VARCHAR(10)     NULL,
    TrangThaiPhanCong  VARCHAR(20)     NOT NULL DEFAULT 'Unassigned',

    CONSTRAINT PK_LopHocPhan
        PRIMARY KEY (MaLopHocPhan),

    CONSTRAINT FK_LopHocPhan_MonHoc
        FOREIGN KEY (MaMonHoc)
        REFERENCES MonHoc (MaMonHoc),

    CONSTRAINT FK_LopHocPhan_HocKy
        FOREIGN KEY (MaHocKy)
        REFERENCES HocKy (MaHocKy),

    CONSTRAINT FK_LopHocPhan_GiangVien
        FOREIGN KEY (MaGiangVien)
        REFERENCES GiangVien (MaGiangVien),

    CONSTRAINT FK_LopHocPhan_BoMon
        FOREIGN KEY (MaBoMon)
        REFERENCES BoMon (MaBoMon),

    CONSTRAINT FK_LopHocPhan_KhoaSinhVien
        FOREIGN KEY (KhoaHoc)
        REFERENCES KhoaSinhVien (MaKhoaSinhVien)
);


-- Mot lop hoc phan co the hoc chung voi nhieu lop sinh vien
CREATE TABLE LopHocPhan_LopSinhVien (
    MaLopHocPhan       VARCHAR(100)    NOT NULL,
    MaLopSinhVien      VARCHAR(20)     NOT NULL,

    CONSTRAINT PK_LopHocPhan_LopSinhVien
        PRIMARY KEY (MaLopHocPhan, MaLopSinhVien),

    CONSTRAINT FK_LHL_LopHocPhan
        FOREIGN KEY (MaLopHocPhan)
        REFERENCES LopHocPhan (MaLopHocPhan),

    CONSTRAINT FK_LHL_LopSinhVien
        FOREIGN KEY (MaLopSinhVien)
        REFERENCES LopSinhVien (MaLopSinhVien)
);


-- ============================================================
-- 4. THOI KHOA BIEU VA BUOI HOC
-- ============================================================

CREATE TABLE ThoiKhoaBieu (
    MaThoiKhoaBieu     VARCHAR(120)    NOT NULL,
    MaLopHocPhan       VARCHAR(100)    NOT NULL,
    ThuTrongTuan       TINYINT         NOT NULL,
    MaTiet             TINYINT         NOT NULL,
    MaPhong            VARCHAR(30)     NOT NULL,
    NgayBatDau         DATE            NOT NULL,
    NgayKetThuc        DATE            NOT NULL,
    TrangThai          VARCHAR(20)     NOT NULL DEFAULT 'Scheduled',
    ThoiGianSuaDoi       DATETIME       NULL,  -- PĐT sửa lần cuối lúc nào
    ThoiGianBoMonXacNhan DATETIME       NULL,  -- bộ môn bấm "Đã xem" lúc nào

    CONSTRAINT PK_ThoiKhoaBieu
        PRIMARY KEY (MaThoiKhoaBieu),

    CONSTRAINT FK_ThoiKhoaBieu_LopHocPhan
        FOREIGN KEY (MaLopHocPhan)
        REFERENCES LopHocPhan (MaLopHocPhan),

    CONSTRAINT FK_ThoiKhoaBieu_TietHoc
        FOREIGN KEY (MaTiet)
        REFERENCES TietHoc (MaTiet),

    CONSTRAINT FK_ThoiKhoaBieu_PhongHoc
        FOREIGN KEY (MaPhong)
        REFERENCES PhongHoc (MaPhong)
);


CREATE TABLE BuoiHoc (
    MaBuoiHoc          VARCHAR(20)     NOT NULL,
    MaThoiKhoaBieu     VARCHAR(120)    NULL,
    MaLopHocPhan       VARCHAR(100)    NOT NULL,
    NgayHoc            DATE            NOT NULL,
    MaTiet             TINYINT         NOT NULL,
    MaPhong            VARCHAR(30)     NOT NULL,
    MaGiangVien        VARCHAR(10)     NOT NULL,
    LoaiBuoiHoc        VARCHAR(20)     NOT NULL DEFAULT 'Regular',
    TrangThai          VARCHAR(30)     NOT NULL DEFAULT 'Normal',
    MaBuoiHocGoc       VARCHAR(20)     NULL,

    CONSTRAINT PK_BuoiHoc
        PRIMARY KEY (MaBuoiHoc),

    CONSTRAINT FK_BuoiHoc_ThoiKhoaBieu
        FOREIGN KEY (MaThoiKhoaBieu)
        REFERENCES ThoiKhoaBieu (MaThoiKhoaBieu),

    CONSTRAINT FK_BuoiHoc_LopHocPhan
        FOREIGN KEY (MaLopHocPhan)
        REFERENCES LopHocPhan (MaLopHocPhan),

    CONSTRAINT FK_BuoiHoc_TietHoc
        FOREIGN KEY (MaTiet)
        REFERENCES TietHoc (MaTiet),

    CONSTRAINT FK_BuoiHoc_PhongHoc
        FOREIGN KEY (MaPhong)
        REFERENCES PhongHoc (MaPhong),

    CONSTRAINT FK_BuoiHoc_GiangVien
        FOREIGN KEY (MaGiangVien)
        REFERENCES GiangVien (MaGiangVien),

    CONSTRAINT FK_BuoiHoc_BuoiHocGoc
        FOREIGN KEY (MaBuoiHocGoc)
        REFERENCES BuoiHoc (MaBuoiHoc)
);


-- ============================================================
-- 5. NGHI / DOI LICH / DAY THAY
-- ============================================================

CREATE TABLE YeuCauNghi (
    MaYeuCauNghi       VARCHAR(20)     NOT NULL,
    MaBuoiHoc          VARCHAR(20)     NOT NULL,
    MaGiangVien        VARCHAR(10)     NOT NULL,
    LoaiYeuCau         VARCHAR(10)     NOT NULL,
    LyDo               VARCHAR(255)   NOT NULL,
    ThoiGianGui        DATETIME       NOT NULL,
    TrangThai          VARCHAR(20)     NOT NULL DEFAULT 'Pending',
    MaGiangVienDuyet   VARCHAR(10)     NULL,
    ThoiGianDuyet      DATETIME       NULL,
    LyDoTuChoi         VARCHAR(255)   NULL,

    CONSTRAINT PK_YeuCauNghi
        PRIMARY KEY (MaYeuCauNghi),

    CONSTRAINT FK_YeuCauNghi_BuoiHoc
        FOREIGN KEY (MaBuoiHoc)
        REFERENCES BuoiHoc (MaBuoiHoc),

    CONSTRAINT FK_YeuCauNghi_GiangVien
        FOREIGN KEY (MaGiangVien)
        REFERENCES GiangVien (MaGiangVien),

    CONSTRAINT FK_YeuCauNghi_GiangVienDuyet
        FOREIGN KEY (MaGiangVienDuyet)
        REFERENCES GiangVien (MaGiangVien)
);


CREATE TABLE PhanCongDayThay (
    MaPhanCongDayThay    VARCHAR(20)     NOT NULL,
    MaYeuCauNghi         VARCHAR(20)     NOT NULL,
    MaBuoiHoc            VARCHAR(20)     NOT NULL,
    MaGiangVienDayThay   VARCHAR(10)     NOT NULL,
    ThoiGianPhanCong     DATETIME       NOT NULL,
    TrangThai            VARCHAR(20)     NOT NULL DEFAULT 'Assigned',

    CONSTRAINT PK_PhanCongDayThay
        PRIMARY KEY (MaPhanCongDayThay),

    CONSTRAINT FK_PhanCongDayThay_YeuCauNghi
        FOREIGN KEY (MaYeuCauNghi)
        REFERENCES YeuCauNghi (MaYeuCauNghi),

    CONSTRAINT FK_PhanCongDayThay_BuoiHoc
        FOREIGN KEY (MaBuoiHoc)
        REFERENCES BuoiHoc (MaBuoiHoc),

    CONSTRAINT FK_PhanCongDayThay_GiangVien
        FOREIGN KEY (MaGiangVienDayThay)
        REFERENCES GiangVien (MaGiangVien)
);


-- ============================================================
-- 6. DANG KY DAY BU
-- ============================================================

CREATE TABLE DangKyDayBu (
    MaDangKyDayBu       VARCHAR(20)     NOT NULL,
    MaYeuCauNghi        VARCHAR(20)     NOT NULL,
    MaGiangVien         VARCHAR(10)     NOT NULL,
    MaLopHocPhan        VARCHAR(100)    NOT NULL,
    ThoiGianDangKy      DATETIME       NOT NULL,
    NgayDeXuat          DATE            NOT NULL,
    MaTiet              TINYINT         NOT NULL,
    MaPhong             VARCHAR(30)     NOT NULL,
    TrangThai           VARCHAR(30)     NOT NULL DEFAULT 'Processing',
    LyDoTuChoi          VARCHAR(255)   NULL,
    ThoiGianXacNhan     DATETIME       NULL,
    MaBuoiHocTao        VARCHAR(20)     NULL,

    CONSTRAINT PK_DangKyDayBu
        PRIMARY KEY (MaDangKyDayBu),

    CONSTRAINT FK_DangKyDayBu_YeuCauNghi
        FOREIGN KEY (MaYeuCauNghi)
        REFERENCES YeuCauNghi (MaYeuCauNghi),

    CONSTRAINT FK_DangKyDayBu_GiangVien
        FOREIGN KEY (MaGiangVien)
        REFERENCES GiangVien (MaGiangVien),

    CONSTRAINT FK_DangKyDayBu_LopHocPhan
        FOREIGN KEY (MaLopHocPhan)
        REFERENCES LopHocPhan (MaLopHocPhan),

    CONSTRAINT FK_DangKyDayBu_TietHoc
        FOREIGN KEY (MaTiet)
        REFERENCES TietHoc (MaTiet),

    CONSTRAINT FK_DangKyDayBu_PhongHoc
        FOREIGN KEY (MaPhong)
        REFERENCES PhongHoc (MaPhong),

    CONSTRAINT FK_DangKyDayBu_BuoiHoc
        FOREIGN KEY (MaBuoiHocTao)
        REFERENCES BuoiHoc (MaBuoiHoc)
);


-- ============================================================
-- 7. NHAP THOI KHOA BIEU TU EXCEL
-- ============================================================

CREATE TABLE TepNhap (
    MaTepNhap          VARCHAR(20)     NOT NULL,
    TenTepGoc          VARCHAR(255)    NOT NULL,
    UserId             VARCHAR(15)     NOT NULL,
    MaBoMon            VARCHAR(10)     NOT NULL,
    MaHocKy            VARCHAR(10)     NOT NULL,
    ThoiGianNhap       DATETIME       NOT NULL,
    TrangThai          VARCHAR(20)     NOT NULL DEFAULT 'Processing',
    TongSoDong         INT             NULL,
    SoDongThanhCong    INT             NULL,
    SoDongLoi          INT             NULL,
    ThongTinLoi        LONGTEXT   NULL,

    CONSTRAINT PK_TepNhap
        PRIMARY KEY (MaTepNhap),

    CONSTRAINT FK_TepNhap_Users
        FOREIGN KEY (UserId)
        REFERENCES Users (UserId),

    CONSTRAINT FK_TepNhap_BoMon
        FOREIGN KEY (MaBoMon)
        REFERENCES BoMon (MaBoMon),

    CONSTRAINT FK_TepNhap_HocKy
        FOREIGN KEY (MaHocKy)
        REFERENCES HocKy (MaHocKy)
);


CREATE TABLE ChiTietNhap (
    MaChiTietNhap          BIGINT          AUTO_INCREMENT NOT NULL,
    MaTepNhap              VARCHAR(20)     NOT NULL,
    SoThuTuDong            INT             NOT NULL,
    MaMonHocGoc            VARCHAR(20)     NULL,
    TenLopHocPhanGoc       VARCHAR(255)   NULL,
    LoaiHocGoc             VARCHAR(10)     NULL,
    TenGiangVienGoc        VARCHAR(100)   NULL,
    KhoangThoiGianGoc      VARCHAR(50)     NULL,
    SoTuanGoc              INT             NULL,
    LichHocHangTuanGoc     LONGTEXT   NULL,
    TenLopGhepGoc          VARCHAR(255)   NULL,
    KhoaHoc                VARCHAR(10)     NULL,
    TrangThaiXuLy          VARCHAR(20)     NOT NULL DEFAULT 'Unprocessed',
    MaLopHocPhanDaTao      VARCHAR(100)    NULL,
    GhiChuLoi              VARCHAR(500)   NULL,

    CONSTRAINT PK_ChiTietNhap
        PRIMARY KEY (MaChiTietNhap),

    CONSTRAINT FK_ChiTietNhap_TepNhap
        FOREIGN KEY (MaTepNhap)
        REFERENCES TepNhap (MaTepNhap),

    CONSTRAINT FK_ChiTietNhap_LopHocPhan
        FOREIGN KEY (MaLopHocPhanDaTao)
        REFERENCES LopHocPhan (MaLopHocPhan)
);


-- ============================================================
-- 8. CAC BANG HO TRO
-- ============================================================

CREATE TABLE ThongBao (
    MaThongBao          VARCHAR(30)     NOT NULL,
    UserId              VARCHAR(15)     NOT NULL,
    TieuDe              VARCHAR(255)    NULL,
    NoiDung             VARCHAR(500)    NOT NULL,
    LoaiThongBao        VARCHAR(30)     NULL,
    ThoiGianGui         DATETIME        NOT NULL,
    DaDoc               TINYINT(1)      NOT NULL DEFAULT 0,
    MaDoiTuongLienQuan  VARCHAR(30)     NULL,

    CONSTRAINT PK_ThongBao
        PRIMARY KEY (MaThongBao),

    CONSTRAINT FK_ThongBao_Users
        FOREIGN KEY (UserId)
        REFERENCES Users (UserId)
);


CREATE TABLE ThongBaoDaDoc (
    MaThongBao          VARCHAR(30)     NOT NULL,
    UserId              VARCHAR(15)     NOT NULL,
    TieuDe              VARCHAR(255)    NULL,
    NoiDung             VARCHAR(500)    NOT NULL,
    LoaiThongBao        VARCHAR(30)     NULL,
    ThoiGianGui         DATETIME        NOT NULL,
    ThoiGianDoc         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MaDoiTuongLienQuan  VARCHAR(30)     NULL,

    CONSTRAINT PK_ThongBaoDaDoc
        PRIMARY KEY (MaThongBao),

    CONSTRAINT FK_ThongBaoDaDoc_Users
        FOREIGN KEY (UserId)
        REFERENCES Users (UserId)
);


CREATE TABLE NhatKyHeThong (
    MaNhatKy           BIGINT          AUTO_INCREMENT NOT NULL,
    UserId             VARCHAR(15)     NOT NULL,
    HanhDong           VARCHAR(50)     NOT NULL,
    TenBang            VARCHAR(50)     NOT NULL,
    MaBanGhi           VARCHAR(20)     NOT NULL,
    ThoiGianThucHien   DATETIME       NOT NULL,
    DuLieuTruoc        LONGTEXT   NULL,
    DuLieuSau         LONGTEXT   NULL,

    CONSTRAINT PK_NhatKyHeThong
        PRIMARY KEY (MaNhatKy),

    CONSTRAINT FK_NhatKyHeThong_Users
        FOREIGN KEY (UserId)
        REFERENCES Users (UserId)
);

ALTER TABLE GiangVien
    ADD COLUMN ChuyenMon VARCHAR(255) NULL,
    ADD COLUMN DinhMucGioChuan INT NULL,
    ADD CONSTRAINT CK_GiangVien_DinhMuc CHECK (DinhMucGioChuan IS NULL OR DinhMucGioChuan > 0);

ALTER TABLE BuoiHoc
    ADD COLUMN ThoiGianXacNhanCaDay DATETIME NULL;

-- INDEX HO TRO KIEM TRA TRUNG (US-05)
CREATE INDEX IX_ThoiKhoaBieu_Phong_Thu ON ThoiKhoaBieu (MaPhong, ThuTrongTuan, NgayBatDau, NgayKetThuc);
CREATE INDEX IX_ThoiKhoaBieu_Lop ON ThoiKhoaBieu (MaLopHocPhan);
CREATE INDEX IX_BuoiHoc_Ngay_Phong ON BuoiHoc (NgayHoc, MaPhong);
CREATE INDEX IX_BuoiHoc_Ngay_GiangVien ON BuoiHoc (NgayHoc, MaGiangVien);
CREATE INDEX IX_LopHocPhan_HocKy_BoMon ON LopHocPhan (MaHocKy, MaBoMon);
CREATE INDEX IX_LopHocPhan_KhoaHoc ON LopHocPhan (KhoaHoc);


/* ============================================================
   9. DU LIEU KHOI TAO BAN DAU (SEED DATA)
   ============================================================ */

-- 9.1. Vai tro he thong (Roles)
INSERT INTO Roles (RoleId, RoleName, Description, IsSystem) VALUES
  ('ADMIN', 'Administrator', 'Quản trị viên hệ thống, có tất cả các quyền cấu hình', 1),
  ('BOMON', 'Bộ môn', 'Tài khoản cấp bộ môn', 0),
  ('GIANGVIEN', 'Giảng viên', 'Tài khoản của giảng viên, chỉ có thể xem lịch dạy', 0),
  ('KHOA', 'Khoa', 'Tài khoản cấp khoa', 0),
  ('PHONGDAOTAO', 'Phòng đào tạo đại học', 'Tài khoản của Phòng Đào Tạo đại học', 0)
ON DUPLICATE KEY UPDATE RoleName=VALUES(RoleName), Description=VALUES(Description);

-- 9.2. Danh muc tai nguyen he thong (Resources)
INSERT INTO Resources (ResourceId, ResourceName, Description) VALUES
  ('ApiKeys', 'Quản lý API Keys', 'Tài nguyên Quản lý API Keys'),
  ('BienDongLich', 'Giám sát biến động lịch', 'Quản lý và giám sát biến động lịch giảng dạy toàn trường và theo bộ môn'),
  ('BoMon', 'Quản lý Bộ môn', 'Tài nguyên Quản lý Bộ môn'),
  ('BuoiHoc', 'Quản lý Buổi học', 'Tài nguyên Quản lý Buổi học'),
  ('ChiTietNhap', 'Quản lý Chi tiết nhập', 'Tài nguyên Quản lý Chi tiết nhập'),
  ('DangKyDayBu', 'Quản lý Dạy bù', 'Tài nguyên Quản lý Dạy bù'),
  ('DuyetYeuCau', 'Duyệt yêu cầu lịch giảng dạy', 'Duyệt các yêu cầu nghỉ, đổi ca, phân công dạy thay'),
  ('GiangVien', 'Quản lý Giảng viên', 'Tài nguyên Quản lý Giảng viên'),
  ('HocKy', 'Quản lý Học kỳ', 'Tài nguyên Quản lý Học kỳ'),
  ('KeyTokens', 'Quản lý Tokens', 'Tài nguyên Quản lý Tokens'),
  ('Khoa', 'Quản lý Khoa', 'Tài nguyên Quản lý Khoa'),
  ('LopHocPhan', 'Quản lý Lớp học phần', 'Tài nguyên Quản lý Lớp học phần'),
  ('LopHocPhan_LopSinhVien', 'Quản lý Lớp HP - Sinh viên', 'Tài nguyên Quản lý Lớp HP - Sinh viên'),
  ('LopSinhVien', 'Quản lý Lớp sinh viên', 'Tài nguyên Quản lý Lớp sinh viên'),
  ('MonHoc', 'Quản lý Môn học', 'Tài nguyên Quản lý Môn học'),
  ('NhatKyHeThong', 'Quản lý Nhật ký hệ thống', 'Tài nguyên Quản lý Nhật ký hệ thống'),
  ('PhanCongDayThay', 'Quản lý Dạy thay', 'Tài nguyên Quản lý Dạy thay'),
  ('PhongHoc', 'Quản lý Phòng học', 'Tài nguyên Quản lý Phòng học'),
  ('Resources', 'Quản lý Tài nguyên', 'Tài nguyên Quản lý Tài nguyên'),
  ('RolePermissions', 'Quản lý Phân quyền', 'Tài nguyên Quản lý Phân quyền'),
  ('Roles', 'Quản lý Quyền', 'Tài nguyên Quản lý Quyền'),
  ('TepNhap', 'Quản lý Tệp nhập', 'Tài nguyên Quản lý Tệp nhập'),
  ('ThoiKhoaBieu', 'Quản lý Thời khóa biểu', 'Tài nguyên Quản lý Thời khóa biểu'),
  ('ThongBao', 'Quản lý Thông báo', 'Tài nguyên Quản lý Thông báo'),
  ('ThongBaoDaDoc', 'Quản lý Thông báo đã đọc', 'Lưu trữ lịch sử thông báo đã đọc'),
  ('TietHoc', 'Quản lý Tiết học', 'Tài nguyên Quản lý Tiết học'),
  ('ToaNha', 'Quản lý Tòa nhà', 'Tài nguyên Quản lý Tòa nhà'),
  ('Users', 'Quản lý Người dùng', 'Tài nguyên Quản lý Người dùng'),
  ('YeuCauNghi', 'Quản lý Yêu cầu nghỉ', 'Tài nguyên Quản lý Yêu cầu nghỉ')
ON DUPLICATE KEY UPDATE ResourceName=VALUES(ResourceName), Description=VALUES(Description);

-- 9.3. Phan quyen vai tro (RolePermissions)
INSERT INTO RolePermissions (RoleId, ResourceId, CanCreate, CanRead, CanUpdate, CanDelete) VALUES
  ('ADMIN', 'ApiKeys', 1, 1, 1, 1),
  ('ADMIN', 'BienDongLich', 1, 1, 1, 1),
  ('ADMIN', 'BoMon', 1, 1, 1, 1),
  ('ADMIN', 'BuoiHoc', 1, 1, 1, 1),
  ('ADMIN', 'ChiTietNhap', 1, 1, 1, 1),
  ('ADMIN', 'DangKyDayBu', 1, 1, 1, 1),
  ('ADMIN', 'DuyetYeuCau', 1, 1, 1, 1),
  ('ADMIN', 'GiangVien', 1, 1, 1, 1),
  ('ADMIN', 'HocKy', 1, 1, 1, 1),
  ('ADMIN', 'KeyTokens', 1, 1, 1, 1),
  ('ADMIN', 'Khoa', 1, 1, 1, 1),
  ('ADMIN', 'LopHocPhan', 1, 1, 1, 1),
  ('ADMIN', 'LopHocPhan_LopSinhVien', 1, 1, 1, 1),
  ('ADMIN', 'LopSinhVien', 1, 1, 1, 1),
  ('ADMIN', 'MonHoc', 1, 1, 1, 1),
  ('ADMIN', 'NhatKyHeThong', 1, 1, 1, 1),
  ('ADMIN', 'PhanCongDayThay', 1, 1, 1, 1),
  ('ADMIN', 'PhongHoc', 1, 1, 1, 1),
  ('ADMIN', 'Resources', 1, 1, 1, 1),
  ('ADMIN', 'RolePermissions', 1, 1, 1, 1),
  ('ADMIN', 'Roles', 1, 1, 1, 1),
  ('ADMIN', 'TepNhap', 1, 1, 1, 1),
  ('ADMIN', 'ThoiKhoaBieu', 1, 1, 1, 1),
  ('ADMIN', 'ThongBao', 1, 1, 1, 1),
  ('ADMIN', 'ThongBaoDaDoc', 1, 1, 1, 1),
  ('ADMIN', 'TietHoc', 1, 1, 1, 1),
  ('ADMIN', 'ToaNha', 1, 1, 1, 1),
  ('ADMIN', 'Users', 1, 1, 1, 1),
  ('ADMIN', 'YeuCauNghi', 1, 1, 1, 1),
  ('BOMON', 'ApiKeys', 0, 0, 0, 0),
  ('BOMON', 'BienDongLich', 0, 1, 0, 0),
  ('BOMON', 'BoMon', 0, 0, 0, 0),
  ('BOMON', 'BuoiHoc', 1, 1, 1, 1),
  ('BOMON', 'ChiTietNhap', 1, 0, 1, 1),
  ('BOMON', 'DangKyDayBu', 0, 1, 0, 1),
  ('BOMON', 'DuyetYeuCau', 0, 1, 1, 0),
  ('BOMON', 'GiangVien', 0, 1, 0, 0),
  ('BOMON', 'HocKy', 0, 0, 0, 0),
  ('BOMON', 'KeyTokens', 0, 0, 0, 0),
  ('BOMON', 'Khoa', 0, 0, 0, 0),
  ('BOMON', 'LopHocPhan', 0, 1, 0, 0),
  ('BOMON', 'LopHocPhan_LopSinhVien', 0, 0, 0, 0),
  ('BOMON', 'LopSinhVien', 0, 0, 0, 0),
  ('BOMON', 'MonHoc', 0, 1, 0, 0),
  ('BOMON', 'NhatKyHeThong', 0, 0, 0, 0),
  ('BOMON', 'PhanCongDayThay', 1, 1, 1, 0),
  ('BOMON', 'PhongHoc', 0, 0, 0, 0),
  ('BOMON', 'Resources', 0, 0, 0, 0),
  ('BOMON', 'RolePermissions', 0, 0, 0, 0),
  ('BOMON', 'Roles', 0, 0, 0, 0),
  ('BOMON', 'TepNhap', 0, 0, 0, 0),
  ('BOMON', 'ThoiKhoaBieu', 1, 1, 1, 1),
  ('BOMON', 'ThongBao', 0, 0, 0, 0),
  ('BOMON', 'ThongBaoDaDoc', 0, 1, 1, 0),
  ('BOMON', 'TietHoc', 0, 0, 0, 0),
  ('BOMON', 'ToaNha', 0, 0, 0, 0),
  ('BOMON', 'Users', 0, 0, 0, 0),
  ('BOMON', 'YeuCauNghi', 0, 1, 1, 1),
  ('GIANGVIEN', 'ApiKeys', 0, 0, 0, 0),
  ('GIANGVIEN', 'BoMon', 0, 1, 0, 0),
  ('GIANGVIEN', 'BuoiHoc', 0, 1, 0, 0),
  ('GIANGVIEN', 'ChiTietNhap', 0, 0, 0, 0),
  ('GIANGVIEN', 'DangKyDayBu', 1, 1, 0, 0),
  ('GIANGVIEN', 'GiangVien', 0, 1, 0, 0),
  ('GIANGVIEN', 'HocKy', 0, 1, 0, 0),
  ('GIANGVIEN', 'KeyTokens', 0, 0, 0, 0),
  ('GIANGVIEN', 'Khoa', 0, 1, 0, 0),
  ('GIANGVIEN', 'LopHocPhan', 0, 1, 0, 0),
  ('GIANGVIEN', 'LopHocPhan_LopSinhVien', 0, 1, 0, 0),
  ('GIANGVIEN', 'LopSinhVien', 0, 1, 0, 0),
  ('GIANGVIEN', 'MonHoc', 0, 1, 0, 0),
  ('GIANGVIEN', 'NhatKyHeThong', 0, 0, 0, 0),
  ('GIANGVIEN', 'PhanCongDayThay', 1, 1, 0, 0),
  ('GIANGVIEN', 'PhongHoc', 0, 1, 0, 0),
  ('GIANGVIEN', 'Resources', 0, 0, 0, 0),
  ('GIANGVIEN', 'RolePermissions', 0, 0, 0, 0),
  ('GIANGVIEN', 'Roles', 0, 0, 0, 0),
  ('GIANGVIEN', 'TepNhap', 0, 0, 0, 0),
  ('GIANGVIEN', 'ThoiKhoaBieu', 0, 1, 0, 0),
  ('GIANGVIEN', 'ThongBao', 0, 1, 1, 0),
  ('GIANGVIEN', 'ThongBaoDaDoc', 0, 1, 1, 0),
  ('GIANGVIEN', 'TietHoc', 0, 1, 0, 0),
  ('GIANGVIEN', 'ToaNha', 0, 1, 0, 0),
  ('GIANGVIEN', 'Users', 0, 0, 0, 0),
  ('GIANGVIEN', 'YeuCauNghi', 1, 1, 1, 1),
  ('KHOA', 'ApiKeys', 0, 0, 0, 0),
  ('KHOA', 'BoMon', 0, 0, 0, 0),
  ('KHOA', 'BuoiHoc', 0, 0, 0, 0),
  ('KHOA', 'ChiTietNhap', 0, 0, 0, 0),
  ('KHOA', 'DangKyDayBu', 0, 0, 0, 0),
  ('KHOA', 'GiangVien', 0, 0, 0, 0),
  ('KHOA', 'HocKy', 0, 0, 0, 0),
  ('KHOA', 'KeyTokens', 0, 0, 0, 0),
  ('KHOA', 'Khoa', 0, 0, 0, 0),
  ('KHOA', 'LopHocPhan', 0, 0, 0, 0),
  ('KHOA', 'LopHocPhan_LopSinhVien', 0, 0, 0, 0),
  ('KHOA', 'LopSinhVien', 0, 0, 0, 0),
  ('KHOA', 'MonHoc', 0, 0, 0, 0),
  ('KHOA', 'NhatKyHeThong', 0, 0, 0, 0),
  ('KHOA', 'PhanCongDayThay', 0, 0, 0, 0),
  ('KHOA', 'PhongHoc', 0, 0, 0, 0),
  ('KHOA', 'Resources', 0, 0, 0, 0),
  ('KHOA', 'RolePermissions', 0, 0, 0, 0),
  ('KHOA', 'Roles', 0, 0, 0, 0),
  ('KHOA', 'TepNhap', 0, 0, 0, 0),
  ('KHOA', 'ThoiKhoaBieu', 0, 0, 0, 0),
  ('KHOA', 'ThongBao', 0, 0, 0, 0),
  ('KHOA', 'TietHoc', 0, 0, 0, 0),
  ('KHOA', 'ToaNha', 0, 0, 0, 0),
  ('KHOA', 'Users', 0, 0, 0, 0),
  ('KHOA', 'YeuCauNghi', 0, 0, 0, 0),
  ('PHONGDAOTAO', 'ApiKeys', 0, 0, 0, 0),
  ('PHONGDAOTAO', 'BienDongLich', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'BoMon', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'BuoiHoc', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'ChiTietNhap', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'DangKyDayBu', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'DuyetYeuCau', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'GiangVien', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'HocKy', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'KeyTokens', 0, 0, 0, 0),
  ('PHONGDAOTAO', 'Khoa', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'LopHocPhan', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'LopHocPhan_LopSinhVien', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'LopSinhVien', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'MonHoc', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'NhatKyHeThong', 0, 0, 0, 0),
  ('PHONGDAOTAO', 'PhanCongDayThay', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'PhongHoc', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'Resources', 0, 0, 0, 0),
  ('PHONGDAOTAO', 'RolePermissions', 0, 0, 0, 0),
  ('PHONGDAOTAO', 'Roles', 0, 0, 0, 0),
  ('PHONGDAOTAO', 'TepNhap', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'ThoiKhoaBieu', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'ThongBao', 0, 0, 0, 0),
  ('PHONGDAOTAO', 'ThongBaoDaDoc', 0, 1, 1, 1),
  ('PHONGDAOTAO', 'TietHoc', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'ToaNha', 1, 1, 1, 1),
  ('PHONGDAOTAO', 'Users', 0, 0, 0, 0),
  ('PHONGDAOTAO', 'YeuCauNghi', 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE CanCreate=VALUES(CanCreate), CanRead=VALUES(CanRead), CanUpdate=VALUES(CanUpdate), CanDelete=VALUES(CanDelete);

-- 9.4. Tai khoan quan tri vien mac dinh (Users - Password: 123456)
INSERT INTO Users (UserId, Username, PasswordHash, FullName, Email, Role, IsActive) VALUES
  ('USR000000000001', 'ADMIN.0001', '$2b$10$cjK/vF.t7Y88podlR1lJ5.4abd83jAp452rdOJj79YDMZoUWKd1k6', 'Admin 01', 'admin@utc.edu.vn', 'ADMIN', 1)
ON DUPLICATE KEY UPDATE PasswordHash=VALUES(PasswordHash), Role=VALUES(Role), IsActive=VALUES(IsActive);

-- 9.5. API Key mac dinh (ApiKeys)
INSERT INTO ApiKeys (`Key`, Status, Permissions) VALUES
  ('lichgiangday_secret_apikey_2026', 1, '0000')
ON DUPLICATE KEY UPDATE Status=VALUES(Status), Permissions=VALUES(Permissions);
