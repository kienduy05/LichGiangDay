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
  - `GiangVien` (`Khoa.MaTruongKhoa` $\rightarrow$ `GiangVien.MaGiangVien`).
- **Resource ID kiểm tra quyền (`checkPermission`)**: `'Khoa'` (`CanRead`, `CanCreate`, `CanUpdate`, `CanDelete`).

1. Tìm kiếm & Hiển thị Danh sách Khoa
   Thao tác người dùng: Vào Quản lý Khoa, gõ từ khóa tìm theo MaKhoa hoặc TenKhoa.
   Nghiệp vụ xử lý:
   Gọi GET /v1/api/khoa?search=..., qua checkPermission('Khoa', 'CanRead').
   Backend JOIN 2 lần: JOIN BoMon để đếm số bộ môn trực thuộc từng khoa (giống cách ToaNha đếm PhongHoc), và JOIN GiangVien (qua MaTruongKhoa) để lấy HoTen giảng viên hiển thị tên Trưởng khoa thay vì chỉ hiện mã.
   Thay đổi CSDL: Không có, chỉ đọc.
   Kết quả hiển thị: Bảng danh sách gồm Mã khoa, Tên khoa, Tên Trưởng khoa (hoặc "Chưa phân công" nếu MaTruongKhoa là NULL), badge số lượng Bộ môn trực thuộc.
2. Thêm mới Khoa
   Thao tác người dùng: Bấm "Thêm Khoa", nhập MaKhoa, TenKhoa. Không nhập Trưởng khoa ở bước này.
   Nghiệp vụ xử lý:
   Validation 1: MaKhoa, TenKhoa không được trống.
   Validation 2: Chuẩn hóa MaKhoa (viết hoa, xóa khoảng trắng thừa) giống quy tắc MaToaNha.
   Validation 3 (check trùng): kiểm tra MaKhoa đã tồn tại chưa, nếu có trả lỗi 400 "Mã khoa 'X' đã tồn tại".
   Lý do không cho nhập Trưởng khoa ngay lúc tạo: tại thời điểm khoa mới được tạo, chưa chắc đã có Bộ môn/Giảng viên nào thuộc khoa đó trong CSDL để chọn làm Trưởng khoa hợp lệ → cột MaTruongKhoa mặc định để NULL, sẽ gán sau bằng chức năng riêng (mục 4).
   Thay đổi CSDL: Thêm 1 dòng vào Khoa với MaTruongKhoa = NULL.
   Kết quả hiển thị: Đóng modal, danh sách reload, khoa mới hiện với Trưởng khoa "Chưa phân công".
3. Cập nhật (Sửa) Thông tin Khoa
   Thao tác người dùng: Bấm "Sửa" tại dòng khoa, chỉ được sửa TenKhoa. MaKhoa cố định (là khóa ngoại trong BoMon, không được đổi để tránh gãy quan hệ, giống nguyên tắc khóa MaToaNha).
   Nghiệp vụ xử lý: Validation TenKhoa không được trống.
   Thay đổi CSDL: UPDATE Khoa SET TenKhoa = ? WHERE MaKhoa = ?.
   Kết quả hiển thị: Thông báo "Cập nhật khoa thành công", bảng làm mới.
4. Gán / Thay đổi Trưởng Khoa (chức năng đặc thù, khác ToaNha)
   Thao tác người dùng: Bấm "Phân công Trưởng khoa" tại dòng khoa tương ứng, hệ thống hiện dropdown chọn Giảng viên.
   Nghiệp vụ xử lý:
   Dropdown chỉ nên liệt kê Giảng viên thuộc một Bộ môn nằm trong chính Khoa đó (join GiangVien → BoMon → Khoa), tránh trường hợp gán một giảng viên hoàn toàn không liên quan làm Trưởng khoa.
   Validation: MaGiangVien được chọn phải tồn tại và đang ở trạng thái Active trong bảng GiangVien.
   Cho phép gán NULL trở lại (bãi nhiệm Trưởng khoa) nếu cần, ví dụ khi giảng viên đó nghỉ việc/chuyển công tác.
   Thay đổi CSDL: UPDATE Khoa SET MaTruongKhoa = ? WHERE MaKhoa = ?.
   Kết quả hiển thị: Tên Trưởng khoa mới hiện ngay trên bảng danh sách, không cần load lại trang.
5. Xem Chi tiết Khoa (Danh sách Bộ môn trực thuộc)
   Thao tác người dùng: Bấm vào tên/mã khoa để xem trang chi tiết.
   Nghiệp vụ xử lý: Truy vấn tất cả BoMon có MaKhoa tương ứng, kèm số lượng Giảng viên của từng Bộ môn (join tiếp GiangVien).
   Thay đổi CSDL: Không có, chỉ đọc.
   Kết quả hiển thị: Trang chi tiết hiện thông tin Khoa + bảng con liệt kê các Bộ môn trực thuộc, mỗi dòng có thể bấm để điều hướng sang phân hệ Quản lý Bộ môn.
6. Xóa Khoa (Kiểm tra ràng buộc toàn vẹn)
   Thao tác người dùng: Bấm "Xóa" tại dòng khoa, xác nhận trên popup.
   Nghiệp vụ xử lý:
   Kiểm tra ràng buộc với BoMon: đếm số Bộ môn có MaKhoa này.
   Nếu > 0 → CHẶN XÓA, trả lỗi 400: "Không thể xóa Khoa 'X' vì đang chứa Y bộ môn. Vui lòng xóa hoặc chuyển các bộ môn sang khoa khác trước."
   Nếu = 0 → cho phép xóa tiếp.
   Lưu ý thêm về ràng buộc vòng: vì Khoa.MaTruongKhoa tham chiếu tới GiangVien, còn GiangVien.MaBoMon tham chiếu tới BoMon, nên trên thực tế chỉ cần đảm bảo hết BoMon trực thuộc là đủ điều kiện xóa an toàn — không cần kiểm tra GiangVien trực tiếp vì giảng viên luôn gắn với Bộ môn chứ không gắn thẳng với Khoa.
   Thay đổi CSDL: Nếu đủ điều kiện, DELETE FROM Khoa WHERE MaKhoa = ?.
   Kết quả hiển thị: Dòng khoa biến mất khỏi bảng danh sách.
   **PHÂN HỆ: QUẢN LÝ BỘ MÔN (BoMon)**
7. Lọc & Hiển thị Danh sách Bộ môn theo Khoa
   Thao tác người dùng:
   Khi vào màn hình Danh mục đào tạo → Quản lý Bộ môn, dropdown "Khoa" mặc định ở trạng thái "Tất cả các Khoa" → bảng hiển thị toàn bộ Bộ môn trong hệ thống.
   Người dùng select một Khoa cụ thể → bảng lập tức lọc lại tức thời, chỉ hiện các Bộ môn thuộc Khoa đó, không cần bấm nút "Tìm kiếm" hay tải lại trang.
   Nghiệp vụ xử lý:
   Trang tải lần đầu: GET /v1/api/bomon (không kèm tham số) qua checkPermission('BoMon', 'CanRead') → trả về toàn bộ BoMon.
   Khi select Khoa: GET /v1/api/bomon?maKhoa=<mã khoa> → backend thêm điều kiện WHERE MaKhoa = ?.
   Backend JOIN Khoa để hiển thị tên Khoa, JOIN GiangVien (qua MaTruongBoMon) để hiển thị tên Trưởng bộ môn, và đếm riêng số lượng GiangVien và số lượng MonHoc thuộc từng bộ môn.
   Dữ liệu đổ vào dropdown "Khoa" lấy từ GET /v1/api/khoa, gắn thêm 1 lựa chọn tĩnh "Tất cả các Khoa" ở đầu danh sách.
   Thay đổi CSDL: Không có, chỉ đọc (SELECT).
   Kết quả hiển thị: Bảng Data Table gồm Mã bộ môn, Tên bộ môn, Khoa trực thuộc, Tên Trưởng bộ môn (hiển thị "Chưa phân công" nếu NULL, chỉ để xem — không có nút chỉnh sửa), badge số Giảng viên, badge số Môn học.
8. Thêm mới Bộ môn
   Thao tác người dùng: Bấm "Thêm Bộ môn", nhập MaBoMon, TenBoMon, chọn Khoa trực thuộc (MaKhoa) từ dropdown. Không có ô nhập Trưởng bộ môn.
   Nghiệp vụ xử lý:
   Validation 1: MaBoMon, TenBoMon, MaKhoa không được trống.
   Validation 2: Chuẩn hóa MaBoMon (viết hoa, xóa khoảng trắng thừa).
   Validation 3 (khóa ngoại): Khoa được chọn phải tồn tại trong bảng Khoa.
   Validation 4 (check trùng): kiểm tra MaBoMon đã tồn tại chưa, nếu có trả lỗi 400 "Mã bộ môn 'X' đã tồn tại."
   Cột MaTruongBoMon luôn được gán NULL khi tạo mới — hệ thống không cung cấp cách gán ngay tại bước này.
   Thay đổi CSDL: Thêm 1 dòng vào BoMon với MaTruongBoMon = NULL.
   Kết quả hiển thị: Đóng modal, danh sách reload, bộ môn mới hiện với Trưởng bộ môn "Chưa phân công".
9. Cập nhật (Sửa) Thông tin Bộ môn
   Thao tác người dùng: Bấm "Sửa" tại dòng bộ môn, được sửa TenBoMon và/hoặc chuyển MaKhoa (chuyển bộ môn sang khoa khác). MaBoMon cố định vì là khóa ngoại trong GiangVien, MonHoc, TepNhap. Không có ô chỉnh Trưởng bộ môn trên form này.
   Nghiệp vụ xử lý:
   Validation: TenBoMon không trống; MaKhoa mới (nếu đổi) phải tồn tại trong bảng Khoa.
   Cảnh báo nghiệp vụ khi đổi Khoa trực thuộc: nếu bộ môn đang có sẵn MaTruongBoMon (được gán từ trước, không qua UI này), hệ thống nên cảnh báo Admin rằng việc đổi Khoa có thể ảnh hưởng tới tính hợp lý của phân công hiện tại — chỉ cảnh báo, không tự động xóa dữ liệu.
   Thay đổi CSDL: UPDATE BoMon SET TenBoMon = ?, MaKhoa = ? WHERE MaBoMon = ?.
   Kết quả hiển thị: Thông báo "Cập nhật bộ môn thành công", bảng làm mới.
10. Xem Chi tiết Bộ môn (Giảng viên & Môn học trực thuộc)
    Thao tác người dùng: Bấm vào tên/mã bộ môn để xem trang chi tiết.
    Nghiệp vụ xử lý: Truy vấn song song 2 danh sách con — tất cả GiangVien có MaBoMon này, và tất cả MonHoc có MaBoMon này (kèm SoTinChi, LoaiMonHoc).
    Thay đổi CSDL: Không có, chỉ đọc.
    Kết quả hiển thị: Trang chi tiết chia 2 tab/bảng con — "Danh sách Giảng viên" và "Danh sách Môn học" — mỗi dòng có thể bấm điều hướng sang phân hệ tương ứng.
11. Xóa Bộ môn (Kiểm tra ràng buộc toàn vẹn — 3 bảng con)
    Thao tác người dùng: Bấm "Xóa" tại dòng bộ môn, xác nhận trên popup.
    Nghiệp vụ xử lý — kiểm tra tuần tự, dừng ngay khi gặp ràng buộc đầu tiên bị vi phạm:
    Đếm số GiangVien có MaBoMon này. Nếu > 0 → chặn xóa, lỗi 400: "Không thể xóa Bộ môn 'X' vì đang có Y giảng viên trực thuộc. Vui lòng chuyển giảng viên sang bộ môn khác trước."
    Nếu qua bước 1, đếm số MonHoc có MaBoMon này. Nếu > 0 → chặn xóa, lỗi tương tự về môn học.
    Nếu qua bước 2, đếm số TepNhap có MaBoMon này. Nếu > 0 → chặn xóa để bảo toàn lịch sử nhập liệu.
    Chỉ khi cả 3 điều kiện đều bằng 0 mới cho phép xóa.
    Thay đổi CSDL: Nếu đủ điều kiện, DELETE FROM BoMon WHERE MaBoMon = ?.
    Kết quả hiển thị: Dòng bộ môn biến mất khỏi bảng danh sách.
    **PHÂN HỆ: QUẢN LÝ GIẢNG VIÊN (GiangVien) — Bản rút gọn đúng cấu trúc bảng**
12. Tìm kiếm, Lọc & Hiển thị Danh sách Giảng viên
    • Thao tác người dùng: Vào Danh mục đào tạo → Quản lý Giảng viên. Lọc theo Bộ môn (MaBoMon — dropdown lấy từ BoMon, mặc định "Tất cả Bộ môn", có thêm lựa chọn phụ "Chưa phân bộ môn" để lọc riêng các dòng MaBoMon IS NULL), lọc theo Trạng thái (TrangThai: Active/Inactive), hoặc gõ từ khóa tìm theo HoTen, Email, MaGiangVien.
    • Nghiệp vụ xử lý:
    o Gọi GET /v1/api/giangvien?maBoMon=...&trangThai=...&search=... qua checkPermission('GiangVien', 'CanRead').
    o Backend LEFT JOIN BoMon (bắt buộc LEFT JOIN vì MaBoMon có thể NULL) để hiển thị tên Bộ môn; LEFT JOIN Users để hiển thị đã/chưa có tài khoản đăng nhập.
    • Thay đổi CSDL: Không có, chỉ đọc.
    • Kết quả hiển thị: Bảng gồm Mã GV, Họ tên, Email, SĐT, Bộ môn (hoặc "Chưa phân công"), Badge trạng thái (Active = xanh / Inactive = xám), badge nhỏ báo hiệu đã liên kết tài khoản hay chưa.

---

2. Thêm mới Giảng viên
   • Thao tác người dùng: Bấm "Thêm Giảng viên", nhập MaGiangVien, HoTen, Email, SoDienThoai, chọn Bộ môn (không bắt buộc — có thể để trống). Không có ô chọn tài khoản đăng nhập ở bước này.
   • Nghiệp vụ xử lý:
   o Validation 1: MaGiangVien, HoTen không được trống (2 cột NOT NULL duy nhất ngoài TrangThai).
   o Validation 2: Chuẩn hóa MaGiangVien (viết hoa, xóa khoảng trắng thừa).
   o Validation 3 (check trùng): kiểm tra MaGiangVien đã tồn tại chưa, nếu có trả lỗi 400 "Mã giảng viên đã tồn tại."
   o Validation 4 (khóa ngoại có điều kiện): nếu có chọn MaBoMon, phải kiểm tra Bộ môn đó tồn tại trong bảng BoMon; nếu để trống thì lưu NULL, bỏ qua kiểm tra.
   o Validation 5 (tùy chọn nên có dù CSDL không ràng buộc): kiểm tra định dạng Email hợp lệ, SoDienThoai đúng định dạng số điện thoại nếu người dùng có nhập (vì 2 cột này cho phép NULL nhưng nếu nhập thì nên đúng định dạng).
   o TrangThai mặc định CSDL tự gán 'Active'. UserId mặc định NULL.
   • Thay đổi CSDL: Thêm 1 dòng vào GiangVien với TrangThai = 'Active', UserId = NULL.
   • Kết quả hiển thị: Đóng modal, danh sách reload, giảng viên mới hiện với trạng thái Active, cột tài khoản hiện "Chưa liên kết".

---

3. Cập nhật (Sửa) Thông tin Giảng viên
   • Thao tác người dùng: Bấm "Sửa" tại dòng giảng viên, được sửa HoTen, Email, SoDienThoai, và chuyển MaBoMon (kể cả đổi từ có bộ môn sang "Chưa phân công" hoặc ngược lại). MaGiangVien cố định vì là khóa ngoại trong rất nhiều bảng con.
   • Nghiệp vụ xử lý:
   o Validation giống mục 2 (áp dụng lại cho MaBoMon, Email, SoDienThoai).
   o Cảnh báo nghiệp vụ: nếu giảng viên đang được gán làm MaTruongBoMon của chính Bộ môn hiện tại, hoặc MaTruongKhoa của một Khoa nào đó, mà bị đổi MaBoMon sang bộ môn khác → cảnh báo Admin rà soát lại phân công lãnh đạo (chỉ cảnh báo, không tự động gỡ).
   • Thay đổi CSDL: UPDATE GiangVien SET HoTen=?, Email=?, SoDienThoai=?, MaBoMon=? WHERE MaGiangVien=?.
   • Kết quả hiển thị: Thông báo "Cập nhật giảng viên thành công", bảng làm mới.

---

4. Đổi Trạng thái Vận hành (Toggle: Active ↔ Inactive)
   • Thao tác người dùng: Bấm nút "Ngừng công tác" hoặc "Kích hoạt lại" nhanh trên bảng danh sách.
   • Nghiệp vụ xử lý:
   o Chuyển 'Active' → 'Inactive': nên cảnh báo nếu giảng viên đang có LopHocPhan với TrangThaiPhanCong chưa hoàn tất, hoặc đang có BuoiHoc sắp diễn ra trong tương lai — hỏi Admin xác nhận trước, vì ảnh hưởng tới thuật toán xếp lịch (không nên gợi ý giảng viên Inactive khi phân công dạy mới).
   o Chuyển 'Inactive' → 'Active': giảng viên xuất hiện trở lại trong danh sách gợi ý phân công giảng dạy.
   • Thay đổi CSDL: Chỉ đổi cột TrangThai giữa 2 giá trị.
   • Kết quả hiển thị: Badge trạng thái đổi màu tức thời (xanh ↔ xám), không cần tải lại trang.

---

5. Xem Chi tiết Giảng viên
   • Thao tác người dùng: Bấm vào tên/mã giảng viên để xem trang chi tiết.
   • Nghiệp vụ xử lý: Truy vấn tổng hợp: danh sách LopHocPhan đang phụ trách, các YeuCauNghi đã gửi, các PhanCongDayThay đã nhận dạy thay, các DangKyDayBu đã đăng ký — tất cả lọc theo MaGiangVien này.
   • Thay đổi CSDL: Không có, chỉ đọc.
   • Kết quả hiển thị: Trang chi tiết chia nhiều tab: "Lớp học phần đang dạy", "Lịch sử xin nghỉ", "Lịch sử dạy thay/dạy bù".

---

6. Xóa Giảng viên (Kiểm tra ràng buộc toàn vẹn — nhiều nhất hệ thống)
   • Thao tác người dùng: Bấm "Xóa" tại dòng giảng viên, xác nhận trên popup.
   • Nghiệp vụ xử lý — kiểm tra tuần tự qua 7 bảng, dừng ngay khi gặp ràng buộc đầu tiên bị vi phạm:
1. Khoa.MaTruongKhoa — đang là Trưởng khoa của khoa nào không.
1. BoMon.MaTruongBoMon — đang là Trưởng bộ môn của bộ môn nào không.
1. LopHocPhan.MaGiangVien — đang phụ trách lớp học phần nào không.
1. BuoiHoc.MaGiangVien — đã từng đứng lớp buổi học nào không (kể cả buổi học quá khứ, để giữ lịch sử).
1. YeuCauNghi.MaGiangVien hoặc MaGiangVienDuyet — có yêu cầu nghỉ đã gửi hoặc đã duyệt cho người khác không.
1. PhanCongDayThay.MaGiangVienDayThay — đã từng được phân công dạy thay không.
1. DangKyDayBu.MaGiangVien — đã từng đăng ký dạy bù không.
   o Nếu bất kỳ bảng nào ở trên có bản ghi liên quan → CHẶN XÓA, báo lỗi 400 nêu rõ đang vướng ở bảng nào.
   o Chỉ khi cả 7 điều kiện đều bằng 0 mới cho phép xóa.
   • Khuyến nghị nghiệp vụ: Vì gần như mọi giảng viên đã hoạt động đều sẽ vướng ít nhất bảng BuoiHoc, nên chức năng Xóa cứng gần như không dùng được trong thực tế. Khuyến nghị hướng người dùng dùng chức năng Đổi trạng thái sang Inactive (mục 5) thay vì xóa, chỉ giữ nút Xóa cứng cho trường hợp hiếm — nhập nhầm dữ liệu giảng viên chưa từng phát sinh hoạt động nào.
   • Thay đổi CSDL: Nếu đủ điều kiện, DELETE FROM GiangVien WHERE MaGiangVien = ?.
   • Kết quả hiển thị: Dòng giảng viên biến mất khỏi bảng danh sách.

##

## PHÂN HỆ: QUẢN LÝ MÔN HỌC (MonHoc)

Bảng tác động chính: MonHoc (MaMonHoc, TenMonHoc, SoTinChi, MaBoMon, LoaiMonHoc)

Bảng liên quan: BoMon (cha, FK MaBoMon, được phép NULL), LopHocPhan (con, FK MaMonHoc, bắt buộc — mỗi Lớp học phần phải gắn với đúng 1 Môn học)

ResourceId dùng cho checkPermission: 'MonHoc'

SoTinChi được phép NULL → nghiệp vụ cho phép tạo Môn học chưa khai báo số tín chỉ (ví dụ đang chờ Bộ môn duyệt khung chương trình), nhưng nên khuyến khích nhập ngay vì số tín chỉ ảnh hưởng tới thời lượng xếp lịch.
MaBoMon được phép NULL → giống Giảng viên, cho phép tồn tại Môn học "chưa phân về Bộ môn nào quản lý" tạm thời.
LoaiMonHoc mặc định CSDL tự gán 'Regular' khi không nhập — đây là cột kiểu chuỗi tự do, hiện chưa thấy tài liệu nghiệp vụ nào quy định rõ danh sách các giá trị chuẩn hóa khác ngoài 'Regular'. Cần hỏi lại bên nghiệp vụ xem có những loại môn học cố định nào khác (ví dụ: Bắt buộc/Tự chọn, hay Lý thuyết/Thực hành/Đồ án...) trước khi làm dropdown cố định — tạm thời có thể để dạng ô nhập chuỗi tự do.

1. Lọc & Hiển thị danh sách

Vì mọi Môn học giờ luôn có Bộ môn, nên bỏ lựa chọn phụ "Chưa phân bộ môn" trong dropdown lọc (đã đề cập ở bản trước) — không còn trường hợp này xảy ra qua giao diện tạo mới nữa. Dropdown lọc chỉ còn: "Tất cả Bộ môn" hoặc chọn đích danh 1 Bộ môn.

2. Thêm mới Môn học

Thao tác người dùng: Bấm "Thêm Môn học" → nhập MaMonHoc, TenMonHoc, chọn Bộ môn (MaBoMon — bắt buộc, không còn tùy chọn để trống), nhập SoTinChi ( bắt buộc), LoaiMonHoc (không bắt buộc).
Nghiệp vụ xử lý:
Validation 1: MaMonHoc, TenMonHoc, MaBoMon không được để trống.
Validation 2: Chuẩn hóa MaMonHoc (viết hoa, xóa khoảng trắng thừa).
Validation 3 (check trùng): kiểm tra MaMonHoc đã tồn tại chưa.
Validation 4 (khóa ngoại bắt buộc): Bộ môn được chọn phải tồn tại trong bảng BoMon — không còn nhánh "bỏ qua nếu để trống" như bản trước.
Validation 5: nếu có nhập SoTinChi thì phải là số nguyên dương.
Nếu người dùng không chọn Bộ môn → chặn submit ngay ở form (frontend) và/hoặc trả lỗi 400 ở backend nếu cố tình gửi thiếu: "Vui lòng chọn Bộ môn quản lý cho môn học này."
Thay đổi CSDL: Thêm 1 dòng vào MonHoc với MaBoMon luôn có giá trị (không còn NULL).
Kết quả hiển thị: Đóng modal, danh sách reload, môn học mới hiện kèm tên Bộ môn quản lý.

3. Cập nhật thông tin

Khi Sửa, MaBoMon vẫn hiển thị và cho phép đổi sang Bộ môn khác (chuyển môn học sang Bộ môn khác quản lý), nhưng không được phép để trống/xóa về NULL — dropdown Bộ môn lúc Sửa không có lựa chọn "Chưa phân công" như bên Giảng viên.
Validation: TenMonHoc không trống, MaBoMon không trống và phải tồn tại.

4. Xem chi tiết

Bấm vào tên/mã Môn học → trang chi tiết hiển thị danh sách các LopHocPhan đã/đang mở cho môn này (lọc theo MaMonHoc), kèm học kỳ, giảng viên phụ trách, sĩ số.
Chỉ đọc, mỗi dòng có thể bấm nhảy sang phân hệ Lớp học phần tương ứng.

5. Xóa Môn học

Bấm "Xóa" → popup xác nhận → kiểm tra duy nhất 1 ràng buộc: đếm số LopHocPhan có MaMonHoc này.
Nếu > 0 → CHẶN XÓA, báo lỗi 400: "Không thể xóa môn học 'X' vì đang có Y lớp học phần được mở cho môn này."
Nếu = 0 → cho phép DELETE.
Dòng biến mất khỏi bảng khi xóa thành công.

##

## PHÂN HỆ: QUẢN LÝ LỚP SINH VIÊN (LopSinhVien)

Bảng tác động chính: LopSinhVien (MaLopSinhVien, TenLopSinhVien, MaKhoa)
Bảng liên quan: Khoa (cha, FK MaKhoa, bắt buộc), LopHocPhan_LopSinhVien (bảng trung gian, con, FK MaLopSinhVien)
ResourceId dùng cho checkPermission: 'LopSinhVien'

Đây là bảng đơn giản nhất trong các phân hệ danh mục đã làm — chỉ 3 cột, không có cột trạng thái, không có trường tùy chọn (mọi cột đều NOT NULL).

Luồng chi tiết từng chức năng

1. Lọc & Hiển thị danh sách

Vào Danh mục đào tạo → Quản lý Lớp sinh viên → mặc định dropdown "Khoa" = "Tất cả các Khoa" (đúng pattern lọc theo Khoa đã áp dụng cho Bộ môn).
Select 1 Khoa cụ thể → bảng lọc lại ngay, gọi GET /v1/api/lopsinhvien?maKhoa=....
Có thể kèm ô tìm từ khóa theo TenLopSinhVien/MaLopSinhVien nếu 1 Khoa có nhiều lớp.
Backend JOIN Khoa (INNER JOIN được, vì MaKhoa là NOT NULL) để hiển thị tên Khoa.
Mỗi dòng hiển thị: Mã lớp, Tên lớp, Khoa quản lý, badge số Lớp học phần đang tham gia (đếm qua bảng trung gian LopHocPhan_LopSinhVien).

2. Thêm mới Lớp sinh viên

Bấm "Thêm Lớp sinh viên" → nhập MaLopSinhVien, TenLopSinhVien, chọn Khoa (bắt buộc, không có lựa chọn để trống vì cột NOT NULL) → bấm "Lưu".
Validate: cả 3 trường đều không được trống; chuẩn hóa MaLopSinhVien (viết hoa, xóa khoảng trắng thừa); check trùng mã; check Khoa được chọn tồn tại trong bảng Khoa.
Ghi 1 dòng mới → đóng modal → bảng reload.

3. Cập nhật thông tin

Bấm "Sửa" tại dòng → sửa TenLopSinhVien và/hoặc đổi MaKhoa (chuyển lớp sang Khoa khác quản lý — hiếm khi xảy ra nhưng vẫn nên cho phép, ví dụ sáp nhập/tách Khoa). MaLopSinhVien khóa cứng vì là khóa ngoại trong bảng trung gian LopHocPhan_LopSinhVien.
Validate: TenLopSinhVien không trống, MaKhoa không trống và phải tồn tại.
Lưu → UPDATE → thông báo thành công → bảng reload.

4. Xóa Lớp sinh viên

Bấm "Xóa" → popup xác nhận → kiểm tra duy nhất 1 ràng buộc: đếm số dòng trong LopHocPhan_LopSinhVien có MaLopSinhVien này (tức lớp đã từng/đang học ghép với Lớp học phần nào chưa).
Nếu > 0 → CHẶN XÓA, báo lỗi 400: "Không thể xóa lớp sinh viên 'X' vì đang tham gia Y lớp học phần."
Nếu = 0 → cho phép DELETE.
Dòng biến mất khỏi bảng khi xóa thành công.

##

##

PHÂN HỆ: QUẢN LÝ KHÓA SINH VIÊN (KhoaSinhVien)

Bảng tác động chính: KhoaSinhVien (MaKhoaSinhVien, TenKhoaSinhVien)
Bảng liên quan: LopHocPhan (con, FK KhoaHoc → KhoaSinhVien.MaKhoaSinhVien, được phép NULL)

Luồng chi tiết từng chức năng

1. Hiển thị danh sách

Vào Danh mục đào tạo → Quản lý Khóa sinh viên → hiển thị toàn bộ danh sách ngay, không cần bộ lọc theo bảng cha (vì bảng này đứng độc lập, không có MaKhoa/MaBoMon nào để lọc theo).
Chỉ cần 1 ô tìm kiếm từ khóa theo TenKhoaSinhVien/MaKhoaSinhVien (danh sách này thường rất ngắn — vài niên khóa như K62, K63, K64, K65 — nên có thể không cần cả phân trang).
Gọi GET /v1/api/khoasinhvien?search=....
Mỗi dòng hiển thị: Mã khóa (VD K65), Tên khóa (VD "Khóa 65"), badge số Lớp học phần đang gắn niên khóa này (đếm qua LopHocPhan.KhoaHoc).

2. Thêm mới Khóa sinh viên

Bấm "Thêm Khóa sinh viên" → nhập MaKhoaSinhVien (VD K66), TenKhoaSinhVien (VD "Khóa 66") → bấm "Lưu".
Validate: cả 2 trường không được trống (đều NOT NULL); chuẩn hóa mã (viết hoa, xóa khoảng trắng thừa); check trùng mã.
Ghi 1 dòng mới → đóng modal → bảng reload.

3. Cập nhật thông tin

Bấm "Sửa" tại dòng → chỉ sửa được TenKhoaSinhVien. MaKhoaSinhVien khóa cứng vì là khóa ngoại trong LopHocPhan.KhoaHoc.
Validate: TenKhoaSinhVien không trống.
Lưu → UPDATE → thông báo thành công → bảng reload.

4. Xóa Khóa sinh viên

Bấm "Xóa" → popup xác nhận → kiểm tra duy nhất 1 ràng buộc: đếm số LopHocPhan có KhoaHoc = mã khóa này.
Nếu > 0 → CHẶN XÓA, báo lỗi 400: "Không thể xóa khóa sinh viên 'K65' vì đang có X lớp học phần gắn với niên khóa này."
Nếu = 0 → cho phép DELETE.
Dòng biến mất khỏi bảng khi xóa thành công.

## QUẢN LÝ HỌC KỲ (HocKy)##

Bảng tác động chính: HocKy (MaHocKy, TenHocKy, Dot, NamHoc, NgayBatDau, NgayKetThuc)
Bảng liên quan: LopHocPhan (con, FK MaHocKy, bắt buộc)
ResourceId dùng cho checkPermission: 'HocKy'

## Cấu trúc dữ liệu cần lưu ý##

Dot (Đợt) và NamHoc (Năm học) đều được phép NULL — CSDL không bắt buộc, nhưng nên khuyến nghị bắt buộc nhập ở tầng ứng dụng vì đây là 2 thông tin quan trọng để phân biệt các học kỳ trùng số (VD "Học kỳ 1" của năm 2024-2025 khác với "Học kỳ 1" của năm 2025-2026), giống nguyên tắc "CSDL cho NULL nhưng nghiệp vụ bắt buộc" đã áp dụng cho MonHoc.MaBoMon.
NgayBatDau, NgayKetThuc là NOT NULL — đây là khoảng thời gian tổng của cả học kỳ, dùng làm giới hạn hợp lệ khi xếp ThoiKhoaBieu cho từng Lớp học phần thuộc học kỳ này (ngày giai đoạn lịch không được vượt ra ngoài khoảng này).
Chức năng

1. Tìm kiếm & Hiển thị danh sách Học kỳ

Hiển thị toàn bộ, sắp xếp theo NgayBatDau giảm dần (học kỳ mới nhất lên đầu) — vì đây là bảng có ít bản ghi (vài chục học kỳ trong suốt vòng đời hệ thống), không cần lọc phức tạp, có thể chỉ cần ô tìm theo TenHocKy/NamHoc.
Mỗi dòng hiển thị: Mã học kỳ, Tên học kỳ, Đợt, Năm học, Ngày bắt đầu – kết thúc, badge số Lớp học phần đã mở trong học kỳ này.

2. Thêm mới Học kỳ

Nhập MaHocKy, TenHocKy, Dot, NamHoc, NgayBatDau, NgayKetThuc.
Validate 1: MaHocKy, TenHocKy không trống; check trùng mã.
Validate 2: NgayBatDau phải nhỏ hơn NgayKetThuc.
Validate 3 (khuyến nghị nên có): kiểm tra chồng lấn ngày (overlap check) với các Học kỳ đã tồn tại — nếu khoảng [NgayBatDau, NgayKetThuc] giao nhau với 1 học kỳ khác đã có → cảnh báo Admin xác nhận có thực sự muốn tạo học kỳ trùng thời gian không (trường hợp hợp lệ hiếm gặp: 2 hệ đào tạo chạy song song có lịch lệch nhau).
Ghi 1 dòng mới vào HocKy.

3. Cập nhật thông tin Học kỳ

Sửa TenHocKy, Dot, NamHoc, NgayBatDau, NgayKetThuc. MaHocKy khóa cứng vì là khóa ngoại trong LopHocPhan.
Cảnh báo quan trọng khi thu hẹp NgayBatDau/NgayKetThuc: nếu học kỳ đã có LopHocPhan với ThoiKhoaBieu/BuoiHoc nằm ngoài khoảng ngày mới → phải cảnh báo rõ, không tự động xóa dữ liệu lịch đã sinh, để Admin tự quyết định xử lý thủ công.

4. Xóa Học kỳ

Kiểm tra ràng buộc: đếm số LopHocPhan có MaHocKy này.
Nếu > 0 → CHẶN XÓA, báo lỗi 400: "Không thể xóa học kỳ 'X' vì đang có Y lớp học phần thuộc học kỳ này."
Nếu = 0 → cho phép DELETE.

## PHÂN HỆ: QUẢN LÝ TIẾT HỌC (TietHoc)

Bảng tác động chính: TietHoc (MaTiet, TenTiet, GioBatDau, GioKetThuc)
Bảng liên quan (ràng buộc): ThoiKhoaBieu (FK MaTietBatDau/MaTietKetThuc), BuoiHoc (FK MaTietBatDau/MaTietKetThuc)
ResourceId dùng cho checkPermission: 'TietHoc'

Cấu trúc dữ liệu và quy ước của trường
Cả 4 cột đều NOT NULL.
Mỗi dòng TietHoc đại diện cho một ca gồm nhiều tiết, vì nhà trường chỉ quy định giờ theo khối chứ không theo từng tiết lẻ.
Dữ liệu chuẩn (seed sẵn khi triển khai):
MaTiet TenTiet GioBatDau GioKetThuc
1 Tiết 1-3 07:00 09:25
2 Tiết 4-6 09:35 12:00
3 Tiết 7-9 13:00 15:25
4 Tiết 10-12 15:35 18:00
5 Tiết 13-16 (tối) 18:00 21:30
Một lớp học nhiều ca liền nhau được biểu diễn bằng MaTietBatDau và MaTietKetThuc khác nhau. Ví dụ học tiết 1-6 là MaTietBatDau = 1, MaTietKetThuc = 2.
Đơn vị nhỏ nhất của hệ thống là ca. Nếu sau này cần xếp lịch chính xác đến từng tiết lẻ thì phải thiết kế lại.
Giờ học chỉ được sửa tại phân hệ này. ThoiKhoaBieu và BuoiHoc chỉ lưu mã tiết, không có cột giờ riêng, nên mọi nơi khác chỉ hiển thị giờ để xem.

1. Hiển thị danh sách Tiết học
   Thao tác người dùng: Vào Danh mục đào tạo → Quản lý Tiết học.
   Nghiệp vụ xử lý:
   Gọi GET /v1/api/tiethoc qua checkPermission('TietHoc', 'CanRead').
   Sắp xếp theo GioBatDau tăng dần.
   Danh sách chỉ có khoảng 5 dòng nên không cần bộ lọc hay phân trang.
   Thay đổi CSDL: Không có, chỉ đọc.
   Kết quả hiển thị: Bảng gồm Mã tiết, Tên tiết, Giờ bắt đầu, Giờ kết thúc. Nếu một dòng có giờ khác mẫu chuẩn thì hiện nhãn nhỏ "Đã chỉnh khác mẫu chuẩn".
2. Thêm mới Tiết học (có tự động điền giờ)
   Thao tác người dùng:
   Bấm "Thêm Tiết học".
   Chọn mẫu tiết từ dropdown gồm 5 mẫu chuẩn ở trên và thêm lựa chọn "Tùy chỉnh (nhập tay)".
   Ngay khi chọn mẫu, hệ thống tự động điền TenTiet, GioBatDau, GioKetThuc.
   Người dùng vẫn sửa được cả ba ô sau khi điền, ví dụ đổi 09:35 thành 09:30.
   Nhập MaTiet rồi bấm "Lưu".
   Nghiệp vụ xử lý:
   Danh sách 5 mẫu chuẩn là hằng số cấu hình của hệ thống, không tạo bảng CSDL riêng. Mẫu chỉ dùng để gợi ý điền nhanh.
   Chọn "Tùy chỉnh" thì các ô để trống, người dùng nhập toàn bộ.
   Validation 1: MaTiet, TenTiet, GioBatDau, GioKetThuc không được trống.
   Validation 2: MaTiet không trùng với dòng đã có, nếu trùng trả lỗi 400 "Mã tiết đã tồn tại."
   Validation 3: GioBatDau phải nhỏ hơn GioKetThuc.
   Validation 4 (kiểm tra chồng lấn giờ): so với mọi tiết đã có, hai khoảng giờ chỉ bị coi là chồng lấn khi tiết mới bắt đầu trước lúc tiết kia kết thúc và kết thúc sau lúc tiết kia bắt đầu. Hai ca chạm mốc vẫn hợp lệ, ví dụ Tiết 10-12 kết thúc 18:00 và ca tối bắt đầu 18:00. Nếu chồng lấn thì chặn, trả lỗi 400: "Khung giờ của tiết này trùng với 'Tiết X' đã tồn tại."
   Kiểm tra chồng lấn áp dụng cho giá trị cuối cùng trên form (sau khi người dùng chỉnh), không phải giá trị mẫu.
   Thay đổi CSDL: Thêm 1 dòng vào TietHoc với đúng giá trị cuối cùng trên form.
   Kết quả hiển thị: Đóng modal, danh sách tải lại và xuất hiện dòng mới.
3. Cập nhật (Sửa) Thông tin Tiết học
   Thao tác người dùng: Bấm "Sửa" tại dòng tiết học, chỉnh TenTiet, GioBatDau, GioKetThuc, rồi bấm "Lưu Thay Đổi".
   Nghiệp vụ xử lý:
   Form nạp giá trị hiện có trong CSDL, không ghi đè bằng mẫu chuẩn. Dropdown chọn mẫu bị khóa.
   MaTiet cố định, không cho sửa, vì là khóa ngoại trong ThoiKhoaBieu và BuoiHoc.
   Có nút phụ "Khôi phục giờ chuẩn" để đưa hai ô giờ về giá trị mẫu tương ứng với TenTiet, dùng khi lỡ sửa nhầm.
   Validation: các trường không trống, GioBatDau < GioKetThuc, kiểm tra chồng lấn giờ như mục 2 (loại trừ chính dòng đang sửa khỏi phép so sánh).
   Cảnh báo ảnh hưởng lịch đã xếp: vì lịch chỉ lưu mã tiết, đổi giờ ở đây sẽ áp dụng ngay cho mọi buổi học đang dùng tiết này. Hệ thống đếm số ThoiKhoaBieu và BuoiHoc đang tham chiếu tới tiết đó. Nếu lớn hơn 0 thì hiện cảnh báo, ví dụ "Có X buổi học đang sử dụng tiết này, thay đổi giờ sẽ áp dụng cho toàn bộ các buổi học đó", và yêu cầu Admin xác nhận trước khi lưu.
   Thay đổi CSDL: Cập nhật các cột TenTiet, GioBatDau, GioKetThuc của bản ghi có MaTiet tương ứng.
   Kết quả hiển thị: Đóng modal, thông báo "Cập nhật tiết học thành công!", bảng làm mới.
4. Xóa Tiết học
   Thao tác người dùng: Bấm icon "Xóa" tại dòng tiết học và xác nhận trên popup.
   Nghiệp vụ xử lý (kiểm tra tuần tự 2 bảng, dừng ngay khi vướng):
   Đếm số ThoiKhoaBieu có MaTietBatDau hoặc MaTietKetThuc bằng mã tiết này. Nếu > 0 thì chặn xóa, trả lỗi 400: "Không thể xóa tiết học vì đang được dùng trong Y giai đoạn thời khóa biểu."
   Nếu qua bước 1, đếm số BuoiHoc có MaTietBatDau hoặc MaTietKetThuc bằng mã tiết này. Nếu > 0 thì chặn xóa, báo lỗi tương tự về buổi học.
   Chỉ khi cả 2 bằng 0 mới cho phép xóa. Thực tế chỉ xóa được các tiết vừa tạo nhầm, chưa từng dùng để xếp lịch.
   Thay đổi CSDL: Nếu đủ điều kiện, bản ghi bị xóa vĩnh viễn khỏi bảng TietHoc.
   Kết quả hiển thị: Dòng tiết học biến mất khỏi bảng.

##
