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

module.exports = router;
