import React from 'react';
import {
  User, Clock, Building2, Users, BookOpen, Layers,
  Calendar, CheckCircle, AlertCircle, Info, Loader2
} from 'lucide-react';
import './LichGiangDayComponents.css';

const PERIOD_ROWS = [
  { maTiet: 1, label: 'Tiết 1 - 3', time: '07:00 - 09:25', session: 'Sáng', sessionClass: 'sang' },
  { maTiet: 2, label: 'Tiết 4 - 6', time: '09:35 - 12:00', session: 'Sáng', sessionClass: 'sang' },
  { maTiet: 3, label: 'Tiết 7 - 9', time: '13:00 - 15:25', session: 'Chiều', sessionClass: 'chieu' },
  { maTiet: 4, label: 'Tiết 10 - 12', time: '15:35 - 18:00', session: 'Chiều', sessionClass: 'chieu' },
  { maTiet: 5, label: 'Tiết 13 - 16', time: '18:00 - 21:30', session: 'Tối', sessionClass: 'toi' },
];

export default function LichGiangDayLecturerGrid({
  rawList = [],
  giangVienList = [],
  selectedBoMonId = '',
  scopedBoMonId = '',
  isBoMonRole = false,
  weekDays = [],
  onCardClick,
  todayDayOfWeek = null,
  loading = false
}) {
  // Lọc giảng viên theo bộ môn đang chọn
  const effectiveBoMon = isBoMonRole ? scopedBoMonId : selectedBoMonId;
  const filteredLecturers = effectiveBoMon
    ? giangVienList.filter(g => g.MaBoMon === effectiveBoMon)
    : giangVienList;

  // Xây dựng map tra cứu: gvMatrix[maGiangVien][thu][maTiet] -> item
  const gvMatrix = React.useMemo(() => {
    const map = {};
    rawList.forEach(item => {
      if (item.MaGiangVien) {
        if (!map[item.MaGiangVien]) map[item.MaGiangVien] = {};
        if (!map[item.MaGiangVien][item.ThuTrongTuan]) map[item.MaGiangVien][item.ThuTrongTuan] = {};
        map[item.MaGiangVien][item.ThuTrongTuan][item.MaTiet] = item;
      }
    });
    return map;
  }, [rawList]);

  const loaiHocLabels = {
    LT: 'LT',
    TH: 'TH',
    BT: 'BT',
    BTL: 'BTL'
  };

  return (
    <div className="lgd-matrix-wrapper">
      {loading && (
        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#3b82f6' }}>
          <Loader2 size={32} className="animate-spin" />
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#475569' }}>
            Đang tải lịch theo giảng viên...
          </span>
        </div>
      )}

      {!loading && filteredLecturers.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <User size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
          <h4 style={{ margin: 0, color: '#334155' }}>Không tìm thấy giảng viên nào phù hợp</h4>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.875rem' }}>
            Vui lòng chọn Bộ môn khác hoặc thêm mới giảng viên.
          </p>
        </div>
      )}

      {!loading && filteredLecturers.length > 0 && (
        <table className="lgd-matrix-table" style={{ minWidth: '1180px' }}>
          <thead>
            <tr>
              <th style={{ width: '145px' }} className="lgd-th-period">
                Giảng Viên
              </th>
              <th style={{ width: '85px' }} className="lgd-th-period">
                Ca / Tiết
              </th>
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
            {filteredLecturers.map(gv => (
              <React.Fragment key={gv.MaGiangVien}>
                {PERIOD_ROWS.map((period, pIdx) => (
                  <tr key={`${gv.MaGiangVien}-${period.maTiet}`}>
                    {/* Lecturer cell (merged row on first period) */}
                    {pIdx === 0 && (
                      <td
                        rowSpan={PERIOD_ROWS.length}
                        className="lgd-td-period"
                        style={{ background: '#f8fafc', verticalAlign: 'middle', borderRight: '2px solid #cbd5e1' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {gv.HoTen?.charAt(0) || 'G'}
                          </div>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>
                            {gv.HoTen}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {gv.MaGiangVien}
                          </span>
                          {gv.TenBoMon && (
                            <span style={{ fontSize: '0.6875rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                              {gv.TenBoMon}
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Period info */}
                    <td className="lgd-td-period" style={{ padding: '0.4rem', fontSize: '0.75rem' }}>
                      <span className={`lgd-period-session ${period.sessionClass}`} style={{ fontSize: '0.65rem' }}>
                        {period.session}
                      </span>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{period.label}</div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{period.time}</div>
                    </td>

                    {/* Day Cells */}
                    {weekDays.map(d => {
                      const item = gvMatrix[gv.MaGiangVien]?.[d.value]?.[period.maTiet];
                      const isTodayCol = d.value === todayDayOfWeek;

                      return (
                        <td key={d.value} className={`lgd-td-cell ${isTodayCol ? 'is-today-col' : ''}`} style={{ minHeight: '80px', height: '80px' }}>
                          {!item ? (
                            <div className="lgd-empty-cell" style={{ minHeight: '50px' }}>Trống</div>
                          ) : (
                            <div
                              className={`lgd-class-card loai-${(item.LoaiHoc || 'LT').toLowerCase()}`}
                              onClick={() => onCardClick && onCardClick(item)}
                              style={{ padding: '0.45rem 0.55rem', height: '100%', boxSizing: 'border-box' }}
                              title="Nhấp để xem chi tiết lớp học"
                            >
                              <div className="lgd-card-header">
                                <span className="lgd-card-subject" style={{ fontSize: '0.78125rem' }} title={item.TenLopHocPhan || item.TenMonHoc}>
                                  {item.TenLopHocPhan || item.TenMonHoc}
                                </span>
                                <span className="lgd-card-tag">
                                  {loaiHocLabels[item.LoaiHoc] || item.LoaiHoc || 'LT'}
                                </span>
                              </div>

                              <div className="lgd-card-meta" style={{ marginTop: '0.25rem', gap: '0.15rem' }}>
                                <div className="lgd-card-meta-row">
                                  <Building2 size={11} color="#0284c7" />
                                  <span className="lgd-card-room" style={{ fontSize: '0.7rem' }}>
                                    Phòng {item.TenPhong || 'Chưa xếp'}
                                  </span>
                                </div>
                                <div className="lgd-card-meta-row" style={{ justifyContent: 'space-between', fontSize: '0.6875rem', color: '#64748b' }}>
                                  <span>{item.SiSoDangKy || item.SiSoDuKien || 0} SV</span>
                                  <span>{item.TenBoMon || ''}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
