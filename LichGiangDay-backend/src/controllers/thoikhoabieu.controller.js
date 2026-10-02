const ThoiKhoaBieuService = require('../services/thoikhoabieu.service');

class ThoiKhoaBieuController {

  // 1. Lấy dữ liệu cấu trúc cây TreeView
  getTreeViewData = async (req, res) => {
    try {
      const { maHocKy, search, filterStatus } = req.query;

      if (!maHocKy || !maHocKy.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Vui lòng chọn Học kỳ để tải sơ đồ phân cấp lớp học phần.'
        });
      }

      const result = await ThoiKhoaBieuService.getTreeViewData({
        maHocKy, search, filterStatus
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy dữ liệu sơ đồ phân cấp lớp học phần thành công.',
        metadata: result
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error', code: 500,
        message: error.message || 'Lỗi server khi lấy dữ liệu TreeView.'
      });
    }
  };

  // 2. Lấy danh sách TKB dạng bảng
  getAll = async (req, res) => {
    try {
      const { maHocKy, maKhoa, maBoMon, maMonHoc, maPhong, thuTrongTuan, filterStatus, search } = req.query;

      if (!maHocKy || !maHocKy.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Vui lòng chọn Học kỳ.'
        });
      }

      const result = await ThoiKhoaBieuService.getAll({
        maHocKy, maKhoa, maBoMon, maMonHoc, maPhong, thuTrongTuan, filterStatus, search
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy danh sách thời khóa biểu thành công.',
        metadata: result
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error', code: 500,
        message: error.message || 'Lỗi server khi lấy danh sách thời khóa biểu.'
      });
    }
  };

  // 3. Lấy chi tiết TKB của 1 Lớp học phần
  getByLopHocPhan = async (req, res) => {
    try {
      const { maLopHocPhan } = req.params;
      const result = await ThoiKhoaBieuService.getByLopHocPhan(maLopHocPhan);

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy thông tin thời khóa biểu của lớp học phần thành công.',
        metadata: result
      });
    } catch (error) {
      return res.status(error.message.includes('Không tìm thấy') ? 404 : 500).json({
        status: 'error',
        code: error.message.includes('Không tìm thấy') ? 404 : 500,
        message: error.message || 'Lỗi server.'
      });
    }
  };

  // 4. Lưới trạng thái phòng học (Room Selection Grid)
  getRoomStatusGrid = async (req, res) => {
    try {
      const { thuTrongTuan, maTiet, ngayBatDau, ngayKetThuc, excludeMaLopHocPhan, maToaNha } = req.query;

      const result = await ThoiKhoaBieuService.getRoomStatusGrid({
        thuTrongTuan, maTiet, ngayBatDau, ngayKetThuc, excludeMaLopHocPhan, maToaNha
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy trạng thái phòng học thành công.',
        metadata: result
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error', code: 400,
        message: error.message || 'Lỗi kiểm tra trạng thái phòng học.'
      });
    }
  };

  // 5. Kiểm tra Xung đột trước khi lưu (Conflict Check)
  checkConflict = async (req, res) => {
    try {
      const { maLopHocPhan, schedules } = req.body;

      if (!maLopHocPhan) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Mã lớp học phần không được để trống.'
        });
      }

      const result = await ThoiKhoaBieuService.checkConflict({
        maLopHocPhan, schedules
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: result.hasConflict ? 'Phát hiện có xung đột lịch học.' : 'Lịch học hợp lệ, không có xung đột.',
        metadata: result
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error', code: 500,
        message: error.message || 'Lỗi server khi kiểm tra xung đột.'
      });
    }
  };

  // 6. Lưu toàn bộ Thời Khóa Biểu cho Lớp học phần
  saveSchedules = async (req, res) => {
    try {
      const { maLopHocPhan, schedules } = req.body;

      if (!maLopHocPhan) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Mã lớp học phần không được để trống.'
        });
      }

      const result = await ThoiKhoaBieuService.saveSchedules({
        maLopHocPhan, schedules
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lưu thời khóa biểu thành công!',
        metadata: result
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error', code: 400,
        message: error.message || 'Không thể lưu thời khóa biểu.'
      });
    }
  };

  // 7. Xóa toàn bộ TKB của 1 Lớp học phần
  deleteByLopHocPhan = async (req, res) => {
    try {
      const { maLopHocPhan } = req.params;
      const result = await ThoiKhoaBieuService.deleteByLopHocPhan(maLopHocPhan);

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Xóa thời khóa biểu của lớp học phần thành công.',
        metadata: result
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error', code: 500,
        message: error.message || 'Lỗi server khi xóa thời khóa biểu.'
      });
    }
  };

  // 8. Xóa 1 bản ghi TKB
  deleteScheduleItem = async (req, res) => {
    try {
      const { maThoiKhoaBieu } = req.params;
      const result = await ThoiKhoaBieuService.deleteScheduleItem(maThoiKhoaBieu);

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Xóa buổi học thành công.',
        metadata: result
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error', code: 500,
        message: error.message || 'Lỗi server khi xóa buổi học.'
      });
    }
  };

  // 9. Lấy dữ liệu dạng Lưới Ma trận (Matrix Grid View)
  getMatrixGrid = async (req, res) => {
    try {
      const { maHocKy, maToaNha, maPhong, maKhoa, maBoMon } = req.query;

      if (!maHocKy || !maHocKy.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Vui lòng chọn Học kỳ.'
        });
      }

      const result = await ThoiKhoaBieuService.getMatrixGrid({
        maHocKy, maToaNha, maPhong, maKhoa, maBoMon
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy dữ liệu lưới thời khóa biểu thành công.',
        metadata: result
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error', code: 500,
        message: error.message || 'Lỗi server khi lấy lưới thời khóa biểu.'
      });
    }
  };
}

module.exports = new ThoiKhoaBieuController();
