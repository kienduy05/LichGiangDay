# TÀI LIỆU CHI TIẾT NGHIỆP VỤ TỪNG CHỨC NĂNG (FUNCTIONAL BUSINESS SPECIFICATION)

**Dự án**: Hệ thống Quản lý Lịch Giảng Dạy & Thời khóa biểu Trường Đại học (`LichGiangDay`)  
**Phân hệ**: Phân hệ Dữ liệu nền (Master / Base Data)  
**Tác giả**: Business Analyst (BA)  
**Ngày cập nhật**: 19/09/2026  

---

## 1. PHÂN HỆ 1: PHÂN HỆ DỮ LIỆU NỀN

Phân hệ **Dữ liệu nền** (Base Data) quản lý toàn bộ các danh mục thực thể cốt lõi của nhà trường: cơ sở vật chất hạ tầng (Tòa nhà, Phòng học), cơ cấu tổ chức học thuật (Khoa, Bộ môn) và danh mục người dùng/giảng viên. Đây là nền tảng dữ liệu chuẩn xác để phục vụ cho các phân hệ nghiệp vụ tiếp theo như Quản lý Học phần, Lập kế hoạch giảng dạy, Phân công giảng viên và Xếp Thời khóa biểu tự động.

---

### 1.1. Chức năng 1: Quản lý Tòa nhà (`ToaNha`)

- **Bảng dữ liệu tác động trong CSDL**: **`ToaNha`** (`MaToaNha`, `TenToaNha`, `CoSo`, `DiaChi`).
- **Bảng liên quan (Ràng buộc FK)**: **`PhongHoc`** (`PhongHoc.MaToaNha` $\rightarrow$ `ToaNha.MaToaNha`).
- **Resource ID kiểm tra quyền (`checkPermission`)**: `'ToaNha'` (`CanRead`, `CanCreate`, `CanUpdate`, `CanDelete`).

#### 1.1.1. Tìm kiếm & Hiển thị Danh sách Tòa nhà
- **Thao tác người dùng (User Action)**:
  - Người dùng chọn menu `Dữ liệu nền` (hoặc `Danh mục đào tạo`) $\rightarrow$ `Quản lý Tòa nhà`.
  - Nhập từ khóa vào ô tìm kiếm (Mã tòa nhà, Tên tòa nhà, Cơ sở).
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/toanha?search=...`.
  - Hệ thống kiểm tra quyền `CanRead` trên Resource `ToaNha`.
  - Backend thực hiện truy vấn SQL JOIN đếm số lượng phòng học trực thuộc từng tòa nhà:
    ```sql
    SELECT 
      tn.MaToaNha, 
      tn.TenToaNha, 
      tn.CoSo, 
      tn.DiaChi, 
      COUNT(ph.MaPhong) AS SoPhongHoc 
    FROM ToaNha tn 
    LEFT JOIN PhongHoc ph ON tn.MaToaNha = ph.MaToaNha 
    GROUP BY tn.MaToaNha, tn.TenToaNha, tn.CoSo, tn.DiaChi 
    ORDER BY tn.MaToaNha ASC;
    ```
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (Chế độ đọc - `SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Bảng Data Table hiển thị danh sách các tòa nhà kèm badge số lượng phòng học trực thuộc.

#### 1.1.2. Thêm mới Tòa nhà
- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Thêm Tòa Nhà"**.
  - Nhập thông tin trên Form: **Mã tòa nhà** (`MaToaNha`), **Tên tòa nhà** (`TenToaNha`), **Cơ sở** (`CoSo`), **Địa chỉ** (`DiaChi`).
  - Nhấn **"Lưu Tòa Nhà"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanCreate` trên Resource `ToaNha`.
  - **Validation 1**: `MaToaNha` và `TenToaNha` không được để trống.
  - **Validation 2**: Chuẩn hóa `MaToaNha` (Tự động viết hoa `UPPERCASE`, xóa khoảng trắng thừa).
  - **Validation 3 (Check trùng)**: Truy vấn `SELECT MaToaNha FROM ToaNha WHERE MaToaNha = ?`.
    - Nếu đã tồn tại $\rightarrow$ Trả lỗi: *"Mã tòa nhà 'A1' đã tồn tại trong hệ thống."* (HTTP 400).
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Tạo mới 1 dòng bản ghi trong bảng `ToaNha`**:
    ```sql
    INSERT INTO ToaNha (MaToaNha, TenToaNha, CoSo, DiaChi)
    VALUES (?, ?, ?, ?);
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, tải lại bảng dữ liệu, hiển thị dòng tòa nhà mới tạo cùng thông báo thành công.

#### 1.1.3. Cập nhật (Sửa) Thông tin Tòa nhà
- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Sửa"** (Edit) tại dòng tòa nhà tương ứng.
  - Thay đổi **Tên tòa nhà**, **Cơ sở**, hoặc **Địa chỉ**.
  - Nhấn **"Lưu Thay Đổi"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `ToaNha`.
  - Cố định khóa chính `MaToaNha` (Không cho phép sửa Mã tòa nhà để tránh làm đứt gãy quan hệ khóa ngoại với Phòng học).
  - Validation: `TenToaNha` không được để trống.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật các cột của bản ghi trong bảng `ToaNha`**:
    ```sql
    UPDATE ToaNha 
    SET TenToaNha = ?, CoSo = ?, DiaChi = ? 
    WHERE MaToaNha = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, hiển thị toast thông báo *"Cập nhật tòa nhà thành công!"*, dữ liệu trên bảng được làm mới.

#### 1.1.4. Xóa Tòa nhà (Kiểm tra Ràng buộc toàn vẹn)
- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Xóa"** (Trash) tại dòng tòa nhà.
  - Xác nhận trên Popup xác nhận xóa.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanDelete` trên Resource `ToaNha`.
  - **Kiểm tra ràng buộc toàn vẹn CSDL (Data Integrity Constraint)**:
    - Backend truy vấn đếm số lượng phòng học trực thuộc tòa nhà này:
      ```sql
      SELECT COUNT(*) AS total FROM PhongHoc WHERE MaToaNha = ?;
      ```
    - **Trường hợp `total > 0`**: **CHẶN XÓA HOÀN TOÀN**. Trả lỗi HTTP 400 Bad Request: *"Không thể xóa tòa nhà 'A1' vì đang có X phòng học trực thuộc. Vui lòng xóa hoặc di chuyển các phòng học trước."*
    - **Trường hợp `total == 0`**: Tiến hành xóa.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Trường hợp xóa thành công**: Bản ghi bị **XÓA VĨNH VIỄN** khỏi bảng `ToaNha`:
    ```sql
    DELETE FROM ToaNha WHERE MaToaNha = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Tòa nhà bị xóa khỏi CSDL và biến mất khỏi bảng danh sách.

---

### 1.2. Chức năng 2: Quản lý Phòng học (`PhongHoc`)

- **Bảng dữ liệu tác động trong CSDL**: **`PhongHoc`** (`MaPhong`, `TenPhong`, `MaToaNha`, `SucChua`, `LoaiPhong`, `TrangThai`).
- **Bảng liên quan (Ràng buộc FK)**: 
  - `ToaNha` (`PhongHoc.MaToaNha` $\rightarrow$ `ToaNha.MaToaNha`).
  - `ThoiKhoaBieu` (`ThoiKhoaBieu.MaPhong` $\rightarrow$ `PhongHoc.MaPhong`).
  - `BuoiHoc` (`BuoiHoc.MaPhong` $\rightarrow$ `PhongHoc.MaPhong`).
  - `DangKyDayBu` (`DangKyDayBu.MaPhong` $\rightarrow$ `PhongHoc.MaPhong`).
- **Resource ID kiểm tra quyền (`checkPermission`)**: `'PhongHoc'` (`CanRead`, `CanCreate`, `CanUpdate`, `CanDelete`).

> 📌 **CHÚ THÍCH CÁC TRƯỜNG DỮ LIỆU ĐẶC THÙ TRONG CSDL (`PhongHoc`)**:
> - **Cột `TrangThai`**: Lưu giá trị mã chuỗi **`'Ready'`** (Sẵn sàng) hoặc **`'Maintenance'`** (Đang bảo trì).
> - **Cột `LoaiPhong`**: Lưu trực tiếp chuỗi Tiếng Việt thuộc 5 tùy chọn chuẩn hóa:
>   1. `'Phòng lý thuyết'` (Mặc định hệ thống)
>   2. `'Phòng thực hành máy tính'`
>   3. `'Hội trường'`
>   4. `'Phòng thí nghiệm'`
>   5. `'Xưởng thực hành'`

#### 1.2.1. Tìm kiếm, Lọc & Hiển thị Danh sách Phòng học
- **Thao tác người dùng (User Action)**:
  - Người dùng truy cập menu `Dữ liệu nền` $\rightarrow$ `Quản lý Phòng học`.
  - Chọn Bộ lọc: Theo **Tòa nhà** (`MaToaNha`), **Loại phòng** (`LoaiPhong`), **Trạng thái** (`TrangThai`: `Ready` / `Maintenance`) hoặc gõ từ khóa tìm kiếm.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/phonghoc` kèm tham số lọc.
  - Backend kiểm tra quyền `CanRead` trên Resource `PhongHoc`.
  - Backend truy vấn bảng `PhongHoc` kết hợp JOIN với `ToaNha` để lấy tên tòa nhà và cơ sở hiển thị:
    ```sql
    SELECT 
      ph.MaPhong,
      ph.TenPhong,
      ph.MaToaNha,
      tn.TenToaNha,
      tn.CoSo,
      ph.SucChua,
      ph.LoaiPhong,
      ph.TrangThai
    FROM PhongHoc ph
    JOIN ToaNha tn ON ph.MaToaNha = tn.MaToaNha
    ORDER BY ph.MaToaNha ASC, ph.MaPhong ASC;
    ```
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (`SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Hiển thị danh sách phòng học với các Badge trạng thái trực quan:
    - Giá trị CSDL `'Ready'` $\rightarrow$ Hiển thị Badge Xanh lá (**Sẵn sàng**)
    - Giá trị CSDL `'Maintenance'` $\rightarrow$ Hiển thị Badge Cam (**Đang bảo trì**)

#### 1.2.2. Thêm mới Phòng học
- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Thêm Phòng Học"**.
  - Nhập: **Mã phòng** (`MaPhong`), **Tên phòng** (`TenPhong`), Chọn **Tòa nhà** (`MaToaNha`), **Sức chứa** (`SucChua`), **Loại phòng** (`LoaiPhong`).
  - Bấm **"Lưu Phòng Học"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanCreate` trên Resource `PhongHoc`.
  - **Validation 1**: `MaPhong`, `TenPhong`, `MaToaNha` không được để trống.
  - **Validation 2**: `SucChua` phải là số nguyên dương $> 0$ (mặc định nếu để trống là `50`).
  - **Validation 3 (Kiểm tra khóa ngoại `MaToaNha`)**: Tòa nhà được chọn phải tồn tại trong bảng `ToaNha`.
  - **Validation 4 (Kiểm tra trùng mã)**: Truy vấn `SELECT MaPhong FROM PhongHoc WHERE MaPhong = ?`.
    - Nếu đã có $\rightarrow$ Trả lỗi: *"Mã phòng học 'A1-101' đã tồn tại trong hệ thống."* (HTTP 400).
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Tạo mới 1 dòng bản ghi trong bảng `PhongHoc`**:
    ```sql
    INSERT INTO PhongHoc (MaPhong, TenPhong, MaToaNha, SucChua, LoaiPhong, TrangThai)
    VALUES (?, ?, ?, ?, ?, ?);
    ```
    - `TrangThai`: Mặc định CSDL tự động gán giá trị chuỗi là **`'Ready'`** (Sẵn sàng phục vụ giảng dạy).
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, hiển thị phòng học mới trên danh sách với trạng thái **Ready (Sẵn sàng)**.

#### 1.2.3. Cập nhật (Sửa) Thông tin Phòng học
- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Sửa"** tại dòng phòng học.
  - Chỉnh sửa: Tên phòng, Tòa nhà, Sức chứa, Loại phòng, Trạng thái (`Ready` / `Maintenance`).
  - Nhấn **"Lưu Thay Đổi"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `PhongHoc`.
  - Cố định `MaPhong`. Nếu đổi sang `MaToaNha` khác, kiểm tra tòa nhà mới có tồn tại trong hệ thống hay không.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật các cột tương ứng trong bảng `PhongHoc`**:
    ```sql
    UPDATE PhongHoc
    SET TenPhong = ?, MaToaNha = ?, SucChua = ?, LoaiPhong = ?, TrangThai = ?
    WHERE MaPhong = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Cập nhật thông tin bản ghi trong DB, làm mới bảng dữ liệu.

#### 1.2.4. Đổi Trạng thái Vận hành (Toggle Status: Ready ↔ Maintenance)
- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Bảo Trì"** hoặc **"Mở Sẵn Sàng"** nhanh trên bảng danh sách phòng học.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `PhongHoc`.
  - **Trường hợp Chuyển từ `'Ready'` $\rightarrow$ `'Maintenance'`**:
    - Đưa phòng vào trạng thái bảo trì/sửa chữa. Thuật toán xếp thời khóa biểu sẽ loại trừ phòng này khỏi danh sách phòng khả dụng.
  - **Trường hợp Chuyển từ `'Maintenance'` $\rightarrow$ `'Ready'`**:
    - Kích hoạt phòng hoạt động trở lại. Phòng sẽ sẵn sàng để xếp lịch học.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật duy nhất cột `TrangThai` trong bảng `PhongHoc`**:
    ```sql
    UPDATE PhongHoc SET TrangThai = ? WHERE MaPhong = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Badge trạng thái trên dòng phòng học lập tức đổi màu (Xanh lá ↔ Cam) và hiển thị nhãn tương ứng (Ready ↔ Maintenance) ngay lập tức.

#### 1.2.5. Xóa Phòng học (Kiểm tra Ràng buộc toàn vẹn)
- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Xóa"** tại dòng phòng học, xác nhận xóa trên Popup.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanDelete` trên Resource `PhongHoc`.
  - **Kiểm tra ràng buộc toàn vẹn CSDL (3 tầng liên kết)**:
    1. **Kiểm tra Thời khóa biểu (`ThoiKhoaBieu`)**:
       ```sql
       SELECT COUNT(*) AS total FROM ThoiKhoaBieu WHERE MaPhong = ?;
       ```
       - Nếu `total > 0` $\rightarrow$ **CHẶN XÓA**: *"Không thể xóa phòng học 'X' vì đang có N lịch học (Thời khóa biểu) được xếp tại phòng này."*
    2. **Kiểm tra Buổi học (`BuoiHoc`)**:
       ```sql
       SELECT COUNT(*) AS total FROM BuoiHoc WHERE MaPhong = ?;
       ```
       - Nếu `total > 0` $\rightarrow$ **CHẶN XÓA**: *"Không thể xóa phòng học 'X' vì đang có N buổi học được gán cho phòng này."*
    3. **Kiểm tra Đăng ký dạy bù (`DangKyDayBu`)**:
       ```sql
       SELECT COUNT(*) AS total FROM DangKyDayBu WHERE MaPhong = ?;
       ```
       - Nếu `total > 0` $\rightarrow$ **CHẶN XÓA**: *"Không thể xóa phòng học 'X' vì đang có N đơn đăng ký dạy bù tại phòng này."*
    - **Trường hợp cả 3 điều kiện đều bằng 0**: Cho phép xóa.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Trường hợp xóa thành công**: Bản ghi bị **XÓA VĨNH VIỄN** khỏi bảng `PhongHoc`:
    ```sql
    DELETE FROM PhongHoc WHERE MaPhong = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Phòng học bị xóa khỏi CSDL và biến mất khỏi bảng danh sách.

---

### 1.3. Chức năng 3: Quản lý Khoa (`Khoa`)

- **Bảng dữ liệu tác động trong CSDL**: **`Khoa`** (`MaKhoa`, `TenKhoa`, `MaTruongKhoa`).
- **Bảng liên quan (Ràng buộc FK)**: 
  - `BoMon` (`BoMon.MaKhoa` $\rightarrow$ `Khoa.MaKhoa`).
  - `GiangVien` (`Khoa.MaTruongKhoa` $\rightarrow$ `GiangVien.MaGiangVien`).
- **Resource ID kiểm tra quyền (`checkPermission`)**: `'Khoa'` (`CanRead`, `CanCreate`, `CanUpdate`, `CanDelete`).

#### 1.3.1. Tìm kiếm & Hiển thị Danh sách Khoa
- **Thao tác người dùng (User Action)**:
  - Người dùng truy cập menu `Dữ liệu nền` $\rightarrow$ `Quản lý Khoa`.
  - Nhập từ khóa tìm kiếm theo `MaKhoa` hoặc `TenKhoa`.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/khoa?search=...`.
  - Hệ thống kiểm tra quyền `CanRead` trên Resource `Khoa`.
  - Backend thực hiện truy vấn SQL kết hợp:
    - **LEFT JOIN `BoMon`**: Đếm số lượng bộ môn trực thuộc từng khoa (`COUNT(DISTINCT bm.MaBoMon)`).
    - **LEFT JOIN `GiangVien`** (qua `MaTruongKhoa`): Lấy họ tên giảng viên (`gv.HoTen`) làm Trưởng khoa hiển thị ra ngoài UI thay vì chỉ hiện mã.
    ```sql
    SELECT
      k.MaKhoa,
      k.TenKhoa,
      k.MaTruongKhoa,
      gv.HoTen AS TenTruongKhoa,
      COUNT(DISTINCT bm.MaBoMon) AS SoBoMon
    FROM Khoa k
    LEFT JOIN GiangVien gv ON k.MaTruongKhoa = gv.MaGiangVien
    LEFT JOIN BoMon bm ON k.MaKhoa = bm.MaKhoa
    WHERE k.MaKhoa LIKE ? OR k.TenKhoa LIKE ?
    GROUP BY k.MaKhoa, k.TenKhoa, k.MaTruongKhoa, gv.HoTen
    ORDER BY k.MaKhoa ASC;
    ```
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (`SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Bảng danh sách gồm: Mã khoa, Tên khoa, Tên Trưởng khoa (hoặc Badge *"Chưa phân công"* nếu `MaTruongKhoa` là `NULL`), badge số lượng Bộ môn trực thuộc.

#### 1.3.2. Thêm mới Khoa
- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Thêm Khoa"**.
  - Nhập: **Mã khoa** (`MaKhoa`), **Tên khoa** (`TenKhoa`). *Lưu ý: Không nhập Trưởng khoa ở bước này.*
  - Bấm **"Lưu Khoa"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanCreate` trên Resource `Khoa`.
  - **Validation 1**: `MaKhoa` và `TenKhoa` không được để trống.
  - **Validation 2**: Chuẩn hóa `MaKhoa` (Tự động viết hoa `UPPERCASE`, xóa khoảng trắng thừa).
  - **Validation 3 (Check trùng)**: Truy vấn `SELECT MaKhoa FROM Khoa WHERE MaKhoa = ?`.
    - Nếu đã tồn tại $\rightarrow$ Trả lỗi: *"Mã khoa 'CNTT' đã tồn tại."* (HTTP 400).
  - **Quy tắc nghiệp vụ**: Tại thời điểm tạo mới khoa, chưa có Bộ môn và Giảng viên nào thuộc khoa đó trong CSDL để chỉ định làm Trưởng khoa hợp lệ. Do đó, cột `MaTruongKhoa` mặc định được gán `NULL` và sẽ được bổ nhiệm sau bằng chức năng riêng.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Tạo mới 1 dòng bản ghi trong bảng `Khoa`**:
    ```sql
    INSERT INTO Khoa (MaKhoa, TenKhoa, MaTruongKhoa)
    VALUES (?, ?, NULL);
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, tải lại bảng dữ liệu, khoa mới xuất hiện với Trưởng khoa hiển thị là *"Chưa phân công"*.

#### 1.3.3. Cập nhật (Sửa) Thông tin Khoa
- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Sửa"** tại dòng khoa.
  - Chỉnh sửa **Tên khoa** (`TenKhoa`).
  - Nhấn **"Lưu Thay Đổi"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `Khoa`.
  - Cố định khóa chính `MaKhoa` (Không cho phép đổi mã vì `MaKhoa` là khóa ngoại trong bảng `BoMon`, tránh làm đứt gãy quan hệ dữ liệu).
  - Validation: `TenKhoa` không được để trống.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật tên khoa trong bảng `Khoa`**:
    ```sql
    UPDATE Khoa
    SET TenKhoa = ?
    WHERE MaKhoa = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, hiển thị toast thông báo *"Cập nhật khoa thành công!"*, làm mới bảng dữ liệu.

#### 1.3.4. Gán / Thay đổi / Bãi nhiệm Trưởng Khoa
- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Phân công Trưởng khoa"** tại dòng khoa tương ứng.
  - Dropdown hiển thị danh sách Giảng viên đủ điều kiện để chọn, hoặc chọn tùy chọn *"Bãi nhiệm / Chưa phân công"*.
  - Bấm **"Xác nhận"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `Khoa`.
  - **Trường hợp Gán mới / Thay đổi Trưởng khoa** (`maGiangVien` có giá trị):
    - Hệ thống truy vấn danh sách giảng viên hợp lệ: Giảng viên phải thuộc một Bộ môn nằm trong chính Khoa đó (`GiangVien` $\rightarrow$ `BoMon` $\rightarrow$ `Khoa`) và có trạng thái `TrangThai = 'Active'`.
    - Backend kiểm tra hợp lệ:
      - `MaGiangVien` phải tồn tại.
      - Giảng viên phải đang `Active`.
      - Giảng viên phải thuộc Khoa đang phân công.
  - **Trường hợp Bãi nhiệm Trưởng khoa** (`maGiangVien = null`):
    - Cập nhật gán `MaTruongKhoa = NULL` (dùng khi Trưởng khoa nghỉ công tác / chuyển đơn vị).
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật duy nhất cột `MaTruongKhoa` trong bảng `Khoa`**:
    ```sql
    UPDATE Khoa 
    SET MaTruongKhoa = ? 
    WHERE MaKhoa = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Tên Trưởng khoa mới (hoặc trạng thái *"Chưa phân công"*) cập nhật ngay lập tức trên bảng danh sách.

#### 1.3.5. Xem Chi tiết Khoa (Danh sách Bộ môn trực thuộc)
- **Thao tác người dùng (User Action)**:
  - Bấm vào Tên khoa hoặc Mã khoa trên bảng danh sách để mở Modal/Trang chi tiết Khoa.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/khoa/:maKhoa/bomon`.
  - Kiểm tra quyền `CanRead` trên Resource `Khoa`.
  - Backend truy vấn danh sách Bộ môn trực thuộc khoa này kèm đếm số lượng Giảng viên trực thuộc từng bộ môn:
    ```sql
    SELECT
      bm.MaBoMon,
      bm.TenBoMon,
      bm.MaKhoa,
      COUNT(DISTINCT gv.MaGiangVien) AS SoGiangVien
    FROM BoMon bm
    LEFT JOIN GiangVien gv ON bm.MaBoMon = gv.MaBoMon
    WHERE bm.MaKhoa = ?
    GROUP BY bm.MaBoMon, bm.TenBoMon, bm.MaKhoa
    ORDER BY bm.MaBoMon ASC;
    ```
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (`SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Hiển thị thông tin tổng quan của Khoa cùng bảng danh sách các Bộ môn trực thuộc và số lượng Giảng viên tương ứng.

#### 1.3.6. Xóa Khoa (Kiểm tra Ràng buộc toàn vẹn)
- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Xóa"** tại dòng khoa, xác nhận trên Popup.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanDelete` trên Resource `Khoa`.
  - **Kiểm tra ràng buộc toàn vẹn với Bộ môn (`BoMon`)**:
    - Backend truy vấn đếm số lượng Bộ môn trực thuộc khoa:
      ```sql
      SELECT COUNT(*) AS total FROM BoMon WHERE MaKhoa = ?;
      ```
    - **Trường hợp `total > 0`**: **CHẶN XÓA HOÀN TOÀN**. Trả lỗi HTTP 400 Bad Request: *"Không thể xóa Khoa 'CNTT' vì đang chứa X bộ môn. Vui lòng xóa hoặc chuyển các bộ môn sang khoa khác trước."*
    - **Trường hợp `total == 0`**: Cho phép xóa.
    - *Lưu ý về ràng buộc tham chiếu*: Do `Khoa.MaTruongKhoa` tham chiếu tới `GiangVien`, còn `GiangVien.MaBoMon` tham chiếu tới `BoMon`, nên khi khoa không còn Bộ môn trực thuộc thì cũng không có giảng viên trực thuộc, việc xóa Khoa hoàn toàn đảm bảo toàn vẹn dữ liệu.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Trường hợp xóa thành công**: Bản ghi bị **XÓA VĨNH VIỄN** khỏi bảng `Khoa`:
    ```sql
    DELETE FROM Khoa WHERE MaKhoa = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Khoa bị xóa khỏi CSDL và biến mất khỏi bảng danh sách.