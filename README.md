# HỆ THỐNG QUẢN LÝ LỊCH GIẢNG DẠY (LICHGIANGDAY)
## HƯỚNG DẪN CẤU TRÚC DỰ ÁN & QUY CHUẨN LẬP TRÌNH

Tài liệu này quy định chi tiết về **Cấu trúc thư mục**, **Luồng xử lý (Architecture Flow)**, **Quy chuẩn bảo vệ API 3 tầng (x-api-key + JWT + RBAC checkPermission)** và **Quy trình hướng dẫn thành viên trong team khi clone dự án về để khởi chạy & phát triển API mới**.

---

## 🛠️ Công Nghệ Sử Dụng

- **Backend**: Node.js (Express.js), `mysql2/promise`, `dotenv`, `cors`, `jsonwebtoken`.
- **Frontend**: React.js (Vite), React Router DOM, Context API (`AuthContext`), Vanilla CSS (Light Theme Design System).
- **Database**: MySQL (Aiven Cloud - tương thích tốt với MySQL 8.x Local & Cloud).

---

## 📁 1. Cấu Trúc Thư Mục Tổng Quan

```text
LichGiangDay/
├── LichGiangDay-backend/          # SOURCE CODE BACKEND (Node.js / Express)
│   ├── config/                    # Cấu hình hệ thống
│   │   └── db.js                  # Cấu hình MySQL Pool (kết nối Aiven Cloud)
│   ├── resources/db/              # Tài nguyên CSDL
│   │   ├── LichGiangDay_Mysql.sql # Script SQL khởi tạo 26 bảng
│   │   ├── CreateDB.js            # Script khởi tạo bảng tự động
│   │   └── seedData.js            # Script thêm dữ liệu mẫu (ADMIN, Roles, ApiKey)
│   ├── src/                       # MÃ NGUỒN CHÍNH CỦA BACKEND
│   │   ├── auth/                  # Middleware Bảo Mật & Phân Quyền
│   │   │   ├── checkAuth.js       # Middleware kiểm tra Header x-api-key
│   │   │   ├── authUtils.js       # JWT helper & Middleware authentication (x-client-id, Bearer token)
│   │   │   └── checkPermission.js # Middleware kiểm tra quyền thao tác RBAC (checkPermission)
│   │   ├── controllers/           # Tầng Controller (Xử lý HTTP Request/Response)
│   │   │   ├── access.controller.js
│   │   │   ├── role.controller.js
│   │   │   ├── user.controller.js
│   │   │   └── permission.controller.js
│   │   ├── services/              # Tầng Service (Xử lý Logic Nghiệp vụ & Truy vấn CSDL)
│   │   │   ├── access.service.js
│   │   │   ├── keyToken.service.js
│   │   │   ├── user.service.js
│   │   │   ├── role.service.js
│   │   │   └── permission.service.js
│   │   └── routes/                # Tầng Định Tuyến (Routing)
│   │       ├── access/index.js    # Routes nhóm Auth (/login, /logout, /me...)
│   │       ├── role/index.js      # Routes nhóm Quyền (/v1/api/roles)
│   │       ├── user/index.js      # Routes Người dùng (/v1/api/users)
│   │       ├── permission/index.js# Routes Phân quyền (/v1/api/permissions)
│   │       └── index.js           # Master Router hợp nhất tất cả các module
│   ├── .env.example               # Mẫu file cấu hình môi trường
│   ├── index.js                   # Entry point khởi chạy Server Express
│   └── package.json
│
├── LichGiangDay-frontend/         # SOURCE CODE FRONTEND (ReactJS / Vite)
│   ├── src/
│   │   ├── assets/                # Hình ảnh, icon tĩnh
│   │   ├── context/               # Quản lý State & Permission (AuthContext.jsx)
│   │   ├── pages/                 # Các trang giao diện (Home, AdminLogin, AdminDashboard)
│   │   ├── utils/                 # Hàm tiện ích & Gọi API (api.js)
│   │   ├── App.jsx                # Định tuyến Route React-Router-DOM
│   │   ├── index.css              # Design System & Styling toàn cục (Light Theme)
│   │   └── main.jsx
│   └── package.json
│
└── README.md                      # Hướng dẫn dự án & Quy chuẩn lập trình
```

---

## 🏛️ 2. Quy Chuẩn Kiến Trúc Backend (3-Tier Layered Architecture)

Backend được xây dựng theo mô hình 3 tầng phân rã trách nhiệm rõ ràng (Separation of Concerns):

```text
HTTP Request ──> Master Router (routes/index.js)
                        │ (Tầng 1: Kiểm tra Header x-api-key)
                        ▼
                Module Router (routes/<module>/index.js)
                        │ (Tầng 2: Kiểm tra JWT Token: authentication)
                        │ (Tầng 3: Kiểm tra Phân quyền RBAC: checkPermission)
                        ▼
                Controller Layer (controllers/<module>.controller.js)
                        │ (Validate request body/params & Gọi Service)
                        ▼
                Service Layer (services/<module>.service.js)
                        │ (Xử lý logic nghiệp vụ & Truy vấn MySQL)
                        ▼
                  MySQL Database (Aiven Cloud)
```

---

## 🛡️ 3. Quy Chuẩn Bảo Mật & Phân Quyền 3 Tầng Phía Backend

Tất cả các API trong hệ thống được bảo vệ bởi **3 tầng kiểm soát bảo mật**:

### Tầng 1: Kiểm Tra Khóa Ứng Dụng (`x-api-key`)
- **Header bắt buộc**: `x-api-key: lichgiangday_secret_apikey_2026`
- **Xử lý**: Middleware `apiKey` trong `src/auth/checkAuth.js` tự động đối chiếu `x-api-key` với bảng `ApiKeys` trong CSDL. Request không có hoặc sai Key sẽ bị từ chối `403 Forbidden`.

### Tầng 2: Xác Thực Người Dùng JWT (`authentication`)
- **Headers bắt buộc khi gọi API bảo vệ**:
  - `x-api-key`: `lichgiangday_secret_apikey_2026`
  - `x-client-id`: Mã `UserId` của người dùng (Ví dụ: `USR000000000001`).
  - `authorization`: Dạng `Bearer <accessToken>`.
- **Cơ chế**: Middleware `authentication` trong `src/auth/authUtils.js` giải mã chữ ký JWT, kiểm tra `KeyToken` hợp lệ, gán đối tượng `req.user` (`userId`, `username`, `role`) và gọi `next()`.

### Tầng 3: Kiểm Tra Quyền Thao Tác Chi Tiết RBAC (`checkPermission`)
- **Cú pháp khai báo**: `checkPermission(resourceId, action)`
  - `resourceId`: Mã tài nguyên phải **khớp 100%** với mã trong bảng `Resources` CSDL (Ví dụ: `'Roles'`, `'Users'`, `'RolePermissions'`, `'ToaNha'`, `'PhongHoc'`, `'Khoa'`, `'BoMon'`, `'GiangVien'`, `'MonHoc'`, `'LopHocPhan'`...).
  - `action`: Hành động kiểm tra tương ứng với HTTP Method:
    - `CanRead`: Dành cho route `GET` (Xem danh sách / xem chi tiết).
    - `CanCreate`: Dành cho route `POST` (Tạo mới).
    - `CanUpdate`: Dành cho route `PUT` / `PATCH` (Cập nhật / Đổi trạng thái / Reset mật khẩu).
    - `CanDelete`: Dành cho route `DELETE` (Xóa).
- **Cơ chế xử lý trong Middleware (`src/auth/checkPermission.js`)**:
  1. **Nhóm `ADMIN` (Super Admin)**: Tự động vượt qua 100% kiểm tra phân quyền (Bypass authorization).
  2. **Ngoại lệ tự tải quyền chính mình**: Người dùng thuộc bất kỳ nhóm quyền nào luôn được phép tải ma trận quyền của CHÍNH NHÓM MÌNH (`GET /v1/api/permissions/role/:roleId` khi `req.params.roleId === req.user.role`) để render giao diện Frontend.
  3. **Truy vấn CSDL**: Tìm dòng phân quyền theo `RoleId` (`req.user.role`) và `ResourceId` trong bảng `RolePermissions`.
  4. **Đối chiếu cờ quyền**:
     - Nếu cờ quyền tương ứng (`CanRead` / `CanCreate` / `CanUpdate` / `CanDelete`) `= 1`: Cho phép thực hiện API (`next()`).
     - Nếu cờ quyền `= 0` hoặc chưa được cấu hình dòng quyền: Từ chối với `403 Forbidden` kèm thông báo: *"Từ chối truy cập: Nhóm quyền 'X' không có quyền 'Y' trên tài nguyên 'Z'"*.

---

## 📋 4. Danh Sách Mã Tài Nguyên (`ResourceId`) Chuẩn Trong Hệ Thống

Khi bọc middleware `checkPermission('ResourceId', 'Action')`, bạn **PHẢI** sử dụng chính xác các giá trị `ResourceId` dưới đây:

| Nhóm Tính Năng | `ResourceId` tiêu chuẩn | Mô tả tài nguyên |
| :--- | :--- | :--- |
| **Quản trị hệ thống** | `Roles` | Quản lý Nhóm người dùng (Thêm/Sửa/Xóa role) |
| | `Users` | Quản lý Tài khoản người dùng |
| | `RolePermissions` | Phân quyền nhóm (Cấu hình ma trận Read/Create/Update/Delete) |
| **Danh mục Đào tạo** | `ToaNha` | Danh mục Tòa nhà |
| | `PhongHoc` | Danh mục Phòng học |
| | `Khoa` | Danh mục Khoa |
| | `BoMon` | Danh mục Bộ môn |
| | `GiangVien` | Danh mục Giảng viên |
| | `Nganh` | Danh mục Ngành đào tạo |
| | `MonHoc` | Danh mục Môn học |
| | `LopHocPhan` | Danh mục Lớp học phần |
| **Cấu hình & Lịch** | `NamHoc` | Cấu hình Năm học |
| | `HocKy` | Cấu hình Học kỳ |
| | `CaHoc` | Cấu hình Ca học / Tiết học |
| | `DotHoc` | Cấu hình Đợt học |
| | `LichGiangDay` | Quản lý & Xếp Lịch giảng dạy |

---

## 💻 5. Hướng Dẫn Chi Tiết Viết Một Module API Mới Mẫu (Ví Dụ: Quản Lý Tòa Nhà - `ToaNha`)

Giả sử bạn cần làm tính năng **Quản lý Tòa nhà (ToaNha)**, hãy tuân thủ đúng 4 bước dưới đây:

### Bước 1: Viết Service (`src/services/toanha.service.js`)
```javascript
const db = require('../../config/db');

class ToaNhaService {
  // Lấy danh sách tất cả tòa nhà
  static getAll = async () => {
    const [rows] = await db.query('SELECT * FROM ToaNha ORDER BY MaToaNha ASC');
    return rows;
  };

  // Tạo tòa nhà mới
  static create = async ({ maToaNha, tenToaNha, coSo, diaChi }) => {
    await db.query(
      'INSERT INTO ToaNha (MaToaNha, TenToaNha, CoSo, DiaChi) VALUES (?, ?, ?, ?)',
      [maToaNha, tenToaNha, coSo, diaChi]
    );
    return { maToaNha, tenToaNha, coSo, diaChi };
  };

  // Cập nhật tòa nhà
  static update = async (maToaNha, { tenToaNha, coSo, diaChi }) => {
    await db.query(
      'UPDATE ToaNha SET TenToaNha = ?, CoSo = ?, DiaChi = ? WHERE MaToaNha = ?',
      [tenToaNha, coSo, diaChi, maToaNha]
    );
    return { maToaNha, tenToaNha, coSo, diaChi };
  };

  // Xóa tòa nhà
  static delete = async (maToaNha) => {
    await db.query('DELETE FROM ToaNha WHERE MaToaNha = ?', [maToaNha]);
    return { success: true, maToaNha };
  };
}

module.exports = ToaNhaService;
```

### Bước 2: Viết Controller (`src/controllers/toanha.controller.js`)
```javascript
const ToaNhaService = require('../services/toanha.service');

class ToaNhaController {
  getAll = async (req, res, next) => {
    try {
      const list = await ToaNhaService.getAll();
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy danh sách tòa nhà thành công',
        metadata: list
      });
    } catch (error) {
      return res.status(500).json({ status: 'error', code: 500, message: error.message });
    }
  };

  create = async (req, res, next) => {
    try {
      const { maToaNha, tenToaNha, coSo, diaChi } = req.body;
      if (!maToaNha || !tenToaNha) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Mã tòa nhà và Tên tòa nhà không được để trống'
        });
      }

      const result = await ToaNhaService.create({ maToaNha, tenToaNha, coSo, diaChi });
      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Tạo tòa nhà mới thành công',
        metadata: result
      });
    } catch (error) {
      return res.status(400).json({ status: 'error', code: 400, message: error.message });
    }
  };

  update = async (req, res, next) => {
    try {
      const { maToaNha } = req.params;
      const { tenToaNha, coSo, diaChi } = req.body;
      const result = await ToaNhaService.update(maToaNha, { tenToaNha, coSo, diaChi });
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Cập nhật tòa nhà thành công',
        metadata: result
      });
    } catch (error) {
      return res.status(400).json({ status: 'error', code: 400, message: error.message });
    }
  };

  deleteToaNha = async (req, res, next) => {
    try {
      const { maToaNha } = req.params;
      const result = await ToaNhaService.delete(maToaNha);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Xóa tòa nhà thành công',
        metadata: result
      });
    } catch (error) {
      return res.status(400).json({ status: 'error', code: 400, message: error.message });
    }
  };
}

module.exports = new ToaNhaController();
```

### Bước 3: Định Nghĩa Router Module Với Middleware Phân Quyền (`src/routes/toanha/index.js`)
```javascript
const express = require('express');
const toanhaController = require('../../controllers/toanha.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Tầng 2: Áp dụng middleware xác thực JWT cho tất cả các API thuộc module Tòa Nhà
router.use(authentication);

// Tầng 3: Gán checkPermission(resourceId, action) cho từng Endpoint
router.get('/', checkPermission('ToaNha', 'CanRead'), toanhaController.getAll);
router.post('/', checkPermission('ToaNha', 'CanCreate'), toanhaController.create);
router.put('/:maToaNha', checkPermission('ToaNha', 'CanUpdate'), toanhaController.update);
router.delete('/:maToaNha', checkPermission('ToaNha', 'CanDelete'), toanhaController.deleteToaNha);

module.exports = router;
```

### Bước 4: Đăng Ký Module Vào Master Router (`src/routes/index.js`)
```javascript
const express = require('express');
const { apiKey } = require('../auth/checkAuth');
const router = express.Router();

// Tất cả API đều cần kiểm tra x-api-key (Tầng 1)
router.use(apiKey);

// Đăng ký các module API
router.use('/v1/api/auth', require('./access'));
router.use('/v1/api/roles', require('./role'));
router.use('/v1/api/users', require('./user'));
router.use('/v1/api/permissions', require('./permission'));
router.use('/v1/api/toanha', require('./toanha')); // <--- Đăng ký module mới tại đây!

module.exports = router;
```

---

## 🎨 6. Quy Chuẩn Gọi API & Sử Dụng Phân Quyền Ở Frontend (ReactJS)

### Gọi API
Dùng hàm `getAuthHeaders()` trong file `src/utils/api.js` (tự động gắn `x-api-key`, `x-client-id` và `Bearer token`).

### Ẩn/Hiện Menu & Nút Bấm Động Theo Phân Quyền
Dùng hook `useAuth()` để lấy hàm `hasPermission(resourceId, action)`:

```javascript
import { useAuth } from '../context/AuthContext';

function SidebarNav() {
  const { hasPermission } = useAuth();

  return (
    <nav>
      {/* Ẩn mục Tòa Nhà nếu không có quyền CanRead */}
      {hasPermission('ToaNha', 'CanRead') && (
        <a href="/admin/toanha">Quản lý Tòa Nhà</a>
      )}

      {/* Ẩn nút Thêm nếu không có quyền CanCreate */}
      {hasPermission('ToaNha', 'CanCreate') && (
        <button>+ Thêm Tòa Nhà Mới</button>
      )}
    </nav>
  );
}
```

---

## 🚀 7. Quy Trình Dành Cho Thành Viên Team Khi Clone Dự Án Về Lần Đầu

Khi thành viên mới trong team clone source code về máy local, thực hiện chính xác theo các bước sau:

### 1. Clone Repository & Chuyển Đến Nhánh Làm Việc
```bash
git clone https://github.com/kienduy05/LichGiangDay.git
cd LichGiangDay
git checkout kien
```

---

### 2. Cài Đặt Dependencies Cho Cả Backend & Frontend
```bash
# Cài đặt cho Backend
cd LichGiangDay-backend
npm install

# Cài đặt cho Frontend
cd ../LichGiangDay-frontend
npm install
```

---

### 3. Cấu Hình Môi Trường Backend (`.env`)

Tạo file `.env` trong thư mục `LichGiangDay-backend` (nhân bản từ `.env.example`):
```env
PORT=5000
NODE_ENV=development

# Thông tin kết nối MySQL (Mặc định dùng CSDL Aiven Cloud)
DB_HOST=lichgiangday-db-lichgiangday-gr03.i.aivencloud.com
DB_PORT=25300
DB_USER=avnadmin
DB_PASSWORD=<liên_hệ_leader_để_nhận_password>
DB_NAME=LichGiangDay
```

> [!NOTE]
> CSDL đã được đưa lên **Aiven Cloud**, toàn bộ dữ liệu mẫu đã có sẵn. Nếu bạn muốn chạy MySQL local độc lập, hãy tạo CSDL và chạy 2 script:
> ```bash
> node src/resources/db/CreateDB.js
> node src/resources/db/seedData.js
> ```

---

### 4. Khởi Chạy Dự Án Local

- **Khởi chạy Backend Server (Cổng 5000)**:
  ```bash
  cd LichGiangDay-backend
  npm start
  ```
- **Khởi chạy Frontend Dev Server (Cổng 5173)**:
  ```bash
  cd LichGiangDay-frontend
  npm run dev
  ```
  Truy cập giao diện tại: `http://localhost:5173/admin`  
  Tài khoản đăng nhập mặc định (Tài khoản Super Admin): `ADMIN` / `123456`

---

### 5. Quy Tắc Bắt Buộc Khi Thêm Feature/API Mới
- 🔴 **LUÔN LUÔN** bọc `router.use(authentication)` ở đầu router module.
- 🔴 **LUÔN LUÔN** bọc `checkPermission(ResourceId, Action)` cho từng route (`GET` -> `CanRead`, `POST` -> `CanCreate`, `PUT` -> `CanUpdate`, `DELETE` -> `CanDelete`).
- 🔴 **KHÔNG BAO GIỜ** bỏ qua middleware `checkPermission` ngoại trừ các route công khai như Login/Register.
- 🔴 Kiểm tra mã `ResourceId` xem đã có trong bảng `Resources` chưa. Nếu chưa có, hãy bổ sung vào CSDL trước khi gán permission.

---

### 6. Cách Kiểm Thử API Trên Postman / Thunder Client
Khi test bất kỳ API bảo vệ nào của Backend, bắt buộc phải truyền **3 Header**:
- `x-api-key`: `lichgiangday_secret_apikey_2026`
- `x-client-id`: `USR000000000001` (Mã UserId của tài khoản vừa đăng nhập)
- `authorization`: `Bearer <accessToken>`

---

## 📌 8. Tóm Tắt Định Dạng Trả Về Chuẩn (Standard API Response)

- **Thành công (200 OK / 201 Created)**:
  ```json
  {
    "status": "success",
    "code": 200,
    "message": "Thông điệp thành công",
    "metadata": { ... }
  }
  ```

- **Thất bại (400 Bad Request / 401 Unauthorized / 403 Forbidden / 500 Error)**:
  ```json
  {
    "status": "error",
    "code": 403,
    "message": "Từ chối truy cập: Nhóm quyền 'BOMON' không có quyền 'CanRead' trên tài nguyên 'Roles'."
  }
  ```
