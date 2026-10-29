const DEFAULT_CONFIG = {
  soBuoiMoiTuan: {
    LT: 1,
    TH: 1,
    BT: 1,
    TL: 1,
    DA: 1,
    DEFAULT: 1
  },
  ngayKhongXep: [],
  thuKhongXep: [8] // Chủ nhật nghỉ, không xếp tiết học.
};

const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/gi, 'd')
  .replace(/[^a-z0-9]/gi, '')
  .toLowerCase();

// Chỉ TH (Thực hành) mới yêu cầu phòng thực hành/lab.
// BT (Bài tập), TL (Thảo luận), DA (Đồ án), LT (Lý thuyết) dùng phòng lý thuyết.
const isPracticeClass = (loaiHoc) => {
  const value = normalize(loaiHoc);
  return ['th', 'thuchanh', 'lab', 'phongmay'].includes(value)
    || value.includes('thuchanh')
    || value.includes('lab');
};

const isPracticeRoom = (loaiPhong) => {
  const value = normalize(loaiPhong);
  return value.includes('thuchanh')
    || value.includes('lab')
    || value.includes('maytinh')
    || value.includes('phongmay');
};

const isRoomCompatible = (loaiHoc, loaiPhong) => {
  // Lớp thực hành bắt buộc phải có phòng thực hành/lab
  if (isPracticeClass(loaiHoc)) {
    if (!loaiPhong) return false; // Phòng chưa phân loại → không nhận cho TH
    return isPracticeRoom(loaiPhong);
  }
  // BT, LT, TL, DA... → dùng bất kỳ phòng nào (kể cả phòng lab nếu trống)
  return true;
};

const getSoBuoiMoiTuan = (loaiHoc) => {
  const key = String(loaiHoc || '').trim().toUpperCase();
  return Number(DEFAULT_CONFIG.soBuoiMoiTuan[key] || DEFAULT_CONFIG.soBuoiMoiTuan.DEFAULT);
};

const getBlockedDates = () => new Set(DEFAULT_CONFIG.ngayKhongXep);
const getBlockedWeekdays = () => new Set(DEFAULT_CONFIG.thuKhongXep.map(Number));

module.exports = {
  getBlockedDates,
  getBlockedWeekdays,
  getSoBuoiMoiTuan,
  isRoomCompatible
};
