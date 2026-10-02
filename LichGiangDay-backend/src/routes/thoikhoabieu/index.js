const express = require('express');
const thoiKhoaBieuController = require('../../controllers/thoikhoabieu.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

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

module.exports = router;

