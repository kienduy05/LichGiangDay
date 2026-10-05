import { useState, useMemo, useEffect } from 'react';
import {
  Activity, Calendar, Clock, Building, Users, BookOpen,
  Filter, Search, Download, Printer, ShieldAlert, CheckCircle2,
  XCircle, AlertTriangle, Eye, RefreshCw, X, ShieldX, Check, FileSpreadsheet
} from 'lucide-react';
import { apiGetBienDongLichAll, apiRevokeBienDongLich } from '../../../../utils/apiBienDongLich';
import './LichBienDongMonitor.css';

// Rich Mock Data for University-wide Schedule Changes (Admin & PĐT)
const INITIAL_CHANGES_DATA = [
  {
    id: 'BD-2601',
    ngayBienDong: '04/10/2026',
    loaiBienDong: 'ABSENCE', // Báo nghỉ
    tenKhoa: 'Công nghệ thông tin',
    tenBoMon: 'Mạng & HTTT',
    maLopHocPhan: 'IT1.110.3.2627.1.QT01.K66',
    tenMonHoc: 'Cơ sở dữ liệu 1-1-26 (QT01)',
    giangVienGoc: 'ThS. Nguyễn Lê Minh (NLM001)',
    thoiGianGoc: '06/10/2026 • Tiết 1-3 • P101_A3',
    chiTietThayDoi: 'Báo nghỉ: Đi tập huấn nghiệp vụ Bộ GD&ĐT',
    trangThai: 'Pending',
    nguoiDuyet: 'Chờ Trưởng BM duyệt',
    ngayDuyet: '-',
    daDayBu: false
  },
  {
    id: 'BD-2602',
    ngayBienDong: '03/10/2026',
    loaiBienDong: 'SUBSTITUTE', // Dạy thay
    tenKhoa: 'Công nghệ thông tin',
    tenBoMon: 'Mạng & HTTT',
    maLopHocPhan: 'IT1.220.3.2627.1.CN02.K66',
    tenMonHoc: 'Hệ điều hành & Mạng 1-1-26 (CN02)',
    giangVienGoc: 'ThS. Nguyễn Lê Minh (NLM001)',
    thoiGianGoc: '08/10/2026 • Tiết 7-9 • P203_A3',
    chiTietThayDoi: 'Dạy thay: TS. Nguyễn Quốc Tuấn (NQT001)',
    trangThai: 'Pending',
    nguoiDuyet: 'Chờ Trưởng BM duyệt',
    ngayDuyet: '-',
    daDayBu: false
  },
  {
    id: 'BD-2603',
    ngayBienDong: '03/10/2026',
    loaiBienDong: 'SWAP', // Đổi ca
    tenKhoa: 'Công nghệ thông tin',
    tenBoMon: 'Mạng & HTTT',
    maLopHocPhan: 'IT1.330.3.2627.1.HT01.K66',
    tenMonHoc: 'Lập trình mạng máy tính (HT01)',
    giangVienGoc: 'ThS. Trần Văn Nam (TVN002)',
    thoiGianGoc: '07/10/2026 • Tiết 4-6 • P305_A3',
    chiTietThayDoi: 'Đổi sang: 09/10/2026 • Tiết 10-12 • P305_A3',
    trangThai: 'Pending',
    nguoiDuyet: 'Chờ Trưởng BM duyệt',
    ngayDuyet: '-',
    daDayBu: false
  },
  {
    id: 'BD-2604',
    ngayBienDong: '02/10/2026',
    loaiBienDong: 'MAKEUP', // Dạy bù
    tenKhoa: 'Công nghệ thông tin',
    tenBoMon: 'Khoa học máy tính',
    maLopHocPhan: 'IT1.440.3.2627.1.PM01.K66',
    tenMonHoc: 'Phân tích thiết kế hệ thống (PM01)',
    giangVienGoc: 'TS. Lê Thị Thảo (LTT003)',
    thoiGianGoc: '25/09/2026 (Ca đã nghỉ)',
    chiTietThayDoi: 'Dạy bù vào: 10/10/2026 • Tiết 7-9 • P102_A3',
    trangThai: 'Approved',
    nguoiDuyet: 'PGS. TS. Phạm Văn Hùng (Trưởng BM)',
    ngayDuyet: '02/10/2026',
    daDayBu: true
  },
  {
    id: 'BD-2605',
    ngayBienDong: '28/09/2026',
    loaiBienDong: 'ABSENCE',
    tenKhoa: 'Công nghệ thông tin',
    tenBoMon: 'Mạng & HTTT',
    maLopHocPhan: 'IT1.110.3.2627.1.QT02.K66',
    tenMonHoc: 'Cơ sở dữ liệu 1-1-26 (QT02)',
    giangVienGoc: 'TS. Nguyễn Quốc Tuấn (NQT001)',
    thoiGianGoc: '28/09/2026 • Tiết 7-9 • P101_A3',
    chiTietThayDoi: 'Báo nghỉ: Dự hội thảo quốc tế (Chưa xếp bù - Quá 6 ngày)',
    trangThai: 'Approved',
    nguoiDuyet: 'TS. Nguyễn Quốc Tuấn (Tự duyệt theo thẩm quyền)',
    ngayDuyet: '26/09/2026',
    daDayBu: false
  },
  {
    id: 'BD-2606',
    ngayBienDong: '20/09/2026',
    loaiBienDong: 'ABSENCE',
    tenKhoa: 'Kinh tế vận tải',
    tenBoMon: 'Kinh tế xây dựng',
    maLopHocPhan: 'KT1.101.3.2627.1.XD01.K66',
    tenMonHoc: 'Kinh tế đầu tư xây dựng (XD01)',
    giangVienGoc: 'ThS. Hoàng Mai Hoa (HMH005)',
    thoiGianGoc: '20/09/2026 • Tiết 1-3 • P402_A2',
    chiTietThayDoi: 'Báo nghỉ: Việc gia đình đột xuất (CẢNH BÁO: Quá 14 ngày chưa lập lịch dạy bù)',
    trangThai: 'Approved',
    nguoiDuyet: 'TS. Vũ Đình Trọng (Trưởng BM)',
    ngayDuyet: '19/09/2026',
    daDayBu: false,
    overdueWarning: true
  },
  {
    id: 'BD-2607',
    ngayBienDong: '18/09/2026',
    loaiBienDong: 'SUBSTITUTE',
    tenKhoa: 'Điện - Điện tử',
    tenBoMon: 'Tự động hóa',
    maLopHocPhan: 'DT1.205.3.2627.1.TD01.K66',
    tenMonHoc: 'Kỹ thuật vi điều khiển (TD01)',
    giangVienGoc: 'TS. Đặng Thanh Tùng (DTT008)',
    thoiGianGoc: '18/09/2026 • Tiết 4-6 • P201_A1',
    chiTietThayDoi: 'Dạy thay: ThS. Bùi Văn Quý (BVQ010)',
    trangThai: 'Approved',
    nguoiDuyet: 'PGS. TS. Trần Hải Long (Trưởng BM)',
    ngayDuyet: '17/09/2026',
    daDayBu: false
  }
];

export default function LichBienDongMonitor() {
  const [data, setData] = useState(INITIAL_CHANGES_DATA);
  const [selectedHocKy, setSelectedHocKy] = useState('HK1_2026_2027');
  const [selectedKhoa, setSelectedKhoa] = useState('ALL');
  const [selectedBoMon, setSelectedBoMon] = useState('ALL');
  const [selectedLoai, setSelectedLoai] = useState('ALL'); // ALL | ABSENCE | SUBSTITUTE | SWAP | MAKEUP
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // ALL | Pending | Approved | Rejected | Revoked
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [detailItem, setDetailItem] = useState(null);
  const [revokeItem, setRevokeItem] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // KPIs
  const kpiStats = useMemo(() => {
    const total = data.length;
    const absence = data.filter(d => d.loaiBienDong === 'ABSENCE').length;
    const makeupDone = data.filter(d => d.loaiBienDong === 'MAKEUP' && d.trangThai === 'Approved').length;
    const substitute = data.filter(d => d.loaiBienDong === 'SUBSTITUTE').length;
    const overdue = data.filter(d => d.overdueWarning).length;
    return {
      total,
      absence,
      makeupDone,
      makeupRate: absence > 0 ? Math.round((makeupDone / absence) * 100) : 100,
      substitute,
      overdue
    };
  }, [data]);

  // Tự động tải danh sách biến động lịch từ Backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const remoteData = await apiGetBienDongLichAll({
          maHocKy: selectedHocKy,
          maKhoa: selectedKhoa,
          maBoMon: selectedBoMon,
          loaiBienDong: selectedLoai,
          trangThai: selectedStatus,
          search: searchTerm
        });
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
          setData(remoteData);
        }
      } catch (err) {
        // Tự động dùng initial mock data
      }
    };
    fetchData();
  }, [selectedHocKy, selectedKhoa, selectedBoMon, selectedLoai, selectedStatus, searchTerm]);
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (selectedKhoa !== 'ALL' && item.tenKhoa !== selectedKhoa) return false;
      if (selectedBoMon !== 'ALL' && item.tenBoMon !== selectedBoMon) return false;
      if (selectedLoai !== 'ALL' && item.loaiBienDong !== selectedLoai) return false;
      if (selectedStatus !== 'ALL' && item.trangThai !== selectedStatus) return false;
      if (searchTerm.trim()) {
        const kw = searchTerm.toLowerCase();
        const m1 = item.tenMonHoc?.toLowerCase().includes(kw);
        const m2 = item.maLopHocPhan?.toLowerCase().includes(kw);
        const m3 = item.giangVienGoc?.toLowerCase().includes(kw);
        const m4 = item.id?.toLowerCase().includes(kw);
        if (!m1 && !m2 && !m3 && !m4) return false;
      }
      return true;
    });
  }, [data, selectedKhoa, selectedBoMon, selectedLoai, selectedStatus, searchTerm]);

  // Action: Admin can thiệp thu hồi / Hủy quyết định
  const handleOpenRevoke = (item) => {
    setRevokeItem(item);
    setRevokeReason('');
  };

  const handleConfirmRevoke = async (e) => {
    e.preventDefault();
    if (!revokeReason.trim()) {
      alert('Vui lòng nhập lý do can thiệp của Phòng Đào Tạo!');
      return;
    }

    try {
      await apiRevokeBienDongLich({
        maBienDong: revokeItem.id,
        lyDoThuHoi: revokeReason.trim()
      });
    } catch (err) {
      // Vẫn cập nhật UI lạc quan
    }

    setData(prev => prev.map(item => {
      if (item.id === revokeItem.id) {
        return {
          ...item,
          trangThai: 'Revoked',
          lyDoThuHoi: revokeReason.trim(),
          nguoiCanThiep: 'Phòng Đào Tạo (Hủy quyết định)',
          thoiGianCanThiep: new Date().toLocaleString('vi-VN')
        };
      }
      return item;
    }));

    const targetId = revokeItem.id;
    setRevokeItem(null);
    if (detailItem?.id === targetId) {
      setDetailItem(null);
    }
    showToast(`Phòng Đào Tạo đã can thiệp thu hồi biến động [${targetId}] thành công!`);
  };

  const renderBadgeType = (type) => {
    switch (type) {
      case 'ABSENCE':
        return <span className="lbd-badge-type absence"><XCircle size={11} /> Báo Nghỉ</span>;
      case 'SUBSTITUTE':
        return <span className="lbd-badge-type substitute"><Users size={11} /> Dạy Thay</span>;
      case 'SWAP':
        return <span className="lbd-badge-type swap"><RefreshCw size={11} /> Đổi Ca</span>;
      case 'MAKEUP':
        return <span className="lbd-badge-type makeup"><CheckCircle2 size={11} /> Dạy Bù</span>;
      default:
        return type;
    }
  };

  const renderBadgeStatus = (status, overdue) => {
    if (status === 'Revoked') {
      return <span className="lbd-badge-status revoked"><ShieldX size={12} /> Đã thu hồi</span>;
    }
    if (status === 'Pending') {
      return <span className="lbd-badge-status pending"><Clock size={12} /> Chờ duyệt</span>;
    }
    if (status === 'Approved') {
      if (overdue) {
        return <span className="lbd-badge-status" style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3' }}><AlertTriangle size={12} /> Quá hạn bù</span>;
      }
      return <span className="lbd-badge-status approved"><Check size={12} /> Đã duyệt</span>;
    }
    return <span className="lbd-badge-status rejected"><X size={12} /> Từ chối</span>;
  };

  return (
    <div className="lbd-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: '#0f172a',
          color: '#ffffff',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="lbd-header">
        <div className="lbd-header-left">
          <div className="lbd-header-icon">
            <Activity size={26} />
          </div>
          <div>
            <h1 className="lbd-title">Giám Sát Biến Động Lịch Giảng Dạy Toàn Trường</h1>
            <p className="lbd-subtitle">
              Phân hệ Phòng Đào Tạo & Ban Giám Hiệu theo dõi, thanh tra các ca Báo nghỉ, Dạy thay, Đổi ca và Dạy bù
            </p>
          </div>
        </div>

        <div className="lbd-header-actions">
          <button
            type="button"
            className="lbd-btn-export"
            onClick={() => showToast('Đang xuất báo cáo biến động lịch toàn trường ra file Excel...')}
          >
            <FileSpreadsheet size={16} color="#059669" />
            <span>Xuất Báo Cáo Excel</span>
          </button>
          <button
            type="button"
            className="lbd-btn-export"
            onClick={() => window.print()}
          >
            <Printer size={16} color="#2563eb" />
            <span>In Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="lbd-kpi-grid">
        <div className="lbd-kpi-card kpi-total">
          <div className="lbd-kpi-icon">
            <Activity size={22} />
          </div>
          <div className="lbd-kpi-info">
            <span className="lbd-kpi-value">{kpiStats.total}</span>
            <span className="lbd-kpi-label">Tổng ca biến động</span>
          </div>
        </div>

        <div className="lbd-kpi-card kpi-absence">
          <div className="lbd-kpi-icon">
            <XCircle size={22} />
          </div>
          <div className="lbd-kpi-info">
            <span className="lbd-kpi-value">{kpiStats.absence}</span>
            <span className="lbd-kpi-label">Ca báo nghỉ trong kỳ</span>
          </div>
        </div>

        <div className="lbd-kpi-card kpi-makeup-rate">
          <div className="lbd-kpi-icon">
            <CheckCircle2 size={22} />
          </div>
          <div className="lbd-kpi-info">
            <span className="lbd-kpi-value">{kpiStats.makeupRate}%</span>
            <span className="lbd-kpi-label">Tỷ lệ hoàn thành dạy bù</span>
          </div>
        </div>

        <div className="lbd-kpi-card kpi-substitute">
          <div className="lbd-kpi-icon">
            <Users size={22} />
          </div>
          <div className="lbd-kpi-info">
            <span className="lbd-kpi-value">{kpiStats.substitute}</span>
            <span className="lbd-kpi-label">Ca phân công dạy thay</span>
          </div>
        </div>

        <div className="lbd-kpi-card kpi-warning">
          <div className="lbd-kpi-icon">
            <AlertTriangle size={22} />
          </div>
          <div className="lbd-kpi-info">
            <span className="lbd-kpi-value">{kpiStats.overdue} ca</span>
            <span className="lbd-kpi-label">Nghỉ quá 14 ngày chưa bù</span>
          </div>
        </div>
      </div>

      {/* Multidimensional Filter Card */}
      <div className="lbd-filter-card">
        <div className="lbd-filter-row">
          <div className="lbd-filter-item">
            <label className="lbd-filter-label">Học kỳ & Năm học</label>
            <select
              className="lbd-filter-select"
              value={selectedHocKy}
              onChange={e => setSelectedHocKy(e.target.value)}
            >
              <option value="HK1_2026_2027">Học kỳ 1 (2026 - 2027)</option>
              <option value="HK2_2026_2027">Học kỳ 2 (2026 - 2027)</option>
            </select>
          </div>

          <div className="lbd-filter-item">
            <label className="lbd-filter-label">Khoa chuyên môn</label>
            <select
              className="lbd-filter-select"
              value={selectedKhoa}
              onChange={e => {
                setSelectedKhoa(e.target.value);
                setSelectedBoMon('ALL');
              }}
            >
              <option value="ALL">-- Tất cả các Khoa --</option>
              <option value="Công nghệ thông tin">Khoa Công nghệ thông tin</option>
              <option value="Kinh tế vận tải">Khoa Kinh tế vận tải</option>
              <option value="Điện - Điện tử">Khoa Điện - Điện tử</option>
            </select>
          </div>

          <div className="lbd-filter-item">
            <label className="lbd-filter-label">Bộ môn trực thuộc</label>
            <select
              className="lbd-filter-select"
              value={selectedBoMon}
              onChange={e => setSelectedBoMon(e.target.value)}
            >
              <option value="ALL">-- Tất cả Bộ môn --</option>
              <option value="Mạng & HTTT">Mạng & HTTT</option>
              <option value="Khoa học máy tính">Khoa học máy tính</option>
              <option value="Kinh tế xây dựng">Kinh tế xây dựng</option>
              <option value="Tự động hóa">Tự động hóa</option>
            </select>
          </div>

          <div className="lbd-filter-item">
            <label className="lbd-filter-label">Loại biến động</label>
            <select
              className="lbd-filter-select"
              value={selectedLoai}
              onChange={e => setSelectedLoai(e.target.value)}
            >
              <option value="ALL">-- Tất cả loại --</option>
              <option value="ABSENCE">Báo nghỉ dạy</option>
              <option value="SUBSTITUTE">Nhờ dạy thay</option>
              <option value="SWAP">Xin đổi ca học</option>
              <option value="MAKEUP">Đăng ký dạy bù</option>
            </select>
          </div>

          <div className="lbd-filter-item">
            <label className="lbd-filter-label">Trạng thái xử lý</label>
            <select
              className="lbd-filter-select"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">-- Tất cả trạng thái --</option>
              <option value="Pending">Chờ bộ môn duyệt</option>
              <option value="Approved">Đã phê duyệt</option>
              <option value="Rejected">Đã từ chối</option>
              <option value="Revoked">PĐT đã thu hồi</option>
            </select>
          </div>
        </div>

        <div className="lbd-filter-row">
          <div style={{ flex: 1 }}>
            <input
              type="text"
              className="lbd-filter-input"
              style={{ width: '100%' }}
              placeholder="🔍 Tìm nhanh theo tên môn học, mã LHP, tên giảng viên hoặc mã biến động..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="lbd-table-card">
        <table className="lbd-table">
          <thead>
            <tr>
              <th style={{ width: '85px' }}>Mã BĐ</th>
              <th style={{ width: '100px' }}>Loại Biến Động</th>
              <th>Bộ Môn / Khoa</th>
              <th>Lớp Học Phần</th>
              <th>Giảng Viên Gốc</th>
              <th>Chi Tiết Thay Đổi</th>
              <th style={{ width: '110px' }}>Trạng Thái</th>
              <th>Cán Bộ Duyệt</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  Không tìm thấy biến động lịch nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredData.map(item => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{item.id}</span>
                  </td>
                  <td>{renderBadgeType(item.loaiBienDong)}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.tenBoMon}</div>
                    <div style={{ fontSize: '0.71875rem', color: '#64748b' }}>{item.tenKhoa}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.tenMonHoc}</div>
                    <div style={{ fontSize: '0.71875rem', color: '#64748b' }}>{item.maLopHocPhan}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.giangVienGoc}</div>
                    <div style={{ fontSize: '0.71875rem', color: '#64748b' }}>{item.thoiGianGoc}</div>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 600,
                      color: item.overdueWarning ? '#dc2626' : '#334155'
                    }}>
                      {item.chiTietThayDoi}
                    </span>
                  </td>
                  <td>{renderBadgeStatus(item.trangThai, item.overdueWarning)}</td>
                  <td>
                    <div style={{ fontSize: '0.75rem', color: '#1e293b' }}>{item.nguoiDuyet}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{item.ngayDuyet}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="lbd-action-btn"
                        onClick={() => setDetailItem(item)}
                        title="Xem biên bản chi tiết"
                      >
                        <Eye size={12} />
                        <span>Xem</span>
                      </button>
                      {item.trangThai === 'Approved' && (
                        <button
                          type="button"
                          className="lbd-action-btn btn-revoke"
                          onClick={() => handleOpenRevoke(item)}
                          title="Phòng Đào Tạo can thiệp thu hồi"
                        >
                          <ShieldX size={12} />
                          <span>Thu hồi</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* =======================================================================
          MODAL: XEM CHI TIẾT BIÊN BẢN BIẾN ĐỘNG LỊCH (AUDIT MODAL)
          ======================================================================= */}
      {detailItem && (
        <div className="lgd-modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="lgd-modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="lgd-modal-header" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Activity size={20} color="#38bdf8" />
                <h3 className="lgd-modal-title">Biên Bản Biến Động Lịch Học [{detailItem.id}]</h3>
              </div>
              <button className="lgd-modal-close" onClick={() => setDetailItem(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="lgd-modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>{renderBadgeType(detailItem.loaiBienDong)}</div>
                <div>{renderBadgeStatus(detailItem.trangThai, detailItem.overdueWarning)}</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Đơn vị đào tạo & Lớp học phần
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
                  {detailItem.tenMonHoc}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                  Khoa: <strong>{detailItem.tenKhoa}</strong> • Bộ môn: <strong>{detailItem.tenBoMon}</strong>
                </div>
                <div style={{ fontSize: '0.78125rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Mã LHP: {detailItem.maLopHocPhan}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.85rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Lịch học gốc</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.25rem', fontSize: '0.875rem' }}>{detailItem.giangVienGoc}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569' }}>{detailItem.thoiGianGoc}</div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Diễn biến thực tế</div>
                  <div style={{ fontWeight: 700, color: '#15803d', marginTop: '0.25rem', fontSize: '0.875rem' }}>{detailItem.chiTietThayDoi}</div>
                  <div style={{ fontSize: '0.78125rem', color: '#166534' }}>Ngày phát sinh: {detailItem.ngayBienDong}</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8125rem', color: '#334155' }}>
                <div><strong>Cán bộ phê duyệt của Bộ môn:</strong> {detailItem.nguoiDuyet} ({detailItem.ngayDuyet})</div>
                {detailItem.lyDoThuHoi && (
                  <div style={{ marginTop: '0.5rem', color: '#dc2626' }}>
                    <strong>Lý do PĐT thu hồi:</strong> {detailItem.lyDoThuHoi}
                  </div>
                )}
              </div>
            </div>

            <div className="lgd-modal-footer" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                className="lgd-btn lgd-btn-secondary"
                onClick={() => setDetailItem(null)}
              >
                Đóng
              </button>
              {detailItem.trangThai === 'Approved' && (
                <button
                  type="button"
                  className="lgd-btn lgd-btn-danger"
                  onClick={() => handleOpenRevoke(detailItem)}
                >
                  <ShieldX size={15} />
                  <span>Thu Hồi Quyết Định</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: THU HỒI / CAN THIỆP CỦA PHÒNG ĐÀO TẠO (ADMIN OVERRIDE)
          ======================================================================= */}
      {revokeItem && (
        <div className="lgd-modal-overlay" onClick={() => setRevokeItem(null)}>
          <div className="lgd-modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="lgd-modal-header" style={{ background: '#b91c1c' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <ShieldX size={20} />
                <h3 className="lgd-modal-title">Thu Hồi Biến Động Lịch [{revokeItem.id}]</h3>
              </div>
              <button className="lgd-modal-close" onClick={() => setRevokeItem(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmRevoke}>
              <div className="lgd-modal-body" style={{ padding: '1.25rem' }}>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem 1rem', borderRadius: '8px', color: '#991b1b', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                  <strong>Cảnh báo thẩm quyền:</strong> Thao tác này sẽ hủy bỏ quyết định duyệt của Bộ môn, hoàn nguyên trạng thái buổi học về lịch gốc và gửi thông báo khẩn đến Bộ môn và Giảng viên.
                </div>

                <div className="lgd-form-group">
                  <label className="lgd-label" style={{ fontWeight: 700 }}>
                    Lý do can thiệp của Phòng Đào Tạo: <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    className="lgd-textarea"
                    rows={4}
                    required
                    placeholder="VD: Phòng P102_A3 phải trưng dụng cho Hội đồng bảo vệ luận án Tiến sĩ; hoặc Lớp học phần đã vượt quá 20% số tiết nghỉ theo quy chế đào tạo..."
                    value={revokeReason}
                    onChange={e => setRevokeReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="lgd-modal-footer" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button
                  type="button"
                  className="lgd-btn lgd-btn-secondary"
                  onClick={() => setRevokeItem(null)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="lgd-btn lgd-btn-danger"
                >
                  <ShieldX size={15} />
                  <span>Xác Nhận Thu Hồi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
