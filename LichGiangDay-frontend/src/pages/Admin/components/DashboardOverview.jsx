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
  Loader2, PieChart, BarChart3, ShieldAlert, Clock
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

// Warning config
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

const buildBarData = (items) => ({
  labels: items.map(i => i.label),
  datasets: [{
    data: items.map(i => i.value),
    backgroundColor: BAR_COLOR,
    hoverBackgroundColor: BAR_HOVER,
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
// Main Component
// ============================================
export default function DashboardOverview({ setActiveTab: parentSetActiveTab }) {
  // Bộ lọc
  const [hocKyList, setHocKyList] = useState([]);
  const [khoaList, setKhoaList] = useState([]);
  const [selectedHocKy, setSelectedHocKy] = useState('');
  const [selectedKhoa, setSelectedKhoa] = useState('');

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
          {/* ======== KHU VỰC A: KPI Cards ======== */}
          {data.kpi && (
            <>
              <h3 className="dashboard-section-title">
                <span className="section-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <LayoutGrid size={18} />
                </span>
                Tổng quan số liệu
              </h3>
              <div className="dashboard-kpi-grid">
                {KPI_CONFIG.map(cfg => {
                  const Icon = cfg.icon;
                  const value = data.kpi[cfg.key] ?? 0;
                  return (
                    <div
                      key={cfg.key}
                      className="dashboard-kpi-card"
                      style={{ '--kpi-accent': cfg.color }}
                      onClick={() => navigateTo(cfg.tab)}
                      title={cfg.tab ? `Mở quản lý ${cfg.label}` : cfg.label}
                    >
                      <div className="kpi-icon" style={{ background: cfg.bg, color: cfg.color }}>
                        <Icon size={22} />
                      </div>
                      <div className="kpi-info">
                        <div className="kpi-number">{value.toLocaleString('vi-VN')}</div>
                        <div className="kpi-label">{cfg.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
              <div className="dashboard-charts-grid">
                {PIE_CHARTS.map(cfg => {
                  const items = data.pie[cfg.key];
                  if (!items || items.length === 0) {
                    return (
                      <div key={cfg.key} className="dashboard-chart-card">
                        <div className="chart-card-header">
                          <span className="chart-card-title">{cfg.title}</span>
                          <span className="chart-card-badge pie">Tròn</span>
                        </div>
                        <div className="chart-empty">Chưa có dữ liệu</div>
                      </div>
                    );
                  }
                  return (
                    <div key={cfg.key} className="dashboard-chart-card">
                      <div className="chart-card-header">
                        <span className="chart-card-title">{cfg.title}</span>
                        <span className="chart-card-badge pie">Tròn</span>
                      </div>
                      <div className="chart-canvas-wrapper pie-wrapper">
                        <Doughnut data={buildPieData(items)} options={makePieOptions(cfg.title)} />
                      </div>
                    </div>
                  );
                })}
              </div>
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
              <div className="dashboard-charts-grid">
                {BAR_CHARTS.map(cfg => {
                  const items = data.bar[cfg.key];
                  if (!items || items.length === 0) {
                    return (
                      <div key={cfg.key} className={`dashboard-chart-card ${cfg.wide ? 'wide' : ''}`}>
                        <div className="chart-card-header">
                          <span className="chart-card-title">{cfg.title}</span>
                          <span className="chart-card-badge bar">Cột</span>
                        </div>
                        <div className="chart-empty">Chưa có dữ liệu</div>
                      </div>
                    );
                  }
                  return (
                    <div key={cfg.key} className={`dashboard-chart-card ${cfg.wide ? 'wide' : ''}`}>
                      <div className="chart-card-header">
                        <span className="chart-card-title">{cfg.title}</span>
                        <span className="chart-card-badge bar">Cột</span>
                      </div>
                      <div className="chart-canvas-wrapper">
                        {cfg.dual ? (
                          <Bar data={buildDualBarData(items)} options={makeDualBarOptions()} />
                        ) : (
                          <Bar data={buildBarData(items)} options={makeBarOptions(cfg.title)} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
              <div className="dashboard-warnings-grid">
                {WARNING_CONFIG.map(cfg => {
                  const count = data.warnings[cfg.key] ?? 0;
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
            </>
          )}
        </>
      )}
    </>
  );
}
