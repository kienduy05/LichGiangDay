const express = require('express');
const dashboardController = require('../../controllers/dashboard.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Tầng 2: Áp dụng middleware xác thực JWT
router.use(authentication);

// GET /v1/api/dashboard/master-data — Lấy toàn bộ thống kê (KPI, Pie, Bar, Warnings, Schedule, BienDong)
router.get('/master-data', checkPermission('Dashboard', 'CanRead'), dashboardController.getMasterData);

// GET /v1/api/dashboard/hom-nay — Thống kê buổi học hôm nay (dùng cho Lecturer Home & BM Home)
router.get('/hom-nay', dashboardController.getDashboardHomNay);

// POST /v1/api/dashboard/invalidate-cache — Xóa cache dashboard thủ công (Admin only)
router.post('/invalidate-cache', checkPermission('Dashboard', 'CanUpdate'), dashboardController.invalidateCache);

module.exports = router;
