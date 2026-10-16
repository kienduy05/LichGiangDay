const express = require('express');
const router = express.Router();
const BienDongLichController = require('../../controllers/biendonglich.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');

router.use(authentication);

// 1. Toàn trường (Chỉ ADMIN, PHONGDAOTAO)
router.get('/all', checkPermission('BienDongLich', 'CanRead'), BienDongLichController.getAll);

// 2. Bộ môn (Dành cho BOMON, khóa cứng theo bộ môn)
router.get('/bomon', checkPermission('BienDongLich', 'CanRead'), BienDongLichController.getBoMon);

// 3. Thu hồi / can thiệp (Chỉ ADMIN, PHONGDAOTAO)
router.post('/:id/revoke', checkPermission('BienDongLich', 'CanUpdate'), BienDongLichController.revoke);

module.exports = router;
