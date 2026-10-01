# TÀI LIỆU CHI TIẾT NGHIỆP VỤ TỪNG CHỨC NĂNG (FUNCTIONAL BUSINESS SPECIFICATION)

**Dự án**: Hệ thống Quản lý Lịch Giảng Dạy & Thời khóa biểu Trường Đại học (`LichGiangDay`)  
**Phân hệ**: Phân hệ 1: Dữ liệu nền (Master / Base Data)  
**Tác giả**: Business Analyst (BA)  
**Ngày cập nhật**: 30/09/2026

---

## 1. PHÂN HỆ 1: PHÂN HỆ DỮ LIỆU NỀN

Phân hệ **Dữ liệu nền** (Base Data) quản lý toàn bộ các danh mục thực thể cốt lõi của nhà trường: cơ sở vật chất hạ tầng (Tòa nhà, Phòng học, Tiết học), cơ cấu tổ chức học thuật (Khoa, Bộ môn, Lớp sinh viên, Khóa sinh viên, Học kỳ), và danh mục người dùng/giảng viên. Đây là nền tảng dữ liệu chuẩn xác để phục vụ cho các phân hệ nghiệp vụ tiếp theo như Quản lý Học phần, Lập kế hoạch giảng dạy, Phân công giảng viên và Xếp Thời khóa biểu tự động.

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
    - Nếu đã tồn tại $\rightarrow$ Trả lỗi: _"Mã tòa nhà 'A1' đã tồn tại trong hệ thống."_ (HTTP 400).
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
  - Đóng Modal, hiển thị toast thông báo _"Cập nhật tòa nhà thành công!"_, dữ liệu trên bảng được làm mới.

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
    - **Trường hợp `total > 0`**: **CHẶN XÓA HOÀN TOÀN**. Trả lỗi HTTP 400 Bad Request: _"Không thể xóa tòa nhà 'A1' vì đang có X phòng học trực thuộc. Vui lòng xóa hoặc di chuyển các phòng học trước."_
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
>
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
    - Nếu đã có $\rightarrow$ Trả lỗi: _"Mã phòng học 'A1-101' đã tồn tại trong hệ thống."_ (HTTP 400).
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

       - Nếu `total > 0` $\rightarrow$ **CHẶN XÓA**: _"Không thể xóa phòng học 'X' vì đang có N lịch học (Thời khóa biểu) được xếp tại phòng này."_
    2. **Kiểm tra Buổi học (`BuoiHoc`)**:
       ```sql
       SELECT COUNT(*) AS total FROM BuoiHoc WHERE MaPhong = ?;
       ```

       - Nếu `total > 0` $\rightarrow$ **CHẶN XÓA**: _"Không thể xóa phòng học 'X' vì đang có N buổi học được gán cho phòng này."_
    3. **Kiểm tra Đăng ký dạy bù (`DangKyDayBu`)**:
       ```sql
       SELECT COUNT(*) AS total FROM DangKyDayBu WHERE MaPhong = ?;
       ```

       - Nếu `total > 0` $\rightarrow$ **CHẶN XÓA**: _"Không thể xóa phòng học 'X' vì đang có N đơn đăng ký dạy bù tại phòng này."_
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
  - `LopSinhVien` (`LopSinhVien.MaKhoa` $\rightarrow$ `Khoa.MaKhoa`).
  - `GiangVien` (`Khoa.MaTruongKhoa` $\rightarrow$ `GiangVien.MaGiangVien`).
- **Resource ID kiểm tra quyền (`checkPermission`)**: `'Khoa'` (`CanRead`, `CanCreate`, `CanUpdate`, `CanDelete`).

> 📌 **CHÚ THÍCH ĐẶC THÙ NGHIỆP VỤ (`Khoa`)**:
>
> - Cột `MaTruongKhoa`: Cho phép `NULL`. Tại thời điểm tạo mới Khoa, `MaTruongKhoa` luôn mặc định là `NULL` do chưa có giảng viên thuộc khoa để phân công. Việc gán/bãi nhiệm Trưởng khoa được thực hiện qua chức năng phân công riêng.
> - Giảng viên được phân công làm Trưởng khoa phải thuộc một Bộ môn trực thuộc chính Khoa đó và đang ở trạng thái `Active`.

#### 1.3.1. Tìm kiếm & Hiển thị Danh sách Khoa

- **Thao tác người dùng (User Action)**:
  - Người dùng truy cập menu `Dữ liệu nền` (hoặc `Danh mục đào tạo`) $\rightarrow$ `Quản lý Khoa`.
  - Nhập từ khóa vào ô tìm kiếm theo Mã khoa (`MaKhoa`) hoặc Tên khoa (`TenKhoa`).
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/khoa?search=...`.
  - Hệ thống kiểm tra quyền `CanRead` trên Resource `Khoa`.
  - Backend thực hiện truy vấn `LEFT JOIN BoMon` để đếm số lượng bộ môn trực thuộc và `LEFT JOIN GiangVien` (qua `MaTruongKhoa`) để lấy họ tên Trưởng khoa:
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
  - Bảng Data Table hiển thị danh sách các khoa: Mã khoa, Tên khoa, Tên Trưởng khoa (hoặc nhãn _"Chưa phân công"_ nếu `MaTruongKhoa` là `NULL`), badge số lượng Bộ môn trực thuộc.

#### 1.3.2. Thêm mới Khoa

- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Thêm Khoa"**.
  - Nhập thông tin trên Form: **Mã khoa** (`MaKhoa`), **Tên khoa** (`TenKhoa`).
  - Nhấn **"Lưu Khoa"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanCreate` trên Resource `Khoa`.
  - **Validation 1**: `MaKhoa` và `TenKhoa` không được để trống.
  - **Validation 2**: Chuẩn hóa `MaKhoa` (Viết hoa `UPPERCASE`, xóa khoảng trắng thừa).
  - **Validation 3 (Check trùng mã)**:
    ```sql
    SELECT MaKhoa FROM Khoa WHERE MaKhoa = ? LIMIT 1;
    ```

    - Nếu đã tồn tại $\rightarrow$ Trả lỗi: _"Mã khoa 'CNTT' đã tồn tại trong hệ thống."_ (HTTP 400).
  - Cột `MaTruongKhoa` tự động gán giá trị mặc định `NULL`.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Tạo mới 1 dòng bản ghi trong bảng `Khoa`**:
    ```sql
    INSERT INTO Khoa (MaKhoa, TenKhoa, MaTruongKhoa)
    VALUES (?, ?, NULL);
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, tải lại danh sách, khoa mới xuất hiện với cột Trưởng khoa là _"Chưa phân công"_.

#### 1.3.3. Cập nhật (Sửa) Thông tin Khoa

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Sửa"** tại dòng khoa cần cập nhật.
  - Thay đổi **Tên khoa** (`TenKhoa`).
  - Nhấn **"Lưu Thay Đổi"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `Khoa`.
  - Khóa cố định khóa chính `MaKhoa` (Không cho phép sửa mã khoa để bảo toàn toàn vẹn dữ liệu với `BoMon` và `LopSinhVien`).
  - Validation: `TenKhoa` không được để trống.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật thông tin trong bảng `Khoa`**:
    ```sql
    UPDATE Khoa
    SET TenKhoa = ?
    WHERE MaKhoa = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, thông báo toast _"Cập nhật khoa thành công!"_, làm mới dữ liệu bảng.

#### 1.3.4. Phân công / Bãi nhiệm Trưởng khoa

- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Phân công Trưởng khoa"** tại dòng khoa tương ứng.
  - Chọn Giảng viên từ Dropdown danh sách (hoặc chọn _"Bãi nhiệm / Để trống"_ nếu muốn hủy phân công).
  - Nhấn **"Xác Nhận"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `Khoa`.
  - **Trường hợp Bãi nhiệm (`maGiangVien` là `null`)**:
    - Cập nhật `MaTruongKhoa = NULL`.
  - **Trường hợp Gán mới / Đổi Trưởng khoa**:
    - Backend kiểm tra giảng viên:
      ```sql
      SELECT gv.MaGiangVien, gv.HoTen, gv.TrangThai, bm.MaKhoa AS MaKhoaGV
      FROM GiangVien gv
      JOIN BoMon bm ON gv.MaBoMon = bm.MaBoMon
      WHERE gv.MaGiangVien = ?
      LIMIT 1;
      ```
    - **Validation**: Giảng viên phải tồn tại, đang ở trạng thái `Active`, và có `MaKhoaGV` trùng khớp với `MaKhoa` của Khoa được phân công.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật cột `MaTruongKhoa` trong bảng `Khoa`**:
    ```sql
    UPDATE Khoa SET MaTruongKhoa = ? WHERE MaKhoa = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Tên Trưởng khoa mới hiển thị ngay trên bảng danh sách, hiển thị toast thông báo thành công.

#### 1.3.5. Xem Chi tiết Khoa (Danh sách Bộ môn trực thuộc)

- **Thao tác người dùng (User Action)**:
  - Bấm vào Tên/Mã khoa để mở trang xem chi tiết.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/khoa/:maKhoa/bomon`.
  - Backend thực hiện truy vấn danh sách các Bộ môn trực thuộc kèm số lượng giảng viên từng bộ môn:
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
  - Màn hình chi tiết hiển thị thông tin Khoa kèm bảng danh sách Bộ môn trực thuộc, hỗ trợ điều hướng nhanh sang Quản lý Bộ môn.

#### 1.3.6. Xóa Khoa (Kiểm tra Ràng buộc toàn vẹn)

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Xóa"** tại dòng khoa, xác nhận trên Popup.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanDelete` trên Resource `Khoa`.
  - **Kiểm tra ràng buộc Bộ môn (`BoMon`)**:
    ```sql
    SELECT COUNT(*) AS total FROM BoMon WHERE MaKhoa = ?;
    ```

    - **Trường hợp `total > 0`**: **CHẶN XÓA HOÀN TOÀN**. Trả lỗi HTTP 400: _"Không thể xóa Khoa 'CNTT' vì đang chứa N bộ môn trực thuộc. Vui lòng xóa hoặc chuyển các bộ môn sang khoa khác trước."_
    - **Trường hợp `total == 0`**: Cho phép xóa.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Trường hợp đủ điều kiện xóa**: Bản ghi bị **XÓA VĨNH VIỄN** khỏi bảng `Khoa`:
    ```sql
    DELETE FROM Khoa WHERE MaKhoa = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Khoa bị xóa khỏi CSDL và biến mất khỏi bảng danh sách.

---

### 1.4. Chức năng 4: Quản lý Bộ môn (`BoMon`)

- **Bảng dữ liệu tác động trong CSDL**: **`BoMon`** (`MaBoMon`, `TenBoMon`, `MaKhoa`, `MaTruongBoMon`).
- **Bảng liên quan (Ràng buộc FK)**:
  - `Khoa` (`BoMon.MaKhoa` $\rightarrow$ `Khoa.MaKhoa`).
  - `GiangVien` (`BoMon.MaTruongBoMon` $\rightarrow$ `GiangVien.MaGiangVien`, `GiangVien.MaBoMon` $\rightarrow$ `BoMon.MaBoMon`).
  - `MonHoc` (`MonHoc.MaBoMon` $\rightarrow$ `BoMon.MaBoMon`).
  - `LopHocPhan` (`LopHocPhan.MaBoMon` $\rightarrow$ `BoMon.MaBoMon`).
  - `TepNhap` (`TepNhap.MaBoMon` $\rightarrow$ `BoMon.MaBoMon`).
- **Resource ID kiểm tra quyền (`checkPermission`)**: `'BoMon'` (`CanRead`, `CanCreate`, `CanUpdate`, `CanDelete`).

> 📌 **CHÚ THÍCH ĐẶC THÙ NGHIỆP VỤ (`BoMon`)**:
>
> - Cột `MaTruongBoMon`: Mặc định `NULL` khi tạo mới.
> - Cột `MaKhoa`: Bắt buộc (`NOT NULL`), mỗi Bộ môn phải trực thuộc một Khoa quản lý xác định.

#### 1.4.1. Lọc & Hiển thị Danh sách Bộ môn theo Khoa

- **Thao tác người dùng (User Action)**:
  - Người dùng truy cập menu `Dữ liệu nền` $\rightarrow$ `Quản lý Bộ môn`.
  - Chọn Bộ lọc: Dropdown **Khoa** (`MaKhoa`) mặc định _"Tất cả các Khoa"_ hoặc chọn 1 Khoa cụ thể; có thể nhập từ khóa tìm kiếm theo Tên bộ môn hoặc Mã bộ môn.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/bomon?maKhoa=...`.
  - Kiểm tra quyền `CanRead` trên Resource `BoMon`.
  - Backend thực hiện truy vấn `LEFT JOIN Khoa`, `LEFT JOIN GiangVien` (lấy tên Trưởng bộ môn), đồng thời đếm số Giảng viên và số Môn học thuộc từng bộ môn:
    ```sql
    SELECT
      bm.MaBoMon,
      bm.TenBoMon,
      bm.MaKhoa,
      bm.MaTruongBoMon,
      k.TenKhoa,
      gv.HoTen AS TenTruongBoMon,
      COUNT(DISTINCT gv2.MaGiangVien) AS SoGiangVien,
      COUNT(DISTINCT mh.MaMonHoc) AS SoMonHoc
    FROM BoMon bm
    LEFT JOIN Khoa k ON bm.MaKhoa = k.MaKhoa
    LEFT JOIN GiangVien gv ON bm.MaTruongBoMon = gv.MaGiangVien
    LEFT JOIN GiangVien gv2 ON bm.MaBoMon = gv2.MaBoMon
    LEFT JOIN MonHoc mh ON bm.MaBoMon = mh.MaBoMon
    WHERE bm.MaKhoa = ?
    GROUP BY bm.MaBoMon, bm.TenBoMon, bm.MaKhoa, bm.MaTruongBoMon, k.TenKhoa, gv.HoTen
    ORDER BY bm.MaKhoa ASC, bm.MaBoMon ASC;
    ```
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (`SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Bảng dữ liệu hiển thị: Mã bộ môn, Tên bộ môn, Khoa trực thuộc, Tên Trưởng bộ môn (hoặc nhãn _"Chưa phân công"_), badge số Giảng viên, badge số Môn học.

#### 1.4.2. Thêm mới Bộ môn

- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Thêm Bộ Môn"**.
  - Nhập: **Mã bộ môn** (`MaBoMon`), **Tên bộ môn** (`TenBoMon`), chọn **Khoa trực thuộc** (`MaKhoa`) từ Dropdown.
  - Nhấn **"Lưu Bộ Môn"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanCreate` trên Resource `BoMon`.
  - **Validation 1**: `MaBoMon`, `TenBoMon`, `MaKhoa` không được để trống.
  - **Validation 2**: Chuẩn hóa `MaBoMon` (Tự động viết hoa `UPPERCASE`, xóa khoảng trắng thừa).
  - **Validation 3 (Kiểm tra khóa ngoại `MaKhoa`)**: Khoa được chọn phải tồn tại trong bảng `Khoa`.
  - **Validation 4 (Check trùng mã)**:
    ```sql
    SELECT MaBoMon FROM BoMon WHERE MaBoMon = ? LIMIT 1;
    ```

    - Nếu đã tồn tại $\rightarrow$ Trả lỗi: _"Mã bộ môn 'CNPM' đã tồn tại."_ (HTTP 400).
  - Cột `MaTruongBoMon` tự động gán `NULL`.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Tạo mới 1 dòng bản ghi trong bảng `BoMon`**:
    ```sql
    INSERT INTO BoMon (MaBoMon, TenBoMon, MaKhoa, MaTruongBoMon)
    VALUES (?, ?, ?, NULL);
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, làm mới danh sách, bộ môn mới hiện trên bảng với Trưởng bộ môn là _"Chưa phân công"_.

#### 1.4.3. Cập nhật (Sửa) Thông tin Bộ môn

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Sửa"** tại dòng bộ môn.
  - Chỉnh sửa **Tên bộ môn** (`TenBoMon`) và/hoặc chọn lại **Khoa trực thuộc** (`MaKhoa`).
  - Nhấn **"Lưu Thay Đổi"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `BoMon`.
  - Khóa cố định `MaBoMon` (Không cho phép sửa mã bộ môn).
  - **Validation**: `TenBoMon` không được để trống; `MaKhoa` mới phải tồn tại trong bảng `Khoa`.
  - **Cảnh báo nghiệp vụ khi đổi Khoa trực thuộc**: Nếu bộ môn đang có `MaTruongBoMon`, hệ thống trả thêm cờ cảnh báo `warnTruongBoMon` để Admin rà soát lại nhân sự.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật thông tin trong bảng `BoMon`**:
    ```sql
    UPDATE BoMon
    SET TenBoMon = ?, MaKhoa = ?
    WHERE MaBoMon = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, thông báo _"Cập nhật bộ môn thành công!"_, làm mới dữ liệu bảng.

#### 1.4.4. Xem Chi tiết Bộ môn (Giảng viên & Môn học trực thuộc)

- **Thao tác người dùng (User Action)**:
  - Bấm vào Tên/Mã bộ môn để xem trang chi tiết.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/bomon/:maBoMon/detail`.
  - Backend thực hiện truy vấn đồng thời danh sách Giảng viên và Môn học thuộc bộ môn:

    ```sql
    -- Lấy danh sách Giảng viên trực thuộc
    SELECT gv.MaGiangVien, gv.HoTen, gv.Email, gv.SoDienThoai, gv.TrangThai
    FROM GiangVien gv
    WHERE gv.MaBoMon = ?
    ORDER BY gv.HoTen ASC;

    -- Lấy danh sách Môn học trực thuộc
    SELECT mh.MaMonHoc, mh.TenMonHoc, mh.SoTinChi, mh.LoaiMonHoc
    FROM MonHoc mh
    WHERE mh.MaBoMon = ?
    ORDER BY mh.MaMonHoc ASC;
    ```

- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (`SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Giao diện chi tiết hiển thị 2 Tab con: _"Danh sách Giảng viên"_ và _"Danh sách Môn học"_, hỗ trợ điều hướng nhanh sang phân hệ tương ứng.

#### 1.4.5. Xóa Bộ môn (Kiểm tra Ràng buộc toàn vẹn — 3 bảng con)

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Xóa"** tại dòng bộ môn, xác nhận trên Popup.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanDelete` trên Resource `BoMon`.
  - **Kiểm tra tuần tự 3 ràng buộc toàn vẹn CSDL**:
    1. **Kiểm tra Giảng viên (`GiangVien`)**:
       ```sql
       SELECT COUNT(*) AS total FROM GiangVien WHERE MaBoMon = ?;
       ```

       - Nếu `total > 0` $\rightarrow$ **CHẶN XÓA**: _"Không thể xóa Bộ môn 'X' vì đang có N giảng viên trực thuộc. Vui lòng chuyển giảng viên sang bộ môn khác trước."_
    2. **Kiểm tra Môn học (`MonHoc`)**:
       ```sql
       SELECT COUNT(*) AS total FROM MonHoc WHERE MaBoMon = ?;
       ```

       - Nếu `total > 0` $\rightarrow$ **CHẶN XÓA**: _"Không thể xóa Bộ môn 'X' vì đang có N môn học trực thuộc. Vui lòng xóa hoặc chuyển các môn học trước."_
    3. **Kiểm tra Tệp nhập liệu (`TepNhap`)**:
       ```sql
       SELECT COUNT(*) AS total FROM TepNhap WHERE MaBoMon = ?;
       ```

       - Nếu `total > 0` $\rightarrow$ **CHẶN XÓA**: _"Không thể xóa Bộ môn 'X' vì đang có N tệp nhập liệu liên quan để bảo toàn lịch sử."_
    - Chỉ khi cả 3 điều kiện đều bằng 0 mới cho phép xóa.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Trường hợp xóa thành công**: Bản ghi bị **XÓA VĨNH VIỄN** khỏi bảng `BoMon`:
    ```sql
    DELETE FROM BoMon WHERE MaBoMon = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Bộ môn bị xóa khỏi CSDL và biến mất khỏi bảng danh sách.

---

### 1.5. Chức năng 5: Quản lý Giảng viên (`GiangVien`)

- **Bảng dữ liệu tác động trong CSDL**: **`GiangVien`** (`MaGiangVien`, `UserId`, `HoTen`, `Email`, `SoDienThoai`, `MaBoMon`, `TrangThai`).
- **Bảng liên quan (Ràng buộc FK)**:
  - `Users` (`GiangVien.UserId` $\rightarrow$ `Users.UserId`).
  - `BoMon` (`GiangVien.MaBoMon` $\rightarrow$ `BoMon.MaBoMon`, `BoMon.MaTruongBoMon` $\rightarrow$ `GiangVien.MaGiangVien`).
  - `Khoa` (`Khoa.MaTruongKhoa` $\rightarrow$ `GiangVien.MaGiangVien`).
  - `LopHocPhan` (`LopHocPhan.MaGiangVien` $\rightarrow$ `GiangVien.MaGiangVien`).
  - `BuoiHoc` (`BuoiHoc.MaGiangVien` $\rightarrow$ `GiangVien.MaGiangVien`).
  - `YeuCauNghi` (`YeuCauNghi.MaGiangVien`, `YeuCauNghi.MaGiangVienDuyet`).
  - `PhanCongDayThay` (`PhanCongDayThay.MaGiangVienDayThay`).
  - `DangKyDayBu` (`DangKyDayBu.MaGiangVien`).
- **Resource ID kiểm tra quyền (`checkPermission`)**: `'GiangVien'` (`CanRead`, `CanCreate`, `CanUpdate`, `CanDelete`).

> 📌 **CHÚ THÍCH CÁC TRƯỜNG DỮ LIỆU ĐẶC THÙ TRONG CSDL (`GiangVien`)**:
>
> - **Cột `TrangThai`**: Mặc định là **`'Active'`** (Đang công tác/giảng dạy) hoặc **`'Inactive'`** (Ngừng công tác).
> - **Cột `MaBoMon`**: Cho phép `NULL` (giảng viên mới tiếp nhận chưa phân bổ bộ môn cụ thể).
> - **Cột `UserId`**: Khóa ngoại liên kết tài khoản đăng nhập người dùng (cho phép `NULL` nếu chưa tạo tài khoản hệ thống).

#### 1.5.1. Tìm kiếm, Lọc & Hiển thị Danh sách Giảng viên

- **Thao tác người dùng (User Action)**:
  - Truy cập menu `Dữ liệu nền` $\rightarrow$ `Quản lý Giảng viên`.
  - Chọn Bộ lọc: Theo **Bộ môn** (`MaBoMon` — dropdown gồm danh sách Bộ môn, lựa chọn _"Tất cả Bộ môn"_, và _"Chưa phân bộ môn"_ để lọc `MaBoMon IS NULL`), theo **Trạng thái** (`TrangThai`: `Active` / `Inactive`), hoặc nhập từ khóa tìm kiếm theo Họ tên, Email, Mã giảng viên.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/giangvien?maBoMon=...&trangThai=...&search=...`.
  - Backend kiểm tra quyền `CanRead` trên Resource `GiangVien`.
  - Backend thực hiện truy vấn `LEFT JOIN BoMon` (lấy tên bộ môn) và `LEFT JOIN Users` (kiểm tra trạng thái liên kết tài khoản):
    ```sql
    SELECT
      gv.MaGiangVien,
      gv.HoTen,
      gv.Email,
      gv.SoDienThoai,
      gv.MaBoMon,
      gv.TrangThai,
      bm.TenBoMon,
      CASE WHEN gv.UserId IS NOT NULL THEN 1 ELSE 0 END AS DaLienKetTaiKhoan
    FROM GiangVien gv
    LEFT JOIN BoMon bm ON gv.MaBoMon = bm.MaBoMon
    LEFT JOIN Users u ON gv.UserId = u.UserId
    WHERE (gv.HoTen LIKE ? OR gv.Email LIKE ? OR gv.MaGiangVien LIKE ?)
    ORDER BY gv.MaBoMon ASC, gv.HoTen ASC;
    ```
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (`SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Bảng danh sách gồm: Mã GV, Họ tên, Email, SĐT, Bộ môn trực thuộc (hoặc _"Chưa phân công"_), Badge trạng thái (**Active** = Xanh lá / **Inactive** = Xám), badge báo hiệu tình trạng liên kết tài khoản.

#### 1.5.2. Thêm mới Giảng viên

- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Thêm Giảng Viên"**.
  - Nhập: **Mã giảng viên** (`MaGiangVien`), **Họ tên** (`HoTen`), **Email**, **Số điện thoại**, chọn **Bộ môn** (`MaBoMon` — có thể để trống).
  - Nhấn **"Lưu Giảng Viên"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanCreate` trên Resource `GiangVien`.
  - **Validation 1**: `MaGiangVien` và `HoTen` bắt buộc không được để trống.
  - **Validation 2**: Chuẩn hóa `MaGiangVien` (Viết hoa `UPPERCASE`, xóa khoảng trắng thừa).
  - **Validation 3 (Check trùng mã)**:
    ```sql
    SELECT MaGiangVien FROM GiangVien WHERE MaGiangVien = ? LIMIT 1;
    ```

    - Nếu đã tồn tại $\rightarrow$ Trả lỗi: _"Mã giảng viên đã tồn tại."_ (HTTP 400).
  - **Validation 4 (Kiểm tra khóa ngoại `MaBoMon`)**: Nếu có chọn Bộ môn, Bộ môn đó phải tồn tại trong bảng `BoMon`; nếu không chọn thì lưu giá trị `NULL`.
  - **Validation 5**: Kiểm tra đúng định dạng Email và Số điện thoại hợp lệ nếu người dùng có nhập.
  - CSDL tự động gán `TrangThai = 'Active'` và `UserId = NULL`.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Tạo mới 1 dòng bản ghi trong bảng `GiangVien`**:
    ```sql
    INSERT INTO GiangVien (MaGiangVien, HoTen, Email, SoDienThoai, MaBoMon, TrangThai, UserId)
    VALUES (?, ?, ?, ?, ?, 'Active', NULL);
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, tải lại bảng danh sách, giảng viên mới hiện diện với trạng thái **Active** và tài khoản _"Chưa liên kết"_.

#### 1.5.3. Cập nhật (Sửa) Thông tin Giảng viên

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Sửa"** tại dòng giảng viên.
  - Chỉnh sửa: Họ tên, Email, Số điện thoại, chọn lại Bộ môn trực thuộc.
  - Nhấn **"Lưu Thay Đổi"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `GiangVien`.
  - Khóa cố định `MaGiangVien` (Không cho phép sửa mã giảng viên vì là khóa ngoại trong rất nhiều bảng giao dịch).
  - Validation: `HoTen` không được trống; kiểm tra định dạng Email, SĐT; kiểm tra `MaBoMon` mới hợp lệ nếu có chọn.
  - **Cảnh báo nghiệp vụ khi chuyển Bộ môn**: Nếu giảng viên đang là Trưởng bộ môn hoặc Trưởng khoa, backend gửi cờ `warnLanhDao = true` để nhắc nhở Admin kiểm tra lại phân công lãnh đạo.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật thông tin trong bảng `GiangVien`**:
    ```sql
    UPDATE GiangVien
    SET HoTen = ?, Email = ?, SoDienThoai = ?, MaBoMon = ?
    WHERE MaGiangVien = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, hiển thị toast _"Cập nhật giảng viên thành công!"_, làm mới dữ liệu trên bảng.

#### 1.5.4. Đổi Trạng thái Vận hành (Toggle Status: Active ↔ Inactive)

- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Ngừng công tác"** hoặc **"Kích hoạt lại"** nhanh trên bảng danh sách.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `GiangVien`.
  - **Trường hợp Chuyển sang `'Inactive'`**:
    - Backend kiểm tra các lớp học phần chưa hoàn tất và buổi học sắp diễn ra:

      ```sql
      SELECT COUNT(*) AS cnt FROM LopHocPhan
      WHERE MaGiangVien = ? AND TrangThaiPhanCong NOT IN ('Completed', 'Cancelled');

      SELECT COUNT(*) AS cnt FROM BuoiHoc
      WHERE MaGiangVien = ? AND NgayHoc >= CURDATE();
      ```

    - Nếu có hoạt động đang diễn ra $\rightarrow$ Trả thông điệp cảnh báo xác nhận cho Admin trước khi thực hiện.

  - **Trường hợp Chuyển sang `'Active'`**:
    - Giảng viên được kích hoạt trở lại và sẵn sàng được gợi ý phân công giảng dạy.

- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật duy nhất cột `TrangThai` trong bảng `GiangVien`**:
    ```sql
    UPDATE GiangVien SET TrangThai = ? WHERE MaGiangVien = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Badge trạng thái trên dòng đổi màu tức thời (Xanh lá ↔ Xám) kèm nhãn tương ứng (**Active ↔ Inactive**).

#### 1.5.5. Xem Chi tiết Giảng viên (Lịch dạy & Hoạt động liên quan)

- **Thao tác người dùng (User Action)**:
  - Bấm vào Tên/Mã giảng viên để xem trang chi tiết.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/giangvien/:maGiangVien/detail`.
  - Backend thực hiện tổng hợp dữ liệu đa bảng:

    ```sql
    -- 1. Danh sách Lớp học phần đang phụ trách
    SELECT lhp.MaLopHocPhan, lhp.TenLopHocPhan, mh.TenMonHoc, hk.TenHocKy, lhp.TrangThaiPhanCong
    FROM LopHocPhan lhp
    LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
    LEFT JOIN HocKy hk ON lhp.MaHocKy = hk.MaHocKy
    WHERE lhp.MaGiangVien = ?
    ORDER BY lhp.NgayBatDau DESC;

    -- 2. Lịch sử Yêu cầu nghỉ
    SELECT ycn.MaYeuCauNghi, ycn.LoaiYeuCau, ycn.LyDo, ycn.ThoiGianGui, ycn.TrangThai, bh.NgayHoc
    FROM YeuCauNghi ycn
    LEFT JOIN BuoiHoc bh ON ycn.MaBuoiHoc = bh.MaBuoiHoc
    WHERE ycn.MaGiangVien = ?
    ORDER BY ycn.ThoiGianGui DESC LIMIT 50;

    -- 3. Lịch sử Dạy thay
    SELECT pcdt.MaPhanCongDayThay, pcdt.ThoiGianPhanCong, pcdt.TrangThai, bh.NgayHoc, bh.MaLopHocPhan
    FROM PhanCongDayThay pcdt
    LEFT JOIN BuoiHoc bh ON pcdt.MaBuoiHoc = bh.MaBuoiHoc
    WHERE pcdt.MaGiangVienDayThay = ?
    ORDER BY pcdt.ThoiGianPhanCong DESC LIMIT 50;

    -- 4. Lịch sử Đăng ký dạy bù
    SELECT dkdb.MaDangKyDayBu, dkdb.ThoiGianDangKy, dkdb.NgayDeXuat, dkdb.TrangThai, dkdb.MaLopHocPhan
    FROM DangKyDayBu dkdb
    WHERE dkdb.MaGiangVien = ?
    ORDER BY dkdb.ThoiGianDangKy DESC LIMIT 50;
    ```

- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (`SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Màn hình chi tiết hiển thị các Tab chuyên biệt: _"Lớp học phần đang dạy"_, _"Lịch sử xin nghỉ"_, _"Lịch sử dạy thay"_, _"Lịch sử dạy bù"_.

#### 1.5.6. Xóa Giảng viên (Kiểm tra Ràng buộc toàn vẹn — 7 bảng)

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Xóa"** tại dòng giảng viên, xác nhận trên Popup.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanDelete` trên Resource `GiangVien`.
  - **Kiểm tra tuần tự qua 7 bảng dữ liệu liên kết**:
    1. `Khoa.MaTruongKhoa`: Đang là Trưởng khoa?
    2. `BoMon.MaTruongBoMon`: Đang là Trưởng bộ môn?
    3. `LopHocPhan.MaGiangVien`: Đang phụ trách lớp học phần nào không?
    4. `BuoiHoc.MaGiangVien`: Đã từng có buổi học nào trong lịch sử không?
    5. `YeuCauNghi`: Có yêu cầu nghỉ đã gửi hoặc đã duyệt không?
    6. `PhanCongDayThay`: Đã từng được phân công dạy thay không?
    7. `DangKyDayBu`: Đã từng đăng ký dạy bù không?
    - Nếu bất kỳ điều kiện nào $> 0$ $\rightarrow$ **CHẶN XÓA HOÀN TOÀN** và trả thông báo lỗi chi tiết nguyên nhân ràng buộc.
    - Chỉ khi toàn bộ 7 điều kiện đều $= 0$ (giảng viên mới tạo, chưa có dữ liệu giao dịch) mới cho phép xóa.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Trường hợp xóa thành công**: Bản ghi bị **XÓA VĨNH VIỄN** khỏi bảng `GiangVien`:
    ```sql
    DELETE FROM GiangVien WHERE MaGiangVien = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Giảng viên bị xóa khỏi CSDL và biến mất khỏi bảng danh sách.

---

### 1.6. Chức năng 6: Quản lý Môn học (`MonHoc`)

- **Bảng dữ liệu tác động trong CSDL**: **`MonHoc`** (`MaMonHoc`, `TenMonHoc`, `SoTinChi`, `MaBoMon`, `LoaiMonHoc`).
- **Bảng liên quan (Ràng buộc FK)**:
  - `BoMon` (`MonHoc.MaBoMon` $\rightarrow$ `BoMon.MaBoMon`).
  - `LopHocPhan` (`LopHocPhan.MaMonHoc` $\rightarrow$ `MonHoc.MaMonHoc`).
- **Resource ID kiểm tra quyền (`checkPermission`)**: `'MonHoc'` (`CanRead`, `CanCreate`, `CanUpdate`, `CanDelete`).

> 📌 **CHÚ THÍCH CÁC TRƯỜNG DỮ LIỆU ĐẶC THÙ TRONG CSDL (`MonHoc`)**:
>
> - **Cột `MaBoMon`**: Bắt buộc trên giao diện nghiệp vụ (Mỗi môn học phải do đúng 1 Bộ môn phụ trách quản lý chuyên môn).
> - **Cột `LoaiMonHoc`**: Mặc định CSDL tự gán chuỗi **`'Regular'`** (Môn học thông thường).
> - **Cột `SoTinChi`**: Phải là số nguyên dương $> 0$ (ảnh hưởng trực tiếp tới cấu trúc số tiết/thời lượng xếp lịch).

#### 1.6.1. Tìm kiếm, Lọc & Hiển thị Danh sách Môn học

- **Thao tác người dùng (User Action)**:
  - Truy cập menu `Dữ liệu nền` $\rightarrow$ `Quản lý Môn học`.
  - Chọn Bộ lọc: Dropdown **Bộ môn** (`MaBoMon` — mặc định _"Tất cả Bộ môn"_ hoặc chọn 1 Bộ môn cụ thể), ô tìm kiếm theo Mã môn học hoặc Tên môn học.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/monhoc?maBoMon=...&search=...`.
  - Kiểm tra quyền `CanRead` trên Resource `MonHoc`.
  - Backend thực hiện truy vấn `LEFT JOIN BoMon` (lấy tên bộ môn) và đếm số lượng lớp học phần đã mở qua `LopHocPhan`:
    ```sql
    SELECT
      mh.MaMonHoc,
      mh.TenMonHoc,
      mh.SoTinChi,
      mh.MaBoMon,
      mh.LoaiMonHoc,
      bm.TenBoMon,
      COUNT(DISTINCT lhp.MaLopHocPhan) AS SoLopHocPhan
    FROM MonHoc mh
    LEFT JOIN BoMon bm ON mh.MaBoMon = bm.MaBoMon
    LEFT JOIN LopHocPhan lhp ON mh.MaMonHoc = lhp.MaMonHoc
    WHERE (mh.MaMonHoc LIKE ? OR mh.TenMonHoc LIKE ?)
    GROUP BY mh.MaMonHoc, mh.TenMonHoc, mh.SoTinChi, mh.MaBoMon, mh.LoaiMonHoc, bm.TenBoMon
    ORDER BY mh.MaBoMon ASC, mh.MaMonHoc ASC;
    ```
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (`SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Bảng dữ liệu hiển thị: Mã môn học, Tên môn học, Số tín chỉ, Bộ môn quản lý, Loại môn học, badge số lượng Lớp học phần đã mở.

#### 1.6.2. Thêm mới Môn học

- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Thêm Môn Học"**.
  - Nhập: **Mã môn học** (`MaMonHoc`), **Tên môn học** (`TenMonHoc`), **Số tín chỉ** (`SoTinChi`), chọn **Bộ môn quản lý** (`MaBoMon`), **Loại môn học** (`LoaiMonHoc`).
  - Nhấn **"Lưu Môn Học"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanCreate` trên Resource `MonHoc`.
  - **Validation 1**: `MaMonHoc`, `TenMonHoc`, `MaBoMon` bắt buộc không được để trống.
  - **Validation 2**: Chuẩn hóa `MaMonHoc` (Viết hoa `UPPERCASE`, xóa khoảng trắng thừa).
  - **Validation 3 (Check trùng mã)**:
    ```sql
    SELECT MaMonHoc FROM MonHoc WHERE MaMonHoc = ? LIMIT 1;
    ```

    - Nếu đã tồn tại $\rightarrow$ Trả lỗi: _"Mã môn học 'INT1001' đã tồn tại."_ (HTTP 400).
  - **Validation 4 (Kiểm tra khóa ngoại `MaBoMon`)**: Bộ môn được chọn phải tồn tại trong bảng `BoMon`.
  - **Validation 5**: `SoTinChi` nếu nhập phải là số nguyên dương $> 0$.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Tạo mới 1 dòng bản ghi trong bảng `MonHoc`**:
    ```sql
    INSERT INTO MonHoc (MaMonHoc, TenMonHoc, SoTinChi, MaBoMon, LoaiMonHoc)
    VALUES (?, ?, ?, ?, ?);
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, làm mới bảng danh sách, hiển thị môn học mới kèm tên Bộ môn quản lý.

#### 1.6.3. Cập nhật (Sửa) Thông tin Môn học

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Sửa"** tại dòng môn học.
  - Chỉnh sửa: Tên môn học, Số tín chỉ, Bộ môn quản lý, Loại môn học.
  - Nhấn **"Lưu Thay Đổi"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `MonHoc`.
  - Khóa cố định `MaMonHoc` (Không cho phép sửa mã môn học).
  - Validation: `TenMonHoc` và `MaBoMon` không được để trống; Bộ môn mới phải tồn tại trong CSDL; `SoTinChi` phải là số nguyên dương hợp lệ.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật thông tin trong bảng `MonHoc`**:
    ```sql
    UPDATE MonHoc
    SET TenMonHoc = ?, SoTinChi = ?, MaBoMon = ?, LoaiMonHoc = ?
    WHERE MaMonHoc = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, thông báo _"Cập nhật môn học thành công!"_, làm mới dữ liệu trên bảng.

#### 1.6.4. Xem Chi tiết Môn học (Danh sách Lớp học phần đã mở)

- **Thao tác người dùng (User Action)**:
  - Bấm vào Tên/Mã môn học để xem thông tin chi tiết.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/monhoc/:maMonHoc/detail`.
  - Backend truy vấn danh sách các lớp học phần (`LopHocPhan`) đã/đang mở cho môn này:
    ```sql
    SELECT
      lhp.MaLopHocPhan,
      lhp.TenLopHocPhan,
      lhp.LoaiHoc,
      lhp.SiSoDuKien,
      lhp.SiSoDangKy,
      lhp.TrangThaiPhanCong,
      lhp.NgayBatDau,
      lhp.NgayKetThuc,
      lhp.KhoaHoc,
      hk.TenHocKy,
      hk.NamHoc,
      gv.HoTen AS TenGiangVien
    FROM LopHocPhan lhp
    LEFT JOIN HocKy hk ON lhp.MaHocKy = hk.MaHocKy
    LEFT JOIN GiangVien gv ON lhp.MaGiangVien = gv.MaGiangVien
    WHERE lhp.MaMonHoc = ?
    ORDER BY lhp.NgayBatDau DESC;
    ```
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (`SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Hiển thị danh sách toàn bộ Lớp học phần của môn kèm Học kỳ, Giảng viên phụ trách, Sĩ số và Thời gian học.

#### 1.6.5. Xóa Môn học (Kiểm tra Ràng buộc toàn vẹn)

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Xóa"** tại dòng môn học, xác nhận trên Popup.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanDelete` trên Resource `MonHoc`.
  - **Kiểm tra ràng buộc Lớp học phần (`LopHocPhan`)**:
    ```sql
    SELECT COUNT(*) AS total FROM LopHocPhan WHERE MaMonHoc = ?;
    ```

    - **Trường hợp `total > 0`**: **CHẶN XÓA HOÀN TOÀN**: _"Không thể xóa môn học 'X' vì đang có N lớp học phần được mở cho môn này."_
    - **Trường hợp `total == 0`**: Cho phép xóa.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Trường hợp xóa thành công**: Bản ghi bị **XÓA VĨNH VIỄN** khỏi bảng `MonHoc`:
    ```sql
    DELETE FROM MonHoc WHERE MaMonHoc = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Môn học bị xóa khỏi CSDL và biến mất khỏi bảng danh sách.

---

### 1.7. Chức năng 7: Quản lý Lớp sinh viên (`LopSinhVien`)

- **Bảng dữ liệu tác động trong CSDL**: **`LopSinhVien`** (`MaLopSinhVien`, `TenLopSinhVien`, `MaKhoa`).
- **Bảng liên quan (Ràng buộc FK)**:
  - `Khoa` (`LopSinhVien.MaKhoa` $\rightarrow$ `Khoa.MaKhoa`).
  - `LopHocPhan_LopSinhVien` (`LopHocPhan_LopSinhVien.MaLopSinhVien` $\rightarrow$ `LopSinhVien.MaLopSinhVien`).
- **Resource ID kiểm tra quyền (`checkPermission`)**: `'LopSinhVien'` (`CanRead`, `CanCreate`, `CanUpdate`, `CanDelete`).

> 📌 **CHÚ THÍCH ĐẶC THÙ NGHIỆP VỤ (`LopSinhVien`)**:
>
> - Toàn bộ các trường dữ liệu của bảng đều là `NOT NULL`. Mỗi Lớp sinh viên (lớp hành chính/chủ nhiệm) bắt buộc phải trực thuộc một Khoa quản lý.

#### 1.7.1. Tìm kiếm, Lọc & Hiển thị Danh sách Lớp sinh viên

- **Thao tác người dùng (User Action)**:
  - Truy cập menu `Dữ liệu nền` $\rightarrow$ `Quản lý Lớp sinh viên`.
  - Chọn Bộ lọc: Dropdown **Khoa** (`MaKhoa` — mặc định _"Tất cả các Khoa"_), ô tìm kiếm từ khóa theo Mã lớp hoặc Tên lớp sinh viên.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/lopsinhvien?maKhoa=...&search=...`.
  - Kiểm tra quyền `CanRead` trên Resource `LopSinhVien`.
  - Backend thực hiện truy vấn `INNER JOIN Khoa` và đếm số lượng lớp học phần đang tham gia qua bảng liên kết `LopHocPhan_LopSinhVien`:
    ```sql
    SELECT
      lsv.MaLopSinhVien,
      lsv.TenLopSinhVien,
      lsv.MaKhoa,
      k.TenKhoa,
      COUNT(DISTINCT lhl.MaLopHocPhan) AS SoLopHocPhan
    FROM LopSinhVien lsv
    INNER JOIN Khoa k ON lsv.MaKhoa = k.MaKhoa
    LEFT JOIN LopHocPhan_LopSinhVien lhl ON lsv.MaLopSinhVien = lhl.MaLopSinhVien
    WHERE (lsv.MaLopSinhVien LIKE ? OR lsv.TenLopSinhVien LIKE ?)
    GROUP BY lsv.MaLopSinhVien, lsv.TenLopSinhVien, lsv.MaKhoa, k.TenKhoa
    ORDER BY lsv.MaKhoa ASC, lsv.MaLopSinhVien ASC;
    ```
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (`SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Bảng dữ liệu hiển thị: Mã lớp sinh viên, Tên lớp, Khoa quản lý, badge số lượng Lớp học phần đang tham gia.

#### 1.7.2. Thêm mới Lớp sinh viên

- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Thêm Lớp Sinh Viên"**.
  - Nhập: **Mã lớp sinh viên** (`MaLopSinhVien`), **Tên lớp sinh viên** (`TenLopSinhVien`), chọn **Khoa quản lý** (`MaKhoa`).
  - Nhấn **"Lưu Lớp Sinh Viên"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanCreate` trên Resource `LopSinhVien`.
  - **Validation 1**: Cả 3 trường `MaLopSinhVien`, `TenLopSinhVien`, `MaKhoa` không được để trống.
  - **Validation 2**: Chuẩn hóa `MaLopSinhVien` (Viết hoa `UPPERCASE`, xóa khoảng trắng thừa).
  - **Validation 3 (Check trùng mã)**:
    ```sql
    SELECT MaLopSinhVien FROM LopSinhVien WHERE MaLopSinhVien = ? LIMIT 1;
    ```

    - Nếu đã tồn tại $\rightarrow$ Trả lỗi: _"Mã lớp sinh viên 'CNTT1-K63' đã tồn tại."_ (HTTP 400).
  - **Validation 4 (Khóa ngoại `MaKhoa`)**: Khoa được chọn phải tồn tại trong bảng `Khoa`.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Tạo mới 1 dòng bản ghi trong bảng `LopSinhVien`**:
    ```sql
    INSERT INTO LopSinhVien (MaLopSinhVien, TenLopSinhVien, MaKhoa)
    VALUES (?, ?, ?);
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, làm mới bảng dữ liệu, hiển thị dòng lớp sinh viên mới tạo.

#### 1.7.3. Cập nhật (Sửa) Thông tin Lớp sinh viên

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Sửa"** tại dòng lớp sinh viên.
  - Chỉnh sửa: **Tên lớp sinh viên** và/hoặc chọn lại **Khoa quản lý**.
  - Nhấn **"Lưu Thay Đổi"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `LopSinhVien`.
  - Khóa cố định khóa chính `MaLopSinhVien` (Không cho phép sửa mã).
  - Validation: `TenLopSinhVien` và `MaKhoa` không được để trống; Khoa mới phải tồn tại trong CSDL.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật thông tin trong bảng `LopSinhVien`**:
    ```sql
    UPDATE LopSinhVien
    SET TenLopSinhVien = ?, MaKhoa = ?
    WHERE MaLopSinhVien = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, thông báo _"Cập nhật lớp sinh viên thành công!"_, tải lại danh sách.

#### 1.7.4. Xóa Lớp sinh viên (Kiểm tra Ràng buộc toàn vẹn)

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Xóa"** tại dòng lớp sinh viên, xác nhận trên Popup.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanDelete` trên Resource `LopSinhVien`.
  - **Kiểm tra ràng buộc liên kết Lớp học phần (`LopHocPhan_LopSinhVien`)**:
    ```sql
    SELECT COUNT(*) AS total FROM LopHocPhan_LopSinhVien WHERE MaLopSinhVien = ?;
    ```

    - **Trường hợp `total > 0`**: **CHẶN XÓA HOÀN TOÀN**: _"Không thể xóa lớp sinh viên 'X' vì đang tham gia N lớp học phần."_
    - **Trường hợp `total == 0`**: Cho phép xóa.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Trường hợp xóa thành công**: Bản ghi bị **XÓA VĨNH VIỄN** khỏi bảng `LopSinhVien`:
    ```sql
    DELETE FROM LopSinhVien WHERE MaLopSinhVien = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Lớp sinh viên bị xóa khỏi CSDL và biến mất khỏi bảng danh sách.

---

### 1.8. Chức năng 8: Quản lý Khóa sinh viên (`KhoaSinhVien`)

- **Bảng dữ liệu tác động trong CSDL**: **`KhoaSinhVien`** (`MaKhoaSinhVien`, `TenKhoaSinhVien`).
- **Bảng liên quan (Ràng buộc FK)**:
  - `LopHocPhan` (`LopHocPhan.KhoaHoc` $\rightarrow$ `KhoaSinhVien.MaKhoaSinhVien`).
- **Resource ID kiểm tra quyền (`checkPermission`)**: `'KhoaSinhVien'` (`CanRead`, `CanCreate`, `CanUpdate`, `CanDelete`).

> 📌 **CHÚ THÍCH ĐẶC THÙ NGHIỆP VỤ (`KhoaSinhVien`)**:
>
> - Bảng danh mục niên khóa độc lập (Ví dụ: `K62`, `K63`, `K64`, `K65`, `K66`...).
> - Dùng để gắn nhãn niên khóa tuyển sinh cho Lớp học phần (`LopHocPhan.KhoaHoc`).

#### 1.8.1. Tìm kiếm & Hiển thị Danh sách Khóa sinh viên

- **Thao tác người dùng (User Action)**:
  - Truy cập menu `Dữ liệu nền` $\rightarrow$ `Quản lý Khóa sinh viên`.
  - Nhập từ khóa vào ô tìm kiếm theo Mã khóa hoặc Tên khóa sinh viên.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/khoasinhvien?search=...`.
  - Kiểm tra quyền `CanRead` trên Resource `KhoaSinhVien`.
  - Backend thực hiện truy vấn `LEFT JOIN LopHocPhan` (qua `KhoaHoc`) để đếm số lượng lớp học phần gắn với từng niên khóa:
    ```sql
    SELECT
      ksv.MaKhoaSinhVien,
      ksv.TenKhoaSinhVien,
      COUNT(DISTINCT lhp.MaLopHocPhan) AS SoLopHocPhan
    FROM KhoaSinhVien ksv
    LEFT JOIN LopHocPhan lhp ON ksv.MaKhoaSinhVien = lhp.KhoaHoc
    WHERE (ksv.MaKhoaSinhVien LIKE ? OR ksv.TenKhoaSinhVien LIKE ?)
    GROUP BY ksv.MaKhoaSinhVien, ksv.TenKhoaSinhVien
    ORDER BY ksv.MaKhoaSinhVien ASC;
    ```
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (`SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Bảng dữ liệu hiển thị: Mã khóa (VD: `K65`), Tên khóa (VD: `Khóa 65`), badge số lượng Lớp học phần gắn niên khóa này.

#### 1.8.2. Thêm mới Khóa sinh viên

- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Thêm Khóa Sinh Viên"**.
  - Nhập: **Mã khóa** (`MaKhoaSinhVien` — VD: `K66`), **Tên khóa** (`TenKhoaSinhVien` — VD: `Khóa 66`).
  - Nhấn **"Lưu Khóa Sinh Viên"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanCreate` trên Resource `KhoaSinhVien`.
  - **Validation 1**: `MaKhoaSinhVien` và `TenKhoaSinhVien` không được để trống.
  - **Validation 2**: Chuẩn hóa mã (Viết hoa `UPPERCASE`, xóa khoảng trắng thừa).
  - **Validation 3 (Check trùng mã)**:
    ```sql
    SELECT MaKhoaSinhVien FROM KhoaSinhVien WHERE MaKhoaSinhVien = ? LIMIT 1;
    ```

    - Nếu đã tồn tại $\rightarrow$ Trả lỗi: _"Mã khóa sinh viên 'K66' đã tồn tại."_ (HTTP 400).
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Tạo mới 1 dòng bản ghi trong bảng `KhoaSinhVien`**:
    ```sql
    INSERT INTO KhoaSinhVien (MaKhoaSinhVien, TenKhoaSinhVien)
    VALUES (?, ?);
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, tải lại bảng danh sách, hiển thị khóa sinh viên mới tạo.

#### 1.8.3. Cập nhật (Sửa) Thông tin Khóa sinh viên

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Sửa"** tại dòng khóa sinh viên.
  - Chỉnh sửa **Tên khóa sinh viên** (`TenKhoaSinhVien`).
  - Nhấn **"Lưu Thay Đổi"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `KhoaSinhVien`.
  - Khóa cố định `MaKhoaSinhVien` (Không cho phép sửa mã niên khóa).
  - Validation: `TenKhoaSinhVien` không được để trống.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật thông tin trong bảng `KhoaSinhVien`**:
    ```sql
    UPDATE KhoaSinhVien
    SET TenKhoaSinhVien = ?
    WHERE MaKhoaSinhVien = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, thông báo _"Cập nhật khóa sinh viên thành công!"_, làm mới danh sách.

#### 1.8.4. Xóa Khóa sinh viên (Kiểm tra Ràng buộc toàn vẹn)

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Xóa"** tại dòng khóa sinh viên, xác nhận trên Popup.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanDelete` trên Resource `KhoaSinhVien`.
  - **Kiểm tra ràng buộc Lớp học phần (`LopHocPhan.KhoaHoc`)**:
    ```sql
    SELECT COUNT(*) AS total FROM LopHocPhan WHERE KhoaHoc = ?;
    ```

    - **Trường hợp `total > 0`**: **CHẶN XÓA HOÀN TOÀN**: _"Không thể xóa khóa sinh viên 'K65' vì đang có N lớp học phần gắn với niên khóa này."_
    - **Trường hợp `total == 0`**: Cho phép xóa.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Trường hợp xóa thành công**: Bản ghi bị **XÓA VĨNH VIỄN** khỏi bảng `KhoaSinhVien`:
    ```sql
    DELETE FROM KhoaSinhVien WHERE MaKhoaSinhVien = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Khóa sinh viên bị xóa khỏi CSDL và biến mất khỏi bảng danh sách.

---

### 1.9. Chức năng 9: Quản lý Học kỳ & Năm học (`HocKy`)

- **Bảng dữ liệu tác động trong CSDL**: **`HocKy`** (`MaHocKy`, `TenHocKy`, `Dot`, `NamHoc`, `NgayBatDau`, `NgayKetThuc`).
- **Bảng liên quan (Ràng buộc FK)**:
  - `LopHocPhan` (`LopHocPhan.MaHocKy` $\rightarrow$ `HocKy.MaHocKy`).
- **Resource ID kiểm tra quyền (`checkPermission`)**: `'HocKy'` (`CanRead`, `CanCreate`, `CanUpdate`, `CanDelete`).

> 📌 **CHÚ THÍCH CÁC TRƯỜNG DỮ LIỆU ĐẶC THÙ TRONG CSDL (`HocKy`)**:
>
> - **Cột `NgayBatDau` & `NgayKetThuc`**: `NOT NULL`. Xác định khoảng thời gian hợp lệ tổng của toàn bộ học kỳ, dùng làm biên giới hạn thời gian khi xếp Thời khóa biểu và Buổi học cho các lớp học phần.
> - **Cột `Dot` & `NamHoc`**: Cho phép `NULL` trong CSDL, nhưng bắt buộc nhập ở tầng ứng dụng để phân biệt chính xác các học kỳ (VD: Học kỳ 1 năm học 2025-2026).

#### 1.9.1. Tìm kiếm & Hiển thị Danh sách Học kỳ

- **Thao tác người dùng (User Action)**:
  - Truy cập menu `Dữ liệu nền` $\rightarrow$ `Quản lý Học kỳ`.
  - Nhập từ khóa vào ô tìm kiếm theo Tên học kỳ, Năm học, hoặc Mã học kỳ.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/hocky?search=...`.
  - Kiểm tra quyền `CanRead` trên Resource `HocKy`.
  - Backend truy vấn danh sách học kỳ sắp xếp theo `NgayBatDau DESC` (học kỳ mới nhất lên đầu), đồng thời đếm số lượng lớp học phần trực thuộc:
    ```sql
    SELECT
      hk.MaHocKy,
      hk.TenHocKy,
      hk.Dot,
      hk.NamHoc,
      hk.NgayBatDau,
      hk.NgayKetThuc,
      COUNT(DISTINCT lhp.MaLopHocPhan) AS SoLopHocPhan
    FROM HocKy hk
    LEFT JOIN LopHocPhan lhp ON hk.MaHocKy = lhp.MaHocKy
    WHERE (hk.TenHocKy LIKE ? OR hk.NamHoc LIKE ? OR hk.MaHocKy LIKE ?)
    GROUP BY hk.MaHocKy, hk.TenHocKy, hk.Dot, hk.NamHoc, hk.NgayBatDau, hk.NgayKetThuc
    ORDER BY hk.NgayBatDau DESC;
    ```
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (`SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Bảng dữ liệu hiển thị: Mã học kỳ, Tên học kỳ, Đợt, Năm học, Ngày bắt đầu – Ngày kết thúc, badge số lượng Lớp học phần đã mở.

#### 1.9.2. Thêm mới Học kỳ (Kiểm tra Chồng lấn thời gian)

- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Thêm Học Kỳ"**.
  - Nhập: **Mã học kỳ** (`MaHocKy`), **Tên học kỳ** (`TenHocKy`), **Đợt** (`Dot`), **Năm học** (`NamHoc`), **Ngày bắt đầu** (`NgayBatDau`), **Ngày kết thúc** (`NgayKetThuc`).
  - Nhấn **"Lưu Học Kỳ"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanCreate` trên Resource `HocKy`.
  - **Validation 1**: `MaHocKy`, `TenHocKy`, `NgayBatDau`, `NgayKetThuc` không được để trống.
  - **Validation 2 (Check trùng mã)**: Truy vấn kiểm tra `MaHocKy` đã tồn tại trong bảng `HocKy` chưa.
  - **Validation 3**: `NgayBatDau` phải nhỏ hơn `NgayKetThuc`.
  - **Validation 4 (Kiểm tra chồng lấn khoảng ngày - Overlap Check)**:
    ```sql
    SELECT MaHocKy, TenHocKy, NgayBatDau, NgayKetThuc
    FROM HocKy
    WHERE NgayBatDau < ? AND NgayKetThuc > ?;
    ```

    - Nếu có học kỳ bị chồng lấn thời gian $\rightarrow$ Backend trả kèm cờ cảnh báo `overlapWarning` để Admin xác nhận.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Tạo mới 1 dòng bản ghi trong bảng `HocKy`**:
    ```sql
    INSERT INTO HocKy (MaHocKy, TenHocKy, Dot, NamHoc, NgayBatDau, NgayKetThuc)
    VALUES (?, ?, ?, ?, ?, ?);
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, tải lại danh sách, học kỳ mới xuất hiện trên bảng dữ liệu.

#### 1.9.3. Cập nhật (Sửa) Thông tin Học kỳ

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Sửa"** tại dòng học kỳ.
  - Chỉnh sửa: Tên học kỳ, Đợt, Năm học, Ngày bắt đầu, Ngày kết thúc.
  - Nhấn **"Lưu Thay Đổi"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `HocKy`.
  - Khóa cố định `MaHocKy` (Không cho phép sửa mã học kỳ).
  - Validation: `TenHocKy` không trống, `NgayBatDau < NgayKetThuc`.
  - **Cảnh báo khi thu hẹp khoảng ngày**: Nếu học kỳ đã có `LopHocPhan` (`SoLopHocPhan > 0`) mà khoảng ngày mới bị thu hẹp $\rightarrow$ Trả cờ cảnh báo `dateNarrowWarning = true` để Admin rà soát lại các lịch học đã tạo.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật thông tin trong bảng `HocKy`**:
    ```sql
    UPDATE HocKy
    SET TenHocKy = ?, Dot = ?, NamHoc = ?, NgayBatDau = ?, NgayKetThuc = ?
    WHERE MaHocKy = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, hiển thị toast _"Cập nhật học kỳ thành công!"_, làm mới dữ liệu trên bảng.

#### 1.9.4. Xóa Học kỳ (Kiểm tra Ràng buộc toàn vẹn)

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Xóa"** tại dòng học kỳ, xác nhận trên Popup.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanDelete` trên Resource `HocKy`.
  - **Kiểm tra ràng buộc Lớp học phần (`LopHocPhan`)**:
    ```sql
    SELECT COUNT(*) AS total FROM LopHocPhan WHERE MaHocKy = ?;
    ```

    - **Trường hợp `total > 0`**: **CHẶN XÓA HOÀN TOÀN**: _"Không thể xóa học kỳ 'X' vì đang có N lớp học phần thuộc học kỳ này."_
    - **Trường hợp `total == 0`**: Cho phép xóa.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Trường hợp xóa thành công**: Bản ghi bị **XÓA VĨNH VIỄN** khỏi bảng `HocKy`:
    ```sql
    DELETE FROM HocKy WHERE MaHocKy = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Học kỳ bị xóa khỏi CSDL và biến mất khỏi bảng danh sách.

---

### 1.10. Chức năng 10: Quản lý Tiết học & Khung ca học (`TietHoc`)

- **Bảng dữ liệu tác động trong CSDL**: **`TietHoc`** (`MaTiet`, `TenTiet`, `GioBatDau`, `GioKetThuc`).
- **Bảng liên quan (Ràng buộc FK)**:
  - `ThoiKhoaBieu` (`ThoiKhoaBieu.MaTiet` $\rightarrow$ `TietHoc.MaTiet`).
  - `BuoiHoc` (`BuoiHoc.MaTiet` $\rightarrow$ `TietHoc.MaTiet`).
  - `DangKyDayBu` (`DangKyDayBu.MaTiet` $\rightarrow$ `TietHoc.MaTiet`).
- **Resource ID kiểm tra quyền (`checkPermission`)**: `'TietHoc'` (`CanRead`, `CanCreate`, `CanUpdate`, `CanDelete`).

> 📌 **CHÚ THÍCH CÁC TRƯỜNG DỮ LIỆU ĐẶC THÙ TRONG CSDL (`TietHoc`)**:
>
> - Cả 4 cột đều là **`NOT NULL`**.
> - Mỗi dòng `TietHoc` đại diện cho một ca học trọn gói (Ví dụ: Ca 1 tương ứng Tiết 1-3 từ 07:00 đến 09:25).
> - Dữ liệu khởi tạo chuẩn của nhà trường:
>   - `MaTiet: 1` | `TenTiet: Tiết 1-3` | `GioBatDau: 07:00` | `GioKetThuc: 09:25`
>   - `MaTiet: 2` | `TenTiet: Tiết 4-6` | `GioBatDau: 09:35` | `GioKetThuc: 12:00`
>   - `MaTiet: 3` | `TenTiet: Tiết 7-9` | `GioBatDau: 13:00` | `GioKetThuc: 15:25`
>   - `MaTiet: 4` | `TenTiet: Tiết 10-12` | `GioBatDau: 15:35` | `GioKetThuc: 18:00`
>   - `MaTiet: 5` | `TenTiet: Tiết 13-16 (Tối)` | `GioBatDau: 18:00` | `GioKetThuc: 21:30`
> - Các bảng nghiệp vụ xếp lịch (`ThoiKhoaBieu`, `BuoiHoc`, `DangKyDayBu`) lưu trực tiếp khóa ngoại **`MaTiet`** (kiểu `TINYINT`), không lưu tách rời `MaTietBatDau`/`MaTietKetThuc`. Khung giờ học được quản lý tập trung duy nhất tại bảng này.

#### 1.10.1. Tìm kiếm & Hiển thị Danh sách Tiết học

- **Thao tác người dùng (User Action)**:
  - Truy cập menu `Dữ liệu nền` (hoặc `Danh mục đào tạo`) $\rightarrow$ `Tiết học & Ca học`.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/tiethoc`.
  - Kiểm tra quyền `CanRead` trên Resource `TietHoc`.
  - Backend thực hiện truy vấn sắp xếp theo `GioBatDau ASC`, đồng thời đếm số lượt sử dụng trong bảng `ThoiKhoaBieu` và `BuoiHoc`:
    ```sql
    SELECT
      th.MaTiet,
      th.TenTiet,
      TIME_FORMAT(th.GioBatDau, '%H:%i') AS GioBatDau,
      TIME_FORMAT(th.GioKetThuc, '%H:%i') AS GioKetThuc,
      (SELECT COUNT(*) FROM ThoiKhoaBieu WHERE MaTiet = th.MaTiet) AS SoThoiKhoaBieu,
      (SELECT COUNT(*) FROM BuoiHoc WHERE MaTiet = th.MaTiet) AS SoBuoiHoc
    FROM TietHoc th
    ORDER BY th.GioBatDau ASC;
    ```
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (`SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Bảng dữ liệu hiển thị: Mã tiết, Tên ca học, Giờ bắt đầu, Giờ kết thúc, badge số lượng lịch thời khóa biểu và buổi học đang sử dụng.

#### 1.10.2. Thêm mới Tiết học (Kiểm tra Chồng lấn khung giờ)

- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Thêm Tiết Học"**.
  - Chọn mẫu tiết có sẵn từ danh sách gợi ý hoặc chọn _"Tùy chỉnh (nhập tay)"_.
  - Nhập: **Mã tiết** (`MaTiet`), **Tên tiết** (`TenTiet`), **Giờ bắt đầu** (`GioBatDau`), **Giờ kết thúc** (`GioKetThuc`).
  - Nhấn **"Lưu Tiết Học"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanCreate` trên Resource `TietHoc`.
  - **Validation 1**: Cả 4 trường `MaTiet`, `TenTiet`, `GioBatDau`, `GioKetThuc` không được để trống.
  - **Validation 2 (Check trùng mã)**:
    ```sql
    SELECT MaTiet FROM TietHoc WHERE MaTiet = ? LIMIT 1;
    ```

    - Nếu đã tồn tại $\rightarrow$ Trả lỗi: _"Mã tiết đã tồn tại."_ (HTTP 400).
  - **Validation 3**: `GioBatDau` phải nhỏ hơn `GioKetThuc`.
  - **Validation 4 (Kiểm tra chồng lấn khung giờ - Overlap Check)**:
    - Backend so sánh khoảng giờ `[GioBatDau, GioKetThuc]` với toàn bộ các ca học đã có trong bảng:
      ```sql
      SELECT MaTiet, TenTiet FROM TietHoc
      WHERE GioBatDau < ? AND GioKetThuc > ?;
      ```
    - Nếu bị giao nhau khung giờ $\rightarrow$ **CHẶN LƯU**: _"Khung giờ của tiết này trùng với 'Tiết X' đã tồn tại."_
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Tạo mới 1 dòng bản ghi trong bảng `TietHoc`**:
    ```sql
    INSERT INTO TietHoc (MaTiet, TenTiet, GioBatDau, GioKetThuc)
    VALUES (?, ?, ?, ?);
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, làm mới danh sách, tiết học mới hiện diện trên bảng.

#### 1.10.3. Cập nhật (Sửa) Thông tin Tiết học

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Sửa"** tại dòng tiết học.
  - Chỉnh sửa: **Tên tiết**, **Giờ bắt đầu**, **Giờ kết thúc**.
  - Nhấn **"Lưu Thay Đổi"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanUpdate` trên Resource `TietHoc`.
  - Khóa cố định khóa chính `MaTiet` (Không cho phép sửa mã tiết).
  - Validation: `TenTiet`, `GioBatDau`, `GioKetThuc` không được trống; `GioBatDau < GioKetThuc`; kiểm tra chồng lấn giờ với các tiết khác (loại trừ chính tiết đang sửa).
  - **Cảnh báo ảnh hưởng lịch đã xếp**: Nếu tiết học đang được sử dụng trong `ThoiKhoaBieu` hoặc `BuoiHoc` (`usages > 0`), hệ thống hiển thị cảnh báo cho Admin rằng thay đổi khung giờ sẽ tác động trực tiếp lên toàn bộ các buổi học đó.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật thông tin trong bảng `TietHoc`**:
    ```sql
    UPDATE TietHoc
    SET TenTiet = ?, GioBatDau = ?, GioKetThuc = ?
    WHERE MaTiet = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, thông báo toast _"Cập nhật tiết học thành công!"_, làm mới bảng dữ liệu.

#### 1.10.4. Xóa Tiết học (Kiểm tra Ràng buộc toàn vẹn)

- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Xóa"** tại dòng tiết học, xác nhận trên Popup.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Kiểm tra quyền `CanDelete` trên Resource `TietHoc`.
  - **Kiểm tra tuần tự ràng buộc toàn vẹn CSDL**:
    1. **Kiểm tra Thời khóa biểu (`ThoiKhoaBieu`)**:
       ```sql
       SELECT COUNT(*) AS total FROM ThoiKhoaBieu WHERE MaTiet = ?;
       ```

       - Nếu `total > 0` $\rightarrow$ **CHẶN XÓA**: _"Không thể xóa tiết học vì đang được dùng trong N giai đoạn thời khóa biểu."_
    2. **Kiểm tra Buổi học (`BuoiHoc`)**:
       ```sql
       SELECT COUNT(*) AS total FROM BuoiHoc WHERE MaTiet = ?;
       ```

       - Nếu `total > 0` $\rightarrow$ **CHẶN XÓA**: _"Không thể xóa tiết học vì đang được dùng trong N buổi học."_
    - Nếu cả 2 điều kiện đều $= 0$ $\rightarrow$ Cho phép xóa.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Trường hợp xóa thành công**: Bản ghi bị **XÓA VĨNH VIỄN** khỏi bảng `TietHoc`:
    ```sql
    DELETE FROM TietHoc WHERE MaTiet = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Tiết học bị xóa khỏi CSDL và biến mất khỏi bảng danh sách.

## PHÂN HỆ: QUẢN LÝ LỚP HỌC PHẦN (LopHocPhan) — Phạm vi: chỉ dữ liệu nền

Không bao gồm: xếp lịch (ThoiKhoaBieu), sinh buổi học (BuoiHoc), bộ môn xác nhận lịch. Ba phần này để dành cho module "Thời Khóa Biểu" làm sau.

Bảng tác động chính: LopHocPhan, LopHocPhan_LopSinhVien
Bảng cha (bắt buộc có trước): MonHoc, HocKy, BoMon
Bảng cha (không bắt buộc): GiangVien, KhoaSinhVien, LopSinhVien
ResourceId dùng cho checkPermission: 'LopHocPhan'

Vì chưa đụng tới ThoiKhoaBieu, cột NgayBatDau/NgayKetThuc/SoTuan của LopHocPhan (vốn NOT NULL) phải nhập tay ở module này, không tự tính từ giai đoạn lịch như bản trước (vì giai đoạn lịch chưa tồn tại). Validate khoảng ngày nằm trong Học kỳ vẫn áp dụng, chỉ khác là áp dụng ngay lúc nhập tay thay vì tính tự động.

1. Lọc & Hiển thị danh sách
   Chọn Học kỳ (bắt buộc), lọc thêm theo Bộ môn, Môn học, Giảng viên, Trạng thái phân công, hoặc tìm theo mã/tên.
   Backend LEFT JOIN MonHoc, GiangVien, BoMon, KhoaSinhVien; đếm số LopSinhVien ghép.
   Hiển thị: Mã LHP, Tên môn, Loại học, Sĩ số DK/ĐK, Giảng viên (hoặc "Chưa phân công"), khoảng ngày, badge trạng thái phân công. Chưa có cột "số giai đoạn lịch" vì module đó chưa làm.
2. Thêm mới thủ công
   Nhập TenLopHocPhan, chọn MaMonHoc, MaHocKy, LoaiHoc (theo whitelist mở, tối thiểu LT/BT/TH/BTL), MaBoMon, SiSoDuKien (không bắt buộc), KhoaHoc (không bắt buộc), và nhập tay NgayBatDau/NgayKetThuc/SoTuan.
   Validate: các trường NOT NULL không trống; khóa ngoại tồn tại; NgayBatDau < NgayKetThuc; khoảng ngày nằm trong HocKy đã chọn.
   MaLopHocPhan tự sinh theo quy tắc MaMonHoc + "." + mã nhóm (người dùng nhập mã nhóm, ví dụ QT01.BT1), check trùng.
   MaGiangVien để trống, TrangThaiPhanCong mặc định 'Unassigned'.
3. Cập nhật thông tin cơ bản
   Sửa TenLopHocPhan, SiSoDuKien, SiSoDangKy, LoaiHoc, MaBoMon, KhoaHoc, NgayBatDau, NgayKetThuc, SoTuan. MaLopHocPhan, MaMonHoc, MaHocKy khóa cứng.
   Validate lại toàn bộ như mục 2, bao gồm validate ngày nằm trong Học kỳ.
   Lưu ý cho tương lai: khi module Thời Khóa Biểu được làm, các trường ngày này sẽ chuyển sang tự tính từ giai đoạn lịch (không cho sửa tay nữa) — cần nhớ điều chỉnh lại validate ở đây khi tới lúc đó.
4. Gắn / Gỡ lớp sinh viên ghép
   Chọn một hoặc nhiều LopSinhVien (gợi ý theo KhoaHoc của lớp học phần), thêm/xóa dòng trong LopHocPhan_LopSinhVien.
5. Phân công / Đổi Giảng viên
   Chọn giảng viên Active, ưu tiên đúng MaBoMon.
   Vì chưa có ThoiKhoaBieu, bỏ bước kiểm tra trùng lịch ở giai đoạn này (sẽ bổ sung khi module Thời Khóa Biểu ra đời).
   UPDATE MaGiangVien, chuyển TrangThaiPhanCong sang 'Assigned'. Cho phép gán lại NULL để bỏ phân công.
6. Xem chi tiết
   Hiển thị thông tin cơ bản và danh sách lớp sinh viên ghép. Không có tab "Lịch học" ở giai đoạn này.
7. Xóa
   Vì chưa có BuoiHoc/ThoiKhoaBieu, điều kiện chặn xóa rút gọn còn: kiểm tra DangKyDayBu.MaLopHocPhan (nếu module đó đã chạy) — nhưng thực tế giai đoạn này gần như luôn xóa được vì chưa có gì vận hành phía sau.
   Nếu qua được → xóa LopHocPhan_LopSinhVien rồi xóa LopHocPhan trong 1 transaction.
8. Import từ Excel (chỉ dữ liệu nền)
   Vẫn theo đúng luồng TepNhap + ChiTietNhap, chọn Bộ môn + Học kỳ trước khi upload.
   Chỉ đọc các cột: Mã học phần, Số TC (đối chiếu, không ghi), Lớp môn tín chỉ, Số SV DK, Số SV ĐK, Kiểu học, Giảng viên, Khóa, Tên các lớp ghép.
   Bỏ qua hoàn toàn các cột: Thời gian, Số tuần, và toàn bộ khối Thứ 2 → Chủ Nhật (Tiết học/Phòng học) — các cột này vẫn được lưu nguyên vào ChiTietNhap (vì bảng đó có sẵn cột KhoangThoiGianGoc, SoTuanGoc, LichHocHangTuanGoc) để giữ lại dữ liệu gốc, dùng sau khi làm module Thời Khóa Biểu, nhưng không tạo ThoiKhoaBieu ngay bây giờ.
   Vì bỏ cột Thời gian, NgayBatDau/NgayKetThuc/SoTuan của LopHocPhan tạm thời gán bằng đúng khoảng ngày của Học kỳ đã chọn khi import (giá trị placeholder hợp lệ), Admin có thể sửa tay lại sau nếu cần qua chức năng 3.
   Vẫn giữ quy tắc gộp dòng: "Lớp môn tín chỉ" có giá trị → 1 lớp mới; cả 2 cột đều trống → bỏ qua dòng đó luôn ở giai đoạn này (vì dòng đó chỉ có ý nghĩa bổ sung giai đoạn lịch, mà lịch chưa làm).
9. Export ra Excel (chỉ dữ liệu nền)
   Xuất các cột tương ứng đã import ở mục 8 (không có cột Thời gian/Số tuần/Thứ-Tiết-Phòng), dùng để đối chiếu dữ liệu nền đã nhập.
