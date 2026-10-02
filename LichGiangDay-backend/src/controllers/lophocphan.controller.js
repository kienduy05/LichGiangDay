const LopHocPhanService = require('../services/lophocphan.service');
const XLSX = require('xlsx');

class LopHocPhanController {

  // ================================================================
  // 1. Danh sách LHP (bắt buộc ?maHocKy)
  // ================================================================
  getAll = async (req, res) => {
    try {
      const { maHocKy, maBoMon, maMonHoc, loaiHoc, search } = req.query;

      if (!maHocKy || !maHocKy.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Vui lòng chọn Học kỳ để lọc danh sách lớp học phần.'
        });
      }

      const list = await LopHocPhanService.getAll({
        maHocKy, maBoMon, maMonHoc, loaiHoc, search
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy danh sách lớp học phần thành công.',
        metadata: list
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error', code: 500,
        message: error.message || 'Lỗi server khi lấy danh sách lớp học phần.'
      });
    }
  };

  // ================================================================
  // Lấy thông tin 1 LHP
  // ================================================================
  getById = async (req, res) => {
    try {
      const { maLopHocPhan } = req.params;
      const result = await LopHocPhanService.getById(maLopHocPhan);
      if (!result) {
        return res.status(404).json({
          status: 'error', code: 404,
          message: `Không tìm thấy lớp học phần '${maLopHocPhan}'.`
        });
      }
      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy thông tin lớp học phần thành công.',
        metadata: result
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error', code: 500,
        message: error.message || 'Lỗi server.'
      });
    }
  };

  // ================================================================
  // 4. Chi tiết LHP — chỉ thông tin cơ bản
  // ================================================================
  getChiTiet = async (req, res) => {
    try {
      const { maLopHocPhan } = req.params;
      const result = await LopHocPhanService.getChiTiet(maLopHocPhan);
      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy chi tiết lớp học phần thành công.',
        metadata: result
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
      return res.status(statusCode).json({
        status: 'error', code: statusCode,
        message: error.message
      });
    }
  };

  // ================================================================
  // 2. Tạo mới LHP thủ công
  //    Body: { maLopHocPhan, maMonHoc, maHocKy, loaiHoc, maBoMon,
  //            siSoDuKien?, siSoDangKy?, khoaHoc? }
  // ================================================================
  create = async (req, res) => {
    try {
      const {
        maLopHocPhan, tenLopHocPhan, maMonHoc, maHocKy, loaiHoc,
      maBoMon, siSoDuKien, siSoDangKy, khoaHoc,
      ngayBatDau, ngayKetThuc, soTuan
      } = req.body;

      if (!maLopHocPhan || !maLopHocPhan.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Mã lớp môn tín chỉ không được để trống.'
        });
      }
      if (!maMonHoc || !maMonHoc.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Mã môn học không được để trống.'
        });
      }

      const result = await LopHocPhanService.create({
        maLopHocPhan, tenLopHocPhan, maMonHoc, maHocKy, loaiHoc,
      maBoMon, siSoDuKien, siSoDangKy, khoaHoc,
      ngayBatDau, ngayKetThuc, soTuan
      });

      return res.status(201).json({
        status: 'success', code: 201,
        message: 'Tạo lớp học phần mới thành công.',
        metadata: result
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error', code: 400,
        message: error.message
      });
    }
  };

  // ================================================================
  // 3. Cập nhật thông tin cơ bản
  //    Body: { loaiHoc, siSoDuKien?, siSoDangKy?, khoaHoc? }
  // ================================================================
  update = async (req, res) => {
    try {
      const { maLopHocPhan } = req.params;
      const { tenLopHocPhan, loaiHoc, siSoDuKien, siSoDangKy, khoaHoc,
      ngayBatDau, ngayKetThuc, soTuan } = req.body;

      const result = await LopHocPhanService.update(maLopHocPhan, {
        tenLopHocPhan,  loaiHoc, siSoDuKien, siSoDangKy, khoaHoc,
      ngayBatDau, ngayKetThuc, soTuan
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Cập nhật lớp học phần thành công.',
        metadata: result
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
      return res.status(statusCode).json({
        status: 'error', code: statusCode,
        message: error.message
      });
    }
  };

  // ================================================================
  // 4a. Lấy danh sách lớp SV đã ghép (giữ stub cho module sau)
  // ================================================================
  getLopSinhVienGhep = async (req, res) => {
    try {
      const { maLopHocPhan } = req.params;
      const list = await LopHocPhanService.getLopSinhVienGhep(maLopHocPhan);
      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy danh sách lớp sinh viên ghép thành công.',
        metadata: list
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
      return res.status(statusCode).json({
        status: 'error', code: statusCode,
        message: error.message
      });
    }
  };

  // ================================================================
  // 4b. Gắn lớp SV (giữ stub)
  // ================================================================
  attachLopSinhVien = async (req, res) => {
    try {
      const { maLopHocPhan } = req.params;
      const { dsLopSinhVien } = req.body;
      const result = await LopHocPhanService.attachLopSinhVien(maLopHocPhan, dsLopSinhVien);
      return res.status(200).json({
        status: 'success', code: 200,
        message: `Đã gắn ${result.added.length} lớp SV, bỏ qua ${result.skipped.length} (đã có).`,
        metadata: result
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
      return res.status(statusCode).json({
        status: 'error', code: statusCode,
        message: error.message
      });
    }
  };

  // ================================================================
  // 4c. Gỡ lớp SV (giữ stub)
  // ================================================================
  detachLopSinhVien = async (req, res) => {
    try {
      const { maLopHocPhan } = req.params;
      const { dsLopSinhVien } = req.body;
      const result = await LopHocPhanService.detachLopSinhVien(maLopHocPhan, dsLopSinhVien);
      return res.status(200).json({
        status: 'success', code: 200,
        message: `Đã gỡ ${result.removed} lớp sinh viên khỏi lớp học phần.`,
        metadata: result
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
      return res.status(statusCode).json({
        status: 'error', code: statusCode,
        message: error.message
      });
    }
  };

  // ================================================================
  // Gợi ý lớp SV (giữ stub)
  // ================================================================
  getSuggestedLopSinhVien = async (req, res) => {
    try {
      const { maLopHocPhan } = req.params;
      const list = await LopHocPhanService.getSuggestedLopSinhVien(maLopHocPhan);
      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Lấy danh sách lớp sinh viên gợi ý thành công.',
        metadata: list
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
      return res.status(statusCode).json({
        status: 'error', code: statusCode,
        message: error.message
      });
    }
  };

  // ================================================================
  // 5. Phân công GV (giữ stub cho module sau)
  // ================================================================
  assignGiangVien = async (req, res) => {
    try {
      const { maLopHocPhan } = req.params;
      const { maGiangVien } = req.body;
      const result = await LopHocPhanService.assignGiangVien(maLopHocPhan, maGiangVien);
      let message = 'Phân công giảng viên thành công.';
      if (!maGiangVien || maGiangVien.trim() === '') {
        message = 'Đã gỡ phân công giảng viên.';
      }
      if (result.warnBoMonKhac) {
        message += ' ⚠️ Giảng viên không thuộc cùng bộ môn với lớp học phần.';
      }
      return res.status(200).json({ status: 'success', code: 200, message, metadata: result });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
      return res.status(statusCode).json({ status: 'error', code: statusCode, message: error.message });
    }
  };

  // ================================================================
  // 5. Xóa LHP
  // ================================================================
  deleteLopHocPhan = async (req, res) => {
    try {
      const { maLopHocPhan } = req.params;
      const result = await LopHocPhanService.delete(maLopHocPhan);
      return res.status(200).json({
        status: 'success', code: 200,
        message: 'Xóa lớp học phần thành công.',
        metadata: result
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
      return res.status(statusCode).json({
        status: 'error', code: statusCode,
        message: error.message
      });
    }
  };

  // ================================================================
  // 6. Import từ Excel (dữ liệu nền 6 cột)
  // ================================================================
  importExcel = async (req, res) => {
    try {
      const { maBoMon, maHocKy } = req.body;
      const userId = req.user?.userId;

      if (!maBoMon || !maBoMon.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Vui lòng chọn Bộ môn trước khi upload.'
        });
      }
      if (!maHocKy || !maHocKy.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Vui lòng chọn Học kỳ trước khi upload.'
        });
      }
      if (!req.file) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Không tìm thấy file Excel được upload.'
        });
      }

      // Đọc file Excel từ buffer
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const excelRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (excelRows.length === 0) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'File Excel không có dữ liệu.'
        });
      }

      const result = await LopHocPhanService.importFromExcel({
        userId, maBoMon, maHocKy, rows: excelRows
      });

      return res.status(200).json({
        status: 'success', code: 200,
        message: `Import hoàn tất: ${result.dongThanhCong} thành công, ${result.dongLoi} lỗi.`,
        metadata: result
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error', code: 400,
        message: error.message || 'Lỗi khi import file Excel.'
      });
    }
  };

  // ================================================================
  // 7. Export ra Excel — chỉ 6 cột dữ liệu nền
  // ================================================================
  exportExcel = async (req, res) => {
    try {
      const { maHocKy, maBoMon } = req.query;

      const data = await LopHocPhanService.getExportData({ maHocKy, maBoMon });

      // Tạo workbook — 6 cột nghiệp vụ
      const exportRows = data.map(row => ({
        'Mã lớp môn tín chỉ': row.MaLopHocPhan,
        'Mã học phần': row.MaMonHoc,
        'Kiểu học': row.LoaiHoc,
        'SV dự kiến': row.SiSoDuKien || '',
        'SV đăng ký': row.SiSoDangKy || '',
        'Khóa': row.KhoaHoc || ''
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportRows);

      // Đặt độ rộng cột
      worksheet['!cols'] = [
        { wch: 35 }, // Mã lớp môn tín chỉ
        { wch: 15 }, // Mã học phần
        { wch: 10 }, // Kiểu học
        { wch: 12 }, // SV dự kiến
        { wch: 12 }, // SV đăng ký
        { wch: 10 }, // Khóa
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'LopHocPhan');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=LopHocPhan_${maHocKy || 'all'}_${maBoMon || 'all'}.xlsx`);
      return res.send(buffer);
    } catch (error) {
      return res.status(400).json({
        status: 'error', code: 400,
        message: error.message || 'Lỗi khi xuất file Excel.'
      });
    }
  };
}

module.exports = new LopHocPhanController();
