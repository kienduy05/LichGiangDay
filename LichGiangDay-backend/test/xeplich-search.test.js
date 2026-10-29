const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const loadService = (config = {}) => {
  const module = { exports: {} };
  const filename = path.resolve(__dirname, '../src/modules/xeplich/scheduleSearch.service.js');
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module,
    require: id => id === '../../../config/db' ? {} : {
      ...require('../src/modules/xeplich/xeplich.config'), ...config
    }
  }, { filename });
  return module.exports;
};
const base = () => ({
  lop: { MaLopHocPhan: 'HP1', LoaiHoc: 'LT', SiSo: 30, MaGiangVien: 'GV1',
    NgayBatDau: '2026-09-01', NgayKetThuc: '2026-12-01',
    HocKyBatDau: '2026-08-01', HocKyKetThuc: '2026-12-31' },
  rooms: [{ MaPhong: 'P1', TrangThai: 'Ready', LoaiPhong: 'LT', SucChua: 40 }],
  periods: [
    { MaTiet: 1, GioBatDau: '07:00:00', GioKetThuc: '09:00:00' },
    { MaTiet: 2, GioBatDau: '08:00:00', GioKetThuc: '10:00:00' },
    { MaTiet: 3, GioBatDau: '09:00:00', GioKetThuc: '11:00:00' }
  ], session: { dong: [] }
});
const slot = { thuTrongTuan: 2, maTiet: 1, maPhong: 'P1' };
const busy = (extra = {}) => ({ MaLopHocPhan: 'HP2', MaPhong: 'P2', ThuTrongTuan: 2,
  NgayBatDau: '2026-10-01', NgayKetThuc: '2026-11-01',
  GioBatDau: '08:00:00', GioKetThuc: '10:00:00', ...extra });
const prepare = async (input, { official = [], related = [], lecturer = [], config = {} } = {}) => {
  let queries = 0;
  const search = await loadService(config).prepare(input, { query: async sql => {
    queries++;
    if (sql.includes('FROM ThoiKhoaBieu')) return [official];
    if (sql.includes('SELECT DISTINCT shared')) return [related.map(MaLopHocPhan => ({ MaLopHocPhan }))];
    return [lecturer.map(MaLopHocPhan => ({ MaLopHocPhan }))];
  } });
  return { search, queries: () => queries };
};

test('thousands of candidate checks perform no additional SQL queries', async () => {
  const { search, queries } = await prepare(base());
  const count = queries();
  for (let i = 0; i < 5000; i++) assert.equal(search.check(slot).valid, true);
  assert.equal(count, 3);
  assert.equal(queries(), count);
});

test('official room, student and lecturer conflicts still block candidates', async () => {
  for (const [options, code] of [
    [{ official: [busy({ MaPhong: 'P1' })] }, 'ROOM_CONFLICT'],
    [{ official: [busy()], related: ['HP2'] }, 'STUDENT_CONFLICT'],
    [{ official: [busy({ MaGiangVien: 'GV1' })] }, 'LECTURER_CONFLICT']
  ]) {
    const { search } = await prepare(base(), options);
    assert.equal(search.check(slot).conflicts[0].code, code);
  }
});

test('draft checks use overlapping hours across different period IDs and see newly added rows', async () => {
  const input = base();
  const { search } = await prepare(input);
  assert.equal(search.check(slot).valid, true);
  input.session.dong.push({ ...busy({ MaPhong: 'P1' }), MaTiet: 2, TrangThai: 'Draft' });
  assert.equal(search.check(slot).conflicts[0].code, 'DRAFT_ROOM_CONFLICT');
  input.session.dong[0].MaTiet = 3;
  assert.equal(search.check(slot).valid, true);
  input.session.dong[0].MaTiet = 2;
  input.session.dong[0].NgayBatDau = '2027-01-01';
  assert.equal(search.check(slot).valid, true);
});

test('draft student, lecturer and internal class overlaps are rejected', async () => {
  for (const [classId, options, code] of [
    ['HP1', {}, 'CLASS_INTERNAL_CONFLICT'],
    ['HP2', { related: ['HP2'] }, 'DRAFT_STUDENT_CONFLICT'],
    ['HP2', { lecturer: ['HP2'] }, 'DRAFT_LECTURER_CONFLICT']
  ]) {
    const input = base();
    input.session.dong.push({ ...busy({ MaLopHocPhan: classId }), MaTiet: 2, TrangThai: 'Draft' });
    const { search } = await prepare(input, options);
    assert.equal(search.check(slot).conflicts[0].code, code);
  }
});

test('semester bounds, blocked days/dates and room requirements remain enforced', async () => {
  const invalid = base();
  invalid.lop.NgayBatDau = '2026-01-01';
  assert.equal((await prepare(invalid)).search.check(slot).conflicts[0].code, 'SEMESTER_RANGE');
  const tooSmall = base();
  tooSmall.rooms[0].SucChua = 10;
  assert.equal((await prepare(tooSmall)).search.check(slot).valid, false);
  const practice = base();
  practice.lop.LoaiHoc = 'TH';
  assert.equal((await prepare(practice)).search.check(slot).valid, false);
  const blocked = await prepare(base(), { config: { getBlockedWeekdays: () => new Set([2]) } });
  assert.equal(blocked.search.check(slot).conflicts[0].code, 'BLOCKED_WEEKDAY');
  const holiday = await prepare(base(), { config: { getBlockedDates: () => new Set(['2026-10-05']) } });
  assert.equal(holiday.search.check(slot).conflicts[0].code, 'BLOCKED_DATE');
});
