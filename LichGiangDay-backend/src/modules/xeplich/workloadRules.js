const DAY_MS = 86400000;
const RULE_VERSION = 3;
const PERIODS_PER_MEETING = 3;
const MIN_DAY_GAP = 2;
const MAX_WEEKLY_MEETINGS = 3;
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

const quotaFor = (credits, types) => {
  const signature = [...types].sort().join('+');
  if (credits === 3 && signature === 'BT+LT') return { LT: 10, BT: 10 };
  if (credits === 3 && signature === 'BT+LT+TH') return { LT: 10, BT: 5, TH: 5 };
  if (credits === 2 && signature === 'BT+LT') return { LT: 5, BT: 5 };
  if (credits === 3 && types.length > 0 && types.length <= 20 && types.every(Boolean)) {
    const ordered = [...types].sort();
    return Object.fromEntries(ordered.map((type, index) => [type,
      Math.floor(20 / ordered.length) + (index < 20 % ordered.length ? 1 : 0)]));
  }
  return null;
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
    const quotas = quotaFor(group.SoTinChi, [...new Set(types)]);
    if (!quotas) group.issues.push(`Chưa có định mức cho ${group.SoTinChi} tín chỉ và tổ hợp ${types.join('/')}.`);
    for (const member of group.members) {
      member.SoBuoiYeuCau = quotas?.[member.LoaiHoc] || 0;
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
      if (!Number(member.SiSo || member.SiSoDangKy || member.SiSoDuKien)) group.issues.push(`${member.MaLopHocPhan}: thiếu sĩ số.`);
      if (member.DaCoLich) group.issues.push(`${member.MaLopHocPhan}: đã có lịch chính thức; cần xử lý lịch cũ trước khi xếp lại cả nhóm.`);
    }
    group.TongSoBuoi = group.members.reduce((sum, row) => sum + row.SoBuoiYeuCau, 0);
    group.TongSoTiet = group.TongSoBuoi * PERIODS_PER_MEETING;
    group.KhoangCachNgay = MIN_DAY_GAP;
    group.ToiDaBuoiMoiTuan = MAX_WEEKLY_MEETINGS;
    group.issues = [...new Set(group.issues)];
  }
  return [...groups.values()];
};

// Reused for draft edits and final apply; quotas are checked as a whole group.
const validateWorkload = (rows, groups, periods) => {
  const errors = [];
  const periodMap = new Map(periods.map(row => [Number(row.MaTiet), row]));
  const covered = new Set();
  for (const group of groups) {
    const ids = new Set(group.members.map(row => row.MaLopHocPhan));
    const meetings = rows.filter(row => row.TrangThai === 'Draft' && ids.has(row.MaLopHocPhan));
    if (!meetings.length) continue;
    group.issues.forEach(message => errors.push(message));
    for (const member of group.members) {
      covered.add(member.MaLopHocPhan);
      const own = meetings.filter(row => row.MaLopHocPhan === member.MaLopHocPhan);
      if (own.length !== member.SoBuoiYeuCau) errors.push(`${member.MaLopHocPhan}: cần đúng ${member.SoBuoiYeuCau} buổi (${member.SoTietYeuCau} tiết), hiện có ${own.length}.`);
      for (const row of own) {
        const day = dayNumber(row.NgayBatDau);
        if (!Number.isFinite(day) || row.NgayBatDau !== row.NgayKetThuc || weekday(day) !== Number(row.ThuTrongTuan)
          || day < dayNumber(member.NgayBatDau) || day > dayNumber(member.NgayKetThuc)) {
          errors.push(`${member.MaLopHocPhan}: mỗi dòng phải là một ngày học cụ thể, đúng thứ và trong thời gian lớp.`);
        }
        if (Number.isFinite(day) && weekday(day) === 8) errors.push(`${member.MaLopHocPhan}: Chủ nhật là ngày nghỉ, không được xếp buổi học.`);
        if (periodUnits(periodMap.get(Number(row.MaTiet)) || {}) !== PERIODS_PER_MEETING) errors.push(`${member.MaLopHocPhan}: mỗi buổi phải gồm đúng 3 tiết.`);
      }
    }
    const ordered = [...meetings].sort((a, b) => dayNumber(a.NgayBatDau) - dayNumber(b.NgayBatDau));
    const pattern = meetings[0].ThuCoDinh;
    const validPattern = Array.isArray(pattern) && pattern.length >= 1 && pattern.length <= 3
      && pattern.every((day, i) => Number.isInteger(day) && day >= 2 && day <= 7
        && (!i || day - pattern[i - 1] >= MIN_DAY_GAP))
      && (pattern.length === 1 || 7 + pattern[0] - pattern.at(-1) >= MIN_DAY_GAP);
    if (!validPattern || meetings.some(row => JSON.stringify(row.ThuCoDinh) !== JSON.stringify(pattern))) {
      errors.push(`${group.NhomLop}: thiếu hoặc không thống nhất các thứ học cố định.`);
    } else {
      const start = Math.min(...group.members.map(row => dayNumber(row.NgayBatDau)));
      const byWeek = new Map();
      for (const row of ordered) {
        const week = weekStart(dayNumber(row.NgayBatDau));
        if (!byWeek.has(week)) byWeek.set(week, []);
        byWeek.get(week).push(Number(row.ThuTrongTuan));
      }
      for (const [week, days] of byWeek) {
        const available = pattern.filter(day => week + day - 2 >= start);
        if (days.some((day, i) => day !== available[i])) {
          errors.push(`${group.NhomLop}: các tuần phải giữ cùng mẫu thứ học; tuần ít buổi dùng các thứ đầu của mẫu.`);
        }
      }
    }
    const counts = new Map();
    const typeByClass = new Map(group.members.map(row => [row.MaLopHocPhan, row.LoaiHoc]));
    for (let i = 0; i < ordered.length; i++) {
      const day = dayNumber(ordered[i].NgayBatDau);
      const week = weekStart(day);
      counts.set(week, (counts.get(week) || 0) + 1);
      if (i && day - dayNumber(ordered[i - 1].NgayBatDau) < MIN_DAY_GAP) errors.push(`${group.NhomLop}: hai buổi phải cách nhau ít nhất 2 ngày.`);
      if (i && group.members.length > 1 && typeByClass.get(ordered[i].MaLopHocPhan) === typeByClass.get(ordered[i - 1].MaLopHocPhan)) {
        errors.push(`${group.NhomLop}: phải xen kẽ loại học giữa hai buổi liên tiếp.`);
      }
    }
    if ([...counts.values()].some(count => count > MAX_WEEKLY_MEETINGS)) errors.push(`${group.NhomLop}: không được vượt quá 3 buổi trong một tuần (Thứ 2–Chủ nhật).`);
  }
  if (rows.some(row => row.TrangThai === 'Draft' && !covered.has(row.MaLopHocPhan))) errors.push('Có dòng nháp không thuộc nhóm định mức hiện tại.');
  return [...new Set(errors)];
};

module.exports = { RULE_VERSION, PERIODS_PER_MEETING, MIN_DAY_GAP, MAX_WEEKLY_MEETINGS,
  dateOnly, dayNumber, dayString, weekday, weekStart, periodUnits, identifyGroup, quotaFor, buildGroups, validateWorkload };
