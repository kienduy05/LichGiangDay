import React from 'react';
import {
  User, Building, Users, Clock, BookOpen, Layers,
  Calendar, CheckCircle, AlertCircle, Info, Sparkles, Loader2
} from 'lucide-react';
import './LichGiangDayComponents.css';

const PERIOD_ROWS = [
  { maTiet: 1, label: 'Tiết 1 - 3', time: '07:00 - 09:25', session: 'Sáng', sessionClass: 'sang' },
  { maTiet: 2, label: 'Tiết 4 - 6', time: '09:35 - 12:00', session: 'Sáng', sessionClass: 'sang' },
  { maTiet: 3, label: 'Tiết 7 - 9', time: '13:00 - 15:25', session: 'Chiều', sessionClass: 'chieu' },
  { maTiet: 4, label: 'Tiết 10 - 12', time: '15:35 - 18:00', session: 'Chiều', sessionClass: 'chieu' },
  { maTiet: 5, label: 'Tiết 13 - 16', time: '18:00 - 21:30', session: 'Tối', sessionClass: 'toi' },
];

export default function LichGiangDayMatrixGrid({
  matrixData = {},
  weekDays = [],
  onCardClick,
  onOpenSlotModal,
  todayDayOfWeek = null,
  loading = false
}) {
  const loaiHocLabels = {
    LT: 'LT',
    TH: 'TH',
    BT: 'BT',
    BTL: 'BTL'
  };

  return (
    <div className="lgd-matrix-wrapper">
      {loading && (
        <div style={{
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          color: '#3b82f6'
        }}>
          <Loader2 size={32} className="animate-spin" />
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#475569' }}>
            Đang tải dữ liệu lịch giảng dạy...
          </span>
        </div>
      )}

      {!loading && (
        <table className="lgd-matrix-table">
          <thead>
            <tr>
              <th className="lgd-th-period">Ca / Tiết Học</th>
              {weekDays.map(d => {
                const isToday = d.value === todayDayOfWeek;
                return (
                  <th key={d.value} className={`lgd-th-day ${isToday ? 'is-today' : ''}`}>
                    <div className="lgd-day-name">{d.label}</div>
                    <div className="lgd-day-date">{d.displayDate}</div>
                    {isToday && <span className="lgd-today-badge">Hôm nay</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PERIOD_ROWS.map(period => (
              <tr key={period.maTiet}>
                {/* Period Column */}
                <td className="lgd-td-period">
                  <span className={`lgd-period-session ${period.sessionClass}`}>
                    {period.session}
                  </span>
                  <div className="lgd-period-name">{period.label}</div>
                  <div className="lgd-period-time">{period.time}</div>
                </td>

                {/* Day Columns */}
                {weekDays.map(d => {
                  const items = matrixData[d.value]?.[period.maTiet] || [];
                  const isTodayCol = d.value === todayDayOfWeek;

                  return (
                    <td key={d.value} className={`lgd-td-cell ${isTodayCol ? 'is-today-col' : ''}`}>
                      {items.length === 0 ? (
                        <div className="lgd-empty-cell">Trống</div>
                      ) : (
                        <div className="lgd-cell-cards">
                          {items.length > 1 && (
                            <div
                              className="lgd-cell-count-badge"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenSlotModal && onOpenSlotModal({
                                  dayLabel: d.label,
                                  dayDate: d.displayDate,
                                  periodLabel: period.label,
                                  time: period.time,
                                  classes: items
                                });
                              }}
                              title={`Xem toàn bộ ${items.length} lớp học song song`}
                            >
                              <Layers size={11} />
                              <span>{items.length} lớp song song</span>
                            </div>
                          )}

                          {items.slice(0, 2).map((item, idx) => {
                            const loaiClass = `loai-${(item.LoaiHoc || 'LT').toLowerCase()}`;
                            return (
                              <div
                                key={item.MaThoiKhoaBieu || idx}
                                className={`lgd-class-card ${loaiClass}`}
                                onClick={() => onCardClick && onCardClick(item)}
                                title="Nhấp để xem chi tiết lớp học"
                              >
                                <div className="lgd-card-header">
                                  <span className="lgd-card-subject" title={item.TenLopHocPhan || item.TenMonHoc}>
                                    {item.TenLopHocPhan || item.TenMonHoc}
                                  </span>
                                  <span className="lgd-card-tag">
                                    {loaiHocLabels[item.LoaiHoc] || item.LoaiHoc || 'LT'}
                                  </span>
                                </div>

                                <div className="lgd-card-meta">
                                  <div className="lgd-card-meta-row">
                                    <User size={12} color="#3b82f6" />
                                    <span className="lgd-card-lecturer">
                                      {item.TenGiangVien || 'Chưa phân công'}
                                    </span>
                                  </div>
                                  <div className="lgd-card-meta-row">
                                    <Building size={12} color="#0284c7" />
                                    <span className="lgd-card-room">
                                      {item.TenPhong || 'Chưa xếp phòng'}
                                    </span>
                                    {item.SiSoDangKy ? (
                                      <span style={{ marginLeft: 'auto', color: '#64748b' }}>
                                        {item.SiSoDangKy} SV
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {items.length > 2 && (
                            <button
                              type="button"
                              className="lgd-btn-more-classes"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenSlotModal && onOpenSlotModal({
                                  dayLabel: d.label,
                                  dayDate: d.displayDate,
                                  periodLabel: period.label,
                                  time: period.time,
                                  classes: items
                                });
                              }}
                            >
                              + Xem thêm {items.length - 2} lớp khác
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
