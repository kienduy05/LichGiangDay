const LopHocPhanService = require('../services/lophocphan.service');
const XLSX = require('xlsx');

class LopHocPhanController {

  // ================================================================
  // 1. Danh sách LHP (bắt buộc ?maHocKy)
  // ================================================================
  getAll = async (req, res) => {
    try {
      const { maHocKy, maBoMon, maMonHoc, maGiangVien, trangThaiPhanCong, search } = req.query;

      if (!maHocKy || !maHocKy.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Vui lòng chọn Học kỳ để lọc danh sách lớp học phần.'
        });
      }

      const list = await LopHocPhanService.getAll({
        maHocKy, maBoMon, maMonHoc, maGiangVien, trangThaiPhanCong, search
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
  // 6. Chi tiết LHP + danh sách lớp SV ghép
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
  // ================================================================
  create = async (req, res) => {
    try {
      const {
        maMonHoc, maNhom, tenLopHocPhan, maHocKy, loaiHoc,
        maBoMon, siSoDuKien, khoaHoc, ngayBatDau, ngayKetThuc, soTuan
      } = req.body;

      // Quick validation ở controller
      if (!maMonHoc || !maMonHoc.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Mã môn học không được để trống.'
        });
      }
      if (!maNhom || !maNhom.trim()) {
        return res.status(400).json({
          status: 'error', code: 400,
          message: 'Mã nhóm (VD: BT1, LT01) không được để trống.'
        });
      }

      const result = await LopHocPhanService.create({
        maMonHoc, maNhom, tenLopHocPhan, maHocKy, loaiHoc,
        maBoMon, siSoDuKien, khoaHoc, ngayBatDau, ngayKetThuc, soTuan
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
  // ================================================================
  update = async (req, res) => {
    try {
      const { maLopHocPhan } = req.params;
      const {
        tenLopHocPhan, siSoDuKien, siSoDangKy, loaiHoc,
        maBoMon, khoaHoc, ngayBatDau, ngayKetThuc, soTuan
      } = req.body;

      const result = await LopHocPhanService.update(maLopHocPhan, {
        tenLopHocPhan, siSoDuKien, siSoDangKy, loaiHoc,
        maBoMon, khoaHoc, ngayBatDau, ngayKetThuc, soTuan
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
  // 4a. Lấy danh sách lớp SV đã ghép
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
  // 4b. Gắn lớp SV
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
  // 4c. Gỡ lớp SV
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
  // Gợi ý lớp SV để gắn
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
  // 5. Phân công / Đổi / Gỡ giảng viên
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

      return res.status(200).json({
        status: 'success', code: 200,
        message,
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
  // 7. Xóa LHP
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
  // 8. Import từ Excel
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
  // 9. Export ra Excel (chỉ dữ liệu nền)
  // ================================================================
  exportExcel = async (req, res) => {
    try {
      const { maHocKy, maBoMon } = req.query;

      const data = await LopHocPhanService.getExportData({ maHocKy, maBoMon });

      // Tạo workbook
      const exportRows = data.map(row => ({
        'Mã học phần': row.MaMonHoc,
        'Tên môn học': row.TenMonHoc,
        'Số TC': row.SoTinChi,
        'Lớp môn tín chỉ': row.MaLopHocPhan,
        'Tên lớp HP': row.TenLopHocPhan || '',
        'Kiểu học': row.LoaiHoc,
        'Số SV DK': row.SiSoDuKien || '',
        'Số SV ĐK': row.SiSoDangKy || '',
        'Giảng viên': row.TenGiangVien || 'Chưa phân công',
        'Khóa': row.KhoaHoc || '',
        'Bộ môn': row.TenBoMon || '',
        'Trạng thái': row.TrangThaiPhanCong,
        'Tên các lớp ghép': row.TenCacLopGhep || ''
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportRows);

      // Đặt độ rộng cột
      worksheet['!cols'] = [
        { wch: 12 }, // Mã học phần
        { wch: 30 }, // Tên môn học
        { wch: 6 },  // Số TC
        { wch: 20 }, // Lớp môn tín chỉ
        { wch: 25 }, // Tên lớp HP
        { wch: 8 },  // Kiểu học
        { wch: 10 }, // Số SV DK
        { wch: 10 }, // Số SV ĐK
        { wch: 25 }, // Giảng viên
        { wch: 8 },  // Khóa
        { wch: 15 }, // Bộ môn
        { wch: 15 }, // Trạng thái
        { wch: 30 }, // Tên các lớp ghép
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'LopHocPhan');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=LopHocPhan_${maHocKy || 'all'}.xlsx`);
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
