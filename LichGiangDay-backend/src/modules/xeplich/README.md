# Module xếp lịch tự động

Module hoạt động trên cấu trúc database hiện có và không yêu cầu migration.

## Cấu trúc

- `xeplich.routes.js`: API và phân quyền, dùng resource `ThoiKhoaBieu` hiện có.
- `xeplich.controller.js`: request/response HTTP và khởi chạy xử lý nền.
- `xeplich.service.js`: lấy lớp, tạo phương án, chỉnh sửa và áp dụng lịch.
- `scheduleConstraint.service.js`: kiểm tra phòng, sức chứa, học kỳ, giảng viên và lớp sinh viên.
- `xeplich.config.js`: định mức số buổi, tương thích loại phòng và ngày không xếp.
- `xeplich.store.js`: lưu phiên và lịch nháp vào file JSON.
- `data/sessions.json`: được tạo tự động khi chạy; không đưa vào Git.

Có thể đặt biến môi trường `XEP_LICH_STORAGE_DIR` để đổi thư mục lưu phiên. Khi bấm **Áp dụng**, module mới ghi lịch chính thức vào bảng `ThoiKhoaBieu` hiện có. Việc tạo hoặc chỉnh sửa phương án nháp không ghi vào database.

## Giới hạn cấu hình

Định mức mặc định là một buổi mỗi tuần. Lớp thực hành chỉ nhận phòng có loại chứa `ThucHanh`, `Lab`, `MayTinh` hoặc `PhongMay` sau khi chuẩn hóa chuỗi. Có thể sửa quy tắc tại `xeplich.config.js` mà không thay đổi database.
