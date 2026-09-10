const express = require('express');
const accessController = require('../../controllers/access.controller');
const { authentication } = require('../../auth/authUtils');
const router = express.Router();

// Public routes
router.post('/login', accessController.login);

// Protected routes (require x-client-id and authorization Bearer token)
router.use(authentication);
router.post('/logout', accessController.logout);
router.get('/me', accessController.getMe);
router.put('/update-profile', accessController.updateProfile);
router.put('/change-password', accessController.changePassword);

module.exports = router;
