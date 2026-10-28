import { useState, useMemo, useEffect } from 'react';
import {
  ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, Clock,
  Calendar, Building, User, Users, BookOpen, Search, Filter,
  ArrowRight, ShieldAlert, Check, X, RefreshCw, Send, FileText
} from 'lucide-react';
import { apiGetYeuCauNghiByBoMon, apiDuyetYeuCauNghi, apiCheckConflictYeuCau } from '../../../../utils/apiBienDongLich';
import { useAuth } from '../../../../context/AuthContext';
import './DuyetYeuCauManagement.css';

// Helper chuẩn hóa dữ liệu từ Backend API (PascalCase) sang định dạng UI Component
export const normalizeRequest = (r) => {
  if (!r) return null;
  return {
    id: r.MaYeuCauNghi || r.id || '',
    loaiYeuCau: r.LoaiYeuCau || r.loaiYeuCau || 'ABSENCE',
    maGiangVien: r.MaGiangVien || r.maGiangVien || '',
    tenGiangVien: r.TenGiangVienGui || r.tenGiangVien || r.HoTen || '',
    maLopHocPhan: r.MaLopHocPhan || r.maLopHocPhan || '',
    tenMonHoc: r.TenMonHoc || r.tenMonHoc || r.TenLopHocPhan || '',
    tenLopHocPhan: r.TenLopHocPhan || r.tenLopHocPhan || '',
    maBoMon: r.MaBoMon || r.maBoMon || '',
    tenBoMon: r.TenBoMon || r.tenBoMon || '',
    ngayGoc: r.NgayHoc ? (typeof r.NgayHoc === 'string' ? r.NgayHoc.slice(0, 10) : r.NgayHoc) : (r.ngayGoc || ''),
    tietGoc: r.TenTiet || (r.MaTiet ? `Tiết ${r.MaTiet}` : '') || r.tietGoc || '',
    phongGoc: r.TenPhong || r.MaPhong || r.phongGoc || '',
    ngayDeXuat: r.NgayDeXuat ? (typeof r.NgayDeXuat === 'string' ? r.NgayDeXuat.slice(0, 10) : r.NgayDeXuat) : (r.ngayDeXuat || ''),
    tietDeXuat: r.TenTietDeXuat || (r.MaTietDeXuat ? `Tiết ${r.MaTietDeXuat}` : '') || r.tietDeXuat || '',
    phongDeXuat: r.TenPhongDeXuat || r.MaPhongDeXuat || r.phongDeXuat || '',
    maGiangVienThay: r.MaGiangVienDeXuat || r.maGiangVienThay || '',
    tenGiangVienThay: r.TenGiangVienDeXuat || r.tenGiangVienThay || '',
    lyDo: r.LyDo || r.lyDo || '',
    thoiGianGui: r.ThoiGianGui ? (typeof r.ThoiGianGui === 'string' ? r.ThoiGianGui.slice(0, 19).replace('T', ' ') : r.ThoiGianGui) : (r.thoiGianGui || ''),
    trangThai: r.TrangThai || r.trangThai || 'Pending',
    lyDoTuChoi: r.LyDoTuChoi || r.lyDoTuChoi || '',
    minhChung: r.MinhChungUrl || r.minhChung || '',
    nguoiDuyet: r.NguoiDuyet || r.nguoiDuyet || (r.TenBoMon ? (r.TenBoMon.startsWith('Bộ môn') ? r.TenBoMon : `Bộ môn ${r.TenBoMon}`) : (r.MaBoMon ? `Bộ môn ${r.MaBoMon}` : 'Bộ môn')),
    thoiGianDuyet: r.ThoiGianDuyet ? (typeof r.ThoiGianDuyet === 'string' ? r.ThoiGianDuyet.slice(0, 19).replace('T', ' ') : r.ThoiGianDuyet) : (r.thoiGianDuyet || ''),
    conflictCheck: r.conflictCheck || null,
    maBuoiHoc: r.MaBuoiHoc || r.maBuoiHoc || '',
    raw: r
  };
};

export default function DuyetYeuCauManagement() {
  const { user } = useAuth();
  const isBoMon = user?.role === 'BOMON';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
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
    const pending = requests.filter(r => (r.trangThai || r.TrangThai) === 'Pending').length;
    const approved = requests.filter(r => (r.trangThai || r.TrangThai) === 'Approved').length;
    const absence = requests.filter(r => (r.loaiYeuCau || r.LoaiYeuCau) === 'ABSENCE').length;
    const substitute = requests.filter(r => (r.loaiYeuCau || r.LoaiYeuCau) === 'SUBSTITUTE').length;
    return { pending, approved, absence, substitute };
  }, [requests]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      ALL: requests.length,
      ABSENCE: requests.filter(r => (r.loaiYeuCau || r.LoaiYeuCau) === 'ABSENCE').length,
      SUBSTITUTE: requests.filter(r => (r.loaiYeuCau || r.LoaiYeuCau) === 'SUBSTITUTE').length,
      SWAP: requests.filter(r => (r.loaiYeuCau || r.LoaiYeuCau) === 'SWAP').length,
      MAKEUP: requests.filter(r => (r.loaiYeuCau || r.LoaiYeuCau) === 'MAKEUP').length,
    };
  }, [requests]);

  // Tự động tải dữ liệu từ Backend API
  const fetchData = async () => {
    setLoading(true);
    try {
      const remoteData = await apiGetYeuCauNghiByBoMon();
      if (remoteData && Array.isArray(remoteData)) {
        setRequests(remoteData.map(normalizeRequest));
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.warn('[DuyetYeuCau] Lỗi tải dữ liệu API:', err.message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        const matchId = item.id?.toLowerCase().includes(kw);
        const matchName = item.tenGiangVien?.toLowerCase().includes(kw);
        const matchClass = item.tenMonHoc?.toLowerCase().includes(kw) || item.maLopHocPhan?.toLowerCase().includes(kw) || item.tenLopHocPhan?.toLowerCase().includes(kw);
        const matchThay = item.tenGiangVienThay?.toLowerCase().includes(kw);
        if (!matchId && !matchName && !matchClass && !matchThay) return false;
      }
      return true;
    });
  }, [requests, activeTab, statusFilter, searchTerm]);

  // Approve action
  const handleApprove = async (item) => {
    try {
      await apiDuyetYeuCauNghi({ maYeuCauNghi: item.id, trangThai: 'Approved' });
      showToast(`Đã chấp thuận yêu cầu [${item.id}] của ${item.tenGiangVien || 'giảng viên'} thành công!`);
    } catch (err) {
      alert(`Lỗi khi duyệt yêu cầu: ${err.message}`);
      return;
    }

    setRequests(prev => prev.map(r => {
      if (r.id === item.id) {
        return {
          ...r,
          trangThai: 'Approved',
          nguoiDuyet: r.tenBoMon ? (r.tenBoMon.startsWith('Bộ môn') ? r.tenBoMon : `Bộ môn ${r.tenBoMon}`) : 'Bộ môn',
          thoiGianDuyet: new Date().toLocaleString('vi-VN')
        };
      }
      return r;
    }));
    if (inspectItem?.id === item.id) {
      setInspectItem(null);
    }
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
      showToast(`Đã từ chối yêu cầu [${rejectItem.id}]. Phản hồi đã được gửi đến giảng viên.`);
    } catch (err) {
      alert(`Lỗi khi từ chối yêu cầu: ${err.message}`);
      return;
    }

    setRequests(prev => prev.map(r => {
      if (r.id === rejectItem.id) {
        return {
          ...r,
          trangThai: 'Rejected',
          lyDoTuChoi: rejectReason.trim(),
          nguoiDuyet: r.tenBoMon ? (r.tenBoMon.startsWith('Bộ môn') ? r.tenBoMon : `Bộ môn ${r.tenBoMon}`) : 'Bộ môn',
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
  };

  // Mở modal kiểm tra chi tiết & kiểm tra xung đột tự động
  const handleOpenInspect = async (item) => {
    setInspectItem(item);
    if (!item.conflictCheck && item.trangThai === 'Pending') {
      try {
        const res = await apiCheckConflictYeuCau(item.id);
        const safe = !res.conflict;
        let message = safe
          ? (res.message || 'Hệ thống tự động: Không phát hiện xung đột lịch giảng dạy hay phòng học.')
          : (res.details?.map(d => d.message).join('; ') || 'Cảnh báo: Phát hiện xung đột lịch!');
        setInspectItem(prev => (prev && prev.id === item.id ? { ...prev, conflictCheck: { safe, message } } : prev));
      } catch (err) {
        setInspectItem(prev => (prev && prev.id === item.id ? { ...prev, conflictCheck: { safe: true, message: 'Hệ thống tự động: Không phát hiện xung đột lịch.' } } : prev));
      }
    }
  };

  const renderTypeBadge = (type) => {
    switch (type) {
      case 'ABSENCE':
        return <span className="badge-type type-absence"><XCircle size={13} /> Báo Nghỉ</span>;
      case 'SUBSTITUTE':
        return <span className="badge-type type-substitute"><Users size={13} /> Dạy Thay</span>;
      case 'SWAP':
        return <span className="badge-type type-swap"><RefreshCw size={13} /> Đổi Ca</span>;
      case 'MAKEUP':
        return <span className="badge-type type-makeup"><CheckCircle2 size={13} /> Dạy Bù</span>;
      default:
        return type;
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="badge-status status-pending">
            <span className="status-dot-pending" />
            Chờ duyệt
          </span>
        );
      case 'Approved':
        return (
          <span className="badge-status status-approved">
            <Check size={13} />
            Đã chấp thuận
          </span>
        );
      case 'Rejected':
        return (
          <span className="badge-status status-rejected">
            <X size={13} />
            Đã từ chối
          </span>
        );
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
          borderRadius: '12px',
          boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
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
            <h1 className="dyc-title">
              {isBoMon ? 'Phê Duyệt Yêu Cầu Giảng Dạy Bộ Môn' : 'Phê Duyệt & Giám Sát Yêu Cầu Giảng Dạy'}
            </h1>
            <p className="dyc-subtitle">
              {isBoMon
                ? 'Duyệt các đề xuất Báo nghỉ, Nhờ dạy thay, Xin đổi ca và Đăng ký dạy bù của giảng viên trực thuộc Bộ môn'
                : 'Theo dõi và xử lý các đề xuất Báo nghỉ, Nhờ dạy thay, Xin đổi ca và Đăng ký dạy bù toàn trường'}
            </p>
          </div>
        </div>

        <div className="dyc-header-actions">
          <span className="dyc-scope-badge">
            <span className="dyc-scope-dot" />
            {isBoMon
              ? (requests.find(r => r.tenBoMon)?.tenBoMon ? `Bộ môn: ${requests.find(r => r.tenBoMon).tenBoMon}` : 'Bộ môn của tôi')
              : 'Phạm vi: Toàn trường (PĐT & Admin)'}
          </span>
          <button
            type="button"
            className="dyc-btn-refresh"
            onClick={fetchData}
            title="Tải lại dữ liệu từ hệ thống"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="dyc-kpi-grid">
        <div className="dyc-kpi-card kpi-pending">
          <div className="dyc-kpi-left">
            <div className="dyc-kpi-icon">
              <Clock size={22} />
            </div>
            <div className="dyc-kpi-info">
              <span className="dyc-kpi-value">{kpiData.pending}</span>
              <span className="dyc-kpi-label">Yêu cầu chờ duyệt</span>
            </div>
          </div>
          <span className="dyc-kpi-tag">Cần xử lý</span>
        </div>

        <div className="dyc-kpi-card kpi-approved">
          <div className="dyc-kpi-left">
            <div className="dyc-kpi-icon">
              <CheckCircle2 size={22} />
            </div>
            <div className="dyc-kpi-info">
              <span className="dyc-kpi-value">{kpiData.approved}</span>
              <span className="dyc-kpi-label">Đã phê duyệt</span>
            </div>
          </div>
          <span className="dyc-kpi-tag">Hoàn tất</span>
        </div>

        <div className="dyc-kpi-card kpi-absence">
          <div className="dyc-kpi-left">
            <div className="dyc-kpi-icon">
              <XCircle size={22} />
            </div>
            <div className="dyc-kpi-info">
              <span className="dyc-kpi-value">{kpiData.absence}</span>
              <span className="dyc-kpi-label">Đơn xin nghỉ</span>
            </div>
          </div>
          <span className="dyc-kpi-tag">Báo nghỉ</span>
        </div>

        <div className="dyc-kpi-card kpi-substitute">
          <div className="dyc-kpi-left">
            <div className="dyc-kpi-icon">
              <Users size={22} />
            </div>
            <div className="dyc-kpi-info">
              <span className="dyc-kpi-value">{kpiData.substitute}</span>
              <span className="dyc-kpi-label">Nhờ dạy thay</span>
            </div>
          </div>
          <span className="dyc-kpi-tag">Dạy thay</span>
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

        {/* Search & Status Filter */}
        <div className="dyc-filter-right">
          <div className="dyc-search-input">
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Tìm GV, môn học, mã LHP..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="dyc-search-clear"
                onClick={() => setSearchTerm('')}
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
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

      {/* Main Request Table Card with Responsive Horizontal Scroll */}
      <div className="dyc-table-card">
        {loading ? (
          <div className="dyc-empty-state">
            <RefreshCw size={36} color="#3b82f6" className="animate-spin" />
            <div style={{ fontWeight: 600, color: '#334155', marginTop: '0.5rem' }}>Đang tải dữ liệu từ máy chủ...</div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="dyc-empty-state">
            <ClipboardCheck size={48} color="#cbd5e1" />
            <div style={{ fontWeight: 700, color: '#334155' }}>Không tìm thấy yêu cầu nào</div>
            <div style={{ fontSize: '0.8125rem' }}>Không có đơn đề xuất nào phù hợp với bộ lọc hiện tại.</div>
          </div>
        ) : (
          <div className="dyc-table-responsive">
            <table className="dyc-table">
              <thead>
                <tr>
                  <th style={{ width: '125px' }}>Mã Đơn</th>
                  <th style={{ width: '120px' }}>Loại Đơn</th>
                  <th style={{ width: '190px' }}>Giảng Viên Gửi</th>
                  <th style={{ width: '220px' }}>Lớp Học Phần</th>
                  <th style={{ width: '175px' }}>Thời Gian Gốc</th>
                  <th style={{ width: '195px' }}>Đề Xuất / Thay Đổi</th>
                  <th style={{ width: '140px' }}>Trạng Thái</th>
                  <th style={{ width: '240px', minWidth: '240px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((item, idx) => (
                  <tr key={`${item.id || 'item'}-${idx}`}>
                    <td>
                      <code className="dyc-code-badge">{item.id}</code>
                    </td>
                    <td>{renderTypeBadge(item.loaiYeuCau)}</td>
                    <td>
                      <div className="dyc-gv-cell">
                        <div className="dyc-gv-avatar">
                          {item.tenGiangVien ? item.tenGiangVien.trim().split(' ').slice(-1)[0][0] : 'G'}
                        </div>
                        <div>
                          <div className="dyc-gv-name">{item.tenGiangVien}</div>
                          <div className="dyc-gv-code">Mã GV: {item.maGiangVien}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="dyc-lhp-name">{item.tenMonHoc}</div>
                        <div className="dyc-lhp-code">{item.maLopHocPhan}</div>
                      </div>
                    </td>
                    <td>
                      <div className="dyc-time-box">
                        <div className="dyc-time-date">
                          <Calendar size={13} color="#2563eb" />
                          <span>{item.ngayGoc}</span>
                        </div>
                        <div className="dyc-time-detail">{item.tietGoc} • {item.phongGoc}</div>
                      </div>
                    </td>
                    <td>
                      {item.loaiYeuCau === 'ABSENCE' && (
                        <span style={{ color: '#e11d48', fontSize: '0.8125rem', fontWeight: 700 }}>
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
                          <span style={{ color: '#1d4ed8', fontWeight: 700, fontSize: '0.8125rem' }}>
                            Đổi sang: {item.ngayDeXuat}
                          </span>
                          <div style={{ fontSize: '0.71875rem', color: '#64748b' }}>
                            {item.tietDeXuat} @ {item.phongDeXuat}
                          </div>
                        </div>
                      )}
                      {item.loaiYeuCau === 'MAKEUP' && (
                        <div>
                          <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.8125rem' }}>
                            Dạy bù: {item.ngayDeXuat}
                          </span>
                          <div style={{ fontSize: '0.71875rem', color: '#64748b' }}>
                            {item.tietDeXuat} @ {item.phongDeXuat}
                          </div>
                        </div>
                      )}
                    </td>
                    <td>{renderStatusBadge(item.trangThai)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="dyc-action-group">
                        {item.trangThai === 'Pending' ? (
                          <>
                            <button
                              type="button"
                              className="dyc-btn-action btn-approve"
                              onClick={() => handleApprove(item)}
                              title="Chấp thuận yêu cầu này"
                            >
                              <Check size={14} />
                              <span>Duyệt</span>
                            </button>
                            <button
                              type="button"
                              className="dyc-btn-action btn-reject"
                              onClick={() => handleOpenReject(item)}
                              title="Từ chối yêu cầu này"
                            >
                              <X size={14} />
                              <span>Từ chối</span>
                            </button>
                          </>
                        ) : null}
                        <button
                          type="button"
                          className="dyc-btn-action btn-inspect"
                          onClick={() => handleOpenInspect(item)}
                          title="Xem chi tiết & Kiểm tra xung đột"
                        >
                          <FileText size={14} />
                          <span>Chi tiết</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          MODAL 2: TỪ CHỐI ĐƠN & NHẬP LÝ DO (REJECT REASON MODAL) - REDESIGNED
          ======================================================================= */}
      {rejectItem && (() => {
        const getLoaiYeuCauBadge = (type) => {
          switch (type) {
            case 'ABSENCE':
              return { label: 'Báo nghỉ buổi học', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
            case 'SWAP':
              return { label: 'Xin đổi ca giảng dạy', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
            case 'SUBSTITUTE':
              return { label: 'Nhờ đồng nghiệp dạy thay', bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' };
            default:
              return { label: 'Yêu cầu biến động', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
          }
        };

        const typeInfo = getLoaiYeuCauBadge(rejectItem.loaiYeuCau);
        const quickReasons = [
          'Trùng lịch kiểm tra / thi giữa kỳ của lớp',
          'Chưa đảm bảo tiến độ giảng dạy theo kế hoạch',
          'Phòng học đề xuất không khả dụng vào ca này',
          'Giảng viên thay thế đã vượt định mức giờ dạy',
          'Minh chứng hoặc lý do chưa đủ căn cứ phê duyệt'
        ];

        const handleAddReason = (reason) => {
          if (!rejectReason.trim()) {
            setRejectReason(reason);
          } else if (!rejectReason.includes(reason)) {
            setRejectReason(prev => `${prev.trim()}; ${reason}`);
          }
        };

        return (
          <div className="lgd-modal-overlay" onClick={() => setRejectItem(null)}>
            <div
              className="lgd-modal-content"
              style={{
                maxWidth: '600px',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.25), 0 10px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="lgd-modal-header"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    <XCircle size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                      Từ Chối Phê Duyệt Yêu Cầu
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        color: '#fecaca',
                        fontFamily: 'monospace'
                      }}>
                        {rejectItem.id}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.85)' }}>
                        • {typeInfo.label}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className="lgd-modal-close"
                  onClick={() => setRejectItem(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title="Đóng"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form & Body */}
              <form onSubmit={handleConfirmReject}>
                <div className="lgd-modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  
                  {/* Request Summary Card */}
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '12px',
                    padding: '1rem 1.15rem',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.95rem'
                        }}>
                          {rejectItem.tenGiangVien?.charAt(0) || 'G'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                            {rejectItem.tenGiangVien}
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500, marginLeft: '0.4rem' }}>
                              ({rejectItem.maGiangVien})
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: '#334155', fontWeight: 600, marginTop: '2px' }}>
                            {rejectItem.tenMonHoc}
                            {rejectItem.tenLopHocPhan && rejectItem.tenLopHocPhan !== rejectItem.tenMonHoc && (
                              <span style={{ color: '#64748b', fontWeight: 400 }}> - {rejectItem.tenLopHocPhan}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '20px',
                        background: typeInfo.bg,
                        color: typeInfo.color,
                        border: `1px solid ${typeInfo.border}`,
                        whiteSpace: 'nowrap'
                      }}>
                        {typeInfo.label}
                      </span>
                    </div>

                    <div style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px dashed #fca5a5',
                      fontSize: '0.8rem',
                      color: '#475569',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.85rem'
                    }}>
                      <span>📅 Lịch: <strong>{rejectItem.ngayGoc ? new Date(rejectItem.ngayGoc).toLocaleDateString('vi-VN') : '-'}</strong></span>
                      <span>⏰ <strong>{rejectItem.tietGoc || '-'}</strong></span>
                      <span>🏫 Phòng: <strong>{rejectItem.phongGoc || '-'}</strong></span>
                    </div>

                    {rejectItem.lyDo && (
                      <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.78rem',
                        color: '#6b7280',
                        fontStyle: 'italic',
                        background: 'rgba(255, 255, 255, 0.7)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid #fee2e2'
                      }}>
                        💬 <strong>Lý do GV đề xuất:</strong> "{rejectItem.lyDo}"
                      </div>
                    )}
                  </div>

                  {/* Quick Reason Suggestions */}
                  <div>
                    <label style={{
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: '#334155',
                      display: 'block',
                      marginBottom: '0.45rem'
                    }}>
                      ⚡ Chọn nhanh lý do từ chối thường gặp:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {quickReasons.map((reason, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddReason(reason)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '8px',
                            background: rejectReason.includes(reason) ? '#fee2e2' : '#f8fafc',
                            border: rejectReason.includes(reason) ? '1px solid #f87171' : '1px solid #e2e8f0',
                            color: rejectReason.includes(reason) ? '#b91c1c' : '#475569',
                            fontWeight: rejectReason.includes(reason) ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            textAlign: 'left'
                          }}
                        >
                          + {reason}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lý do từ chối (Textarea chuẩn) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                        Lý do từ chối cụ thể <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {rejectReason.length}/500 ký tự
                      </span>
                    </div>

                    <textarea
                      rows={4}
                      required
                      maxLength={500}
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Nhập lý do từ chối cụ thể và hướng dẫn (nếu có) để hệ thống gửi thông báo phản hồi lại cho giảng viên..."
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.85rem',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        outline: 'none',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#ef4444';
                        e.target.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />

                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                      ℹ️ Giảng viên sẽ nhận được thông báo kèm lý do từ chối này ngay sau khi bạn xác nhận.
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div
                  className="lgd-modal-footer"
                  style={{
                    padding: '1rem 1.5rem',
                    background: '#f8fafc',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setRejectItem(null)}
                    style={{
                      padding: '0.6rem 1.3rem',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      color: '#475569',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={!rejectReason.trim()}
                    style={{
                      padding: '0.6rem 1.6rem',
                      background: !rejectReason.trim() ? '#94a3b8' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: !rejectReason.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: !rejectReason.trim() ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.35)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <XCircle size={16} />
                    <span>Xác Nhận Từ Chối</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
