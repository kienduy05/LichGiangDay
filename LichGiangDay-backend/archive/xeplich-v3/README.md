# Lưu trữ xếp lịch trước phiên bản 4

Các file ở đây chỉ để đọc, so sánh và tham khảo khi nâng cấp; không được import vào ứng dụng và không nằm trong lệnh kiểm thử hiện hành `node --test test/*.test.js`.

| File | Lý do giữ lại |
|---|---|
| scheduleSearch.service.js | Bộ tìm kiếm snapshot cũ; không còn caller trong mã chạy |
| xeplich-search.test.js | Kiểm thử của bộ tìm kiếm cũ, đi cùng mã đã lưu trữ |
| workloadSolver.js | Beam search theo tổng buổi, chưa giữ phòng cố định cả kỳ |
| workloadRules.js | Bản chụp quy tắc trước lần chuyển đổi; có chỉnh sửa dở về số tuần nhưng vẫn còn kiểm tra định mức v3 |
| xeplich-workload.test.js | Kiểm thử định mức tổng tiết và mẫu thứ của bản cũ |
| xeplich.config.js | Cấu hình cũ có bảng số buổi/tuần không còn được dùng |
| XepLichToiUu-Review-v3.md | Mô tả và giới hạn của phiên bản trước |

Các đường dẫn require trong bản lưu trữ giữ nguyên để đối chiếu nguồn gốc, không thể chạy trực tiếp tại thư mục này. Muốn tái sử dụng cần chuyển logic phù hợp vào module hiện hành và viết kiểm thử theo quy tắc mới; không khôi phục nguyên bộ vì sẽ mất bảo đảm lặp tuần/cùng phòng.

Mã đang dùng nằm ở `../../src/modules/xeplich/`: workloadRules.js, workloadSolver.js, workloadData.service.js và xeplich.service.js. `scheduleConstraint.service.js` vẫn được luồng thời khóa biểu và API kiểm tra vị trí sử dụng, nên không chuyển vào archive. Không chuyển hoặc xóa dữ liệu phiên, lịch chính thức hay file ngoài phạm vi xếp lịch.
