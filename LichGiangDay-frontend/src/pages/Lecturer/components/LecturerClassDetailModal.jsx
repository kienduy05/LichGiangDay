import {
  X, Calendar, Clock, Building, Users, BookOpen,
  User, RefreshCw, PlusCircle, AlertTriangle, Hash, School, AlertCircle
} from 'lucide-react';
import '../../Admin/components/LichGiangDayManagement/LichGiangDayComponents.css';

export default function LecturerClassDetailModal({
  isOpen,
  onClose,
  item,
  onRequestDoiCa,
  onRequestBaoNghi,
  onRequestDayThay,
  onRequestDayBu,
  onCancelRequest
}) {
  if (!isOpen || !item) return null;

  const loaiHocLabels = {
    LT: 'Lý thuyết',
    TH: 'Thực hành',
    BT: 'Bài tập',
    BTL: 'Bài tập lớn'
  };

  const thuLabels = {
    2: 'Thứ Hai',
    3: 'Thứ Ba',
    4: 'Thứ Tư',
    5: 'Thứ Năm',
    6: 'Thứ Sáu',
    7: 'Thứ Bảy',
    8: 'Chủ Nhật'
  };

  const formatDateVN = (dateStr) => {
    if (!dateStr) return 'N/A';
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Quy định: Thao tác nghiệp vụ buổi dạy chỉ được thực hiện trước ít nhất 3 ngày
  // Ví dụ hôm nay là mùng 1 thì chỉ thao tác với buổi học từ mùng 4 trở đi
  const calculateDaysDiff = () => {
    if (!item?.NgayHoc) return -1;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const parts = String(item.NgayHoc).slice(0, 10).split('-').map(Number);
    if (parts.length !== 3) return -1;
    const sessionDate = new Date(parts[0], parts[1] - 1, parts[2]);
    return Math.round((sessionDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  };

  const diffDays = calculateDaysDiff();
  const canPerformAction = diffDays >= 3;

  const getMinValidDateFormatted = () => {
    const minD = new Date();
    minD.setDate(minD.getDate() + 3);
    const d = String(minD.getDate()).padStart(2, '0');
    const m = String(minD.getMonth() + 1).padStart(2, '0');
    const y = minD.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const getDayLabel = () => {
    const dow = item.ThuTrongTuan || item.Thu;
    if (dow && thuLabels[dow]) return thuLabels[dow];
    if (item.NgayHoc) {
      const parts = String(item.NgayHoc).split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const calculatedDow = d.getDay() === 0 ? 8 : d.getDay() + 1;
        return thuLabels[calculatedDow] || `Thứ ${calculatedDow}`;
      }
    }
    return 'Lịch học';
  };

  const loaiHocCode = (item.LoaiHoc || 'LT').toLowerCase();

  return (
    <div className="lgd-modal-overlay" onClick={onClose}>
      <div className="lgd-modal-content" style={{ maxWidth: '660px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lgd-modal-header" style={{ background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Calendar size={20} />
            <h3 className="lgd-modal-title">Chi Tiết Buổi Dạy Của Giảng Viên</h3>
          </div>
          <button className="lgd-modal-close" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="lgd-modal-body">
          {/* Main Info Hero Box */}
          <div className="lgd-modal-hero" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)', borderColor: '#a7f3d0' }}>
            <div className="lgd-modal-hero-top">
              <span className="lgd-modal-class-code-badge" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                <Hash size={14} />
                {item.MaLopHocPhan}
              </span>
              <span className={`lgd-modal-type-badge type-${loaiHocCode}`}>
                {loaiHocLabels[item.LoaiHoc] || item.LoaiHoc || 'Lý thuyết'}
              </span>
            </div>

            <div className="lgd-modal-class-title-wrap">
              <span className="lgd-modal-label-small" style={{ color: '#059669' }}>LỚP HỌC PHẦN GIẢNG DẠY</span>
              <h3 className="lgd-modal-class-name">
                {item.TenLopHocPhan || item.TenMonHoc || 'Chưa cập nhật tên lớp'}
              </h3>
            </div>

            <div className="lgd-modal-subject-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#059669' }}>
                <BookOpen size={16} />
                <span style={{ fontSize: '0.78125rem', fontWeight: 700, textTransform: 'uppercase' }}>Môn học:</span>
              </div>
              <span className="lgd-modal-subject-name">{item.TenMonHoc || 'Chưa cập nhật'}</span>
              <span className="lgd-modal-subject-meta">
                {item.SoTinChi && <span>• <strong>{item.SoTinChi} Tín chỉ</strong></span>}
                {item.TenBoMon && <span>• {item.TenBoMon}</span>}
              </span>
            </div>
          </div>

          {/* Action Buttons Toolbar (Theo tài liệu phân tích) */}
          <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.78125rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
              Thao Tác Nghiệp Vụ Buổi Dạy
            </div>

            {/* Trạng thái Buổi học */}
            {item.TrangThai && item.TrangThai !== 'Normal' && (
              <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8125rem', background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309' }}>
                Trạng thái: <strong>{item.TrangThai}</strong> {item.GhiChu && `• ${item.GhiChu}`}
              </div>
            )}

            {/* Nút theo trạng thái */}
            {item.TrangThai === 'Absent' && item.DaDayBu === 0 ? (
              <button
                type="button"
                onClick={() => { onClose(); if (onRequestDayBu) onRequestDayBu(item); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <PlusCircle size={16} />
                <span>Đăng Ký Dạy Bù Cho Ca Này</span>
              </button>
            ) : item.TrangThai?.includes('Pending') ? (
              <button
                type="button"
                onClick={() => { if (item.yeuCauHienTai && onCancelRequest) onCancelRequest(item.yeuCauHienTai.MaYeuCauNghi); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#b91c1c',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
                <span>Hủy Yêu Cầu Đang Chờ Duyệt</span>
              </button>
            ) : item.TrangThai === 'Normal' ? (
              canPerformAction ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                  {/* 1. Đổi ca */}
                  <button
                    type="button"
                    onClick={() => onRequestDoiCa && onRequestDoiCa(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <RefreshCw size={15} />
                    <span>Xin Đổi Ca</span>
                  </button>

                  {/* 2. Báo nghỉ */}
                  <button
                    type="button"
                    onClick={() => onRequestBaoNghi && onRequestBaoNghi(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #fecaca',
                      background: '#fef2f2',
                      color: '#dc2626',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <AlertTriangle size={15} />
                    <span>Báo Nghỉ</span>
                  </button>

                  {/* 3. Dạy thay */}
                  <button
                    type="button"
                    onClick={() => onRequestDayThay && onRequestDayThay(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #ddd6fe',
                      background: '#f5f3ff',
                      color: '#6d28d9',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Users size={15} />
                    <span>Dạy Thay</span>
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '0.8125rem',
                    lineHeight: 1.5,
                    marginBottom: '0.75rem'
                  }}>
                    <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '2px' }}>Quy định thời gian thao tác:</div>
                      <div>Chỉ được phép thao tác nghiệp vụ trước ngày học ít nhất <strong>3 ngày</strong> (chỉ khả dụng với các buổi học từ ngày <strong>{getMinValidDateFormatted()}</strong> trở đi).</div>
                      <div style={{ marginTop: '3px', fontSize: '0.75rem', color: '#b91c1c' }}>
                        Buổi học này diễn ra vào ngày <strong>{formatDateVN(item.NgayHoc)}</strong> nên không đủ điều kiện thao tác.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', opacity: 0.45 }}>
                    <button
                      type="button"
                      disabled
                      title="Không thể thao tác vì chưa đủ 3 ngày trước buổi học"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        padding: '0.65rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#f1f5f9',
                        color: '#64748b',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'not-allowed'
                      }}
                    >
                      <RefreshCw size={15} />
                      <span>Xin Đổi Ca</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Không thể thao tác vì chưa đủ 3 ngày trước buổi học"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        padding: '0.65rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#f1f5f9',
                        color: '#64748b',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'not-allowed'
                      }}
                    >
                      <AlertTriangle size={15} />
                      <span>Báo Nghỉ</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Không thể thao tác vì chưa đủ 3 ngày trước buổi học"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        padding: '0.65rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#f1f5f9',
                        color: '#64748b',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'not-allowed'
                      }}
                    >
                      <Users size={15} />
                      <span>Dạy Thay</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div style={{ fontSize: '0.8125rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
                Buổi học đã hoàn thành hoặc không ở trạng thái bình thường.
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="lgd-modal-info-grid">
            {/* Lịch học */}
            <div className="lgd-modal-info-item item-time">
              <div className="lgd-modal-info-header">
                <Clock size={16} color="#d97706" />
                <span className="lgd-modal-label">Thời gian & Ca học</span>
              </div>
              <span className="lgd-highlight-time">
                {getDayLabel()} • {item.TenTiet || `Tiết ${item.MaTiet || 'N/A'}`}
              </span>
              {item.NgayHoc && (
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#475569', marginTop: '2px' }}>
                  Ngày học: <strong>{formatDateVN(item.NgayHoc)}</strong>
                </div>
              )}
              {item.GioBatDau && item.GioKetThuc && (
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                  Giờ học: {item.GioBatDau} - {item.GioKetThuc}
                </div>
              )}
            </div>

            {/* Phòng học */}
            <div className="lgd-modal-info-item item-room">
              <div className="lgd-modal-info-header">
                <Building size={16} color="#0284c7" />
                <span className="lgd-modal-label">Phòng học & Giảng đường</span>
              </div>
              <div>
                <span className="lgd-highlight-room">{item.TenPhong || 'Chưa xếp phòng'}</span>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                  {item.TenToaNha || 'Khu giảng đường'}
                </span>
              </div>
            </div>

            {/* Sĩ số */}
            <div className="lgd-modal-info-item item-capacity">
              <div className="lgd-modal-info-header">
                <Users size={16} color="#059669" />
                <span className="lgd-modal-label">Quy mô sinh viên</span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                {item.SiSoDangKy || 0} SV đăng ký
              </div>
            </div>

            {/* Thời gian khóa học */}
            <div className="lgd-modal-info-item item-dates">
              <div className="lgd-modal-info-header">
                <Calendar size={16} color="#7c3aed" />
                <span className="lgd-modal-label">Chu kỳ áp dụng</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>
                {item.NgayBatDau && item.NgayKetThuc ? (
                  <>Từ <strong>{formatDateVN(item.NgayBatDau)}</strong> đến <strong>{formatDateVN(item.NgayKetThuc)}</strong></>
                ) : item.NgayHoc ? (
                  <>Buổi học ngày: <strong>{formatDateVN(item.NgayHoc)}</strong></>
                ) : (
                  <span>Áp dụng theo kỳ học</span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.55rem 1.6rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
