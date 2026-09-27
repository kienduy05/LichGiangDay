const express = require('express');
const boMonController = require('../../controllers/bomon.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Áp dụng middleware xác thực JWT cho tất cả các API thuộc module BoMon
router.use(authentication);

// --- Danh sách Bộ môn (hỗ trợ lọc theo ?maKhoa=...) ---
// GET /v1/api/bomon
// GET /v1/api/bomon?maKhoa=CNTT
router.get('/', checkPermission('BoMon', 'CanRead'), boMonController.getAll);

// --- Chi tiết Bộ môn kèm danh sách GiangVien và MonHoc trực thuộc ---
// GET /v1/api/bomon/:maBoMon/chitiet
router.get('/:maBoMon/chitiet', checkPermission('BoMon', 'CanRead'), boMonController.getChiTiet);

// --- Thông tin cơ bản 1 Bộ môn ---
// GET /v1/api/bomon/:maBoMon
router.get('/:maBoMon', checkPermission('BoMon', 'CanRead'), boMonController.getById);

// --- Tạo mới Bộ môn ---
// POST /v1/api/bomon
// Body: { maBoMon, tenBoMon, maKhoa }
router.post('/', checkPermission('BoMon', 'CanCreate'), boMonController.create);

// --- Cập nhật TenBoMon và/hoặc MaKhoa ---
// PUT /v1/api/bomon/:maBoMon
// Body: { tenBoMon, maKhoa? }
router.put('/:maBoMon', checkPermission('BoMon', 'CanUpdate'), boMonController.update);

// --- Xóa Bộ môn ---
// DELETE /v1/api/bomon/:maBoMon
router.delete('/:maBoMon', checkPermission('BoMon', 'CanDelete'), boMonController.deleteBoMon);

module.exports = router;
