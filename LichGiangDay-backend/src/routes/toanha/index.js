const express = require('express');
const toanhaController = require('../../controllers/toanha.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Tầng 2: Áp dụng middleware xác thực JWT cho tất cả các API thuộc module Tòa Nhà
router.use(authentication);

// Tầng 3: Gán checkPermission(resourceId, action) cho từng Endpoint
router.get('/', checkPermission('ToaNha', 'CanRead'), toanhaController.getAll);
router.get('/:maToaNha', checkPermission('ToaNha', 'CanRead'), toanhaController.getById);
router.post('/', checkPermission('ToaNha', 'CanCreate'), toanhaController.create);
router.put('/:maToaNha', checkPermission('ToaNha', 'CanUpdate'), toanhaController.update);
router.delete('/:maToaNha', checkPermission('ToaNha', 'CanDelete'), toanhaController.deleteToaNha);

module.exports = router;
