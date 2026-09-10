# HƯỚNG DẪN CẤU TRÚC DỰ ÁN & QUY CHUẨN LẬP TRÌNH (LICHGIANGDAY)

Tài liệu này quy định chi tiết về **Cấu trúc thư mục**, **Luồng xử lý (Architecture Flow)** và **Quy chuẩn viết API bảo vệ bằng Middleware** dành cho tất cả các thành viên khi tham gia phát triển dự án `LichGiangDay`.

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
│   │   ├── auth/                  # Middleware Bảo Mật & Xác Thực
│   │   │   ├── checkAuth.js       # Middleware kiểm tra Header x-api-key
│   │   │   └── authUtils.js       # JWT helper & Middleware authentication (x-client-id, Bearer token)
│   │   ├── controllers/           # Tầng Controller (Xử lý HTTP Request/Response)
│   │   │   └── access.controller.js
│   │   ├── services/              # Tầng Service (Xử lý Logic Nghiệp vụ & Truy vấn CSDL)
│   │   │   ├── access.service.js
│   │   │   ├── keyToken.service.js
│   │   │   └── user.service.js
│   │   └── routes/                # Tầng Định Tuyến (Routing)
│   │       ├── access/index.js    # Routes cho nhóm Auth (/login, /logout, /me...)
│   │       └── index.js           # Master Router hợp nhất tất cả các module
│   ├── .env.example               # Mẫu file cấu hình môi trường
│   ├── index.js                   # Entry point khởi chạy Server Express
│   └── package.json
│
├── LichGiangDay-frontend/         # SOURCE CODE FRONTEND (ReactJS / Vite)
│   ├── src/
│   │   ├── assets/                # Hình ảnh, icon tĩnh
│   │   ├── context/               # Quản lý State toàn cục (AuthContext.jsx)
│   │   ├── pages/                 # Các trang giao diện (Home, AdminLogin, AdminDashboard)
│   │   ├── utils/                 # Hàm tiện ích & Gọi API (api.js)
│   │   ├── App.jsx                # Định tuyến Route React-Router-DOM
│   │   ├── index.css              # Design System & Styling toàn cục (Light Theme)
│   │   └── main.jsx
│   └── package.json
│
├── README.md                      # Hướng dẫn chạy dự án
└── CauTrucDuAn.md                 # Tài liệu này
```

---

## 🏛️ 2. Quy Chuẩn Kiến Trúc Backend (3-Tier Layered Architecture)

Backend được xây dựng theo mô hình 3 tầng phân rã trách nhiệm rõ ràng (Separation of Concerns):

```text
HTTP Request ──> Master Router (routes/index.js)
                        │ (Bắt buộc kiểm tra Header: x-api-key)
                        ▼
                Module Router (routes/<module>/index.js)
                        │ (Bắt buộc kiểm tra JWT: authentication)
                        ▼
                Controller Layer (controllers/<module>.controller.js)
                        │ (Validate request body/params & Gọi Service)
                        ▼
                Service Layer (services/<module>.service.js)
                        │ (Xử lý logic nghiệp vụ & Truy vấn MySQL)
                        ▼
                  MySQL Database (Aiven Cloud)
```

### Trách nhiệm từng tầng:
1. **Tầng Router (`src/routes/`)**: Khai báo các đường dẫn API (Endpoints), phương thức (`GET`, `POST`, `PUT`, `DELETE`) và gán các **Middleware bảo vệ**.
2. **Tầng Controller (`src/controllers/`)**: Tiếp nhận `req`, `res`, kiểm tra tính đầy đủ của dữ liệu gửi lên (`req.body`, `req.params`, `req.query`), gọi hàm tương ứng ở tầng Service và trả kết quả JSON chuẩn hóa về cho Client.
3. **Tầng Service (`src/services/`)**: Nơi tập trung 100% logic nghiệp vụ chuyên sâu, thực hiện các câu lệnh SQL (`db.query`) thao tác trực tiếp với cơ sở dữ liệu.

---

## 🛡️ 3. Quy Chuẩn Bảo Mật & Hệ Thống Headers

Tất cả các API trong hệ thống được bảo vệ bởi **2 tầng xác thực**:

### Tầng 1: Kiểm Tra Khóa Ứng Dụng (`x-api-key`)
- **Header bắt buộc**: `x-api-key: lichgiangday_secret_apikey_2026`
- **Xử lý**: Middleware `apiKey` trong `src/auth/checkAuth.js` tự động đối chiếu `x-api-key` với bảng `ApiKeys` trong CSDL. Tất cả request không có hoặc sai Key sẽ bị từ chối với mã lỗi `403 Forbidden`.

### Tầng 2: Xác Thực Người Dùng Với JWT & KeyTokens (`authentication`)
- **Headers bắt buộc khi gọi API bảo vệ**:
  - `x-api-key`: `lichgiangday_secret_apikey_2026`
  - `x-client-id`: Mã `UserId` của người dùng (Ví dụ: `USR000000000001`).
  - `authorization`: Dạng `Bearer <accessToken>`.
- **Cơ chế hoạt động**:
  1. Middleware `authentication` trong `src/auth/authUtils.js` sẽ lấy `x-client-id` để tìm `PublicKey` trong bảng `KeyTokens` (trên MySQL).
  2. Dùng `PublicKey` giải mã chữ ký JWT trong `authorization` header.
  3. Nếu thành công, gán thông tin `req.user` (`userId`, `username`, `role`) và gọi `next()`.

---

## 💻 4. Hướng Dẫn Chi Tiết Viết Một Module API Mới (Ví Dụ: Quản Lý Tòa Nhà - `ToaNha`)

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
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  create = async (req, res, next) => {
    try {
      const { maToaNha, tenToaNha, coSo, diaChi } = req.body;
      if (!maToaNha || !tenToaNha) {
        return res.status(400).json({
          status: 'error',
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
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };
}

module.exports = new ToaNhaController();
```

### Bước 3: Định Nghĩa Router Module (`src/routes/toanha/index.js`)
```javascript
const express = require('express');
const toanhaController = require('../../controllers/toanha.controller');
const { authentication } = require('../../auth/authUtils');
const router = express.Router();

// Áp dụng middleware xác thực JWT cho tất cả các API thuộc module Tòa Nhà
router.use(authentication);

router.get('/', toanhaController.getAll);
router.post('/', toanhaController.create);

module.exports = router;
```

### Bước 4: Đăng Ký Module Vào Master Router (`src/routes/index.js`)
```javascript
const express = require('express');
const { apiKey } = require('../auth/checkAuth');
const router = express.Router();

// Tất cả API đều cần kiểm tra x-api-key
router.use(apiKey);

// Đăng ký các module API
router.use('/v1/api/auth', require('./access'));
router.use('/v1/api/toanha', require('./toanha')); // <--- Đăng ký module mới tại đây!

module.exports = router;
```

---

## 🎨 5. Quy Chuẩn Gọi API Ở Frontend (ReactJS)

Ở phía Frontend (`LichGiangDay-frontend`), **tuyệt đối không** viết tay từng Header khi gọi `fetch` hay `axios`. Hãy dùng hàm tiện ích `getAuthHeaders()` trong file `src/utils/api.js`:

```javascript
import { getAuthHeaders } from '../utils/api';

// Ví dụ hàm gọi API lấy danh sách Tòa Nhà từ Frontend:
export const apiGetDanhSachToaNha = async () => {
  const response = await fetch('http://localhost:5000/v1/api/toanha', {
    method: 'GET',
    headers: getAuthHeaders() // Tự động chèn x-api-key, x-client-id và Bearer accessToken
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi lấy dữ liệu');
  }

  return data.metadata;
};
```

---

## 📌 6. Tóm Tắt Định Dạng Trả Về Chuẩn (Standard API Response)

Mọi API trong dự án cần trả về định dạng JSON đồng nhất:

- **Thành công (200 OK / 201 Created)**:
  ```json
  {
    "status": "success",
    "code": 200,
    "message": "Thông điệp thành công",
    "metadata": { ... } // Dữ liệu kết quả
  }
  ```

- **Thất bại (400 / 401 / 403 / 500)**:
  ```json
  {
    "status": "error",
    "code": 400,
    "message": "Chi tiết câu thông báo lỗi"
  }
  ```
