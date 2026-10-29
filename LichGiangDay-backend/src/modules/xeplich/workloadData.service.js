const db = require('../../../config/db');
const { dateOnly, dayNumber, dayString, weekday, periodUnits } = require('./workloadRules');
const { isRoomCompatible, getBlockedDates, getBlockedWeekdays } = require('./xeplich.config');

const loadCatalog = async (maHocKy, connection = db) => {
  const [rows] = await connection.query(`
    SELECT lhp.*, mh.SoTinChi, mh.TenMonHoc, bm.TenBoMon, bm.MaKhoa,
           hk.NgayBatDau AS HocKyBatDau, hk.NgayKetThuc AS HocKyKetThuc,
           COALESCE(NULLIF(lhp.SiSoDangKy, 0), lhp.SiSoDuKien, 0) AS SiSo,
           EXISTS (SELECT 1 FROM ThoiKhoaBieu tkb WHERE tkb.MaLopHocPhan = lhp.MaLopHocPhan) AS DaCoLich
    FROM LopHocPhan lhp
    JOIN MonHoc mh ON mh.MaMonHoc = lhp.MaMonHoc
    JOIN HocKy hk ON hk.MaHocKy = lhp.MaHocKy
    JOIN BoMon bm ON bm.MaBoMon = lhp.MaBoMon
    WHERE lhp.MaHocKy = ?
    ORDER BY lhp.MaMonHoc, lhp.MaLopHocPhan
  `, [maHocKy]);
  return rows;
};

const loadResources = async (maHocKy, connection = db, includeOccupancy = true) => {
  const [rooms] = await connection.query('SELECT MaPhong, TenPhong, MaToaNha, SucChua, LoaiPhong, TrangThai FROM PhongHoc WHERE TrangThai = \'Ready\'');
  const [periods] = await connection.query('SELECT MaTiet, TenTiet, GioBatDau, GioKetThuc FROM TietHoc ORDER BY GioBatDau, MaTiet');
  if (!includeOccupancy) return { rooms, periods, official: [], lessons: [], links: [] };
  // Include all semesters whose teaching dates overlap the target semester.
  const [official] = await connection.query(`
    SELECT tkb.*, th.GioBatDau, th.GioKetThuc, lhp.MaGiangVien
    FROM ThoiKhoaBieu tkb
    JOIN LopHocPhan lhp ON lhp.MaLopHocPhan = tkb.MaLopHocPhan
    JOIN TietHoc th ON th.MaTiet = tkb.MaTiet
    JOIN HocKy hk ON hk.MaHocKy = ?
    WHERE tkb.NgayBatDau <= hk.NgayKetThuc AND tkb.NgayKetThuc >= hk.NgayBatDau
      AND (tkb.TrangThai IS NULL OR tkb.TrangThai <> 'Cancelled')
  `, [maHocKy]);
  const [lessons] = await connection.query(`
    SELECT bh.MaLopHocPhan, bh.MaGiangVien, bh.MaPhong, bh.MaTiet,
           bh.NgayHoc AS NgayBatDau, bh.NgayHoc AS NgayKetThuc,
           IF(DAYOFWEEK(bh.NgayHoc) = 1, 8, DAYOFWEEK(bh.NgayHoc)) AS ThuTrongTuan,
           th.GioBatDau, th.GioKetThuc
    FROM BuoiHoc bh JOIN TietHoc th ON th.MaTiet = bh.MaTiet
    JOIN HocKy hk ON hk.MaHocKy = ?
    WHERE bh.NgayHoc BETWEEN hk.NgayBatDau AND hk.NgayKetThuc
      AND (bh.TrangThai IS NULL OR bh.TrangThai <> 'Cancelled')
  `, [maHocKy]);
  const [links] = await connection.query('SELECT MaLopHocPhan, MaLopSinhVien FROM LopHocPhan_LopSinhVien');
  return { rooms, periods, official, lessons, links };
};

const createOccupancy = (data, classes, initialRows = []) => {
  const classMap = new Map(classes.map(row => [row.MaLopHocPhan, row]));
  const periodMap = new Map(data.periods.map(row => [Number(row.MaTiet), row]));
  const roomMap = new Map(data.rooms.map(row => [row.MaPhong, row]));
  const students = new Map();
  for (const link of data.links) {
    if (!students.has(link.MaLopHocPhan)) students.set(link.MaLopHocPhan, new Set());
    students.get(link.MaLopHocPhan).add(link.MaLopSinhVien);
  }
  const indexes = { room: new Map(), lecturer: new Map(), student: new Map(), class: new Map() };
  const indexKey = (id, thu) => JSON.stringify([id, Number(thu)]);
  const put = (map, id, event) => {
    if (!id) return;
    const key = indexKey(id, event.ThuTrongTuan);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(event);
  };
  const add = row => {
    const event = { ...periodMap.get(Number(row.MaTiet)), ...row };
    event.MaGiangVien = row.MaGiangVien || classMap.get(row.MaLopHocPhan)?.MaGiangVien;
    put(indexes.room, row.MaPhong, event);
    put(indexes.lecturer, event.MaGiangVien, event);
    put(indexes.class, row.MaLopHocPhan, event);
    for (const id of students.get(row.MaLopHocPhan) || []) put(indexes.student, id, event);
  };
  [...data.official, ...data.lessons, ...initialRows].forEach(add);
  const blockedDates = getBlockedDates();
  const blockedWeekdays = getBlockedWeekdays();
  const conflict = (member, day, period, room) => {
    const date = dayString(day);
    const thu = weekday(day);
    if (day < dayNumber(member.NgayBatDau) || day > dayNumber(member.NgayKetThuc)
      || day < dayNumber(member.HocKyBatDau) || day > dayNumber(member.HocKyKetThuc)) return 'Ngoài thời gian học của lớp/học kỳ.';
    if (blockedDates.has(date) || blockedWeekdays.has(thu)) return 'Ngày học bị khóa theo cấu hình.';
    if (!period || periodUnits(period) !== 3 || period.GioBatDau >= period.GioKetThuc) return 'Ca học phải gồm 3 tiết và có giờ hợp lệ.';
    if (!room || room.TrangThai !== 'Ready' || Number(room.SucChua) < Number(member.SiSo)
      || !isRoomCompatible(member.LoaiHoc, room.LoaiPhong)) return 'Phòng không phù hợp loại học, trạng thái hoặc sức chứa.';
    const busy = (map, id) => id && (map.get(indexKey(id, thu)) || []).find(event =>
      dateOnly(event.NgayBatDau) <= date && dateOnly(event.NgayKetThuc) >= date
      && event.GioBatDau < period.GioKetThuc && event.GioKetThuc > period.GioBatDau);
    if (busy(indexes.room, room.MaPhong)) return 'Trùng phòng học.';
    if (busy(indexes.class, member.MaLopHocPhan)) return 'Trùng buổi học của cùng lớp học phần.';
    if (busy(indexes.lecturer, member.MaGiangVien)) return 'Trùng lịch giảng viên.';
    for (const id of students.get(member.MaLopHocPhan) || []) if (busy(indexes.student, id)) return `Trùng lịch lớp sinh viên ${id}.`;
    return null;
  };
  return { add, conflict, periodMap, roomMap };
};

module.exports = { loadCatalog, loadResources, createOccupancy };
