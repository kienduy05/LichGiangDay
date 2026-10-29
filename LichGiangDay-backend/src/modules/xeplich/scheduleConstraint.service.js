const db = require('../../../config/db');
const XepLichStore = require('./xeplich.store');
const {
  getBlockedDates,
  getBlockedWeekdays,
  isRoomCompatible
} = require('./xeplich.config');

const pushConflict = (conflicts, code, message, details = null) => {
  conflicts.push({ code, message, details });
};

const dateOnly = value => String(value || '').slice(0, 10);
const rangesOverlap = (startA, endA, startB, endB) => (
  dateOnly(startA) <= dateOnly(endB) && dateOnly(endA) >= dateOnly(startB)
);
const timesOverlap = (startA, endA, startB, endB) => (
  String(startA) < String(endB) && String(endA) > String(startB)
);

class ScheduleConstraintService {
  static check = async ({
    maLopHocPhan,
    thuTrongTuan,
    maTiet,
    maPhong,
    ngayBatDau,
    ngayKetThuc,
    maPhien = null,
    excludeMaDong = null,
    draftRowsOverride = null
  }, connection = db) => {
    const conflicts = [];
    const thu = Number(thuTrongTuan);
    const tiet = Number(maTiet);
    const startDate = dateOnly(ngayBatDau);
    const endDate = dateOnly(ngayKetThuc);

    if (!maLopHocPhan || !maPhong || !startDate || !endDate || !Number.isInteger(thu) || !Number.isInteger(tiet)) {
      pushConflict(conflicts, 'INVALID_INPUT', 'Thiếu hoặc sai dữ liệu bắt buộc của vị trí xếp lịch.');
      return { valid: false, hasConflict: true, conflicts };
    }
    if (thu < 2 || thu > 8) {
      pushConflict(conflicts, 'INVALID_WEEKDAY', 'Thứ trong tuần phải nằm trong khoảng từ 2 đến 8.');
    }
    if (startDate > endDate) {
      pushConflict(conflicts, 'INVALID_DATE_RANGE', 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.');
    }

    const [classRows] = await connection.query(`
      SELECT lhp.MaLopHocPhan, lhp.TenLopHocPhan, lhp.MaHocKy,
             lhp.LoaiHoc, lhp.MaGiangVien,
             COALESCE(NULLIF(lhp.SiSoDangKy, 0), lhp.SiSoDuKien, 0) AS SiSo,
             hk.NgayBatDau AS HocKyBatDau, hk.NgayKetThuc AS HocKyKetThuc
      FROM LopHocPhan lhp
      JOIN HocKy hk ON hk.MaHocKy = lhp.MaHocKy
      WHERE lhp.MaLopHocPhan = ?
      LIMIT 1
    `, [maLopHocPhan]);
    if (classRows.length === 0) {
      pushConflict(conflicts, 'CLASS_NOT_FOUND', `Không tìm thấy lớp học phần '${maLopHocPhan}'.`);
      return { valid: false, hasConflict: true, conflicts };
    }
    const lop = classRows[0];

    if (startDate < dateOnly(lop.HocKyBatDau) || endDate > dateOnly(lop.HocKyKetThuc)) {
      pushConflict(conflicts, 'SEMESTER_RANGE', 'Khoảng ngày học phải nằm trong thời gian của học kỳ.', {
        hocKyBatDau: lop.HocKyBatDau,
        hocKyKetThuc: lop.HocKyKetThuc
      });
    }

    const [periodRows] = await connection.query(`
      SELECT MaTiet, TenTiet, GioBatDau, GioKetThuc
      FROM TietHoc WHERE MaTiet = ? LIMIT 1
    `, [tiet]);
    if (periodRows.length === 0) {
      pushConflict(conflicts, 'PERIOD_NOT_FOUND', `Ca/Tiết '${tiet}' không tồn tại.`);
      return { valid: false, hasConflict: true, conflicts };
    }
    const period = periodRows[0];
    if (String(period.GioBatDau) >= String(period.GioKetThuc)) {
      pushConflict(conflicts, 'INVALID_PERIOD', `Ca '${period.TenTiet}' có giờ bắt đầu không hợp lệ.`);
    }

    const [roomRows] = await connection.query(`
      SELECT MaPhong, TenPhong, MaToaNha, SucChua, LoaiPhong, TrangThai
      FROM PhongHoc WHERE MaPhong = ? LIMIT 1
    `, [maPhong]);
    if (roomRows.length === 0) {
      pushConflict(conflicts, 'ROOM_NOT_FOUND', `Phòng '${maPhong}' không tồn tại.`);
      return { valid: false, hasConflict: true, conflicts };
    }
    const room = roomRows[0];
    if (room.TrangThai !== 'Ready') {
      pushConflict(conflicts, 'ROOM_NOT_READY', `Phòng '${room.TenPhong}' không ở trạng thái sẵn sàng.`, room);
    }
    if (Number(room.SucChua || 0) < Number(lop.SiSo || 0)) {
      pushConflict(conflicts, 'ROOM_CAPACITY', `Phòng '${room.TenPhong}' có ${room.SucChua || 0} chỗ, không đủ cho ${lop.SiSo || 0} sinh viên.`, room);
    }
    if (!isRoomCompatible(lop.LoaiHoc, room.LoaiPhong)) {
      pushConflict(conflicts, 'ROOM_TYPE', `Loại phòng '${room.LoaiPhong || 'Chưa xác định'}' không phù hợp với kiểu học '${lop.LoaiHoc}'.`, room);
    }

    if (getBlockedWeekdays().has(thu)) {
      pushConflict(conflicts, 'BLOCKED_WEEKDAY', `Không được xếp lịch vào Thứ ${thu} theo cấu hình backend.`);
    }

    const [officialRoomConflicts] = await connection.query(`
      SELECT tkb.MaThoiKhoaBieu, tkb.MaLopHocPhan, lhp.TenLopHocPhan,
             th.TenTiet, ph.TenPhong
      FROM ThoiKhoaBieu tkb
      JOIN LopHocPhan lhp ON lhp.MaLopHocPhan = tkb.MaLopHocPhan
      JOIN TietHoc th ON th.MaTiet = tkb.MaTiet
      JOIN PhongHoc ph ON ph.MaPhong = tkb.MaPhong
      WHERE tkb.MaPhong = ? AND tkb.MaLopHocPhan <> ? AND tkb.ThuTrongTuan = ?
        AND tkb.NgayBatDau <= ? AND tkb.NgayKetThuc >= ?
        AND th.GioBatDau < ? AND th.GioKetThuc > ?
      LIMIT 5
    `, [maPhong, maLopHocPhan, thu, endDate, startDate, period.GioKetThuc, period.GioBatDau]);
    for (const clash of officialRoomConflicts) {
      pushConflict(conflicts, 'ROOM_CONFLICT', `Phòng '${room.TenPhong}' đã được lớp '${clash.TenLopHocPhan || clash.MaLopHocPhan}' sử dụng trong thời gian này.`, clash);
    }

    const [studentConflicts] = await connection.query(`
      SELECT DISTINCT other.MaLopHocPhan, other.TenLopHocPhan, shared.MaLopSinhVien
      FROM LopHocPhan_LopSinhVien own
      JOIN LopHocPhan_LopSinhVien shared ON shared.MaLopSinhVien = own.MaLopSinhVien
      JOIN LopHocPhan other ON other.MaLopHocPhan = shared.MaLopHocPhan
      JOIN ThoiKhoaBieu tkb ON tkb.MaLopHocPhan = other.MaLopHocPhan
      JOIN TietHoc th ON th.MaTiet = tkb.MaTiet
      WHERE own.MaLopHocPhan = ? AND other.MaLopHocPhan <> ?
        AND tkb.ThuTrongTuan = ?
        AND tkb.NgayBatDau <= ? AND tkb.NgayKetThuc >= ?
        AND th.GioBatDau < ? AND th.GioKetThuc > ?
      LIMIT 5
    `, [maLopHocPhan, maLopHocPhan, thu, endDate, startDate, period.GioKetThuc, period.GioBatDau]);
    for (const clash of studentConflicts) {
      pushConflict(conflicts, 'STUDENT_CONFLICT', `Lớp sinh viên '${clash.MaLopSinhVien}' bị trùng với lớp '${clash.TenLopHocPhan || clash.MaLopHocPhan}'.`, clash);
    }

    if (lop.MaGiangVien) {
      const [lecturerConflicts] = await connection.query(`
        SELECT other.MaLopHocPhan, other.TenLopHocPhan
        FROM LopHocPhan other
        JOIN ThoiKhoaBieu tkb ON tkb.MaLopHocPhan = other.MaLopHocPhan
        JOIN TietHoc th ON th.MaTiet = tkb.MaTiet
        WHERE other.MaGiangVien = ? AND other.MaLopHocPhan <> ?
          AND tkb.ThuTrongTuan = ?
          AND tkb.NgayBatDau <= ? AND tkb.NgayKetThuc >= ?
          AND th.GioBatDau < ? AND th.GioKetThuc > ?
        LIMIT 5
      `, [lop.MaGiangVien, maLopHocPhan, thu, endDate, startDate, period.GioKetThuc, period.GioBatDau]);
      for (const clash of lecturerConflicts) {
        pushConflict(conflicts, 'LECTURER_CONFLICT', `Giảng viên đã có lịch dạy lớp '${clash.TenLopHocPhan || clash.MaLopHocPhan}'.`, clash);
      }
    }

    const blockedDates = getBlockedDates();
    if (blockedDates.size > 0) {
      for (const blockedDate of blockedDates) {
        if (blockedDate >= startDate && blockedDate <= endDate) {
          const jsDay = new Date(`${blockedDate}T12:00:00`).getDay();
          const blockedThu = jsDay === 0 ? 8 : jsDay + 1;
          if (blockedThu === thu) {
            pushConflict(conflicts, 'BLOCKED_DATE', `Khoảng lịch có ngày bị khóa ${blockedDate}.`);
            break;
          }
        }
      }
    }

    if (maPhien) {
      const session = XepLichStore.get(maPhien);
      const draftRows = (draftRowsOverride || session?.dong || []).filter(row => (
        row.TrangThai === 'Draft' && String(row.MaDong) !== String(excludeMaDong || '')
      ));
      const periodIds = [...new Set(draftRows.map(row => Number(row.MaTiet)).filter(Number.isInteger))];
      const periodMap = new Map();
      if (periodIds.length > 0) {
        const placeholders = periodIds.map(() => '?').join(',');
        const [draftPeriods] = await connection.query(
          `SELECT MaTiet, GioBatDau, GioKetThuc FROM TietHoc WHERE MaTiet IN (${placeholders})`,
          periodIds
        );
        draftPeriods.forEach(item => periodMap.set(Number(item.MaTiet), item));
      }

      const [relatedRows] = await connection.query(`
        SELECT DISTINCT shared.MaLopHocPhan
        FROM LopHocPhan_LopSinhVien own
        JOIN LopHocPhan_LopSinhVien shared ON shared.MaLopSinhVien = own.MaLopSinhVien
        WHERE own.MaLopHocPhan = ? AND shared.MaLopHocPhan <> ?
      `, [maLopHocPhan, maLopHocPhan]);
      const relatedClassIds = new Set(relatedRows.map(row => row.MaLopHocPhan));

      let lecturerClassIds = new Set();
      if (lop.MaGiangVien && draftRows.length > 0) {
        const draftClassIds = [...new Set(draftRows.map(row => row.MaLopHocPhan))];
        const placeholders = draftClassIds.map(() => '?').join(',');
        const [lecturerClasses] = await connection.query(
          `SELECT MaLopHocPhan FROM LopHocPhan WHERE MaGiangVien = ? AND MaLopHocPhan IN (${placeholders})`,
          [lop.MaGiangVien, ...draftClassIds]
        );
        lecturerClassIds = new Set(lecturerClasses.map(row => row.MaLopHocPhan));
      }

      for (const draft of draftRows) {
        const draftPeriod = periodMap.get(Number(draft.MaTiet));
        const overlaps = draftPeriod
          && Number(draft.ThuTrongTuan) === thu
          && rangesOverlap(startDate, endDate, draft.NgayBatDau, draft.NgayKetThuc)
          && timesOverlap(period.GioBatDau, period.GioKetThuc, draftPeriod.GioBatDau, draftPeriod.GioKetThuc);
        if (!overlaps) continue;

        if (draft.MaPhong === maPhong) {
          pushConflict(conflicts, 'DRAFT_ROOM_CONFLICT', `Phòng '${room.TenPhong}' đã được lớp nháp '${draft.TenMonHoc || draft.MaLopHocPhan}' giữ trong phương án.`, draft);
        }
        if (draft.MaLopHocPhan === maLopHocPhan) {
          pushConflict(conflicts, 'CLASS_INTERNAL_CONFLICT', `Lớp '${lop.TenLopHocPhan || maLopHocPhan}' đã có một buổi nháp giao nhau.`, draft);
        }
        if (relatedClassIds.has(draft.MaLopHocPhan)) {
          pushConflict(conflicts, 'DRAFT_STUDENT_CONFLICT', `Lớp sinh viên bị trùng với lớp nháp '${draft.TenMonHoc || draft.MaLopHocPhan}'.`, draft);
        }
        if (lecturerClassIds.has(draft.MaLopHocPhan) && draft.MaLopHocPhan !== maLopHocPhan) {
          pushConflict(conflicts, 'DRAFT_LECTURER_CONFLICT', `Giảng viên đã có lịch nháp của lớp '${draft.TenMonHoc || draft.MaLopHocPhan}'.`, draft);
        }
      }
    }

    return {
      valid: conflicts.length === 0,
      hasConflict: conflicts.length > 0,
      conflicts,
      context: { lopHocPhan: lop, tietHoc: period, phongHoc: room }
    };
  };
}

module.exports = ScheduleConstraintService;
