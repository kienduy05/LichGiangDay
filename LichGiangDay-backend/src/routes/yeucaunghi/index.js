const express = require('express');
const router = express.Router();
const YeuCauNghiController = require('../../controllers/yeucaunghi.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');

router.use(authentication);

// 1. Giảng viên lấy danh sách yêu cầu của chính mình
router.get('/cua-toi', checkPermission('YeuCauNghi', 'CanRead'), YeuCauNghiController.getCuaToi);

// 2. Trưởng bộ môn lấy danh sách yêu cầu của bộ môn mình
router.get('/bomon', checkPermission('DuyetYeuCau', 'CanRead'), YeuCauNghiController.getDanhSachBoMon);

// 3. Trưởng bộ môn phân công dạy thay cho ca đã duyệt nghỉ
router.post('/phan-cong-day-thay', checkPermission('PhanCongDayThay', 'CanCreate'), YeuCauNghiController.phanCongDayThay);

// 4. Trưởng bộ môn kiểm tra xung đột trước khi duyệt đơn
router.get('/:id/kiem-tra-xung-dot', checkPermission('DuyetYeuCau', 'CanRead'), YeuCauNghiController.checkConflict);

// 5. Trưởng bộ môn duyệt/từ chối đơn
router.put('/:id/duyet', checkPermission('DuyetYeuCau', 'CanUpdate'), YeuCauNghiController.duyetYeuCau);

// 6. Giảng viên hủy đơn đang chờ
router.put('/:id/huy', checkPermission('YeuCauNghi', 'CanUpdate'), YeuCauNghiController.huyYeuCau);

// 7. Giảng viên gửi yêu cầu mới (Báo nghỉ / Đổi ca / Nhờ dạy thay)
router.post('/', checkPermission('YeuCauNghi', 'CanCreate'), YeuCauNghiController.createYeuCau);

module.exports = router;
