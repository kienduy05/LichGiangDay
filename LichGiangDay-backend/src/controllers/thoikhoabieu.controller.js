const ThoiKhoaBieuService = require('../services/thoikhoabieu.service');

class ThoiKhoaBieuController {

  // 1. Lấy dữ liệu cấu trúc cây TreeView
  getTreeViewData = async (req, res) => {
    try {
      let { maHocKy, search, filterStatus } = req.query;

      if (!maHocKy || !maHocKy.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Vui lòng chọn Học kỳ để tải sơ đồ phân cấp lớp học phần.'
        });
      }

      // Phân quyền dữ liệu Bộ môn: Tự động ép maBoMon theo username
      let maBoMon = '';
      if (req.user?.role === 'BOMON') {
        maBoMon = req.user.username;
      }

      const result = await ThoiKhoaBieuService.getTreeViewData({
        maHocKy, search, filterStatus, maBoMon
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
      let { maHocKy, maKhoa, maBoMon, maMonHoc, maPhong, thuTrongTuan, filterStatus, search } = req.query;

      if (!maHocKy || !maHocKy.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Vui lòng chọn Học kỳ.'
        });
      }

      // Phân quyền dữ liệu Bộ môn (ADMIN và PHONGDAOTAO được xem tất cả)
      if (req.user?.role === 'BOMON') {
        maBoMon = req.user.username;
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
      let { maHocKy, maToaNha, maPhong, maKhoa, maBoMon, maGiangVien, loaiHoc, search, tuNgay, denNgay } = req.query;

      // Phân quyền dữ liệu Bộ môn: Tự động ép maBoMon theo username
      // ADMIN và PHONGDAOTAO được xem tất cả
      if (req.user?.role === 'BOMON') {
        maBoMon = req.user.username;
      }

      const result = await ThoiKhoaBieuService.getMatrixGrid({
        maHocKy, maToaNha, maPhong, maKhoa, maBoMon, maGiangVien, loaiHoc, search, tuNgay, denNgay
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

  // ================================================================
  // 10. [BOMON ĐỘC QUYỀN] Lấy danh sách Lớp học phần cần phân công
  // ================================================================
  getBomonAssignableClasses = async (req, res) => {
    try {
      if (req.user?.role !== 'BOMON') {
        return res.status(403).json({
          status: 'error', code: 403,
          message: 'Quyền hạn bị từ chối: Chức năng phân công giảng viên là đặc quyền riêng của Bộ Môn.'
        });
      }

      const { maHocKy, search, filterStatus } = req.query;
      const maBoMon = req.user.username;

      const result = await ThoiKhoaBieuService.getBomonAssignableClasses({
        maHocKy, maBoMon, search, filterStatus
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy danh sách lớp học phần phân công thành công.',
        metadata: result
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error', code: 500,
        message: error.message || 'Lỗi server khi lấy danh sách phân công lớp học phần.'
      });
    }
  };

  // ================================================================
  // 11. [BOMON ĐỘC QUYỀN] Quét kiểm tra tình trạng khả dụng của GV
  // ================================================================
  getLecturerAvailability = async (req, res) => {
    try {
      if (req.user?.role !== 'BOMON') {
        return res.status(403).json({
          status: 'error', code: 403,
          message: 'Quyền hạn bị từ chối: Chức năng này chỉ dành riêng cho Bộ Môn.'
        });
      }

      const { maLopHocPhan } = req.query;
      const maBoMon = req.user.username;

      const result = await ThoiKhoaBieuService.getLecturerAvailabilityForClass({
        maLopHocPhan, maBoMon
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Quét tình trạng khả dụng của giảng viên thành công.',
        metadata: result
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error', code: 500,
        message: error.message || 'Lỗi server khi kiểm tra khả dụng giảng viên.'
      });
    }
  };

  // ================================================================
  // 12. [BOMON ĐỘC QUYỀN] Xem trước Thời khóa biểu tuần của Giảng viên
  // ================================================================
  getLecturerWeeklySchedule = async (req, res) => {
    try {
      const allowedRoles = ['BOMON', 'GIANGVIEN', 'ADMIN'];
      if (!allowedRoles.includes(req.user?.role)) {
        return res.status(403).json({
          status: 'error', code: 403,
          message: 'Quyền hạn bị từ chối: Chức năng này dành cho Giảng Viên, Bộ Môn hoặc Quản Trị.'
        });
      }

      let { maGiangVien, maHocKy } = req.query;
      const maBoMon = req.user?.role === 'BOMON' ? req.user.username : '';

      const result = await ThoiKhoaBieuService.getLecturerWeeklySchedule({
        maGiangVien, maHocKy, maBoMon, userId: req.user?.userId
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy thời khóa biểu tuần của giảng viên thành công.',
        metadata: result
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error', code: 500,
        message: error.message || 'Lỗi server khi lấy lịch tuần giảng viên.'
      });
    }
  };

  // ================================================================
  // 13. [BOMON ĐỘC QUYỀN] Thống kê Tải Giảng Dạy của toàn bộ Giảng viên
  // ================================================================
  getBomonWorkloadSummary = async (req, res) => {
    try {
      if (req.user?.role !== 'BOMON') {
        return res.status(403).json({
          status: 'error', code: 403,
          message: 'Quyền hạn bị từ chối: Chức năng này chỉ dành riêng cho Bộ Môn.'
        });
      }

      const { maHocKy } = req.query;
      const maBoMon = req.user.username;

      const result = await ThoiKhoaBieuService.getBomonWorkloadSummary({
        maBoMon, maHocKy
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy thống kê tải giảng dạy của bộ môn thành công.',
        metadata: result
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error', code: 500,
        message: error.message || 'Lỗi server khi thống kê tải giảng dạy.'
      });
    }
  };

  // ================================================================
  // 14. [BOMON ĐỘC QUYỀN] Thực hiện Phân công Giảng viên
  // ================================================================
  assignLecturerToClass = async (req, res) => {
    try {
      if (req.user?.role !== 'BOMON') {
        return res.status(403).json({
          status: 'error', code: 403,
          message: 'Quyền hạn bị từ chối: Chỉ Trưởng/Phó Bộ Môn mới có quyền phân công giảng viên.'
        });
      }

      const { maLopHocPhan, maGiangVien, allowOverride } = req.body;
      const maBoMon = req.user.username;

      const result = await ThoiKhoaBieuService.assignLecturerToClass({
        maLopHocPhan, maGiangVien, maBoMon, allowOverride
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: `Phân công giảng viên thành công cho lớp học phần!`,
        metadata: result
      });
    } catch (error) {
      const statusCode = error.statusCode || (error.message.includes('không tồn tại') ? 404 : 400);
      return res.status(statusCode).json({
        status: 'error', code: statusCode,
        message: error.message || 'Lỗi phân công giảng viên.',
        conflictDetails: error.conflictDetails || null
      });
    }
  };

  // ================================================================
  // 15. [BOMON ĐỘC QUYỀN] Hủy phân công Giảng viên khỏi Lớp HP
  // ================================================================
  unassignLecturerFromClass = async (req, res) => {
    try {
      if (req.user?.role !== 'BOMON') {
        return res.status(403).json({
          status: 'error', code: 403,
          message: 'Quyền hạn bị từ chối: Chỉ Bộ Môn mới có quyền hủy phân công.'
        });
      }

      const { maLopHocPhan } = req.body;
      const maBoMon = req.user.username;

      const result = await ThoiKhoaBieuService.unassignLecturerFromClass({
        maLopHocPhan, maBoMon
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Đã hủy phân công giảng viên khỏi lớp học phần.',
        metadata: result
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error', code: 400,
        message: error.message || 'Lỗi khi hủy phân công giảng viên.'
      });
    }
  };
}

module.exports = new ThoiKhoaBieuController();

