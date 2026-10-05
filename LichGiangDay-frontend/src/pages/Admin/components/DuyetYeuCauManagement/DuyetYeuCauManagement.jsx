import { useState, useMemo, useEffect } from 'react';
import {
  ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, Clock,
  Calendar, Building, User, Users, BookOpen, Search, Filter,
  ArrowRight, ShieldAlert, Check, X, RefreshCw, Send, FileText
} from 'lucide-react';
import { apiGetYeuCauNghiByBoMon, apiDuyetYeuCauNghi } from '../../../../utils/apiBienDongLich';
import './DuyetYeuCauManagement.css';

// Initial Mock Requests Data (Bộ môn Mạng & Các hệ thống thông tin)
const INITIAL_REQUESTS = [
  {
    id: 'YCN-001',
    loaiYeuCau: 'ABSENCE', // Báo nghỉ
    maGiangVien: 'NLM001',
    tenGiangVien: 'ThS. Nguyễn Lê Minh',
    maLopHocPhan: 'IT1.110.3.2627.1.QT01.K66',
    tenMonHoc: 'Cơ sở dữ liệu 1-1-26 (QT01)',
    ngayGoc: '2026-10-06',
    tietGoc: 'Tiết 1 - 3 (Sáng)',
    phongGoc: 'P101_A3',
    lyDo: 'Tham gia tập huấn chuyên môn nghiệp vụ tại Bộ GD&ĐT',
    thoiGianGui: '04/10/2026 08:30',
    trangThai: 'Pending', // Pending | Approved | Rejected
    lyDoTuChoi: '',
    minhChung: 'Giay_trieu_tap_tap_huan.pdf'
  },
  {
    id: 'YCN-002',
    loaiYeuCau: 'SUBSTITUTE', // Nhờ dạy thay
    maGiangVien: 'NLM001',
    tenGiangVien: 'ThS. Nguyễn Lê Minh',
    maGiangVienThay: 'NQT001',
    tenGiangVienThay: 'TS. Nguyễn Quốc Tuấn',
    maLopHocPhan: 'IT1.220.3.2627.1.CN02.K66',
    tenMonHoc: 'Hệ điều hành & Mạng 1-1-26 (CN02)',
    ngayGoc: '2026-10-08',
    tietGoc: 'Tiết 7 - 9 (Chiều)',
    phongGoc: 'P203_A3',
    lyDo: 'Trùng lịch chấm bảo vệ khóa luận tốt nghiệp đợt 1',
    thoiGianGui: '03/10/2026 14:15',
    trangThai: 'Pending',
    lyDoTuChoi: '',
    conflictCheck: { safe: true, message: 'TS. Nguyễn Quốc Tuấn không có lịch dạy vào Chiều Thứ 5. Khả dụng dạy thay!' }
  },
  {
    id: 'YCN-003',
    loaiYeuCau: 'SWAP', // Đổi ca
    maGiangVien: 'TVN002',
    tenGiangVien: 'ThS. Trần Văn Nam',
    maLopHocPhan: 'IT1.330.3.2627.1.HT01.K66',
    tenMonHoc: 'Lập trình mạng máy tính (HT01)',
    ngayGoc: '2026-10-07',
    tietGoc: 'Tiết 4 - 6 (Sáng)',
    phongGoc: 'P305_A3',
    ngayDeXuat: '2026-10-09',
    tietDeXuat: 'Tiết 10 - 12 (Chiều)',
    phongDeXuat: 'P305_A3',
    lyDo: 'Lớp sinh viên có lịch thi học phần giáo dục thể chất sáng Thứ 4',
    thoiGianGui: '03/10/2026 10:20',
    trangThai: 'Pending',
    lyDoTuChoi: '',
    conflictCheck: { safe: true, message: 'Phòng P305_A3 và giảng viên đều trống vào Chiều Thứ 6!' }
  },
  {
    id: 'YCN-004',
    loaiYeuCau: 'MAKEUP', // Đăng ký dạy bù
    maGiangVien: 'LTT003',
    tenGiangVien: 'TS. Lê Thị Thảo',
    maLopHocPhan: 'IT1.440.3.2627.1.PM01.K66',
    tenMonHoc: 'Phân tích thiết kế hệ thống (PM01)',
    ngayGoc: '2026-09-25 (Đã nghỉ)',
    tietGoc: 'Tiết 1 - 3 (Sáng)',
    phongGoc: 'P102_A3',
    ngayDeXuat: '2026-10-10',
    tietDeXuat: 'Tiết 7 - 9 (Chiều Thứ 7)',
    phongDeXuat: 'P102_A3',
    lyDo: 'Dạy bù cho ca báo nghỉ ốm ngày 25/09/2026 đã được duyệt',
    thoiGianGui: '02/10/2026 16:45',
    trangThai: 'Pending',
    lyDoTuChoi: '',
    conflictCheck: { safe: true, message: 'Phòng P102_A3 khả dụng vào Thứ 7!' }
  },
  {
    id: 'YCN-005',
    loaiYeuCau: 'ABSENCE',
    maGiangVien: 'NQT001',
    tenGiangVien: 'TS. Nguyễn Quốc Tuấn',
    maLopHocPhan: 'IT1.110.3.2627.1.QT02.K66',
    tenMonHoc: 'Cơ sở dữ liệu 1-1-26 (QT02)',
    ngayGoc: '2026-09-28',
    tietGoc: 'Tiết 7 - 9 (Chiều)',
    phongGoc: 'P101_A3',
    lyDo: 'Đi công tác dự hội thảo chuyên đề quốc tế',
    thoiGianGui: '26/09/2026 09:00',
    trangThai: 'Approved',
    nguoiDuyet: 'TS. Nguyễn Quốc Tuấn (Trưởng BM)',
    thoiGianDuyet: '26/09/2026 11:00',
    lyDoTuChoi: ''
  }
];

export default function DuyetYeuCauManagement() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | ABSENCE | SUBSTITUTE | SWAP | MAKEUP
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | Pending | Approved | Rejected
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [inspectItem, setInspectItem] = useState(null);
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // KPIs
  const kpiData = useMemo(() => {
    const pending = requests.filter(r => r.trangThai === 'Pending').length;
    const approved = requests.filter(r => r.trangThai === 'Approved').length;
    const absence = requests.filter(r => r.loaiYeuCau === 'ABSENCE').length;
    const substitute = requests.filter(r => r.loaiYeuCau === 'SUBSTITUTE').length;
    return { pending, approved, absence, substitute };
  }, [requests]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      ALL: requests.length,
      ABSENCE: requests.filter(r => r.loaiYeuCau === 'ABSENCE').length,
      SUBSTITUTE: requests.filter(r => r.loaiYeuCau === 'SUBSTITUTE').length,
      SWAP: requests.filter(r => r.loaiYeuCau === 'SWAP').length,
      MAKEUP: requests.filter(r => r.loaiYeuCau === 'MAKEUP').length,
    };
  }, [requests]);

  // Tự động tải dữ liệu từ Backend API (kèm fallback nếu backend chưa chạy API này)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const remoteData = await apiGetYeuCauNghiByBoMon({
          loaiYeuCau: activeTab,
          trangThai: statusFilter,
          search: searchTerm
        });
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
          setRequests(remoteData);
        }
      } catch (err) {
        // Tự động dùng initial mock data
      }
    };
    fetchData();
  }, [activeTab, statusFilter, searchTerm]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter(item => {
      // Tab filter
      if (activeTab !== 'ALL' && item.loaiYeuCau !== activeTab) return false;
      // Status filter
      if (statusFilter !== 'ALL' && item.trangThai !== statusFilter) return false;
      // Search
      if (searchTerm.trim()) {
        const kw = searchTerm.toLowerCase();
        const matchName = item.tenGiangVien?.toLowerCase().includes(kw);
        const matchClass = item.tenMonHoc?.toLowerCase().includes(kw) || item.maLopHocPhan?.toLowerCase().includes(kw);
        const matchThay = item.tenGiangVienThay?.toLowerCase().includes(kw);
        if (!matchName && !matchClass && !matchThay) return false;
      }
      return true;
    });
  }, [requests, activeTab, statusFilter, searchTerm]);

  // Approve action
  const handleApprove = async (item) => {
    try {
      await apiDuyetYeuCauNghi({ maYeuCauNghi: item.id, trangThai: 'Approved' });
    } catch (err) {
      // Vẫn cập nhật UI lạc quan (Optimistic update)
    }

    setRequests(prev => prev.map(r => {
      if (r.id === item.id) {
        return {
          ...r,
          trangThai: 'Approved',
          nguoiDuyet: 'Trưởng Bộ Môn (Đã duyệt)',
          thoiGianDuyet: new Date().toLocaleString('vi-VN')
        };
      }
      return r;
    }));
    if (inspectItem?.id === item.id) {
      setInspectItem(null);
    }
    showToast(`Đã chấp thuận yêu cầu [${item.id}] của ${item.tenGiangVien} thành công!`);
  };

  // Reject action
  const handleOpenReject = (item) => {
    setRejectItem(item);
    setRejectReason('');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối để thông báo cho giảng viên!');
      return;
    }

    try {
      await apiDuyetYeuCauNghi({
        maYeuCauNghi: rejectItem.id,
        trangThai: 'Rejected',
        lyDoTuChoi: rejectReason.trim()
      });
    } catch (err) {
      // Vẫn cập nhật UI lạc quan
    }

    setRequests(prev => prev.map(r => {
      if (r.id === rejectItem.id) {
        return {
          ...r,
          trangThai: 'Rejected',
          lyDoTuChoi: rejectReason.trim(),
          nguoiDuyet: 'Trưởng Bộ Môn (Từ chối)',
          thoiGianDuyet: new Date().toLocaleString('vi-VN')
        };
      }
      return r;
    }));
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối để thông báo cho giảng viên!');
      return;
    }

    setRequests(prev => prev.map(r => {
      if (r.id === rejectItem.id) {
        return {
          ...r,
          trangThai: 'Rejected',
          lyDoTuChoi: rejectReason.trim(),
          nguoiDuyet: 'Trưởng Bộ Môn (Từ chối)',
          thoiGianDuyet: new Date().toLocaleString('vi-VN')
        };
      }
      return r;
    }));

    const targetId = rejectItem.id;
    setRejectItem(null);
    if (inspectItem?.id === targetId) {
      setInspectItem(null);
    }
    showToast(`Đã từ chối yêu cầu [${targetId}]. Phản hồi đã được gửi đến giảng viên.`);
  };

  const renderTypeBadge = (type) => {
    switch (type) {
      case 'ABSENCE':
        return <span className="badge-type type-absence"><XCircle size={12} /> Báo Nghỉ</span>;
      case 'SUBSTITUTE':
        return <span className="badge-type type-substitute"><Users size={12} /> Dạy Thay</span>;
      case 'SWAP':
        return <span className="badge-type type-swap"><RefreshCw size={12} /> Đổi Ca</span>;
      case 'MAKEUP':
        return <span className="badge-type type-makeup"><CheckCircle2 size={12} /> Dạy Bù</span>;
      default:
        return type;
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="badge-status status-pending"><Clock size={12} /> Chờ duyệt</span>;
      case 'Approved':
        return <span className="badge-status status-approved"><Check size={12} /> Đã chấp thuận</span>;
      case 'Rejected':
        return <span className="badge-status status-rejected"><X size={12} /> Đã từ chối</span>;
      default:
        return status;
    }
  };

  return (
    <div className="dyc-container">
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

      {/* Top Header */}
      <div className="dyc-header">
        <div className="dyc-header-left">
          <div className="dyc-header-icon">
            <ClipboardCheck size={26} />
          </div>
          <div>
            <h1 className="dyc-title">Phê Duyệt Yêu Cầu Giảng Dạy Bộ Môn</h1>
            <p className="dyc-subtitle">
              Duyệt các đề xuất Báo nghỉ, Nhờ dạy thay, Xin đổi ca và Đăng ký dạy bù của giảng viên trực thuộc Bộ môn
            </p>
          </div>
        </div>

        <div className="dyc-header-actions">
          <span style={{
            fontSize: '0.8125rem',
            background: '#eff6ff',
            color: '#1d4ed8',
            padding: '0.4rem 0.85rem',
            borderRadius: '8px',
            fontWeight: 700,
            border: '1px solid #bfdbfe'
          }}>
            Bộ môn: Mạng & Các hệ thống thông tin
          </span>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="dyc-kpi-grid">
        <div className="dyc-kpi-card kpi-pending">
          <div className="dyc-kpi-icon">
            <Clock size={22} />
          </div>
          <div className="dyc-kpi-info">
            <span className="dyc-kpi-value">{kpiData.pending}</span>
            <span className="dyc-kpi-label">Yêu cầu chờ duyệt</span>
          </div>
        </div>

        <div className="dyc-kpi-card kpi-approved">
          <div className="dyc-kpi-icon">
            <CheckCircle2 size={22} />
          </div>
          <div className="dyc-kpi-info">
            <span className="dyc-kpi-value">{kpiData.approved}</span>
            <span className="dyc-kpi-label">Đã phê duyệt</span>
          </div>
        </div>

        <div className="dyc-kpi-card kpi-absence">
          <div className="dyc-kpi-icon">
            <XCircle size={22} />
          </div>
          <div className="dyc-kpi-info">
            <span className="dyc-kpi-value">{kpiData.absence}</span>
            <span className="dyc-kpi-label">Đơn xin nghỉ</span>
          </div>
        </div>

        <div className="dyc-kpi-card kpi-substitute">
          <div className="dyc-kpi-icon">
            <Users size={22} />
          </div>
          <div className="dyc-kpi-info">
            <span className="dyc-kpi-value">{kpiData.substitute}</span>
            <span className="dyc-kpi-label">Nhờ dạy thay</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Card */}
      <div className="dyc-filter-card">
        {/* Category Tabs */}
        <div className="dyc-tabs">
          <button
            type="button"
            className={`dyc-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            <span>Tất cả</span>
            <span className="dyc-tab-badge">{tabCounts.ALL}</span>
          </button>
          <button
            type="button"
            className={`dyc-tab-btn ${activeTab === 'ABSENCE' ? 'active' : ''}`}
            onClick={() => setActiveTab('ABSENCE')}
          >
            <span>Báo nghỉ</span>
            <span className="dyc-tab-badge">{tabCounts.ABSENCE}</span>
          </button>
          <button
            type="button"
            className={`dyc-tab-btn ${activeTab === 'SUBSTITUTE' ? 'active' : ''}`}
            onClick={() => setActiveTab('SUBSTITUTE')}
          >
            <span>Dạy thay</span>
            <span className="dyc-tab-badge">{tabCounts.SUBSTITUTE}</span>
          </button>
          <button
            type="button"
            className={`dyc-tab-btn ${activeTab === 'SWAP' ? 'active' : ''}`}
            onClick={() => setActiveTab('SWAP')}
          >
            <span>Đổi ca</span>
            <span className="dyc-tab-badge">{tabCounts.SWAP}</span>
          </button>
          <button
            type="button"
            className={`dyc-tab-btn ${activeTab === 'MAKEUP' ? 'active' : ''}`}
            onClick={() => setActiveTab('MAKEUP')}
          >
            <span>Dạy bù</span>
            <span className="dyc-tab-badge">{tabCounts.MAKEUP}</span>
          </button>
        </div>

        {/* Right Search & Status Filter */}
        <div className="dyc-filter-right">
          <div className="dyc-search-input">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Tìm GV, môn học, mã LHP..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="dyc-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Pending">Chờ duyệt (Pending)</option>
            <option value="Approved">Đã chấp thuận</option>
            <option value="Rejected">Đã từ chối</option>
          </select>
        </div>
      </div>

      {/* Main Request Table Card */}
      <div className="dyc-table-card">
        {filteredRequests.length === 0 ? (
          <div className="dyc-empty-state">
            <ClipboardCheck size={48} color="#cbd5e1" />
            <div style={{ fontWeight: 700, color: '#334155' }}>Không tìm thấy yêu cầu nào</div>
            <div style={{ fontSize: '0.8125rem' }}>Không có đơn đề xuất nào phù hợp với bộ lọc hiện tại.</div>
          </div>
        ) : (
          <table className="dyc-table">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Mã Đơn</th>
                <th style={{ width: '110px' }}>Loại Đơn</th>
                <th>Giảng Viên Gửi</th>
                <th>Lớp Học Phần</th>
                <th>Thời Gian Gốc</th>
                <th>Đề Xuất / Thay Đổi</th>
                <th style={{ width: '120px' }}>Trạng Thái</th>
                <th style={{ width: '160px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(item => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{item.id}</span>
                  </td>
                  <td>{renderTypeBadge(item.loaiYeuCau)}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.tenGiangVien}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Mã: {item.maGiangVien}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.tenMonHoc}</div>
                    <div style={{ fontSize: '0.71875rem', color: '#64748b' }}>{item.maLopHocPhan}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1e293b' }}>
                      <Calendar size={13} color="#2563eb" />
                      <span>{item.ngayGoc}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.tietGoc} • {item.phongGoc}</div>
                  </td>
                  <td>
                    {item.loaiYeuCau === 'ABSENCE' && (
                      <span style={{ color: '#dc2626', fontSize: '0.78125rem', fontWeight: 600 }}>
                        Báo nghỉ buổi học
                      </span>
                    )}
                    {item.loaiYeuCau === 'SUBSTITUTE' && (
                      <div>
                        <span style={{ color: '#7c3aed', fontWeight: 700, fontSize: '0.8125rem' }}>
                          Dạy thay: {item.tenGiangVienThay}
                        </span>
                        <div style={{ fontSize: '0.71875rem', color: '#64748b' }}>Mã GV: {item.maGiangVienThay}</div>
                      </div>
                    )}
                    {item.loaiYeuCau === 'SWAP' && (
                      <div>
                        <span style={{ color: '#1d4ed8', fontWeight: 700, fontSize: '0.78125rem' }}>
                          Đổi sang: {item.ngayDeXuat}
                        </span>
                        <div style={{ fontSize: '0.71875rem', color: '#64748b' }}>
                          {item.tietDeXuat} @ {item.phongDeXuat}
                        </div>
                      </div>
                    )}
                    {item.loaiYeuCau === 'MAKEUP' && (
                      <div>
                        <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.78125rem' }}>
                          Dạy bù: {item.ngayDeXuat}
                        </span>
                        <div style={{ fontSize: '0.71875rem', color: '#64748b' }}>
                          {item.tietDeXuat} @ {item.phongDeXuat}
                        </div>
                      </div>
                    )}
                  </td>
                  <td>{renderStatusBadge(item.trangThai)}</td>
                  <td>
                    <div className="dyc-action-group" style={{ justifyContent: 'center' }}>
                      {item.trangThai === 'Pending' ? (
                        <>
                          <button
                            type="button"
                            className="dyc-btn-action btn-approve"
                            onClick={() => handleApprove(item)}
                            title="Chấp thuận yêu cầu này"
                          >
                            <Check size={13} />
                            <span>Duyệt</span>
                          </button>
                          <button
                            type="button"
                            className="dyc-btn-action btn-reject"
                            onClick={() => handleOpenReject(item)}
                            title="Từ chối yêu cầu này"
                          >
                            <X size={13} />
                            <span>Từ chối</span>
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        className="dyc-btn-action btn-inspect"
                        onClick={() => setInspectItem(item)}
                        title="Xem chi tiết & Kiểm tra xung đột"
                      >
                        <FileText size={13} />
                        <span>Chi tiết</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* =======================================================================
          MODAL 1: XEM CHI TIẾT & KIỂM TRA XUNG ĐỘT (INSPECTION MODAL)
          ======================================================================= */}
      {inspectItem && (
        <div className="lgd-modal-overlay" onClick={() => setInspectItem(null)}>
          <div className="lgd-modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="lgd-modal-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <ClipboardCheck size={20} color="#38bdf8" />
                <h3 className="lgd-modal-title">Chi Tiết Đơn Đề Xuất [{inspectItem.id}]</h3>
              </div>
              <button className="lgd-modal-close" onClick={() => setInspectItem(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="lgd-modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>{renderTypeBadge(inspectItem.loaiYeuCau)}</div>
                <div>{renderStatusBadge(inspectItem.trangThai)}</div>
              </div>

              {/* Thông tin lớp & GV */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.78125rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Lớp học phần & Giảng viên
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
                  {inspectItem.tenMonHoc}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: '0.5rem' }}>
                  Mã LHP: <strong>{inspectItem.maLopHocPhan}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8125rem', color: '#1e293b' }}>
                  <User size={14} color="#2563eb" />
                  <span>Giảng viên: <strong>{inspectItem.tenGiangVien}</strong> ({inspectItem.maGiangVien})</span>
                </div>
              </div>

              {/* Chi tiết ca học gốc & đề xuất */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Ca học gốc
                  </span>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                    {inspectItem.ngayGoc}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569' }}>{inspectItem.tietGoc}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#0284c7', fontWeight: 600 }}>Phòng: {inspectItem.phongGoc}</div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.85rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                    Nội dung thay đổi
                  </span>
                  {inspectItem.loaiYeuCau === 'ABSENCE' && (
                    <div style={{ marginTop: '0.35rem', color: '#dc2626', fontWeight: 700, fontSize: '0.875rem' }}>
                      Báo nghỉ (Giải phóng phòng ca này)
                    </div>
                  )}
                  {inspectItem.loaiYeuCau === 'SUBSTITUTE' && (
                    <div style={{ marginTop: '0.35rem' }}>
                      <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: '0.875rem' }}>{inspectItem.tenGiangVienThay}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Dạy thay buổi học gốc</div>
                    </div>
                  )}
                  {(inspectItem.loaiYeuCau === 'SWAP' || inspectItem.loaiYeuCau === 'MAKEUP') && (
                    <div style={{ marginTop: '0.35rem' }}>
                      <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.875rem' }}>{inspectItem.ngayDeXuat}</div>
                      <div style={{ fontSize: '0.8125rem', color: '#166534' }}>{inspectItem.tietDeXuat}</div>
                      <div style={{ fontSize: '0.8125rem', color: '#0284c7', fontWeight: 600 }}>Phòng: {inspectItem.phongDeXuat}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lý do gửi */}
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Lý do từ giảng viên
                </span>
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.25rem', fontSize: '0.8125rem', color: '#1e293b' }}>
                  "{inspectItem.lyDo}"
                </div>
              </div>

              {/* Automated Conflict Checking Engine Result */}
              {inspectItem.conflictCheck && (
                <div className={`conflict-box ${inspectItem.conflictCheck.safe ? 'safe' : 'danger'}`}>
                  {inspectItem.conflictCheck.safe ? <CheckCircle2 size={18} color="#059669" /> : <AlertTriangle size={18} color="#dc2626" />}
                  <div>
                    <strong>Kết quả kiểm tra xung đột tự động:</strong>
                    <div>{inspectItem.conflictCheck.message}</div>
                  </div>
                </div>
              )}

              {/* Rejection notice if already rejected */}
              {inspectItem.trangThai === 'Rejected' && inspectItem.lyDoTuChoi && (
                <div style={{ marginTop: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', color: '#991b1b', fontSize: '0.8125rem' }}>
                  <strong>Lý do từ chối:</strong> {inspectItem.lyDoTuChoi}
                </div>
              )}
            </div>

            <div className="lgd-modal-footer" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                className="lgd-btn lgd-btn-secondary"
                onClick={() => setInspectItem(null)}
              >
                Đóng
              </button>
              {inspectItem.trangThai === 'Pending' && (
                <>
                  <button
                    type="button"
                    className="lgd-btn lgd-btn-danger"
                    onClick={() => handleOpenReject(inspectItem)}
                  >
                    <X size={15} />
                    <span>Từ Chối Đơn</span>
                  </button>
                  <button
                    type="button"
                    className="lgd-btn lgd-btn-primary"
                    style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)', border: 'none' }}
                    onClick={() => handleApprove(inspectItem)}
                  >
                    <Check size={15} />
                    <span>Chấp Thuận Phê Duyệt</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 2: TỪ CHỐI ĐƠN & NHẬP LÝ DO (REJECT REASON MODAL)
          ======================================================================= */}
      {rejectItem && (
        <div className="lgd-modal-overlay" onClick={() => setRejectItem(null)}>
          <div className="lgd-modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="lgd-modal-header" style={{ background: '#dc2626' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <XCircle size={20} />
                <h3 className="lgd-modal-title">Từ Chối Yêu Cầu [{rejectItem.id}]</h3>
              </div>
              <button className="lgd-modal-close" onClick={() => setRejectItem(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject}>
              <div className="lgd-modal-body" style={{ padding: '1.25rem' }}>
                <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.8125rem', color: '#475569' }}>
                  Bạn đang từ chối yêu cầu của <strong>{rejectItem.tenGiangVien}</strong> ({rejectItem.tenMonHoc}).
                  Vui lòng cung cấp lý do cụ thể để gửi thông báo lại cho giảng viên:
                </p>

                <div className="lgd-form-group">
                  <label className="lgd-label" style={{ fontWeight: 700 }}>
                    Lý do từ chối: <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    className="lgd-textarea"
                    rows={4}
                    required
                    placeholder="VD: Không thể duyệt do tuần này lớp cần hoàn thành tiến độ kiểm tra giữa kỳ; hoặc giảng viên thay thế đã quá tải giờ dạy..."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="lgd-modal-footer" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button
                  type="button"
                  className="lgd-btn lgd-btn-secondary"
                  onClick={() => setRejectItem(null)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="lgd-btn lgd-btn-danger"
                >
                  <Send size={15} />
                  <span>Xác Nhận Từ Chối</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
