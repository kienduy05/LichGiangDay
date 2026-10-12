import React from 'react';
import {
  CalendarRange, Calendar, Clock, User, Building2,
  Users, BookOpen, Layers, Filter, RefreshCw,
  Search, ChevronLeft, ChevronRight, LayoutGrid, List,
  GraduationCap, DoorOpen
} from 'lucide-react';
import './LichGiangDayComponents.css';

export default function LichGiangDayFilterBar({
  // Lookups
  hocKyList = [],
  khoaList = [],
  boMonList = [],
  giangVienList = [],
  toaNhaList = [],
  phongHocList = [],

  // Scope info
  isBoMonRole = false,
  scopedBoMonId = '',
  departmentFullName = '',

  // Selected filter states
  selectedHocKy = '',
  setSelectedHocKy,
  selectedKhoaId = '',
  setSelectedKhoaId,
  selectedBoMonId = '',
  setSelectedBoMonId,
  selectedGiangVien = '',
  setSelectedGiangVien,
  selectedToaNha = '',
  setSelectedToaNha,
  selectedPhongHoc = '',
  setSelectedPhongHoc,
  selectedLoaiHoc = '',
  setSelectedLoaiHoc,
  searchTerm = '',
  setSearchTerm,

  // Date states
  activeDatePreset = 'THIS_WEEK',
  handleSetDatePreset,
  handlePrevWeek,
  handleNextWeek,
  weekRangeDisplay = '',

  // View mode
  viewMode = 'MATRIX',
  setViewMode,

  // KPI stats
  stats = { totalClasses: 0, totalLecturers: 0, totalRooms: 0, totalPeriods: 0 },

  // Refresh
  onRefresh,
  loading = false
}) {
  // Lọc danh sách phòng theo tòa nhà đã chọn (nếu có)
  const filteredPhongHocs = selectedToaNha
    ? phongHocList.filter(p => p.MaToaNha === selectedToaNha)
    : phongHocList;

  // Lọc danh sách giảng viên theo bộ môn đã chọn
  const filteredGiangViens = (isBoMonRole ? scopedBoMonId : selectedBoMonId)
    ? giangVienList.filter(g => g.MaBoMon === (isBoMonRole ? scopedBoMonId : selectedBoMonId))
    : giangVienList;

  // Lọc danh sách bộ môn theo khoa
  const filteredBoMons = selectedKhoaId
    ? boMonList.filter(b => b.MaKhoa === selectedKhoaId)
    : boMonList;

  return (
    <div className="lgd-filter-wrapper">
      {/* ─── 1. TOP HEADER TITLE BAR ─── */}
      <div className="lgd-top-header-bar">
        <div className="lgd-top-header-left">
          <div className="lgd-top-icon-box">
            <CalendarRange size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2 className="lgd-top-title">Lịch Giảng Dạy & Học Tập</h2>
              {isBoMonRole && departmentFullName && (
                <span className="lgd-dept-pill">
                  <Users size={13} />
                  {departmentFullName}
                </span>
              )}
            </div>
            <p className="lgd-top-subtitle">
              Xem toàn cảnh lịch học, phân bổ phòng và lịch giảng dạy theo thời gian thực
            </p>
          </div>
        </div>

        <div className="lgd-top-header-right">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="lgd-btn-refresh"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ─── 2. KPI STATS ROW ─── */}
      <div className="lgd-kpi-row">
        <div className="lgd-kpi-card card-blue">
          <div className="lgd-kpi-icon-wrap">
            <BookOpen size={20} />
          </div>
          <div className="lgd-kpi-text">
            <span className="lgd-kpi-num">{stats.totalClasses}</span>
            <span className="lgd-kpi-label">Lớp đang có lịch</span>
          </div>
        </div>

        <div className="lgd-kpi-card card-indigo">
          <div className="lgd-kpi-icon-wrap">
            <User size={20} />
          </div>
          <div className="lgd-kpi-text">
            <span className="lgd-kpi-num">{stats.totalLecturers}</span>
            <span className="lgd-kpi-label">Giảng viên giảng dạy</span>
          </div>
        </div>

        <div className="lgd-kpi-card card-sky">
          <div className="lgd-kpi-icon-wrap">
            <Building2 size={20} />
          </div>
          <div className="lgd-kpi-text">
            <span className="lgd-kpi-num">{stats.totalRooms}</span>
            <span className="lgd-kpi-label">Phòng học sử dụng</span>
          </div>
        </div>

        <div className="lgd-kpi-card card-emerald">
          <div className="lgd-kpi-icon-wrap">
            <Clock size={20} />
          </div>
          <div className="lgd-kpi-text">
            <span className="lgd-kpi-num">{stats.totalPeriods}</span>
            <span className="lgd-kpi-label">Buổi học trong tuần</span>
          </div>
        </div>
      </div>

      {/* ─── 3. FILTER CONTROLS PANEL ─── */}
      <div className="lgd-filter-box">
        {/* Row 1: Dropdown filters */}
        <div className="lgd-filter-inputs-grid">
          {/* Học kỳ */}
          <div className="lgd-input-group">
            <label className="lgd-input-label">
              <Calendar size={13} color="#2563eb" />
              Học kỳ
            </label>
            <select
              className="lgd-select"
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

          {/* Khoa (Chỉ mở khi không phải BOMON) */}
          {!isBoMonRole && (
            <div className="lgd-input-group">
              <label className="lgd-input-label">
                <Building2 size={13} color="#64748b" />
                Khoa / Viện
              </label>
              <select
                className="lgd-select"
                value={selectedKhoaId}
                onChange={e => {
                  setSelectedKhoaId(e.target.value);
                  setSelectedBoMonId('');
                }}
              >
                <option value="">-- Tất cả Khoa --</option>
                {khoaList.map(k => (
                  <option key={k.MaKhoa} value={k.MaKhoa}>
                    {k.TenKhoa}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bộ môn */}
          <div className="lgd-input-group">
            <label className="lgd-input-label">
              <Layers size={13} color="#64748b" />
              Bộ môn {isBoMonRole && '(Cố định)'}
            </label>
            <select
              className="lgd-select"
              value={isBoMonRole ? scopedBoMonId : selectedBoMonId}
              disabled={isBoMonRole}
              onChange={e => setSelectedBoMonId(e.target.value)}
            >
              {isBoMonRole ? (
                <option value={scopedBoMonId}>
                  {departmentFullName || `Bộ môn ${scopedBoMonId}`}
                </option>
              ) : (
                <>
                  <option value="">-- Tất cả Bộ môn --</option>
                  {filteredBoMons.map(bm => (
                    <option key={bm.MaBoMon} value={bm.MaBoMon}>
                      {bm.TenBoMon}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Giảng viên */}
          <div className="lgd-input-group">
            <label className="lgd-input-label">
              <User size={13} color="#64748b" />
              Giảng viên
            </label>
            <select
              className="lgd-select"
              value={selectedGiangVien}
              onChange={e => setSelectedGiangVien(e.target.value)}
            >
              <option value="">-- Tất cả Giảng viên --</option>
              {filteredGiangViens.map(gv => (
                <option key={gv.MaGiangVien} value={gv.MaGiangVien}>
                  {gv.HoTen} ({gv.MaGiangVien})
                </option>
              ))}
            </select>
          </div>

          {/* Tòa nhà & Phòng học */}
          <div className="lgd-input-group">
            <label className="lgd-input-label">
              <DoorOpen size={13} color="#64748b" />
              Phòng học
            </label>
            <select
              className="lgd-select"
              value={selectedPhongHoc}
              onChange={e => setSelectedPhongHoc(e.target.value)}
            >
              <option value="">-- Tất cả Phòng học --</option>
              {filteredPhongHocs.map(ph => (
                <option key={ph.MaPhong} value={ph.MaPhong}>
                  {ph.TenPhong} ({ph.MaToaNha || 'Khu A'})
                </option>
              ))}
            </select>
          </div>

          {/* Kiểu học */}
          <div className="lgd-input-group">
            <label className="lgd-input-label">
              <BookOpen size={13} color="#64748b" />
              Kiểu học
            </label>
            <select
              className="lgd-select"
              value={selectedLoaiHoc}
              onChange={e => setSelectedLoaiHoc(e.target.value)}
            >
              <option value="">-- Tất cả kiểu học --</option>
              <option value="LT">Lý thuyết (LT)</option>
              <option value="TH">Thực hành (TH)</option>
              <option value="BT">Bài tập (BT)</option>
              <option value="BTL">Bài tập lớn (BTL)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date navigation & Smart View Switching */}
        <div className="lgd-filter-bottom-bar">
          {/* Quick Date Presets & Week Navigator */}
          <div className="lgd-date-controls-group">
            <div className="lgd-date-preset-pills">
              <button
                className={`lgd-pill-btn ${activeDatePreset === 'TODAY' ? 'active' : ''}`}
                onClick={() => handleSetDatePreset('TODAY')}
              >
                Hôm nay
              </button>
              <button
                className={`lgd-pill-btn ${activeDatePreset === 'THIS_WEEK' ? 'active' : ''}`}
                onClick={() => handleSetDatePreset('THIS_WEEK')}
              >
                Tuần này
              </button>
              <button
                className={`lgd-pill-btn ${activeDatePreset === 'NEXT_WEEK' ? 'active' : ''}`}
                onClick={() => handleSetDatePreset('NEXT_WEEK')}
              >
                Tuần tới
              </button>
              <button
                className={`lgd-pill-btn ${activeDatePreset === 'THIS_MONTH' ? 'active' : ''}`}
                onClick={() => handleSetDatePreset('THIS_MONTH')}
              >
                Tháng này
              </button>
            </div>

            <div className="lgd-week-slider">
              <button className="lgd-slider-nav-btn" onClick={handlePrevWeek} title="Tuần trước">
                <ChevronLeft size={16} />
              </button>
              <span className="lgd-slider-date-text">{weekRangeDisplay}</span>
              <button className="lgd-slider-nav-btn" onClick={handleNextWeek} title="Tuần sau">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Search Box & 4 Perspective View Modes */}
          <div className="lgd-right-controls-group">
            <div className="lgd-search-input-wrap">
              <Search size={14} className="lgd-search-icon" />
              <input
                type="text"
                className="lgd-search-input"
                placeholder="Tìm lớp, môn, GV..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Smart Perspective View Tabs */}
            <div className="lgd-perspective-switcher">
              <button
                className={`lgd-persp-btn ${viewMode === 'MATRIX' ? 'active' : ''}`}
                onClick={() => setViewMode('MATRIX')}
                title="Lưới tuần tổng quan"
              >
                <LayoutGrid size={14} />
                <span>Tổng quan</span>
              </button>
              <button
                className={`lgd-persp-btn ${viewMode === 'ROOM' ? 'active' : ''}`}
                onClick={() => setViewMode('ROOM')}
                title="Xem theo phòng học"
              >
                <Building2 size={14} />
                <span>Theo Phòng</span>
              </button>
              <button
                className={`lgd-persp-btn ${viewMode === 'LECTURER' ? 'active' : ''}`}
                onClick={() => setViewMode('LECTURER')}
                title="Xem theo giảng viên"
              >
                <User size={14} />
                <span>Theo GV</span>
              </button>
              <button
                className={`lgd-persp-btn ${viewMode === 'AGENDA' ? 'active' : ''}`}
                onClick={() => setViewMode('AGENDA')}
                title="Lịch hôm nay / Theo ngày"
              >
                <List size={14} />
                <span>Theo Ngày</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
