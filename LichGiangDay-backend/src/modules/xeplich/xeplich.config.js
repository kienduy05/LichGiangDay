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
  thuKhongXep: [8]
};

const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/gi, 'd')
  .replace(/[^a-z0-9]/gi, '')
  .toLowerCase();

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
  if (!loaiPhong) return true;
  if (isPracticeClass(loaiHoc)) return isPracticeRoom(loaiPhong);
  return true;
};

const getSoBuoiMoiTuan = (loaiHoc, soTinChi = 2) => {
  if (Number(soTinChi) === 3 && ['lt', 'lythuyet'].includes(normalize(loaiHoc))) return 2;
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
