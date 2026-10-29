const assert = require('node:assert/strict');
const test = require('node:test');
const { buildGroups, quotaFor, validateWorkload, dayNumber, weekStart, identifyGroup } = require('../src/modules/xeplich/workloadRules');
const { solveWorkload } = require('../src/modules/xeplich/workloadSolver');
const { createOccupancy } = require('../src/modules/xeplich/workloadData.service');

const makeClasses = (types = ['LT', 'BT'], credits = 3, group = 'QT01') => types.map((type, i) => ({
  MaLopHocPhan: `IT1.231.3.2627.1.${i}.${group}.K64`, MaMonHoc: 'IT1.231.3', MaHocKy: 'HK1',
  TenLopHocPhan: `Khai pha du lieu ${type} (${group})`, KhoaHoc: 'K64', LoaiHoc: type, SoTinChi: credits,
  SiSo: 30, NgayBatDau: '2026-09-28', NgayKetThuc: '2026-11-22', HocKyBatDau: '2026-08-10', HocKyKetThuc: '2026-12-31'
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

for (const [types, credits, expected] of [
  [['LT', 'BT'], 3, { LT: 10, BT: 10 }],
  [['LT', 'BT', 'TH'], 3, { LT: 10, BT: 5, TH: 5 }],
  [['LT', 'BT'], 2, { LT: 5, BT: 5 }],
  [['DA'], 3, { DA: 20 }],
  [['DA', 'TT'], 3, { DA: 10, TT: 10 }]
]) {
  test(`full workload ${credits} credits ${types.join('/')} is dated, alternating, spaced and complete`, async () => {
    const classes = makeClasses(types, credits);
    const groups = buildGroups(classes);
    assert.deepEqual(groups[0].issues, []);
    const data = makeData();
    const result = await solveWorkload({ groups, data, classes });
    const rows = result.results[0].rows;
    assert.ok(rows, result.results[0].message);
    for (const [type, count] of Object.entries(expected)) assert.equal(rows.filter(row => row.LoaiHoc === type).length, count);
    assert.deepEqual(validateWorkload(rows, groups, data.periods), []);
    assert.ok(rows.every(row => row.NgayBatDau === row.NgayKetThuc && row.SoTiet === 3));
    const weeks = new Map();
    for (const row of rows) weeks.set(weekStart(dayNumber(row.NgayHoc)), (weeks.get(weekStart(dayNumber(row.NgayHoc))) || 0) + 1);
    assert.equal(weeks.size, 8);
    assert.ok([...weeks.values()].every(count => count <= 3));
    if (types.includes('TH')) assert.ok(rows.filter(row => row.LoaiHoc === 'TH').every(row => row.MaPhong === 'LAB'));
  });
}

test('group identity keeps cohort/group separate and rejects duplicate component types', () => {
  const groups = buildGroups([...makeClasses(), ...makeClasses(['LT', 'BT'], 3, 'QT02')]);
  assert.equal(groups.length, 2);
  assert.equal(identifyGroup(makeClasses()[0]).group, 'QT01');
  assert.ok(buildGroups(makeClasses(['LT', 'LT', 'BT']))[0].issues.length);
  assert.equal(quotaFor(4, ['LT', 'BT']), null);
});

test('too short a window produces no partial draft', async () => {
  const classes = makeClasses().map(row => ({ ...row, NgayKetThuc: '2026-10-05' }));
  const result = await solveWorkload({ classes, groups: buildGroups(classes), data: makeData() });
  assert.equal(result.results[0].rows, undefined);
  assert.ok(result.results[0].reason);
});

test('official and actual lessons block rooms, lecturers and shared students', () => {
  const classes = makeClasses();
  classes[0].MaGiangVien = 'GV1';
  const data = makeData();
  data.links = [{ MaLopHocPhan: classes[0].MaLopHocPhan, MaLopSinhVien: 'SV1' }, { MaLopHocPhan: 'OTHER', MaLopSinhVien: 'SV1' }];
  data.lessons = [{ MaLopHocPhan: 'OTHER', MaGiangVien: 'GV2', MaPhong: 'P1', MaTiet: 1,
    NgayBatDau: '2026-09-28', NgayKetThuc: '2026-09-28', ThuTrongTuan: 2 }];
  const occupancy = createOccupancy(data, classes);
  assert.ok(occupancy.conflict(classes[0], dayNumber('2026-09-28'), data.periods[0], data.rooms[0]));
  assert.ok(occupancy.conflict(classes[0], dayNumber('2026-09-28'), data.periods[0], data.rooms[1]));
  assert.equal(occupancy.conflict(classes[0], dayNumber('2026-09-30'), data.periods[0], data.rooms[0]), null);
});

test('manual edits cannot change meeting count, spacing or three-period requirement', async () => {
  const classes = makeClasses(); const data = makeData(); const groups = buildGroups(classes);
  const result = await solveWorkload({ classes, data, groups });
  const rows = result.results[0].rows;
  assert.ok(validateWorkload(rows.slice(1), groups, data.periods).length);
  const changed = structuredClone(rows);
  changed[1].NgayBatDau = changed[0].NgayBatDau;
  changed[1].NgayKetThuc = changed[0].NgayBatDau;
  changed[1].ThuTrongTuan = changed[0].ThuTrongTuan;
  assert.ok(validateWorkload(changed, groups, data.periods).length);
  assert.ok(validateWorkload(rows, groups, data.periods.map(period => ({ ...period, TenTiet: 'Tiet 1-2' }))).length);
});

test('search budget never returns an incomplete group as successful', async () => {
  const classes = makeClasses();
  const result = await solveWorkload({ classes, groups: buildGroups(classes), data: makeData(), limits: { maxStates: 1 } });
  assert.equal(result.results[0].rows, undefined);
  assert.equal(result.results[0].reason, 'SEARCH_LIMIT');
});

test('multiple groups sharing students do not overlap even with different period IDs', async () => {
  const classes = [...makeClasses(), ...makeClasses(['LT', 'BT'], 3, 'QT02')];
  const data = makeData();
  data.links = classes.map(row => ({ MaLopHocPhan: row.MaLopHocPhan, MaLopSinhVien: 'SHARED' }));
  data.periods.push({ MaTiet: 3, TenTiet: 'Tiet 2-4', GioBatDau: '08:00:00', GioKetThuc: '10:25:00' });
  const groups = buildGroups(classes);
  const result = await solveWorkload({ classes, groups, data });
  assert.ok(result.results.every(item => item.rows));
  const occupancy = createOccupancy(data, classes);
  for (const row of result.results.flatMap(item => item.rows)) {
    assert.equal(occupancy.conflict(classes.find(item => item.MaLopHocPhan === row.MaLopHocPhan),
      dayNumber(row.NgayHoc), occupancy.periodMap.get(row.MaTiet), occupancy.roomMap.get(row.MaPhong)), null);
    occupancy.add(row);
  }
});

test('official lecturer bookings block an alternate room and overlapping period', () => {
  const classes = makeClasses(); classes[0].MaGiangVien = 'GV1';
  const data = makeData();
  data.official = [{ MaLopHocPhan: 'EXTERNAL', MaGiangVien: 'GV1', MaPhong: 'P1', MaTiet: 1,
    NgayBatDau: '2026-09-01', NgayKetThuc: '2026-12-01', ThuTrongTuan: 2 }];
  data.periods.push({ MaTiet: 3, TenTiet: 'Tiet 2-4', GioBatDau: '08:00:00', GioKetThuc: '10:25:00' });
  const occupancy = createOccupancy(data, classes);
  assert.ok(occupancy.conflict(classes[0], dayNumber('2026-09-28'), data.periods[2], data.rooms[1]));
  assert.equal(occupancy.conflict(classes[0], dayNumber('2026-09-28'), data.periods[1], data.rooms[1]), null);
});

test('recurring weekdays stay identical across weeks with equal meeting counts', async () => {
  const classes = makeClasses(); const data = makeData(); const groups = buildGroups(classes);
  const result = await solveWorkload({ classes, groups, data });
  const rows = result.results[0].rows;
  assert.ok(rows);
  const weeks = new Map();
  for (const row of rows) {
    const week = weekStart(dayNumber(row.NgayHoc));
    if (!weeks.has(week)) weeks.set(week, []);
    weeks.get(week).push(row.ThuTrongTuan);
    assert.deepEqual(row.ThuCoDinh, rows[0].ThuCoDinh);
  }
  const patternsByCount = new Map();
  for (const days of weeks.values()) {
    if (patternsByCount.has(days.length)) assert.deepEqual(days, patternsByCount.get(days.length));
    else patternsByCount.set(days.length, days);
  }
  const edited = structuredClone(rows);
  edited[0].ThuCoDinh = [2, 4];
  edited[1].ThuCoDinh = [3, 5];
  assert.ok(validateWorkload(edited, groups, data.periods).length);
});

test('a ten-week course can keep the same two weekdays for all twenty meetings', async () => {
  const classes = makeClasses().map(row => ({ ...row, NgayKetThuc: '2026-12-06' }));
  const data = makeData();
  // Only Monday and Wednesday are available, with two valid periods each day.
  for (const thu of [3, 5, 6, 7, 8]) for (const room of data.rooms) for (const period of data.periods) {
    data.official.push({ MaLopHocPhan: 'BUSY', MaPhong: room.MaPhong, MaTiet: period.MaTiet,
      ThuTrongTuan: thu, NgayBatDau: '2026-09-28', NgayKetThuc: '2026-12-06' });
  }
  const result = await solveWorkload({ classes, groups: buildGroups(classes), data });
  const rows = result.results[0].rows;
  assert.equal(rows?.length, 20);
  assert.deepEqual(rows[0].ThuCoDinh, [2, 4]);
  const weeks = new Map();
  for (const row of rows) {
    const week = weekStart(dayNumber(row.NgayHoc));
    weeks.set(week, [...(weeks.get(week) || []), row.ThuTrongTuan]);
  }
  assert.equal(weeks.size, 10);
  assert.ok([...weeks.values()].every(days => JSON.stringify(days) === '[2,4]'));
});

test('Sunday is excluded from generated schedules and rejected on draft validation', async () => {
  const classes = makeClasses(); const data = makeData(); const groups = buildGroups(classes);
  const result = await solveWorkload({ classes, groups, data });
  const rows = result.results[0].rows;
  assert.ok(rows?.length);
  assert.ok(rows.every(row => row.ThuTrongTuan !== 8 && !row.ThuCoDinh.includes(8)));
  const occupancy = createOccupancy(data, classes);
  assert.ok(occupancy.conflict(classes[0], dayNumber('2026-10-04'), data.periods[0], data.rooms[0]));
  const edited = structuredClone(rows);
  edited[0].NgayBatDau = edited[0].NgayKetThuc = '2026-10-04';
  edited[0].ThuTrongTuan = 8;
  assert.ok(validateWorkload(edited, groups, data.periods).length);
});
