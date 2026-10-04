import React from 'react';
import {
  X, BookOpen, User, Building, Users, Calendar, Clock,
  Layers, CheckCircle2, AlertCircle, Hash, School, AlertTriangle
} from 'lucide-react';
import './LichGiangDayComponents.css';

export default function LichGiangDayDetailModal({ isOpen, onClose, item }) {
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
  const siSo = Number(item.SiSoDangKy || item.SiSoDuKien || 0);
  const sucChua = Number(item.SucChua || 0);
  const isOverloaded = sucChua > 0 && siSo > sucChua;
  const isFull = sucChua > 0 && siSo === sucChua;

  return (
    <div className="lgd-modal-overlay" onClick={onClose}>
      <div className="lgd-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lgd-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Calendar size={20} />
            <h3 className="lgd-modal-title">Chi Tiết Lớp Học Phần & Lịch Học</h3>
          </div>
          <button className="lgd-modal-close" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="lgd-modal-body">
          {/* Main Info Hero Banner */}
          <div className="lgd-modal-hero">
            <div className="lgd-modal-hero-top">
              <span className="lgd-modal-class-code-badge" title="Mã lớp học phần">
                <Hash size={14} />
                {item.MaLopHocPhan}
              </span>
              <span className={`lgd-modal-type-badge type-${loaiHocCode}`}>
                {loaiHocLabels[item.LoaiHoc] || item.LoaiHoc || 'Lý thuyết'}
              </span>
            </div>

            {/* Prominently Display CLASS NAME as Primary Title */}
            <div className="lgd-modal-class-title-wrap">
              <span className="lgd-modal-label-small">Tên Lớp Học Phần</span>
              <h3 className="lgd-modal-class-name">
                {item.TenLopHocPhan || item.TenMonHoc || 'Chưa cập nhật tên lớp'}
              </h3>
            </div>

            {/* Highlighted Subject Information Sub-bar */}
            <div className="lgd-modal-subject-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#2563eb' }}>
                <BookOpen size={16} />
                <span style={{ fontSize: '0.78125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Môn học:
                </span>
              </div>
              <span className="lgd-modal-subject-name">
                {item.TenMonHoc || 'Chưa cập nhật'}
              </span>
              <span className="lgd-modal-subject-meta">
                <span>• Mã môn: <strong>{item.MaMonHoc || 'N/A'}</strong></span>
                {item.SoTinChi && <span>• <strong>{item.SoTinChi} Tín chỉ</strong></span>}
                {item.TenBoMon && <span>• {item.TenBoMon}</span>}
              </span>
            </div>
          </div>

          {/* Detailed Highlighted Info Grid */}
          <div className="lgd-modal-info-grid">
            {/* 1. Giảng viên */}
            <div className="lgd-modal-info-item item-lecturer">
              <div className="lgd-modal-info-header">
                <User size={16} color="#2563eb" />
                <span className="lgd-modal-label">Giảng viên giảng dạy</span>
              </div>
              <span className="lgd-highlight-name">
                {item.TenGiangVien || 'Chưa phân công giảng viên'}
              </span>
              <div style={{ fontSize: '0.78125rem', color: '#64748b' }}>
                Mã GV: <strong style={{ color: '#334155' }}>{item.MaGiangVien || 'N/A'}</strong>
                {item.TenBoMon && <span> • {item.TenBoMon}</span>}
              </div>
            </div>

            {/* 2. Phòng học & Tòa nhà */}
            <div className="lgd-modal-info-item item-room">
              <div className="lgd-modal-info-header">
                <Building size={16} color="#0284c7" />
                <span className="lgd-modal-label">Phòng học & Tòa nhà</span>
              </div>
              <div>
                <span className="lgd-highlight-room">
                  {item.TenPhong || 'Chưa xếp phòng'}
                </span>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                  {item.TenToaNha || item.MaToaNha || 'Khu giảng đường'}
                </span>
              </div>
              <div style={{ fontSize: '0.78125rem', color: '#64748b' }}>
                Loại phòng: <strong style={{ color: '#334155' }}>{item.LoaiPhong === 'TH' ? 'Thực hành máy tính' : 'Lý thuyết'}</strong>
                {item.SucChua && <span> • Sức chứa {item.SucChua} chỗ</span>}
              </div>
            </div>

            {/* 3. Lịch học & Khung giờ */}
            <div className="lgd-modal-info-item item-time">
              <div className="lgd-modal-info-header">
                <Clock size={16} color="#d97706" />
                <span className="lgd-modal-label">Lịch học trong tuần</span>
              </div>
              <span className="lgd-highlight-time">
                {thuLabels[item.ThuTrongTuan] || `Thứ ${item.ThuTrongTuan}`} • {item.TenTiet || `Tiết ${item.MaTiet}`}
              </span>
              {item.GioBatDau && item.GioKetThuc && (
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
                  Giờ học: {item.GioBatDau} - {item.GioKetThuc}
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', marginLeft: '0.4rem' }}>
                    ({item.MaTiet <= 2 ? 'Ca Sáng' : item.MaTiet <= 4 ? 'Ca Chiều' : 'Ca Tối'})
                  </span>
                </div>
              )}
            </div>

            {/* 4. Quy mô Sĩ số & Sức chứa */}
            <div className={`lgd-modal-info-item item-capacity ${isOverloaded ? 'overloaded' : ''}`}>
              <div className="lgd-modal-info-header">
                <Users size={16} color={isOverloaded ? '#dc2626' : '#059669'} />
                <span className="lgd-modal-label">Quy mô sĩ số</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isOverloaded ? '#dc2626' : '#0f172a' }}>
                  {siSo} SV
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  / Sức chứa {sucChua > 0 ? `${sucChua} chỗ` : 'N/A'}
                </span>
              </div>
              <div>
                {isOverloaded ? (
                  <span className="lgd-highlight-badge lgd-badge-danger">
                    <AlertTriangle size={12} />
                    Vượt quá sức chứa (+{siSo - sucChua} SV)
                  </span>
                ) : isFull ? (
                  <span className="lgd-highlight-badge lgd-badge-warning">
                    <AlertCircle size={12} />
                    Đã lấp đầy phòng học
                  </span>
                ) : sucChua > 0 ? (
                  <span className="lgd-highlight-badge lgd-badge-success">
                    <CheckCircle2 size={12} />
                    Còn {sucChua - siSo} chỗ trống
                  </span>
                ) : (
                  <span className="lgd-highlight-badge lgd-badge-blue">
                    Sĩ số dự kiến: {item.SiSoDuKien || siSo} SV
                  </span>
                )}
              </div>
            </div>

            {/* 5. Khoảng thời gian áp dụng */}
            <div className="lgd-modal-info-item item-dates" style={{ gridColumn: 'span 2' }}>
              <div className="lgd-modal-info-header">
                <Calendar size={16} color="#7c3aed" />
                <span className="lgd-modal-label">Thời gian áp dụng khóa học</span>
              </div>
              <div style={{ fontSize: '0.9375rem', color: '#1e293b' }}>
                Từ ngày <strong style={{ color: '#7c3aed' }}>{formatDateVN(item.NgayBatDau)}</strong> đến ngày <strong style={{ color: '#7c3aed' }}>{formatDateVN(item.NgayKetThuc)}</strong>
              </div>
            </div>

            {/* 6. Đơn vị quản lý */}
            {(item.TenKhoa || item.TenBoMon) && (
              <div className="lgd-modal-info-item" style={{ gridColumn: 'span 2', background: '#f8fafc', borderLeftColor: '#94a3b8' }}>
                <div className="lgd-modal-info-header">
                  <School size={16} color="#64748b" />
                  <span className="lgd-modal-label">Đơn vị phụ trách</span>
                </div>
                <div style={{ fontSize: '0.84rem', color: '#334155' }}>
                  {item.TenKhoa && <span><strong>{item.TenKhoa}</strong></span>}
                  {item.TenKhoa && item.TenBoMon && <span> • </span>}
                  {item.TenBoMon && <span>Bộ môn: <strong>{item.TenBoMon}</strong></span>}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.6rem 1.6rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#e2e8f0';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#334155';
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
