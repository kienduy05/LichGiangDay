import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Building, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { apiGetLecturerWeeklySchedule } from '../../../../utils/apiPhanCongGiangVien';

const PERIOD_ROWS = [
  { maTiet: 1, label: 'Tiết 1 - 3', time: '07:00 - 09:25', session: 'Sáng', sessionClass: 'sang' },
  { maTiet: 2, label: 'Tiết 4 - 6', time: '09:35 - 12:00', session: 'Sáng', sessionClass: 'sang' },
  { maTiet: 3, label: 'Tiết 7 - 9', time: '13:00 - 15:25', session: 'Chiều', sessionClass: 'chieu' },
  { maTiet: 4, label: 'Tiết 10 - 12', time: '15:35 - 18:00', session: 'Chiều', sessionClass: 'chieu' },
  { maTiet: 5, label: 'Tiết 13 - 16', time: '18:00 - 21:30', session: 'Tối', sessionClass: 'toi' },
];

const WEEK_DAYS = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
  { value: 8, label: 'Chủ nhật' },
];

export default function PhanCongLecturerScheduleModal({
  isOpen,
  onClose,
  maGiangVien,
  maHocKy,
  lecturerName = ''
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !maGiangVien || !maHocKy) return;

    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGetLecturerWeeklySchedule({ maGiangVien, maHocKy });
        setData(res);
      } catch (err) {
        setError(err.message || 'Không thể tải lịch tuần của giảng viên.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [isOpen, maGiangVien, maHocKy]);

  if (!isOpen) return null;

  return (
    <div className="lgd-modal-overlay" onClick={onClose}>
      <div
        className="lgd-modal-content"
        style={{ maxWidth: '850px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="lgd-modal-header" style={{ background: 'linear-gradient(135deg, #4f46e5, #3730a3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={22} />
            <div>
              <h3 className="lgd-modal-title">
                Thời Khóa Biểu Tuần: {data?.lecturer?.HoTen || lecturerName || maGiangVien}
              </h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78125rem', color: 'rgba(255,255,255,0.85)' }}>
                {data ? `${data.totalClasses} lớp đã nhận • Tổng ${data.totalPeriodsPerWeek} tiết/tuần` : 'Đang tải thông tin...'}
              </p>
            </div>
          </div>
          <button className="lgd-modal-close" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="lgd-modal-body" style={{ padding: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#4f46e5' }}>
              <Loader2 size={32} className="animate-spin" />
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Đang tải ma trận lịch tuần...</span>
            </div>
          )}

          {error && (
            <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && data && (
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '0.65rem 0.5rem', border: '1px solid #e2e8f0', width: '110px', textAlign: 'center', color: '#475569' }}>
                      Tiết / Ca
                    </th>
                    {WEEK_DAYS.map(d => (
                      <th key={d.value} style={{ padding: '0.65rem 0.5rem', border: '1px solid #e2e8f0', textAlign: 'center', color: '#1e293b' }}>
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIOD_ROWS.map(period => (
                    <tr key={period.maTiet}>
                      <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center', background: '#f8fafc', fontWeight: 600 }}>
                        <div style={{ fontSize: '0.78125rem' }}>{period.label}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{period.time}</div>
                      </td>
                      {WEEK_DAYS.map(d => {
                        const items = data.matrix?.[d.value]?.[period.maTiet] || [];
                        return (
                          <td
                            key={d.value}
                            style={{
                              padding: '0.4rem',
                              border: '1px solid #e2e8f0',
                              verticalAlign: 'top',
                              background: items.length > 0 ? '#eef2ff' : '#ffffff',
                              minWidth: '95px',
                              minHeight: '60px'
                            }}
                          >
                            {items.length === 0 ? (
                              <div style={{ color: '#cbd5e1', fontSize: '0.71875rem', textAlign: 'center', padding: '0.5rem 0' }}>
                                Trống
                              </div>
                            ) : (
                              items.map((it, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    background: '#ffffff',
                                    border: '1px solid #c7d2fe',
                                    borderLeft: '3px solid #4f46e5',
                                    borderRadius: '6px',
                                    padding: '0.35rem 0.45rem',
                                    marginBottom: '0.3rem',
                                    fontSize: '0.71875rem'
                                  }}
                                >
                                  <div style={{ fontWeight: 700, color: '#1e293b' }}>
                                    {it.TenLopHocPhan || it.TenMonHoc}
                                  </div>
                                  <div style={{ color: '#0284c7', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <Building size={10} />
                                    <span>P.{it.TenPhong}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.45rem 1.1rem',
              fontSize: '0.84rem',
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
