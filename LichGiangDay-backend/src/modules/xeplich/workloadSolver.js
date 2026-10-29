const { dayNumber, dayString, weekday, weekStart, periodUnits, MIN_DAY_GAP, MAX_WEEKLY_MEETINGS, validateWorkload } = require('./workloadRules');
const { createOccupancy } = require('./workloadData.service');
const { isRoomCompatible } = require('./xeplich.config');

const DEFAULT_LIMITS = { beamWidth: 48, datesPerType: 16, maxStates: 200000, maxMs: 30000, maxPasses: 3 };

// A recurring weekday template; circular spacing also protects Sunday -> Monday.
const weekdayPatterns = () => Array.from({ length: 63 }, (_, i) => i + 1)
  .map(mask => Array.from({ length: 6 }, (_, i) => i + 2).filter(day => mask & (1 << (day - 2))))
  .filter(days => days.length <= MAX_WEEKLY_MEETINGS && days.every((day, i) =>
    i === 0 || day - days[i - 1] >= MIN_DAY_GAP)
    && (days.length === 1 || 7 + days[0] - days.at(-1) >= MIN_DAY_GAP));

const solveGroup = async (group, data, occupancy, context) => {
  const options = new Map();
  const periods = data.periods.filter(period => periodUnits(period) === 3 && period.GioBatDau < period.GioKetThuc);
  let ticks = 0;
  for (const member of group.members) {
    const rooms = data.rooms.filter(room => room.TrangThai === 'Ready'
      && Number(room.SucChua) >= Number(member.SiSo) && isRoomCompatible(member.LoaiHoc, room.LoaiPhong))
      .sort((a, b) => Number(a.SucChua) - Number(b.SucChua) || a.MaPhong.localeCompare(b.MaPhong));
    const own = [];
    for (let day = dayNumber(member.NgayBatDau); day <= dayNumber(member.NgayKetThuc); day++) {
      let best = null;
      for (let p = 0; p < periods.length; p++) {
        for (const room of rooms) {
          context.metrics.candidates++;
          if (++ticks % 128 === 0) await context.checkpoint();
          if (context.expired()) return { reason: 'SEARCH_LIMIT', message: 'Đã chạm giới hạn tìm kiếm; chưa tìm được phương án đủ buổi.' };
          if (occupancy.conflict(member, day, periods[p], room)) continue;
          const slotScore = (Number(room.SucChua) - Number(member.SiSo)) / Math.max(1, Number(member.SiSo)) * 0.05 + p * 0.001;
          if (!best || slotScore < best.slotScore) best = { day, member, period: periods[p], room, slotScore };
          break;
        }
      }
      if (best) own.push(best);
    }
    if (own.length < member.SoBuoiYeuCau) return {
      reason: 'INSUFFICIENT_SLOTS', message: `${member.MaLopHocPhan}: chỉ có ${own.length} ngày có phòng/ca hợp lệ, cần ${member.SoBuoiYeuCau} buổi.`
    };
    options.set(member.LoaiHoc, own);
  }
  const start = Math.min(...group.members.map(row => dayNumber(row.NgayBatDau)));
  const end = Math.max(...group.members.map(row => dayNumber(row.NgayKetThuc)));
  const total = group.TongSoBuoi;
  if (Math.floor((end - start) / MIN_DAY_GAP) + 1 < total) return {
    reason: 'INSUFFICIENT_DAYS', message: `Khoảng học không đủ ${total} buổi cách nhau ít nhất ${MIN_DAY_GAP} ngày.`
  };
  const weeks = Math.floor((weekStart(end) - weekStart(start)) / 7) + 1;
  if (weeks * MAX_WEEKLY_MEETINGS < total) return { reason: 'WEEKLY_CAPACITY', message: `Không đủ tuần để xếp ${total} buổi với tối đa 3 buổi/tuần.` };
  const members = [...group.members].sort((a, b) => ({ LT: 0, BT: 1, TH: 2 }[a.LoaiHoc] ?? 3) - ({ LT: 0, BT: 1, TH: 2 }[b.LoaiHoc] ?? 3));
  const initialCounts = Object.fromEntries(members.map(row => [row.LoaiHoc, 0]));
  let beam = weekdayPatterns().filter(pattern => pattern.length * weeks >= total)
    .map(pattern => ({ pattern, chosen: [], counts: initialCounts, lastDay: start - MIN_DAY_GAP,
      lastType: null, weekCount: 0, score: pattern.length * 0.05 }));
  for (let depth = 0; depth < total; depth++) {
    const next = new Map();
    // Midpoint of each equal-duration segment spreads teaching across the entire window.
    const ideal = start + (end - start) * (depth + 0.5) / total;
    for (const state of beam) {
      for (const member of members) {
        const type = member.LoaiHoc;
        if (state.counts[type] >= member.SoBuoiYeuCau || (members.length > 1 && type === state.lastType)) continue;
        const followsPattern = day => {
          const week = weekStart(day);
          const firstDay = state.pattern.find(thu => week + thu - 2 >= start);
          const expected = state.chosen.length && week === weekStart(state.lastDay)
            ? state.pattern[state.pattern.indexOf(weekday(state.lastDay)) + 1] : firstDay;
          return weekday(day) === expected;
        };
        const candidates = options.get(type).filter(option => followsPattern(option.day) && option.day >= state.lastDay + MIN_DAY_GAP
          && (weekStart(option.day) !== weekStart(state.lastDay) || state.weekCount < MAX_WEEKLY_MEETINGS)
          && Math.floor((end - option.day) / MIN_DAY_GAP) >= total - depth - 1)
          .sort((a, b) => Math.abs(a.day - ideal) - Math.abs(b.day - ideal) || a.slotScore - b.slotScore || a.day - b.day)
          .slice(0, context.limits.datesPerType);
        for (const option of candidates) {
          context.metrics.states++;
          if (++ticks % 128 === 0) await context.checkpoint();
          if (context.expired()) return { reason: 'SEARCH_LIMIT', message: 'Đã chạm giới hạn tìm kiếm; chưa tìm được phương án đủ buổi.' };
          const counts = { ...state.counts, [type]: state.counts[type] + 1 };
          const remaining = members.map(row => row.SoBuoiYeuCau - counts[row.LoaiHoc]);
          const remainingTotal = total - depth - 1;
          if (members.length > 1 && members.some((row, index) => remaining[index] > remainingTotal - remaining[index] + (row.LoaiHoc === type ? 0 : 1))) continue;
          if (members.some((row, index) => options.get(row.LoaiHoc).filter(slot => slot.day >= option.day + MIN_DAY_GAP).length < remaining[index])) continue;
          const weekCount = weekStart(option.day) === weekStart(state.lastDay) ? state.weekCount + 1 : 1;
          const score = state.score + Math.abs(option.day - ideal) / Math.max(2, (end - start + 1) / total)
            + (weekCount - 1) * 0.35 + option.slotScore + (depth === 0 && type !== 'LT' && members.some(row => row.LoaiHoc === 'LT') ? 0.5 : 0);
          const key = JSON.stringify([state.pattern, members.map(row => counts[row.LoaiHoc]), option.day, type, weekCount]);
          if (!next.has(key) || score < next.get(key).score) next.set(key, { pattern: state.pattern, chosen: [...state.chosen, option], counts, lastDay: option.day, lastType: type, weekCount, score });
        }
      }
    }
    beam = [...next.values()].sort((a, b) => a.score - b.score || a.lastDay - b.lastDay).slice(0, context.limits.beamWidth);
    if (!beam.length) return { reason: 'NO_FEASIBLE_PLAN_FOUND', message: 'Chưa tìm được phương án đủ định mức trên các thứ cố định, xen kẽ và cách ngày trong giới hạn tìm kiếm.' };
  }
  const best = beam[0];
  const rows = best.chosen.map((option, index) => ({
    MaLopHocPhan: option.member.MaLopHocPhan, MaNhomXep: group.MaNhomXep,
    TenLopHocPhan: option.member.TenLopHocPhan, TenMonHoc: option.member.TenMonHoc,
    LoaiHoc: option.member.LoaiHoc, ThuCoDinh: best.pattern, ThuTrongTuan: weekday(option.day),
    MaTiet: option.period.MaTiet, TenTiet: option.period.TenTiet,
    GioBatDau: option.period.GioBatDau, GioKetThuc: option.period.GioKetThuc,
    MaPhong: option.room.MaPhong, TenPhong: option.room.TenPhong, MaToaNha: option.room.MaToaNha,
    NgayBatDau: dayString(option.day), NgayKetThuc: dayString(option.day), NgayHoc: dayString(option.day),
    SoTiet: 3, ThuTuBuoiNhom: index + 1, NguonXep: 'Auto', TrangThai: 'Draft', DaKhoa: 0, LyDo: []
  }));
  const errors = validateWorkload(rows, [group], data.periods);
  if (errors.length) throw new Error(`Phương án không qua kiểm tra định mức: ${errors.join(' ')}`);
  return { rows, score: best.score };
};

const solveWorkload = async ({ groups, data, classes, checkpoint = async () => {}, limits = {} }) => {
  const started = Date.now();
  const metrics = { candidates: 0, states: 0, passes: 0, durationMs: 0 };
  const settings = { ...DEFAULT_LIMITS, ...limits };
  const context = { metrics, limits: settings,
    expired: () => Date.now() - started >= settings.maxMs || metrics.states >= settings.maxStates,
    checkpoint: async () => { await new Promise(resolve => setImmediate(resolve)); await checkpoint(metrics); }
  };
  // Constrained groups first: shortest window per required meeting, then stable group ID.
  const sorted = [...groups].sort((a, b) => {
    const slack = group => (Math.max(...group.members.map(row => dayNumber(row.NgayKetThuc))) - Math.min(...group.members.map(row => dayNumber(row.NgayBatDau))) + 1) / group.TongSoBuoi;
    return slack(a) - slack(b) || a.MaNhomXep.localeCompare(b.MaNhomXep);
  });
  let best = null;
  for (let pass = 0; pass < settings.maxPasses && !context.expired(); pass++) {
    metrics.passes++;
    const order = pass === 0 ? sorted : sorted.slice(pass % sorted.length).concat(sorted.slice(0, pass % sorted.length));
    const occupancy = createOccupancy(data, classes);
    const results = [];
    let score = 0;
    let completeClasses = 0;
    for (const group of order) {
      await checkpoint(metrics, group);
      const result = await solveGroup(group, data, occupancy, context);
      results.push({ group, ...result });
      if (result.rows) {
        result.rows.forEach(occupancy.add);
        completeClasses += group.members.length;
        score += result.score;
      }
    }
    if (!best || completeClasses > best.completeClasses || (completeClasses === best.completeClasses && score < best.score)) best = { results, completeClasses, score };
    if (results.every(result => result.rows)) break;
  }
  metrics.durationMs = Date.now() - started;
  return { results: best?.results || groups.map(group => ({ group, reason: 'SEARCH_LIMIT', message: 'Chưa xử lý do giới hạn tìm kiếm.' })), metrics };
};

module.exports = { solveWorkload, DEFAULT_LIMITS };
