const express = require('express');
const permissionController = require('../../controllers/permission.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Tầng bảo vệ bằng middleware JWT authentication & RBAC checkPermission
router.use(authentication);

router.get('/resources', permissionController.getResources);
router.get('/role/:roleId', checkPermission('RolePermissions', 'CanRead'), permissionController.getPermissionsByRole);
router.put('/role/:roleId', checkPermission('RolePermissions', 'CanUpdate'), permissionController.updatePermissions);

module.exports = router;
