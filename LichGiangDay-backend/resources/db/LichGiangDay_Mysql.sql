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
    MaPhong        VARCHAR(10)     NOT NULL,
    TenPhong       VARCHAR(20)     NOT NULL,
    MaToaNha       VARCHAR(10)     NOT NULL,
    SucChua        INT             NOT NULL,
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
    MaLopHocPhan       VARCHAR(30)     NOT NULL,
    MaMonHoc           VARCHAR(10)     NOT NULL,
    MaHocKy            VARCHAR(10)     NOT NULL,
    LoaiHoc            VARCHAR(5)      NOT NULL,
    SoLuongDangKyMoi   INT             NOT NULL DEFAULT 0,
    SoLuongHocLai      INT             NOT NULL DEFAULT 0,
    MaGiangVien        VARCHAR(10)     NULL,
    NgayBatDau         DATE            NOT NULL,
    NgayKetThuc        DATE            NOT NULL,
    SoTuan             INT             NOT NULL,
    MaBoMon            VARCHAR(10)     NOT NULL,
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
        REFERENCES BoMon (MaBoMon)
);


-- Mot lop hoc phan co the hoc chung voi nhieu lop sinh vien
CREATE TABLE LopHocPhan_LopSinhVien (
    MaLopHocPhan       VARCHAR(30)     NOT NULL,
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
    MaThoiKhoaBieu     VARCHAR(20)     NOT NULL,
    MaLopHocPhan       VARCHAR(30)     NOT NULL,
    ThuTrongTuan       TINYINT         NOT NULL,
    MaTietBatDau       TINYINT         NOT NULL,
    MaTietKetThuc      TINYINT         NOT NULL,
    MaPhong            VARCHAR(10)     NOT NULL,
    TrangThai          VARCHAR(20)     NOT NULL DEFAULT 'Scheduled',
    ThoiGianSuaDoi       DATETIME       NULL,  -- PĐT sửa lần cuối lúc nào
    ThoiGianBoMonXacNhan DATETIME       NULL,  -- bộ môn bấm "Đã xem" lúc nào

    CONSTRAINT PK_ThoiKhoaBieu
        PRIMARY KEY (MaThoiKhoaBieu),

    CONSTRAINT FK_ThoiKhoaBieu_LopHocPhan
        FOREIGN KEY (MaLopHocPhan)
        REFERENCES LopHocPhan (MaLopHocPhan),

    CONSTRAINT FK_ThoiKhoaBieu_TietBatDau
        FOREIGN KEY (MaTietBatDau)
        REFERENCES TietHoc (MaTiet),

    CONSTRAINT FK_ThoiKhoaBieu_TietKetThuc
        FOREIGN KEY (MaTietKetThuc)
        REFERENCES TietHoc (MaTiet),

    CONSTRAINT FK_ThoiKhoaBieu_PhongHoc
        FOREIGN KEY (MaPhong)
        REFERENCES PhongHoc (MaPhong)
);


CREATE TABLE BuoiHoc (
    MaBuoiHoc          VARCHAR(20)     NOT NULL,
    MaThoiKhoaBieu     VARCHAR(20)     NULL,
    MaLopHocPhan       VARCHAR(30)     NOT NULL,
    NgayHoc            DATE            NOT NULL,
    MaTietBatDau       TINYINT         NOT NULL,
    MaTietKetThuc      TINYINT         NOT NULL,
    MaPhong            VARCHAR(10)     NOT NULL,
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

    CONSTRAINT FK_BuoiHoc_TietBatDau
        FOREIGN KEY (MaTietBatDau)
        REFERENCES TietHoc (MaTiet),

    CONSTRAINT FK_BuoiHoc_TietKetThuc
        FOREIGN KEY (MaTietKetThuc)
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
    MaLopHocPhan        VARCHAR(30)     NOT NULL,
    ThoiGianDangKy      DATETIME       NOT NULL,
    NgayDeXuat          DATE            NOT NULL,
    MaTietBatDau        TINYINT         NOT NULL,
    MaTietKetThuc       TINYINT         NOT NULL,
    MaPhong             VARCHAR(10)     NOT NULL,
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

    CONSTRAINT FK_DangKyDayBu_TietBatDau
        FOREIGN KEY (MaTietBatDau)
        REFERENCES TietHoc (MaTiet),

    CONSTRAINT FK_DangKyDayBu_TietKetThuc
        FOREIGN KEY (MaTietKetThuc)
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
    MaLopHocPhanDaTao      VARCHAR(30)     NULL,
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
    MaThongBao          VARCHAR(20)     NOT NULL,
    UserId              VARCHAR(15)     NOT NULL,
    NoiDung             VARCHAR(500)   NOT NULL,
    LoaiThongBao        VARCHAR(30)     NULL,
    ThoiGianGui         DATETIME       NOT NULL,
    DaDoc               TINYINT(1)             NOT NULL DEFAULT 0,
    MaDoiTuongLienQuan  VARCHAR(20)     NULL,

    CONSTRAINT PK_ThongBao
        PRIMARY KEY (MaThongBao),

    CONSTRAINT FK_ThongBao_Users
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
    ADD COLUMN ThoiGianXacNhanCaDay DATETIME NULL;  -- GV bam "Xac nhan" trong khung gio ca
