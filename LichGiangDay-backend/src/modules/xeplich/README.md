# Xếp lịch lặp theo tuần (v4)

Xem [nghiệp vụ và review](../../../../docs/XepLichToiUu-Review.md).

- `workloadRules.js`: tần suất 2 buổi/tuần cho LT 3 tín chỉ, 1 buổi cho TH/BT/loại khác và lớp 2 tín chỉ; xác định nhóm, mẫu ngày và kiểm tra lặp đủ tuần/cùng phòng.
- `workloadSolver.js`: tìm mẫu thứ/ca/phòng cho toàn thời gian lớp, backtracking chọn các mẫu không trùng. Có giới hạn và checkpoint hủy.
- `workloadData.service.js`: snapshot và chỉ mục tài nguyên; không SQL trong vòng tìm vị trí.
- `xeplich.service.js`: phiên, kiểm tra sửa, transaction áp dụng, hủy và lịch sử.
- `xeplich.config.js`: tương thích phòng và ngày/thứ cấm (Chủ nhật).
- `scheduleConstraint.service.js`: còn được thời khóa biểu và kiểm tra vị trí độc lập sử dụng.
- `xeplich.store.js`: kho JSON; biến XEP_LICH_STORAGE_DIR cấu hình thư mục.

Các file cũ xem [archive README](../../../archive/xeplich-v3/README.md). Không import file archive vào ứng dụng.

Kiểm thử: `node --test test/*.test.js` từ backend. Không cần migration; khởi động lại backend và tạo phiên mới. Phiên cũ không được sửa/áp dụng theo quy tắc 4. Lịch chính thức giữ nguyên.
