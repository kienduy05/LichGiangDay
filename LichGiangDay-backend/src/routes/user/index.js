const express = require('express');
const userController = require('../../controllers/user.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');
const router = express.Router();

// Tầng bảo vệ bằng middleware JWT authentication & RBAC checkPermission
router.use(authentication);

router.get('/', checkPermission('Users', 'CanRead'), userController.getAll);
router.get('/:userId', checkPermission('Users', 'CanRead'), userController.getById);
router.post('/', checkPermission('Users', 'CanCreate'), userController.create);
router.put('/:userId', checkPermission('Users', 'CanUpdate'), userController.updateAdmin);
router.put('/:userId/reset-password', checkPermission('Users', 'CanUpdate'), userController.resetPassword);
router.put('/:userId/toggle-status', checkPermission('Users', 'CanUpdate'), userController.toggleStatus);
router.delete('/:userId', checkPermission('Users', 'CanDelete'), userController.deleteUser);

module.exports = router;
