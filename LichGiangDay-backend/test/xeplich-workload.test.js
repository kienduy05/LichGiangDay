const assert = require('node:assert/strict');
const test = require('node:test');
const { buildGroups, validateWorkload, dayNumber, weekStart, identifyGroup } = require('../src/modules/xeplich/workloadRules');
const { solveWorkload } = require('../src/modules/xeplich/workloadSolver');
const { createOccupancy } = require('../src/modules/xeplich/workloadData.service');

const makeClasses = (types = ['LT', 'BT'], credits = 3, group = 'QT01') => types.map((type, i) => ({
  MaLopHocPhan: `IT1.231.3.2627.1.${i}.${group}.K64`, MaMonHoc: 'IT1.231.3', MaHocKy: 'HK1',
  TenLopHocPhan: `Khai pha du lieu ${type} (${group})`, KhoaHoc: 'K64', LoaiHoc: type, SoTinChi: credits,
  SiSo: 30, SoTuan: 8, NgayBatDau: '2026-09-28', NgayKetThuc: '2026-11-22', HocKyBatDau: '2026-08-10', HocKyKetThuc: '2026-12-31'
}));
const makeData = () => ({
  rooms: [
    { MaPhong: 'P1', TenPhong: '101', SucChua: 35, LoaiPhong: 'LT', TrangThai: 'Ready' },
    { MaPhong: 'LAB', TenPhong: 'Lab', SucChua: 35, LoaiPhong: 'Lab', TrangThai: 'Ready' }
  ],
  periods: [
    { MaTiet: 1, TenTiet: 'Tiet 1-3', GioBatDau: '07:00:00', GioKetThuc: '09:25:00' },
    { MaTiet: 2, TenTiet: 'Tiet 4-6', GioBatDau: '09:35:00', GioKetThuc: '12:00:00' }
  ], official: [], lessons: [], links: []
});

for (const [types, credits, counts] of [
  [['LT', 'BT'], 3, { LT: 16, BT: 8 }],
  [['LT', 'BT', 'TH'], 3, { LT: 16, BT: 8, TH: 8 }],
  [['LT', 'BT'], 2, { LT: 8, BT: 8 }],
  [['DA'], 3, { DA: 8 }]
]) test(`weekly templates ${credits} credits ${types.join('/')} keep room/time and every week`, async () => {
  const classes = makeClasses(types, credits); const data = makeData(); const groups = buildGroups(classes);
  assert.deepEqual(groups[0].issues, []);
  const result = await solveWorkload({ classes, data, groups }); const rows = result.results[0].rows;
  assert.ok(rows, result.results[0].message);
  assert.deepEqual(validateWorkload(rows, groups, data.periods), []);
  for (const member of classes) {
    const own = rows.filter(row => row.MaLopHocPhan === member.MaLopHocPhan);
    assert.equal(own.length, counts[member.LoaiHoc]);
    assert.equal(new Set(own.map(row => row.MaPhong)).size, 1);
    const weeks = new Map();
    for (const row of own) {
      assert.notEqual(row.ThuTrongTuan, 8);
      const week = weekStart(dayNumber(row.NgayHoc));
      weeks.set(week, [...(weeks.get(week) || []), [row.ThuTrongTuan, row.MaTiet, row.MaPhong]]);
    }
    assert.equal(weeks.size, 8);
    for (const slots of weeks.values()) assert.deepEqual(slots, [...weeks.values()][0]);
    if (member.LoaiHoc === 'TH') assert.ok(own.every(row => row.MaPhong === 'LAB'));
  }
});

test('partial boundary weeks use only in-range dates and ignore stale SoTuan', async () => {
  const classes = makeClasses(['LT']).map(row => ({ ...row, NgayBatDau: '2026-09-30', NgayKetThuc: '2026-11-19', SoTuan: 99 }));
  const data = makeData(); const groups = buildGroups(classes);
  const result = await solveWorkload({ classes, groups, data }); const rows = result.results[0].rows;
  assert.ok(rows); assert.deepEqual(validateWorkload(rows, groups, data.periods), []);
  assert.ok(rows.every(row => row.NgayHoc >= '2026-09-30' && row.NgayHoc <= '2026-11-19'));
});

test('a room that is free only in some weeks cannot form a recurring template', async () => {
  const classes = makeClasses(['LT']); const data = makeData();
  for (const room of data.rooms) for (const period of data.periods) for (let thu = 2; thu <= 7; thu++) {
    data.official.push({ MaLopHocPhan: 'BUSY', MaPhong: room.MaPhong, MaTiet: period.MaTiet, ThuTrongTuan: thu,
      NgayBatDau: room.MaPhong === 'P1' ? '2026-09-28' : '2026-10-26',
      NgayKetThuc: room.MaPhong === 'P1' ? '2026-10-25' : '2026-11-22' });
  }
  const result = await solveWorkload({ classes, data, groups: buildGroups(classes) });
  assert.equal(result.results[0].rows, undefined);
});

test('manual edits cannot skip a week, change a room or change a recurring time', async () => {
  const classes = makeClasses(); const data = makeData(); const groups = buildGroups(classes);
  const result = await solveWorkload({ classes, data, groups }); const rows = result.results[0].rows;
  assert.ok(validateWorkload(rows.slice(1), groups, data.periods).length);
  for (const field of ['MaPhong', 'MaTiet']) {
    const edited = structuredClone(rows); edited[0][field] = field === 'MaPhong' ? 'OTHER' : 2;
    assert.ok(validateWorkload(edited, groups, data.periods).length);
  }
});

test('shared students and lecturers block overlapping recurring slots', async () => {
  const classes = [...makeClasses(), ...makeClasses(['LT', 'BT'], 3, 'QT02')].map(row => ({ ...row, MaGiangVien: 'GV1' }));
  const data = makeData(); data.links = classes.map(row => ({ MaLopHocPhan: row.MaLopHocPhan, MaLopSinhVien: 'SV1' }));
  const result = await solveWorkload({ classes, data, groups: buildGroups(classes) });
  assert.ok(result.results.every(item => item.rows));
  const occupancy = createOccupancy(data, classes);
  for (const row of result.results.flatMap(item => item.rows)) {
    assert.equal(occupancy.conflict(classes.find(item => item.MaLopHocPhan === row.MaLopHocPhan), dayNumber(row.NgayHoc),
      occupancy.periodMap.get(row.MaTiet), occupancy.roomMap.get(row.MaPhong)), null);
    occupancy.add(row);
  }
});

test('group identity separates cohorts and unsupported credits are rejected', () => {
  assert.equal(buildGroups([...makeClasses(), ...makeClasses(['LT'], 3, 'QT02')]).length, 2);
  assert.ok(buildGroups(makeClasses(['LT'], 4))[0].issues.length);
  assert.ok(buildGroups(makeClasses(['LT', 'LT']))[0].issues.length);
});

test('search budget produces no partial successful group', async () => {
  const classes = makeClasses();
  const result = await solveWorkload({ classes, data: makeData(), groups: buildGroups(classes), limits: { maxStates: 1 } });
  assert.equal(result.results[0].rows, undefined); assert.equal(result.results[0].reason, 'SEARCH_LIMIT');
});
