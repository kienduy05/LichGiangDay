const crypto = require('crypto');
const Approval = require('./xeplich.approval');
const { findWeeklyTemplate } = require('./weeklySchedule');
const db = require('../../../config/db');
const ScheduleConstraintService = require('./scheduleConstraint.service');
const XepLichStore = require('./xeplich.store');
const { getSoBuoiMoiTuan, isRoomCompatible } = require('./xeplich.config');

const makeError = (message, status = 400, metadata = null) => {
  const error = new Error(message);
  error.status = status;
  error.metadata = metadata;
  return error;
};

const now = () => new Date().toISOString();
const dateOnly = value => String(value || '').slice(0, 10);

const updateCounters = (session) => {
  const grouped = new Map();
  for (const row of session.dong) {
    if (!grouped.has(row.MaLopHocPhan)) grouped.set(row.MaLopHocPhan, row.TrangThai);
    if (row.TrangThai !== 'Draft') grouped.set(row.MaLopHocPhan, row.TrangThai);
  }
  const statuses = [...grouped.values()];
  session.phien.SoLopDaXuLy = statuses.length;
  session.phien.SoLopDaXep = statuses.filter(value => value === 'Draft').length;
  session.phien.SoLopKhongXep = statuses.filter(value => value === 'Unscheduled').length;
  session.phien.SoLopThieuDuLieu = statuses.filter(value => value === 'MissingData').length;
};

const addRow = (session, row) => {
  const result = { MaDong: session.nextRowId, ...row };
  session.nextRowId += 1;
  session.dong.push(result);
  return result;
};

class XepLichService {
  static getLopChuaXep = async ({ maHocKy, maKhoa = '', maBoMon = '', search = '' } = {}) => {
    if (!maHocKy || !maHocKy.trim()) throw makeError('Vui lòng chọn Học kỳ.');

    const conditions = [
      'lhp.MaHocKy = ?',
      'NOT EXISTS (SELECT 1 FROM ThoiKhoaBieu tkb WHERE tkb.MaLopHocPhan = lhp.MaLopHocPhan)'
    ];
    const params = [maHocKy.trim()];
    if (maKhoa?.trim()) {
      conditions.push('bm.MaKhoa = ?');
      params.push(maKhoa.trim());
    }
    if (maBoMon?.trim()) {
      conditions.push('lhp.MaBoMon = ?');
      params.push(maBoMon.trim());
    }
    if (search?.trim()) {
      conditions.push('(lhp.MaLopHocPhan LIKE ? OR lhp.TenLopHocPhan LIKE ? OR mh.TenMonHoc LIKE ?)');
      const keyword = `%${search.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    const [rows] = await db.query(`
      SELECT lhp.MaLopHocPhan, lhp.TenLopHocPhan, lhp.MaHocKy,
             lhp.MaBoMon, bm.TenBoMon, bm.MaKhoa,
             lhp.MaMonHoc, mh.TenMonHoc, mh.SoTinChi,
             lhp.LoaiHoc, lhp.SiSoDuKien, lhp.SiSoDangKy,
             lhp.NgayBatDau, lhp.NgayKetThuc, lhp.SoTuan
      FROM LopHocPhan lhp
      JOIN MonHoc mh ON mh.MaMonHoc = lhp.MaMonHoc
      JOIN BoMon bm ON bm.MaBoMon = lhp.MaBoMon
      WHERE ${conditions.join(' AND ')}
      ORDER BY bm.MaKhoa, lhp.MaBoMon, lhp.MaMonHoc, lhp.MaLopHocPhan
    `, params);
    const [rooms] = await db.query(`
      SELECT MaPhong, SucChua, LoaiPhong
      FROM PhongHoc
      WHERE TrangThai = 'Ready'
    `);
    const [periods] = await db.query('SELECT MaTiet FROM TietHoc LIMIT 1');

    const pendingIds = new Set(XepLichStore.list().filter(item => Approval.pendingStates.includes(item.phien.TrangThai)).flatMap(item => item.dong.filter(row => row.TrangThai === 'Draft').map(row => row.MaLopHocPhan)));
    return rows.map((row) => {
      const missing = [];
      if (pendingIds.has(row.MaLopHocPhan)) missing.push('Lớp đã có lịch nháp chờ bộ môn phân công/PĐT khóa');
      const size = Number(row.SiSoDangKy || row.SiSoDuKien || 0);
      const soBuoiMoiTuan = getSoBuoiMoiTuan(row.LoaiHoc, row.SoTinChi);
      if (!row.NgayBatDau || !row.NgayKetThuc || !row.SoTuan) missing.push('Thiếu thời gian học hợp lệ');
      if (!size) missing.push('Thiếu sĩ số');
      if (periods.length === 0) missing.push('Chưa có danh mục ca/tiết học');
      const hasRoom = rooms.some(room => (
        Number(room.SucChua || 0) >= size && isRoomCompatible(row.LoaiHoc, room.LoaiPhong)
      ));
      if (!hasRoom) missing.push('Không có phòng sẵn sàng phù hợp loại học và sức chứa');
      return {
        ...row,
        SoBuoiMoiTuan: soBuoiMoiTuan,
        SoTuanDinhMuc: row.SoTuan,
        trangThaiDuLieu: missing.length === 0 ? 'Ready' : 'MissingData',
        lyDoThieuDuLieu: missing
      };
    });
  };

  static createPhien = async (user, {
    maHocKy,
    maKhoa = null,
    maBoMon = null,
    maLopHocPhans = [],
    uuTienPhongGanSiSo = true,
    choPhepXepLaiLichDaCo = false
  } = {}) => {
    if (!user?.userId) throw makeError('Không xác định được người tạo phiên.', 401);
    if (!maHocKy || !maHocKy.trim()) throw makeError('Vui lòng chọn Học kỳ.');
    if (!Array.isArray(maLopHocPhans)) throw makeError('Danh sách lớp học phần không hợp lệ.');
    if (choPhepXepLaiLichDaCo) throw makeError('Chưa hỗ trợ tự động thay thế lịch chính thức đã có.');

    const [[semester]] = await db.query('SELECT MaHocKy FROM HocKy WHERE MaHocKy = ? LIMIT 1', [maHocKy.trim()]);
    if (!semester) throw makeError(`Học kỳ '${maHocKy}' không tồn tại.`, 404);

    const running = XepLichStore.list().find(item => (
      item.phien.MaHocKy === maHocKy.trim()
      && (item.phien.MaKhoa || '') === (maKhoa || '')
      && (item.phien.MaBoMon || '') === (maBoMon || '')
      && item.phien.TrangThai === 'Processing'
    ));
    if (running) {
      throw makeError('Phạm vi này đang có một phiên xếp lịch khác xử lý.', 409, { maPhien: running.phien.MaPhien });
    }

    const available = await this.getLopChuaXep({ maHocKy, maKhoa: maKhoa || '', maBoMon: maBoMon || '' });
    const availableIds = new Set(available.map(row => row.MaLopHocPhan));
    const readyIds = available.filter(row => row.trangThaiDuLieu === 'Ready').map(row => row.MaLopHocPhan);
    const selectedIds = [...new Set(maLopHocPhans.map(String).map(value => value.trim()).filter(Boolean))];
    const targetIds = selectedIds.length > 0 ? selectedIds : readyIds;
    const invalidIds = targetIds.filter(id => !availableIds.has(id) || !readyIds.includes(id));
    if (invalidIds.length > 0) {
      throw makeError('Có lớp không thuộc phạm vi hoặc đã được xếp lịch.', 400, { maLopHocPhans: invalidIds });
    }
    if (targetIds.length === 0) throw makeError('Không có lớp học phần đủ điều kiện để xếp lịch.');

    const maPhien = crypto.randomUUID();
    const session = {
      phien: {
        MaPhien: maPhien,
        MaHocKy: maHocKy.trim(),
        MaKhoa: maKhoa || null,
        MaBoMon: maBoMon || null,
        NguoiTao: user.userId,
        TrangThai: 'Processing',
        TongSoLop: targetIds.length,
        SoLopDaXuLy: 0,
        SoLopDaXep: 0,
        SoLopKhongXep: 0,
        SoLopThieuDuLieu: 0,
        TuyChon: { maLopHocPhans: targetIds, uuTienPhongGanSiSo: Boolean(uuTienPhongGanSiSo) },
        ThoiGianTao: now(),
        ThoiGianBatDau: null,
        ThoiGianHoanTat: null,
        ThoiGianApDung: null,
        ThoiGianHuy: null,
        LoiHeThong: null
      },
      dong: [],
      nextRowId: 1
    };
    XepLichStore.save(session);
    return { maPhien, trangThai: 'Processing', tongSoLop: targetIds.length };
  };

  static processPhien = async (maPhien) => {
    let session = XepLichStore.get(maPhien);
    if (!session || session.phien.TrangThai !== 'Processing') return;
    session.phien.ThoiGianBatDau = now();
    XepLichStore.save(session);

    try {
      const targetIds = session.phien.TuyChon.maLopHocPhans || [];
      for (const maLopHocPhan of targetIds) {
        session = XepLichStore.get(maPhien);
        if (!session || session.phien.TrangThai === 'Cancelled') return;

        const [[lop]] = await db.query(`
          SELECT lhp.*, mh.SoTinChi, mh.TenMonHoc,
                 COALESCE(NULLIF(lhp.SiSoDangKy, 0), lhp.SiSoDuKien, 0) AS SiSo
          FROM LopHocPhan lhp
          JOIN MonHoc mh ON mh.MaMonHoc = lhp.MaMonHoc
          WHERE lhp.MaLopHocPhan = ?
          LIMIT 1
        `, [maLopHocPhan]);

        const missing = [];
        if (!lop) missing.push('Lớp học phần không tồn tại');
        if (lop && (!lop.NgayBatDau || !lop.NgayKetThuc || !lop.SoTuan)) missing.push('Thiếu thời gian học');
        if (lop && !Number(lop.SiSo || 0)) missing.push('Thiếu sĩ số');

        let rooms = [];
        if (lop) {
          [rooms] = await db.query(`
            SELECT MaPhong, TenPhong, MaToaNha, SucChua, LoaiPhong,
                   ABS(COALESCE(SucChua, 0) - ?) AS ChenhLechSucChua
            FROM PhongHoc
            WHERE TrangThai = 'Ready' AND COALESCE(SucChua, 0) >= ?
            ORDER BY ChenhLechSucChua ASC, MaPhong ASC
          `, [lop.SiSo || 0, lop.SiSo || 0]);
          rooms = rooms.filter(room => isRoomCompatible(lop.LoaiHoc, room.LoaiPhong));
          if (rooms.length === 0) missing.push('Không có phòng phù hợp loại học và sức chứa');
        }

        if (missing.length > 0) {
          addRow(session, {
            MaPhien: maPhien,
            MaLopHocPhan: maLopHocPhan,
            TenMonHoc: lop?.TenMonHoc || lop?.TenLopHocPhan || maLopHocPhan,
            TrangThai: 'MissingData',
            MaLoi: 'MISSING_DATA',
            LyDo: missing
          });
          updateCounters(session);
          XepLichStore.save(session);
          continue;
        }

        const [periods] = await db.query('SELECT MaTiet, TenTiet, GioBatDau, GioKetThuc FROM TietHoc ORDER BY GioBatDau, MaTiet');
        const result = await findWeeklyTemplate({ member: lop, rooms, periods,
          checkpoint: async () => {
            await new Promise(resolve => setImmediate(resolve));
            if (XepLichStore.get(maPhien)?.phien.TrangThai !== 'Processing') throw makeError('Phiên đã dừng.', 409);
          },
          check: row => ScheduleConstraintService.check({ maLopHocPhan, thuTrongTuan: row.ThuTrongTuan,
            maTiet: row.MaTiet, maPhong: row.MaPhong, ngayBatDau: row.NgayBatDau,
            ngayKetThuc: row.NgayKetThuc, maPhien })
        });
        session = XepLichStore.get(maPhien);
        if (!session || session.phien.TrangThai !== 'Processing') return;
        if (result.rows) result.rows.forEach(row => addRow(session, { ...row, MaPhien: maPhien }));
        else addRow(session, { MaPhien: maPhien, MaLopHocPhan: maLopHocPhan,
          TenLopHocPhan: lop.TenLopHocPhan, TenMonHoc: lop.TenMonHoc, LoaiHoc: lop.LoaiHoc,
          TrangThai: 'Unscheduled', MaLoi: 'NO_WEEKLY_TEMPLATE',
          LyDo: result.conflicts.length ? result.conflicts : ['Không có mẫu cố định đủ buổi, cùng phòng và cách ngày.'] });
        session.phien.SoViTriDaThu = (session.phien.SoViTriDaThu || 0) + result.attempts;
        updateCounters(session);
        XepLichStore.save(session);
      }

      session = XepLichStore.get(maPhien);
      if (session && session.phien.TrangThai === 'Processing') {
        session.phien.TrangThai = session.phien.SoLopKhongXep > 0 || session.phien.SoLopThieuDuLieu > 0
          ? 'CompletedWithWarnings'
          : 'Completed';
        session.phien.ThoiGianHoanTat = now();
        XepLichStore.save(session);
      }
    } catch (error) {
      session = XepLichStore.get(maPhien);
      if (session?.phien.TrangThai === 'Cancelled') return;
      if (session && session.phien.TrangThai === 'Processing') {
        session.phien.TrangThai = 'Failed';
        session.phien.LoiHeThong = error.message;
        session.phien.ThoiGianHoanTat = now();
        XepLichStore.save(session);
      }
      throw error;
    }
  };

  static getPhien = async (maPhien) => {
    const session = XepLichStore.get(maPhien);
    if (!session) throw makeError('Không tìm thấy phiên xếp lịch.', 404);
    return { phien: session.phien, dong: session.dong };
  };

  static kiemTra = async (payload) => ScheduleConstraintService.check(payload);

  static updateDong = async (maPhien, maDong, payload) => {
    const session = XepLichStore.get(maPhien);
    if (!session) throw makeError('Không tìm thấy phiên xếp lịch.', 404);
    if (!['Completed', 'CompletedWithWarnings'].includes(session.phien.TrangThai)) {
      throw makeError('Chỉ được chỉnh sửa phiên đã chạy xong và chưa áp dụng.', 409);
    }
    const row = session.dong.find(item => Number(item.MaDong) === Number(maDong));
    if (!row || row.TrangThai !== 'Draft') throw makeError('Không tìm thấy dòng lịch nháp có thể chỉnh sửa.', 404);

    const candidate = {
      maLopHocPhan: row.MaLopHocPhan,
      thuTrongTuan: payload.thuTrongTuan ?? row.ThuTrongTuan,
      maTiet: payload.maTiet ?? row.MaTiet,
      maPhong: payload.maPhong ?? row.MaPhong,
      ngayBatDau: payload.ngayBatDau ?? row.NgayBatDau,
      ngayKetThuc: payload.ngayKetThuc ?? row.NgayKetThuc,
      maPhien,
      excludeMaDong: maDong
    };
    const check = await ScheduleConstraintService.check(candidate);
    if (!check.valid) throw makeError('Vị trí lịch nháp không hợp lệ.', 409, check);

    Object.assign(row, {
      ThuTrongTuan: Number(candidate.thuTrongTuan),
      MaTiet: Number(candidate.maTiet),
      TenTiet: check.context.tietHoc.TenTiet,
      GioBatDau: check.context.tietHoc.GioBatDau,
      GioKetThuc: check.context.tietHoc.GioKetThuc,
      MaPhong: candidate.maPhong,
      TenPhong: check.context.phongHoc.TenPhong,
      MaToaNha: check.context.phongHoc.MaToaNha,
      NgayBatDau: dateOnly(candidate.ngayBatDau),
      NgayKetThuc: dateOnly(candidate.ngayKetThuc),
      NguonXep: 'Manual',
      DaKhoa: payload.daKhoa ? 1 : 0,
      LyDo: []
    });
    XepLichStore.save(session);
    return { phien: session.phien, dong: session.dong };
  };

  // Compatibility endpoint now submits a draft; it never publishes schedules.
  static applyPhien = async (user, maPhien) => Approval.submit(user, maPhien);
  static removeClassDraft = async (user, maPhien, maLopHocPhan) => Approval.removeClassDraft(user, maPhien, maLopHocPhan);
  static resolveNotification = async (user, reference) => Approval.resolveNotification(user, reference);
  static listChoXacNhan = async (user, maHocKy) => Approval.list(user, maHocKy);
  static updateClassDraft = async (user, maPhien, maLopHocPhan, schedules) => Approval.updateClassDraft(user, maPhien, maLopHocPhan, schedules);

  static cancelPhien = async (maPhien) => {
    const session = XepLichStore.get(maPhien);
    if (!session) throw makeError('Không tìm thấy phiên xếp lịch.', 404);
    if (Approval.isBusy(maPhien)) throw makeError('Phiên đang được xử lý.', 409);
    if (['Applied', ...Approval.pendingStates].includes(session.phien.TrangThai)) throw makeError('Không thể hủy phiên đã gửi bộ môn phân công hoặc đã áp dụng.', 409);
    session.phien.TrangThai = 'Cancelled';
    session.phien.ThoiGianHuy = now();
    XepLichStore.save(session);
    return { maPhien, trangThai: 'Cancelled' };
  };
}

module.exports = XepLichService;
