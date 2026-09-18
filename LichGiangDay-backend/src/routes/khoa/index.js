const express = require('express');
const khoaController = require('../../controllers/khoa.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Tầng 2: Áp dụng middleware xác thực JWT cho tất cả các API thuộc module Khoa
router.use(authentication);

// Tầng 3: Gán checkPermission(resourceId, action) cho từng Endpoint

// --- Danh sách & tìm kiếm ---
// GET /v1/api/khoa?search=...
router.get('/', checkPermission('Khoa', 'CanRead'), khoaController.getAll);

// --- Chi tiết Khoa (thông tin cơ bản) ---
// GET /v1/api/khoa/:maKhoa
router.get('/:maKhoa', checkPermission('Khoa', 'CanRead'), khoaController.getById);

// --- Chi tiết Khoa kèm danh sách Bộ môn trực thuộc ---
// GET /v1/api/khoa/:maKhoa/chitiet
router.get('/:maKhoa/chitiet', checkPermission('Khoa', 'CanRead'), khoaController.getChiTiet);

// --- Lấy danh sách Giảng viên Active thuộc Khoa (để chọn Trưởng khoa) ---
// GET /v1/api/khoa/:maKhoa/giangvien
router.get('/:maKhoa/giangvien', checkPermission('Khoa', 'CanRead'), khoaController.getGiangVien);

// --- Tạo mới Khoa ---
// POST /v1/api/khoa
router.post('/', checkPermission('Khoa', 'CanCreate'), khoaController.create);

// --- Cập nhật TenKhoa ---
// PUT /v1/api/khoa/:maKhoa
router.put('/:maKhoa', checkPermission('Khoa', 'CanUpdate'), khoaController.update);

// --- Gán / Bãi nhiệm Trưởng khoa ---
// PATCH /v1/api/khoa/:maKhoa/truongkhoa
// Body: { maGiangVien: "GV001" } hoặc { maGiangVien: null } để bãi nhiệm
router.patch('/:maKhoa/truongkhoa', checkPermission('Khoa', 'CanUpdate'), khoaController.assignTruongKhoa);

// --- Xóa Khoa ---
// DELETE /v1/api/khoa/:maKhoa
router.delete('/:maKhoa', checkPermission('Khoa', 'CanDelete'), khoaController.deleteKhoa);

module.exports = router;
