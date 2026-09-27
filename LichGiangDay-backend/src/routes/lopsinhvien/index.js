const express = require('express');
const lopSinhVienController = require('../../controllers/lopsinhvien.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

router.use(authentication);

// GET /v1/api/lopsinhvien                       — Danh sách (lọc ?maKhoa=...&search=...)
router.get('/', checkPermission('LopSinhVien', 'CanRead'), lopSinhVienController.getAll);

// GET /v1/api/lopsinhvien/:maLopSinhVien        — Thông tin 1 lớp
router.get('/:maLopSinhVien', checkPermission('LopSinhVien', 'CanRead'), lopSinhVienController.getById);

// POST /v1/api/lopsinhvien                      — Tạo mới
// Body: { maLopSinhVien, tenLopSinhVien, maKhoa }
router.post('/', checkPermission('LopSinhVien', 'CanCreate'), lopSinhVienController.create);

// PUT /v1/api/lopsinhvien/:maLopSinhVien        — Cập nhật
// Body: { tenLopSinhVien, maKhoa }
router.put('/:maLopSinhVien', checkPermission('LopSinhVien', 'CanUpdate'), lopSinhVienController.update);

// DELETE /v1/api/lopsinhvien/:maLopSinhVien     — Xóa (kiểm tra bảng trung gian)
router.delete('/:maLopSinhVien', checkPermission('LopSinhVien', 'CanDelete'), lopSinhVienController.deleteLopSinhVien);

module.exports = router;
