const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

const setup = ({ query, check, loadCatalog, loadResources, getConnection } = {}) => {
  const sessions = new Map();
  const copy = value => value ? structuredClone(value) : value;
  const store = {
    get: id => copy(sessions.get(id)),
    list: () => [...sessions.values()].map(copy),
    save: session => sessions.set(session.phien.MaPhien, copy(session)),
    remove: id => sessions.delete(id),
    removeMany: ids => ids.filter(id => sessions.delete(id))
  };
  const filename = path.resolve(__dirname, '../src/modules/xeplich/xeplich.service.js');
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module,
    setImmediate,
    require: id => {
      if (id === '../../../config/db') return { query, getConnection };
      if (id === './xeplich.store') return store;
      if (id === './scheduleConstraint.service') return { check };
      if (id === './workloadData.service') return { ...require('../src/modules/xeplich/workloadData.service'), loadCatalog: loadCatalog || (async () => []), loadResources: loadResources || (async () => ({ rooms: [], periods: [], official: [], lessons: [], links: [] })) };
      if (id === './workloadSolver' || id === './workloadRules') return require('../src/modules/xeplich/' + id.slice(2));
      if (id === './xeplich.config') return require('../src/modules/xeplich/xeplich.config');
      return require(id);
    }
  }, { filename });
  store.save({
    phien: {
      MaPhien: 'session', TrangThai: 'Processing', TongSoLop: 1,
      TuyChon: { maLopHocPhans: ['HP1'] }
    },
    dong: [], nextRowId: 1
  });
  return { service: module.exports, store };
};

test('a saved Processing session without a running worker becomes Failed', async () => {
  const { service, store } = setup();
  const result = await service.getPhien('session');
  assert.equal(result.phien.TrangThai, 'Failed');
  assert.ok(result.phien.LoiHeThong);
  assert.equal(store.get('session').phien.TrangThai, 'Failed');
  await service.cancelPhien('session');
  assert.equal(store.get('session').phien.TrangThai, 'Cancelled');
});

test('cancelling during a metadata query stops before any further work', async () => {
  const pending = deferred();
  let calls = 0;
  const { service, store } = setup({ loadCatalog: () => { calls++; return pending.promise; } });
  const worker = service.processPhien('session');
  assert.equal((await service.getPhien('session')).phien.TrangThai, 'Processing');
  await service.cancelPhien('session');
  pending.resolve([[{ MaLopHocPhan: 'HP1' }]]);
  await worker;
  assert.equal(calls, 1);
  assert.equal(store.get('session').phien.TrangThai, 'Cancelled');
  assert.equal(store.get('session').dong.length, 0);
});

test('a worker completing normally keeps its terminal status on reload', async () => {
  const { service, store } = setup({ query: async () => [[]] });
  await service.processPhien('session');
  assert.equal((await service.getPhien('session')).phien.TrangThai, 'CompletedWithWarnings');
  assert.equal(store.get('session').phien.SoLopDaXuLy, 1);
});

test('list filters semester and batch deletion preserves running sessions', async () => {
  const pending = deferred();
  const { service, store } = setup({ loadCatalog: () => pending.promise });
  const running = store.get('session');
  running.phien.MaHocKy = 'HK1';
  store.save(running);
  store.save({ phien: { MaPhien: 'completed', MaHocKy: 'HK1', TrangThai: 'Completed', ThoiGianTao: '2026-02-01' }, dong: [] });
  store.save({ phien: { MaPhien: 'applied', MaHocKy: 'HK1', TrangThai: 'Applied', ThoiGianTao: '2026-01-01' }, dong: [] });
  store.save({ phien: { MaPhien: 'other', MaHocKy: 'HK2', TrangThai: 'Cancelled' }, dong: [] });
  const worker = service.processPhien('session');
  const list = await service.listPhien({ maHocKy: 'HK1' });
  assert.equal(list.length, 3);
  assert.equal(list.find(item => item.MaPhien === 'session').DangXuLy, true);
  const result = await service.deletePhienBatch(['session', 'completed', 'applied', 'missing', 'completed']);
  assert.equal(result.removed.length, 2);
  assert.equal(result.errors.length, 2);
  assert.equal(store.get('completed'), undefined);
  assert.equal(store.get('applied'), undefined);
  assert.ok(store.get('other'));
  assert.equal(store.get('session').phien.TrangThai, 'Processing');
  await service.cancelPhien('session');
  await assert.rejects(service.deletePhien('session'), error => error.status === 409);
  pending.resolve([[]]);
  await worker;
  await service.deletePhien('session');
  assert.equal(store.get('session'), undefined);
});

test('deleting is blocked while apply or draft edit is in progress', async () => {
  for (const mode of ['apply', 'edit']) {
    const pending = deferred();
    const { service, store } = setup({
      getConnection: () => pending.promise,
      loadCatalog: () => pending.promise
    });
    store.save({ phien: { MaPhien: 'session', MaHocKy: 'HK1', PhienBanQuyTac: 3, TrangThai: 'Completed' },
      dong: [{ MaDong: 1, MaLopHocPhan: 'HP1', TrangThai: 'Draft' }] });
    const operation = mode === 'apply' ? service.applyPhien({}, 'session') : service.updateDong('session', 1, {});
    await assert.rejects(service.deletePhien('session'), error => error.status === 409);
    const batch = await service.deletePhienBatch(['session']);
    assert.equal(batch.removed.length, 0);
    assert.equal(batch.errors.length, 1);
    if (mode === 'apply') pending.resolve({ beginTransaction: async () => { throw new Error('stop'); }, rollback: async () => {}, release() {} });
    else pending.resolve([]);
    await assert.rejects(operation);
    await service.deletePhien('session');
    assert.equal(store.get('session'), undefined);
  }
});
const catalog = ['LT', 'BT'].map((LoaiHoc, i) => ({
  MaLopHocPhan: `IT1.231.3.2627.${i}.QT01.K64`, MaMonHoc: 'IT1.231.3', MaHocKy: 'HK1',
  KhoaHoc: 'K64', LoaiHoc, SoTinChi: 3, SiSo: 30,
  NgayBatDau: '2026-09-28', NgayKetThuc: '2026-11-22', HocKyBatDau: '2026-08-10', HocKyKetThuc: '2026-12-31'
}));
const resources = { rooms: [{ MaPhong: 'P1', SucChua: 35, LoaiPhong: 'LT', TrangThai: 'Ready' }],
  periods: [{ MaTiet: 1, TenTiet: 'Tiet 1-3', GioBatDau: '07:00:00', GioKetThuc: '09:25:00' }],
  official: [], lessons: [], links: [] };
const readySetup = extra => setup({ loadCatalog: async () => structuredClone(catalog),
  loadResources: async () => structuredClone(resources), query: async () => [[{ MaHocKy: 'HK1' }]], ...extra });
const complete = async service => {
  const created = await service.createPhien({ userId: 'ADMIN' }, { maHocKy: 'HK1', maLopHocPhans: [catalog[0].MaLopHocPhan] });
  await service.processPhien(created.maPhien);
  return created.maPhien;
};

test('selecting one component expands the group and produces 20 dated meetings', async () => {
  const { service, store } = readySetup();
  const id = await complete(service);
  const result = store.get(id);
  assert.equal(result.phien.TrangThai, 'Completed');
  assert.equal(result.phien.TongSoLop, 2);
  assert.equal(result.phien.TongSoBuoiDaXep, 20);
  assert.equal(result.phien.SoLopDaXep, 2);
  assert.ok(result.phien.SoTrangThaiDaXet > 0);
  assert.equal(result.dong.length, 20);
  assert.ok(result.dong.every(row => row.NgayBatDau === row.NgayKetThuc));
});

test('apply inserts every dated meeting, and missing meetings roll back before inserts', async () => {
  for (const incomplete of [false, true]) {
    const inserts = []; let committed = false; let rolledBack = false;
    const conn = { beginTransaction: async () => {}, release() {},
      commit: async () => { committed = true; }, rollback: async () => { rolledBack = true; },
      query: async (sql, args) => { if (sql.includes('INSERT INTO')) inserts.push(args); return [[]]; } };
    const { service, store } = readySetup({ getConnection: async () => conn });
    const id = await complete(service);
    if (incomplete) { const session = store.get(id); session.dong.pop(); store.save(session); }
    if (incomplete) {
      await assert.rejects(service.applyPhien({ userId: 'ADMIN' }, id), error => error.status === 409);
      assert.equal(rolledBack, true); assert.equal(inserts.length, 0); assert.equal(committed, false);
    } else {
      const result = await service.applyPhien({ userId: 'ADMIN' }, id);
      assert.equal(result.soDongDaApDung, 20); assert.equal(result.soLopDaApDung, 2);
      assert.equal(inserts.length, 20); assert.equal(committed, true);
      assert.ok(inserts.every(args => args[5] === args[6]));
      assert.equal(store.get(id).phien.TrangThai, 'Applied');
    }
  }
});

test('manual edit rejects a collision with the preceding group meeting', async () => {
  const { service, store } = readySetup();
  const id = await complete(service); const rows = store.get(id).dong;
  await assert.rejects(service.updateDong(id, rows[1].MaDong, {
    ngayBatDau: rows[0].NgayBatDau, ngayKetThuc: rows[0].NgayKetThuc, thuTrongTuan: rows[0].ThuTrongTuan
  }), error => error.status === 409);
  assert.equal(store.get(id).dong[1].NgayBatDau, rows[1].NgayBatDau);
});

test('cancellation during real CPU search cannot revive a session', async () => {
  const { service, store } = readySetup();
  const created = await service.createPhien({ userId: 'ADMIN' }, { maHocKy: 'HK1' });
  const worker = service.processPhien(created.maPhien);
  await new Promise(resolve => setImmediate(resolve));
  await service.cancelPhien(created.maPhien);
  await worker;
  assert.equal(store.get(created.maPhien).phien.TrangThai, 'Cancelled');
  assert.equal(store.get(created.maPhien).dong.length, 0);
});
