const express = require('express');
const multer = require('multer');
const lopHocPhanController = require('../../controllers/lophocphan.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Multer config: lưu file vào memory (buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls).'));
    }
  }
});

// Áp dụng middleware xác thực JWT
router.use(authentication);

// ================================================================
// 1. Danh sách Lớp học phần (bắt buộc ?maHocKy=...)
// GET /v1/api/lophocphan?maHocKy=HK1_2425&maBoMon=CNPM&search=...
// ================================================================
router.get('/', checkPermission('LopHocPhan', 'CanRead'), lopHocPhanController.getAll);

// ================================================================
// 9. Export ra Excel
// GET /v1/api/lophocphan/export?maHocKy=HK1_2425&maBoMon=CNPM
// ================================================================
router.get('/export', checkPermission('LopHocPhan', 'CanRead'), lopHocPhanController.exportExcel);

// ================================================================
// 6. Chi tiết LHP kèm danh sách lớp SV ghép
// GET /v1/api/lophocphan/:maLopHocPhan/chitiet
// ================================================================
router.get('/:maLopHocPhan/chitiet', checkPermission('LopHocPhan', 'CanRead'), lopHocPhanController.getChiTiet);

// ================================================================
// 4a. Lấy danh sách lớp SV đã ghép
// GET /v1/api/lophocphan/:maLopHocPhan/lopsinhvien
// ================================================================
router.get('/:maLopHocPhan/lopsinhvien', checkPermission('LopHocPhan', 'CanRead'), lopHocPhanController.getLopSinhVienGhep);

// ================================================================
// Gợi ý lớp SV để gắn
// GET /v1/api/lophocphan/:maLopHocPhan/lopsinhvien/suggested
// ================================================================
router.get('/:maLopHocPhan/lopsinhvien/suggested', checkPermission('LopHocPhan', 'CanRead'), lopHocPhanController.getSuggestedLopSinhVien);

// ================================================================
// Thông tin 1 LHP
// GET /v1/api/lophocphan/:maLopHocPhan
// ================================================================
router.get('/:maLopHocPhan', checkPermission('LopHocPhan', 'CanRead'), lopHocPhanController.getById);

// ================================================================
// 2. Tạo mới LHP thủ công
// POST /v1/api/lophocphan
// ================================================================
router.post('/', checkPermission('LopHocPhan', 'CanCreate'), lopHocPhanController.create);

// ================================================================
// 8. Import từ Excel
// POST /v1/api/lophocphan/import
// Body: multipart/form-data — file + maBoMon + maHocKy
// ================================================================
router.post('/import', checkPermission('LopHocPhan', 'CanCreate'), upload.single('file'), lopHocPhanController.importExcel);

// ================================================================
// 3. Cập nhật thông tin cơ bản
// PUT /v1/api/lophocphan/:maLopHocPhan
// ================================================================
router.put('/:maLopHocPhan', checkPermission('LopHocPhan', 'CanUpdate'), lopHocPhanController.update);

// ================================================================
// 5. Phân công / Đổi / Gỡ giảng viên
// PUT /v1/api/lophocphan/:maLopHocPhan/giangvien
// Body: { maGiangVien: 'GV001' } hoặc { maGiangVien: null } để gỡ
// ================================================================
router.put('/:maLopHocPhan/giangvien', checkPermission('LopHocPhan', 'CanUpdate'), lopHocPhanController.assignGiangVien);

// ================================================================
// 4b. Gắn lớp sinh viên
// POST /v1/api/lophocphan/:maLopHocPhan/lopsinhvien
// Body: { dsLopSinhVien: ['LSV001', 'LSV002'] }
// ================================================================
router.post('/:maLopHocPhan/lopsinhvien', checkPermission('LopHocPhan', 'CanUpdate'), lopHocPhanController.attachLopSinhVien);

// ================================================================
// 4c. Gỡ lớp sinh viên
// DELETE /v1/api/lophocphan/:maLopHocPhan/lopsinhvien
// Body: { dsLopSinhVien: ['LSV001'] }
// ================================================================
router.delete('/:maLopHocPhan/lopsinhvien', checkPermission('LopHocPhan', 'CanUpdate'), lopHocPhanController.detachLopSinhVien);

// ================================================================
// 7. Xóa LHP
// DELETE /v1/api/lophocphan/:maLopHocPhan
// ================================================================
router.delete('/:maLopHocPhan', checkPermission('LopHocPhan', 'CanDelete'), lopHocPhanController.deleteLopHocPhan);

module.exports = router;
