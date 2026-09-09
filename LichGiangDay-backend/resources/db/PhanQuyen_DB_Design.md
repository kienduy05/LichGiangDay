# Tài liệu Thiết kế Database - Phân quyền hệ thống (RBAC)

Tài liệu này mô tả chi tiết thiết kế cơ sở dữ liệu cho tính năng Phân quyền theo Nhóm (Role-Based Access Control) mức độ Bảng/Chức năng (Table/Resource-level).

## 1. Cấu trúc các bảng phân quyền

Hệ thống phân quyền được xây dựng xoay quanh 3 bảng cốt lõi và tích hợp vào bảng `Users`.

### 1.1. Bảng `Roles` (Nhóm quyền)
Lưu trữ danh mục các nhóm quyền có trong hệ thống.
- **`RoleId`** *(VARCHAR, PK)*: Mã định danh của nhóm quyền (VD: `ADMIN`, `PHONGDAOTAO`, `BOMON`, `KHOA`).
- **`RoleName`**: Tên hiển thị của nhóm quyền (VD: "Phòng đào tạo", "Khoa").
- **`IsSystem`**: Cờ đánh dấu các nhóm quyền hệ thống không thể bị xóa (VD: `ADMIN`).

### 1.2. Bảng `Resources` (Tài nguyên / Chức năng)
Lưu trữ danh sách các tài nguyên (thường là các bảng dữ liệu hoặc chức năng lớn) cần được bảo vệ và cấu hình phân quyền.
- **`ResourceId`** *(VARCHAR, PK)*: Mã định danh tài nguyên (VD: `RES_KHOA`, `RES_GIANGVIEN`).
- **`ResourceName`**: Tên hiển thị chức năng (VD: "Quản lý Khoa", "Quản lý Giảng viên").

### 1.3. Bảng `RolePermissions` (Chi tiết phân quyền)
Bảng trung gian (ma trận) lưu trữ chi tiết phân quyền giữa `Roles` và `Resources`.
- **`RoleId`**, **`ResourceId`** *(PK, FK)*: Khóa chính kép xác định quyền của một Nhóm trên một Tài nguyên.
- **`CanCreate`** *(BIT)*: Quyền thêm mới dữ liệu.
- **`CanRead`** *(BIT)*: Quyền xem danh sách / chi tiết.
- **`CanUpdate`** *(BIT)*: Quyền chỉnh sửa.
- **`CanDelete`** *(BIT)*: Quyền xóa.

---

## 2. Tích hợp với bảng `Users`

Mô hình phân quyền đang được thiết kế theo cấu trúc **1 User - 1 Role**:
- Bảng `Users` chứa cột **`Role`** đóng vai trò là Khóa ngoại (Foreign Key) trỏ đến `Roles(RoleId)`.
- Khi một User thực hiện thao tác, hệ thống sẽ xác định `RoleId` của họ và đối chiếu với bảng `RolePermissions` để kiểm tra quyền hạn.

---

## 3. Luồng hoạt động & Cách sử dụng

### 3.1. Kịch bản cấp quyền (Dành cho Admin)
1. Quản trị viên (Admin) vào màn hình Cấu hình Phân quyền.
2. Chọn Nhóm quyền `PHONGDAOTAO`.
3. Đánh dấu tích vào các ô `CanRead` và `CanUpdate` cho chức năng `RES_KHOA` (Quản lý Khoa).
4. Dữ liệu sẽ được Insert/Update vào bảng `RolePermissions` dưới dạng: 
   `[RoleId='PHONGDAOTAO', ResourceId='RES_KHOA', CanRead=1, CanUpdate=1, CanCreate=0, CanDelete=0]`.

### 3.2. Kịch bản kiểm tra quyền
- **Phía Frontend**: Khi user thuộc nhóm `PHONGDAOTAO` đăng nhập thành công, Frontend sẽ tải danh sách các cờ CRUD.
  - Nếu `CanRead` của `RES_KHOA` = 1 $\rightarrow$ Hiển thị menu "Quản lý Khoa" trên thanh điều hướng.
  - Nếu `CanUpdate` của `RES_KHOA` = 1 $\rightarrow$ Nút "Sửa" trong màn hình Quản lý Khoa sẽ được bật.
- **Phía Backend**: Bất cứ khi nào user gọi API liên quan tới việc thay đổi dữ liệu khoa (VD: `PUT /api/khoa/:id`), Backend sẽ kiểm tra trong CSDL xem Nhóm quyền hiện tại của user đó có thỏa mãn cờ `CanUpdate=1` đối với `RES_KHOA` hay không trước khi thực thi. Mọi request không thỏa mãn sẽ bị từ chối với lỗi 403 Forbidden.
