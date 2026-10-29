const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const setup = () => {
  const copy = value => structuredClone(value);
  const sessions = new Map();
  const store = { get: id => sessions.has(id) ? copy(sessions.get(id)) : null,
    list: () => [...sessions.values()].map(copy), save: value => sessions.set(value.phien.MaPhien, copy(value)) };
  const current = { MaLopHocPhan: 'HP1', TenLopHocPhan: 'Example', MaHocKy: 'HK1', MaBoMon: 'BM1',
    MaGiangVien: 'GV1', LoaiHoc: 'LT', SoTinChi: 2, TrangThaiPhanCong: 'Assigned', NgayBatDau: '2026-10-05', NgayKetThuc: '2026-10-12' };
  const schedules = []; const lessons = []; const mutations = []; const notifications = []; const extraClasses = [];
  let failNotification = false; let noRecipients = false; let failLesson = false; let checkValid = true; let rollbackCount = 0; let commitCount = 0; let snapshot;
  const query = async (sql, args = []) => {
    const normalized = sql.replace(/\s+/g, ' ').trim();
    if (/^(INSERT|UPDATE|DELETE)/.test(normalized)) mutations.push(normalized);
    if (normalized.includes('COUNT(DISTINCT tkb.MaThoiKhoaBieu) AS SoBuoiDaXep')) return [[copy(current)]];
    if (normalized.startsWith('SELECT MaLopHocPhan, TenLopHocPhan, NgayBatDau')) return [[copy(current)]];
    if (normalized.startsWith('SELECT MaHocKy FROM LopHocPhan')) return [[{ MaHocKy: current.MaHocKy }]];
    if (normalized.startsWith('SELECT MaHocKy FROM HocKy')) return [[{ MaHocKy: current.MaHocKy }]];
    if (normalized.includes('FROM LopHocPhan lhp LEFT JOIN GiangVien')) return [[copy(current)]];
    if (normalized.startsWith('SELECT lhp.MaLopHocPhan, lhp.TenLopHocPhan, lhp.MaBoMon')) return [[current, ...extraClasses].filter(row => args.includes(row.MaLopHocPhan)).map(copy)];
    if (normalized.startsWith('SELECT MaLopHocPhan, MaBoMon, TrangThaiPhanCong')) return [[copy(current)]];
    if (normalized.startsWith('SELECT MaTiet, TenTiet')) return [[{ MaTiet: args[0], TenTiet: 'Tiet 1-3', GioBatDau: '07:00:00', GioKetThuc: '09:25:00' }]];
    if (normalized.startsWith('SELECT MaPhong, TenPhong')) return [[{ MaPhong: args[0], TenPhong: args[0] }]];
    if (normalized.startsWith('SELECT MaBuoiHoc FROM BuoiHoc')) return [copy(lessons)];
    if (normalized.startsWith('SELECT UserId FROM Users')) return [noRecipients ? [] : [{ UserId: `USER_${args[0]}` }]];
    if (normalized.startsWith('SELECT gv.UserId')) return [noRecipients ? [] : [{ UserId: `USER_${args[0]}` }]];
    if (normalized.startsWith('SELECT MaThongBao FROM ThongBao')) return [notifications.filter(row => row.UserId === args[0] && row.LoaiThongBao === args[1] && row.MaDoiTuongLienQuan === args[2]).map(copy)];
    if (normalized.startsWith('INSERT INTO ThongBao')) {
      if (failNotification) throw new Error('notification insert failed');
      notifications.push({ MaThongBao: args[0], UserId: args[1], TieuDe: args[2], NoiDung: args[3], LoaiThongBao: args[4], MaDoiTuongLienQuan: args[5] }); return [{}];
    }
    if (normalized.startsWith('SELECT COUNT(*) as count FROM BuoiHoc')) return [[{ count: lessons.length }]];
    if (normalized.startsWith('SELECT') && normalized.includes('FROM ThoiKhoaBieu')) return [copy(schedules)];
    if (normalized.startsWith('INSERT INTO ThoiKhoaBieu')) {
      schedules.push({ MaThoiKhoaBieu: args[0], MaLopHocPhan: args[1], ThuTrongTuan: args[2], MaTiet: args[3],
        MaPhong: args[4], NgayBatDau: args[5], NgayKetThuc: args[6] }); return [{}];
    }
    if (normalized.startsWith('INSERT INTO BuoiHoc')) { if (failLesson) throw new Error('lesson insert failed'); lessons.push(args); return [{}]; }
    if (normalized.startsWith('UPDATE LopHocPhan')) { current.TrangThaiPhanCong = 'Locked'; return [{}]; }
    if (normalized.startsWith('UPDATE ThoiKhoaBieu')) return [{}];
    throw new Error(`Unexpected SQL: ${normalized}`);
  };
  const conn = { query, beginTransaction: async () => { snapshot = copy({ current, schedules, lessons, notifications }); },
    commit: async () => { commitCount++; }, rollback: async () => {
      rollbackCount++; Object.assign(current, snapshot.current);
      notifications.splice(0, notifications.length, ...snapshot.notifications);
      schedules.splice(0, schedules.length, ...snapshot.schedules); lessons.splice(0, lessons.length, ...snapshot.lessons);
    }, release() {} };
  const db = { query, getConnection: async () => conn };
  const constraints = { check: async () => ({ valid: checkValid, conflicts: checkValid ? [] : [{ code: 'CONFLICT' }], context: { tietHoc: { TenTiet: 'Tiet 1-3' } } }) };
  const load = (file, mocks) => {
    const filename = path.resolve(__dirname, '../src', file); const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(filename, 'utf8'), { module, console, setImmediate,
      require: id => Object.hasOwn(mocks, id) ? mocks[id] : require(id) }, { filename });
    return module.exports;
  };
  const notificationService = load('services/thongbao.service.js', { '../../config/db': db });
  const approval = load('modules/xeplich/xeplich.approval.js', {
    '../../services/thongbao.service': notificationService, './weeklySchedule': require('../src/modules/xeplich/weeklySchedule'),
    '../../../config/db': db, './xeplich.store': store, './scheduleConstraint.service': constraints
  });
  const automatic = load('modules/xeplich/xeplich.service.js', { '../../../config/db': db,
    './xeplich.store': store, './xeplich.approval': approval, './scheduleConstraint.service': constraints,
    './xeplich.config': {}, './weeklySchedule': require('../src/modules/xeplich/weeklySchedule') });
  const service = load('services/thoikhoabieu.service.js', {
    '../../config/db': db, '../modules/xeplich/scheduleConstraint.service': constraints,
    '../modules/xeplich/xeplich.approval': approval, '../modules/xeplich/xeplich.config': { getBlockedDates: () => new Set() }
  });
  store.save({ phien: { MaPhien: 'SESSION', MaHocKy: 'HK1', TrangThai: 'Completed' }, dong: [
    { MaDong: 1, MaLopHocPhan: 'HP1', TrangThai: 'Draft', ThuTrongTuan: 2, MaTiet: 1, MaPhong: 'P1',
      NgayBatDau: '2026-10-05', NgayKetThuc: '2026-10-12' }
  ] });
  return { approval, automatic, notifications, addClass: row => extraClasses.push(row),
    failNotification: value => { failNotification = value; }, noRecipients: () => { noRecipients = true; }, service, store, failLesson: () => { failLesson = true; }, current, schedules, lessons, mutations, setInvalid: () => { checkValid = false; },
    rollbackCount: () => rollbackCount, commitCount: () => commitCount };
};
const admin = { role: 'ADMIN', userId: 'ADMIN1' };
const department = { role: 'BOMON', username: 'BM1', userId: 'DEPT1' };

test('submission notifies department without creating official schedules or lessons', async () => {
  const env = setup();
  const result = await env.automatic.applyPhien(admin, 'SESSION');
  assert.equal(result.trangThai, 'PendingAssignment');
  assert.equal(env.store.get('SESSION').phien.TrangThai, 'PendingAssignment');
  assert.equal(env.store.get('SESSION').phien.XacNhanLop.HP1, undefined);
  assert.ok(env.mutations.every(sql => sql.startsWith('INSERT INTO ThongBao'))); assert.equal(env.schedules.length, 0); assert.equal(env.lessons.length, 0);
});

test('locking a draft without an assigned lecturer rolls back with no schedule or lesson', async () => {
  const env = setup(); await env.approval.submit(admin, 'SESSION'); env.current.MaGiangVien = null;
  await assert.rejects(env.service.lockScheduleForClass({ maLopHocPhan: 'HP1' }));
  assert.equal(env.schedules.length, 0); assert.equal(env.lessons.length, 0); assert.equal(env.rollbackCount(), 1);
});

test('assigned draft without a confirmation creates schedules and lessons only when locked', async () => {
  const env = setup(); await env.approval.submit(admin, 'SESSION'); 
  await env.service.lockScheduleForClass({ maLopHocPhan: 'HP1' });
  assert.equal(env.schedules.length, 1); assert.equal(env.lessons.length, 2);
  assert.equal(env.current.TrangThaiPhanCong, 'Locked'); assert.equal(env.commitCount(), 2);
  await env.service.lockScheduleForClass({ maLopHocPhan: 'HP1' });
  assert.equal(env.lessons.length, 2); assert.equal(env.schedules.length, 1);
});

test('another department cannot see the draft while assigned classes are ready to lock', async () => {
  const env = setup(); await env.approval.submit(admin, 'SESSION');
  const rows = await env.approval.list({ ...department, username: 'BM2' }, 'HK1'); assert.equal(rows.length, 0);
  const own = await env.approval.list(department, 'HK1'); assert.equal(own[0].DaPhanCong, true);
});

test('changing assigned lecturer does not require separate confirmation, and removing assignment blocks lock', async () => {
  const env = setup(); await env.approval.submit(admin, 'SESSION');
  env.current.MaGiangVien = 'GV2'; await env.service.lockScheduleForClass({ maLopHocPhan: 'HP1' });
  assert.equal(env.lessons.length, 2); assert.equal(env.lessons[0][2], 'GV2');
  const other = setup(); await other.approval.submit(admin, 'SESSION'); other.current.MaGiangVien = null;
  await assert.rejects(other.service.lockScheduleForClass({ maLopHocPhan: 'HP1' }));
});

test('conflict introduced after submission blocks locking and rolls back all DB writes', async () => {
  const env = setup(); await env.approval.submit(admin, 'SESSION'); 
  env.setInvalid(); await assert.rejects(env.service.lockScheduleForClass({ maLopHocPhan: 'HP1' }));
  assert.equal(env.schedules.length, 0); assert.equal(env.lessons.length, 0);
  assert.equal(env.current.TrangThaiPhanCong, 'Assigned'); assert.equal(env.rollbackCount(), 1);
});

test('missing lecturer blocks locking; retry remains idempotent and manual publication is rejected', async () => {
  const env = setup(); await env.approval.submit(admin, 'SESSION'); env.current.MaGiangVien = null;
  await assert.rejects(env.service.lockScheduleForClass({ maLopHocPhan: 'HP1' }));
  await env.approval.submit(admin, 'SESSION');
  assert.equal(env.notifications.length, 1);
  await assert.rejects(env.service.saveSchedules({ maLopHocPhan: 'HP1', schedules: [] }));
  assert.ok(env.mutations.every(sql => sql.startsWith('INSERT INTO ThongBao')));
});


test('failure while generating lessons rolls back the newly materialized official schedule', async () => {
  const env = setup(); await env.approval.submit(admin, 'SESSION'); 
  env.failLesson(); await assert.rejects(env.service.lockScheduleForClass({ maLopHocPhan: 'HP1' }));
  assert.ok(env.mutations.some(sql => sql.startsWith('INSERT INTO ThoiKhoaBieu')));
  assert.equal(env.schedules.length, 0); assert.equal(env.lessons.length, 0);
  assert.equal(env.current.TrangThaiPhanCong, 'Assigned'); assert.equal(env.rollbackCount(), 1);
});


test('submission notifies each target department once and retry does not duplicate read/unread links', async () => {
  const env = setup();
  env.addClass({ ...env.current, MaLopHocPhan: 'HP2', MaBoMon: 'BM2' });
  const session = env.store.get('SESSION');
  session.dong.push({ ...session.dong[0], MaDong: 2, MaLopHocPhan: 'HP2' }); env.store.save(session);
  const sent = await env.approval.submit(admin, 'SESSION');
  assert.equal(sent.canhBaoThongBao.length, 0); assert.equal(env.notifications.length, 2);
  assert.deepEqual(env.notifications.map(row => row.UserId).sort(), ['USER_BM1', 'USER_BM2']);
  assert.ok(env.notifications.every(row => row.MaDoiTuongLienQuan.length <= 30));
  await env.approval.submit(admin, 'SESSION'); assert.equal(env.notifications.length, 2);
  const reference = env.notifications[0].MaDoiTuongLienQuan;
  const target = await env.approval.resolveNotification(department, reference);
  assert.equal(target.maPhien, 'SESSION'); assert.equal(target.maHocKy, 'HK1');
  await assert.rejects(env.approval.resolveNotification({ ...department, username: 'BM3' }, reference), error => error.status === 403);
});

test('notification failure preserves draft and returns warning, then supports retry', async () => {
  const env = setup(); env.failNotification(true);
  const result = await env.approval.submit(admin, 'SESSION');
  assert.equal(result.canhBaoThongBao.length, 1);
  assert.equal(env.store.get('SESSION').phien.TrangThai, 'PendingAssignment');
  assert.equal(env.notifications.length, 0); assert.equal(env.schedules.length, 0);
  env.failNotification(false);
  const retry = await env.approval.submit(admin, 'SESSION');
  assert.equal(retry.canhBaoThongBao.length, 0); assert.equal(env.notifications.length, 1);
});

test('no active recipient is surfaced as a notification warning', async () => {
  const env = setup(); env.noRecipients();
  const result = await env.approval.submit(admin, 'SESSION');
  assert.equal(result.canhBaoThongBao.length, 1); assert.equal(env.notifications.length, 0);
});

test('department can remove its pending draft and then lock cannot publish that removed draft', async () => {
  const env = setup(); await env.approval.submit(admin, 'SESSION'); 
  await env.approval.removeClassDraft(department, 'SESSION', 'HP1');
  const session = env.store.get('SESSION');
  assert.equal(session.dong.length, 0); assert.equal(session.phien.TrangThai, 'Cancelled');
  assert.equal(session.phien.SoLopDaXep, 0); assert.equal(session.phien.XacNhanLop.HP1, undefined);
  assert.equal(env.current.MaGiangVien, 'GV1'); assert.equal(env.lessons.length, 0); assert.equal(env.schedules.length, 0);
  await assert.rejects(env.service.lockScheduleForClass({ maLopHocPhan: 'HP1' }));
});

test('other department cannot delete a draft and locked or official classes are protected', async () => {
  const env = setup(); await env.approval.submit(admin, 'SESSION');
  await assert.rejects(env.approval.removeClassDraft({ ...department, username: 'BM2' }, 'SESSION', 'HP1'), error => error.status === 403);
  env.current.TrangThaiPhanCong = 'Locked';
  await assert.rejects(env.approval.removeClassDraft(admin, 'SESSION', 'HP1'));
  env.current.TrangThaiPhanCong = 'Assigned'; env.schedules.push({ MaThoiKhoaBieu: 'OFFICIAL' });
  await assert.rejects(env.approval.removeClassDraft(admin, 'SESSION', 'HP1'));
  env.schedules.length = 0; env.lessons.push(['EXISTING']);
  await assert.rejects(env.approval.removeClassDraft(admin, 'SESSION', 'HP1'));
  assert.equal(env.store.get('SESSION').dong.length, 1); assert.equal(env.lessons.length, 1);
});

test('deleting an unsubmitted class draft leaves other classes intact', async () => {
  const env = setup();
  const session = env.store.get('SESSION'); session.dong.push({ ...session.dong[0], MaDong: 2, MaLopHocPhan: 'HP2' }); env.store.save(session);
  await env.approval.removeClassDraft(admin, 'SESSION', 'HP1');
  const remaining = env.store.get('SESSION'); assert.equal(remaining.dong.length, 1);
  assert.equal(remaining.dong[0].MaLopHocPhan, 'HP2'); assert.equal(remaining.phien.SoLopDaXep, 1);
  assert.equal(remaining.phien.TrangThai, 'Completed');
});


test('editing the whole pending weekly template updates JSON only and P?T table exposes it', async () => {
  const env = setup(); await env.approval.submit(admin, 'SESSION');
  await env.approval.updateClassDraft(admin, 'SESSION', 'HP1', [{ thuTrongTuan: 4, maTiet: 1, maPhong: 'P2', ngayBatDau: '2026-10-05', ngayKetThuc: '2026-10-12' }]);
  const pending = env.approval.draftMap().get('HP1');
  assert.equal(pending.maPhien, 'SESSION'); assert.equal(pending.rows[0].MaPhong, 'P2');
  assert.equal(env.schedules.length, 0); assert.equal(env.lessons.length, 0);
  const table = await env.service.getAll({ maHocKy: 'HK1', filterStatus: 'SCHEDULED', maPhong: 'P2' });
  assert.equal(table.length, 1); assert.equal(table[0].isDraftSchedule, true);
  assert.equal(table[0].MaPhienNhap, 'SESSION'); assert.equal(table[0].hasSchedule, true);
  await assert.rejects(env.approval.updateClassDraft(department, 'SESSION', 'HP1', []), error => error.status === 403);
});

test('three-credit LT draft with only one weekly session cannot be submitted', async () => {
  const env = setup(); env.current.SoTinChi = 3;
  await assert.rejects(env.approval.submit(admin, 'SESSION'));
  assert.equal(env.store.get('SESSION').phien.TrangThai, 'Completed');
});


test('legacy pending sessions no longer require an explicit confirmation to lock', async () => {
  const env = setup(); await env.approval.submit(admin, 'SESSION');
  const session = env.store.get('SESSION'); session.phien.TrangThai = 'PendingConfirmation'; session.phien.XacNhanLop = {}; env.store.save(session);
  await env.service.lockScheduleForClass({ maLopHocPhan: 'HP1' });
  assert.equal(env.lessons.length, 2);
});
