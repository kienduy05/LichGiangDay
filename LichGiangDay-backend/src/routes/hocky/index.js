const express = require('express');
const hocKyController = require('../../controllers/hocky.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

router.use(authentication);

// GET /v1/api/hocky               — Danh sách (?search=...)
router.get('/', checkPermission('HocKy', 'CanRead'), hocKyController.getAll);

// GET /v1/api/hocky/:maHocKy      — Thông tin 1 học kỳ
router.get('/:maHocKy', checkPermission('HocKy', 'CanRead'), hocKyController.getById);

// POST /v1/api/hocky              — Tạo mới
// Body: { maHocKy, tenHocKy, dot?, namHoc?, ngayBatDau, ngayKetThuc }
router.post('/', checkPermission('HocKy', 'CanCreate'), hocKyController.create);

// PUT /v1/api/hocky/:maHocKy      — Cập nhật
// Body: { tenHocKy, dot?, namHoc?, ngayBatDau, ngayKetThuc }
router.put('/:maHocKy', checkPermission('HocKy', 'CanUpdate'), hocKyController.update);

// DELETE /v1/api/hocky/:maHocKy   — Xóa (kiểm tra LopHocPhan)
router.delete('/:maHocKy', checkPermission('HocKy', 'CanDelete'), hocKyController.deleteHocKy);

module.exports = router;
