const express = require('express');
const phonghocController = require('../../controllers/phonghoc.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Tầng 2: Áp dụng middleware xác thực JWT cho tất cả các API thuộc module Phòng Học
router.use(authentication);

// Tầng 3: Gán checkPermission(resourceId, action) cho từng Endpoint
router.get('/', checkPermission('PhongHoc', 'CanRead'), phonghocController.getAll);
router.get('/:maPhong', checkPermission('PhongHoc', 'CanRead'), phonghocController.getById);
router.post('/', checkPermission('PhongHoc', 'CanCreate'), phonghocController.create);
router.put('/:maPhong', checkPermission('PhongHoc', 'CanUpdate'), phonghocController.update);
router.put('/:maPhong/toggle-status', checkPermission('PhongHoc', 'CanUpdate'), phonghocController.toggleStatus);
router.delete('/:maPhong', checkPermission('PhongHoc', 'CanDelete'), phonghocController.deletePhongHoc);

module.exports = router;
