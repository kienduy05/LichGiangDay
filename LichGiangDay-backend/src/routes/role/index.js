const express = require('express');
const roleController = require('../../controllers/role.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Tất cả các API Quản lý Nhóm người dùng đều bảo vệ bằng middleware JWT authentication & RBAC checkPermission
router.use(authentication);

router.get('/', checkPermission('Roles', 'CanRead'), roleController.getAll);
router.get('/:roleId', checkPermission('Roles', 'CanRead'), roleController.getById);
router.post('/', checkPermission('Roles', 'CanCreate'), roleController.create);
router.put('/:roleId', checkPermission('Roles', 'CanUpdate'), roleController.update);
router.delete('/:roleId', checkPermission('Roles', 'CanDelete'), roleController.deleteRole);

module.exports = router;
