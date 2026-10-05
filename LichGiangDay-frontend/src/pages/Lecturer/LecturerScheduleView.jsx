import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap, Calendar, Clock, Building, Users, BookOpen,
  ChevronLeft, ChevronRight, LogOut, RefreshCw, PlusCircle,
  AlertTriangle, Printer, Layers, Loader2, Sparkles, School,
  User, CheckCircle2, CalendarPlus, UserCheck
} from 'lucide-react';
import { apiGetHocKyList } from '../../utils/api';
import { apiGetLecturerWeeklySchedule } from '../../utils/apiPhanCongGiangVien';

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

export default function LecturerScheduleView() {
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
    if (!selectedHocKy) return;
    setLoading(true);
    try {
      const data = await apiGetLecturerWeeklySchedule({
        maHocKy: selectedHocKy,
        maGiangVien: user?.maGiangVien || ''
      });
      setScheduleData(data || { matrix: {}, schedule: [], giangVien: null });
    } catch (err) {
      console.error('Lỗi tải lịch giảng dạy của giảng viên:', err);
      setScheduleData({ matrix: {}, schedule: [], giangVien: null });
    } finally {
      setLoading(false);
    }
  }, [selectedHocKy, user?.maGiangVien]);

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

  const handleOpenTaoDayBu = () => {
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

  return (
    <div className="lec-portal-layout">
      {/* ========================================================
          TOP NAVIGATION HEADER
          ======================================================== */}
      <header className="lec-portal-nav">
        <div className="lec-nav-left">
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
            <table className="lgd-matrix-table" style={{ minWidth: '1120px' }}>
              <thead>
                <tr>
                  <th className="lgd-th-period" style={{ width: '105px' }}>
                    Ca / Tiết Học
                  </th>
                  {weekDays.map(d => {
                    const isToday = d.value === todayDayOfWeek;
                    return (
                      <th key={d.value} className={`lgd-th-day ${isToday ? 'is-today' : ''}`} style={{ minWidth: '140px' }}>
                        <div className="lgd-day-name">{d.label}</div>
                        <div className="lgd-day-date">{d.displayDate}</div>
                        {isToday && <span className="lgd-today-badge">Hôm nay</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {PERIOD_ROWS.map(period => (
                  <tr key={period.maTiet}>
                    {/* Period Column */}
                    <td className="lgd-td-period" style={{ width: '105px' }}>
                      <span className={`lgd-period-session ${period.sessionClass}`}>
                        {period.session}
                      </span>
                      <div className="lgd-period-name">{period.label}</div>
                      <div className="lgd-period-time">{period.time}</div>
                    </td>

                    {/* Day Cells */}
                    {weekDays.map(d => {
                      const items = scheduleData.matrix?.[d.value]?.[period.maTiet] || [];
                      const isTodayCol = d.value === todayDayOfWeek;

                      return (
                        <td
                          key={d.value}
                          className={`lgd-td-cell ${isTodayCol ? 'is-today-col' : ''}`}
                          style={{ minWidth: '140px' }}
                        >
                          {items.length === 0 ? (
                            <div className="lgd-empty-cell">Trống</div>
                          ) : (
                            <div className="lgd-cell-cards">
                              {items.map((item, idx) => {
                                const loaiClass = `loai-${(item.LoaiHoc || 'LT').toLowerCase()}`;
                                return (
                                  <div
                                    key={item.MaLopHocPhan || idx}
                                    className={`lgd-class-card ${loaiClass}`}
                                    onClick={() => handleCardClick(item)}
                                    title="Nhấp để xem chi tiết buổi học & gửi yêu cầu đổi ca, dạy bù"
                                  >
                                    <div className="lgd-card-header">
                                      <span className="lgd-card-subject" title={item.TenLopHocPhan || item.TenMonHoc}>
                                        {item.TenLopHocPhan || item.TenMonHoc}
                                      </span>
                                      <span className="lgd-card-tag">
                                        {item.LoaiHoc || 'LT'}
                                      </span>
                                    </div>

                                    <div className="lgd-card-meta">
                                      <div className="lgd-card-meta-row">
                                        <Building size={12} color="#0284c7" />
                                        <span className="lgd-card-room">
                                          {item.TenPhong || 'Chưa xếp'} {item.TenToaNha ? `(${item.TenToaNha})` : ''}
                                        </span>
                                        {item.SiSoDangKy ? (
                                          <span style={{ marginLeft: 'auto', color: '#64748b' }}>
                                            {item.SiSoDangKy} SV
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>

                                    {/* Action Chips: Đổi ca, Báo nghỉ, Dạy thay */}
                                    <div className="lec-card-action-chips" onClick={e => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        className="lec-chip-btn btn-doi-ca"
                                        onClick={() => handleOpenDoiCa(item)}
                                        title="Xin đổi ca học này"
                                      >
                                        <RefreshCw size={10} />
                                        <span>Đổi ca</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="lec-chip-btn btn-bao-nghi"
                                        onClick={() => handleOpenBaoNghi(item)}
                                        title="Báo nghỉ buổi học này"
                                      >
                                        <AlertTriangle size={10} />
                                        <span>Báo nghỉ</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="lec-chip-btn btn-day-thay"
                                        onClick={() => handleOpenDayThay(item)}
                                        title="Nhờ giảng viên khác dạy thay"
                                      >
                                        <Users size={10} />
                                        <span>Dạy thay</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
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
