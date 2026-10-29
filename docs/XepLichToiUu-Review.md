# Xếp lịch lặp theo tuần — mô tả và review v4

Cập nhật 29/10/2026. Thuật toán chạy trong backend, không gọi API AI ngoài.

## Quy tắc hiện hành

| Tín chỉ | Loại lớp | Buổi/tuần/lớp |
|---|---|---|
| 3 | LT | 2 |
| 3 | TH | 1 |
| 3 | BT hoặc loại khác | 1 |
| 2 | Mỗi loại lớp | 1 |

Mỗi buổi gồm 3 tiết. Quy tắc tần suất thay thế tổng tiết cố định cũ: ví dụ LT 3 tín chỉ trong 10 tuần đầy đủ có 20 buổi = 60 tiết. Không áp dụng lại 30 tiết LT của v2/v3. Tín chỉ khác 2/3 báo chưa có quy tắc.

Lịch lặp từ NgayBatDau đến NgayKetThuc của từng lớp, giữ nguyên thứ, ca và cùng một phòng cho cả lớp. Tuần đầu/cuối chỉ lấy ngày nằm trong khoảng; không nhân máy móc với SoTuan vì trường này có thể không khớp ngày thực tế. Trước khi chọn mẫu, tổng buổi là khoảng dự kiến; khi có kết quả, tổng được tính chính xác từ các ngày học.

Chủ nhật nghỉ. Hai buổi LT trong một tuần cách nhau ít nhất 2 ngày, kể cả khoảng cách tuần trước sang tuần sau. Không áp dụng khoảng cách này giữa các loại LT/BT/TH khác nhau. Giới hạn cũ 3 buổi/tuần/nhóm và xen kẽ loại học bắt buộc đã bỏ: nhóm LT+BT+TH có thể có 4 buổi/tuần. Ưu tiên các thành phần học khác ngày nếu có thể, nhưng bắt buộc không trùng giờ cùng nhóm.

Nhóm vẫn theo môn + học kỳ + nhóm (QT01…) + khóa; chọn đủ nhóm để kiểm tra chung. Các thành phần có thể dùng phòng khác nhau (TH cần lab), nhưng mỗi lớp thành phần giữ phòng riêng cố định cả kỳ. Mã lớp và tên lớp cùng hiển thị ở cột Lớp học phần trong chi tiết kết quả.

## Thuật toán

1. Đọc snapshot lớp, phòng, ca, lịch chính thức, buổi học thực tế và liên kết lớp sinh viên.
2. Với mỗi lớp, liệt kê mẫu 1 hoặc 2 thứ trong Thứ 2–Thứ 7; tạo tất cả ngày lặp nằm trong thời gian lớp.
3. Thử một phòng và ca cho toàn bộ mẫu. Kiểm tra mọi lần lặp; một lần bị trùng hoặc ngày cấm sẽ loại mẫu, không bỏ tuần hoặc đổi phòng để lách điều kiện.
4. Giữ tối đa 256 mẫu hợp lệ/lớp, ưu tiên phòng gần sĩ số. Xếp lớp ít mẫu trước và dùng backtracking chọn tổ hợp không trùng giữa các thành phần. Chỉ công nhận cả nhóm hoàn chỉnh.
5. Xếp nhóm nhiều buổi trước; thử tối đa 3 thứ tự nhóm khi có nhóm thất bại. Giới hạn 200.000 trạng thái hoặc khoảng 30 giây tìm kiếm, nhường event loop và kiểm tra hủy định kỳ. Thời gian chờ SQL không nằm trong ngân sách này.

Bản hiện tại dùng cùng ca cho mọi thứ của một lớp khi sinh tự động. Validator cho phép mỗi thứ có ca riêng, miễn ca đó lặp nguyên vẹn giữa các tuần. Giữ tối đa 256 mẫu và số lượt giới hạn là heuristic: chưa tìm được mẫu không đồng nghĩa chứng minh vô nghiệm, không bảo đảm tối ưu toàn cục. Hướng nâng cấp là tìm nhiều ca theo từng thứ, local search hoặc solver ràng buộc.

## Kiểm tra, sửa và áp dụng

Kiểm tra đủ mọi ngày của mẫu, phòng cố định, ca theo thứ cố định, đúng ngày/thứ, ca 3 tiết, thời gian lớp/học kỳ, ngày nghỉ, sức chứa và loại phòng. Kiểm tra trùng phòng, giảng viên đã phân công, lớp sinh viên và nhóm thành phần ngay cả khi thiếu liên kết lớp sinh viên.

Sửa một buổi không được phá mẫu lặp: đổi riêng phòng, ca hay bỏ một tuần bị từ chối. Giao diện hiện vẫn sửa từng dòng; đổi toàn bộ mẫu tuần là hướng nâng cấp, hiện có thể tạo lại phương án. Trước áp dụng đọc lại dữ liệu và kiểm tra toàn phương án trong transaction; lỗi thì rollback. Mỗi buổi lưu một dòng ThoiKhoaBieu có ngày bắt đầu bằng ngày kết thúc; khóa lịch sinh BuoiHoc theo luồng hiện có.

Phiên mới có PhienBanQuyTac=4. Phiên cũ xem được, không sửa/áp dụng theo quy tắc mới. Lịch chính thức cũ không tự thay đổi, không cần migration. Cần khởi động lại backend và tạo phiên mới để dùng thuật toán mới.

## Giới hạn và kiểm thử

Chưa benchmark dữ liệu sản xuất. Kiểm thử dùng dữ liệu tổng hợp, mock transaction: lặp đủ 8 tuần, LT 2 buổi/tuần, TH/BT và 2 tín chỉ 1 buổi/tuần; nhóm 4 buổi; cùng thứ/ca/phòng; tuần đầu/cuối không đầy đủ; SoTuan sai; không đổi phòng khi chỉ trống nửa kỳ; trùng tài nguyên; sửa phá mẫu; hủy; giới hạn; áp dụng đủ dòng và rollback thiếu buổi.

Chạy `node --test test/*.test.js` từ backend và `npm.cmd run build` từ frontend. Các kiểm thử cũ chuyển vào archive không nằm trong suite hiện hành.

Giữ các giới hạn nền: nhận diện nhóm qua mã/tên; lịch gốc và buổi thực tế được xét thận trọng có thể giữ vị trí đã đổi; giảng viên chưa phân công chưa kiểm tra được lịch cá nhân; khóa transaction theo học kỳ chưa thay khóa tài nguyên chung cho mọi luồng ghi; kho phiên JSON chỉ phù hợp một tiến trình. Ngày nghỉ cấu hình làm mẫu không đủ tuần sẽ bị từ chối, chưa tự tạo ngoại lệ dạy bù.

## File lưu trữ

Xem [README lưu trữ](../LichGiangDay-backend/archive/xeplich-v3/README.md). Chỉ gom các file thuộc xếp lịch đã xác nhận không còn caller hoặc bản chụp thuật toán được thay thế. Bộ kiểm tra xung đột dùng chung vẫn ở module đang chạy.
