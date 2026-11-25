const db = require('../../config/db');
const ConflictService = require('./conflict.service');
const ThongBaoService = require('./thongbao.service');
const { getUserScope } = require('./userScope.helper');

class DangKyDayBuService {

  static generateMaDKDB = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `DKDB_${today}_${rand}`;
  };

  static generateMaBH = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `BH_${today}_${rand}`;
  };

  /**
   * Lấy danh sách ca đã báo nghỉ nhưng chưa dạy bù (DaDayBu = 0, TrangThai = 'Absent')
   */
  static getCaChuaBu = async (user) => {
    const scope = await getUserScope(user);
    if (!scope.maGiangVien) {
      const err = new Error('Không xác định được danh tính giảng viên.');
      err.status = 403;
      throw err;
    }

    const [rows] = await db.query(`
      SELECT bh.MaBuoiHoc, DATE_FORMAT(bh.NgayHoc, '%Y-%m-%d') AS NgayHoc,
             bh.MaTiet, bh.MaPhong, bh.MaLopHocPhan, bh.LoaiBuoiHoc, bh.TrangThai, bh.DaDayBu,
             lhp.TenLopHocPhan, lhp.SiSoDangKy, lhp.MaBoMon,
             mh.TenMonHoc, ph.TenPhong, th.TenTiet, th.GioBatDau, th.GioKetThuc,
             DATEDIFF(CURRENT_DATE(), bh.NgayHoc) AS SoNgayDaQua,
             ycn.MaYeuCauNghi, ycn.LyDo AS LyDoNghi
      FROM BuoiHoc bh
      JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
      JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      JOIN PhongHoc ph ON bh.MaPhong = ph.MaPhong
      JOIN TietHoc th ON bh.MaTiet = th.MaTiet
      LEFT JOIN YeuCauNghi ycn ON bh.MaBuoiHoc = ycn.MaBuoiHoc AND ycn.TrangThai = 'Approved'
      WHERE bh.MaGiangVien = ?
        AND bh.TrangThai = 'Absent'
        AND bh.DaDayBu = 0
      ORDER BY bh.NgayHoc ASC
    `, [scope.maGiangVien]);

    // Gắn cờ cảnh báo quá hạn 14 ngày
    return rows.map(r => ({
      ...r,
      overdueWarning: r.SoNgayDaQua > 14
    }));
  };

  /**
   * Lấy danh sách phòng trống trong 7 ngày
   */
  static getPhongTrong = async (user, { maBuoiHoc, tuNgay, maTiet }) => {
    // 1. Lấy thông tin lớp học phần từ maBuoiHoc
    let maLopHocPhan = null;
    if (maBuoiHoc) {
      const [bhRows] = await db.query('SELECT MaLopHocPhan FROM BuoiHoc WHERE MaBuoiHoc = ? LIMIT 1', [maBuoiHoc]);
      if (bhRows.length > 0) {
        maLopHocPhan = bhRows[0].MaLopHocPhan;
      }
    }

    // 2. Mặc định tuNgay là 3 ngày sau hôm nay (theo quy định)
    let searchStartDate = tuNgay;
    if (!searchStartDate) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 3);
      searchStartDate = minDate.toISOString().slice(0, 10);
    }

    const availableSlots = await ConflictService.findAvailableRooms({
      maLopHocPhan,
      tuNgay: searchStartDate,
      soNgay: 7,
      maTiet: maTiet ? parseInt(maTiet, 10) : null
    });

    return availableSlots;
  };

  /**
   * Đăng ký dạy bù (Tự động xác nhận Confirmed, sinh BuoiHoc mới, ca nghỉ gốc DaDayBu=1)
   */
  static createDangKyDayBu = async (user, {
    maBuoiHoc,
    ngayDeXuat,
    maTiet,
    maPhong
  }) => {
    if (!maBuoiHoc || !ngayDeXuat || !maTiet || !maPhong) {
      const err = new Error('Vui lòng cung cấp đầy đủ: Buổi học gốc, Ngày đề xuất, Tiết học và Phòng học.');
      err.status = 400;
      throw err;
    }

    const scope = await getUserScope(user);
    const maGiangVien = scope.maGiangVien;
    if (!maGiangVien) {
      const err = new Error('Không xác định được danh tính giảng viên.');
      err.status = 403;
      throw err;
    }

    // Kiểm tra quy định: ngày dạy bù phải cách hôm nay >= 3 ngày
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const proposedDate = new Date(ngayDeXuat);
    proposedDate.setHours(0, 0, 0, 0);
    const diffTime = proposedDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && diffDays < 3) {
      const err = new Error('Quy định: Thời gian đăng ký dạy bù phải trước ít nhất 3 ngày tính từ ngày hiện tại để kịp thông báo cho sinh viên.');
      err.status = 400;
      throw err;
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Khóa và lấy thông tin ca nghỉ gốc
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

      const buoiHocGoc = bhRows[0];

      if (buoiHocGoc.MaGiangVien !== maGiangVien) {
        const err = new Error('Bạn không có quyền đăng ký dạy bù cho buổi học của người khác.');
        err.status = 403;
        throw err;
      }

      if (buoiHocGoc.TrangThai !== 'Absent') {
        const err = new Error(`Buổi học chưa ở trạng thái nghỉ dạy (Absent). Trạng thái hiện tại: '${buoiHocGoc.TrangThai}'.`);
        err.status = 400;
        throw err;
      }

      if (buoiHocGoc.DaDayBu === 1) {
        const err = new Error('Buổi học này đã được tổ chức dạy bù trước đó.');
        err.status = 400;
        throw err;
      }

      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const [dxYear, dxMonth, dxDate] = String(ngayDeXuat).slice(0, 10).split('-').map(Number);
      const deXuatMidnight = new Date(dxYear, dxMonth - 1, dxDate).getTime();
      const diffDeXuat = Math.round((deXuatMidnight - todayMidnight) / (24 * 60 * 60 * 1000));
      if (diffDeXuat < 3) {
        const err = new Error('Thời gian đăng ký dạy bù phải trước ít nhất 3 ngày tính từ hôm nay để kịp thông báo cho sinh viên.');
        err.status = 400;
        throw err;
      }

      // 2. Khóa dòng phòng đề xuất để ngăn chặn race condition khi 2 yêu cầu gửi cùng lúc
      await connection.query('SELECT MaPhong FROM PhongHoc WHERE MaPhong = ? FOR UPDATE', [maPhong]);

      // Kiểm tra xung đột đa chiều trong transaction
      const conflictRes = await ConflictService.checkConflict({
        maLopHocPhan: buoiHocGoc.MaLopHocPhan,
        ngayHoc: ngayDeXuat,
        maTiet,
        maPhong,
        maGiangVien
      }, connection);

      if (!conflictRes.ok) {
        // Kiểm tra nếu là xung đột phòng do vừa bị chiếm hoặc đang chờ duyệt
        const roomClash = conflictRes.conflicts.find(c => c.type === 'ROOM' || c.type === 'ROOM_PENDING');
        if (roomClash) {
          // Lấy danh sách phòng trống mới để gợi ý
          const newAvailableRooms = await ConflictService.findAvailableRooms({
            maLopHocPhan: buoiHocGoc.MaLopHocPhan,
            tuNgay: ngayDeXuat,
            soNgay: 7,
            maTiet,
            connection
          });

          const err = new Error(
            roomClash.type === 'ROOM_PENDING'
              ? roomClash.message
              : 'Phòng học vừa được đặt bởi buổi học khác. Vui lòng chọn phòng học hoặc thời gian khác.'
          );
          err.status = 409;
          err.metadata = {
            conflicts: conflictRes.conflicts,
            availableRooms: newAvailableRooms
          };
          throw err;
        }

        const firstErr = conflictRes.conflicts[0];
        const err = new Error(`Không thể đăng ký dạy bù: ${firstErr.message}`);
        err.status = 400;
        err.metadata = { conflicts: conflictRes.conflicts };
        throw err;
      }

      // 3. Lấy mã yêu cầu nghỉ liên quan (nếu có)
      const [ycnRows] = await connection.query(
        "SELECT MaYeuCauNghi FROM YeuCauNghi WHERE MaBuoiHoc = ? AND TrangThai = 'Approved' ORDER BY ThoiGianGui DESC LIMIT 1",
        [maBuoiHoc]
      );
      const maYeuCauNghi = ycnRows[0]?.MaYeuCauNghi || null;

      // 4. Sinh BuoiHoc mới (LoaiBuoiHoc = Makeup, TrangThai = Normal, MaBuoiHocGoc = maBuoiHoc)
      const maBuoiHocMoi = this.generateMaBH();
      const ngayGocStr = new Date(buoiHocGoc.NgayHoc).toISOString().slice(0, 10);

      await connection.query(`
        INSERT INTO BuoiHoc 
        (MaBuoiHoc, MaThoiKhoaBieu, MaLopHocPhan, NgayHoc, MaTiet, MaPhong, MaGiangVien, LoaiBuoiHoc, TrangThai, MaBuoiHocGoc, DaDayBu, GhiChu)
        VALUES (?, NULL, ?, ?, ?, ?, ?, 'Makeup', 'Normal', ?, 0, ?)
      `, [
        maBuoiHocMoi, buoiHocGoc.MaLopHocPhan, ngayDeXuat, maTiet, maPhong, maGiangVien, maBuoiHoc,
        `Dạy bù cho ca ngày ${ngayGocStr}`
      ]);

      // 5. Cập nhật ca nghỉ gốc: DaDayBu = 1
      await connection.query(
        "UPDATE BuoiHoc SET DaDayBu = 1, GhiChu = CONCAT(COALESCE(GhiChu, ''), ' [Đã xếp dạy bù ngày ', ?, ']') WHERE MaBuoiHoc = ?",
        [ngayDeXuat, maBuoiHoc]
      );

      // 6. Ghi bản ghi DangKyDayBu (Confirmed)
      const maDangKyDayBu = this.generateMaDKDB();
      await connection.query(`
        INSERT INTO DangKyDayBu 
        (MaDangKyDayBu, MaYeuCauNghi, MaGiangVien, MaLopHocPhan, ThoiGianDangKy, NgayDeXuat, MaTiet, MaPhong, TrangThai, ThoiGianXacNhan, MaBuoiHocTao)
        VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, 'Confirmed', NOW(), ?)
      `, [
        maDangKyDayBu, maYeuCauNghi, maGiangVien, buoiHocGoc.MaLopHocPhan, ngayDeXuat, maTiet, maPhong, maBuoiHocMoi
      ]);

      // 7. Tạo thông báo
      await ThongBaoService.notifyGiangVien(maGiangVien, {
        tieuDe: 'Đăng ký dạy bù thành công',
        noiDung: `Lịch dạy bù lớp '${buoiHocGoc.TenLopHocPhan}' vào ngày ${ngayDeXuat} tại phòng ${maPhong} đã được hệ thống xác nhận tự động.`,
        loaiThongBao: 'Makeup',
        maDoiTuongLienQuan: maDangKyDayBu
      }, connection);

      await ThongBaoService.notifyBoMon(buoiHocGoc.MaBoMon, {
        tieuDe: `Giảng viên đã đăng ký dạy bù: ${scope.hoTen || maGiangVien}`,
        noiDung: `Giảng viên ${scope.hoTen || maGiangVien} đã đăng ký dạy bù lớp '${buoiHocGoc.TenLopHocPhan}' vào ngày ${ngayDeXuat} tại phòng ${maPhong}.`,
        loaiThongBao: 'Makeup',
        maDoiTuongLienQuan: maDangKyDayBu
      }, connection);

      await connection.commit();
      return {
        success: true,
        maDangKyDayBu,
        maBuoiHocMoi,
        trangThai: 'Confirmed',
        ngayDeXuat,
        maTiet,
        maPhong
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };

  // ========================================================================
  // ĐĂNG KÝ LỊCH THỰC HÀNH CHO CÁC LỚP (LoaiHoc = 'TH') ĐÃ ĐƯỢC KHÓA
  // Quy định: Mỗi lớp TH có 5 buổi (1 buổi = 1 ca 3 tiết), GV đăng ký từng buổi,
  //           đăng ký trước ít nhất 3 ngày, cho phép chọn tất cả phòng Ready.
  // ========================================================================

  static REQUIRED_TH_SESSIONS = 5;

  /**
   * Lấy danh sách lớp Thực hành (LoaiHoc = 'TH', TrangThaiPhanCong = 'Locked') của Giảng viên
   * kèm tiến độ số buổi đã đăng ký / 5 buổi và số buổi còn lại
   */
  static getLopThucHanhCanDangKy = async (user) => {
    const scope = await getUserScope(user);
    if (!scope.maGiangVien) {
      const err = new Error('Không xác định được danh tính giảng viên.');
      err.status = 403;
      throw err;
    }

    const [lhpRows] = await db.query(`
      SELECT
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        lhp.MaMonHoc,
        mh.TenMonHoc,
        mh.SoTinChi,
        lhp.MaHocKy,
        hk.TenHocKy,
        hk.NamHoc,
        lhp.LoaiHoc,
        COALESCE(lhp.SiSoDangKy, lhp.SiSoDuKien, 0) AS SiSoDangKy,
        lhp.MaBoMon,
        DATE_FORMAT(lhp.NgayBatDau, '%Y-%m-%d') AS NgayBatDau,
        DATE_FORMAT(lhp.NgayKetThuc, '%Y-%m-%d') AS NgayKetThuc,
        lhp.TrangThaiPhanCong
      FROM LopHocPhan lhp
      LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      LEFT JOIN HocKy hk ON lhp.MaHocKy = hk.MaHocKy
      WHERE lhp.MaGiangVien = ?
        AND lhp.LoaiHoc = 'TH'
        AND lhp.TrangThaiPhanCong = 'Locked'
      ORDER BY lhp.MaLopHocPhan ASC
    `, [scope.maGiangVien]);

    if (lhpRows.length === 0) {
      return {
        classes: [],
        requiredSessionsPerClass: this.REQUIRED_TH_SESSIONS,
        totalPendingSessions: 0,
        totalPendingClasses: 0
      };
    }

    const lhpIds = lhpRows.map(r => r.MaLopHocPhan);
    const [bhRows] = await db.query(`
      SELECT
        bh.MaBuoiHoc,
        bh.MaLopHocPhan,
        DATE_FORMAT(bh.NgayHoc, '%Y-%m-%d') AS NgayHoc,
        bh.MaTiet,
        tt.TenTiet,
        TIME_FORMAT(tt.GioBatDau, '%H:%i') AS GioBatDau,
        TIME_FORMAT(tt.GioKetThuc, '%H:%i') AS GioKetThuc,
        bh.MaPhong,
        ph.TenPhong,
        bh.TrangThai,
        bh.GhiChu
      FROM BuoiHoc bh
      JOIN TietHoc tt ON bh.MaTiet = tt.MaTiet
      LEFT JOIN PhongHoc ph ON bh.MaPhong = ph.MaPhong
      WHERE bh.MaLopHocPhan IN (?)
        AND bh.TrangThai NOT IN ('Cancelled')
      ORDER BY bh.NgayHoc ASC, bh.MaTiet ASC
    `, [lhpIds]);

    const sessionsByClass = {};
    for (const bh of bhRows) {
      if (!sessionsByClass[bh.MaLopHocPhan]) sessionsByClass[bh.MaLopHocPhan] = [];
      sessionsByClass[bh.MaLopHocPhan].push(bh);
    }

    let totalPendingSessions = 0;
    let totalPendingClasses = 0;

    const classes = lhpRows.map(cls => {
      const registeredSessions = sessionsByClass[cls.MaLopHocPhan] || [];
      const daDangKy = registeredSessions.length;
      const tongCanDangKy = this.REQUIRED_TH_SESSIONS;
      const conLai = Math.max(0, tongCanDangKy - daDangKy);
      if (conLai > 0) {
        totalPendingSessions += conLai;
        totalPendingClasses++;
      }
      return {
        ...cls,
        registeredSessions,
        daDangKy,
        tongCanDangKy,
        conLai,
        isCompleted: conLai === 0
      };
    });

    // Ưu tiên đưa các lớp còn thiếu buổi lên đầu
    classes.sort((a, b) => (b.conLai > 0 ? 1 : 0) - (a.conLai > 0 ? 1 : 0) || a.MaLopHocPhan.localeCompare(b.MaLopHocPhan));

    return {
      classes,
      requiredSessionsPerClass: this.REQUIRED_TH_SESSIONS,
      totalPendingSessions,
      totalPendingClasses
    };
  };

  /**
   * Tìm phòng trống cho đăng ký Thực hành (kiểm tra tất cả phòng Ready đủ sức chứa + cảnh báo nếu GV trùng giờ)
   */
  static getPhongTrongThucHanh = async (user, { maLopHocPhan, tuNgay, maTiet }) => {
    const scope = await getUserScope(user);
    if (!scope.maGiangVien) {
      const err = new Error('Không xác định được danh tính giảng viên.');
      err.status = 403;
      throw err;
    }

    let searchStartDate = tuNgay;
    if (!searchStartDate) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 3);
      searchStartDate = minDate.toISOString().slice(0, 10);
    }

    // Kiểm tra xem Giảng viên đã bị trùng lịch dạy lớp khác vào (searchStartDate, maTiet) chưa
    let lecturerConflict = null;
    if (searchStartDate && maTiet) {
      const tietInfo = await ConflictService.getTietHocInfo(maTiet);
      if (tietInfo) {
        const [gvClashes] = await db.query(`
          SELECT bh.MaBuoiHoc, bh.MaLopHocPhan, lhp.TenLopHocPhan, th.TenTiet, ph.TenPhong
          FROM BuoiHoc bh
          JOIN TietHoc th ON bh.MaTiet = th.MaTiet
          LEFT JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
          LEFT JOIN PhongHoc ph ON bh.MaPhong = ph.MaPhong
          WHERE bh.MaGiangVien = ?
            AND bh.NgayHoc = ?
            AND bh.TrangThai NOT IN ('Absent', 'Swapped', 'Cancelled')
            AND (th.GioBatDau < ? AND ? < th.GioKetThuc)
          LIMIT 1
        `, [scope.maGiangVien, searchStartDate, tietInfo.GioKetThuc, tietInfo.GioBatDau]);

        if (gvClashes.length > 0) {
          const c = gvClashes[0];
          lecturerConflict = `Bạn đã có lịch dạy lớp "${c.TenLopHocPhan || c.MaLopHocPhan}" vào ${c.TenTiet} tại phòng ${c.TenPhong || 'N/A'} trong ngày này.`;
        }
      }
    }

    const rooms = await ConflictService.findAvailableRooms({
      maLopHocPhan,
      tuNgay: searchStartDate,
      soNgay: 7,
      maTiet: maTiet ? parseInt(maTiet, 10) : null
    });

    return {
      rooms,
      lecturerConflict
    };
  };

  /**
   * Giảng viên đăng ký 1 buổi Thực hành (tự động sinh BuoiHoc, tối đa 5 buổi/lớp TH)
   */
  static createDangKyThucHanh = async (user, {
    maLopHocPhan,
    ngayDeXuat,
    maTiet,
    maPhong
  }) => {
    if (!maLopHocPhan || !ngayDeXuat || !maTiet || !maPhong) {
      const err = new Error('Vui lòng cung cấp đầy đủ: Lớp thực hành, Ngày dạy, Ca/Tiết học và Phòng học.');
      err.status = 400;
      throw err;
    }

    const scope = await getUserScope(user);
    const maGiangVien = scope.maGiangVien;
    if (!maGiangVien) {
      const err = new Error('Không xác định được danh tính giảng viên.');
      err.status = 403;
      throw err;
    }

    // Kiểm tra quy định đăng ký trước ít nhất 3 ngày tính từ hôm nay
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const [dxYear, dxMonth, dxDate] = String(ngayDeXuat).slice(0, 10).split('-').map(Number);
    const deXuatMidnight = new Date(dxYear, dxMonth - 1, dxDate).getTime();
    const diffDeXuat = Math.round((deXuatMidnight - todayMidnight) / (24 * 60 * 60 * 1000));
    if (diffDeXuat < 3) {
      const err = new Error('Quy định: Thời gian đăng ký lịch thực hành phải trước ít nhất 3 ngày tính từ hôm nay để kịp thông báo cho sinh viên.');
      err.status = 400;
      throw err;
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Khóa dòng LopHocPhan để kiểm tra quyền và số buổi đã đăng ký
      const [lhpRows] = await connection.query(`
        SELECT lhp.*, mh.TenMonHoc
        FROM LopHocPhan lhp
        LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
        WHERE lhp.MaLopHocPhan = ?
        FOR UPDATE
      `, [maLopHocPhan.trim()]);

      if (lhpRows.length === 0) {
        const err = new Error(`Lớp học phần '${maLopHocPhan}' không tồn tại.`);
        err.status = 404;
        throw err;
      }

      const lhp = lhpRows[0];
      if (lhp.MaGiangVien !== maGiangVien) {
        const err = new Error('Bạn không có quyền đăng ký lịch thực hành cho lớp của giảng viên khác.');
        err.status = 403;
        throw err;
      }
      if (lhp.LoaiHoc !== 'TH') {
        const err = new Error('Chức năng này chỉ áp dụng cho các lớp Thực hành (LoaiHoc = TH).');
        err.status = 400;
        throw err;
      }
      if (lhp.TrangThaiPhanCong !== 'Locked') {
        const err = new Error('Lớp thực hành này chưa được Phòng Đào Tạo khóa lịch. Vui lòng chờ khóa lịch trước khi đăng ký.');
        err.status = 400;
        throw err;
      }

      const [[countRow]] = await connection.query(
        `SELECT COUNT(*) AS cnt FROM BuoiHoc WHERE MaLopHocPhan = ? AND TrangThai NOT IN ('Cancelled')`,
        [lhp.MaLopHocPhan]
      );
      const currentCount = countRow?.cnt || 0;
      if (currentCount >= this.REQUIRED_TH_SESSIONS) {
        const err = new Error(`Lớp '${lhp.TenLopHocPhan || lhp.MaLopHocPhan}' đã đăng ký đủ ${this.REQUIRED_TH_SESSIONS}/${this.REQUIRED_TH_SESSIONS} buổi thực hành.`);
        err.status = 400;
        throw err;
      }

      // 2. Khóa dòng phòng để chống race condition
      await connection.query('SELECT MaPhong FROM PhongHoc WHERE MaPhong = ? FOR UPDATE', [maPhong]);

      // 3. Kiểm tra xung đột đa chiều (Phòng học + Giảng viên + Lớp sinh viên)
      const conflictRes = await ConflictService.checkConflict({
        maLopHocPhan: lhp.MaLopHocPhan,
        ngayHoc: ngayDeXuat,
        maTiet: parseInt(maTiet, 10),
        maPhong,
        maGiangVien
      }, connection);

      if (!conflictRes.ok) {
        const roomClash = conflictRes.conflicts.find(c => c.type === 'ROOM' || c.type === 'ROOM_PENDING');
        if (roomClash) {
          const newAvailableRooms = await ConflictService.findAvailableRooms({
            maLopHocPhan: lhp.MaLopHocPhan,
            tuNgay: ngayDeXuat,
            soNgay: 7,
            maTiet: parseInt(maTiet, 10),
            connection
          });
          const err = new Error(
            roomClash.type === 'ROOM_PENDING'
              ? roomClash.message
              : 'Phòng học vừa được đặt bởi buổi học khác. Vui lòng chọn phòng hoặc ca khác.'
          );
          err.status = 409;
          err.metadata = { conflicts: conflictRes.conflicts, availableRooms: newAvailableRooms };
          throw err;
        }
        const firstErr = conflictRes.conflicts[0];
        const err = new Error(`Không thể đăng ký buổi thực hành: ${firstErr.message}`);
        err.status = 400;
        err.metadata = { conflicts: conflictRes.conflicts };
        throw err;
      }

      // 4. Sinh BuoiHoc mới trực tiếp vào TKB chính thức
      const dateCompact = String(ngayDeXuat).slice(0, 10).replace(/-/g, '');
      const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      const maBuoiHoc = `BH_${dateCompact}_TH_${randHex}`;
      const newOrder = currentCount + 1;

      await connection.query(`
        INSERT INTO BuoiHoc
        (MaBuoiHoc, MaThoiKhoaBieu, MaLopHocPhan, NgayHoc, MaTiet, MaPhong, MaGiangVien, LoaiBuoiHoc, TrangThai, MaBuoiHocGoc, DaDayBu, GhiChu)
        VALUES (?, NULL, ?, ?, ?, ?, ?, 'Regular', 'Normal', NULL, 0, ?)
      `, [
        maBuoiHoc,
        lhp.MaLopHocPhan,
        ngayDeXuat,
        parseInt(maTiet, 10),
        maPhong,
        maGiangVien,
        `Buổi thực hành ${newOrder}/${this.REQUIRED_TH_SESSIONS} (GV đăng ký)`
      ]);

      // 5. Gửi thông báo xác nhận cho giảng viên
      await ThongBaoService.notifyGiangVien(maGiangVien, {
        tieuDe: `Đăng ký lịch thực hành thành công (${newOrder}/${this.REQUIRED_TH_SESSIONS})`,
        noiDung: `Buổi thực hành ${newOrder}/${this.REQUIRED_TH_SESSIONS} lớp '${lhp.TenLopHocPhan || lhp.MaLopHocPhan}' vào ngày ${ngayDeXuat} tại phòng ${maPhong} đã được xếp vào lịch giảng dạy.`,
        loaiThongBao: 'System',
        maDoiTuongLienQuan: maBuoiHoc
      }, connection);

      await connection.commit();

      return {
        success: true,
        maBuoiHoc,
        maLopHocPhan: lhp.MaLopHocPhan,
        tenLopHocPhan: lhp.TenLopHocPhan,
        ngayDeXuat,
        maTiet: parseInt(maTiet, 10),
        maPhong,
        daDangKy: newOrder,
        tongCanDangKy: this.REQUIRED_TH_SESSIONS,
        conLai: Math.max(0, this.REQUIRED_TH_SESSIONS - newOrder)
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };
}

module.exports = DangKyDayBuService;
