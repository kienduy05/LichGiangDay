const express = require('express');
const giangVienController = require('../../controllers/giangvien.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Áp dụng middleware xác thực JWT cho tất cả API thuộc module GiangVien
router.use(authentication);

// --- Danh sách Giảng viên (hỗ trợ lọc: ?maBoMon=...&trangThai=...&search=...) ---
// GET /v1/api/giangvien
// GET /v1/api/giangvien?maBoMon=CNPM&trangThai=Active&search=Nguyen
// GET /v1/api/giangvien?maBoMon=__NULL__   (chỉ GV chưa phân bộ môn)
router.get('/', checkPermission('GiangVien', 'CanRead'), giangVienController.getAll);

// --- Chi tiết Giảng viên kèm lịch sử hoạt động ---
// GET /v1/api/giangvien/:maGiangVien/chitiet
router.get('/:maGiangVien/chitiet', checkPermission('GiangVien', 'CanRead'), giangVienController.getChiTiet);

// --- Thông tin cơ bản 1 Giảng viên ---
// GET /v1/api/giangvien/:maGiangVien
router.get('/:maGiangVien', checkPermission('GiangVien', 'CanRead'), giangVienController.getById);

// --- Tạo mới Giảng viên ---
// POST /v1/api/giangvien
// Body: { maGiangVien, hoTen, email?, soDienThoai?, maBoMon? }
router.post('/', checkPermission('GiangVien', 'CanCreate'), giangVienController.create);

// --- Cập nhật thông tin Giảng viên ---
// PUT /v1/api/giangvien/:maGiangVien
// Body: { hoTen, email?, soDienThoai?, maBoMon? }
router.put('/:maGiangVien', checkPermission('GiangVien', 'CanUpdate'), giangVienController.update);

// --- Toggle Trạng thái: Active ↔ Inactive ---
// PATCH /v1/api/giangvien/:maGiangVien/toggle-trangthai
router.patch('/:maGiangVien/toggle-trangthai', checkPermission('GiangVien', 'CanUpdate'), giangVienController.toggleTrangThai);

// --- Xóa Giảng viên (kiểm tra 7 bảng ràng buộc) ---
// DELETE /v1/api/giangvien/:maGiangVien
router.delete('/:maGiangVien', checkPermission('GiangVien', 'CanDelete'), giangVienController.deleteGiangVien);

module.exports = router;
