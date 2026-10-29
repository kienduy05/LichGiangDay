# Xếp lịch theo định mức — mô tả và review

Cập nhật: 29/10/2026. Phiên bản quy tắc: **3**.

## 1. Nghiệp vụ đã thống nhất

Thuật toán chạy trong backend Node.js, không gọi API AI bên ngoài. API của ứng dụng dùng để tạo phiên, đọc tiến độ, sửa, hủy và áp dụng kết quả.

**Một buổi = 3 tiết liên tiếp**, ví dụ Tiết 1–3. “10 tiết học” trong yêu cầu được hiểu là 10 buổi, tương đương 30 tiết. “Học phần 2 tiết” được hiểu là học phần 2 tín chỉ.

| Tín chỉ | Loại học trong nhóm | Định mức tiết | Định mức buổi |
|---|---|---|---|
| 3 | LT + BT | LT 30, BT 30 | LT 10, BT 10 |
| 3 | LT + BT + TH | LT 30, BT 15, TH 15 | LT 10, BT 5, TH 5 |
| 2 | LT + BT | LT 15, BT 15 | LT 5, BT 5 |
| 3 | Tổ hợp khác | Tổng 60 | Tổng 20, chia đều cho các loại |

Với tổ hợp khác, nếu 20 không chia hết cho số loại học, chia số buổi nguyên chênh nhau tối đa một buổi; phần dư theo thứ tự mã loại học. Ví dụ ba loại khác: 7/7/6 buổi. Các tổ hợp tín chỉ khác chưa có định mức sẽ báo thiếu quy tắc, không tự suy diễn.

Nhóm được xác định bởi **môn học + học kỳ + nhóm (QT01…) + khóa**. Hiện database chưa có quan hệ nhóm riêng, nên lấy nhóm từ mã lớp trước hậu tố K64 hoặc dấu ngoặc cuối tên lớp. Thiếu hoặc mâu thuẫn mã/tên/khóa phải sửa dữ liệu. Hai lớp cùng loại trong một nhóm bị từ chối để tránh ghép nhầm. Chọn một thành phần sẽ tự chọn toàn bộ nhóm; backend cũng kiểm tra điều này.

## Bổ sung: giữ thứ học cố định giữa các tuần

Quy tắc v3 chọn một mẫu gồm 1–3 thứ cho cả nhóm, ví dụ [Thứ 2, Thứ 4] hoặc [Thứ 2, Thứ 4, Thứ 6]. Không tự chuyển sang thứ ngoài mẫu khi thiếu phòng. Khoảng cách của mẫu được kiểm tra cả qua Chủ nhật sang tuần sau.

Các tuần đủ số buổi dùng cùng các thứ. Tuần ít buổi dùng phần đầu mẫu: mẫu 2/4/6 thì tuần một buổi học Thứ 2, tuần hai buổi học Thứ 2/4. Tuần đầu bắt đầu giữa tuần chỉ dùng phần mẫu còn nằm trong khoảng học. Tuần nghỉ hoặc ít buổi vẫn có thể xuất hiện để giữ đúng định mức và trải lịch; không bảo đảm mọi tuần có số buổi bằng nhau. Mẫu thứ không cố định loại LT/BT/TH, ca hay phòng; những yếu tố này tiếp tục được chọn theo xen kẽ và tài nguyên.

Beam search mang mẫu thứ trong trạng thái và chỉ mở rộng ngày đúng thứ kế tiếp của tuần. Sửa/áp dụng kiểm tra lại cùng mẫu `ThuCoDinh` lưu trên từng dòng. Không tìm được lịch đủ buổi theo mẫu thì báo chưa xếp được, không nới quy tắc. Phiên v2 cần tạo lại; lịch đã áp dụng giữ nguyên.

Kiểm thử bổ sung xác nhận các tuần cùng số buổi giữ cùng các thứ, và 20 buổi trong 10 tuần học đúng Thứ 2/Thứ 4 mỗi tuần khi đó là hai ngày khả dụng.

## 2. Ràng buộc bắt buộc

**Chủ nhật là ngày nghỉ:** mẫu thứ chỉ gồm Thứ 2–Thứ 7. Backend từ chối buổi Chủ nhật khi sinh, kiểm tra, sửa và áp dụng lịch nháp; giao diện sửa cũng chặn lưu. Lịch chính thức đã tồn tại không tự bị xóa.

- Đủ đúng số buổi của từng LT/BT/TH; một nhóm chỉ thành công khi đủ tất cả thành phần.
- Mỗi buổi đúng 3 tiết. Nhận diện số tiết qua `SoTiet` nếu có hoặc khoảng trong `TenTiet`; nhãn mơ hồ không được đoán.
- Hai buổi liên tiếp của nhóm cách nhau ít nhất **2 ngày lịch**: Thứ 2 → sớm nhất Thứ 4. Áp dụng cả qua ranh giới tuần.
- Tối đa 3 buổi/nhóm/tuần, tuần tính Thứ 2 đến Chủ nhật.
- Xen kẽ loại học: hai buổi liên tiếp không cùng loại khi nhóm có nhiều loại. Nhóm một loại không áp dụng điều kiện này.
- Ngày nằm trong khoảng của chính lớp thành phần và học kỳ; đúng thứ trong tuần, tránh ngày/thứ bị cấm.
- Phòng ở trạng thái Ready, đủ sức chứa; TH cần phòng thực hành/lab theo cấu hình. LT/BT có thể dùng lab trống theo quy tắc phòng hiện có.
- Không trùng phòng, giảng viên đã phân công, lớp học phần hoặc lớp sinh viên liên kết. So sánh giờ thực tế, không chỉ mã ca.
- Kiểm tra cả lịch chính thức, buổi học thực tế và các nhóm đã chọn trong phương án; lịch học kỳ khác có ngày giao nhau cũng được xét.

Ưu tiên mềm là trải đều buổi học trong toàn khoảng thời gian, hạn chế dồn tuần, ưu tiên bắt đầu bằng LT và phòng gần sĩ số. Không bắt buộc buổi cuối rơi đúng ngày kết thúc lớp. Nếu 10 buổi trải trên 15 tuần thì có tuần không học; không thể yêu cầu mọi tuần đều có buổi mà vẫn giữ đúng 10 buổi. Hệ thống không ép tất cả tuần thành 2–3 buổi.

## 3. Thuật toán đang triển khai

1. Đọc một lần danh mục và dữ liệu chiếm dụng: lớp, phòng, ca, thời khóa biểu, buổi học, liên kết lớp sinh viên. Không truy vấn SQL trong vòng thử vị trí.
2. Lập chỉ mục chiếm dụng theo tài nguyên và thứ; lọc ngày, giờ, phòng hợp lệ cho từng thành phần.
3. Xử lý nhóm có khoảng ngày trên mỗi buổi nhỏ hơn trước. Với mỗi ngày giữ vị trí phòng/ca hợp lệ có điểm tốt nhất.
4. Dùng **beam search** xây lịch theo thứ tự ngày. Trạng thái gồm số buổi từng loại, ngày/loại cuối, số buổi tuần hiện tại và điểm. Loại nhánh vi phạm định mức, khoảng cách, tuần hoặc không còn khả năng xen kẽ.
5. Giữ tối đa 48 trạng thái ở mỗi bước, xét tối đa 16 ngày gần mốc phân bố lý tưởng cho mỗi loại. Điểm gồm độ lệch ngày lý tưởng, mức tập trung trong tuần, chênh sức chứa và ưu tiên LT đầu tiên.
6. Nếu có nhóm thất bại, thử đổi thứ tự nhóm tối đa 3 lượt. Chọn lượt hoàn thành nhiều lớp nhất, sau đó điểm thấp nhất. Chỉ đưa nhóm hoàn chỉnh vào kết quả.
7. Giới hạn toàn lần tìm kiếm: 200.000 trạng thái hoặc khoảng 30 giây. Nhường event loop định kỳ để xử lý yêu cầu hủy. Giới hạn này không bao gồm thời gian chờ truy vấn database và không phải deadline thời gian thực tuyệt đối.

Đây là thuật toán heuristic có giới hạn tìm kiếm, **không bảo đảm tối ưu toàn cục**. Việc chỉ giữ một phòng/ca trên mỗi ngày và giới hạn beam có thể bỏ qua phương án hợp lệ. `SEARCH_LIMIT` hay `NO_FEASIBLE_PLAN_FOUND` có nghĩa chưa tìm được trong giới hạn, không chứng minh bài toán vô nghiệm.

### So sánh hướng thuật toán

| Phương pháp | Ưu điểm | Đánh đổi |
|---|---|---|
| Greedy chọn vị trí đầu tiên | Nhanh, đơn giản | Dễ dồn lịch và làm các nhóm sau thiếu chỗ |
| Beam search + thử lại thứ tự (hiện tại) | Giữ nhiều khả năng, có ngân sách chạy, không thêm dịch vụ | Không chứng minh tối ưu; phụ thuộc mức cắt nhánh |
| CP-SAT (hướng mở rộng) | Mô hình hóa đủ buổi, tài nguyên, khoảng cách và hàm mục tiêu chung | Cần tích hợp solver/worker, mô hình và benchmark dữ liệu thật; vẫn cần giới hạn thời gian |

Tài liệu tham khảo cho hướng CP-SAT: [Constraint Programming](https://developers.google.com/optimization/cp), [Employee Scheduling](https://developers.google.com/optimization/scheduling/employee_scheduling). Bản hiện tại không dùng OR-Tools hay dịch vụ bên ngoài.

## 4. Lưu lịch và vòng đời phiên

Mỗi dòng nháp là **một ngày học cụ thể**: `NgayBatDau = NgayKetThuc = NgayHoc`. Khi áp dụng, mỗi buổi tạo một dòng `ThoiKhoaBieu`; luồng khóa lịch hiện có sinh đúng một `BuoiHoc` từ dòng đó. Không cần migration. Lịch chính thức cũ không bị viết lại.

Sửa tay phải kiểm tra lại toàn nhóm: đủ buổi, xen kẽ, khoảng cách, tuần và xung đột tài nguyên. Ngay trước áp dụng, đọc lại dữ liệu hiện tại và kiểm tra toàn phương án trong transaction. Một lỗi sẽ rollback toàn bộ thao tác áp dụng; không ghi một phần các nhóm thành công. Các nhóm đã báo chưa xếp được không được ghi vào lịch.

Phiên mới lưu `PhienBanQuyTac = 3`, định mức nhóm, tổng buổi và số vị trí/trạng thái đã thử. Phiên cũ vẫn xem được nhưng phải tạo phiên mới để sửa/áp dụng theo định mức mới. Nút mở xếp lịch đưa về chọn lớp; lịch sử phiên là luồng riêng. Đóng cửa sổ không hủy công việc, nút Hủy phiên mới dừng. Hủy được kiểm tra sau tải dữ liệu và trong quá trình tìm kiếm để kết quả muộn không phục hồi phiên đã hủy.

## 5. Review kỹ thuật và giới hạn còn lại

- Kiểm tra sau sinh, sửa và trước áp dụng dùng chung bộ quy tắc. Định mức là bảo đảm tại các bước này; các luồng sửa lịch chính thức sau đó chưa được chuyển sang quản lý định mức chung.
- Nhận diện nhóm qua mã/tên là giải pháp tương thích dữ liệu hiện có. Nên thêm khóa nhóm tường minh trong tương lai. Nếu database chỉ có một thành phần 3 tín chỉ, hệ thống coi đó là nhóm một loại 20 buổi; không thể biết một thành phần khác chưa được nhập.
- Dữ liệu chiếm dụng kết hợp lịch gốc và buổi thực tế theo hướng thận trọng. Một vị trí đã đổi/hủy buổi thực tế vẫn có thể bị lịch gốc giữ chỗ. Cần thống nhất nguồn chiếm dụng hiệu lực để tận dụng vị trí này.
- Giảng viên chưa phân công không có tài nguyên giảng viên để kiểm tra. Khi phân công sau này vẫn phải chạy kiểm tra trùng của luồng phân công.
- Transaction áp dụng khóa bản ghi học kỳ để tuần tự hóa các phiên trong cùng học kỳ. Chưa phải cơ chế khóa tài nguyên chung cho mọi luồng sửa lịch hoặc hai học kỳ giao nhau; thao tác ghi đồng thời từ các luồng khác cần được phối hợp thêm.
- Phiên JSON và tập trạng thái chạy nằm trong một tiến trình. Triển khai nhiều backend cần kho phiên/queue và khóa phân tán; chưa nằm trong thay đổi này.
- Chưa benchmark với dữ liệu sản xuất hoặc thử toàn bộ giao diện trên database thật. Không thể cam kết thời gian xử lý toàn trường dựa trên kiểm thử nhỏ.

## 6. Kiểm thử và cách nghiệm thu

Chạy backend: `node --test test/*.test.js`. Kiểm thử mới dùng dữ liệu tổng hợp và mock transaction, không ghi database thật. Bao phủ định mức LT/BT, LT/BT/TH, 2 tín chỉ, loại khác; phân bố, giới hạn tuần, khoảng cách, phòng TH; nhóm khác nhau; thiếu thời gian; trùng tài nguyên; ngân sách tìm kiếm; tự mở rộng nhóm; hủy khi đang tìm; sửa sai; áp dụng đủ 20 dòng; rollback nếu thiếu buổi; bảo vệ phiên đang thao tác khỏi xóa.

Chạy frontend: `npm.cmd run build`; lint các thành phần xếp lịch đã sửa bằng oxlint.

Nghiệm thu trên môi trường chạy: khởi động lại backend, tạo **phiên mới**, chọn một nhóm đã chuẩn hóa mã và đủ dữ liệu; đối chiếu 10 LT/10 BT hoặc 10 LT/5 BT/5 TH; kiểm tra ngày cách nhau ≥2, tuần ≤3; thử sửa vi phạm; áp dụng rồi khóa lịch và đối chiếu số `BuoiHoc`. Kiểm tra thêm lịch giao nhau giữa các nhóm và giảng viên trên dữ liệu thực trước triển khai diện rộng.
