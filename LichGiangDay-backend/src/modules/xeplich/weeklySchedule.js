const { getSoBuoiMoiTuan } = require('./xeplich.config');
const day = value => Date.parse(`${String(value || '').slice(0, 10)}T00:00:00Z`) / 86400000;
const weekday = value => ((new Date(value * 86400000).getUTCDay() + 6) % 7) + 2;
const units = period => {
  const match = String(period?.TenTiet || '').match(/(\d+)\s*[-–—]\s*(\d+)/);
  return Number(period?.SoTiet) || (match ? Number(match[2]) - Number(match[1]) + 1 : 0);
};
const patterns = count => count === 1 ? [2, 3, 4, 5, 6, 7].map(value => [value])
  : [2, 3, 4, 5, 6, 7].flatMap(a => [2, 3, 4, 5, 6, 7].filter(b => b - a >= 2 && 7 + a - b >= 2).map(b => [a, b]));
const validateWeekly = (member, rows) => {
  const errors = [];
  const count = getSoBuoiMoiTuan(member.LoaiHoc, member.SoTinChi);
  if (rows.length !== count) errors.push(`Lớp ${member.MaLopHocPhan} cần đúng ${count} buổi/tuần.`);
  const days = rows.map(row => Number(row.ThuTrongTuan)).sort((a, b) => a - b);
  if (!patterns(count).some(pattern => JSON.stringify(pattern) === JSON.stringify(days))) errors.push('Chỉ học Thứ 2–Thứ 7; hai buổi của cùng lớp cách nhau ít nhất 2 ngày, kể cả qua tuần sau.');
  if (new Set(rows.map(row => row.MaPhong)).size !== 1) errors.push('Phải giữ cùng phòng học cho lớp trong toàn thời gian học.');
  for (const row of rows) {
    if (String(row.NgayBatDau).slice(0, 10) !== String(member.NgayBatDau).slice(0, 10)
      || String(row.NgayKetThuc).slice(0, 10) !== String(member.NgayKetThuc).slice(0, 10)) errors.push('Mẫu tuần phải trải hết thời gian bắt đầu–kết thúc của lớp.');
    if (units(row) !== 3) errors.push('Mỗi buổi phải gồm đúng 3 tiết.');
    const start = day(row.NgayBatDau), end = day(row.NgayKetThuc);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || end - start > 730) errors.push('Khoảng ngày học không hợp lệ.');
    else {
      const first = start + (Number(row.ThuTrongTuan) - weekday(start) + 7) % 7;
      if (first > end) errors.push('Mẫu thứ không có ngày học nào trong thời gian lớp.');
    }
  }
  return [...new Set(errors)];
};
const findWeeklyTemplate = async ({ member, rooms, periods, check, checkpoint = async () => {} }) => {
  let attempts = 0;
  const started = Date.now();
  const lastConflicts = [];
  for (const room of rooms) for (const pattern of patterns(getSoBuoiMoiTuan(member.LoaiHoc, member.SoTinChi))) {
    for (const period of periods.filter(item => units(item) === 3)) {
      const rows = [];
      for (const thu of pattern) {
        await checkpoint();
        if (++attempts > 2048 || Date.now() - started > 30000) return { rows: null, attempts, conflicts: [{ message: 'Đã chạm giới hạn tìm kiếm mẫu tuần.' }] };
        const row = { MaLopHocPhan: member.MaLopHocPhan, TenLopHocPhan: member.TenLopHocPhan,
          TenMonHoc: member.TenMonHoc, LoaiHoc: member.LoaiHoc, ThuTrongTuan: thu,
          MaTiet: period.MaTiet, TenTiet: period.TenTiet, GioBatDau: period.GioBatDau, GioKetThuc: period.GioKetThuc,
          MaPhong: room.MaPhong, TenPhong: room.TenPhong, MaToaNha: room.MaToaNha,
          NgayBatDau: String(member.NgayBatDau).slice(0, 10), NgayKetThuc: String(member.NgayKetThuc).slice(0, 10),
          SoTiet: 3, NguonXep: 'Auto', TrangThai: 'Draft', DaKhoa: 0, LyDo: [] };
        const result = await check(row);
        if (!result.valid) { lastConflicts.push(...result.conflicts.slice(0, 2)); break; }
        rows.push(row);
      }
      if (rows.length === pattern.length && !validateWeekly(member, rows).length) return { rows, attempts, conflicts: [] };
    }
  }
  return { rows: null, attempts, conflicts: lastConflicts.slice(-10) };
};
module.exports = { validateWeekly, findWeeklyTemplate, patterns, units };
