const express = require('express');
const monHocController = require('../../controllers/monhoc.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Áp dụng middleware xác thực JWT cho tất cả API thuộc module MonHoc
router.use(authentication);

// --- Danh sách Môn học (hỗ trợ lọc: ?maBoMon=...&search=...) ---
// GET /v1/api/monhoc
// GET /v1/api/monhoc?maBoMon=CNPM
// GET /v1/api/monhoc?search=Giải+tích
router.get('/', checkPermission('MonHoc', 'CanRead'), monHocController.getAll);

// --- Chi tiết Môn học kèm danh sách LopHocPhan ---
// GET /v1/api/monhoc/:maMonHoc/chitiet
router.get('/:maMonHoc/chitiet', checkPermission('MonHoc', 'CanRead'), monHocController.getChiTiet);

// --- Thông tin cơ bản 1 Môn học ---
// GET /v1/api/monhoc/:maMonHoc
router.get('/:maMonHoc', checkPermission('MonHoc', 'CanRead'), monHocController.getById);

// --- Tạo mới Môn học ---
// POST /v1/api/monhoc
// Body: { maMonHoc, tenMonHoc, soTinChi, maBoMon (bắt buộc), loaiMonHoc? }
router.post('/', checkPermission('MonHoc', 'CanCreate'), monHocController.create);

// --- Cập nhật Môn học ---
// PUT /v1/api/monhoc/:maMonHoc
// Body: { tenMonHoc, soTinChi?, maBoMon (bắt buộc), loaiMonHoc? }
router.put('/:maMonHoc', checkPermission('MonHoc', 'CanUpdate'), monHocController.update);

// --- Xóa Môn học (kiểm tra LopHocPhan) ---
// DELETE /v1/api/monhoc/:maMonHoc
router.delete('/:maMonHoc', checkPermission('MonHoc', 'CanDelete'), monHocController.deleteMonHoc);

module.exports = router;
