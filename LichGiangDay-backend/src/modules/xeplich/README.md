# Module xếp lịch theo định mức (v3)

Thuật toán chạy trong backend, không dùng API AI ngoài. Quy tắc nghiệp vụ và review đầy đủ: [XepLichToiUu-Review.md](../../../../docs/XepLichToiUu-Review.md).

## Cấu trúc

- `workloadRules.js`: nhóm môn/học kỳ/nhóm/khóa, định mức, ngày, kiểm tra toàn phương án.
- `workloadData.service.js`: đọc dữ liệu một lần và lập chỉ mục xung đột tài nguyên.
- `workloadSolver.js`: beam search, phân bố ngày, xen kẽ, giới hạn tìm kiếm và nhường event loop.
- `xeplich.service.js`: vòng đời phiên, chọn đủ nhóm, sửa và áp dụng transaction.
- `xeplich.routes.js`, `xeplich.controller.js`: API, phân quyền và khởi chạy xử lý.
- `xeplich.config.js`: tương thích phòng và ngày/thứ cấm. Cấu hình số buổi mỗi tuần cũ không điều khiển solver v3.
- `xeplich.store.js`: kho phiên JSON; `XEP_LICH_STORAGE_DIR` đổi thư mục lưu.
- `scheduleConstraint.service.js`: kiểm tra vị trí độc lập khi không truyền phiên.
- `scheduleSearch.service.js`: bộ tìm kiếm cũ, không được luồng phiên v3 gọi.

## Quy tắc chính

Một buổi = 3 tiết. Nhóm 3 tín chỉ LT/BT có 10/10 buổi; LT/BT/TH có 10/5/5; nhóm 2 tín chỉ LT/BT có 5/5. Nhóm 3 tín chỉ khác chia tổng 20 buổi giữa các loại. Các buổi cách nhau ít nhất 2 ngày, xen kẽ loại, tối đa 3 buổi/tuần từ Thứ 2 đến Chủ nhật. Trải đều là mục tiêu ưu tiên, không bắt buộc mọi tuần có buổi.

Mỗi dòng lịch là một ngày cụ thể (`NgayBatDau = NgayKetThuc`). Không cần migration. Phiên quy tắc cũ phải tạo mới trước sửa/áp dụng. Lịch chính thức cũ không thay đổi.

Giới hạn mặc định trong `workloadSolver.js`: beam 48, 16 ngày/loại/trạng thái, 200.000 trạng thái, khoảng 30 giây tìm kiếm, tối đa 3 lượt thứ tự nhóm. Đây là heuristic, không bảo đảm tối ưu toàn cục hay chứng minh vô nghiệm khi hết ngân sách.

## Kiểm tra

Tại thư mục backend: `node --test test/*.test.js`. Tại frontend: `npm.cmd run build`. Kiểm thử dùng dữ liệu tổng hợp, không ghi lịch vào database thật. Xem checklist nghiệm thu và giới hạn đồng thời trong tài liệu review.

Quy tắc v3 giữ mẫu thứ cố định cho cả nhóm: các tuần cùng số buổi học cùng thứ; tuần ít buổi dùng các thứ đầu mẫu (tuần đầu có thể bị cắt bởi ngày bắt đầu lớp). Không tự đổi sang thứ khác khi xung đột. Ca và phòng chưa bắt buộc cố định. Chi tiết trong tài liệu review.
