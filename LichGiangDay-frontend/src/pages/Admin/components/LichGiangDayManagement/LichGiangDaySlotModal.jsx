import React from 'react';
import {
  X, Calendar, Clock, User, Building, Users, BookOpen, Layers
} from 'lucide-react';
import './LichGiangDayComponents.css';

export default function LichGiangDaySlotModal({
  isOpen,
  onClose,
  slotInfo = { dayLabel: '', dayDate: '', periodLabel: '', time: '', classes: [] },
  onClassClick
}) {
  if (!isOpen || !slotInfo) return null;

  const loaiHocLabels = {
    LT: 'Lý thuyết',
    TH: 'Thực hành',
    BT: 'Bài tập',
    BTL: 'Bài tập lớn'
  };

  return (
    <div className="lgd-modal-overlay" onClick={onClose}>
      <div className="lgd-modal-content" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lgd-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={20} />
            <div>
              <h3 className="lgd-modal-title">
                Danh sách lớp học song song ({slotInfo.classes?.length || 0} lớp)
              </h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78125rem', color: 'rgba(255,255,255,0.85)' }}>
                {slotInfo.dayLabel} ({slotInfo.dayDate}) • {slotInfo.periodLabel} ({slotInfo.time})
              </p>
            </div>
          </div>
          <button className="lgd-modal-close" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="lgd-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {slotInfo.classes?.map((item, idx) => {
              const loaiClass = `loai-${(item.LoaiHoc || 'LT').toLowerCase()}`;
              return (
                <div
                  key={item.MaThoiKhoaBieu || idx}
                  className={`lgd-class-card ${loaiClass}`}
                  style={{ padding: '0.85rem', cursor: 'pointer' }}
                  onClick={() => {
                    onClose();
                    onClassClick && onClassClick(item);
                  }}
                  title="Nhấp để xem chi tiết đầy đủ"
                >
                  <div className="lgd-card-header">
                    <span className="lgd-card-subject" style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                      {item.TenLopHocPhan || item.TenMonHoc}
                    </span>
                    <span className="lgd-card-tag">
                      {loaiHocLabels[item.LoaiHoc] || item.LoaiHoc || 'LT'}
                    </span>
                  </div>

                  <div className="lgd-card-meta" style={{ marginTop: '0.4rem', gap: '0.3rem' }}>
                    <div className="lgd-card-meta-row">
                      <Building size={13} color="#0284c7" />
                      <span className="lgd-card-room">
                        Phòng {item.TenPhong || 'Chưa xếp'} ({item.TenToaNha || 'Khu A'})
                      </span>
                    </div>

                    <div className="lgd-card-meta-row">
                      <User size={13} color="#3b82f6" />
                      <span className="lgd-card-lecturer">
                        {item.TenGiangVien || 'Chưa phân công GV'}
                      </span>
                    </div>

                    <div className="lgd-card-meta-row" style={{ justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Sĩ số: <strong>{item.SiSoDangKy || item.SiSoDuKien || 0} SV</strong></span>
                      {item.TenBoMon && <span>{item.TenBoMon}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
