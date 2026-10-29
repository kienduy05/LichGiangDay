const express = require('express');
const controller = require('./xeplich.controller');
const { authentication } = require('../../auth/authUtils');
const { checkPermission } = require('../../auth/checkPermission');

const router = express.Router();
router.use(authentication);

router.delete('/phien/:maPhien/lop/:maLopHocPhan/nhap', checkPermission('ThoiKhoaBieu', 'CanDelete'), controller.removeClassDraft);
router.get('/thong-bao/:maLienKet', checkPermission('ThoiKhoaBieu', 'CanRead'), controller.resolveNotification);
router.get('/cho-xac-nhan', checkPermission('ThoiKhoaBieu', 'CanRead'), controller.listChoXacNhan);
router.post('/phien/:maPhien/gui-xac-nhan', checkPermission('ThoiKhoaBieu', 'CanUpdate'), controller.applyPhien);
router.put('/phien/:maPhien/lop/:maLopHocPhan/nhap', checkPermission('ThoiKhoaBieu', 'CanUpdate'), controller.updateClassDraft);
router.get('/lop-chua-xep', checkPermission('ThoiKhoaBieu', 'CanRead'), controller.getLopChuaXep);
router.post('/kiem-tra', checkPermission('ThoiKhoaBieu', 'CanUpdate'), controller.kiemTra);
router.post('/phien', checkPermission('ThoiKhoaBieu', 'CanCreate'), controller.createPhien);
router.get('/phien/:maPhien', checkPermission('ThoiKhoaBieu', 'CanRead'), controller.getPhien);
router.patch('/phien/:maPhien/dong/:maDong', checkPermission('ThoiKhoaBieu', 'CanUpdate'), controller.updateDong);
router.post('/phien/:maPhien/ap-dung', checkPermission('ThoiKhoaBieu', 'CanUpdate'), controller.applyPhien);
router.delete('/phien/:maPhien', checkPermission('ThoiKhoaBieu', 'CanUpdate'), controller.cancelPhien);

module.exports = router;
