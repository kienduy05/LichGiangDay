# Hệ Thống Quản Lý Lịch Giảng Dạy

Dự án bao gồm 2 phần chính:
- **Backend**: Node.js (ExpressJS + MySQL2)
- **Frontend**: ReactJS (Vite)

---

## 📁 Cấu Trúc Thư Mục

```text
LichGiangDay/
├── LichGiangDay-backend/     # Source code Backend (Node.js / Express)
│   ├── config/               # Cấu hình kết nối CSDL
│   ├── resources/db/         # Script khởi tạo cơ sở dữ liệu MySQL
│   ├── .env.example          # File mẫu biến môi trường
│   ├── index.js              # File chạy chính của Backend
│   └── package.json
│
├── LichGiangDay-frontend/    # Source code Frontend (ReactJS / Vite)
│   ├── src/                  # Mã nguồn giao diện React
│   ├── index.html
│   └── package.json
│
└── README.md                 # Hướng dẫn chạy dự án
```

---

## ⚙️ Yêu Cầu Hệ Thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
- **Node.js** (Phiên bản 18.x trở lên)
- **npm** (đã đi kèm khi cài Node.js)
- **MySQL Database** (Local MySQL hoặc dịch vụ MySQL Cloud như Aiven)

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Clone Repository

```bash
git clone <LINK_REPOSITORY_CUA_BAN>
cd LichGiangDay
```

---

### 2. Cấu Hình Cơ Sở Dữ Liệu (MySQL Cloud - Aiven)

> [!NOTE]
> Cơ sở dữ liệu của dự án đã được cài đặt và lưu trữ tập trung trên **Aiven Cloud**. Các thành viên trong nhóm khi clone dự án về **KHÔNG CẦN tạo hay import Database mới**.

Chỉ cần cập nhật thông tin kết nối trong file `.env` ở bước dưới đây. (Trường hợp muốn tự tạo DB riêng ở local để test, bạn có thể sử dụng file SQL tại: `LichGiangDay-backend/resources/db/LichGiangDay_Mysql.sql`).

---

### 3. Cấu Hình & Chạy Backend

1. Di chuyển vào thư mục backend:
   ```bash
   cd LichGiangDay-backend
   ```

2. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```

3. Tạo file cấu hình môi trường `.env`:
   - Nhân bản file `.env.example` thành `.env`:
     - Trên Windows (PowerShell): `copy .env.example .env`
     - Trên Linux/macOS: `cp .env.example .env`
   - Cập nhật thông tin kết nối CSDL (Aiven Cloud) vào file `.env` (Liên hệ Leader để nhận thông tin tài khoản CSDL):
     ```env
     PORT=5000

     # Thông tin kết nối MySQL Aiven Cloud
     DB_HOST=lichgiangday-db-lichgiangday-gr03.i.aivencloud.com
     DB_PORT=25300
     DB_USER=avnadmin
     DB_PASSWORD=<nhap_password_duoc_cung_cap>
     DB_NAME=LichGiangDay
     ```

4. Khởi chạy Backend Server:
   ```bash
   npm start
   ```
   Backend sẽ chạy tại: `http://localhost:5000`

---

### 4. Cấu Hình & Chạy Frontend

1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd LichGiangDay-frontend
   ```

2. Cài đặt các thư viện:
   ```bash
   npm install
   ```

3. Khởi chạy Frontend (Vite Dev Server):
   ```bash
   npm run dev
   ```
   Frontend sẽ chạy tại: `http://localhost:5173` (hoặc cổng hiển thị trên Terminal).

---

## 🛠️ Công Nghệ Sử Dụng

- **Backend**: Node.js, Express.js, `mysql2/promise`, `dotenv`, `cors`.
- **Frontend**: React.js, Vite.
- **Database**: MySQL (tương thích cả MySQL Local & MySQL Aiven Cloud).
