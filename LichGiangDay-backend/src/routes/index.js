const express = require('express');
const { apiKey } = require('../auth/checkAuth');
const router = express.Router();

// Apply x-api-key check for all API routes
router.use(apiKey);

// Auth routes
router.use('/v1/api/auth', require('./access'));

module.exports = router;
