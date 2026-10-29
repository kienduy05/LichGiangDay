const DAY_MS = 86400000;
const RULE_VERSION = 4;
const PERIODS_PER_MEETING = 3;
const MIN_DAY_GAP = 2;
const dateOnly = value => String(value || '').slice(0, 10);
const dayNumber = value => {
  const date = dateOnly(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NaN;
  const time = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date ? time / DAY_MS : NaN;
};
const dayString = day => new Date(day * DAY_MS).toISOString().slice(0, 10);
const weekday = day => ((new Date(day * DAY_MS).getUTCDay() + 6) % 7) + 2;
const weekStart = day => day - (weekday(day) - 2);

const periodUnits = period => {
  if (Number.isInteger(Number(period.SoTiet)) && Number(period.SoTiet) > 0) return Number(period.SoTiet);
  const match = String(period.TenTiet || '').match(/(\d+)\s*[-–—]\s*(\d+)/);
  return match && Number(match[2]) >= Number(match[1]) ? Number(match[2]) - Number(match[1]) + 1 : 0;
};

const identifyGroup = row => {
  const parts = String(row.MaLopHocPhan || '').toUpperCase().split('.');
  const codeCohort = /^K\d+$/.test(parts.at(-1) || '') ? parts.at(-1) : '';
  const codeGroup = codeCohort && /^[A-Z]+\d+$/.test(parts.at(-2) || '') ? parts.at(-2) : '';
  const nameGroup = String(row.TenLopHocPhan || '').toUpperCase().match(/\(([A-Z]+\d+)\)\s*$/)?.[1] || '';
  const group = String(row.NhomLop || codeGroup || nameGroup).trim().toUpperCase();
  const cohort = String(row.KhoaHoc || codeCohort).trim().toUpperCase();
  const issue = !group || !cohort ? 'Không xác định được nhóm lớp (ví dụ QT01) và khóa; cần chuẩn hóa mã/tên lớp trước khi ghép LT/BT/TH.'
    : codeGroup && nameGroup && codeGroup !== nameGroup ? 'Nhóm trong mã lớp và tên lớp không khớp.'
      : codeCohort && row.KhoaHoc && codeCohort !== cohort ? 'Khóa trong mã lớp và dữ liệu khóa không khớp.' : null;
  return { group, cohort, issue, key: issue ? `INVALID:${row.MaLopHocPhan}` : JSON.stringify([row.MaHocKy, row.MaMonHoc, group, cohort]) };
};

// Weekly frequency replaces the former total-period quotas.
const buoiMoiTuan = (credits, type) => {
  if (![2, 3].includes(Number(credits))) return null;
  return Number(credits) === 3 && String(type).trim().toUpperCase() === 'LT' ? 2 : 1;
};
const weeklyPatterns = frequency => {
  if (frequency === 1) return [2, 3, 4, 5, 6, 7].map(day => [day]);
  if (frequency !== 2) return [];
  const result = [];
  for (let a = 2; a <= 7; a++) for (let b = a + MIN_DAY_GAP; b <= 7; b++) {
    if (7 + a - b >= MIN_DAY_GAP) result.push([a, b]);
  }
  return result;
};
const datesForPattern = (member, pattern) => {
  const result = [];
  const start = dayNumber(member.NgayBatDau); const end = dayNumber(member.NgayKetThuc);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end - start > 730) return result;
  for (let day = start; day <= end; day++) if (pattern.includes(weekday(day))) result.push(day);
  return result;
};

const buildGroups = classes => {
  const groups = new Map();
  for (const row of classes) {
    const identity = identifyGroup(row);
    if (!groups.has(identity.key)) groups.set(identity.key, {
      MaNhomXep: identity.key, NhomLop: identity.group, KhoaHoc: identity.cohort,
      MaMonHoc: row.MaMonHoc, MaHocKy: row.MaHocKy, SoTinChi: Number(row.SoTinChi),
      members: [], issues: identity.issue ? [identity.issue] : []
    });
    groups.get(identity.key).members.push({ ...row, LoaiHoc: String(row.LoaiHoc || '').trim().toUpperCase() });
  }
  for (const group of groups.values()) {
    const types = group.members.map(row => row.LoaiHoc);
    if (new Set(types).size !== types.length) group.issues.push('Nhóm có nhiều lớp cùng loại học; không thể tự xác định cặp LT/BT/TH.');
    if (group.members.some(row => Number(row.SoTinChi) !== group.SoTinChi)) group.issues.push('Số tín chỉ trong nhóm không đồng nhất.');
    for (const member of group.members) {
      member.SoBuoiMoiTuan = buoiMoiTuan(group.SoTinChi, member.LoaiHoc);
      if (!member.SoBuoiMoiTuan || !member.LoaiHoc) group.issues.push(`${member.MaLopHocPhan}: chưa có quy tắc số buổi/tuần cho dữ liệu tín chỉ/loại học này.`);
      const counts = weeklyPatterns(member.SoBuoiMoiTuan).map(pattern => datesForPattern(member, pattern).length);
      member.SoBuoiToiThieu = counts.length ? Math.min(...counts) : 0;
      member.SoBuoiToiDa = counts.length ? Math.max(...counts) : 0;
      member.SoBuoiYeuCau = member.SoBuoiToiThieu;
      member.SoTietYeuCau = member.SoBuoiYeuCau * PERIODS_PER_MEETING;
      const start = dayNumber(member.NgayBatDau);
      const end = dayNumber(member.NgayKetThuc);
      const termStart = dayNumber(member.HocKyBatDau);
      const termEnd = dayNumber(member.HocKyKetThuc);
      if (![start, end, termStart, termEnd].every(Number.isFinite) || start > end || termStart > termEnd) {
        group.issues.push(`${member.MaLopHocPhan}: thiếu hoặc sai khoảng ngày học/học kỳ.`);
      } else if (start < termStart || end > termEnd) {
        group.issues.push(`${member.MaLopHocPhan}: ngày học ${dateOnly(member.NgayBatDau)}–${dateOnly(member.NgayKetThuc)} ngoài học kỳ ${dateOnly(member.HocKyBatDau)}–${dateOnly(member.HocKyKetThuc)}.`);
      } else if (end - start > 730) group.issues.push(`${member.MaLopHocPhan}: khoảng học vượt quá 2 năm.`);
      if (!(Number(member.SiSo || member.SiSoDangKy || member.SiSoDuKien) > 0)) group.issues.push(`${member.MaLopHocPhan}: thiếu sĩ số.`);
      if (member.DaCoLich) group.issues.push(`${member.MaLopHocPhan}: đã có lịch chính thức; cần xử lý lịch cũ trước khi xếp lại cả nhóm.`);
    }
    group.TongSoBuoi = group.members.reduce((sum, row) => sum + row.SoBuoiYeuCau, 0);
    group.TongSoTiet = group.TongSoBuoi * PERIODS_PER_MEETING;
    group.KhoangCachNgay = MIN_DAY_GAP;
    group.ToiDaBuoiMoiTuan = group.members.reduce((sum, row) => sum + (row.SoBuoiMoiTuan || 0), 0);
    group.issues = [...new Set(group.issues)];
  }
  return [...groups.values()];
};

// Validate the entire recurring template, including every occurrence in the class window.
const validateWorkload = (rows, groups, periods) => {
  const errors = [];
  const periodMap = new Map(periods.map(row => [Number(row.MaTiet), row]));
  const covered = new Set();
  for (const group of groups) {
    const ids = new Set(group.members.map(row => row.MaLopHocPhan));
    const meetings = rows.filter(row => row.TrangThai === 'Draft' && ids.has(row.MaLopHocPhan));
    if (!meetings.length) continue;
    errors.push(...group.issues);
    for (const member of group.members) {
      covered.add(member.MaLopHocPhan);
      const own = meetings.filter(row => row.MaLopHocPhan === member.MaLopHocPhan);
      const pattern = own[0]?.ThuCoDinh;
      if (!weeklyPatterns(member.SoBuoiMoiTuan).some(valid => JSON.stringify(valid) === JSON.stringify(pattern))) {
        errors.push(`${member.MaLopHocPhan}: cần mẫu cố định ${member.SoBuoiMoiTuan} buổi/tuần, không học Chủ nhật.`);
        continue;
      }
      const expected = datesForPattern(member, pattern).map(dayString);
      const actual = own.map(row => row.NgayBatDau).sort();
      if (JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`${member.MaLopHocPhan}: phải học đủ mọi tuần từ ngày bắt đầu đến kết thúc theo mẫu; cần ${expected.length} buổi.`);
      if (new Set(own.map(row => row.MaPhong)).size !== 1) errors.push(`${member.MaLopHocPhan}: phải giữ cùng phòng học trong toàn bộ thời gian lớp.`);
      const periodByWeekday = new Map();
      for (const row of own) {
        const day = dayNumber(row.NgayBatDau);
        if (!Number.isFinite(day) || row.NgayBatDau !== row.NgayKetThuc || weekday(day) !== Number(row.ThuTrongTuan)) errors.push(`${member.MaLopHocPhan}: ngày học hoặc thứ không hợp lệ.`);
        if (Number.isFinite(day) && weekday(day) === 8) errors.push(`${member.MaLopHocPhan}: Chủ nhật là ngày nghỉ.`);
        if (JSON.stringify(row.ThuCoDinh) !== JSON.stringify(pattern)) errors.push(`${member.MaLopHocPhan}: mẫu thứ không thống nhất.`);
        if (periodUnits(periodMap.get(Number(row.MaTiet)) || {}) !== PERIODS_PER_MEETING) errors.push(`${member.MaLopHocPhan}: mỗi buổi phải gồm 3 tiết.`);
        const thu = Number(row.ThuTrongTuan);
        if (periodByWeekday.has(thu) && periodByWeekday.get(thu) !== Number(row.MaTiet)) errors.push(`${member.MaLopHocPhan}: ca học của cùng thứ phải giống nhau giữa các tuần.`);
        periodByWeekday.set(thu, Number(row.MaTiet));
      }
    }
    // Components of one group cannot overlap even if student-class links are absent.
    for (let i = 0; i < meetings.length; i++) for (let j = i + 1; j < meetings.length; j++) {
      const a = meetings[i], b = meetings[j];
      const pa = periodMap.get(Number(a.MaTiet)), pb = periodMap.get(Number(b.MaTiet));
      if (a.NgayBatDau === b.NgayBatDau && pa && pb && pa.GioBatDau < pb.GioKetThuc && pb.GioBatDau < pa.GioKetThuc) errors.push(`${group.NhomLop}: trùng giờ giữa các lớp thành phần cùng nhóm.`);
    }
  }
  if (rows.some(row => row.TrangThai === 'Draft' && !covered.has(row.MaLopHocPhan))) errors.push('Có dòng nháp không thuộc nhóm hiện tại.');
  return [...new Set(errors)];
};
module.exports = { RULE_VERSION, PERIODS_PER_MEETING, MIN_DAY_GAP,
  dateOnly, dayNumber, dayString, weekday, weekStart, periodUnits, identifyGroup, buoiMoiTuan,
  weeklyPatterns, datesForPattern, buildGroups, validateWorkload };
