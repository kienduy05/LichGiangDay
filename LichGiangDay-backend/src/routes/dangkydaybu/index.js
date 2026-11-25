const express = require('express');
const router = express.Router();
const DangKyDayBuController = require('../../controllers/dangkydaybu.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');

router.use(authentication);

// 1. Lấy danh sách ca đã nghỉ nhưng chưa bù
router.get('/ca-chua-bu', checkPermission('DangKyDayBu', 'CanRead'), DangKyDayBuController.getCaChuaBu);

// 2. Tra cứu phòng trống trong 7 ngày
router.get('/phong-trong', checkPermission('DangKyDayBu', 'CanRead'), DangKyDayBuController.getPhongTrong);

// 3. Đăng ký dạy bù (tự động xác nhận)
router.post('/', checkPermission('DangKyDayBu', 'CanCreate'), DangKyDayBuController.createDangKyDayBu);

// ========================================================================
// GIẢNG VIÊN ĐĂNG KÝ LỊCH THỰC HÀNH CHO LỚP TH ĐÃ KHÓA (5 buổi/lớp)
// ========================================================================
router.get('/thuc-hanh/lop-can-dang-ky', checkPermission('DangKyDayBu', 'CanRead'), DangKyDayBuController.getLopThucHanhCanDangKy);
router.get('/thuc-hanh/phong-trong', checkPermission('DangKyDayBu', 'CanRead'), DangKyDayBuController.getPhongTrongThucHanh);
router.post('/thuc-hanh', checkPermission('DangKyDayBu', 'CanCreate'), DangKyDayBuController.createDangKyThucHanh);

module.exports = router;
