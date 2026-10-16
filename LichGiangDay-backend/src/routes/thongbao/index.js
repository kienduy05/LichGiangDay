const express = require('express');
const router = express.Router();
const ThongBaoController = require('../../controllers/thongbao.controller');
const { authentication } = require('../../auth/authUtils');

router.use(authentication);

router.get('/', ThongBaoController.getMyNotifications);
router.get('/chua-doc/count', ThongBaoController.countUnread);
router.put('/:id/da-doc', ThongBaoController.markAsRead);

module.exports = router;
