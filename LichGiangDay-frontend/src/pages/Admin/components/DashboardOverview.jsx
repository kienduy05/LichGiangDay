import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { Pie, Doughnut, Bar } from 'react-chartjs-2';
import {
  Building, Layers, School, Network, UserCheck, BookOpen,
  Users, GraduationCap, BookMarked, LayoutGrid,
  RefreshCw, AlertTriangle, CheckCircle, ChevronRight,
  Loader2, PieChart, BarChart3, ShieldAlert, Clock,
  CalendarCheck, CalendarRange, CalendarX, Activity,
  FileWarning, ClipboardList, Timer, CircleCheck,
  CircleX, ArrowRightLeft, UserX, CalendarClock, FileX2
} from 'lucide-react';
import { apiGetDashboardMasterData } from '../../../utils/api';
import { apiGetHocKyList, apiGetKhoaList } from '../../../utils/api';
import './DashboardOverview.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend
);

// ============================================
// Color palettes
// ============================================
const PIE_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7'
];
const BAR_COLOR = 'rgba(37, 99, 235, 0.75)';
const BAR_HOVER = 'rgba(37, 99, 235, 0.95)';
const BAR_COLOR_2 = 'rgba(249, 115, 22, 0.75)';
const BAR_HOVER_2 = 'rgba(249, 115, 22, 0.95)';
const BAR_COLOR_GREEN = 'rgba(16, 185, 129, 0.75)';
const BAR_HOVER_GREEN = 'rgba(16, 185, 129, 0.95)';
const BAR_COLOR_PURPLE = 'rgba(139, 92, 246, 0.75)';
const BAR_HOVER_PURPLE = 'rgba(139, 92, 246, 0.95)';

// ============================================
// Domain Tab configs
// ============================================
const DOMAIN_TABS = [
  { key: 'dulieun', label: 'Dữ liệu nền', icon: LayoutGrid, color: '#2563eb', bg: '#eff6ff' },
  { key: 'thoikhoabieu', label: 'Thời khóa biểu', icon: CalendarCheck, color: '#059669', bg: '#ecfdf5' },
  { key: 'biendong', label: 'Biến động lịch', icon: Activity, color: '#dc2626', bg: '#fef2f2' },
];

// ============================================
// KPI config – icon, color, label, key, tab link
// ============================================
const KPI_CONFIG = [
  { key: 'tongToaNha', label: 'Tòa nhà', icon: Building, bg: '#eff6ff', color: '#2563eb', tab: 'toanha' },
  { key: 'tongPhongHoc', label: 'Phòng học', icon: Layers, bg: '#f0fdf4', color: '#16a34a', tab: 'phonghoc' },
  { key: 'tongKhoa', label: 'Khoa', icon: School, bg: '#fef3c7', color: '#d97706', tab: 'khoa' },
  { key: 'tongBoMon', label: 'Bộ môn', icon: Network, bg: '#f5f3ff', color: '#7c3aed', tab: 'bomon' },
  { key: 'tongGiangVien', label: 'Giảng viên', icon: UserCheck, bg: '#fce7f3', color: '#db2777', tab: 'giangvien' },
  { key: 'tongMonHoc', label: 'Môn học', icon: BookOpen, bg: '#e0f2fe', color: '#0284c7', tab: 'monhoc' },
  { key: 'tongLopSinhVien', label: 'Lớp sinh viên', icon: Users, bg: '#fef9c3', color: '#ca8a04', tab: 'lopsinhvien' },
  { key: 'tongKhoaSinhVien', label: 'Khóa sinh viên', icon: GraduationCap, bg: '#ecfdf5', color: '#059669', tab: 'khoasinhvien' },
  { key: 'tongLopHocPhan', label: 'Lớp học phần', icon: BookMarked, bg: '#fae8ff', color: '#a21caf', tab: 'lophocphan' },
  { key: 'tongSucChua', label: 'Tổng sức chứa', icon: LayoutGrid, bg: '#f1f5f9', color: '#475569', tab: null },
];

// Schedule KPI config
const SCHEDULE_KPI_CONFIG = [
  { key: 'tongTKB', label: 'Lịch TKB đã xếp', icon: CalendarCheck, bg: '#ecfdf5', color: '#059669' },
  { key: 'lhpDaXepLich', label: 'LHP đã xếp lịch', icon: CircleCheck, bg: '#dbeafe', color: '#2563eb' },
  { key: 'tongLHP', label: 'Tổng LHP', icon: BookMarked, bg: '#f5f3ff', color: '#7c3aed' },
  { key: 'tyLeXepLich', label: '% Tỷ lệ xếp lịch', icon: Timer, bg: '#fef3c7', color: '#d97706', suffix: '%' },
  { key: 'tongBuoiHoc', label: 'Buổi học đã sinh', icon: CalendarRange, bg: '#fce7f3', color: '#db2777' },
  { key: 'phongDangDung', label: 'Phòng đang dùng', icon: Layers, bg: '#f0fdf4', color: '#16a34a' },
];

// Biendong KPI config
const BIENDONG_KPI_CONFIG = [
  { key: 'tongYeuCau', label: 'Tổng yêu cầu', icon: ClipboardList, bg: '#eff6ff', color: '#2563eb' },
  { key: 'yeuCauChoDuyet', label: 'Chờ duyệt', icon: Clock, bg: '#fef3c7', color: '#d97706' },
  { key: 'buoiDaNghi', label: 'Buổi đã nghỉ', icon: CalendarX, bg: '#fef2f2', color: '#dc2626' },
  { key: 'buoiDayBu', label: 'Buổi dạy bù', icon: CalendarClock, bg: '#ecfdf5', color: '#059669' },
  { key: 'buoiDayThay', label: 'Buổi dạy thay', icon: ArrowRightLeft, bg: '#f5f3ff', color: '#7c3aed' },
  { key: 'caQuaHan', label: 'Ca quá hạn (>14 ngày)', icon: FileWarning, bg: '#fff7ed', color: '#ea580c' },
  { key: 'tyLeHoanThanhBu', label: '% Hoàn thành bù', icon: Timer, bg: '#fce7f3', color: '#db2777', suffix: '%' },
];

// Warning config (Section D)
const WARNING_CONFIG = [
  { key: 'khoaChuaCoTruongKhoa', label: 'Khoa chưa có Trưởng khoa', tab: 'khoa' },
  { key: 'boMonChuaCoTruongBM', label: 'Bộ môn chưa có Trưởng bộ môn', tab: 'bomon' },
  { key: 'boMonChuaCoGV', label: 'Bộ môn chưa có giảng viên nào', tab: 'bomon' },
  { key: 'giangVienChuaPhanBM', label: 'Giảng viên chưa phân bộ môn', tab: 'giangvien' },
  { key: 'monHocChuaGanBM', label: 'Môn học chưa gán bộ môn', tab: 'monhoc' },
  { key: 'monHocChuaMoLop', label: 'Môn học chưa mở lớp trong HK', tab: 'monhoc' },
  { key: 'phongHocBaoTri', label: 'Phòng học đang bảo trì', tab: 'phonghoc' },
  { key: 'lopHocPhanChuaGanKhoaSV', label: 'LHP chưa gắn khóa sinh viên', tab: 'lophocphan' },
];

// Schedule warning config (Section E)
const SCHEDULE_WARNING_CONFIG = [
  { key: 'lhpChuaXepLich', label: 'LHP chưa xếp lịch', tab: 'thoikhoabieu' },
  { key: 'lhpChuaPhanCongGV', label: 'LHP chưa phân công GV', tab: 'phanconggiangvien' },
];

// Biendong warning config (Section F)
const BIENDONG_WARNING_CONFIG = [
  { key: 'caQuaHanChuaBu', label: 'Ca quá hạn chưa dạy bù (>14 ngày)', tab: 'biendonglich' },
  { key: 'donDayBuChoDuyet', label: 'Đơn dạy bù đang chờ xử lý', tab: 'duyetyeucau' },
];

// Pie chart configs  
const PIE_CHARTS = [
  { key: 'phongHocTheoTrangThai', title: 'B1. Phòng học theo trạng thái' },
  { key: 'phongHocTheoLoaiPhong', title: 'B2. Phòng học theo loại phòng' },
  { key: 'giangVienTheoTrangThai', title: 'B3. Giảng viên theo trạng thái' },
  { key: 'giangVienTaiKhoan', title: 'B4. GV đã / chưa có tài khoản' },
  { key: 'lopHocPhanTheoLoaiHoc', title: 'B5. LHP theo kiểu học' },
  { key: 'monHocTheoTinChi', title: 'B6. Môn học theo số tín chỉ' },
  { key: 'lopHocPhanTheoKhoaSV', title: 'B7. LHP theo khóa sinh viên' },
];

// Schedule Pie chart configs
const SCHEDULE_PIE_CHARTS = [
  { key: 'lhpXepLichPie', title: 'S5. LHP đã/chưa xếp lịch' },
  { key: 'tkbTheoThu', title: 'S6. TKB theo thứ trong tuần' },
  { key: 'phanCongGV', title: 'S7. Phân công GV (Assigned/Unassigned)' },
];

// Biendong Pie chart configs
const BIENDONG_PIE_CHARTS = [
  { key: 'ycTheoLoai', title: 'B7. Yêu cầu theo loại' },
  { key: 'ycTheoTrangThai', title: 'B8. Yêu cầu theo trạng thái' },
  { key: 'buoiHocTheoTrangThai', title: 'B9. Buổi học theo trạng thái biến động' },
];

// Bar chart configs
const BAR_CHARTS = [
  { key: 'soPhongTheoToaNha', title: 'C1. Số phòng theo tòa nhà' },
  { key: 'sucChuaTheoToaNha', title: 'C2. Sức chứa theo tòa nhà' },
  { key: 'soBoMonTheoKhoa', title: 'C3. Số bộ môn theo khoa' },
  { key: 'soGiangVienTheoBM', title: 'C4. Giảng viên theo bộ môn (Top 10)' },
  { key: 'soMonHocTheoBM', title: 'C5. Số môn theo bộ môn' },
  { key: 'soLopSVTheoKhoa', title: 'C6. Lớp sinh viên theo khoa' },
  { key: 'soLHPTheoMonHoc', title: 'C7. LHP theo môn (Top 10)' },
  { key: 'soLHPTheoBM', title: 'C8. LHP theo bộ môn' },
  { key: 'siSoDuKienVsDangKy', title: 'C9. Sĩ số dự kiến vs đăng ký', dual: true, wide: true },
  { key: 'phongHocTheoSucChua', title: 'C10. Phòng theo sức chứa' },
];

// Schedule Bar chart configs
const SCHEDULE_BAR_CHARTS = [
  { key: 'tkbTheoBM', title: 'S8. Số lịch TKB theo bộ môn' },
  { key: 'topPhongHoc', title: 'S9. Top phòng học sử dụng nhiều nhất' },
  { key: 'tkbTheoTiet', title: 'S10. Số lượng lịch theo ca/tiết' },
];

// Biendong Bar chart configs
const BIENDONG_BAR_CHARTS = [
  { key: 'topGVBienDong', title: 'B10. Top GV có nhiều ca biến động nhất' },
  { key: 'bienDongTheoBM', title: 'B11. Số yêu cầu biến động theo bộ môn' },
  { key: 'bienDongTheoThang', title: 'B12. Biến động theo tháng (timeline)' },
];

// ============================================
// Chart option generators
// ============================================
const makePieOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 14,
        usePointStyle: true,
        pointStyleWidth: 10,
        font: { size: 12, weight: 500 }
      }
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 13, weight: 600 },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
          return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
        }
      }
    }
  }
});

const makeBarOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'x',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 13, weight: 600 },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
    }
  },
  scales: {
    x: {
      ticks: {
        maxRotation: 45,
        minRotation: 0,
        font: { size: 11 },
        color: '#64748b',
        callback: function (val) {
          const label = this.getLabelForValue(val);
          return label.length > 15 ? label.slice(0, 14) + '…' : label;
        }
      },
      grid: { display: false }
    },
    y: {
      beginAtZero: true,
      ticks: { font: { size: 11 }, color: '#64748b', precision: 0 },
      grid: { color: '#f1f5f9' }
    }
  }
});

const makeDualBarOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        padding: 16,
        usePointStyle: true,
        pointStyleWidth: 10,
        font: { size: 12, weight: 500 }
      }
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 13, weight: 600 },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
    }
  },
  scales: {
    x: {
      ticks: {
        maxRotation: 45, minRotation: 0,
        font: { size: 11 }, color: '#64748b',
        callback: function (val) {
          const label = this.getLabelForValue(val);
          return label.length > 15 ? label.slice(0, 14) + '…' : label;
        }
      },
      grid: { display: false }
    },
    y: {
      beginAtZero: true,
      ticks: { font: { size: 11 }, color: '#64748b', precision: 0 },
      grid: { color: '#f1f5f9' }
    }
  }
});

// ============================================
// Helpers
// ============================================
const buildPieData = (items) => ({
  labels: items.map(i => i.label),
  datasets: [{
    data: items.map(i => i.value),
    backgroundColor: PIE_COLORS.slice(0, items.length),
    borderWidth: 2,
    borderColor: '#ffffff',
    hoverOffset: 6,
  }]
});

const buildBarData = (items, color = BAR_COLOR, hoverColor = BAR_HOVER) => ({
  labels: items.map(i => i.label),
  datasets: [{
    data: items.map(i => i.value),
    backgroundColor: color,
    hoverBackgroundColor: hoverColor,
    maxBarThickness: 48,
  }]
});

const buildDualBarData = (items) => ({
  labels: items.map(i => i.label),
  datasets: [
    {
      label: 'Sĩ số dự kiến',
      data: items.map(i => i.siSoDuKien),
      backgroundColor: BAR_COLOR,
      hoverBackgroundColor: BAR_HOVER,
      maxBarThickness: 36,
    },
    {
      label: 'Sĩ số đăng ký',
      data: items.map(i => i.siSoDangKy),
      backgroundColor: BAR_COLOR_2,
      hoverBackgroundColor: BAR_HOVER_2,
      maxBarThickness: 36,
    }
  ]
});

// ============================================
// Render helpers
// ============================================
const renderKPIGrid = (config, data, navigateTo, gridClass = '') => (
  <div className={`dashboard-kpi-grid ${gridClass}`}>
    {config.map(cfg => {
      const Icon = cfg.icon;
      const value = data[cfg.key] ?? 0;
      return (
        <div
          key={cfg.key}
          className="dashboard-kpi-card"
          style={{ '--kpi-accent': cfg.color }}
          onClick={() => cfg.tab && navigateTo(cfg.tab)}
          title={cfg.tab ? `Mở quản lý ${cfg.label}` : cfg.label}
        >
          <div className="kpi-icon" style={{ background: cfg.bg, color: cfg.color }}>
            <Icon size={22} />
          </div>
          <div className="kpi-info">
            <div className="kpi-number">
              {value.toLocaleString('vi-VN')}{cfg.suffix || ''}
            </div>
            <div className="kpi-label">{cfg.label}</div>
          </div>
        </div>
      );
    })}
  </div>
);

const renderPieCharts = (config, data, badgeLabel = 'Tròn') => (
  <div className="dashboard-charts-grid">
    {config.map(cfg => {
      const items = data[cfg.key];
      if (!items || items.length === 0) {
        return (
          <div key={cfg.key} className="dashboard-chart-card">
            <div className="chart-card-header">
              <span className="chart-card-title">{cfg.title}</span>
              <span className="chart-card-badge pie">{badgeLabel}</span>
            </div>
            <div className="chart-empty">Chưa có dữ liệu</div>
          </div>
        );
      }
      return (
        <div key={cfg.key} className="dashboard-chart-card">
          <div className="chart-card-header">
            <span className="chart-card-title">{cfg.title}</span>
            <span className="chart-card-badge pie">{badgeLabel}</span>
          </div>
          <div className="chart-canvas-wrapper pie-wrapper">
            <Doughnut data={buildPieData(items)} options={makePieOptions(cfg.title)} />
          </div>
        </div>
      );
    })}
  </div>
);

const renderBarCharts = (config, data, barColor = BAR_COLOR, barHover = BAR_HOVER, badgeLabel = 'Cột') => (
  <div className="dashboard-charts-grid">
    {config.map(cfg => {
      const items = data[cfg.key];
      if (!items || items.length === 0) {
        return (
          <div key={cfg.key} className={`dashboard-chart-card ${cfg.wide ? 'wide' : ''}`}>
            <div className="chart-card-header">
              <span className="chart-card-title">{cfg.title}</span>
              <span className="chart-card-badge bar">{badgeLabel}</span>
            </div>
            <div className="chart-empty">Chưa có dữ liệu</div>
          </div>
        );
      }
      return (
        <div key={cfg.key} className={`dashboard-chart-card ${cfg.wide ? 'wide' : ''}`}>
          <div className="chart-card-header">
            <span className="chart-card-title">{cfg.title}</span>
            <span className="chart-card-badge bar">{badgeLabel}</span>
          </div>
          <div className="chart-canvas-wrapper">
            {cfg.dual ? (
              <Bar data={buildDualBarData(items)} options={makeDualBarOptions()} />
            ) : (
              <Bar data={buildBarData(items, barColor, barHover)} options={makeBarOptions(cfg.title)} />
            )}
          </div>
        </div>
      );
    })}
  </div>
);

const renderWarnings = (config, data, navigateTo) => (
  <div className="dashboard-warnings-grid">
    {config.map(cfg => {
      const count = data[cfg.key] ?? 0;
      const isDanger = count > 0;
      return (
        <div
          key={cfg.key}
          className={`warning-item ${isDanger ? '' : 'ok'}`}
          onClick={() => navigateTo(cfg.tab)}
          title={`Mở ${cfg.label}`}
        >
          <div className={`warning-icon ${isDanger ? 'danger' : 'ok'}`}>
            {isDanger ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          </div>
          <div className="warning-info">
            <div className={`warning-count ${isDanger ? 'danger' : ''}`}>{count}</div>
            <div className="warning-label">{cfg.label}</div>
          </div>
          <ChevronRight size={16} className="warning-arrow" />
        </div>
      );
    })}
  </div>
);

// ============================================
// Main Component
// ============================================
export default function DashboardOverview({ setActiveTab: parentSetActiveTab }) {
  // Bộ lọc
  const [hocKyList, setHocKyList] = useState([]);
  const [khoaList, setKhoaList] = useState([]);
  const [selectedHocKy, setSelectedHocKy] = useState('');
  const [selectedKhoa, setSelectedKhoa] = useState('');

  // Domain tab
  const [activeDomain, setActiveDomain] = useState('dulieun');

  // Data
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cache
  const cacheRef = useRef({});

  // Load dropdown lists
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [hkList, kList] = await Promise.all([
          apiGetHocKyList(),
          apiGetKhoaList()
        ]);
        setHocKyList(hkList || []);
        setKhoaList(kList || []);
        // Chọn học kỳ đầu tiên mặc định
        if (hkList && hkList.length > 0) {
          setSelectedHocKy(hkList[0].MaHocKy);
        }
      } catch (err) {
        console.error('Load filters error:', err);
      }
    };
    loadFilters();
  }, []);

  // Fetch dashboard data
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!selectedHocKy) return;
    const cacheKey = `${selectedHocKy}:${selectedKhoa || 'ALL'}`;

    if (!forceRefresh && cacheRef.current[cacheKey]) {
      setData(cacheRef.current[cacheKey]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await apiGetDashboardMasterData({
        maHocKy: selectedHocKy,
        maKhoa: selectedKhoa || undefined
      });
      cacheRef.current[cacheKey] = result;
      setData(result);
    } catch (err) {
      setError(err.message || 'Lỗi khi lấy dữ liệu dashboard.');
    } finally {
      setLoading(false);
    }
  }, [selectedHocKy, selectedKhoa]);

  useEffect(() => {
    if (selectedHocKy) {
      fetchData();
    }
  }, [fetchData, selectedHocKy]);

  // Navigate to management tab
  const navigateTo = (tab) => {
    if (tab && parentSetActiveTab) {
      parentSetActiveTab(tab);
    }
  };

  // Format timestamp
  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // ============================================
  // Render
  // ============================================
  return (
    <>
      {/* === FILTER BAR === */}
      <div className="dashboard-filter-bar">
        <div className="filter-group">
          <span className="filter-label">Học kỳ</span>
          <select
            value={selectedHocKy}
            onChange={(e) => setSelectedHocKy(e.target.value)}
          >
            {hocKyList.map(hk => (
              <option key={hk.MaHocKy} value={hk.MaHocKy}>
                {hk.TenHocKy}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Khoa</span>
          <select
            value={selectedKhoa}
            onChange={(e) => setSelectedKhoa(e.target.value)}
          >
            <option value="">— Tất cả các khoa —</option>
            {khoaList.map(k => (
              <option key={k.MaKhoa} value={k.MaKhoa}>
                {k.TenKhoa}
              </option>
            ))}
          </select>
        </div>

        <div className="dashboard-filter-actions">
          {data?.generatedAt && (
            <span className="dashboard-timestamp">
              <Clock size={13} />
              Cập nhật: {formatTime(data.generatedAt)}
            </span>
          )}
          <button
            className="btn-refresh-dashboard"
            onClick={() => fetchData(true)}
            disabled={loading}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* === DOMAIN TABS === */}
      <div className="dashboard-domain-tabs">
        {DOMAIN_TABS.map(dt => {
          const Icon = dt.icon;
          return (
            <button
              key={dt.key}
              className={`domain-tab ${activeDomain === dt.key ? 'active' : ''}`}
              style={{ '--tab-color': dt.color, '--tab-bg': dt.bg }}
              onClick={() => setActiveDomain(dt.key)}
            >
              <span className="domain-tab-icon">
                <Icon size={18} />
              </span>
              <span className="domain-tab-label">{dt.label}</span>
            </button>
          );
        })}
      </div>

      {/* === LOADING === */}
      {loading && !data && (
        <div className="dashboard-loading">
          <Loader2 size={36} className="animate-spin" />
          <span>Đang tải số liệu thống kê...</span>
        </div>
      )}

      {/* === ERROR === */}
      {error && !data && (
        <div className="dashboard-error">
          <AlertTriangle size={36} />
          <span>{error}</span>
          <button onClick={() => fetchData(true)}>Thử lại</button>
        </div>
      )}

      {/* === MAIN CONTENT === */}
      {data && (
        <>
          {/* ================================================================
              DOMAIN 1: DỮ LIỆU NỀN (kpi, pie, bar, warnings)
              ================================================================ */}
          {activeDomain === 'dulieun' && (
            <>
              {/* ======== KHU VỰC A: KPI Cards ======== */}
              {data.kpi && (
                <>
                  <h3 className="dashboard-section-title">
                    <span className="section-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                      <LayoutGrid size={18} />
                    </span>
                    Tổng quan số liệu
                  </h3>
                  {renderKPIGrid(KPI_CONFIG, data.kpi, navigateTo)}
                </>
              )}

              {/* ======== KHU VỰC B: Biểu đồ tròn ======== */}
              {data.pie && (
                <>
                  <h3 className="dashboard-section-title">
                    <span className="section-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                      <PieChart size={18} />
                    </span>
                    Biểu đồ cơ cấu — tỷ lệ
                  </h3>
                  {renderPieCharts(PIE_CHARTS, data.pie)}
                </>
              )}

              {/* ======== KHU VỰC C: Biểu đồ cột ======== */}
              {data.bar && (
                <>
                  <h3 className="dashboard-section-title">
                    <span className="section-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                      <BarChart3 size={18} />
                    </span>
                    Biểu đồ so sánh
                  </h3>
                  {renderBarCharts(BAR_CHARTS, data.bar)}
                </>
              )}

              {/* ======== KHU VỰC D: Cảnh báo chất lượng ======== */}
              {data.warnings && (
                <>
                  <h3 className="dashboard-section-title">
                    <span className="section-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                      <ShieldAlert size={18} />
                    </span>
                    Cảnh báo chất lượng dữ liệu
                  </h3>
                  {renderWarnings(WARNING_CONFIG, data.warnings, navigateTo)}
                </>
              )}
            </>
          )}

          {/* ================================================================
              DOMAIN 2: THỜI KHÓA BIỂU (schedule section)
              ================================================================ */}
          {activeDomain === 'thoikhoabieu' && (
            <>
              {data.schedule ? (
                <>
                  {/* KPI */}
                  {data.schedule.kpi && (
                    <>
                      <h3 className="dashboard-section-title">
                        <span className="section-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                          <CalendarCheck size={18} />
                        </span>
                        Tổng quan Thời khóa biểu
                      </h3>
                      {renderKPIGrid(SCHEDULE_KPI_CONFIG, data.schedule.kpi, navigateTo, 'kpi-6col')}
                    </>
                  )}

                  {/* PIE */}
                  {data.schedule.pie && (
                    <>
                      <h3 className="dashboard-section-title">
                        <span className="section-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                          <PieChart size={18} />
                        </span>
                        Biểu đồ cơ cấu — Thời khóa biểu
                      </h3>
                      {renderPieCharts(SCHEDULE_PIE_CHARTS, data.schedule.pie, 'TKB')}
                    </>
                  )}

                  {/* BAR */}
                  {data.schedule.bar && (
                    <>
                      <h3 className="dashboard-section-title">
                        <span className="section-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                          <BarChart3 size={18} />
                        </span>
                        Biểu đồ so sánh — Thời khóa biểu
                      </h3>
                      {renderBarCharts(SCHEDULE_BAR_CHARTS, data.schedule.bar, BAR_COLOR_GREEN, BAR_HOVER_GREEN, 'TKB')}
                    </>
                  )}

                  {/* WARNINGS */}
                  {data.schedule.warnings && (
                    <>
                      <h3 className="dashboard-section-title">
                        <span className="section-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                          <ShieldAlert size={18} />
                        </span>
                        Cảnh báo — Thời khóa biểu
                      </h3>
                      {renderWarnings(SCHEDULE_WARNING_CONFIG, data.schedule.warnings, navigateTo)}
                    </>
                  )}
                </>
              ) : (
                <div className="dashboard-empty-domain">
                  <CalendarX size={48} />
                  <p>Chưa có dữ liệu Thời khóa biểu cho học kỳ này.</p>
                  <span>Vui lòng xếp lịch trước khi xem thống kê.</span>
                </div>
              )}
            </>
          )}

          {/* ================================================================
              DOMAIN 3: BIẾN ĐỘNG LỊCH (biendong section)
              ================================================================ */}
          {activeDomain === 'biendong' && (
            <>
              {data.biendong ? (
                <>
                  {/* KPI */}
                  {data.biendong.kpi && (
                    <>
                      <h3 className="dashboard-section-title">
                        <span className="section-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                          <Activity size={18} />
                        </span>
                        Tổng quan Biến động lịch
                      </h3>
                      {renderKPIGrid(BIENDONG_KPI_CONFIG, data.biendong.kpi, navigateTo, 'kpi-7col')}
                    </>
                  )}

                  {/* PIE */}
                  {data.biendong.pie && (
                    <>
                      <h3 className="dashboard-section-title">
                        <span className="section-icon" style={{ background: '#fecaca', color: '#dc2626' }}>
                          <PieChart size={18} />
                        </span>
                        Biểu đồ cơ cấu — Biến động lịch
                      </h3>
                      {renderPieCharts(BIENDONG_PIE_CHARTS, data.biendong.pie, 'BĐ')}
                    </>
                  )}

                  {/* BAR */}
                  {data.biendong.bar && (
                    <>
                      <h3 className="dashboard-section-title">
                        <span className="section-icon" style={{ background: '#fecaca', color: '#dc2626' }}>
                          <BarChart3 size={18} />
                        </span>
                        Biểu đồ so sánh — Biến động lịch
                      </h3>
                      {renderBarCharts(BIENDONG_BAR_CHARTS, data.biendong.bar, BAR_COLOR_PURPLE, BAR_HOVER_PURPLE, 'BĐ')}
                    </>
                  )}

                  {/* WARNINGS */}
                  {data.biendong.warnings && (
                    <>
                      <h3 className="dashboard-section-title">
                        <span className="section-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                          <ShieldAlert size={18} />
                        </span>
                        Cảnh báo — Biến động lịch
                      </h3>
                      {renderWarnings(BIENDONG_WARNING_CONFIG, data.biendong.warnings, navigateTo)}
                    </>
                  )}
                </>
              ) : (
                <div className="dashboard-empty-domain">
                  <FileX2 size={48} />
                  <p>Chưa có dữ liệu Biến động lịch cho học kỳ này.</p>
                  <span>Dữ liệu sẽ xuất hiện khi có yêu cầu nghỉ / đổi ca / dạy thay.</span>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
