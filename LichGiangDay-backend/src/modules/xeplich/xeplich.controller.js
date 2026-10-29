const XepLichService = require('./xeplich.service');

const sendError = (res, error, fallbackMessage) => {
  const code = error.status || 500;
  return res.status(code).json({
    status: 'error',
    code,
    message: error.message || fallbackMessage,
    metadata: error.metadata || null
  });
};

class XepLichController {
  getLopChuaXep = async (req, res) => {
    try {
      const result = await XepLichService.getLopChuaXep(req.query);
      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy danh sách lớp học phần chưa xếp lịch thành công.',
        metadata: result
      });
    } catch (error) {
      return sendError(res, error, 'Không thể lấy danh sách lớp chưa xếp lịch.');
    }
  };

  createPhien = async (req, res) => {
    try {
      const result = await XepLichService.createPhien(req.user, req.body);
      setImmediate(() => {
        XepLichService.processPhien(result.maPhien).catch((error) => {
          console.error(`[XepLich] Phiên ${result.maPhien} thất bại:`, error);
        });
      });
      return res.status(202).json({
        status: 'success', code: 202,
        message: 'Đã tạo phiên và bắt đầu xếp lịch tự động.',
        metadata: result
      });
    } catch (error) {
      return sendError(res, error, 'Không thể tạo phiên xếp lịch.');
    }
  };

  listPhien = async (req, res) => {
    try {
      const result = await XepLichService.listPhien(req.query);
      return res.status(200).json({ status: 'success', code: 200, metadata: result });
    } catch (error) {
      return sendError(res, error, 'Không thể lấy danh sách phiên xếp lịch.');
    }
  };

  deletePhien = async (req, res) => {
    try {
      const result = await XepLichService.deletePhien(req.params.maPhien);
      return res.status(200).json({ status: 'success', code: 200, metadata: result });
    } catch (error) {
      return sendError(res, error, 'Không thể xóa phiên xếp lịch.');
    }
  };

  deletePhienBatch = async (req, res) => {
    try {
      const result = await XepLichService.deletePhienBatch(req.body?.maPhien);
      return res.status(200).json({ status: 'success', code: 200, metadata: result });
    } catch (error) {
      return sendError(res, error, 'Không thể xóa các phiên xếp lịch.');
    }
  };

  getPhien = async (req, res) => {
    try {
      const result = await XepLichService.getPhien(req.params.maPhien);
      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy thông tin phiên xếp lịch thành công.',
        metadata: result
      });
    } catch (error) {
      return sendError(res, error, 'Không thể lấy phiên xếp lịch.');
    }
  };

  kiemTra = async (req, res) => {
    try {
      const result = await XepLichService.kiemTra(req.body);
      return res.status(200).json({
        status: 'success', code: 200,
        message: result.valid ? 'Vị trí xếp lịch hợp lệ.' : 'Vị trí xếp lịch có xung đột.',
        metadata: result
      });
    } catch (error) {
      return sendError(res, error, 'Không thể kiểm tra vị trí xếp lịch.');
    }
  };

  updateDong = async (req, res) => {
    try {
      const result = await XepLichService.updateDong(
        req.params.maPhien,
        Number(req.params.maDong),
        req.body
      );
      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Cập nhật dòng lịch nháp thành công.',
        metadata: result
      });
    } catch (error) {
      return sendError(res, error, 'Không thể cập nhật lịch nháp.');
    }
  };

  applyPhien = async (req, res) => {
    try {
      const result = await XepLichService.applyPhien(req.user, req.params.maPhien);
      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Áp dụng thời khóa biểu thành công.',
        metadata: result
      });
    } catch (error) {
      return sendError(res, error, 'Không thể áp dụng thời khóa biểu.');
    }
  };

  cancelPhien = async (req, res) => {
    try {
      const result = await XepLichService.cancelPhien(req.params.maPhien);
      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Đã hủy phiên xếp lịch.',
        metadata: result
      });
    } catch (error) {
      return sendError(res, error, 'Không thể hủy phiên xếp lịch.');
    }
  };
}

module.exports = new XepLichController();
