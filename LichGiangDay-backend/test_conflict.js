const assert = require('assert');
const ConflictService = require('./src/services/conflict.service');
const db = require('./config/db');

async function runUnitTests() {
  console.log('=== RUNNING CONFLICT SERVICE UNIT TESTS ===');

  // Test 1: Pure Time Overlap Logic
  console.log('Test 1: isTimeOverlap verification');
  // Ca 1: Giao nhau một phần (07:00 - 09:25 vs 09:00 - 11:00) -> TRÙNG
  assert.strictEqual(
    ConflictService.isTimeOverlap('07:00:00', '09:25:00', '09:00:00', '11:00:00'),
    true,
    '07:00-09:25 and 09:00-11:00 should overlap'
  );

  // Ca 2: Nối tiếp nhau không giao (07:00 - 09:25 vs 09:35 - 12:00) -> KHÔNG TRÙNG
  assert.strictEqual(
    ConflictService.isTimeOverlap('07:00:00', '09:25:00', '09:35:00', '12:00:00'),
    false,
    '07:00-09:25 and 09:35-12:00 should not overlap'
  );

  // Ca 3: Bao trọn nhau (07:00 - 12:00 vs 08:00 - 10:00) -> TRÙNG
  assert.strictEqual(
    ConflictService.isTimeOverlap('07:00:00', '12:00:00', '08:00:00', '10:00:00'),
    true,
    'Nested intervals should overlap'
  );
  console.log('✓ Test 1 passed: Time overlap logic is exact.');

  // Test 2: Date Range Overlap Logic (Nửa đầu kỳ vs nửa cuối kỳ)
  console.log('Test 2: Half semester date range overlap check');
  // Lớp A: Nửa đầu kỳ (15/08/2026 - 30/09/2026)
  // Lớp B: Nửa cuối kỳ (01/10/2026 - 15/11/2026)
  // Cùng thứ, cùng ca nhưng hai khoảng ngày không giao nhau -> KHÔNG TRÙNG
  const isDateOverlap = ConflictService.isDateRangeOverlap(
    '2026-08-15', '2026-09-30',
    '2026-10-01', '2026-11-15'
  );
  assert.strictEqual(isDateOverlap, false, 'Half semester A and B should NOT overlap');
  console.log('✓ Test 2 passed: Half-semester schedules do NOT conflict.');

  // Test 3: checkConflict against DB with a known existing session
  console.log('Test 3: checkConflict against occupied room in DB');
  // BH_20261019_01: NLM001, date 2026-10-19, tiet 1 (07:00-09:25), room 101_A3
  // Check if placing another class in 101_A3 at tiet 1 on 2026-10-19 detects ROOM conflict
  const resultRoomClash = await ConflictService.checkConflict({
    maLopHocPhan: 'NMCNTT.NMCNTT.CSH.LT1',
    ngayHoc: '2026-10-19',
    maTiet: 1,
    maPhong: '101_A3',
    maGiangVien: 'LMD001'
  });
  assert.strictEqual(resultRoomClash.ok, false, 'Should detect conflict');
  assert(resultRoomClash.conflicts.some(c => c.type === 'ROOM'), 'Must contain ROOM conflict');
  console.log('✓ Test 3 passed: Room conflict detected correctly:', resultRoomClash.conflicts[0].message);

  // Test 4: checkConflict with Lecturer Clash
  console.log('Test 4: checkConflict against occupied lecturer in DB');
  // NLM001 is busy on 2026-10-19 at tiet 1. Let's try to assign NLM001 to a different room (202_A3) at tiet 1
  const resultLecturerClash = await ConflictService.checkConflict({
    maLopHocPhan: 'NMCNTT.NMCNTT.CSH.LT1',
    ngayHoc: '2026-10-19',
    maTiet: 1,
    maPhong: '202_A3', // free room
    maGiangVien: 'NLM001' // busy lecturer
  });
  assert.strictEqual(resultLecturerClash.ok, false, 'Should detect lecturer clash');
  assert(resultLecturerClash.conflicts.some(c => c.type === 'LECTURER'), 'Must contain LECTURER conflict');
  console.log('✓ Test 4 passed: Lecturer conflict detected correctly:', resultLecturerClash.conflicts[0].message);

  // Test 5: checkConflict with clean slot
  console.log('Test 5: checkConflict on a free slot');
  // Free room 202_A3, free lecturer LMD001 at tiet 4 on 2026-10-19
  const resultClean = await ConflictService.checkConflict({
    maLopHocPhan: 'NMCNTT.NMCNTT.CSH.LT1',
    ngayHoc: '2026-10-19',
    maTiet: 4,
    maPhong: '202_A3',
    maGiangVien: 'LMD001'
  });
  assert.strictEqual(resultClean.ok, true, 'Clean slot should have no conflicts');
  console.log('✓ Test 5 passed: Free slot returns ok: true');

  console.log('\nALL 5 UNIT TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}

runUnitTests().catch(err => {
  console.error('Unit test failed:', err);
  process.exit(1);
});
