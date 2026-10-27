const express = require('express');
const { apiKey } = require('../auth/checkAuth');
const router = express.Router();

// Apply x-api-key check for all API routes
router.use(apiKey);

// Auth routes
router.use('/v1/api/auth', require('./access'));

// Roles management routes
router.use('/v1/api/roles', require('./role'));

// Users management routes
router.use('/v1/api/users', require('./user'));

// Permissions management routes
router.use('/v1/api/permissions', require('./permission'));

// Building management routes
router.use('/v1/api/toanha', require('./toanha'));

// Room management routes
router.use('/v1/api/phonghoc', require('./phonghoc'));

// Faculty (Khoa) management routes
router.use('/v1/api/khoa', require('./khoa'));

// Department (BoMon) management routes
router.use('/v1/api/bomon', require('./bomon'));

// Lecturer (GiangVien) management routes
router.use('/v1/api/giangvien', require('./giangvien'));

// Subject (MonHoc) management routes
router.use('/v1/api/monhoc', require('./monhoc'));

// Student Class (LopSinhVien) management routes
router.use('/v1/api/lopsinhvien', require('./lopsinhvien'));

// Student Cohort (KhoaSinhVien) management routes
router.use('/v1/api/khoasinhvien', require('./khoasinhvien'));

// Semester (HocKy) management routes
router.use('/v1/api/hocky', require('./hocky'));

// Class Period (TietHoc) management routes
router.use('/v1/api/tiethoc', require('./tiethoc'));

// Course Section (LopHocPhan) management routes
router.use('/v1/api/lophocphan', require('./lophocphan'));

// Schedule (ThoiKhoaBieu) management routes
router.use('/v1/api/thoikhoabieu', require('./thoikhoabieu'));

// Automatic schedule generation and draft sessions
router.use('/v1/api/xeplich', require('../modules/xeplich/xeplich.routes'));

// Dashboard statistics routes
router.use('/v1/api/dashboard', require('./dashboard'));

// Notifications routes
router.use('/v1/api/thongbao', require('./thongbao'));

// Lecturer Schedule route
router.get('/v1/api/lich-giang-vien', require('../auth/authUtils').authentication, require('../controllers/yeucaunghi.controller').getLichGiangVien);

// Leave/Swap/Substitute Requests routes
router.use('/v1/api/yeucaunghi', require('./yeucaunghi'));

// Makeup Class Registration routes
router.use('/v1/api/dangkydaybu', require('./dangkydaybu'));

// Schedule Variation Monitoring routes
router.use('/v1/api/biendong-lich', require('./biendonglich'));

module.exports = router;
