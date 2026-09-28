const express = require('express');
const khoaSinhVienController = require('../../controllers/khoasinhvien.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

router.use(authentication);

// GET /v1/api/khoasinhvien               — Danh sách (?search=...)
router.get('/', checkPermission('KhoaSinhVien', 'CanRead'), khoaSinhVienController.getAll);

// GET /v1/api/khoasinhvien/:maKhoaSinhVien — Thông tin 1 khóa
router.get('/:maKhoaSinhVien', checkPermission('KhoaSinhVien', 'CanRead'), khoaSinhVienController.getById);

// POST /v1/api/khoasinhvien              — Tạo mới
// Body: { maKhoaSinhVien, tenKhoaSinhVien }
router.post('/', checkPermission('KhoaSinhVien', 'CanCreate'), khoaSinhVienController.create);

// PUT /v1/api/khoasinhvien/:maKhoaSinhVien — Cập nhật tên
// Body: { tenKhoaSinhVien }
router.put('/:maKhoaSinhVien', checkPermission('KhoaSinhVien', 'CanUpdate'), khoaSinhVienController.update);

// DELETE /v1/api/khoasinhvien/:maKhoaSinhVien — Xóa (kiểm tra LopHocPhan.KhoaHoc)
router.delete('/:maKhoaSinhVien', checkPermission('KhoaSinhVien', 'CanDelete'), khoaSinhVienController.deleteKhoaSinhVien);

module.exports = router;
