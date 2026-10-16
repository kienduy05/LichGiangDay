const express = require('express');
const dashboardController = require('../../controllers/dashboard.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Tầng 2: Áp dụng middleware xác thực JWT
router.use(authentication);

// Tầng 3: Kiểm tra quyền CanRead trên resource 'Dashboard'
// Cần thêm ResourceId = 'Dashboard' vào bảng Resources và cấp quyền cho các role cần xem
router.get('/master-data', checkPermission('Dashboard', 'CanRead'), dashboardController.getMasterData);
router.get('/hom-nay', require('../../controllers/yeucaunghi.controller').getDashboardHomNay);

module.exports = router;
