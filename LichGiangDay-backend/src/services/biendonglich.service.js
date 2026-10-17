const db = require('../../config/db');
const ThongBaoService = require('./thongbao.service');
const { getUserScope } = require('./userScope.helper');

class BienDongLichService {

  /**
   * Tính toán KPIs cho danh sách biến động lịch
   */
  static computeKPIs = async (baseConditionSql, params) => {
    // 1. Tổng ca biến động (có yêu cầu hoặc buổi học khác Normal)
    // 2. Số ca báo nghỉ
    // 3. Tỷ lệ hoàn thành dạy bù (%)
    // 4. Số ca quá hạn bù (>14 ngày)
    const kpiSql = `
      SELECT 
        COUNT(DISTINCT bh.MaBuoiHoc) AS tongCaBienDong,
        COUNT(DISTINCT CASE WHEN bh.TrangThai IN ('Absent', 'Absence_Pending') OR ycn.LoaiYeuCau = 'ABSENCE' THEN bh.MaBuoiHoc END) AS soCaBaoNghi,
        COUNT(DISTINCT CASE WHEN (bh.TrangThai = 'Absent' OR ycn.LoaiYeuCau = 'ABSENCE') AND bh.DaDayBu = 1 THEN bh.MaBuoiHoc END) AS soCaDaBu,
        COUNT(DISTINCT CASE WHEN (bh.TrangThai = 'Absent' OR ycn.LoaiYeuCau = 'ABSENCE') AND bh.DaDayBu = 0 AND DATEDIFF(CURRENT_DATE(), bh.NgayHoc) > 14 THEN bh.MaBuoiHoc END) AS soCaQuaHan14Ngay
      FROM BuoiHoc bh
      JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
      LEFT JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon
      LEFT JOIN YeuCauNghi ycn ON bh.MaBuoiHoc = ycn.MaBuoiHoc
      LEFT JOIN DangKyDayBu dkdb ON (bh.MaBuoiHoc = dkdb.MaBuoiHocTao OR ycn.MaYeuCauNghi = dkdb.MaYeuCauNghi)
      WHERE (bh.TrangThai != 'Normal' OR bh.LoaiBuoiHoc = 'Makeup' OR ycn.MaYeuCauNghi IS NOT NULL OR dkdb.MaDangKyDayBu IS NOT NULL)
      ${baseConditionSql ? `AND ${baseConditionSql}` : ''}
    `;

    const [rows] = await db.query(kpiSql, params);
    const raw = rows[0] || {};
    const tongBaoNghi = raw.soCaBaoNghi || 0;
    const daBu = raw.soCaDaBu || 0;
    const tyLeHoanThanhDayBu = tongBaoNghi > 0 ? Math.round((daBu / tongBaoNghi) * 100) : 100;

    return {
      tongCaBienDong: raw.tongCaBienDong || 0,
      soCaBaoNghi: tongBaoNghi,
      tyLeHoanThanhDayBu,
      soCaQuaHan14Ngay: raw.soCaQuaHan14Ngay || 0
    };
  };

  /**
   * Lấy danh sách biến động lịch (Toàn trường hoặc Theo bộ môn)
   */
  static getBienDongLich = async (user, {
    maHocKy,
    maKhoa,
    maBoMon,
    loaiBienDong, // 'ABSENCE' | 'SWAP' | 'SUBSTITUTE' | 'MAKEUP' | 'ALL'
    trangThai,     // 'Pending' | 'Approved' | 'Rejected' | 'Revoked' | 'Confirmed' | 'ALL'
    search
  }) => {
    const scope = await getUserScope(user);

    // Xử lý phạm vi dữ liệu
    const conditions = [];
    const params = [];

    // Luôn lọc các ca có biến động lịch
    conditions.push("(bh.TrangThai != 'Normal' OR bh.LoaiBuoiHoc = 'Makeup' OR ycn.MaYeuCauNghi IS NOT NULL OR dkdb.MaDangKyDayBu IS NOT NULL)");

    // Nếu vai trò là BOMON, ép cố định maBoMon của họ
    if (user.role === 'BOMON') {
      if (!scope.maBoMon) {
        const err = new Error('Không xác định được mã bộ môn của tài khoản.');
        err.status = 403;
        throw err;
      }
      conditions.push('lhp.MaBoMon = ?');
      params.push(scope.maBoMon);
    } else {
      // ADMIN hoặc PHONGDAOTAO có thể lọc theo maKhoa, maBoMon
      if (maKhoa && maKhoa !== 'ALL') {
        conditions.push('bm.MaKhoa = ?');
        params.push(maKhoa);
      }
      if (maBoMon && maBoMon !== 'ALL') {
        conditions.push('lhp.MaBoMon = ?');
        params.push(maBoMon);
      }
    }

    // Chuẩn hóa mã học kỳ nếu nhận từ frontend
    let finalMaHocKy = maHocKy;
    if (finalMaHocKy === 'HK1_2026_2027') finalMaHocKy = 'HK1_26_27';
    if (finalMaHocKy === 'HK2_2026_2027') finalMaHocKy = 'HK2_26_27';
    if (finalMaHocKy === 'HK1_2025_2026') finalMaHocKy = 'HK1_25_26';
    if (finalMaHocKy === 'HK2_2025_2026') finalMaHocKy = 'HK2_25_26';

    if (finalMaHocKy && finalMaHocKy !== 'ALL') {
      conditions.push('lhp.MaHocKy = ?');
      params.push(finalMaHocKy);
    }

    // Điều kiện cơ bản cho KPI (bỏ qua điều kiện đầu tiên vì KPI query đã có sẵn)
    const kpiConditions = conditions.slice(1);
    const baseConditionSql = kpiConditions.length > 0 ? kpiConditions.join(' AND ') : '';
    const kpiParams = [...params];

    // Lọc theo loại biến động
    if (loaiBienDong && loaiBienDong !== 'ALL') {
      if (loaiBienDong === 'MAKEUP') {
        conditions.push("(bh.LoaiBuoiHoc = 'Makeup' OR dkdb.MaDangKyDayBu IS NOT NULL)");
      } else {
        conditions.push('ycn.LoaiYeuCau = ?');
        params.push(loaiBienDong);
      }
    }

    // Lọc theo trạng thái
    if (trangThai && trangThai !== 'ALL') {
      conditions.push("(ycn.TrangThai = ? OR dkdb.TrangThai = ? OR bh.TrangThai = ?)");
      params.push(trangThai, trangThai, trangThai);
    }

    // Tìm kiếm
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push('(gv.HoTen LIKE ? OR lhp.TenLopHocPhan LIKE ? OR mh.TenMonHoc LIKE ? OR lhp.MaLopHocPhan LIKE ?)');
      params.push(s, s, s, s);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const listSql = `
      SELECT DISTINCT
        bh.MaBuoiHoc, 
        DATE_FORMAT(bh.NgayHoc, '%Y-%m-%d') AS NgayHoc,
        bh.MaTiet, bh.MaPhong, bh.MaGiangVien, bh.MaGiangVienGoc,
        bh.LoaiBuoiHoc, bh.TrangThai AS TrangThaiBuoiHoc, bh.DaDayBu, bh.GhiChu,
        bh.NgayGocDoiCa, bh.MaTietGocDoiCa, bh.MaPhongGocDoiCa,
        lhp.MaLopHocPhan, lhp.TenLopHocPhan, lhp.MaBoMon, bm.TenBoMon, bm.MaKhoa, k.TenKhoa,
        mh.MaMonHoc, mh.TenMonHoc,
        ph.TenPhong, th.TenTiet, th.GioBatDau, th.GioKetThuc,
        gv.HoTen AS TenGiangVien,
        gvGoc.HoTen AS TenGiangVienGoc,
        ycn.MaYeuCauNghi, ycn.LoaiYeuCau, ycn.LyDo, ycn.MinhChungUrl,
        ycn.NgayDeXuat, ycn.MaTietDeXuat, ycn.MaPhongDeXuat, ycn.MaGiangVienDeXuat,
        ycn.TrangThai AS TrangThaiYeuCau,
        ycn.LyDoTuChoi,
        DATE_FORMAT(ycn.ThoiGianGui, '%Y-%m-%d %H:%i:%s') AS ThoiGianGui,
        DATE_FORMAT(ycn.ThoiGianDuyet, '%Y-%m-%d %H:%i:%s') AS ThoiGianDuyet,
        gvDuyet.HoTen AS TenNguoiDuyet,
        gvThay.HoTen AS TenGiangVienDayThay,
        dkdb.MaDangKyDayBu, dkdb.TrangThai AS TrangThaiDayBu, dkdb.MaBuoiHocTao,
        DATE_FORMAT(bhGoc.NgayHoc, '%Y-%m-%d') AS NgayHocGoc,
        thGoc.TenTiet AS TenTietGoc, phGoc.TenPhong AS TenPhongGoc,
        DATEDIFF(CURRENT_DATE(), bh.NgayHoc) AS SoNgayDaQua,
        COALESCE(ycn.ThoiGianGui, bh.NgayHoc) AS ThoiGianSapXep
      FROM BuoiHoc bh
      JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
      JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon
      JOIN Khoa k ON bm.MaKhoa = k.MaKhoa
      JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      JOIN PhongHoc ph ON bh.MaPhong = ph.MaPhong
      JOIN TietHoc th ON bh.MaTiet = th.MaTiet
      LEFT JOIN BuoiHoc bhGoc ON bh.MaBuoiHocGoc = bhGoc.MaBuoiHoc
      LEFT JOIN TietHoc thGoc ON bhGoc.MaTiet = thGoc.MaTiet
      LEFT JOIN PhongHoc phGoc ON bhGoc.MaPhong = phGoc.MaPhong
      LEFT JOIN GiangVien gv ON bh.MaGiangVien = gv.MaGiangVien
      LEFT JOIN GiangVien gvGoc ON bh.MaGiangVienGoc = gvGoc.MaGiangVien
      LEFT JOIN YeuCauNghi ycn ON bh.MaBuoiHoc = ycn.MaBuoiHoc
      LEFT JOIN GiangVien gvDuyet ON ycn.MaGiangVienDuyet = gvDuyet.MaGiangVien
      LEFT JOIN GiangVien gvThay ON (ycn.MaGiangVienDeXuat = gvThay.MaGiangVien OR bh.MaGiangVien = gvThay.MaGiangVien)
      LEFT JOIN DangKyDayBu dkdb ON (bh.MaBuoiHoc = dkdb.MaBuoiHocTao OR (ycn.MaYeuCauNghi IS NOT NULL AND ycn.MaYeuCauNghi = dkdb.MaYeuCauNghi AND bh.LoaiBuoiHoc != 'Makeup'))
      ${whereClause}
      ORDER BY ThoiGianSapXep DESC
    `;

    const [rows] = await db.query(listSql, params);
    const kpis = await this.computeKPIs(baseConditionSql, kpiParams);

    // Chuẩn hóa loại và cờ overdue
    const items = rows.map(r => {
      let loai = 'ABSENCE';
      if (r.LoaiBuoiHoc === 'Makeup' || (r.MaDangKyDayBu && r.MaBuoiHoc === r.MaBuoiHocTao)) {
        loai = 'MAKEUP';
      } else if (r.LoaiYeuCau) {
        loai = r.LoaiYeuCau;
      } else if (r.TrangThaiBuoiHoc === 'Swapped') {
        loai = 'SWAP';
      } else if (r.TrangThaiBuoiHoc === 'Substituted') {
        loai = 'SUBSTITUTE';
      }

      // Xác định trạng thái hiển thị đúng theo loại biến động
      let trangThaiHienThi = 'Pending';
      if (loai === 'MAKEUP') {
        trangThaiHienThi = r.TrangThaiDayBu || (r.TrangThaiBuoiHoc === 'Normal' ? 'Confirmed' : r.TrangThaiBuoiHoc);
      } else if (loai === 'ABSENCE' || loai === 'SWAP' || loai === 'SUBSTITUTE') {
        trangThaiHienThi = r.TrangThaiYeuCau || r.TrangThaiBuoiHoc;
      } else {
        trangThaiHienThi = r.TrangThaiBuoiHoc || 'Pending';
      }

      // Xác định tên người / đơn vị duyệt (hiển thị tên Bộ môn theo quy định)
      let tenNguoiDuyet = r.TenBoMon ? (r.TenBoMon.startsWith('Bộ môn') ? r.TenBoMon : `Bộ môn ${r.TenBoMon}`) : (r.MaBoMon ? `Bộ môn ${r.MaBoMon}` : 'Bộ môn');
      if (loai === 'MAKEUP') {
        tenNguoiDuyet = 'Hệ thống tự động';
      } else if (trangThaiHienThi === 'Pending') {
        tenNguoiDuyet = 'Chờ Bộ môn duyệt';
      }

      const isAbsent = r.TrangThaiBuoiHoc === 'Absent' || r.LoaiYeuCau === 'ABSENCE';
      const overdueWarning = isAbsent && r.DaDayBu === 0 && r.SoNgayDaQua > 14;

      return {
        ...r,
        TenNguoiDuyet: tenNguoiDuyet,
        loaiBienDong: loai,
        trangThaiHienThi,
        overdueWarning
      };
    });

    return {
      kpi: kpis,
      items
    };
  };

  /**
   * [ADMIN / PHONGDAOTAO] Thu hồi / Can thiệp biến động lịch (§3.6.3)
   */
  static revokeBienDong = async (user, id, { lyDoThuHoi }) => {
    // 1. Kiểm tra quyền: Chỉ ADMIN và PHONGDAOTAO
    if (!['ADMIN', 'PHONGDAOTAO'].includes(user.role)) {
      const err = new Error('Từ chối truy cập: Chỉ Quản trị viên (ADMIN) và Phòng Đào Tạo mới có quyền Thu hồi / Can thiệp biến động lịch.');
      err.status = 403;
      throw err;
    }

    if (!lyDoThuHoi || !lyDoThuHoi.trim()) {
      const err = new Error('Lý do thu hồi là bắt buộc.');
      err.status = 400;
      throw err;
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Tìm thông tin biến động theo id (có thể là MaYeuCauNghi hoặc MaDangKyDayBu hoặc MaBuoiHoc)
      let [ycnRows] = await connection.query('SELECT * FROM YeuCauNghi WHERE MaYeuCauNghi = ? FOR UPDATE', [id]);
      let ycn = ycnRows[0] || null;

      let [dkdbRows] = await connection.query('SELECT * FROM DangKyDayBu WHERE MaDangKyDayBu = ? FOR UPDATE', [id]);
      let dkdb = dkdbRows[0] || null;

      let [bhRows] = await connection.query('SELECT * FROM BuoiHoc WHERE MaBuoiHoc = ? FOR UPDATE', [id]);
      let bh = bhRows[0] || null;

      if (!ycn && !dkdb && !bh) {
        const err = new Error(`Không tìm thấy bản ghi biến động lịch với mã '${id}'.`);
        err.status = 404;
        throw err;
      }

      let buoiHocTarget = bh;
      if (!buoiHocTarget && ycn) {
        const [targetRows] = await connection.query('SELECT * FROM BuoiHoc WHERE MaBuoiHoc = ? FOR UPDATE', [ycn.MaBuoiHoc]);
        buoiHocTarget = targetRows[0];
      }
      if (!buoiHocTarget && dkdb) {
        const [targetRows] = await connection.query('SELECT * FROM BuoiHoc WHERE MaBuoiHoc = ? FOR UPDATE', [dkdb.MaBuoiHocTao]);
        buoiHocTarget = targetRows[0];
      }

      const lyDoDayDu = `[PĐT THU HỒI]: ${lyDoThuHoi.trim()}`;

      // Xử lý hoàn nguyên theo loại:
      // Case 1: Dạy bù (DangKyDayBu hoặc BuoiHoc LoaiBuoiHoc='Makeup')
      if (dkdb || (buoiHocTarget && buoiHocTarget.LoaiBuoiHoc === 'Makeup')) {
        const maBuoiHocTao = dkdb?.MaBuoiHocTao || buoiHocTarget?.MaBuoiHoc;
        const maBuoiHocGoc = buoiHocTarget?.MaBuoiHocGoc;

        // Hủy buổi học dạy bù mới sinh
        if (maBuoiHocTao) {
          await connection.query(
            "UPDATE BuoiHoc SET TrangThai = 'Cancelled', GhiChu = ? WHERE MaBuoiHoc = ?",
            [lyDoDayDu, maBuoiHocTao]
          );
        }

        // Hoàn nguyên ca nghỉ gốc về DaDayBu = 0
        if (maBuoiHocGoc) {
          await connection.query(
            "UPDATE BuoiHoc SET DaDayBu = 0, GhiChu = CONCAT(COALESCE(GhiChu, ''), ' [PĐT thu hồi ca bù]') WHERE MaBuoiHoc = ?",
            [maBuoiHocGoc]
          );
        }

        if (dkdb) {
          await connection.query(
            "UPDATE DangKyDayBu SET TrangThai = 'Revoked', LyDoTuChoi = ? WHERE MaDangKyDayBu = ?",
            [lyDoDayDu, dkdb.MaDangKyDayBu]
          );
        }
      }

      // Case 2: Đổi ca (SWAP)
      else if (ycn?.LoaiYeuCau === 'SWAP' || buoiHocTarget?.TrangThai === 'Swapped') {
        if (buoiHocTarget && buoiHocTarget.NgayGocDoiCa) {
          await connection.query(`
            UPDATE BuoiHoc 
            SET NgayHoc = NgayGocDoiCa,
                MaTiet = MaTietGocDoiCa,
                MaPhong = MaPhongGocDoiCa,
                TrangThai = 'Normal',
                GhiChu = ?
            WHERE MaBuoiHoc = ?
          `, [lyDoDayDu, buoiHocTarget.MaBuoiHoc]);
        } else if (buoiHocTarget) {
          await connection.query("UPDATE BuoiHoc SET TrangThai = 'Normal', GhiChu = ? WHERE MaBuoiHoc = ?", [lyDoDayDu, buoiHocTarget.MaBuoiHoc]);
        }

        if (ycn) {
          await connection.query("UPDATE YeuCauNghi SET TrangThai = 'Revoked', LyDoTuChoi = ? WHERE MaYeuCauNghi = ?", [lyDoDayDu, ycn.MaYeuCauNghi]);
        }
      }

      // Case 3: Dạy thay (SUBSTITUTE)
      else if (ycn?.LoaiYeuCau === 'SUBSTITUTE' || buoiHocTarget?.TrangThai === 'Substituted') {
        if (buoiHocTarget) {
          const gvGoc = buoiHocTarget.MaGiangVienGoc || buoiHocTarget.MaGiangVien;
          await connection.query(`
            UPDATE BuoiHoc 
            SET MaGiangVien = ?,
                MaGiangVienGoc = NULL,
                TrangThai = 'Normal',
                GhiChu = ?
            WHERE MaBuoiHoc = ?
          `, [gvGoc, lyDoDayDu, buoiHocTarget.MaBuoiHoc]);
        }

        await connection.query(
          "UPDATE PhanCongDayThay SET TrangThai = 'Revoked' WHERE MaYeuCauNghi = ? OR MaBuoiHoc = ?",
          [ycn?.MaYeuCauNghi || '', buoiHocTarget?.MaBuoiHoc || '']
        );

        if (ycn) {
          await connection.query("UPDATE YeuCauNghi SET TrangThai = 'Revoked', LyDoTuChoi = ? WHERE MaYeuCauNghi = ?", [lyDoDayDu, ycn.MaYeuCauNghi]);
        }
      }

      // Case 4: Báo nghỉ (ABSENCE)
      else if (ycn?.LoaiYeuCau === 'ABSENCE' || buoiHocTarget?.TrangThai === 'Absent') {
        if (buoiHocTarget) {
          await connection.query("UPDATE BuoiHoc SET TrangThai = 'Normal', DaDayBu = 0, GhiChu = ? WHERE MaBuoiHoc = ?", [lyDoDayDu, buoiHocTarget.MaBuoiHoc]);
        }
        if (ycn) {
          await connection.query("UPDATE YeuCauNghi SET TrangThai = 'Revoked', LyDoTuChoi = ? WHERE MaYeuCauNghi = ?", [lyDoDayDu, ycn.MaYeuCauNghi]);
        }
      }

      // Gửi thông báo khẩn cho Trưởng bộ môn và Giảng viên
      if (buoiHocTarget) {
        const [lhpRows] = await connection.query('SELECT MaBoMon, TenLopHocPhan FROM LopHocPhan WHERE MaLopHocPhan = ? LIMIT 1', [buoiHocTarget.MaLopHocPhan]);
        const maBoMon = lhpRows[0]?.MaBoMon;
        const tenLop = lhpRows[0]?.TenLopHocPhan || buoiHocTarget.MaLopHocPhan;

        if (maBoMon) {
          await ThongBaoService.notifyBoMon(maBoMon, {
            tieuDe: `[KHẨN] PĐT thu hồi biến động lịch lớp ${tenLop}`,
            noiDung: `Phòng Đào Tạo đã can thiệp thu hồi biến động lịch ngày ${new Date(buoiHocTarget.NgayHoc).toISOString().slice(0, 10)}. Lý do: ${lyDoThuHoi.trim()}`,
            loaiThongBao: 'Revoked',
            maDoiTuongLienQuan: id
          }, connection);
        }

        if (buoiHocTarget.MaGiangVien) {
          await ThongBaoService.notifyGiangVien(buoiHocTarget.MaGiangVien, {
            tieuDe: `[KHẨN] PĐT thu hồi biến động lịch lớp ${tenLop}`,
            noiDung: `Phòng Đào Tạo đã thu hồi lịch biến động. Lịch học đã được hoàn nguyên về cấu hình gốc. Lý do: ${lyDoThuHoi.trim()}`,
            loaiThongBao: 'Revoked',
            maDoiTuongLienQuan: id
          }, connection);
        }
      }

      await connection.commit();
      return { success: true, message: 'Đã thu hồi biến động lịch và hoàn nguyên thành công.' };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };
}

module.exports = BienDongLichService;
