const express = require('express');
const multer = require('multer');
const thoiKhoaBieuController = require('../../controllers/thoikhoabieu.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Multer memory storage để đọc buffer Excel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

// Áp dụng middleware xác thực JWT
router.use(authentication);

// 1. Sơ đồ cây phân cấp LHP (Khoa -> Bộ môn -> LHP) kèm trạng thái xếp lịch
// GET /v1/api/thoikhoabieu/treeview-data?maHocKy=...&search=...&filterStatus=...
router.get('/treeview-data', checkPermission('ThoiKhoaBieu', 'CanRead'), thoiKhoaBieuController.getTreeViewData);

// 2. Lưới Ma trận thời khóa biểu (Thứ x Tiết x Phòng)
// GET /v1/api/thoikhoabieu/matrix-grid?maHocKy=...&maToaNha=...&maPhong=...
router.get('/matrix-grid', checkPermission('ThoiKhoaBieu', 'CanRead'), thoiKhoaBieuController.getMatrixGrid);

// 3. Lưới trạng thái phòng học (Room Selection Grid: sáng phòng trống, mờ phòng bận/bảo trì)
// GET /v1/api/thoikhoabieu/room-status-grid?thuTrongTuan=2&maTiet=1&ngayBatDau=...&ngayKetThuc=...
router.get('/room-status-grid', checkPermission('ThoiKhoaBieu', 'CanRead'), thoiKhoaBieuController.getRoomStatusGrid);

// 4. Kiểm tra xung đột trước khi lưu (Conflict Check)
// POST /v1/api/thoikhoabieu/check-conflict
router.post('/check-conflict', checkPermission('ThoiKhoaBieu', 'CanUpdate'), thoiKhoaBieuController.checkConflict);

// 5. Lấy danh sách TKB của 1 LHP cụ thể
// GET /v1/api/thoikhoabieu/lophocphan/:maLopHocPhan
router.get('/lophocphan/:maLopHocPhan', checkPermission('ThoiKhoaBieu', 'CanRead'), thoiKhoaBieuController.getByLopHocPhan);

// 6. Xóa toàn bộ lịch TKB của 1 LHP
// DELETE /v1/api/thoikhoabieu/lophocphan/:maLopHocPhan
router.delete('/lophocphan/:maLopHocPhan', checkPermission('ThoiKhoaBieu', 'CanDelete'), thoiKhoaBieuController.deleteByLopHocPhan);

// 7. Xóa 1 bản ghi TKB cụ thể
// DELETE /v1/api/thoikhoabieu/:maThoiKhoaBieu
router.delete('/:maThoiKhoaBieu', checkPermission('ThoiKhoaBieu', 'CanDelete'), thoiKhoaBieuController.deleteScheduleItem);

// 8. Lưu toàn bộ Thời khóa biểu cho LHP (1 hoặc nhiều buổi/tuần)
// POST /v1/api/thoikhoabieu
router.post('/', checkPermission('ThoiKhoaBieu', 'CanUpdate'), thoiKhoaBieuController.saveSchedules);

// 9. Danh sách TKB dạng bảng (Table View)
// GET /v1/api/thoikhoabieu?maHocKy=...&maKhoa=...&maBoMon=...
router.get('/', checkPermission('ThoiKhoaBieu', 'CanRead'), thoiKhoaBieuController.getAll);

// ================================================================
// BOMON ĐỘC QUYỀN: CÁC ROUTE PHÂN CÔNG GIẢNG VIÊN
// ================================================================

// 10. Lấy danh sách Lớp học phần cần phân công của Bộ môn
// GET /v1/api/thoikhoabieu/bomon/assignable-classes?maHocKy=...&search=...&filterStatus=...
router.get('/bomon/assignable-classes', thoiKhoaBieuController.getBomonAssignableClasses);

// 11. Quét kiểm tra tình trạng khả dụng của GV cho 1 lớp
// GET /v1/api/thoikhoabieu/bomon/lecturer-availability?maLopHocPhan=...
router.get('/bomon/lecturer-availability', thoiKhoaBieuController.getLecturerAvailability);

// 12. Xem trước Thời khóa biểu tuần của Giảng viên
// GET /v1/api/thoikhoabieu/bomon/lecturer-weekly-schedule?maGiangVien=...&maHocKy=...
router.get('/bomon/lecturer-weekly-schedule', thoiKhoaBieuController.getLecturerWeeklySchedule);

// 13. Thống kê Tải Giảng Dạy toàn bộ Giảng viên trong Bộ môn
// GET /v1/api/thoikhoabieu/bomon/workload-summary?maHocKy=...
router.get('/bomon/workload-summary', thoiKhoaBieuController.getBomonWorkloadSummary);

// 14. Thực hiện Phân công Giảng viên vào Lớp HP
// POST /v1/api/thoikhoabieu/bomon/assign-lecturer
router.post('/bomon/assign-lecturer', thoiKhoaBieuController.assignLecturerToClass);

// 15. Hủy phân công Giảng viên khỏi Lớp HP
// POST /v1/api/thoikhoabieu/bomon/unassign-lecturer
router.post('/bomon/unassign-lecturer', thoiKhoaBieuController.unassignLecturerFromClass);

// 15b. Phân công Giảng viên tự động - Xem trước (Preview)
// POST /v1/api/thoikhoabieu/bomon/auto-assign/preview
router.post('/bomon/auto-assign/preview', thoiKhoaBieuController.autoAssignPreview);

// 15c. Áp dụng kết quả Phân công Giảng viên tự động (Apply)
// POST /v1/api/thoikhoabieu/bomon/auto-assign/apply
router.post('/bomon/auto-assign/apply', thoiKhoaBieuController.applyAutoAssign);

// ================================================================
// ADMIN & PHONGDAOTAO: CÁC ROUTE KHÓA / MỞ KHÓA THỜI KHÓA BIỂU
// ================================================================

// 16. Khóa lịch lớp học phần (Chốt lịch sau khi Bộ môn phân công)
// POST /v1/api/thoikhoabieu/lock-class
router.post('/lock-class', checkPermission('ThoiKhoaBieu', 'CanUpdate'), thoiKhoaBieuController.lockSchedule);

// 17. Mở khóa lịch lớp học phần
// POST /v1/api/thoikhoabieu/unlock-class
router.post('/unlock-class', checkPermission('ThoiKhoaBieu', 'CanUpdate'), thoiKhoaBieuController.unlockSchedule);

// 18. Khóa đồng loạt tất cả các lớp đã phân công trong học kỳ
// POST /v1/api/thoikhoabieu/lock-all
router.post('/lock-all', checkPermission('ThoiKhoaBieu', 'CanUpdate'), thoiKhoaBieuController.lockAllSemesterSchedules);

// ================================================================
// IMPORT THỜI KHÓA BIỂU TOÀN DIỆN (LỚP HỌC PHẦN + LỊCH HỌC)
// ================================================================

// 19. Xem trước Import Thời khóa biểu từ Excel
// POST /v1/api/thoikhoabieu/preview-import
router.post('/preview-import', checkPermission('ThoiKhoaBieu', 'CanCreate'), upload.single('file'), thoiKhoaBieuController.previewImport);

// 20. Lưu kết quả Thời khóa biểu vào CSDL
// POST /v1/api/thoikhoabieu/save-imported
router.post('/save-imported', checkPermission('ThoiKhoaBieu', 'CanCreate'), thoiKhoaBieuController.saveImported);

module.exports = router;


