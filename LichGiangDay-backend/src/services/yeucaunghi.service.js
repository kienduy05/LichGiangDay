const db = require('../../config/db');
const ConflictService = require('./conflict.service');
const ThongBaoService = require('./thongbao.service');
const { getUserScope } = require('./userScope.helper');

class YeuCauNghiService {

  /**
   * Sinh mã yêu cầu nghỉ ngẫu nhiên định dạng YCN_YYYYMMDD_XXXX
   */
  static generateMaYCN = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `YCN_${today}_${rand}`;
  };

  /**
   * Sinh mã phân công dạy thay PCDT_YYYYMMDD_XXXX
   */
  static generateMaPCDT = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `PCDT_${today}_${rand}`;
  };

  /**
   * Lấy lịch giảng dạy của Giảng viên (kèm trạng thái, loại buổi, đơn đang gắn)
   */
  static getLichGiangVien = async (user, { tuNgay, denNgay }) => {
    const scope = await getUserScope(user);
    if (!scope.maGiangVien) {
      const err = new Error('Không tìm thấy thông tin giảng viên tương ứng với tài khoản.');
      err.status = 400;
      throw err;
    }

    let sql = `
      SELECT bh.MaBuoiHoc, bh.MaThoiKhoaBieu, bh.MaLopHocPhan, 
             DATE_FORMAT(bh.NgayHoc, '%Y-%m-%d') AS NgayHoc,
             bh.MaTiet, bh.MaPhong, bh.MaGiangVien, bh.MaGiangVienGoc,
             bh.LoaiBuoiHoc, bh.TrangThai, bh.MaBuoiHocGoc, bh.DaDayBu, bh.GhiChu,
             bh.NgayGocDoiCa, bh.MaTietGocDoiCa, bh.MaPhongGocDoiCa,
             lhp.TenLopHocPhan, lhp.LoaiHoc, lhp.SiSoDangKy, lhp.MaBoMon,
             mh.MaMonHoc, mh.TenMonHoc,
             ph.TenPhong, ph.SucChua,
             th.TenTiet, th.GioBatDau, th.GioKetThuc,
             gv.HoTen AS TenGiangVienHienTai,
             gvGoc.HoTen AS TenGiangVienGoc
      FROM BuoiHoc bh
      JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
      JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      JOIN PhongHoc ph ON bh.MaPhong = ph.MaPhong
      JOIN TietHoc th ON bh.MaTiet = th.MaTiet
      LEFT JOIN GiangVien gv ON bh.MaGiangVien = gv.MaGiangVien
      LEFT JOIN GiangVien gvGoc ON bh.MaGiangVienGoc = gvGoc.MaGiangVien
      WHERE (bh.MaGiangVien = ? OR bh.MaGiangVienGoc = ?)
    `;
    const params = [scope.maGiangVien, scope.maGiangVien];

    if (tuNgay) {
      sql += ' AND bh.NgayHoc >= ?';
      params.push(tuNgay);
    }
    if (denNgay) {
      sql += ' AND bh.NgayHoc <= ?';
      params.push(denNgay);
    }

    sql += ' ORDER BY bh.NgayHoc ASC, th.GioBatDau ASC';

    const [rows] = await db.query(sql, params);

    // Lấy thông tin đơn đang chờ hoặc đơn gần nhất gắn với từng buổi
    if (rows.length > 0) {
      const maBuoiHocList = rows.map(r => r.MaBuoiHoc);
      const [pendingRequests] = await db.query(`
        SELECT ycn.*, gvThay.HoTen AS TenGiangVienDeXuat
        FROM YeuCauNghi ycn
        LEFT JOIN GiangVien gvThay ON ycn.MaGiangVienDeXuat = gvThay.MaGiangVien
        WHERE ycn.MaBuoiHoc IN (?)
        ORDER BY ycn.ThoiGianGui DESC
      `, [maBuoiHocList]);

      rows.forEach(r => {
        const req = pendingRequests.find(p => p.MaBuoiHoc === r.MaBuoiHoc && p.TrangThai === 'Pending');
        r.yeuCauHienTai = req || null;
      });
    }

    return rows;
  };

  /**
   * Tạo yêu cầu nghỉ / đổi ca / nhờ dạy thay
   */
  static createYeuCau = async (user, {
    loaiYeuCau, // 'ABSENCE' | 'SWAP' | 'SUBSTITUTE'
    maBuoiHoc,
    lyDo,
    minhChungUrl = null,
    ngayDeXuat = null,
    maTietDeXuat = null,
    maPhongDeXuat = null,
    maGiangVienDeXuat = null
  }) => {
    if (!['ABSENCE', 'SWAP', 'SUBSTITUTE'].includes(loaiYeuCau)) {
      const err = new Error("Loại yêu cầu không hợp lệ. Chỉ chấp nhận 'ABSENCE', 'SWAP', 'SUBSTITUTE'.");
      err.status = 400;
      throw err;
    }

    if (!lyDo || !lyDo.trim()) {
      const err = new Error('Lý do yêu cầu là bắt buộc.');
      err.status = 400;
      throw err;
    }

    const scope = await getUserScope(user);
    const maGiangVien = scope.maGiangVien;
    if (!maGiangVien) {
      const err = new Error('Không xác định được danh tính giảng viên từ tài khoản.');
      err.status = 403;
      throw err;
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Khóa và lấy thông tin buổi học
      const [bhRows] = await connection.query(`
        SELECT bh.*, lhp.MaBoMon, lhp.TenLopHocPhan
        FROM BuoiHoc bh
        JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
        WHERE bh.MaBuoiHoc = ?
        FOR UPDATE
      `, [maBuoiHoc]);

      if (bhRows.length === 0) {
        const err = new Error(`Buổi học '${maBuoiHoc}' không tồn tại.`);
        err.status = 404;
        throw err;
      }

      const buoiHoc = bhRows[0];

      // 2. Validate quyền sở hữu buổi học
      if (buoiHoc.MaGiangVien !== maGiangVien) {
        const err = new Error('Bạn không có quyền gửi yêu cầu cho buổi học của giảng viên khác.');
        err.status = 403;
        throw err;
      }

      // 3. Validate ngày học >= hôm nay
      const todayStr = new Date().toISOString().slice(0, 10);
      const ngayHocStr = new Date(buoiHoc.NgayHoc).toISOString().slice(0, 10);
      if (ngayHocStr < todayStr) {
        const err = new Error('Không thể gửi yêu cầu cho buổi học trong quá khứ.');
        err.status = 400;
        throw err;
      }

      // 4. Validate trạng thái buổi học phải là Normal
      if (buoiHoc.TrangThai !== 'Normal') {
        const err = new Error(`Buổi học đang ở trạng thái '${buoiHoc.TrangThai}', không thể gửi thêm yêu cầu.`);
        err.status = 400;
        throw err;
      }

      const maYeuCauNghi = this.generateMaYCN();
      let newBuoiHocStatus = 'Normal';

      if (loaiYeuCau === 'ABSENCE') {
        newBuoiHocStatus = 'Absence_Pending';
        await connection.query(`
          INSERT INTO YeuCauNghi 
          (MaYeuCauNghi, MaBuoiHoc, MaGiangVien, LoaiYeuCau, LyDo, MinhChungUrl, ThoiGianGui, TrangThai)
          VALUES (?, ?, ?, 'ABSENCE', ?, ?, NOW(), 'Pending')
        `, [maYeuCauNghi, maBuoiHoc, maGiangVien, lyDo.trim(), minhChungUrl || null]);

      } else if (loaiYeuCau === 'SWAP') {
        if (!ngayDeXuat || !maTietDeXuat || !maPhongDeXuat) {
          const err = new Error('Đổi ca yêu cầu đầy đủ: Ngày đề xuất, Tiết đề xuất và Phòng đề xuất.');
          err.status = 400;
          throw err;
        }

        if (ngayDeXuat < todayStr) {
          const err = new Error('Ngày đổi ca đề xuất phải từ ngày hôm nay trở đi.');
          err.status = 400;
          throw err;
        }

        // Kiểm tra xung đột đa chiều
        const conflictRes = await ConflictService.checkConflict({
          maBuoiHocHienTai: maBuoiHoc,
          maLopHocPhan: buoiHoc.MaLopHocPhan,
          ngayHoc: ngayDeXuat,
          maTiet: maTietDeXuat,
          maPhong: maPhongDeXuat,
          maGiangVien: maGiangVien
        }, connection);

        if (!conflictRes.ok) {
          const firstErr = conflictRes.conflicts[0];
          const err = new Error(`Xung đột khi đổi ca: ${firstErr.message}`);
          err.status = 400;
          err.metadata = { conflicts: conflictRes.conflicts };
          throw err;
        }

        newBuoiHocStatus = 'Swap_Pending';
        await connection.query(`
          INSERT INTO YeuCauNghi 
          (MaYeuCauNghi, MaBuoiHoc, MaGiangVien, LoaiYeuCau, LyDo, MinhChungUrl, NgayDeXuat, MaTietDeXuat, MaPhongDeXuat, ThoiGianGui, TrangThai)
          VALUES (?, ?, ?, 'SWAP', ?, ?, ?, ?, ?, NOW(), 'Pending')
        `, [maYeuCauNghi, maBuoiHoc, maGiangVien, lyDo.trim(), minhChungUrl || null, ngayDeXuat, maTietDeXuat, maPhongDeXuat]);

      } else if (loaiYeuCau === 'SUBSTITUTE') {
        if (!maGiangVienDeXuat) {
          const err = new Error('Vui lòng chọn giảng viên dạy thay.');
          err.status = 400;
          throw err;
        }

        if (maGiangVienDeXuat === maGiangVien) {
          const err = new Error('Không thể tự nhờ chính mình dạy thay.');
          err.status = 400;
          throw err;
        }

        // Kiểm tra giảng viên dạy thay cùng bộ môn và Active
        const [gvThayRows] = await connection.query(
          'SELECT MaGiangVien, HoTen, MaBoMon, TrangThai FROM GiangVien WHERE MaGiangVien = ? LIMIT 1',
          [maGiangVienDeXuat]
        );
        if (gvThayRows.length === 0) {
          const err = new Error(`Giảng viên đề xuất '${maGiangVienDeXuat}' không tồn tại.`);
          err.status = 400;
          throw err;
        }
        const gvThay = gvThayRows[0];
        if (gvThay.MaBoMon !== buoiHoc.MaBoMon) {
          const err = new Error(`Giảng viên dạy thay phải thuộc cùng bộ môn '${buoiHoc.MaBoMon}'.`);
          err.status = 400;
          throw err;
        }
        if (gvThay.TrangThai !== 'Active') {
          const err = new Error(`Giảng viên '${gvThay.HoTen}' hiện không ở trạng thái hoạt động.`);
          err.status = 400;
          throw err;
        }

        // Kiểm tra giảng viên dạy thay có rảnh vào ca đó không
        const conflictRes = await ConflictService.checkConflict({
          maBuoiHocHienTai: maBuoiHoc,
          maLopHocPhan: buoiHoc.MaLopHocPhan,
          ngayHoc: ngayHocStr,
          maTiet: buoiHoc.MaTiet,
          maPhong: buoiHoc.MaPhong,
          maGiangVien: maGiangVienDeXuat
        }, connection);

        const gvClash = conflictRes.conflicts.find(c => c.type === 'LECTURER');
        if (gvClash) {
          const err = new Error(`Giảng viên '${gvThay.HoTen}' đã có lịch trùng vào ca này.`);
          err.status = 400;
          throw err;
        }

        newBuoiHocStatus = 'Substitute_Pending';
        await connection.query(`
          INSERT INTO YeuCauNghi 
          (MaYeuCauNghi, MaBuoiHoc, MaGiangVien, LoaiYeuCau, LyDo, MinhChungUrl, MaGiangVienDeXuat, ThoiGianGui, TrangThai)
          VALUES (?, ?, ?, 'SUBSTITUTE', ?, ?, ?, NOW(), 'Pending')
        `, [maYeuCauNghi, maBuoiHoc, maGiangVien, lyDo.trim(), minhChungUrl || null, maGiangVienDeXuat]);

        // Tạo bản ghi phân công dạy thay (Assigned)
        const maPCDT = this.generateMaPCDT();
        await connection.query(`
          INSERT INTO PhanCongDayThay (MaPhanCongDayThay, MaYeuCauNghi, MaBuoiHoc, MaGiangVienDayThay, ThoiGianPhanCong, TrangThai)
          VALUES (?, ?, ?, ?, NOW(), 'Assigned')
        `, [maPCDT, maYeuCauNghi, maBuoiHoc, maGiangVienDeXuat]);
      }

      // Cập nhật trạng thái buổi học
      await connection.query('UPDATE BuoiHoc SET TrangThai = ? WHERE MaBuoiHoc = ?', [newBuoiHocStatus, maBuoiHoc]);

      // Gửi thông báo cho Trưởng bộ môn
      const loaiTen = loaiYeuCau === 'ABSENCE' ? 'Báo nghỉ' : loaiYeuCau === 'SWAP' ? 'Đổi ca' : 'Nhờ dạy thay';
      await ThongBaoService.notifyBoMon(buoiHoc.MaBoMon, {
        tieuDe: `Yêu cầu mới: ${loaiTen} từ ${scope.hoTen || maGiangVien}`,
        noiDung: `Giảng viên ${scope.hoTen || maGiangVien} gửi yêu cầu ${loaiTen} cho lớp ${buoiHoc.TenLopHocPhan} ngày ${ngayHocStr}.`,
        loaiThongBao: 'NewRequest',
        maDoiTuongLienQuan: maYeuCauNghi
      }, connection);

      await connection.commit();
      return { maYeuCauNghi, maBuoiHoc, loaiYeuCau, trangThai: 'Pending' };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };

  /**
   * Lấy danh sách yêu cầu của chính tôi (Giảng viên)
   */
  static getCuaToi = async (user, { loaiYeuCau, trangThai }) => {
    const scope = await getUserScope(user);
    if (!scope.maGiangVien) {
      const err = new Error('Không xác định được danh tính giảng viên.');
      err.status = 403;
      throw err;
    }

    let sql = `
      SELECT ycn.*, 
             DATE_FORMAT(ycn.ThoiGianGui, '%Y-%m-%d %H:%i:%s') AS ThoiGianGuiStr,
             DATE_FORMAT(ycn.ThoiGianDuyet, '%Y-%m-%d %H:%i:%s') AS ThoiGianDuyetStr,
             bh.NgayHoc, bh.MaTiet, bh.MaPhong, bh.MaLopHocPhan,
             lhp.TenLopHocPhan, mh.TenMonHoc,
             ph.TenPhong, th.TenTiet,
             phDeXuat.TenPhong AS TenPhongDeXuat,
             thDeXuat.TenTiet AS TenTietDeXuat,
             gvThay.HoTen AS TenGiangVienDeXuat
      FROM YeuCauNghi ycn
      JOIN BuoiHoc bh ON ycn.MaBuoiHoc = bh.MaBuoiHoc
      JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
      JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      JOIN PhongHoc ph ON bh.MaPhong = ph.MaPhong
      JOIN TietHoc th ON bh.MaTiet = th.MaTiet
      LEFT JOIN PhongHoc phDeXuat ON ycn.MaPhongDeXuat = phDeXuat.MaPhong
      LEFT JOIN TietHoc thDeXuat ON ycn.MaTietDeXuat = thDeXuat.MaTiet
      LEFT JOIN GiangVien gvThay ON ycn.MaGiangVienDeXuat = gvThay.MaGiangVien
      WHERE ycn.MaGiangVien = ?
    `;
    const params = [scope.maGiangVien];

    if (loaiYeuCau && loaiYeuCau !== 'ALL') {
      sql += ' AND ycn.LoaiYeuCau = ?';
      params.push(loaiYeuCau);
    }
    if (trangThai && trangThai !== 'ALL') {
      sql += ' AND ycn.TrangThai = ?';
      params.push(trangThai);
    }

    sql += ' ORDER BY ycn.ThoiGianGui DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  };

  /**
   * Giảng viên tự hủy yêu cầu đang Pending
   */
  static huyYeuCau = async (user, maYeuCauNghi) => {
    const scope = await getUserScope(user);
    const maGiangVien = scope.maGiangVien;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [ycnRows] = await connection.query(
        'SELECT * FROM YeuCauNghi WHERE MaYeuCauNghi = ? FOR UPDATE',
        [maYeuCauNghi]
      );
      if (ycnRows.length === 0) {
        const err = new Error(`Yêu cầu '${maYeuCauNghi}' không tồn tại.`);
        err.status = 404;
        throw err;
      }
      const ycn = ycnRows[0];

      if (ycn.MaGiangVien !== maGiangVien) {
        const err = new Error('Bạn không có quyền hủy đơn của người khác.');
        err.status = 403;
        throw err;
      }

      if (ycn.TrangThai !== 'Pending') {
        const err = new Error(`Không thể hủy đơn đang ở trạng thái '${ycn.TrangThai}'. Chỉ có thể hủy khi đơn đang chờ duyệt.`);
        err.status = 400;
        throw err;
      }

      // Cập nhật YeuCauNghi thành Cancelled
      await connection.query("UPDATE YeuCauNghi SET TrangThai = 'Cancelled' WHERE MaYeuCauNghi = ?", [maYeuCauNghi]);

      // Hoàn nguyên BuoiHoc về Normal
      await connection.query("UPDATE BuoiHoc SET TrangThai = 'Normal' WHERE MaBuoiHoc = ?", [ycn.MaBuoiHoc]);

      // Nếu có PhanCongDayThay thì hủy
      await connection.query("UPDATE PhanCongDayThay SET TrangThai = 'Cancelled' WHERE MaYeuCauNghi = ?", [maYeuCauNghi]);

      await connection.commit();
      return { success: true, message: 'Đã hủy yêu cầu thành công.' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };

  /**
   * Lấy danh sách đồng nghiệp cùng bộ môn, Active, không trùng lịch vào ca của buổi học
   */
  static getDongNghiepTrong = async (user, maBuoiHoc) => {
    const scope = await getUserScope(user);

    // Lấy thông tin buổi học
    const [bhRows] = await db.query(`
      SELECT bh.MaBuoiHoc, bh.NgayHoc, bh.MaTiet, bh.MaPhong, bh.MaGiangVien, lhp.MaBoMon
      FROM BuoiHoc bh
      JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
      WHERE bh.MaBuoiHoc = ? LIMIT 1
    `, [maBuoiHoc]);

    if (bhRows.length === 0) {
      const err = new Error(`Không tìm thấy buổi học '${maBuoiHoc}'.`);
      err.status = 404;
      throw err;
    }

    const bh = bhRows[0];
    const ngayHocStr = new Date(bh.NgayHoc).toISOString().slice(0, 10);

    // Lấy danh sách giảng viên cùng bộ môn, Active, khác người gửi
    const [colleagues] = await db.query(`
      SELECT gv.MaGiangVien, gv.HoTen, gv.Email, gv.SoDienThoai, gv.MaBoMon
      FROM GiangVien gv
      WHERE gv.MaBoMon = ? AND gv.TrangThai = 'Active' AND gv.MaGiangVien != ?
      ORDER BY gv.HoTen ASC
    `, [bh.MaBoMon, bh.MaGiangVien]);

    // Lọc những người không trùng lịch tại (bh.NgayHoc, bh.MaTiet)
    const available = [];
    for (const c of colleagues) {
      const conflictRes = await ConflictService.checkConflict({
        maBuoiHocHienTai: bh.MaBuoiHoc,
        ngayHoc: ngayHocStr,
        maTiet: bh.MaTiet,
        maGiangVien: c.MaGiangVien
      });

      const hasLecturerClash = conflictRes.conflicts.some(item => item.type === 'LECTURER');
      if (!hasLecturerClash) {
        available.push(c);
      }
    }

    return available;
  };

  /**
   * [TRƯỞNG BỘ MÔN] Lấy danh sách yêu cầu của bộ môn
   */
  static getDanhSachBoMon = async (user, { maHocKy, loaiYeuCau, trangThai, search }) => {
    const scope = await getUserScope(user);
    if (user.role === 'BOMON' && !scope.maBoMon) {
      const err = new Error('Tài khoản Trưởng bộ môn không được gán mã bộ môn hợp lệ.');
      err.status = 403;
      throw err;
    }

    let sql = `
      SELECT ycn.MaYeuCauNghi, ycn.MaBuoiHoc, ycn.MaGiangVien, ycn.LoaiYeuCau, ycn.LyDo, ycn.MinhChungUrl,
             ycn.NgayDeXuat, ycn.MaTietDeXuat, ycn.MaPhongDeXuat, ycn.MaGiangVienDeXuat,
             DATE_FORMAT(ycn.ThoiGianGui, '%Y-%m-%d %H:%i:%s') AS ThoiGianGui,
             ycn.TrangThai, ycn.MaGiangVienDuyet,
             DATE_FORMAT(ycn.ThoiGianDuyet, '%Y-%m-%d %H:%i:%s') AS ThoiGianDuyet,
             ycn.LyDoTuChoi,
             DATE_FORMAT(bh.NgayHoc, '%Y-%m-%d') AS NgayHoc,
             bh.MaTiet, bh.MaPhong, bh.MaLopHocPhan,
             lhp.TenLopHocPhan, lhp.MaBoMon, bm.TenBoMon,
             mh.MaMonHoc, mh.TenMonHoc,
             ph.TenPhong, th.TenTiet,
             gv.HoTen AS TenGiangVienGui,
             gvThay.HoTen AS TenGiangVienDeXuat,
             phDeXuat.TenPhong AS TenPhongDeXuat,
             thDeXuat.TenTiet AS TenTietDeXuat
      FROM YeuCauNghi ycn
      JOIN BuoiHoc bh ON ycn.MaBuoiHoc = bh.MaBuoiHoc
      JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
      JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon
      JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      JOIN PhongHoc ph ON bh.MaPhong = ph.MaPhong
      JOIN TietHoc th ON bh.MaTiet = th.MaTiet
      LEFT JOIN GiangVien gv ON ycn.MaGiangVien = gv.MaGiangVien
      LEFT JOIN GiangVien gvThay ON ycn.MaGiangVienDeXuat = gvThay.MaGiangVien
      LEFT JOIN PhongHoc phDeXuat ON ycn.MaPhongDeXuat = phDeXuat.MaPhong
      LEFT JOIN TietHoc thDeXuat ON ycn.MaTietDeXuat = thDeXuat.MaTiet
      WHERE 1=1
    `;
    const params = [];

    // BẮT BUỘC KHÓA BỘ MÔN nếu là vai trò BOMON
    if (user.role === 'BOMON') {
      sql += ' AND lhp.MaBoMon = ?';
      params.push(scope.maBoMon);
    }

    if (maHocKy) {
      sql += ' AND lhp.MaHocKy = ?';
      params.push(maHocKy);
    }

    if (loaiYeuCau && loaiYeuCau !== 'ALL') {
      sql += ' AND ycn.LoaiYeuCau = ?';
      params.push(loaiYeuCau);
    }

    if (trangThai && trangThai !== 'ALL') {
      sql += ' AND ycn.TrangThai = ?';
      params.push(trangThai);
    }

    if (search && search.trim()) {
      sql += ' AND (gv.HoTen LIKE ? OR lhp.TenLopHocPhan LIKE ? OR mh.TenMonHoc LIKE ? OR lhp.MaLopHocPhan LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s);
    }

    // Ưu tiên Pending lên đầu, sau đó sắp xếp theo ThoiGianGui DESC
    sql += `
      ORDER BY 
        CASE WHEN ycn.TrangThai = 'Pending' THEN 0 ELSE 1 END,
        ycn.ThoiGianGui DESC
    `;

    const [rows] = await db.query(sql, params);
    return rows;
  };

  /**
   * [TRƯỞNG BỘ MÔN] Kiểm tra xung đột trước khi duyệt đơn
   */
  static checkConflictForYeuCau = async (user, maYeuCauNghi) => {
    const scope = await getUserScope(user);

    const [rows] = await db.query(`
      SELECT ycn.*, bh.NgayHoc, bh.MaTiet, bh.MaPhong, bh.MaLopHocPhan, lhp.MaBoMon
      FROM YeuCauNghi ycn
      JOIN BuoiHoc bh ON ycn.MaBuoiHoc = bh.MaBuoiHoc
      JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
      WHERE ycn.MaYeuCauNghi = ? LIMIT 1
    `, [maYeuCauNghi]);

    if (rows.length === 0) {
      const err = new Error(`Không tìm thấy yêu cầu '${maYeuCauNghi}'.`);
      err.status = 404;
      throw err;
    }

    const ycn = rows[0];

    // Check quyền bộ môn
    if (user.role === 'BOMON' && ycn.MaBoMon !== scope.maBoMon) {
      const err = new Error('Từ chối truy cập: Đơn này không thuộc bộ môn của bạn.');
      err.status = 403;
      throw err;
    }

    if (ycn.LoaiYeuCau === 'ABSENCE') {
      return {
        conflict: false,
        message: 'Báo nghỉ giải phóng phòng tạm thời, không có xung đột.',
        details: []
      };
    }

    if (ycn.LoaiYeuCau === 'SWAP') {
      const res = await ConflictService.checkConflict({
        maBuoiHocHienTai: ycn.MaBuoiHoc,
        maLopHocPhan: ycn.MaLopHocPhan,
        ngayHoc: new Date(ycn.NgayDeXuat).toISOString().slice(0, 10),
        maTiet: ycn.MaTietDeXuat,
        maPhong: ycn.MaPhongDeXuat,
        maGiangVien: ycn.MaGiangVien
      });
      return {
        conflict: !res.ok,
        details: res.conflicts
      };
    }

    if (ycn.LoaiYeuCau === 'SUBSTITUTE') {
      const ngayHocStr = new Date(ycn.NgayHoc).toISOString().slice(0, 10);
      const res = await ConflictService.checkConflict({
        maBuoiHocHienTai: ycn.MaBuoiHoc,
        maLopHocPhan: ycn.MaLopHocPhan,
        ngayHoc: ngayHocStr,
        maTiet: ycn.MaTiet,
        maPhong: ycn.MaPhong,
        maGiangVien: ycn.MaGiangVienDeXuat
      });
      const gvClashes = res.conflicts.filter(c => c.type === 'LECTURER');
      return {
        conflict: gvClashes.length > 0,
        details: gvClashes
      };
    }

    return { conflict: false, details: [] };
  };

  /**
   * [TRƯỞNG BỘ MÔN] Duyệt hoặc từ chối yêu cầu
   */
  static duyetYeuCau = async (user, maYeuCauNghi, { trangThai, lyDoTuChoi }) => {
    if (!['Approved', 'Rejected'].includes(trangThai)) {
      const err = new Error("Trạng thái duyệt chỉ có thể là 'Approved' hoặc 'Rejected'.");
      err.status = 400;
      throw err;
    }

    if (trangThai === 'Rejected' && (!lyDoTuChoi || !lyDoTuChoi.trim())) {
      const err = new Error('Bắt buộc phải nhập lý do khi từ chối yêu cầu.');
      err.status = 400;
      throw err;
    }

    const scope = await getUserScope(user);

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [ycnRows] = await connection.query(`
        SELECT ycn.*, bh.NgayHoc, bh.MaTiet, bh.MaPhong, bh.MaGiangVien AS MaGiangVienHienTai,
               lhp.MaBoMon, lhp.TenLopHocPhan
        FROM YeuCauNghi ycn
        JOIN BuoiHoc bh ON ycn.MaBuoiHoc = bh.MaBuoiHoc
        JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
        WHERE ycn.MaYeuCauNghi = ?
        FOR UPDATE
      `, [maYeuCauNghi]);

      if (ycnRows.length === 0) {
        const err = new Error(`Yêu cầu '${maYeuCauNghi}' không tồn tại.`);
        err.status = 404;
        throw err;
      }

      const ycn = ycnRows[0];

      // Enforce bộ môn
      if (user.role === 'BOMON' && ycn.MaBoMon !== scope.maBoMon) {
        const err = new Error(`Từ chối truy cập: Bạn không có quyền duyệt yêu cầu của bộ môn '${ycn.MaBoMon}'.`);
        err.status = 403;
        throw err;
      }

      if (ycn.TrangThai !== 'Pending') {
        const err = new Error(`Yêu cầu đang ở trạng thái '${ycn.TrangThai}', không thể duyệt lại.`);
        err.status = 400;
        throw err;
      }

      const maGvDuyet = scope.maGiangVien || 'NTH001';

      if (trangThai === 'Approved') {
        // Áp dụng thay đổi theo loại yêu cầu
        if (ycn.LoaiYeuCau === 'ABSENCE') {
          // Absent: giải phóng phòng tạm thời, DaDayBu = 0
          await connection.query(`
            UPDATE BuoiHoc 
            SET TrangThai = 'Absent', DaDayBu = 0, GhiChu = 'Đã duyệt nghỉ, chờ đăng ký dạy bù'
            WHERE MaBuoiHoc = ?
          `, [ycn.MaBuoiHoc]);

        } else if (ycn.LoaiYeuCau === 'SWAP') {
          // Lưu thông tin gốc để hoàn nguyên
          await connection.query(`
            UPDATE BuoiHoc 
            SET NgayGocDoiCa = NgayHoc,
                MaTietGocDoiCa = MaTiet,
                MaPhongGocDoiCa = MaPhong,
                NgayHoc = ?,
                MaTiet = ?,
                MaPhong = ?,
                TrangThai = 'Swapped',
                GhiChu = CONCAT('Đã đổi ca từ ngày ', DATE_FORMAT(NgayHoc, '%d/%m/%Y'))
            WHERE MaBuoiHoc = ?
          `, [ycn.NgayDeXuat, ycn.MaTietDeXuat, ycn.MaPhongDeXuat, ycn.MaBuoiHoc]);

        } else if (ycn.LoaiYeuCau === 'SUBSTITUTE') {
          // Dạy thay: MaGiangVienGoc = MaGiangVien, MaGiangVien = MaGiangVienDeXuat
          await connection.query(`
            UPDATE BuoiHoc 
            SET MaGiangVienGoc = MaGiangVien,
                MaGiangVien = ?,
                TrangThai = 'Substituted',
                GhiChu = CONCAT('Dạy thay bởi ', ?)
            WHERE MaBuoiHoc = ?
          `, [ycn.MaGiangVienDeXuat, ycn.MaGiangVienDeXuat, ycn.MaBuoiHoc]);

          await connection.query(`
            UPDATE PhanCongDayThay 
            SET TrangThai = 'Confirmed'
            WHERE MaYeuCauNghi = ?
          `, [maYeuCauNghi]);
        }

        // Cập nhật trạng thái YeuCauNghi
        await connection.query(`
          UPDATE YeuCauNghi 
          SET TrangThai = 'Approved', MaGiangVienDuyet = ?, ThoiGianDuyet = NOW(), LyDoTuChoi = NULL
          WHERE MaYeuCauNghi = ?
        `, [maGvDuyet, maYeuCauNghi]);

        // Gửi thông báo cho Giảng viên gửi đơn
        await ThongBaoService.notifyGiangVien(ycn.MaGiangVien, {
          tieuDe: `Yêu cầu ${ycn.LoaiYeuCau} đã được duyệt`,
          noiDung: `Trưởng bộ môn đã CHẤP THUẬN yêu cầu cho lớp '${ycn.TenLopHocPhan}'.`,
          loaiThongBao: 'Approved',
          maDoiTuongLienQuan: maYeuCauNghi
        }, connection);

        // Nếu là dạy thay, gửi thông báo cho giảng viên dạy thay
        if (ycn.LoaiYeuCau === 'SUBSTITUTE') {
          await ThongBaoService.notifyGiangVien(ycn.MaGiangVienDeXuat, {
            tieuDe: 'Phân công dạy thay đã được duyệt',
            noiDung: `Bạn đã được chấp thuận dạy thay cho lớp '${ycn.TenLopHocPhan}' vào ngày ${new Date(ycn.NgayHoc).toISOString().slice(0, 10)}.`,
            loaiThongBao: 'Substituted',
            maDoiTuongLienQuan: maYeuCauNghi
          }, connection);
        }

      } else { // Rejected
        // Hoàn nguyên BuoiHoc về Normal
        await connection.query("UPDATE BuoiHoc SET TrangThai = 'Normal' WHERE MaBuoiHoc = ?", [ycn.MaBuoiHoc]);

        if (ycn.LoaiYeuCau === 'SUBSTITUTE') {
          await connection.query("UPDATE PhanCongDayThay SET TrangThai = 'Cancelled' WHERE MaYeuCauNghi = ?", [maYeuCauNghi]);
        }

        await connection.query(`
          UPDATE YeuCauNghi 
          SET TrangThai = 'Rejected', LyDoTuChoi = ?, MaGiangVienDuyet = ?, ThoiGianDuyet = NOW()
          WHERE MaYeuCauNghi = ?
        `, [lyDoTuChoi.trim(), maGvDuyet, maYeuCauNghi]);

        // Gửi thông báo từ chối
        await ThongBaoService.notifyGiangVien(ycn.MaGiangVien, {
          tieuDe: `Yêu cầu ${ycn.LoaiYeuCau} bị từ chối`,
          noiDung: `Trưởng bộ môn đã TỪ CHỐI yêu cầu cho lớp '${ycn.TenLopHocPhan}'. Lý do: ${lyDoTuChoi.trim()}`,
          loaiThongBao: 'Rejected',
          maDoiTuongLienQuan: maYeuCauNghi
        }, connection);
      }

      await connection.commit();
      return { success: true, maYeuCauNghi, trangThai };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };

  /**
   * [TRƯỞNG BỘ MÔN] Phân công dạy thay trực tiếp cho ca đã duyệt nghỉ (Nhom4 US-09)
   */
  static phanCongDayThay = async (user, { maBuoiHoc, maGiangVienDayThay, lyDo }) => {
    if (!maGiangVienDayThay) {
      const err = new Error('Vui lòng chọn giảng viên dạy thay.');
      err.status = 400;
      throw err;
    }

    const scope = await getUserScope(user);

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [bhRows] = await connection.query(`
        SELECT bh.*, lhp.MaBoMon, lhp.TenLopHocPhan
        FROM BuoiHoc bh
        JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
        WHERE bh.MaBuoiHoc = ?
        FOR UPDATE
      `, [maBuoiHoc]);

      if (bhRows.length === 0) {
        const err = new Error(`Buổi học '${maBuoiHoc}' không tồn tại.`);
        err.status = 404;
        throw err;
      }
      const bh = bhRows[0];

      if (user.role === 'BOMON' && bh.MaBoMon !== scope.maBoMon) {
        const err = new Error(`Buổi học không thuộc bộ môn '${scope.maBoMon}'.`);
        err.status = 403;
        throw err;
      }

      if (bh.TrangThai !== 'Absent') {
        const err = new Error(`Chỉ có thể phân công dạy thay cho ca đã báo nghỉ (Absent). Hiện tại là '${bh.TrangThai}'.`);
        err.status = 400;
        throw err;
      }

      // Kiểm tra giảng viên dạy thay cùng bộ môn và Active
      const [gvRows] = await connection.query(
        'SELECT MaGiangVien, HoTen, MaBoMon, TrangThai FROM GiangVien WHERE MaGiangVien = ? LIMIT 1',
        [maGiangVienDayThay]
      );
      if (gvRows.length === 0) {
        const err = new Error('Giảng viên dạy thay không tồn tại.');
        err.status = 400;
        throw err;
      }
      const gvThay = gvRows[0];
      if (gvThay.MaBoMon !== bh.MaBoMon) {
        const err = new Error('Giảng viên dạy thay phải thuộc cùng bộ môn.');
        err.status = 400;
        throw err;
      }
      if (gvThay.TrangThai !== 'Active') {
        const err = new Error(`Giảng viên '${gvThay.HoTen}' hiện không ở trạng thái Active.`);
        err.status = 400;
        throw err;
      }

      // Kiểm tra trùng lịch
      const conflictRes = await ConflictService.checkConflict({
        maBuoiHocHienTai: bh.MaBuoiHoc,
        maLopHocPhan: bh.MaLopHocPhan,
        ngayHoc: new Date(bh.NgayHoc).toISOString().slice(0, 10),
        maTiet: bh.MaTiet,
        maPhong: bh.MaPhong,
        maGiangVien: maGiangVienDayThay
      }, connection);

      const gvClash = conflictRes.conflicts.find(c => c.type === 'LECTURER');
      if (gvClash) {
        const err = new Error(`Giảng viên '${gvThay.HoTen}' đã có lịch trùng vào ca này.`);
        err.status = 400;
        throw err;
      }

      // Tạo bản ghi PhanCongDayThay
      const maPCDT = this.generateMaPCDT();
      await connection.query(`
        INSERT INTO PhanCongDayThay 
        (MaPhanCongDayThay, MaYeuCauNghi, MaBuoiHoc, MaGiangVienDayThay, ThoiGianPhanCong, TrangThai)
        VALUES (?, NULL, ?, ?, NOW(), 'Confirmed')
      `, [maPCDT, maBuoiHoc, maGiangVienDayThay]);

      // Cập nhật BuoiHoc
      await connection.query(`
        UPDATE BuoiHoc 
        SET MaGiangVienGoc = MaGiangVien,
            MaGiangVien = ?,
            TrangThai = 'Substituted',
            GhiChu = CONCAT('Trưởng bộ môn phân công ', ?, ' dạy thay')
        WHERE MaBuoiHoc = ?
      `, [maGiangVienDayThay, gvThay.HoTen, maBuoiHoc]);

      // Thông báo cho giảng viên gốc và giảng viên dạy thay
      await ThongBaoService.notifyGiangVien(bh.MaGiangVien, {
        tieuDe: 'Trưởng bộ môn đã phân công dạy thay',
        noiDung: `Ca nghỉ ngày ${new Date(bh.NgayHoc).toISOString().slice(0, 10)} của bạn đã được phân công cho thầy/cô ${gvThay.HoTen} dạy thay.`,
        loaiThongBao: 'Substituted',
        maDoiTuongLienQuan: maPCDT
      }, connection);

      await ThongBaoService.notifyGiangVien(maGiangVienDayThay, {
        tieuDe: 'Bạn được phân công dạy thay',
        noiDung: `Trưởng bộ môn đã phân công bạn dạy thay lớp '${bh.TenLopHocPhan}' vào ngày ${new Date(bh.NgayHoc).toISOString().slice(0, 10)}.`,
        loaiThongBao: 'Substituted',
        maDoiTuongLienQuan: maPCDT
      }, connection);

      await connection.commit();
      return { success: true, maPCDT, maBuoiHoc, maGiangVienDayThay };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };

  /**
   * [DASHBOARD HÔM NAY] Thống kê hôm nay theo bộ môn (US-13)
   */
  static getDashboardHomNay = async (user) => {
    const scope = await getUserScope(user);
    const todayStr = new Date().toISOString().slice(0, 10);

    let sql = `
      SELECT bh.MaBuoiHoc, bh.NgayHoc, bh.MaTiet, bh.MaPhong, bh.MaGiangVien, bh.MaGiangVienGoc,
             bh.LoaiBuoiHoc, bh.TrangThai, bh.GhiChu,
             lhp.MaLopHocPhan, lhp.TenLopHocPhan, lhp.MaBoMon, bm.TenBoMon,
             mh.TenMonHoc, ph.TenPhong, th.TenTiet, th.GioBatDau, th.GioKetThuc,
             gv.HoTen AS TenGiangVien, gvGoc.HoTen AS TenGiangVienGoc
      FROM BuoiHoc bh
      JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
      JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon
      JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      JOIN PhongHoc ph ON bh.MaPhong = ph.MaPhong
      JOIN TietHoc th ON bh.MaTiet = th.MaTiet
      LEFT JOIN GiangVien gv ON bh.MaGiangVien = gv.MaGiangVien
      LEFT JOIN GiangVien gvGoc ON bh.MaGiangVienGoc = gvGoc.MaGiangVien
      WHERE bh.NgayHoc = ?
    `;
    const params = [todayStr];

    if (user.role === 'BOMON') {
      sql += ' AND lhp.MaBoMon = ?';
      params.push(scope.maBoMon);
    }

    sql += ' ORDER BY th.GioBatDau ASC';

    const [rows] = await db.query(sql, params);

    const tongSoBuoi = rows.length;
    const soBuoiNghi = rows.filter(r => r.TrangThai === 'Absent' || r.TrangThai === 'Absence_Pending').length;
    const soBuoiDayThay = rows.filter(r => r.TrangThai === 'Substituted' || r.TrangThai === 'Substitute_Pending').length;
    const soBuoiDayBu = rows.filter(r => r.LoaiBuoiHoc === 'Makeup').length;
    const soBuoiBinhThuong = rows.filter(r => r.TrangThai === 'Normal' && r.LoaiBuoiHoc === 'Regular').length;

    return {
      ngayHoc: todayStr,
      thongKe: {
        tongSoBuoi,
        soBuoiNghi,
        soBuoiDayThay,
        soBuoiDayBu,
        soBuoiBinhThuong
      },
      danhSachBuoiHoc: rows
    };
  };
}

module.exports = YeuCauNghiService;
