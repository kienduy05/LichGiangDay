const express = require('express');
const { apiKey } = require('../auth/checkAuth');
const router = express.Router();

// Apply x-api-key check for all API routes
router.use(apiKey);

// Auth routes
router.use('/v1/api/auth', require('./access'));

// Roles management routes
router.use('/v1/api/roles', require('./role'));

// Users management routes
router.use('/v1/api/users', require('./user'));

// Permissions management routes
router.use('/v1/api/permissions', require('./permission'));

// Building management routes
router.use('/v1/api/toanha', require('./toanha'));

// Room management routes
router.use('/v1/api/phonghoc', require('./phonghoc'));

// Faculty (Khoa) management routes
router.use('/v1/api/khoa', require('./khoa'));

module.exports = router;
