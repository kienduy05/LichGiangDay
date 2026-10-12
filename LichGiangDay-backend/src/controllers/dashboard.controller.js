const { DashboardService } = require('../services/dashboard.service');

class DashboardController {
  /**
   * GET /v1/api/dashboard/master-data?maHocKy=...&maKhoa=...&sections=...
   * Trả về toàn bộ số liệu dashboard trong một lần gọi
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
}

module.exports = new DashboardController();
