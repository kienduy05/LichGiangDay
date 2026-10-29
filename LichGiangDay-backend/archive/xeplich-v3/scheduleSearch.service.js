const db = require('../../../config/db');
const { getBlockedDates, getBlockedWeekdays, isRoomCompatible } = require('./xeplich.config');

const dateOnly = value => String(value || '').slice(0, 10);
const overlaps = (a, b) => Number(a.ThuTrongTuan) === Number(b.ThuTrongTuan)
  && dateOnly(a.NgayBatDau) <= dateOnly(b.NgayKetThuc)
  && dateOnly(a.NgayKetThuc) >= dateOnly(b.NgayBatDau)
  && String(a.GioBatDau) < String(b.GioKetThuc)
  && String(a.GioKetThuc) > String(b.GioBatDau);

// Snapshot is used only for generating drafts. Applying a draft still validates
// against the current database inside the existing transaction.
class ScheduleSearchService {
  static prepare = async ({ lop, rooms, periods, session }, connection = db) => {
    const [official] = await connection.query(`
      SELECT tkb.*, th.GioBatDau, th.GioKetThuc, other.MaGiangVien
      FROM ThoiKhoaBieu tkb
      JOIN TietHoc th ON th.MaTiet = tkb.MaTiet
      JOIN LopHocPhan other ON other.MaLopHocPhan = tkb.MaLopHocPhan
      WHERE tkb.NgayBatDau <= ? AND tkb.NgayKetThuc >= ?
    `, [dateOnly(lop.NgayKetThuc), dateOnly(lop.NgayBatDau)]);
    const [related] = await connection.query(`
      SELECT DISTINCT shared.MaLopHocPhan
      FROM LopHocPhan_LopSinhVien own
      JOIN LopHocPhan_LopSinhVien shared ON shared.MaLopSinhVien = own.MaLopSinhVien
      WHERE own.MaLopHocPhan = ? AND shared.MaLopHocPhan <> ?
    `, [lop.MaLopHocPhan, lop.MaLopHocPhan]);
    const relatedIds = new Set(related.map(row => row.MaLopHocPhan));
    const lecturerIds = new Set();
    if (lop.MaGiangVien) {
      const [classes] = await connection.query(
        'SELECT MaLopHocPhan FROM LopHocPhan WHERE MaGiangVien = ?', [lop.MaGiangVien]
      );
      classes.forEach(row => lecturerIds.add(row.MaLopHocPhan));
    }
    const periodsById = new Map(periods.map(row => [Number(row.MaTiet), row]));
    const roomsById = new Map(rooms.map(row => [row.MaPhong, row]));
    const officialByDay = new Map();
    official.forEach(row => {
      const day = Number(row.ThuTrongTuan);
      if (!officialByDay.has(day)) officialByDay.set(day, []);
      officialByDay.get(day).push(row);
    });
    const blockedDays = getBlockedWeekdays();
    const blockedDates = [...getBlockedDates()];

    return {
      check: ({ thuTrongTuan, maTiet, maPhong }) => {
        const period = periodsById.get(Number(maTiet));
        const room = roomsById.get(maPhong);
        const context = { lopHocPhan: lop, tietHoc: period, phongHoc: room };
        const fail = (code, message) => ({ valid: false, conflicts: [{ code, message }], context });
        if (!period || String(period.GioBatDau) >= String(period.GioKetThuc)) {
          return fail('INVALID_PERIOD', 'Ca học không hợp lệ.');
        }
        if (!room) {
          return fail('ROOM_NOT_FOUND', `Phòng '${maPhong}' không tồn tại trong danh sách phòng phù hợp.`);
        }
        if (Number(room.SucChua || 0) < Number(lop.SiSo || 0)) {
          return fail('ROOM_CAPACITY', `Phòng '${room.TenPhong}' chỉ có ${room.SucChua} chỗ, cần ${lop.SiSo}.`);
        }
        if (!isRoomCompatible(lop.LoaiHoc, room.LoaiPhong)) {
          return fail('ROOM_TYPE_MISMATCH', `Loại phòng '${room.LoaiPhong || 'N/A'}' không phù hợp loại học '${lop.LoaiHoc}'.`);
        }
        if (dateOnly(lop.NgayBatDau) > dateOnly(lop.NgayKetThuc)
          || dateOnly(lop.NgayBatDau) < dateOnly(lop.HocKyBatDau)
          || dateOnly(lop.NgayKetThuc) > dateOnly(lop.HocKyKetThuc)) {
          return fail('SEMESTER_RANGE', 'Khoảng ngày học không hợp lệ hoặc nằm ngoài học kỳ.');
        }
        if (blockedDays.has(Number(thuTrongTuan))) return fail('BLOCKED_WEEKDAY', 'Thứ này bị khóa xếp lịch.');
        for (const date of blockedDates) {
          if (date < dateOnly(lop.NgayBatDau) || date > dateOnly(lop.NgayKetThuc)) continue;
          const day = new Date(`${date}T12:00:00`).getDay();
          if ((day === 0 ? 8 : day + 1) === Number(thuTrongTuan)) {
            return fail('BLOCKED_DATE', `Khoảng lịch có ngày bị khóa ${date}.`);
          }
        }
        const candidate = { ...lop, ...period, ThuTrongTuan: thuTrongTuan };
        for (const row of officialByDay.get(Number(thuTrongTuan)) || []) {
          if (row.MaLopHocPhan === lop.MaLopHocPhan || !overlaps(candidate, row)) continue;
          if (row.MaPhong === maPhong) return fail('ROOM_CONFLICT', `Phòng đã có lịch của lớp ${row.MaLopHocPhan}.`);
          if (relatedIds.has(row.MaLopHocPhan)) return fail('STUDENT_CONFLICT', `Trùng lớp sinh viên với lớp ${row.MaLopHocPhan}.`);
          if (lop.MaGiangVien && row.MaGiangVien === lop.MaGiangVien) return fail('LECTURER_CONFLICT', 'Giảng viên đã có lịch dạy.');
        }
        for (const row of session.dong) {
          if (row.TrangThai !== 'Draft') continue;
          const draftPeriod = periodsById.get(Number(row.MaTiet));
          if (!draftPeriod || !overlaps(candidate, { ...row, ...draftPeriod })) continue;
          if (row.MaPhong === maPhong) return fail('DRAFT_ROOM_CONFLICT', `Phòng đã được lớp nháp ${row.MaLopHocPhan} sử dụng.`);
          if (row.MaLopHocPhan === lop.MaLopHocPhan) return fail('CLASS_INTERNAL_CONFLICT', 'Các buổi học của lớp bị trùng nhau.');
          if (relatedIds.has(row.MaLopHocPhan)) return fail('DRAFT_STUDENT_CONFLICT', `Trùng lớp sinh viên với lớp nháp ${row.MaLopHocPhan}.`);
          if (lecturerIds.has(row.MaLopHocPhan)) return fail('DRAFT_LECTURER_CONFLICT', 'Giảng viên đã có lịch nháp.');
        }
        return { valid: true, conflicts: [], context };
      }
    };
  };
}

module.exports = ScheduleSearchService;
