const { DashboardService, invalidateDashboardCache } = require('../services/dashboard.service');
const YeuCauNghiService = require('../services/yeucaunghi.service');
const { DashboardBoMonService } = require('../services/dashboardBoMon.service');

class DashboardController {
  /**
   * GET /v1/api/dashboard/master-data?maHocKy=...&maKhoa=...&sections=...
   * Trả về toàn bộ số liệu dashboard trong một lần gọi (Admin / Phòng đào tạo)
   */
  getMasterData = async (req, res, next) => {
    try {
      const { maHocKy, maKhoa, sections } = req.query;

      if (!maHocKy) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Tham số maHocKy là bắt buộc. Vui lòng chọn học kỳ.'
        });
      }

      const data = await DashboardService.getMasterData({
        maHocKy: maHocKy || null,
        maKhoa: maKhoa || null,
        sections: sections || null
      });

      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy số liệu dashboard thành công.',
        metadata: data
      });
    } catch (error) {
      console.error('Dashboard getMasterData Error:', error);
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi lấy số liệu dashboard.'
      });
    }
  };

  /**
   * GET /v1/api/dashboard/hom-nay
   * Thống kê buổi học hôm nay (theo bộ môn nếu role = BOMON)
   */
  getDashboardHomNay = async (req, res, next) => {
    try {
      const result = await YeuCauNghiService.getDashboardHomNay(req.user);
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy dữ liệu dashboard hôm nay thành công',
        metadata: result
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi khi lấy dashboard hôm nay',
        metadata: null
      });
    }
  };

  /**
   * POST /v1/api/dashboard/invalidate-cache
   * Xóa toàn bộ cache dashboard (gọi khi admin cập nhật dữ liệu nền)
   */
  invalidateCache = async (req, res, next) => {
    try {
      invalidateDashboardCache();
      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Đã xóa cache dashboard thành công.'
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: error.message || 'Lỗi server khi xóa cache dashboard.'
      });
    }
  };

  /**
   * GET /v1/api/dashboard/bomon?maHocKy=...&maBoMon=...
   * Trả về số liệu dashboard riêng cho Role BOMON (Lịch dạy, Giảng viên, Đơn chờ duyệt)
   */
  getBoMonDashboard = async (req, res, next) => {
    try {
      const { maHocKy, maBoMon } = req.query;
      const data = await DashboardBoMonService.getBoMonDashboard(req.user, {
        maHocKy: maHocKy || null,
        maBoMonOverride: maBoMon || null
      });

      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Lấy số liệu dashboard bộ môn thành công.',
        metadata: data
      });
    } catch (error) {
      console.error('Dashboard getBoMonDashboard Error:', error);
      return res.status(error.status || 500).json({
        status: 'error',
        code: error.status || 500,
        message: error.message || 'Lỗi server khi lấy số liệu dashboard bộ môn.'
      });
    }
  };
}

module.exports = new DashboardController();
