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
}

module.exports = DangKyDayBuService;
