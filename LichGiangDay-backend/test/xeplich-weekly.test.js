const test = require('node:test');
const assert = require('node:assert/strict');
const { findWeeklyTemplate, validateWeekly, patterns } = require('../src/modules/xeplich/weeklySchedule');
const { getSoBuoiMoiTuan, getBlockedWeekdays } = require('../src/modules/xeplich/xeplich.config');
const member = { MaLopHocPhan: 'HP', TenLopHocPhan: 'Class', SoTinChi: 3, LoaiHoc: 'LT',
  NgayBatDau: '2026-09-28', NgayKetThuc: '2026-11-22' };
const rooms = [{ MaPhong: 'P1' }, { MaPhong: 'P2' }];
const periods = [{ MaTiet: 1, TenTiet: 'Tiet 1-3', GioBatDau: '07:00:00', GioKetThuc: '09:25:00' }];
const valid = async () => ({ valid: true, conflicts: [] });

test('credit/type frequencies and Sunday exclusion match the weekly business rule', () => {
  assert.equal(getSoBuoiMoiTuan('LT', 3), 2);
  assert.equal(getSoBuoiMoiTuan('TH', 3), 1); assert.equal(getSoBuoiMoiTuan('BT', 3), 1);
  assert.equal(getSoBuoiMoiTuan('LT', 2), 1); assert.equal(getSoBuoiMoiTuan('TH', 2), 1);
  assert.ok(getBlockedWeekdays().has(8));
  assert.ok(patterns(2).every(([a, b]) => b - a >= 2 && 7 + a - b >= 2 && b <= 7));
});

for (const [credits, type, expected] of [[3, 'LT', 2], [3, 'TH', 1], [3, 'BT', 1], [2, 'LT', 1]]) {
  test(`${credits} credits ${type} repeats every week at the same room and time`, async () => {
    const target = { ...member, SoTinChi: credits, LoaiHoc: type };
    const result = await findWeeklyTemplate({ member: target, rooms, periods, check: valid });
    assert.equal(result.rows.length, expected); assert.deepEqual(validateWeekly(target, result.rows), []);
    assert.equal(new Set(result.rows.map(row => row.MaPhong)).size, 1);
    const weeks = new Map();
    for (const row of result.rows) {
      for (let day = Date.parse(`${row.NgayBatDau}T00:00:00Z`); day <= Date.parse(`${row.NgayKetThuc}T00:00:00Z`); day += 86400000) {
        const date = new Date(day); const thu = date.getUTCDay() === 0 ? 8 : date.getUTCDay() + 1;
        if (thu !== row.ThuTrongTuan) continue;
        const week = day - (thu - 2) * 86400000;
        weeks.set(week, [...(weeks.get(week) || []), [thu, row.MaTiet, row.MaPhong]]);
      }
    }
    assert.equal(weeks.size, 8);
    assert.ok([...weeks.values()].every(slots => slots.length === expected));
    for (const slots of weeks.values()) assert.deepEqual(slots, [...weeks.values()][0]);
  });
}

test('search chooses a room that can host all weekly slots, without mixing rooms', async () => {
  const result = await findWeeklyTemplate({ member, rooms, periods,
    check: async row => ({ valid: row.MaPhong === 'P2' || row.ThuTrongTuan === 2, conflicts: [] }) });
  assert.ok(result.rows.every(row => row.MaPhong === 'P2'));
  assert.equal(result.rows.length, 2);
});

test('no complete weekly template means no partial class draft', async () => {
  const result = await findWeeklyTemplate({ member, rooms: [rooms[0]], periods,
    check: async row => ({ valid: row.ThuTrongTuan === 2, conflicts: [] }) });
  assert.equal(result.rows, null);
});

test('manual weekly edits cannot shorten range, use adjacent days, Sunday or different rooms', async () => {
  const result = await findWeeklyTemplate({ member, rooms, periods, check: valid });
  for (const change of [rows => { rows[1].ThuTrongTuan = rows[0].ThuTrongTuan + 1; },
    rows => { rows[1].ThuTrongTuan = 8; }, rows => { rows[1].MaPhong = 'OTHER'; },
    rows => { rows[1].NgayKetThuc = '2026-11-01'; }]) {
    const rows = structuredClone(result.rows); change(rows);
    assert.ok(validateWeekly(member, rows).length);
  }
});
