const crypto = require('crypto');
const db = require('../../../config/db');
const ScheduleConstraintService = require('./scheduleConstraint.service');
const WorkloadData = require('./workloadData.service');
const { solveWorkload } = require('./workloadSolver');
const { RULE_VERSION, buildGroups, periodUnits, validateWorkload, dayNumber } = require('./workloadRules');
const XepLichStore = require('./xeplich.store');
const { isRoomCompatible } = require('./xeplich.config');

const makeError = (message, status = 400, metadata = null) => {
  const error = new Error(message);
  error.status = status;
  error.metadata = metadata;
  return error;
};

const now = () => new Date().toISOString();
const dateOnly = value => String(value || '').slice(0, 10);
const activeSessions = new Set();
const busySessions = new Set();

const recoverInterruptedSession = (session) => {
  if (session?.phien.TrangThai === 'Processing' && !activeSessions.has(session.phien.MaPhien)) {
    session.phien.TrangThai = 'Failed';
    session.phien.LoiHeThong = 'Phiên xếp lịch bị gián đoạn do backend khởi động lại. Vui lòng hủy phiên và tạo lại.';
    session.phien.ThoiGianHoanTat = now();
    XepLichStore.save(session);
  }
  return session;
};

const assertProcessing = (maPhien) => {
  if (XepLichStore.get(maPhien)?.phien.TrangThai !== 'Processing') {
    throw makeError('Phiên xếp lịch đã dừng.', 409);
  }
};

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
    const catalog = await WorkloadData.loadCatalog(maHocKy.trim());
    const resources = await WorkloadData.loadResources(maHocKy.trim(), db, false);
    const groups = buildGroups(catalog);
    const inScope = row => (!maKhoa || row.MaKhoa === maKhoa) && (!maBoMon || row.MaBoMon === maBoMon);
    const keyword = search.trim().toLowerCase();
    const result = [];
    for (const group of groups) {
      const issues = [...group.issues];
      if (!resources.periods.some(period => periodUnits(period) === 3)) issues.push('Chưa có ca học gồm đúng 3 tiết (ví dụ Tiết 1-3).');
      if (group.members.some(row => !inScope(row))) issues.push('Cần chọn phạm vi bao gồm đầy đủ các lớp cùng nhóm.');
      for (const member of group.members) {
        if (!resources.rooms.some(room => Number(room.SucChua) >= Number(member.SiSo) && isRoomCompatible(member.LoaiHoc, room.LoaiPhong))) {
          issues.push(`${member.MaLopHocPhan}: không có phòng phù hợp sức chứa và loại học.`);
        }
      }
      for (const member of group.members) {
        if (member.DaCoLich || !inScope(member)) continue;
        if (keyword && ![member.MaLopHocPhan, member.TenLopHocPhan, member.TenMonHoc].some(value => String(value || '').toLowerCase().includes(keyword))) continue;
        result.push({ ...member, MaNhomXep: group.MaNhomXep, NhomLop: group.NhomLop,
          MaLopCungNhom: group.members.map(row => row.MaLopHocPhan),
          ToiDaBuoiMoiTuan: group.ToiDaBuoiMoiTuan, KhoangCachNgay: 2,
          trangThaiDuLieu: issues.length ? 'MissingData' : 'Ready', lyDoThieuDuLieu: [...new Set(issues)] });
      }
    }
    return result;
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

    const running = XepLichStore.list().map(recoverInterruptedSession).find(item => (
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
    const requestedIds = selectedIds.length > 0 ? selectedIds : readyIds;
    const readySet = new Set(readyIds);
    const invalidReady = requestedIds.filter(id => !readySet.has(id));
    if (invalidReady.length) throw makeError('Có lớp chưa đủ dữ liệu hoặc nhóm chưa đủ điều kiện xếp lịch.', 400, { maLopHocPhans: invalidReady });
    const targetIds = [...new Set(requestedIds.flatMap(id => available.find(row => row.MaLopHocPhan === id)?.MaLopCungNhom || [id]))];
    const invalidIds = targetIds.filter(id => !availableIds.has(id));
    if (invalidIds.length > 0) {
      throw makeError('Có lớp không thuộc phạm vi hoặc đã được xếp lịch.', 400, { maLopHocPhans: invalidIds });
    }
    if (targetIds.length === 0) throw makeError('Không có lớp học phần đủ điều kiện để xếp lịch.');

    const maPhien = crypto.randomUUID();
    const session = {
      phien: {
        MaPhien: maPhien,
        PhienBanQuyTac: RULE_VERSION,
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
    activeSessions.add(maPhien);
    return { maPhien, trangThai: 'Processing', tongSoLop: targetIds.length };
  };

  static processPhien = async (maPhien) => {
    let session = XepLichStore.get(maPhien);
    if (!session || session.phien.TrangThai !== 'Processing') {
      activeSessions.delete(maPhien);
      return;
    }
    activeSessions.add(maPhien);
    session.phien.ThoiGianBatDau = now();
    session.phien.PhienBanQuyTac = RULE_VERSION;
    XepLichStore.save(session);
    try {
      const targetIds = new Set(session.phien.TuyChon.maLopHocPhans || []);
      const catalog = await WorkloadData.loadCatalog(session.phien.MaHocKy);
      assertProcessing(maPhien);
      const groups = buildGroups(catalog).filter(group => group.members.some(row => targetIds.has(row.MaLopHocPhan)));
      const data = await WorkloadData.loadResources(session.phien.MaHocKy);
      assertProcessing(maPhien);
      const eligible = [];
      session.phien.DinhMucNhom = groups.map(group => ({
        MaNhomXep: group.MaNhomXep, NhomLop: group.NhomLop, KhoaHoc: group.KhoaHoc,
        SoTinChi: group.SoTinChi, SoTuan: group.SoTuan, TongSoBuoi: group.TongSoBuoi, TongSoTiet: group.TongSoTiet,
        members: group.members.map(row => ({ MaLopHocPhan: row.MaLopHocPhan, LoaiHoc: row.LoaiHoc,
          SoBuoiMoiTuan: row.SoBuoiMoiTuan, SoBuoiYeuCau: row.SoBuoiYeuCau, SoTietYeuCau: row.SoTietYeuCau }))
      }));
      for (const id of targetIds) {
        if (!catalog.some(row => row.MaLopHocPhan === id)) addRow(session, { MaPhien: maPhien, MaLopHocPhan: id,
          TrangThai: 'MissingData', MaLoi: 'CLASS_NOT_FOUND', LyDo: ['Lớp học phần không còn tồn tại trong học kỳ.'] });
      }
      for (const group of groups) {
        if (group.members.some(row => !targetIds.has(row.MaLopHocPhan))) group.issues.push('Danh sách nhóm đã thay đổi; cần tạo lại phiên với đầy đủ thành phần.');
        if (!data.periods.some(period => periodUnits(period) === 3)) group.issues.push('Không có ca học gồm đúng 3 tiết.');
        if (group.issues.length) {
          for (const member of group.members.filter(row => targetIds.has(row.MaLopHocPhan))) addRow(session, {
            MaPhien: maPhien, MaLopHocPhan: member.MaLopHocPhan, TenMonHoc: member.TenMonHoc, TenLopHocPhan: member.TenLopHocPhan, LoaiHoc: member.LoaiHoc,
            TrangThai: 'MissingData', MaLoi: 'INVALID_GROUP', LyDo: group.issues
          });
        } else eligible.push(group);
      }
      let lastSave = 0;
      const result = await solveWorkload({ groups: eligible, data, classes: catalog,
        checkpoint: async (metrics, group) => {
          assertProcessing(maPhien);
          if (group) session.phien.MaLopDangXuLy = group.members.map(row => row.MaLopHocPhan).join(', ');
          if (group || Date.now() - lastSave > 500) {
            session.phien.SoViTriDaThu = metrics.candidates;
            session.phien.SoTrangThaiDaXet = metrics.states;
            XepLichStore.save(session);
            lastSave = Date.now();
          }
        }
      });
      assertProcessing(maPhien);
      for (const item of result.results) {
        if (item.rows) item.rows.forEach(row => addRow(session, { ...row, MaPhien: maPhien }));
        else for (const member of item.group.members) addRow(session, {
          MaPhien: maPhien, MaLopHocPhan: member.MaLopHocPhan, TenMonHoc: member.TenMonHoc, TenLopHocPhan: member.TenLopHocPhan, LoaiHoc: member.LoaiHoc,
          TrangThai: 'Unscheduled', MaLoi: item.reason, LyDo: [item.message]
        });
      }
      for (const group of session.phien.DinhMucNhom) {
        for (const member of group.members) {
          const own = session.dong.filter(row => row.TrangThai === 'Draft' && row.MaLopHocPhan === member.MaLopHocPhan);
          if (own.length) { member.SoBuoiYeuCau = own.length; member.SoTietYeuCau = own.length * 3; }
        }
        group.TongSoBuoi = group.members.reduce((sum, member) => sum + member.SoBuoiYeuCau, 0);
        group.TongSoTiet = group.TongSoBuoi * 3;
      }
      updateCounters(session);
      session.phien.ThongKeTimKiem = result.metrics;
      session.phien.SoViTriDaThu = result.metrics.candidates;
      session.phien.SoTrangThaiDaXet = result.metrics.states;
      session.phien.MaLopDangXuLy = null;
      session.phien.TongSoBuoiDaXep = session.dong.filter(row => row.TrangThai === 'Draft').length;
      session.phien.TrangThai = session.phien.SoLopKhongXep || session.phien.SoLopThieuDuLieu ? 'CompletedWithWarnings' : 'Completed';
      session.phien.ThoiGianHoanTat = now();
      XepLichStore.save(session);
    } catch (error) {
      session = XepLichStore.get(maPhien);
      if (!session || session.phien.TrangThai === 'Cancelled') return;
      if (session.phien.TrangThai === 'Processing') {
        session.phien.TrangThai = 'Failed';
        session.phien.LoiHeThong = error.message;
        session.phien.ThoiGianHoanTat = now();
        XepLichStore.save(session);
      }
      throw error;
    } finally {
      activeSessions.delete(maPhien);
    }
  };

  static getPhien = async (maPhien) => {
    const session = recoverInterruptedSession(XepLichStore.get(maPhien));
    if (!session) throw makeError('Không tìm thấy phiên xếp lịch.', 404);
    return { phien: session.phien, dong: session.dong };
  };

  static listPhien = async ({ maHocKy } = {}) => {
    if (!maHocKy || !String(maHocKy).trim()) throw makeError('Vui lòng chọn học kỳ.');
    return XepLichStore.list()
      .filter(item => item.phien.MaHocKy === String(maHocKy).trim())
      .map(recoverInterruptedSession)
      .map(item => ({ ...item.phien, DangXuLy: activeSessions.has(item.phien.MaPhien) || busySessions.has(item.phien.MaPhien) }))
      .sort((a, b) => String(b.ThoiGianTao || '').localeCompare(String(a.ThoiGianTao || '')));
  };

  static deletePhien = async (maPhien) => {
    const session = recoverInterruptedSession(XepLichStore.get(maPhien));
    if (!session) throw makeError('Không tìm thấy phiên xếp lịch.', 404);
    if (activeSessions.has(maPhien) || busySessions.has(maPhien) || session.phien.TrangThai === 'Processing') {
      throw makeError('Phiên đang xử lý. Vui lòng hủy và chờ xử lý dừng trước khi xóa.', 409);
    }
    if (!['Completed', 'CompletedWithWarnings', 'Failed', 'Cancelled', 'Applied'].includes(session.phien.TrangThai)) {
      throw makeError('Không thể xóa phiên ở trạng thái này.', 409);
    }
    XepLichStore.remove(maPhien);
    return { maPhien };
  };

  static deletePhienBatch = async (maPhien) => {
    if (!Array.isArray(maPhien) || maPhien.length === 0 || maPhien.some(id => typeof id !== 'string' || !id.trim())) {
      throw makeError('Vui lòng chọn các phiên cần xóa.');
    }
    const sessions = new Map(XepLichStore.list().map(item => [item.phien.MaPhien, item]));
    const ids = [...new Set(maPhien.map(id => id.trim()))];
    const eligible = [];
    const errors = [];
    for (const id of ids) {
      const item = recoverInterruptedSession(sessions.get(id));
      if (!item) errors.push({ maPhien: id, message: 'Không tìm thấy phiên.' });
      else if (activeSessions.has(id) || busySessions.has(id) || item.phien.TrangThai === 'Processing') {
        errors.push({ maPhien: id, message: 'Phiên đang xử lý, chưa thể xóa.' });
      } else if (!['Completed', 'CompletedWithWarnings', 'Failed', 'Cancelled', 'Applied'].includes(item.phien.TrangThai)) {
        errors.push({ maPhien: id, message: 'Không thể xóa phiên ở trạng thái này.' });
      } else eligible.push(id);
    }
    return { removed: XepLichStore.removeMany(eligible), errors };
  };

  static validatePlan = async (session, rows, connection = db) => {
    const catalog = await WorkloadData.loadCatalog(session.phien.MaHocKy, connection);
    const resources = await WorkloadData.loadResources(session.phien.MaHocKy, connection);
    const groups = buildGroups(catalog);
    const errors = validateWorkload(rows, groups, resources.periods);
    if (errors.length) return { valid: false, conflicts: errors.map(message => ({ code: 'WORKLOAD_RULE', message })) };
    const occupancy = WorkloadData.createOccupancy(resources, catalog);
    const classMap = new Map(catalog.map(row => [row.MaLopHocPhan, row]));
    const conflicts = [];
    for (const row of rows.filter(item => item.TrangThai === 'Draft')) {
      const message = occupancy.conflict(classMap.get(row.MaLopHocPhan), dayNumber(row.NgayBatDau),
        occupancy.periodMap.get(Number(row.MaTiet)), occupancy.roomMap.get(row.MaPhong));
      if (message) conflicts.push({ code: 'SCHEDULE_CONFLICT', message: `${row.MaLopHocPhan} (${row.NgayBatDau}): ${message}` });
      occupancy.add(row);
    }
    return { valid: conflicts.length === 0, conflicts, resources };
  };

  static kiemTra = async (payload) => {
    if (!payload.maPhien) return ScheduleConstraintService.check(payload);
    const session = XepLichStore.get(payload.maPhien);
    if (!session) throw makeError('Không tìm thấy phiên xếp lịch.', 404);
    if (session.phien.PhienBanQuyTac !== RULE_VERSION) throw makeError('Phiên dùng quy tắc cũ; vui lòng tạo lại phiên để xếp đủ định mức.', 409);
    const row = session.dong.find(item => Number(item.MaDong) === Number(payload.excludeMaDong));
    if (!row) throw makeError('Không tìm thấy buổi học cần kiểm tra.', 404);
    const changed = { ...row, ThuTrongTuan: Number(payload.thuTrongTuan), MaTiet: Number(payload.maTiet),
      MaPhong: payload.maPhong, NgayBatDau: dateOnly(payload.ngayBatDau), NgayKetThuc: dateOnly(payload.ngayKetThuc) };
    const check = await this.validatePlan(session, session.dong.map(item => item === row ? changed : item));
    return { valid: check.valid, hasConflict: !check.valid, conflicts: check.conflicts };
  };

  static updateDong = async (maPhien, maDong, payload) => {
    if (busySessions.has(maPhien)) throw makeError('Phiên đang được xử lý.', 409);
    const session = XepLichStore.get(maPhien);
    if (!session) throw makeError('Không tìm thấy phiên xếp lịch.', 404);
    if (session.phien.PhienBanQuyTac !== RULE_VERSION) throw makeError('Phiên dùng quy tắc cũ; vui lòng tạo lại phiên để xếp đủ định mức.', 409);
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
    busySessions.add(maPhien);
    try {
      const changed = { ...row, ThuTrongTuan: Number(candidate.thuTrongTuan), MaTiet: Number(candidate.maTiet),
        MaPhong: candidate.maPhong, NgayBatDau: dateOnly(candidate.ngayBatDau), NgayKetThuc: dateOnly(candidate.ngayKetThuc) };
      const check = await this.validatePlan(session, session.dong.map(item => item === row ? changed : item));
      if (!check.valid) throw makeError('Vị trí lịch nháp không hợp lệ.', 409, { valid: false, conflicts: check.conflicts });
      const period = check.resources.periods.find(item => Number(item.MaTiet) === Number(candidate.maTiet));
      const room = check.resources.rooms.find(item => item.MaPhong === candidate.maPhong);

      Object.assign(row, {
        ThuTrongTuan: Number(candidate.thuTrongTuan),
        MaTiet: Number(candidate.maTiet),
        TenTiet: period.TenTiet,
        GioBatDau: period.GioBatDau,
        GioKetThuc: period.GioKetThuc,
        MaPhong: candidate.maPhong,
        TenPhong: room.TenPhong,
        MaToaNha: room.MaToaNha,
        NgayBatDau: dateOnly(candidate.ngayBatDau),
        NgayKetThuc: dateOnly(candidate.ngayKetThuc),
        NgayHoc: dateOnly(candidate.ngayBatDau),
        NguonXep: 'Manual',
        DaKhoa: payload.daKhoa ? 1 : 0,
        LyDo: []
      });
      XepLichStore.save(session);
      return { phien: session.phien, dong: session.dong };
    } finally {
      busySessions.delete(maPhien);
    }
  };

  static applyPhien = async (user, maPhien) => {
    if (busySessions.has(maPhien)) throw makeError('Phiên đang được xử lý.', 409);
    const session = XepLichStore.get(maPhien);
    if (!session) throw makeError('Không tìm thấy phiên xếp lịch.', 404);
    if (session.phien.PhienBanQuyTac !== RULE_VERSION) throw makeError('Phiên dùng quy tắc cũ; vui lòng tạo lại phiên để xếp đủ định mức.', 409);
    if (!['Completed', 'CompletedWithWarnings'].includes(session.phien.TrangThai)) {
      throw makeError('Phiên chưa hoàn tất hoặc đã được áp dụng/hủy.', 409);
    }
    const draftRows = session.dong.filter(row => row.TrangThai === 'Draft');
    if (draftRows.length === 0) throw makeError('Phiên không có dòng lịch hợp lệ để áp dụng.');

    busySessions.add(maPhien);
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();
      await conn.query('SELECT MaHocKy FROM HocKy WHERE MaHocKy = ? FOR UPDATE', [session.phien.MaHocKy]);

      const classIds = [...new Set(draftRows.map(row => row.MaLopHocPhan))];
      const placeholders = classIds.map(() => '?').join(',');
      const [scheduledRows] = await conn.query(
        `SELECT DISTINCT MaLopHocPhan FROM ThoiKhoaBieu WHERE MaLopHocPhan IN (${placeholders})`,
        classIds
      );
      if (scheduledRows.length > 0) {
        throw makeError('Một số lớp đã được xếp lịch chính thức sau khi tạo phương án.', 409, {
          maLopHocPhans: scheduledRows.map(row => row.MaLopHocPhan)
        });
      }

      const check = await this.validatePlan(session, session.dong, conn);
      if (!check.valid) throw makeError('Phương án không còn đáp ứng định mức hoặc có xung đột. Vui lòng kiểm tra lại.', 409,
        { valid: false, conflicts: check.conflicts });

      for (const row of draftRows) {
        const maThoiKhoaBieu = `TKB_AUTO_${maPhien.replace(/-/g, '').slice(0, 12)}_${row.MaDong}`;
        await conn.query(`
          INSERT INTO ThoiKhoaBieu
            (MaThoiKhoaBieu, MaLopHocPhan, ThuTrongTuan, MaTiet, MaPhong,
             NgayBatDau, NgayKetThuc, TrangThai, ThoiGianSuaDoi)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'Scheduled', NOW())
        `, [maThoiKhoaBieu, row.MaLopHocPhan, row.ThuTrongTuan, row.MaTiet,
          row.MaPhong, row.NgayBatDau, row.NgayKetThuc]);
      }
      await conn.commit();

      session.phien.TrangThai = 'Applied';
      session.phien.NguoiApDung = user?.userId || null;
      session.phien.ThoiGianApDung = now();
      XepLichStore.save(session);
      return { maPhien, soDongDaApDung: draftRows.length, soLopDaApDung: classIds.length };
    } catch (error) {
      if (conn) await conn.rollback();
      throw error;
    } finally {
      if (conn) conn.release();
      busySessions.delete(maPhien);
    }
  };

  static cancelPhien = async (maPhien) => {
    if (busySessions.has(maPhien)) throw makeError('Phiên đang được xử lý.', 409);
    const session = XepLichStore.get(maPhien);
    if (!session) throw makeError('Không tìm thấy phiên xếp lịch.', 404);
    if (session.phien.TrangThai === 'Applied') throw makeError('Không thể hủy phiên đã áp dụng.', 409);
    session.phien.TrangThai = 'Cancelled';
    session.phien.ThoiGianHuy = now();
    XepLichStore.save(session);
    return { maPhien, trangThai: 'Cancelled' };
  };
}

module.exports = XepLichService;
