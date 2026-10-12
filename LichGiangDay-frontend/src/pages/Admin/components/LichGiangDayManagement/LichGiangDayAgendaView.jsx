import React, { useState } from 'react';
import {
  Calendar, Clock, User, Building, Users, BookOpen,
  CheckCircle, AlertCircle, Info, Sparkles, ChevronRight, Layers
} from 'lucide-react';
import './LichGiangDayComponents.css';

const PERIOD_ROWS = [
  { maTiet: 1, label: 'Tiết 1 - 3', time: '07:00 - 09:25', session: 'Sáng', sessionClass: 'sang' },
  { maTiet: 2, label: 'Tiết 4 - 6', time: '09:35 - 12:00', session: 'Sáng', sessionClass: 'sang' },
  { maTiet: 3, label: 'Tiết 7 - 9', time: '13:00 - 15:25', session: 'Chiều', sessionClass: 'chieu' },
  { maTiet: 4, label: 'Tiết 10 - 12', time: '15:35 - 18:00', session: 'Chiều', sessionClass: 'chieu' },
  { maTiet: 5, label: 'Tiết 13 - 16', time: '18:00 - 21:30', session: 'Tối', sessionClass: 'toi' },
];

export default function LichGiangDayAgendaView({
  matrixData = {},
  weekDays = [],
  onCardClick,
  todayDayOfWeek = 2
}) {
  const [selectedDayValue, setSelectedDayValue] = useState(todayDayOfWeek || 2);

  const selectedDayObj = weekDays.find(d => d.value === selectedDayValue) || weekDays[0] || {};
  const dayMatrix = matrixData[selectedDayValue] || {};

  const loaiHocLabels = {
    LT: 'Lý thuyết',
    TH: 'Thực hành',
    BT: 'Bài tập',
    BTL: 'Bài tập lớn'
  };

  // Group by sessions: Sáng, Chiều, Tối
  const sessionGroups = [
    {
      session: 'Ca Sáng',
      sessionClass: 'sang',
      timeRange: '07:00 - 12:00',
      periods: [1, 2]
    },
    {
      session: 'Ca Chiều',
      sessionClass: 'chieu',
      timeRange: '13:00 - 18:00',
      periods: [3, 4]
    },
    {
      session: 'Ca Tối',
      sessionClass: 'toi',
      timeRange: '18:00 - 21:30',
      periods: [5]
    }
  ];

  let totalDayClasses = 0;
  sessionGroups.forEach(g => {
    g.periods.forEach(p => {
      totalDayClasses += (dayMatrix[p] || []).length;
    });
  });

  return (
    <div className="lgd-agenda-container">
      {/* Day Selector Carousel */}
      <div className="lgd-day-picker-bar">
        {weekDays.map(d => {
          const isSelected = d.value === selectedDayValue;
          const isToday = d.value === todayDayOfWeek;
          return (
            <button
              key={d.value}
              className={`lgd-day-tab-btn ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedDayValue(d.value)}
            >
              <span className="lgd-day-tab-name">
                {d.label} {isToday && '★'}
              </span>
              <span className="lgd-day-tab-date">{d.displayDate}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Status Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} color="#3b82f6" />
          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b' }}>
            Lịch học {selectedDayObj.label} ({selectedDayObj.displayDate})
          </span>
          {selectedDayObj.value === todayDayOfWeek && (
            <span className="lgd-today-badge">Hôm nay</span>
          )}
        </div>

        <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
          Tổng số: <strong style={{ color: '#2563eb' }}>{totalDayClasses}</strong> lớp học đang diễn ra
        </div>
      </div>

      {/* Sessions Groups */}
      {totalDayClasses === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <Calendar size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
          <h4 style={{ margin: 0, color: '#334155' }}>Không có lịch học nào trong ngày này</h4>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.875rem' }}>
            Tất cả các phòng và giảng viên trong bộ môn đều trống lịch vào {selectedDayObj.label}.
          </p>
        </div>
      ) : (
        <div className="lgd-agenda-sessions">
          {sessionGroups.map(group => {
            const groupPeriods = PERIOD_ROWS.filter(p => group.periods.includes(p.maTiet));
            const groupClasses = [];
            groupPeriods.forEach(p => {
              const list = dayMatrix[p.maTiet] || [];
              list.forEach(item => {
                groupClasses.push({ ...item, periodInfo: p });
              });
            });

            if (groupClasses.length === 0) return null;

            return (
              <div key={group.session} className="lgd-agenda-session-group">
                <div className="lgd-session-title">
                  <span className={`lgd-period-session ${group.sessionClass}`}>
                    {group.session}
                  </span>
                  <span>{group.session}</span>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 'normal' }}>
                    ({group.timeRange})
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: '#3b82f6', fontWeight: 600 }}>
                    {groupClasses.length} lớp
                  </span>
                </div>

                <div className="lgd-agenda-cards-grid">
                  {groupClasses.map((item, idx) => {
                    const loaiClass = `loai-${(item.LoaiHoc || 'LT').toLowerCase()}`;
                    return (
                      <div
                        key={item.MaThoiKhoaBieu || idx}
                        className={`lgd-class-card ${loaiClass}`}
                        onClick={() => onCardClick && onCardClick(item)}
                        style={{ padding: '0.85rem' }}
                      >
                        <div className="lgd-card-header">
                          <span className="lgd-card-subject" style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }} title={item.TenLopHocPhan || item.TenMonHoc}>
                            {item.TenLopHocPhan || item.TenMonHoc}
                          </span>
                          <span className="lgd-card-tag">
                            {loaiHocLabels[item.LoaiHoc] || item.LoaiHoc || 'Lý thuyết'}
                          </span>
                        </div>

                        <div className="lgd-card-meta" style={{ marginTop: '0.4rem', gap: '0.35rem' }}>
                          <div className="lgd-card-meta-row">
                            <Clock size={14} color="#f59e0b" />
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>
                              {item.periodInfo?.label} ({item.periodInfo?.time})
                            </span>
                          </div>

                          <div className="lgd-card-meta-row">
                            <Building size={14} color="#0284c7" />
                            <span className="lgd-card-room">
                              Phòng {item.TenPhong || 'Chưa xếp'} ({item.TenToaNha || 'Khu giảng đường'})
                            </span>
                          </div>

                          <div className="lgd-card-meta-row">
                            <User size={14} color="#3b82f6" />
                            <span className="lgd-card-lecturer">
                              {item.TenGiangVien || 'Chưa phân công giảng viên'}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
