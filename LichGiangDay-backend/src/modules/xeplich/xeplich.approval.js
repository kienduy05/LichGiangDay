const crypto = require('crypto');
const notifications = require('../../services/thongbao.service');
const db = require('../../../config/db');
const store = require('./xeplich.store');
const constraints = require('./scheduleConstraint.service');
const { validateWeekly } = require('./weeklySchedule');
const pendingStates = ['PendingAssignment', 'PendingConfirmation', 'Confirmed'];
const busy = new Set();
const fail = (message, status = 409) => Object.assign(new Error(message), { status });
const drafts = session => session.dong.filter(row => row.TrangThai === 'Draft');
const ids = session => [...new Set(drafts(session).map(row => row.MaLopHocPhan))];
const loadClasses = async (session, connection = db) => {
  const classIds = ids(session);
  if (!classIds.length) throw fail('Phiên không có lịch nháp.');
  const [rows] = await connection.query(`SELECT lhp.MaLopHocPhan, lhp.TenLopHocPhan, lhp.MaBoMon, lhp.MaHocKy,
    lhp.MaGiangVien, lhp.TrangThaiPhanCong, lhp.LoaiHoc, lhp.NgayBatDau, lhp.NgayKetThuc, mh.SoTinChi
    FROM LopHocPhan lhp JOIN MonHoc mh ON mh.MaMonHoc = lhp.MaMonHoc
    WHERE lhp.MaLopHocPhan IN (${classIds.map(() => '?').join(',')})`, classIds);
  if (rows.length !== classIds.length || rows.some(row => row.MaHocKy !== session.phien.MaHocKy)) throw fail('Lớp hoặc học kỳ đã thay đổi, cần tạo lại nháp.');
  if (session.phien.LopChoDuyet && rows.some(row => session.phien.LopChoDuyet.find(item => item.MaLopHocPhan === row.MaLopHocPhan)?.MaBoMon !== row.MaBoMon)) throw fail('Bộ môn quản lý lớp đã thay đổi, cần gửi lại nháp.');
  return rows;
};
const validate = async (session, rows, connection = db) => {
  const classes = await loadClasses(session, connection);
  const checked = [];
  for (const row of rows) {
    const result = await constraints.check({ maLopHocPhan: row.MaLopHocPhan, thuTrongTuan: row.ThuTrongTuan,
      maTiet: row.MaTiet, maPhong: row.MaPhong, ngayBatDau: row.NgayBatDau, ngayKetThuc: row.NgayKetThuc,
      maPhien: session.phien.MaPhien, excludeMaDong: row.MaDong, draftRowsOverride: session.dong }, connection);
    if (!result.valid) throw Object.assign(fail(`Lịch lớp '${row.MaLopHocPhan}' có xung đột, cần kiểm tra lại nháp.`), { metadata: result });
    checked.push({ ...row, ...result.context?.tietHoc });
  }
  for (const member of classes) {
    const own = checked.filter(row => row.MaLopHocPhan === member.MaLopHocPhan);
    if (!own.length) continue;
    const errors = validateWeekly(member, own);
    if (errors.length) throw Object.assign(fail(errors.join(' ')), { metadata: { conflicts: errors.map(message => ({ code: 'WEEKLY_RULE', message })) } });
  }
};
const pendingForClass = id => store.list().filter(session => pendingStates.includes(session.phien.TrangThai)
  && drafts(session).some(row => row.MaLopHocPhan === id));
const run = async (id, work) => {
  if (busy.has(id)) throw fail('Phiên đang được xử lý.');
  busy.add(id); try { return await work(); } finally { busy.delete(id); }
};
const notifyDepartments = async session => {
  const departments = [...new Set(session.phien.LopChoDuyet.map(row => row.MaBoMon))];
  session.phien.ThongBaoBoMon ||= {};
  const warnings = [];
  for (const department of departments) {
    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();
      const count = session.phien.LopChoDuyet.filter(row => row.MaBoMon === department).length;
      const sent = await notifications.notifyBoMon(department, {
        tieuDe: 'Lịch nháp mới cần phân công giảng viên',
        noiDung: `Học kỳ ${session.phien.MaHocKy}: có ${count} lớp học phần chờ phân công giảng viên. Sau phân công, Phòng Đào tạo có thể khóa lịch. Mở Phân công giảng viên để kiểm tra.`,
        loaiThongBao: 'ScheduleDraft', maDoiTuongLienQuan: session.phien.MaLienKetThongBao,
        deduplicate: true
      }, connection);
      if (!sent.length) throw new Error('Không tìm thấy tài khoản bộ môn/trưởng bộ môn đang hoạt động.');
      await connection.commit();
      session.phien.ThongBaoBoMon[department] = { DaGui: true, ThoiGianGui: new Date().toISOString() };
    } catch (error) {
      if (connection) await connection.rollback();
      session.phien.ThongBaoBoMon[department] = { DaGui: false, Loi: error.message };
      warnings.push(`Bộ môn ${department}: ${error.message}`);
    } finally { connection?.release(); }
  }
  store.save(session);
  return warnings;
};
const sendResult = (session, warnings) => ({ maPhien: session.phien.MaPhien,
  trangThai: session.phien.TrangThai, soLopChoDuyet: ids(session).length, canhBaoThongBao: warnings });

class XepLichApproval {
  static isBusy = id => busy.has(id);
  static pendingStates = pendingStates;
  static pendingForClass = pendingForClass;
  static submit = async (user, id) => run(id, async () => {
    if (!['ADMIN', 'PHONGDAOTAO', 'BOMON'].includes(user?.role)) throw fail('Không có quyền gửi lịch nháp.', 403);
    const session = store.get(id);
    if (!session) throw fail('Không tìm thấy phiên.', 404);
    const retry = pendingStates.includes(session.phien.TrangThai);
    if (!retry && !['Completed', 'CompletedWithWarnings'].includes(session.phien.TrangThai)) throw fail('Chỉ gửi được phiên nháp đã chạy xong.');
    const classes = await loadClasses(session);
    if (user.role === 'BOMON' && classes.some(row => row.MaBoMon !== user.username)) throw fail('Chỉ được gửi lớp thuộc bộ môn của bạn.', 403);
    if (retry) {
      session.phien.MaLienKetThongBao ||= `XLS_${crypto.randomBytes(12).toString('hex')}`;
      store.save(session);
      return sendResult(session, await notifyDepartments(session));
    }
    if (classes.some(row => row.TrangThaiPhanCong === 'Locked')) throw fail('Có lớp đã khóa lịch.');
    for (const row of classes) if (pendingForClass(row.MaLopHocPhan).some(other => other.phien.MaPhien !== id)) throw fail(`Lớp '${row.MaLopHocPhan}' đã có nháp đang chờ duyệt.`);
    const [existing] = await db.query(`SELECT MaLopHocPhan FROM ThoiKhoaBieu WHERE MaLopHocPhan IN (${classes.map(() => '?').join(',')})`, classes.map(row => row.MaLopHocPhan));
    if (existing.length) throw fail('Có lớp đã có thời khóa biểu; không thể gửi nháp thay thế.');
    await validate(session, drafts(session));
    for (const row of classes) if (pendingForClass(row.MaLopHocPhan).some(other => other.phien.MaPhien !== id)) throw fail(`Lớp '${row.MaLopHocPhan}' đã có nháp chờ duyệt.`);
    session.phien.TrangThai = 'PendingAssignment';
    session.phien.NguoiGuiDuyet = user.userId;
    session.phien.ThoiGianGuiDuyet = new Date().toISOString();
    session.phien.LopChoDuyet = classes.map(row => ({ MaLopHocPhan: row.MaLopHocPhan, MaBoMon: row.MaBoMon }));
    session.phien.XacNhanLop = {};
    session.phien.MaLienKetThongBao = `XLS_${crypto.randomBytes(12).toString('hex')}`;
    store.save(session);
    return sendResult(session, await notifyDepartments(session));
  });
  static list = async (user, maHocKy) => {
    if (!['ADMIN', 'PHONGDAOTAO', 'BOMON'].includes(user?.role)) throw fail('Không có quyền xem lịch chờ phân công/khóa.', 403);
    if (!maHocKy) throw fail('Vui lòng chọn học kỳ.', 400);
    const result = [];
    for (const session of store.list().filter(item => item.phien.MaHocKy === maHocKy && pendingStates.includes(item.phien.TrangThai))) {
      const classes = await loadClasses(session);
      for (const row of classes) {
        if (user.role === 'BOMON' && row.MaBoMon !== user.username) continue;
        if (row.TrangThaiPhanCong === 'Locked') continue;
        result.push({ ...row, MaPhien: session.phien.MaPhien,
          CanGuiLaiThongBao: !session.phien.ThongBaoBoMon?.[row.MaBoMon]?.DaGui,
          LoiThongBao: session.phien.ThongBaoBoMon?.[row.MaBoMon]?.Loi || null,
          DaPhanCong: Boolean(row.MaGiangVien),
          dong: drafts(session).filter(item => item.MaLopHocPhan === row.MaLopHocPhan) });
      }
    }
    return result;
  };
  static draftMap = () => {
    const map = new Map();
    for (const session of store.list().filter(item => pendingStates.includes(item.phien.TrangThai))) {
      for (const id of ids(session)) {
        if (map.has(id)) throw fail(`Lớp '${id}' có nhiều nháp đang xử lý.`);
        map.set(id, { maPhien: session.phien.MaPhien, rows: drafts(session).filter(row => row.MaLopHocPhan === id) });
      }
    }
    return map;
  };
  static draftForClass = classId => {
    const matches = pendingForClass(classId);
    if (matches.length > 1) throw fail('Lớp có nhiều nháp đang xử lý.');
    if (!matches.length) return null;
    return { maPhien: matches[0].phien.MaPhien, rows: drafts(matches[0]).filter(row => row.MaLopHocPhan === classId) };
  };
  static updateClassDraft = async (user, id, classId, schedules) => run(id, async () => {
    if (!['ADMIN', 'PHONGDAOTAO'].includes(user?.role)) throw fail('Chỉ ADMIN/Phòng Đào tạo được sửa mẫu lịch.', 403);
    const session = store.get(id);
    if (!session || !pendingStates.includes(session.phien.TrangThai)) throw fail('Không có nháp đã gửi bộ môn để chỉnh sửa.');
    const classes = await loadClasses(session);
    const member = classes.find(row => row.MaLopHocPhan === classId);
    if (!member || member.TrangThaiPhanCong === 'Locked') throw fail('Lớp không thuộc phiên hoặc đã khóa.');
    const [existing] = await db.query('SELECT MaThoiKhoaBieu FROM ThoiKhoaBieu WHERE MaLopHocPhan = ? LIMIT 1', [classId]);
    if (existing.length) throw fail('Lớp đã có lịch chính thức, không sửa nháp cũ.');
    if (!Array.isArray(schedules) || !schedules.length || schedules.length > 2) throw fail('Danh sách mẫu tuần không hợp lệ.', 400);
    session.nextRowId = Math.max(Number(session.nextRowId) || 1, ...session.dong.map(row => Number(row.MaDong) + 1));
    const replacements = [];
    for (const slot of schedules) {
      const [[period]] = await db.query('SELECT MaTiet, TenTiet, GioBatDau, GioKetThuc FROM TietHoc WHERE MaTiet = ?', [slot.maTiet]);
      const [[room]] = await db.query('SELECT MaPhong, TenPhong, MaToaNha FROM PhongHoc WHERE MaPhong = ?', [slot.maPhong]);
      if (!period || !room) throw fail('Ca hoặc phòng không tồn tại.', 400);
      replacements.push({ ...period, ...room, MaDong: session.nextRowId++, MaPhien: id,
        MaLopHocPhan: classId, TenLopHocPhan: member.TenLopHocPhan, LoaiHoc: member.LoaiHoc,
        ThuTrongTuan: Number(slot.thuTrongTuan), NgayBatDau: String(slot.ngayBatDau || '').slice(0, 10),
        NgayKetThuc: String(slot.ngayKetThuc || '').slice(0, 10), TrangThai: 'Draft', SoTiet: 3, NguonXep: 'Manual', LyDo: [] });
    }
    session.dong = [...session.dong.filter(row => row.MaLopHocPhan !== classId), ...replacements];
    await validate(session, replacements);
    session.phien.TrangThai = 'PendingAssignment';
    store.save(session);
    return { maPhien: id, maLopHocPhan: classId };
  });
  static resolveNotification = async (user, reference) => {
    if (!['ADMIN', 'PHONGDAOTAO', 'BOMON'].includes(user?.role)) throw fail('Không có quyền xem nháp.', 403);
    const session = store.list().find(item => item.phien.MaLienKetThongBao === reference);
    if (!session) throw fail('Lịch nháp không còn tồn tại.', 404);
    if (user.role === 'BOMON' && !session.phien.LopChoDuyet?.some(row => row.MaBoMon === user.username)
      && !session.phien.ThongBaoBoMon?.[user.username]) throw fail('Nháp không thuộc bộ môn của bạn.', 403);
    return { maPhien: session.phien.MaPhien, maHocKy: session.phien.MaHocKy };
  };
  static removeClassDraft = async (user, id, classId) => run(id, async () => {
    if (!['ADMIN', 'PHONGDAOTAO', 'BOMON'].includes(user?.role)) throw fail('Không có quyền xóa lịch nháp.', 403);
    const session = store.get(id);
    if (!session) throw fail('Không tìm thấy phiên nháp.', 404);
    if (!['Completed', 'CompletedWithWarnings', 'Failed', ...pendingStates].includes(session.phien.TrangThai)) throw fail('Không được xóa nháp ở trạng thái này.');
    if (!drafts(session).some(row => row.MaLopHocPhan === classId)) throw fail('Không tìm thấy lịch nháp của lớp.', 404);
    const connection = await db.getConnection();
    let saved = false;
    try {
      await connection.beginTransaction();
      const [[term]] = await connection.query('SELECT MaHocKy FROM LopHocPhan WHERE MaLopHocPhan = ?', [classId]);
      if (!term) throw fail('Lớp học phần không tồn tại.', 404);
      await connection.query('SELECT MaHocKy FROM HocKy WHERE MaHocKy = ? FOR UPDATE', [term.MaHocKy]);
      const [[target]] = await connection.query('SELECT MaLopHocPhan, MaBoMon, TrangThaiPhanCong FROM LopHocPhan WHERE MaLopHocPhan = ? FOR UPDATE', [classId]);
      if (!target) throw fail('Lớp học phần không tồn tại.', 404);
      if (user.role === 'BOMON' && target.MaBoMon !== user.username) throw fail('Không được xóa nháp của bộ môn khác.', 403);
      if (target.TrangThaiPhanCong === 'Locked') throw fail('Lớp đã khóa, không được xóa lịch nháp.');
      const [official] = await connection.query('SELECT MaThoiKhoaBieu FROM ThoiKhoaBieu WHERE MaLopHocPhan = ? LIMIT 1', [classId]);
      const [lessons] = await connection.query('SELECT MaBuoiHoc FROM BuoiHoc WHERE MaLopHocPhan = ? LIMIT 1', [classId]);
      if (official.length || lessons.length) throw fail('Lớp đã có lịch chính thức hoặc buổi học, không được xóa nháp.');
      const updated = store.get(id);
      updated.dong = updated.dong.filter(row => row.MaLopHocPhan !== classId);
      if (updated.phien.LopChoDuyet) updated.phien.LopChoDuyet = updated.phien.LopChoDuyet.filter(row => row.MaLopHocPhan !== classId);
      if (updated.phien.XacNhanLop) delete updated.phien.XacNhanLop[classId];
      if (updated.phien.TuyChon?.maLopHocPhans) updated.phien.TuyChon.maLopHocPhans = updated.phien.TuyChon.maLopHocPhans.filter(value => value !== classId);
      const statuses = new Map(updated.dong.map(row => [row.MaLopHocPhan, row.TrangThai]));
      updated.phien.TongSoLop = statuses.size;
      updated.phien.SoLopDaXuLy = statuses.size;
      updated.phien.SoLopDaXep = [...statuses.values()].filter(value => value === 'Draft').length;
      updated.phien.SoLopKhongXep = [...statuses.values()].filter(value => value === 'Unscheduled').length;
      updated.phien.SoLopThieuDuLieu = [...statuses.values()].filter(value => value === 'MissingData').length;
      if (!drafts(updated).length) updated.phien.TrangThai = 'Cancelled';
      else if (pendingStates.includes(updated.phien.TrangThai)) updated.phien.TrangThai = 'PendingAssignment';
      store.save(updated); saved = true;
      await connection.commit();
      return { maPhien: id, maLopHocPhan: classId, trangThai: updated.phien.TrangThai };
    } catch (error) {
      await connection.rollback();
      if (saved) store.save(session);
      throw error;
    } finally { connection.release(); }
  });

  static acquireLockLease = classId => {
    const matches = pendingForClass(classId);
    if (!matches.length) return null;
    if (matches.length !== 1) throw fail('Lớp có nhiều nháp đang xử lý.');
    const id = matches[0].phien.MaPhien;
    if (busy.has(id)) throw fail('Phiên đang được sửa hoặc xử lý, vui lòng thử khóa lại sau.');
    busy.add(id);
    return { id, release: () => busy.delete(id) };
  };
  // Called only by the schedule-lock transaction. No schedule is written by submit/confirm.
  static materializeForLock = async (classRow, connection, leaseId = null) => {
    const matches = pendingForClass(classRow.MaLopHocPhan);
    if (!matches.length) return null;
    if (matches.length !== 1) throw fail('Có nhiều nháp chờ duyệt cho lớp; cần xử lý phiên trùng trước khi khóa.');
    const session = matches[0];
    if (busy.has(session.phien.MaPhien) && leaseId !== session.phien.MaPhien) throw fail('Phiên đang được xử lý, vui lòng thử khóa lại sau.');
    if (!classRow.MaGiangVien) throw fail('Bộ môn cần phân công giảng viên trước khi PĐT khóa lịch.');
    await loadClasses(session, connection);
    const [existing] = await connection.query('SELECT MaThoiKhoaBieu FROM ThoiKhoaBieu WHERE MaLopHocPhan = ?', [classRow.MaLopHocPhan]);
    if (existing.length) throw fail('Lớp đã có lịch khác sau khi gửi duyệt; không thể khóa nháp cũ.');
    const rows = drafts(session).filter(row => row.MaLopHocPhan === classRow.MaLopHocPhan);
    await validate(session, rows, connection);
    for (const row of rows) {
      await connection.query(`INSERT INTO ThoiKhoaBieu
        (MaThoiKhoaBieu, MaLopHocPhan, ThuTrongTuan, MaTiet, MaPhong, NgayBatDau, NgayKetThuc, TrangThai, ThoiGianBoMonXacNhan, ThoiGianSuaDoi)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Locked', NULL, NOW())`,
      [`TKB_AUTO_${session.phien.MaPhien.replace(/-/g, '').slice(0, 12)}_${row.MaDong}`, row.MaLopHocPhan,
        row.ThuTrongTuan, row.MaTiet, row.MaPhong, row.NgayBatDau, row.NgayKetThuc]);
    }
    return session.phien.MaPhien;
  };
}
module.exports = XepLichApproval;
