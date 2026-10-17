import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap, Calendar, Clock, Building, Users, BookOpen,
  ChevronLeft, ChevronRight, LogOut, RefreshCw, PlusCircle,
  AlertTriangle, Printer, Layers, Loader2, Sparkles, School,
  User, CheckCircle2, CalendarPlus, UserCheck
} from 'lucide-react';
import { apiGetHocKyList } from '../../utils/api';
import { apiGetLecturerWeeklySchedule } from '../../utils/apiPhanCongGiangVien';
import { apiGetLichGiangVien } from '../../utils/apiBienDongLich';

import LecturerClassDetailModal from './components/LecturerClassDetailModal';
import RequestDoiCaModal from './components/RequestDoiCaModal';
import RequestBaoNghiModal from './components/RequestBaoNghiModal';
import RequestDayThayModal from './components/RequestDayThayModal';
import TaoLichDayBuModal from './components/TaoLichDayBuModal';

import './LecturerScheduleView.css';

const PERIOD_ROWS = [
  { maTiet: 1, label: 'Tiết 1 - 3', time: '07:00 - 09:25', session: 'Sáng', sessionClass: 'sang' },
  { maTiet: 2, label: 'Tiết 4 - 6', time: '09:35 - 12:00', session: 'Sáng', sessionClass: 'sang' },
  { maTiet: 3, label: 'Tiết 7 - 9', time: '13:00 - 15:25', session: 'Chiều', sessionClass: 'chieu' },
  { maTiet: 4, label: 'Tiết 10 - 12', time: '15:35 - 18:00', session: 'Chiều', sessionClass: 'chieu' },
  { maTiet: 5, label: 'Tiết 13 - 16', time: '18:00 - 21:30', session: 'Tối', sessionClass: 'toi' },
];

const DAYS_DEF = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
  { value: 8, label: 'Chủ nhật' },
];

// Helper: Get Monday of given date
const getMondayOfWeek = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function LecturerScheduleView({ onBackHome }) {
  const { user, logout } = useAuth();

  const [hocKyList, setHocKyList] = useState([]);
  const [selectedHocKy, setSelectedHocKy] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState({ matrix: {}, schedule: [], giangVien: null });

  // Modals state
  const [selectedClass, setSelectedClass] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [doiCaModalOpen, setDoiCaModalOpen] = useState(false);
  const [dayThayModalOpen, setDayThayModalOpen] = useState(false);
  const [baoNghiModalOpen, setBaoNghiModalOpen] = useState(false);
  const [taoLichDayBuModalOpen, setTaoLichDayBuModalOpen] = useState(false);

  // Today day of week (2: Thứ 2 -> 8: CN)
  const todayDayOfWeek = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 ? 8 : day + 1;
  }, []);

  // Compute 7 days of the active week
  const weekDays = useMemo(() => {
    return DAYS_DEF.map((def, idx) => {
      const d = addDays(currentWeekStart, idx);
      return {
        ...def,
        dateObj: d,
        displayDate: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
      };
    });
  }, [currentWeekStart]);

  // Week range label
  const weekRangeLabel = useMemo(() => {
    const end = addDays(currentWeekStart, 6);
    return `${formatDate(currentWeekStart)} - ${formatDate(end)}`;
  }, [currentWeekStart]);

  // 1. Fetch Học Kỳ List
  useEffect(() => {
    const fetchHocKy = async () => {
      try {
        const hks = await apiGetHocKyList();
        if (hks && hks.length > 0) {
          setHocKyList(hks);
          setSelectedHocKy(hks[0].MaHocKy);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách học kỳ:', err);
      }
    };
    fetchHocKy();
  }, []);

  // 2. Fetch Lecturer Schedule
  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const startD = new Date(currentWeekStart);
      const tuNgay = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`;
      const endD = addDays(currentWeekStart, 6);
      const denNgay = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;

      // 1. Fetch BuoiHoc for this specific week from API lich-giang-vien
      const buoiHocList = await apiGetLichGiangVien({ tuNgay, denNgay }).catch(() => []);

      // 2. Fetch fallback/teacher info
      const profileData = selectedHocKy ? await apiGetLecturerWeeklySchedule({
        maHocKy: selectedHocKy,
        maGiangVien: user?.maGiangVien || ''
      }).catch(() => null) : null;

      if (buoiHocList && buoiHocList.length > 0) {
        // Build matrix from buoiHocList
        const matrix = {};
        DAYS_DEF.forEach(d => { matrix[d.value] = {}; });

        buoiHocList.forEach(bh => {
          const parts = String(bh.NgayHoc).split('-');
          let dow;
          if (parts.length === 3) {
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            dow = d.getDay() === 0 ? 8 : d.getDay() + 1;
          } else {
            const d = new Date(bh.NgayHoc);
            dow = d.getDay() === 0 ? 8 : d.getDay() + 1;
          }
          const tiet = bh.MaTiet;
          if (!matrix[dow]) matrix[dow] = {};
          if (!matrix[dow][tiet]) matrix[dow][tiet] = [];
          matrix[dow][tiet].push({
            ...bh,
            Thu: dow,
            ThuTrongTuan: dow,
            LoaiHoc: bh.LoaiHoc || (bh.LoaiBuoiHoc === 'Makeup' ? 'BÙ' : 'LT')
          });
        });

        setScheduleData({
          matrix,
          schedule: buoiHocList,
          giangVien: profileData?.giangVien || { HoTen: user?.fullName, MaGiangVien: user?.maGiangVien }
        });
      } else {
        const emptyMatrix = {};
        DAYS_DEF.forEach(d => { emptyMatrix[d.value] = {}; });
        setScheduleData({
          matrix: emptyMatrix,
          schedule: [],
          giangVien: profileData?.giangVien || { HoTen: user?.fullName, MaGiangVien: user?.maGiangVien }
        });
      }
    } catch (err) {
      console.error('Lỗi tải lịch giảng dạy của giảng viên:', err);
      const emptyMatrix = {};
      DAYS_DEF.forEach(d => { emptyMatrix[d.value] = {}; });
      setScheduleData({ matrix: emptyMatrix, schedule: [], giangVien: null });
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, selectedHocKy, user?.maGiangVien, user?.fullName]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Handlers for week navigation
  const handlePrevWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));
  const handleCurrentWeek = () => setCurrentWeekStart(getMondayOfWeek(new Date()));

  // Handlers for class clicks & actions
  const handleCardClick = (item) => {
    setSelectedClass(item);
    setDetailModalOpen(true);
  };

  const handleOpenDoiCa = (item) => {
    setSelectedClass(item);
    setDetailModalOpen(false);
    setDoiCaModalOpen(true);
  };

  const handleOpenBaoNghi = (item) => {
    setSelectedClass(item);
    setDetailModalOpen(false);
    setBaoNghiModalOpen(true);
  };

  const handleOpenDayThay = (item) => {
    setSelectedClass(item);
    setDetailModalOpen(false);
    setDayThayModalOpen(true);
  };

  const handleOpenTaoDayBu = (item = null) => {
    if (item) setSelectedClass(item);
    setTaoLichDayBuModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // KPIs
  const totalClasses = scheduleData.schedule?.length || 0;
  const totalPeriods = totalClasses * 3; // Ước tính 3 tiết/buổi
  const uniqueRooms = useMemo(() => {
    const set = new Set();
    scheduleData.schedule?.forEach(s => {
      if (s.TenPhong) set.add(s.TenPhong);
    });
    return set.size;
  }, [scheduleData.schedule]);

  const gvInfo = scheduleData.giangVien || {};

  // Render individual class card with container-query responsive action buttons
  const renderClassCard = (item, idx, day) => {
    const loaiClass = `loai-${(item.LoaiHoc || 'LT').toLowerCase()}`;
    const status = item.TrangThai || 'Normal';
    let statusClass = 'status-card-normal';
    let statusBadge = null;

    if (status.includes('_Pending')) {
      statusClass = 'status-card-pending';
      const label = status === 'Absence_Pending' ? 'Chờ duyệt nghỉ' : status === 'Swap_Pending' ? 'Chờ duyệt đổi ca' : 'Chờ duyệt dạy thay';
      statusBadge = <span className="status-badge-pill status-badge-pending" title={`⏳ ${label}`}>⏳ {label}</span>;
    } else if (status === 'Absent') {
      statusClass = 'status-card-absent';
      const label = `Đã nghỉ ${item.DaDayBu ? '(Đã bù)' : '(Chưa bù)'}`;
      statusBadge = <span className="status-badge-pill status-badge-absent" title={`⛔ ${label}`}>⛔ {label}</span>;
    } else if (status === 'Substituted') {
      statusClass = 'status-card-substituted';
      const label = `Dạy thay (${item.TenGiangVien || 'GV'})`;
      statusBadge = <span className="status-badge-pill status-badge-substituted" title={`🔄 ${label}`}>🔄 {label}</span>;
    } else if (status === 'Swapped') {
      statusClass = 'status-card-swapped';
      statusBadge = <span className="status-badge-pill status-badge-swapped" title="🔀 Đã đổi ca">🔀 Đã đổi ca</span>;
    } else if (item.LoaiBuoiHoc === 'Makeup') {
      statusClass = 'status-card-makeup';
      statusBadge = <span className="status-badge-pill status-badge-makeup" title="➕ Dạy Bù">➕ Dạy Bù</span>;
    }

    const isNormal = status === 'Normal';
    const isAbsentNotMadeUp = status === 'Absent' && !item.DaDayBu;
    const isPending = status.includes('_Pending');

    // Check if session date is future or today
    const itemDate = item.NgayHoc ? new Date(item.NgayHoc) : (day?.dateObj || new Date());
    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);
    const isFutureOrToday = new Date(itemDate).setHours(0, 0, 0, 0) >= todayZero.getTime();

    // Only normal sessions in future/today that are not makeup classes can request swap/absence/substitute
    const canActionNormal = isNormal && isFutureOrToday && item.LoaiBuoiHoc !== 'Makeup';

    return (
      <div
        key={item.MaBuoiHoc || item.MaLopHocPhan || idx}
        className={`lgd-class-card ${loaiClass} ${statusClass}`}
        onClick={() => handleCardClick(item)}
        title="Nhấp để xem chi tiết buổi học & gửi yêu cầu"
      >
        <div className="lgd-card-header">
          <span className="lgd-card-subject" title={item.TenLopHocPhan || item.TenMonHoc}>
            {item.TenLopHocPhan || item.TenMonHoc}
          </span>
          <span className={`lgd-card-tag tag-${(item.LoaiHoc || 'LT').toLowerCase()}`}>
            {item.LoaiHoc || 'LT'}
          </span>
        </div>

        {statusBadge && (
          <div className="lgd-card-badge-wrap">
            {statusBadge}
          </div>
        )}

        <div className="lgd-card-meta">
          <div className="lgd-card-meta-row">
            <div className="lgd-room-wrap" title={`${item.TenPhong || 'Chưa xếp'}${item.TenToaNha ? ` (${item.TenToaNha})` : ''}`}>
              <Building size={12} color="#0284c7" className="meta-icon" />
              <span className="lgd-card-room">
                {item.TenPhong || 'Chưa xếp'} {item.TenToaNha ? `(${item.TenToaNha})` : ''}
              </span>
            </div>
            {item.SiSoDangKy ? (
              <span className="lgd-card-siso">
                {item.SiSoDangKy} SV
              </span>
            ) : null}
          </div>
        </div>

        {/* Action Chips: Đổi ca, Báo nghỉ, Dạy thay, Dạy bù */}
        {(canActionNormal || isAbsentNotMadeUp || isPending) && (
          <div className="lec-card-action-chips" onClick={e => e.stopPropagation()}>
            {canActionNormal && (
              <>
                <button
                  type="button"
                  className="lec-chip-btn btn-doi-ca"
                  onClick={() => handleOpenDoiCa(item)}
                  title="Xin đổi ca học này"
                  aria-label="Đổi ca"
                >
                  <RefreshCw size={12} />
                  <span className="btn-text">Đổi ca</span>
                </button>
                <button
                  type="button"
                  className="lec-chip-btn btn-bao-nghi"
                  onClick={() => handleOpenBaoNghi(item)}
                  title="Báo nghỉ buổi học này"
                  aria-label="Báo nghỉ"
                >
                  <AlertTriangle size={12} />
                  <span className="btn-text">Báo nghỉ</span>
                </button>
                <button
                  type="button"
                  className="lec-chip-btn btn-day-thay"
                  onClick={() => handleOpenDayThay(item)}
                  title="Nhờ giảng viên khác dạy thay"
                  aria-label="Dạy thay"
                >
                  <Users size={12} />
                  <span className="btn-text">Dạy thay</span>
                </button>
              </>
            )}

            {isAbsentNotMadeUp && (
              <button
                type="button"
                className="lec-chip-btn btn-day-bu"
                onClick={() => handleOpenTaoDayBu(item)}
                title="Đăng ký lịch dạy bù cho ca này"
                aria-label="Dạy bù"
              >
                <CalendarPlus size={12} />
                <span className="btn-text">Dạy bù</span>
              </button>
            )}

            {isPending && (
              <span className="lec-note-pending" title="Chờ Trưởng bộ môn phê duyệt">
                ⏳ Chờ TBM duyệt
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="lec-portal-layout">
      {/* ========================================================
          TOP NAVIGATION HEADER
          ======================================================== */}
      <header className="lec-portal-nav">
        <div className="lec-nav-left">
          {onBackHome && (
            <button
              type="button"
              onClick={onBackHome}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
              title="Quay lại Trang Chủ Giảng Viên"
            >
              <ChevronLeft size={16} />
              <span>Về Trang Chủ</span>
            </button>
          )}

          <div className="lec-nav-logo-box">
            <School size={22} />
          </div>
          <div>
            <div className="lec-nav-brand-title">CỔNG THÔNG TIN GIẢNG VIÊN</div>
            <div className="lec-nav-brand-sub">Hệ Thống Lịch Giảng Dạy & Thời Khóa Biểu</div>
          </div>
        </div>

        <div className="lec-nav-right">
          <div className="lec-user-badge">
            <div className="lec-user-avatar">
              {(user?.fullName || user?.username || 'GV').charAt(0).toUpperCase()}
            </div>
            <div className="lec-user-meta">
              <span className="lec-user-name">{user?.fullName || gvInfo.HoTen || user?.username}</span>
              <span className="lec-user-role">Giảng viên • {user?.maGiangVien || gvInfo.MaGiangVien || user?.username}</span>
            </div>
          </div>

          <button
            type="button"
            className="lec-btn-logout"
            onClick={logout}
            title="Đăng xuất khỏi Cổng Giảng Viên"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          MAIN CONTENT
          ======================================================== */}
      <main className="lec-portal-main">
        {/* Profile & Control Toolbar Banner */}
        <div className="lec-banner-card">
          <div className="lec-banner-left">
            <div className="lec-profile-icon">
              <GraduationCap size={28} />
            </div>
            <div>
              <div className="lec-welcome-text">Xin chào Giảng viên,</div>
              <h2 className="lec-profile-name">{user?.fullName || gvInfo.HoTen || 'Giảng viên'}</h2>
              <div className="lec-profile-tags">
                <span className="lec-tag-item">Mã GV: <strong>{user?.maGiangVien || gvInfo.MaGiangVien || 'N/A'}</strong></span>
                {gvInfo.TenBoMon && <span className="lec-tag-item">Bộ môn: <strong>{gvInfo.TenBoMon}</strong></span>}
                {gvInfo.Email && <span className="lec-tag-item">Email: <strong>{gvInfo.Email}</strong></span>}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="lec-banner-actions">
            <button
              type="button"
              className="lec-action-btn btn-taodaybu"
              onClick={handleOpenTaoDayBu}
              title="Tạo lịch dạy bù cho các ca đã báo nghỉ"
            >
              <CalendarPlus size={16} />
              <span>Tạo Lịch Dạy Bù</span>
              <span className="lec-badge-ca-nghi">Ca đã nghỉ</span>
            </button>

            <button
              type="button"
              className="lec-action-btn btn-print"
              onClick={handlePrint}
              title="In lịch giảng dạy tuần này"
            >
              <Printer size={16} />
              <span>In Thời Khóa Biểu</span>
            </button>
          </div>
        </div>

        {/* Schedule Filter & Week Navigator Bar */}
        <div className="lec-controls-bar">
          <div className="lec-controls-left">
            {/* Semester Select */}
            <div className="lec-select-group">
              <label className="lec-select-label">Học kỳ & Năm học:</label>
              <select
                className="lec-select"
                value={selectedHocKy}
                onChange={e => setSelectedHocKy(e.target.value)}
              >
                {hocKyList.map(hk => (
                  <option key={hk.MaHocKy} value={hk.MaHocKy}>
                    {hk.TenHocKy} {hk.NamHoc ? `(${hk.NamHoc})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Week Navigator */}
            <div className="lec-week-navigator">
              <button
                type="button"
                className="lec-nav-btn"
                onClick={handlePrevWeek}
                title="Tuần trước"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="lec-nav-date-text">
                <Calendar size={15} color="#2563eb" />
                <span>{weekRangeLabel}</span>
              </div>
              <button
                type="button"
                className="lec-nav-btn"
                onClick={handleNextWeek}
                title="Tuần sau"
              >
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                className="lec-btn-today"
                onClick={handleCurrentWeek}
              >
                Tuần hiện tại
              </button>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="lec-stats-strip">
            <div className="lec-stat-pill">
              <BookOpen size={15} color="#2563eb" />
              <span>Tổng số buổi: <strong>{totalClasses}</strong></span>
            </div>
            <div className="lec-stat-pill">
              <Clock size={15} color="#059669" />
              <span>Tổng số tiết: <strong>{totalPeriods}</strong></span>
            </div>
            <div className="lec-stat-pill">
              <Building size={15} color="#0284c7" />
              <span>Phòng học: <strong>{uniqueRooms}</strong></span>
            </div>
          </div>
        </div>

        {/* ========================================================
            SCHEDULE MATRIX TABLE
            ======================================================== */}
        <div className="lec-matrix-container">
          {loading && (
            <div className="lec-loading-state">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <span>Đang tải lịch giảng dạy của bạn...</span>
            </div>
          )}

          {!loading && (
            <>
              {/* 1. Desktop & Tablet Matrix Grid (CSS Grid with sticky headers) */}
              <div className="lec-matrix-scroll-wrapper">
                <div className="lec-matrix-grid">
                  {/* Top-Left Corner Header */}
                  <div className="lec-grid-cell lec-corner-cell">
                    <span>Ca / Tiết Học</span>
                  </div>

                  {/* Day Headers (Sticky Top) */}
                  {weekDays.map(d => {
                    const isToday = d.value === todayDayOfWeek;
                    return (
                      <div
                        key={d.value}
                        className={`lec-grid-cell lec-header-day ${isToday ? 'is-today' : ''}`}
                      >
                        <div className="lgd-day-name">{d.label}</div>
                        <div className="lgd-day-date">{d.displayDate}</div>
                        {isToday && <span className="lgd-today-badge">Hôm nay</span>}
                      </div>
                    );
                  })}

                  {/* Period Rows */}
                  {PERIOD_ROWS.map(period => (
                    <Fragment key={period.maTiet}>
                      {/* Sticky Left Period Cell */}
                      <div className="lec-grid-cell lec-period-cell">
                        <span className={`lgd-period-session ${period.sessionClass}`}>
                          {period.session}
                        </span>
                        <div className="lgd-period-name">{period.label}</div>
                        <div className="lgd-period-time">{period.time}</div>
                      </div>

                      {/* 7 Day Schedule Cells */}
                      {weekDays.map(d => {
                        const items = scheduleData.matrix?.[d.value]?.[period.maTiet] || [];
                        const isTodayCol = d.value === todayDayOfWeek;

                        return (
                          <div
                            key={d.value}
                            className={`lec-grid-cell lec-day-cell ${isTodayCol ? 'is-today-col' : ''}`}
                          >
                            {items.length === 0 ? (
                              <div className="lgd-empty-cell">Trống</div>
                            ) : (
                              <div className="lgd-cell-cards">
                                {items.map((item, idx) => renderClassCard(item, idx, d))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>

              {/* 2. Mobile Schedule List View (<640px) */}
              <div className="lec-mobile-schedule-list">
                {weekDays.map(d => {
                  const isToday = d.value === todayDayOfWeek;
                  const dayClasses = [];
                  PERIOD_ROWS.forEach(period => {
                    const classes = scheduleData.matrix?.[d.value]?.[period.maTiet] || [];
                    classes.forEach(c => {
                      dayClasses.push({
                        ...c,
                        periodLabel: period.label,
                        periodTime: period.time,
                        session: period.session,
                        sessionClass: period.sessionClass
                      });
                    });
                  });

                  return (
                    <div key={d.value} className={`lec-mobile-day-block ${isToday ? 'is-today-block' : ''}`}>
                      <div className="lec-mobile-day-header">
                        <div className="lec-mobile-day-title">
                          <span className="day-name">{d.label}</span>
                          <span className="day-date">{d.displayDate}</span>
                          {isToday && <span className="lgd-today-badge">Hôm nay</span>}
                        </div>
                        <span className="lec-mobile-count">{dayClasses.length} ca học</span>
                      </div>

                      <div className="lec-mobile-day-body">
                        {dayClasses.length === 0 ? (
                          <div className="lec-mobile-empty-day">Không có ca giảng dạy trong ngày</div>
                        ) : (
                          <div className="lec-mobile-cards-wrap">
                            {dayClasses.map((item, idx) => (
                              <div key={item.MaBuoiHoc || idx} className="lec-mobile-card-item">
                                <div className="lec-mobile-period-tag">
                                  <Clock size={12} />
                                  <span>{item.periodLabel} ({item.periodTime})</span>
                                </div>
                                {renderClassCard(item, idx, d)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ========================================================
          MODALS INTEGRATION
          ======================================================== */}
      {/* 1. Class Detail Modal */}
      <LecturerClassDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        item={selectedClass}
        onRequestDoiCa={handleOpenDoiCa}
        onRequestBaoNghi={handleOpenBaoNghi}
        onRequestDayThay={handleOpenDayThay}
      />

      {/* 2. Xin Đổi Ca Modal */}
      <RequestDoiCaModal
        isOpen={doiCaModalOpen}
        onClose={() => setDoiCaModalOpen(false)}
        classItem={selectedClass}
      />

      {/* 3. Báo Nghỉ Dạy Modal */}
      <RequestBaoNghiModal
        isOpen={baoNghiModalOpen}
        onClose={() => setBaoNghiModalOpen(false)}
        classItem={selectedClass}
      />

      {/* 4. Nhờ Dạy Thay Modal */}
      <RequestDayThayModal
        isOpen={dayThayModalOpen}
        onClose={() => setDayThayModalOpen(false)}
        classItem={selectedClass}
      />

      {/* 5. Tạo Lịch Dạy Bù Cho Các Ca Đã Nghỉ Modal */}
      <TaoLichDayBuModal
        isOpen={taoLichDayBuModalOpen}
        onClose={() => setTaoLichDayBuModalOpen(false)}
      />
    </div>
  );
}
