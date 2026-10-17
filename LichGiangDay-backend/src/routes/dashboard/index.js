const express = require('express');
const dashboardController = require('../../controllers/dashboard.controller');
const { authentication } = require('../../auth/authUtils');
const router = express.Router();

// Tầng 2: Áp dụng middleware xác thực JWT
router.use(authentication);

// Dashboard tổng quan cho phép mọi tài khoản quản trị đã đăng nhập (ADMIN, PHONGDAOTAO, BOMON, KHOA) truy cập
router.get('/master-data', dashboardController.getMasterData);
router.get('/hom-nay', require('../../controllers/yeucaunghi.controller').getDashboardHomNay);
router.get('/bomon', dashboardController.getBoMonDashboard);

module.exports = router;
