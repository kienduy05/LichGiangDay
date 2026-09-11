# TÀI LIỆU CHI TIẾT NGHIỆP VỤ TỪNG CHỨC NĂNG (FUNCTIONAL BUSINESS SPECIFICATION)

**Dự án**: Hệ thống Quản lý Lịch Giảng Dạy & Thời khóa biểu Trường Đại học (`LichGiangDay`)  
**Phân hệ**: Quản lý Tòa nhà & Quản lý Phòng học (Danh mục Đào tạo)  
**Tác giả**: Business Analyst (BA)  
**Ngày cập nhật**: 11/09/2026  

---

## 1. PHÂN HỆ 1: QUẢN LÝ TÒA NHÀ (`ToaNha`)

Bảng dữ liệu tác động trong CSDL: **`ToaNha`** (`MaToaNha`, `TenToaNha`, `CoSo`, `DiaChi`).

---

### 1.1. Chức năng: Tìm kiếm & Hiển thị Danh sách Tòa nhà
- **Thao tác người dùng (User Action)**:
  - Người dùng chọn menu `Danh mục đào tạo` $\rightarrow$ `Quản lý Tòa nhà`.
  - Nhập từ khóa vào ô tìm kiếm (Mã tòa nhà, Tên tòa nhà, Cơ sở).
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/toanha?search=...`.
  - Hệ thống kiểm tra quyền `CanRead` trên Resource `ToaNha`.
  - Backend thực hiện truy vấn SQL JOIN đếm số lượng phòng học thuộc từng tòa nhà:
    ```sql
    SELECT t.MaToaNha, t.TenToaNha, t.CoSo, t.DiaChi, COUNT(p.MaPhong) AS RoomCount 
    FROM ToaNha t 
    LEFT JOIN PhongHoc p ON t.MaToaNha = p.MaToaNha 
    GROUP BY t.MaToaNha;
    ```
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (Chế độ đọc - `SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Bảng Data Table hiển thị danh sách các tòa nhà kèm badge số lượng phòng học trực thuộc.

---

### 1.2. Chức năng: Thêm mới Tòa nhà
- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Thêm Tòa Nhà"**.
  - Nhập thông tin trên Form: **Mã tòa nhà** (`MaToaNha`), **Tên tòa nhà** (`TenToaNha`), **Cơ sở** (`CoSo`), **Địa chỉ** (`DiaChi`).
  - Nhấn **"Lưu Tòa Nhà"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - **Validation 1**: `MaToaNha` và `TenToaNha` không được để trống.
  - **Validation 2**: Chuẩn hóa `MaToaNha` (Tự động viết hoa `UPPERCASE`, xóa khoảng trắng thừa).
  - **Validation 3 (Check trùng)**: Truy vấn `SELECT MaToaNha FROM ToaNha WHERE MaToaNha = ?`.
    - Nếu đã tồn tại $\rightarrow$ Trả lỗi: *"Mã tòa nhà 'A1' đã tồn tại trong hệ thống."* (HTTP 400).
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Tạo mới 1 dòng bản ghi trong bảng `ToaNha`**:
    - `MaToaNha`: Mã tòa nhà vừa nhập (VD: `'A1'`).
    - `TenToaNha`: Tên tòa nhà vừa nhập (VD: `'Giảng đường A1'`).
    - `CoSo`: Cơ sở đào tạo (VD: `'Cơ sở 1'`).
    - `DiaChi`: Địa chỉ tòa nhà (VD: `'280 An Dương Vương'`).
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, tải lại bảng dữ liệu, xuất hiện dòng tòa nhà mới tạo.

---

### 1.3. Chức năng: Cập nhật (Sửa) Thông tin Tòa nhà
- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Sửa"** (Edit) tại dòng tòa nhà tương ứng.
  - Thay đổi **Tên tòa nhà**, **Cơ sở**, hoặc **Địa chỉ**.
  - Nhấn **"Lưu Thay Đổi"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Cố định khóa chính `MaToaNha` (Không cho phép sửa Mã tòa nhà để tránh làm đứt gãy quan hệ khóa ngoại với Phòng học).
  - Validation: `TenToaNha` không được để trống.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Thay đổi giá trị các cột của bản ghi có `MaToaNha` trong bảng `ToaNha`**:
    - Cột `TenToaNha` $\rightarrow$ Cập nhật tên mới.
    - Cột `CoSo` $\rightarrow$ Cập nhật cơ sở mới.
    - Cột `DiaChi` $\rightarrow$ Cập nhật địa chỉ mới.
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, hiển thị thông báo "Cập nhật tòa nhà thành công!", dữ liệu trên bảng được làm mới.

---

### 1.4. Chức năng: Xóa Tòa nhà (Kiểm tra Ràng buộc toàn vẹn)
- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Xóa"** (Trash) tại dòng tòa nhà.
  - Xác nhận trên Popup xác nhận xóa.
- **Nghiệp vụ xử lý (Business Logic)**:
  - **Kiểm tra ràng buộc toàn vẹn CSDL (Data Integrity Constraint)**:
    - Backend truy vấn đếm số lượng phòng học trực thuộc tòa nhà này:
      ```sql
      SELECT COUNT(*) AS RoomCount FROM PhongHoc WHERE MaToaNha = ?;
      ```
    - **Trường hợp `RoomCount > 0`**: **CHẶN XÓA HOÀN TOÀN**. Trả lỗi HTTP 400 Bad Request: *"Không thể xóa Tòa nhà 'A1' vì đang chứa X phòng học. Vui lòng xóa hoặc di chuyển các phòng học trước."*
    - **Trường hợp `RoomCount == 0`**: Tiến hành xóa.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Trường hợp xóa thành công**: Bản ghi bị **XÓA VĨNH VIỄN** khỏi bảng `ToaNha`:
    ```sql
    DELETE FROM ToaNha WHERE MaToaNha = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Dòng tòa nhà tương ứng biến mất khỏi danh sách bảng.

---

## 2. PHÂN HỆ 2: QUẢN LÝ PHÒNG HỌC (`PhongHoc`)

Bảng dữ liệu tác động trong CSDL: **`PhongHoc`** (`MaPhong`, `TenPhong`, `MaToaNha`, `SucChua`, `LoaiPhong`, `TrangThai`).

> 📌 **CHÚ THÍCH CÁC TRƯỜNG DỮ LIỆU ĐẶC THÙ TRONG CSDL (`PhongHoc`)**:
> - **Cột `TrangThai`**: Lưu giá trị mã chuỗi **`'Ready'`** (Sẵn sàng) hoặc **`'Maintenance'`** (Đang bảo trì).
> - **Cột `LoaiPhong`**: Lưu trực tiếp chuỗi Tiếng Việt thuộc 5 tùy chọn chuẩn hóa:
>   1. `'Phòng lý thuyết'` (Mặc định hệ thống)
>   2. `'Phòng thực hành máy tính'`
>   3. `'Hội trường'`
>   4. `'Phòng thí nghiệm'`
>   5. `'Xưởng thực hành'`

---

### 2.1. Chức năng: Tìm kiếm, Lọc & Hiển thị Danh sách Phòng học
- **Thao tác người dùng (User Action)**:
  - Người dùng truy cập menu `Danh mục đào tạo` $\rightarrow$ `Quản lý Phòng học`.
  - Chọn Bộ lọc: Theo **Tòa nhà** (`MaToaNha`), **Loại phòng** (`LoaiPhong`), **Trạng thái** (`TrangThai`: `Ready` / `Maintenance`) hoặc gõ từ khóa tìm kiếm.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Gửi request `GET /v1/api/phonghoc` kèm tham số lọc.
  - Backend truy vấn bảng `PhongHoc` kết hợp `ToaNha` để lấy tên tòa nhà hiển thị.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Không làm thay đổi CSDL** (`SELECT` Read-only).
- **Kết quả hiển thị (UI Response)**:
  - Hiển thị danh sách phòng học với các Badge trạng thái trực quan:
    - Giá trị CSDL `'Ready'` $\rightarrow$ Hiển thị Badge Xanh lá (**Sẵn sàng**)
    - Giá trị CSDL `'Maintenance'` $\rightarrow$ Hiển thị Badge Cam (**Đang bảo trì**)

---

### 2.2. Chức năng: Thêm mới Phòng học
- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Thêm Phòng Học"**.
  - Nhập: **Mã phòng** (`MaPhong`), **Tên phòng** (`TenPhong`), Chọn **Tòa nhà** (`MaToaNha`), **Sức chứa** (`SucChua`), **Loại phòng** (`LoaiPhong`).
  - Bấm **"Lưu Phòng Học"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - **Validation 1**: `MaPhong`, `TenPhong`, `MaToaNha` không được trống.
  - **Validation 2**: `SucChua` phải là số nguyên dương $> 0$.
  - **Validation 3 (Kiểm tra khóa ngoại `MaToaNha`)**: Tòa nhà được chọn phải tồn tại trong bảng `ToaNha`.
  - **Validation 4 (Kiểm tra trùng mã)**: Truy vấn `SELECT MaPhong FROM PhongHoc WHERE MaPhong = ?`.
    - Nếu đã có $\rightarrow$ Trả lỗi: *"Mã phòng học đã tồn tại."*
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Tạo mới 1 dòng bản ghi trong bảng `PhongHoc`**:
    - `MaPhong`: Mã phòng vừa nhập (VD: `'A1-101'`).
    - `TenPhong`: Tên phòng vừa nhập (VD: `'Phòng Máy Tính 01'`).
    - `MaToaNha`: Mã tòa nhà chọn (VD: `'A1'`).
    - `SucChua`: Sức chứa nhập (VD: `40`).
    - `LoaiPhong`: Chuỗi loại phòng được chọn (`'Phòng lý thuyết'`, `'Phòng thực hành máy tính'`, `'Hội trường'`, `'Phòng thí nghiệm'`, `'Xưởng thực hành'`). Mặc định nếu trống: `'Phòng lý thuyết'`.
    - `TrangThai`: Mặc định CSDL tự động gán giá trị chuỗi là **`'Ready'`** (Sẵn sàng phục vụ giảng dạy).
- **Kết quả hiển thị (UI Response)**:
  - Đóng Modal, hiển thị phòng học mới trên danh sách với trạng thái **Ready (Sẵn sàng)**.

---

### 2.3. Chức năng: Cập nhật (Sửa) Thông tin Phòng học
- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Sửa"** tại phòng học.
  - Chỉnh sửa: Tên phòng, Tòa nhà, Sức chứa, Loại phòng, Trạng thái (`Ready` / `Maintenance`).
  - Nhấn **"Lưu Thay Đổi"**.
- **Nghiệp vụ xử lý (Business Logic)**:
  - Cố định `MaPhong`. Validation các thông tin nhập hợp lệ.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Cập nhật các cột tương ứng trong bảng `PhongHoc` tại bản ghi `MaPhong`**:
    - `TenPhong` $\rightarrow$ Giá trị mới.
    - `MaToaNha` $\rightarrow$ Mã tòa nhà mới (nếu chuyển phòng sang tòa khác).
    - `SucChua` $\rightarrow$ Sức chứa mới.
    - `LoaiPhong` $\rightarrow$ Loại phòng mới.
    - `TrangThai` $\rightarrow$ Trạng thái mới (`'Ready'` hoặc `'Maintenance'`).
- **Kết quả hiển thị (UI Response)**:
  - Cập nhật thông tin bản ghi trong DB, làm mới bảng dữ liệu.

---

### 2.4. Chức năng: Đổi Trạng thái Vận hành (Toggle Status: Ready ↔ Maintenance)
- **Thao tác người dùng (User Action)**:
  - Bấm nút **"Bảo Trì"** hoặc **"Mở Sẵn Sàng"** nhanh trên bảng danh sách phòng học.
- **Nghiệp vụ xử lý (Business Logic)**:
  - **Trường hợp Chuyển từ `'Ready'` $\rightarrow$ `'Maintenance'`**:
    - Backend kiểm tra xem phòng học có đang trong thời gian diễn ra tiết học nào ngay tại thời điểm bấm hay không.
    - Nếu đang có lớp học diễn ra $\rightarrow$ Cảnh báo Admin: *"Phòng học đang có lớp diễn ra, bạn có chắc chắn muốn đưa vào bảo trì khẩn cấp?"*
  - **Trường hợp Chuyển từ `'Maintenance'` $\rightarrow$ `'Ready'`**:
    - Kích hoạt phòng hoạt động trở lại. Thuật toán xếp thời khóa biểu sẽ tự động đưa phòng này vào danh sách gợi ý phòng trống.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Bản ghi tương ứng trong bảng `PhongHoc` thay đổi duy nhất cột `TrangThai`**:
    - Nếu giá trị trong CSDL đang là `'Ready'` $\rightarrow$ CSDL cập nhật thành **`'Maintenance'`**.
    - Nếu giá trị trong CSDL đang là `'Maintenance'` $\rightarrow$ CSDL cập nhật thành **`'Ready'`**.
- **Kết quả hiển thị (UI Response)**:
  - Badge trạng thái trên dòng phòng học lập tức đổi màu (Xanh lá ↔ Cam) và hiển thị tương ứng (Ready ↔ Maintenance) không cần load lại trang.

---

### 2.5. Chức năng: Xóa Phòng học
- **Thao tác người dùng (User Action)**:
  - Bấm icon **"Xóa"** tại dòng phòng học, xác nhận xóa.
- **Nghiệp vụ xử lý (Business Logic)**:
  - **Kiểm tra ràng buộc ngoại với Thời khóa biểu (Foreign Key Integrity)**:
    - Backend truy vấn đếm số lượng lịch giảng dạy đã đăng ký phòng này trong bảng `LichGiangDay`:
      ```sql
      SELECT COUNT(*) AS ScheduleCount FROM LichGiangDay WHERE MaPhong = ?;
      ```
    - **Trường hợp `ScheduleCount > 0`**: **CHẶN XÓA**. Trả lỗi HTTP 400: *"Không thể xóa phòng học 'A1-101' vì đang có X buổi học được xếp tại phòng này."*
    - **Trường hợp `ScheduleCount == 0`**: Cho phép xóa.
- **Thay đổi / Trạng thái trong CSDL (Database State & Impact)**:
  - **Trường hợp xóa thành công**: Bản ghi bị **XÓA VĨNH VIỄN** khỏi bảng `PhongHoc`:
    ```sql
    DELETE FROM PhongHoc WHERE MaPhong = ?;
    ```
- **Kết quả hiển thị (UI Response)**:
  - Phòng học bị xóa khỏi CSDL và biến mất khỏi bảng danh sách.
