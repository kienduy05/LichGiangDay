import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Calendar, Clock, User, Users, BookOpen, Layers,
  AlertTriangle, CheckCircle, RefreshCw, ChevronRight,
  Loader2, Bell, CalendarRange, ArrowRight, Building, CheckCheck
} from 'lucide-react';
import { apiGetDashboardBoMon, apiGetHocKyList } from '../../../../utils/api';
import './BoMonDashboardOverview.css';

// Đăng ký thành phần Chart.js
ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend
);

export default function BoMonDashboardOverview({ setActiveTab }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  // Danh mục học kỳ
  const [hocKyList, setHocKyList] = useState([]);
  const [selectedHocKy, setSelectedHocKy] = useState('');

  // 1. Tải danh mục Học kỳ
  useEffect(() => {
    const fetchHocKy = async () => {
      try {
        const list = await apiGetHocKyList();
        setHocKyList(list || []);
        if (list && list.length > 0 && !selectedHocKy) {
          setSelectedHocKy(list[0].MaHocKy);
        }
      } catch (err) {
        console.error('Lỗi tải danh mục học kỳ:', err);
      }
    };
    fetchHocKy();
  }, []);

  // 2. Tải dữ liệu Dashboard Bộ môn
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiGetDashboardBoMon({
        maHocKy: selectedHocKy || undefined
      });
      setData(result);
    } catch (err) {
      console.error('Lỗi tải Dashboard Bộ môn:', err);
      setError(err.message || 'Không thể tải số liệu dashboard bộ môn.');
    } finally {
      setLoading(false);
    }
  }, [selectedHocKy]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Cấu hình Biểu đồ Cột: Tải giảng dạy của Giảng viên (Workload)
  const workloadChartData = useMemo(() => {
    if (!data?.workload || data.workload.length === 0) return null;

    const labels = data.workload.map(item => item.HoTen);
    const buoiDayData = data.workload.map(item => Number(item.TongSoBuoiDay) || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Số buổi dạy trong HK',
          data: buoiDayData,
          backgroundColor: 'rgba(37, 99, 235, 0.75)',
          hoverBackgroundColor: 'rgba(37, 99, 235, 0.95)',
          borderRadius: 6,
          barPercentage: 0.6
        }
      ]
    };
  }, [data?.workload]);

  // Cấu hình Biểu đồ Tròn: Phân bổ biến động lịch
  const variationChartData = useMemo(() => {
    if (!data?.bienDong) return null;
    const bd = data.bienDong;

    const values = [
      Number(bd.SoBuoiBinhThuong) || 0,
      Number(bd.SoBuoiNghi) || 0,
      Number(bd.SoBuoiDoiCa) || 0,
      Number(bd.SoBuoiDayThay) || 0,
      Number(bd.SoBuoiDayBu) || 0
    ];

    if (values.every(v => v === 0)) return null;

    return {
      labels: ['Bình thường', 'Báo nghỉ', 'Đổi ca', 'Dạy thay', 'Dạy bù'],
      datasets: [
        {
          data: values,
          backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    };
  }, [data?.bienDong]);

  const kpi = data?.kpi || {};
  const boMon = data?.boMon || {};
  const homNayList = data?.homNay || [];
  const viecCanXuLy = data?.viecCanXuLy || [];

  return (
    <div className="bm-dashboard-container">
      {/* ─── 1. HEADER BANNER ─── */}
      <div className="bm-dashboard-header">
        <div className="bm-header-left">
          <div className="bm-header-badge">
            <span className="bm-badge-pulse" />
            <span>Bộ Môn Chuyên Môn</span>
          </div>
          <h1 className="bm-header-title">
            Dashboard Giảng Dạy & Lịch Học
          </h1>
          <p className="bm-header-sub">
            {boMon.TenBoMon ? (
              <>
                <strong>{boMon.TenBoMon}</strong> • {boMon.TenKhoa || 'Khoa Chuyên môn'}
                {boMon.TenTruongBoMon && (
                  <span className="bm-head-teacher">
                    {' • Trưởng BM: '}<strong>{boMon.TenTruongBoMon}</strong>
                  </span>
                )}
              </>
            ) : (
              'Theo dõi điều phối lịch giảng dạy, tải công việc và biến động theo thời gian thực'
            )}
          </p>
        </div>

        <div className="bm-header-controls">
          <div className="bm-select-wrap">
            <Calendar size={15} className="bm-select-icon" />
            <select
              className="bm-hk-select"
              value={selectedHocKy}
              onChange={e => setSelectedHocKy(e.target.value)}
              disabled={loading}
            >
              {hocKyList.map(hk => (
                <option key={hk.MaHocKy} value={hk.MaHocKy}>
                  {hk.TenHocKy} {hk.NamHoc ? `(${hk.NamHoc})` : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            className="bm-refresh-btn"
            onClick={fetchDashboardData}
            disabled={loading}
            title="Làm mới số liệu"
          >
            <RefreshCw size={15} className={loading ? 'bm-spin' : ''} />
            <span>Cập nhật</span>
          </button>
        </div>
      </div>

      {/* Lỗi nếu có */}
      {error && (
        <div className="bm-error-banner">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="bm-retry-btn">Thử lại</button>
        </div>
      )}

      {loading && !data && (
        <div className="bm-loading-box">
          <Loader2 size={32} className="bm-spin" />
          <p>Đang tổng hợp số liệu giảng dạy của bộ môn...</p>
        </div>
      )}

      {data && (
        <>
          {/* ─── 2. KPI CARDS GRID ─── */}
          <div className="bm-kpi-grid">
            {/* Card 1: Giảng viên */}
            <div className="bm-kpi-card card-blue" onClick={() => setActiveTab && setActiveTab('giangvien')}>
              <div className="bm-kpi-icon-wrap">
                <Users size={22} />
              </div>
              <div className="bm-kpi-content">
                <div className="bm-kpi-val">{kpi.tongGiangVien || 0}</div>
                <div className="bm-kpi-lbl">Giảng viên bộ môn</div>
                <div className="bm-kpi-sub">
                  <strong>{kpi.giangVienDangDay || 0}</strong> GV có lịch trong kỳ
                </div>
              </div>
              <ChevronRight size={16} className="bm-card-arrow" />
            </div>

            {/* Card 2: Lớp học phần */}
            <div className="bm-kpi-card card-purple" onClick={() => setActiveTab && setActiveTab('lophocphan')}>
              <div className="bm-kpi-icon-wrap">
                <BookOpen size={22} />
              </div>
              <div className="bm-kpi-content">
                <div className="bm-kpi-val">{kpi.tongLopHocPhan || 0}</div>
                <div className="bm-kpi-lbl">Lớp học phần phụ trách</div>
                <div className="bm-kpi-sub">Học kỳ hiện tại</div>
              </div>
              <ChevronRight size={16} className="bm-card-arrow" />
            </div>

            {/* Card 3: Ca dạy trong tuần */}
            <div className="bm-kpi-card card-emerald" onClick={() => setActiveTab && setActiveTab('lichgiangday')}>
              <div className="bm-kpi-icon-wrap">
                <CalendarRange size={22} />
              </div>
              <div className="bm-kpi-content">
                <div className="bm-kpi-val">{kpi.buoiHocTuanNay || 0}</div>
                <div className="bm-kpi-lbl">Buổi học trong tuần này</div>
                <div className="bm-kpi-sub">
                  T2 đến Chủ nhật
                </div>
              </div>
              <ChevronRight size={16} className="bm-card-arrow" />
            </div>

            {/* Card 4: Yêu cầu chờ duyệt */}
            <div 
              className={`bm-kpi-card card-amber ${kpi.yeuCauChoDuyet > 0 ? 'highlight-pulse' : ''}`}
              onClick={() => setActiveTab && setActiveTab('duyetyeucau')}
            >
              <div className="bm-kpi-icon-wrap">
                <Bell size={22} />
              </div>
              <div className="bm-kpi-content">
                <div className="bm-kpi-val">{kpi.yeuCauChoDuyet || 0}</div>
                <div className="bm-kpi-lbl">Yêu cầu cần duyệt</div>
                <div className="bm-kpi-sub">
                  {kpi.yeuCauChoDuyet > 0 ? '⚠️ Cần xử lý sớm' : 'Đã duyệt hết'}
                </div>
              </div>
              <ChevronRight size={16} className="bm-card-arrow" />
            </div>

            {/* Card 5: Buổi nghỉ chưa dạy bù */}
            <div 
              className="bm-kpi-card card-rose"
              onClick={() => setActiveTab && setActiveTab('biendonglich')}
            >
              <div className="bm-kpi-icon-wrap">
                <AlertTriangle size={22} />
              </div>
              <div className="bm-kpi-content">
                <div className="bm-kpi-val">{kpi.buoiNghiChuaBu || 0}</div>
                <div className="bm-kpi-lbl">Buổi nghỉ chưa bù</div>
                <div className="bm-kpi-sub">Cần lên lịch dạy bù</div>
              </div>
              <ChevronRight size={16} className="bm-card-arrow" />
            </div>
          </div>

          {/* ─── 3. LỊCH GIẢNG DẠY HÔM NAY CỦA BỘ MÔN ─── */}
          <div className="bm-section-card">
            <div className="bm-section-head">
              <div className="bm-section-title-wrap">
                <Clock size={18} className="bm-section-icon icon-blue" />
                <div>
                  <h2 className="bm-section-title">Lịch Giảng Dạy Hôm Nay Của Bộ Môn</h2>
                  <p className="bm-section-desc">
                    Các ca học đang diễn ra hoặc chuẩn bị bắt đầu trong ngày hôm nay ({data?.tuanHienTai?.homNay || 'Hôm nay'})
                  </p>
                </div>
              </div>

              <button
                className="bm-link-btn"
                onClick={() => setActiveTab && setActiveTab('lichgiangday')}
              >
                <span>Xem toàn bộ lịch tuần</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {homNayList.length === 0 ? (
              <div className="bm-empty-today">
                <CheckCheck size={36} color="#10b981" />
                <p>Hôm nay Bộ môn không có ca dạy nào theo lịch thời khóa biểu.</p>
                <span>Các giảng viên có thể tập trung nghiên cứu hoặc sinh hoạt chuyên môn.</span>
              </div>
            ) : (
              <div className="bm-today-table-wrap">
                <table className="bm-table">
                  <thead>
                    <tr>
                      <th>Ca / Tiết học</th>
                      <th>Môn học / Lớp HP</th>
                      <th>Giảng viên</th>
                      <th>Phòng học</th>
                      <th>Kiểu học</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homNayList.map(item => {
                      const isAbsent = item.TrangThai === 'Absent';
                      const isSubstitute = item.MaGiangVienGoc && item.MaGiangVien !== item.MaGiangVienGoc;
                      const isSwap = Boolean(item.NgayGocDoiCa);

                      return (
                        <tr key={item.MaBuoiHoc} className={isAbsent ? 'row-absent' : ''}>
                          <td>
                            <div className="bm-cell-time">
                              <span className="bm-tiet-name">{item.TenTiet}</span>
                              <span className="bm-tiet-hours">{item.GioBatDau} - {item.GioKetThuc}</span>
                            </div>
                          </td>
                          <td>
                            <div className="bm-cell-subject">
                              <span className="bm-sub-name">{item.TenMonHoc}</span>
                              <span className="bm-lhp-name">{item.TenLopHocPhan}</span>
                            </div>
                          </td>
                          <td>
                            <div className="bm-cell-gv">
                              <span className="bm-gv-name">{item.TenGiangVien || 'Chưa gán GV'}</span>
                              {isSubstitute && (
                                <span className="bm-gv-substitute" title="Dạy thay">
                                  Dạy thay cho {item.TenGiangVienGoc}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="bm-cell-room">
                              <Building size={13} color="#64748b" />
                              <span>{item.TenPhong} ({item.MaToaNha || 'Khu A'})</span>
                            </div>
                          </td>
                          <td>
                            <span className={`bm-pill-loai ${item.LoaiHoc}`}>
                              {item.LoaiHoc || 'LT'}
                            </span>
                          </td>
                          <td>
                            {isAbsent ? (
                              <span className="bm-status-badge badge-absent">Báo nghỉ</span>
                            ) : isSwap ? (
                              <span className="bm-status-badge badge-swap">Đổi ca</span>
                            ) : isSubstitute ? (
                              <span className="bm-status-badge badge-sub">Dạy thay</span>
                            ) : item.LoaiBuoiHoc === 'Makeup' ? (
                              <span className="bm-status-badge badge-makeup">Dạy bù</span>
                            ) : (
                              <span className="bm-status-badge badge-normal">Bình thường</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ─── 4. HAI CỘT: WORKLOAD & PENDING REQUESTS ─── */}
          <div className="bm-two-cols-grid">
            {/* Cột 1: Phân bổ tải giảng dạy (Workload) */}
            <div className="bm-section-card col-workload">
              <div className="bm-section-head">
                <div className="bm-section-title-wrap">
                  <User size={18} className="bm-section-icon icon-indigo" />
                  <div>
                    <h2 className="bm-section-title">Phân Bổ Tải Giảng Dạy Của Giảng Viên</h2>
                    <p className="bm-section-desc">
                      Tổng số buổi dạy thực tế trong học kỳ của từng giảng viên bộ môn
                    </p>
                  </div>
                </div>
              </div>

              {workloadChartData ? (
                <div className="bm-chart-box">
                  <Bar
                    data={workloadChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: '#1e293b',
                          padding: 10,
                          callbacks: {
                            label: (ctx) => ` Buổi dạy: ${ctx.parsed.y} buổi`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { precision: 0 },
                          grid: { color: '#f1f5f9' }
                        },
                        x: {
                          grid: { display: false },
                          ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 0,
                            font: { size: 11 }
                          }
                        }
                      }
                    }}
                    height={260}
                  />
                </div>
              ) : (
                <div className="bm-empty-placeholder">
                  <p>Chưa có dữ liệu phân công lịch dạy trong học kỳ này.</p>
                </div>
              )}

              {/* Bảng mini tải giảng dạy */}
              {data.workload && data.workload.length > 0 && (
                <div className="bm-workload-mini-list">
                  {data.workload.slice(0, 5).map(item => (
                    <div key={item.MaGiangVien} className="bm-workload-mini-item">
                      <div className="bm-gv-avatar">
                        {item.HoTen ? item.HoTen.charAt(item.HoTen.lastIndexOf(' ') + 1) : 'GV'}
                      </div>
                      <div className="bm-gv-info">
                        <span className="bm-gv-name-bold">{item.HoTen}</span>
                        <span className="bm-gv-lhp-count">{item.SoLopHocPhan} lớp học phần</span>
                      </div>
                      <div className="bm-gv-buoi-badge">
                        <strong>{item.TongSoBuoiDay}</strong> buổi
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cột 2: Việc cần xử lý gấp & Biến động */}
            <div className="bm-col-right-stack">
              {/* Card Yêu cầu chờ duyệt */}
              <div className="bm-section-card">
                <div className="bm-section-head">
                  <div className="bm-section-title-wrap">
                    <Bell size={18} className="bm-section-icon icon-amber" />
                    <div>
                      <h2 className="bm-section-title">Yêu Cầu Cần Duyệt Gấp</h2>
                      <p className="bm-section-desc">Đơn báo nghỉ, đổi ca, dạy thay chờ Bộ môn</p>
                    </div>
                  </div>

                  <button
                    className="bm-link-btn"
                    onClick={() => setActiveTab && setActiveTab('duyetyeucau')}
                  >
                    <span>Vào duyệt</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {viecCanXuLy.length === 0 ? (
                  <div className="bm-empty-action">
                    <CheckCircle size={32} color="#10b981" />
                    <p>Không có yêu cầu nào đang chờ duyệt.</p>
                  </div>
                ) : (
                  <div className="bm-action-list">
                    {viecCanXuLy.map(ycn => (
                      <div 
                        key={ycn.MaYeuCauNghi} 
                        className="bm-action-item"
                        onClick={() => setActiveTab && setActiveTab('duyetyeucau')}
                      >
                        <div className="bm-action-left">
                          <span className={`bm-action-type-pill ${ycn.LoaiYeuCau}`}>
                            {ycn.LoaiYeuCau === 'LEAVE' ? 'Báo nghỉ' : ycn.LoaiYeuCau === 'SWAP' ? 'Đổi ca' : 'Dạy thay'}
                          </span>
                          <div className="bm-action-info">
                            <span className="bm-action-gv"><strong>{ycn.TenGiangVienGui}</strong> - {ycn.TenMonHoc}</span>
                            <span className="bm-action-time">Ngày: {ycn.NgayHoc} ({ycn.TenTiet}) • Gửi: {ycn.ThoiGianGui}</span>
                          </div>
                        </div>
                        <ChevronRight size={15} color="#94a3b8" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Tỷ lệ biến động lịch */}
              <div className="bm-section-card">
                <div className="bm-section-head">
                  <div className="bm-section-title-wrap">
                    <Layers size={18} className="bm-section-icon icon-emerald" />
                    <div>
                      <h2 className="bm-section-title">Cơ Cấu Biến Động Lịch</h2>
                      <p className="bm-section-desc">Tổng cộng {data.bienDong?.TongBuoi || 0} buổi học trong kỳ</p>
                    </div>
                  </div>
                </div>

                {variationChartData ? (
                  <div className="bm-doughnut-wrap">
                    <div style={{ width: 140, height: 140 }}>
                      <Doughnut
                        data={variationChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          cutout: '70%',
                          plugins: {
                            legend: { display: false }
                          }
                        }}
                      />
                    </div>
                    <div className="bm-doughnut-legend">
                      <div className="bm-legend-row">
                        <span className="bm-dot dot-emerald" />
                        <span className="bm-lgd-label">Bình thường:</span>
                        <strong>{data.bienDong?.SoBuoiBinhThuong || 0}</strong>
                      </div>
                      <div className="bm-legend-row">
                        <span className="bm-dot dot-rose" />
                        <span className="bm-lgd-label">Báo nghỉ:</span>
                        <strong>{data.bienDong?.SoBuoiNghi || 0}</strong>
                      </div>
                      <div className="bm-legend-row">
                        <span className="bm-dot dot-amber" />
                        <span className="bm-lgd-label">Đổi ca:</span>
                        <strong>{data.bienDong?.SoBuoiDoiCa || 0}</strong>
                      </div>
                      <div className="bm-legend-row">
                        <span className="bm-dot dot-purple" />
                        <span className="bm-lgd-label">Dạy thay:</span>
                        <strong>{data.bienDong?.SoBuoiDayThay || 0}</strong>
                      </div>
                      <div className="bm-legend-row">
                        <span className="bm-dot dot-cyan" />
                        <span className="bm-lgd-label">Dạy bù:</span>
                        <strong>{data.bienDong?.SoBuoiDayBu || 0}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bm-empty-placeholder">
                    <p>Chưa có dữ liệu biến động lịch.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
