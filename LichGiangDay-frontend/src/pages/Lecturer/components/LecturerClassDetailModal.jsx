import {
  X, Calendar, Clock, Building, Users, BookOpen,
  User, RefreshCw, PlusCircle, AlertTriangle, Hash, School
} from 'lucide-react';
import '../../Admin/components/LichGiangDayManagement/LichGiangDayComponents.css';

export default function LecturerClassDetailModal({
  isOpen,
  onClose,
  item,
  onRequestDoiCa,
  onRequestBaoNghi,
  onRequestDayThay
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
                {thuLabels[item.ThuTrongTuan] || `Thứ ${item.ThuTrongTuan}`} • {item.TenTiet || `Tiết ${item.MaTiet}`}
              </span>
              {item.GioBatDau && item.GioKetThuc && (
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
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
                Từ <strong>{formatDateVN(item.NgayBatDau)}</strong> đến <strong>{formatDateVN(item.NgayKetThuc)}</strong>
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
