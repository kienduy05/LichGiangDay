const express = require('express');
const dashboardController = require('../../controllers/dashboard.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Tầng 2: Áp dụng middleware xác thực JWT
router.use(authentication);

// GET /v1/api/dashboard/master-data — Toàn bộ thống kê (Admin / Phòng đào tạo)
router.get('/master-data', dashboardController.getMasterData);

// GET /v1/api/dashboard/hom-nay — Thống kê buổi học hôm nay (Lecturer Home & BM Home)
router.get('/hom-nay', dashboardController.getDashboardHomNay);

// GET /v1/api/dashboard/bomon — Dashboard riêng cho Trưởng bộ môn
router.get('/bomon', dashboardController.getBoMonDashboard);

// POST /v1/api/dashboard/invalidate-cache — Xóa cache thủ công (Admin only)
router.post('/invalidate-cache', checkPermission('Dashboard', 'CanUpdate'), dashboardController.invalidateCache);

module.exports = router;