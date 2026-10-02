import React from 'react';
import {
  X, BookOpen, User, Building, Users, Calendar, Clock,
  Layers, CheckCircle2, AlertCircle, Hash
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

  return (
    <div className="lgd-modal-overlay" onClick={onClose}>
      <div className="lgd-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lgd-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={20} />
            <h3 className="lgd-modal-title">Chi Tiết Lịch Giảng Dạy</h3>
          </div>
          <button className="lgd-modal-close" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="lgd-modal-body">
          {/* Main Info Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
            border: '1px solid #dbeafe',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563eb' }}>
                {item.MaLopHocPhan}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                background: '#dbeafe',
                color: '#1d4ed8'
              }}>
                {loaiHocLabels[item.LoaiHoc] || item.LoaiHoc || 'Lý thuyết'}
              </span>
            </div>
            <h4 style={{ margin: '0.2rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              {item.TenMonHoc || item.TenLopHocPhan || 'Chưa cập nhật tên môn'}
            </h4>
            <div style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span>Mã môn: <strong>{item.MaMonHoc || 'N/A'}</strong></span>
              {item.SoTinChi && <span>Số tín chỉ: <strong>{item.SoTinChi} TC</strong></span>}
              {item.TenBoMon && <span>Bộ môn: <strong>{item.TenBoMon}</strong></span>}
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="lgd-modal-info-grid">
            <div className="lgd-modal-info-item">
              <span className="lgd-modal-label">Giảng viên giảng dạy</span>
              <span className="lgd-modal-value" style={{ color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={16} color="#3b82f6" />
                {item.TenGiangVien || 'Chưa phân công giảng viên'}
              </span>
            </div>

            <div className="lgd-modal-info-item">
              <span className="lgd-modal-label">Phòng học & Tòa nhà</span>
              <span className="lgd-modal-value" style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building size={16} color="#0284c7" />
                {item.TenPhong ? `${item.TenPhong} (${item.TenToaNha || 'Khu giảng đường'})` : 'Chưa xếp phòng'}
              </span>
            </div>

            <div className="lgd-modal-info-item">
              <span className="lgd-modal-label">Khung thời gian & Tiết</span>
              <span className="lgd-modal-value">
                {thuLabels[item.ThuTrongTuan] || `Thứ ${item.ThuTrongTuan}`}, {item.TenTiet || `Tiết ${item.MaTiet}`}
                {item.GioBatDau && item.GioKetThuc && (
                  <span style={{ fontSize: '0.8125rem', color: '#64748b', display: 'block', fontWeight: 'normal' }}>
                    ({item.GioBatDau} - {item.GioKetThuc})
                  </span>
                )}
              </span>
            </div>

            <div className="lgd-modal-info-item">
              <span className="lgd-modal-label">Quy mô sĩ số</span>
              <span className="lgd-modal-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={16} color="#64748b" />
                {item.SiSoDangKy ? `${item.SiSoDangKy} SV đăng ký` : `${item.SiSoDuKien || 0} SV dự kiến`}
                {item.SucChua && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>
                    / Sức chứa {item.SucChua}
                  </span>
                )}
              </span>
            </div>

            <div className="lgd-modal-info-item" style={{ gridColumn: 'span 2' }}>
              <span className="lgd-modal-label">Khoảng thời gian áp dụng</span>
              <span className="lgd-modal-value" style={{ fontSize: '0.875rem' }}>
                Từ ngày <strong>{item.NgayBatDau || 'N/A'}</strong> đến ngày <strong>{item.NgayKetThuc || 'N/A'}</strong>
              </span>
            </div>
          </div>

          {/* Footer Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.6rem 1.4rem',
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
