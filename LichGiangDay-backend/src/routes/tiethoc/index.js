const express = require('express');
const tiethocController = require('../../controllers/tiethoc.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Tầng 2: Áp dụng middleware xác thực JWT cho tất cả các API thuộc module Tiết Học
router.use(authentication);

// Tầng 3: Gán checkPermission(resourceId, action) cho từng Endpoint
router.get('/', checkPermission('TietHoc', 'CanRead'), tiethocController.getAll);
router.get('/:maTiet', checkPermission('TietHoc', 'CanRead'), tiethocController.getById);
router.post('/', checkPermission('TietHoc', 'CanCreate'), tiethocController.create);
router.put('/:maTiet', checkPermission('TietHoc', 'CanUpdate'), tiethocController.update);
router.delete('/:maTiet', checkPermission('TietHoc', 'CanDelete'), tiethocController.deleteTietHoc);

module.exports = router;
