# Module xếp lịch tự động

Module hoạt động trên cấu trúc database hiện có và không yêu cầu migration.

## Cấu trúc

- `xeplich.routes.js`: API và phân quyền, dùng resource `ThoiKhoaBieu` hiện có.
- `xeplich.controller.js`: request/response HTTP và khởi chạy xử lý nền.
- `xeplich.service.js`: lấy lớp, tạo phương án, chỉnh sửa và gửi nháp.
- `xeplich.approval.js`: chờ duyệt theo lớp/bộ môn, xác nhận và chuyển nháp vào transaction khóa lịch.
- `scheduleConstraint.service.js`: kiểm tra phòng, sức chứa, học kỳ, giảng viên và lớp sinh viên.
- `xeplich.config.js`: định mức số buổi, tương thích loại phòng và ngày không xếp.
- `xeplich.store.js`: lưu phiên và lịch nháp vào file JSON.
- `data/sessions.json`: được tạo tự động khi chạy; không đưa vào Git.

Có thể đặt biến môi trường `XEP_LICH_STORAGE_DIR` để đổi thư mục lưu phiên. Khi bấm **Gửi bộ môn xác nhận**, module chỉ lưu JSON (`PendingConfirmation`). BOMON phân công và xác nhận từng lớp; xác nhận cũng chỉ cập nhật JSON (`Confirmed` khi đủ lớp). ADMIN/Phòng Đào tạo khóa lớp đã xác nhận mới ghi `ThoiKhoaBieu` và sinh `BuoiHoc` trong cùng transaction. `/ap-dung` cũ cũng chỉ gửi nháp. Lịch đã áp dụng trước đây giữ nguyên.

Danh sách nháp nằm ở màn Thời khóa biểu và Phân công giảng viên; quyền xác nhận giới hạn đúng bộ môn. Thay giảng viên sau xác nhận cần xác nhận lại. Nháp đã gửi không được sửa/hủy trực tiếp; chức năng thu hồi/từ chối chưa có. Xác nhận không giữ phòng, vì vậy phải kiểm tra xung đột lại khi khóa.

Kiểm thử: `node --test test/xeplich-approval.test.js` từ backend (mock DB, không ghi dữ liệu thật).

## Giới hạn cấu hình

Định mức mặc định là một buổi mỗi tuần. Lớp thực hành chỉ nhận phòng có loại chứa `ThucHanh`, `Lab`, `MayTinh` hoặc `PhongMay` sau khi chuẩn hóa chuỗi. Có thể sửa quy tắc tại `xeplich.config.js` mà không thay đổi database.


## Luồng hiện hành: phân công rồi khóa, không xác nhận riêng

Kết quả tự động là nháp JSON. Gửi bộ môn để phân công giảng viên, không cần nút Xác nhận. Bảng/TreeView quản lý của PĐT hiển thị nháp với nguồn MaPhienNhap và nhãn Chưa khóa. Khi có MaGiangVien, PĐT dùng nút Khóa lịch hiện có để kiểm tra lại, ghi ThoiKhoaBieu và sinh BuoiHoc trong cùng transaction.

weeklySchedule.js áp dụng LT 3 tín chỉ 2 buổi/tuần; TH/BT 3 tín chỉ và lớp 2 tín chỉ 1 buổi/tuần; mỗi buổi 3 tiết, không học Chủ nhật, cùng phòng/ca và lặp theo thứ suốt khoảng học. Hai buổi của cùng lớp cách nhau ít nhất 2 ngày, kể cả qua tuần sau. Lưu sửa mẫu tuần của nháp đi qua API PUT /phien/:maPhien/lop/:maLopHocPhan/nhap, không ghi lịch chính thức. Nháp cũ thiếu số buổi cần chỉnh lại hoặc tạo mới; không tự đổi dữ liệu đã có.

PendingAssignment là trạng thái gửi mới. PendingConfirmation/Confirmed cũ vẫn đọc được nhưng không còn yêu cầu xác nhận để khóa. API xác nhận riêng đã bỏ.
