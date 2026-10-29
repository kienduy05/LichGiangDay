const { dayNumber, dayString, weekday, periodUnits, weeklyPatterns, datesForPattern, validateWorkload } = require('./workloadRules');
const { createOccupancy } = require('./workloadData.service');
const { isRoomCompatible } = require('./xeplich.config');
const DEFAULT_LIMITS = { maxTemplates: 256, maxStates: 200000, maxMs: 30000, maxPasses: 3 };

const solveWorkload = async ({ groups, data, classes, checkpoint = async () => {}, limits = {} }) => {
  const started = Date.now(); const settings = { ...DEFAULT_LIMITS, ...limits };
  const metrics = { candidates: 0, states: 0, passes: 0, durationMs: 0 };
  const expired = () => Date.now() - started >= settings.maxMs || metrics.states >= settings.maxStates;
  let ticks = 0;
  const tick = async () => {
    if (++ticks % 64 === 0) { await new Promise(resolve => setImmediate(resolve)); await checkpoint(metrics); }
    return !expired();
  };
  const failure = group => ({ group, reason: expired() ? 'SEARCH_LIMIT' : 'NO_RECURRING_TEMPLATE',
    message: expired() ? 'Đã chạm giới hạn tìm kiếm mẫu tuần cố định.' : 'Chưa tìm được mẫu đủ buổi mỗi tuần, cùng thứ/ca/phòng trong toàn thời gian lớp. Không tự bỏ tuần hoặc đổi phòng.' });
  const periods = data.periods.filter(period => periodUnits(period) === 3 && period.GioBatDau < period.GioKetThuc);
  const solveGroup = async (group, committed) => {
    const occupancy = createOccupancy(data, classes, committed);
    const candidates = [];
    for (const member of group.members) {
      const own = [];
      const rooms = data.rooms.filter(room => room.TrangThai === 'Ready' && Number(room.SucChua) >= Number(member.SiSo)
        && isRoomCompatible(member.LoaiHoc, room.LoaiPhong))
        .sort((a, b) => Number(a.SucChua) - Number(b.SucChua) || a.MaPhong.localeCompare(b.MaPhong));
      for (const pattern of weeklyPatterns(member.SoBuoiMoiTuan)) {
        const days = datesForPattern(member, pattern);
        if (!days.length || pattern.some(thu => !days.some(day => weekday(day) === thu))) continue;
        for (const room of rooms) for (const period of periods) {
          const rows = []; let valid = true;
          for (const day of days) {
            metrics.candidates++;
            if (!await tick()) return failure(group);
            if (occupancy.conflict(member, day, period, room)) { valid = false; break; }
            rows.push({ MaLopHocPhan: member.MaLopHocPhan, MaNhomXep: group.MaNhomXep,
              TenLopHocPhan: member.TenLopHocPhan, TenMonHoc: member.TenMonHoc, LoaiHoc: member.LoaiHoc,
              ThuCoDinh: pattern, SoBuoiMoiTuan: member.SoBuoiMoiTuan, ThuTrongTuan: weekday(day),
              MaTiet: period.MaTiet, TenTiet: period.TenTiet, GioBatDau: period.GioBatDau, GioKetThuc: period.GioKetThuc,
              MaPhong: room.MaPhong, TenPhong: room.TenPhong, MaToaNha: room.MaToaNha,
              NgayBatDau: dayString(day), NgayKetThuc: dayString(day), NgayHoc: dayString(day),
              SoTiet: 3, NguonXep: 'Auto', TrangThai: 'Draft', DaKhoa: 0, LyDo: [] });
          }
          if (valid) own.push({ rows, score: (Number(room.SucChua) - Number(member.SiSo)) / Math.max(1, Number(member.SiSo)) + Number(period.MaTiet) * 0.001 });
        }
      }
      if (!own.length) return failure(group);
      own.sort((a, b) => a.score - b.score);
      candidates.push({ member, options: own.slice(0, settings.maxTemplates) });
    }
    candidates.sort((a, b) => a.options.length - b.options.length);
    const search = async (depth, selected) => {
      if (depth === candidates.length) return selected;
      const current = candidates[depth];
      const busy = createOccupancy(data, classes, [...committed, ...selected]);
      // Prefer alternating days across components when resources allow it; not a hard group cap.
      const options = [...current.options].sort((a, b) => {
        const overlapDays = option => option.rows.filter(row => selected.some(other => other.NgayHoc === row.NgayHoc)).length;
        return overlapDays(a) - overlapDays(b) || a.score - b.score;
      });
      for (const option of options) {
        metrics.states++;
        if (!await tick()) return null;
        let valid = true;
        for (const row of option.rows) {
          if (!await tick()) return null;
          const day = dayNumber(row.NgayHoc);
          const conflict = busy.conflict(current.member, day, busy.periodMap.get(Number(row.MaTiet)), busy.roomMap.get(row.MaPhong));
          if (conflict || selected.some(other => other.NgayHoc === row.NgayHoc && other.GioBatDau < row.GioKetThuc && row.GioBatDau < other.GioKetThuc)) { valid = false; break; }
        }
        if (!valid) continue;
        const result = await search(depth + 1, [...selected, ...option.rows]);
        if (result) return result;
        if (expired()) return null;
      }
      return null;
    };
    const rows = await search(0, []);
    if (!rows) return failure(group);
    rows.sort((a, b) => a.NgayHoc.localeCompare(b.NgayHoc) || a.GioBatDau.localeCompare(b.GioBatDau));
    const errors = validateWorkload(rows, [group], data.periods);
    if (errors.length) throw new Error(errors.join(' '));
    return { group, rows };
  };
  let best = null;
  const sorted = [...groups].sort((a, b) => b.ToiDaBuoiMoiTuan - a.ToiDaBuoiMoiTuan || a.MaNhomXep.localeCompare(b.MaNhomXep));
  for (let pass = 0; pass < settings.maxPasses && !expired(); pass++) {
    metrics.passes++;
    const order = sorted.length ? sorted.slice(pass % sorted.length).concat(sorted.slice(0, pass % sorted.length)) : [];
    const committed = []; const results = []; let completeClasses = 0;
    for (const group of order) {
      await checkpoint(metrics, group);
      const result = expired() ? failure(group) : await solveGroup(group, committed);
      results.push(result);
      if (result.rows) { committed.push(...result.rows); completeClasses += group.members.length; }
    }
    if (!best || completeClasses > best.completeClasses) best = { results, completeClasses };
    if (results.every(result => result.rows)) break;
  }
  metrics.durationMs = Date.now() - started;
  return { results: best?.results || groups.map(failure), metrics };
};
module.exports = { solveWorkload, DEFAULT_LIMITS };
