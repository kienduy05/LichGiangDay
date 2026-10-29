const express = require('express');
const controller = require('./xeplich.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');

const router = express.Router();
router.use(authentication);

router.get('/lop-chua-xep', checkPermission('ThoiKhoaBieu', 'CanRead'), controller.getLopChuaXep);
router.post('/kiem-tra', checkPermission('ThoiKhoaBieu', 'CanUpdate'), controller.kiemTra);
router.post('/phien', checkPermission('ThoiKhoaBieu', 'CanCreate'), controller.createPhien);
router.get('/phien', checkPermission('ThoiKhoaBieu', 'CanRead'), controller.listPhien);
router.post('/phien/xoa', checkPermission('ThoiKhoaBieu', 'CanDelete'), controller.deletePhienBatch);
router.get('/phien/:maPhien', checkPermission('ThoiKhoaBieu', 'CanRead'), controller.getPhien);
router.delete('/phien/:maPhien/ban-ghi', checkPermission('ThoiKhoaBieu', 'CanDelete'), controller.deletePhien);
router.patch('/phien/:maPhien/dong/:maDong', checkPermission('ThoiKhoaBieu', 'CanUpdate'), controller.updateDong);
router.post('/phien/:maPhien/ap-dung', checkPermission('ThoiKhoaBieu', 'CanUpdate'), controller.applyPhien);
router.delete('/phien/:maPhien', checkPermission('ThoiKhoaBieu', 'CanUpdate'), controller.cancelPhien);

module.exports = router;
