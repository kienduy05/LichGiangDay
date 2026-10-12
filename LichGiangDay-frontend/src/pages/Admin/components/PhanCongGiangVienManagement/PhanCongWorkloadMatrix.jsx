import React, { useState } from 'react';
import { Users, Search, BookOpen, Clock, Eye, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';
import './PhanCongGiangVien.css';

export default function PhanCongWorkloadMatrix({
  workloadData = null,
  loading = false,
  onPreviewSchedule
}) {
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="pcgv-workload-wrapper" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        Đang tải bảng thống kê tải giảng dạy của bộ môn...
      </div>
    );
  }

  const list = workloadData?.workloadList || [];
  const filtered = searchTerm
    ? list.filter(w => w.HoTen.toLowerCase().includes(searchTerm.toLowerCase()) || w.MaGiangVien.toLowerCase().includes(searchTerm.toLowerCase()))
    : list;

  return (
    <div className="pcgv-workload-wrapper">
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <BarChart3 size={20} color="#4f46e5" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Bảng Theo Dõi & Cân Bằng Tải Giảng Dạy Bộ Môn
            </h3>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78125rem', color: '#64748b' }}>
              Định mức chuẩn: 12 tiết/tuần • Giúp Trưởng bộ môn cân bằng khối lượng giảng dạy giữa các giảng viên
            </p>
          </div>
        </div>

        <div className="pcgv-search-wrap" style={{ width: '250px' }}>
          <Search size={14} className="pcgv-search-icon" />
          <input
            type="text"
            className="pcgv-search-input"
            placeholder="Tìm giảng viên..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="pcgv-workload-table">
          <thead>
            <tr>
              <th style={{ width: '220px' }}>Giảng Viên</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Số Lớp Đã Nhận</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Số Tiết / Tuần</th>
              <th style={{ width: '200px' }}>Tỷ Lệ Định Mức (12 Tiết)</th>
              <th>Danh Sách Lớp Học Phần Đang Phụ Trách</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  Không tìm thấy giảng viên nào
                </td>
              </tr>
            ) : (
              filtered.map(gv => {
                let fillClass = 'quota-good';
                if (gv.quotaPercent < 70) fillClass = 'quota-low';
                if (gv.quotaPercent > 125) fillClass = 'quota-over';

                return (
                  <tr key={gv.MaGiangVien}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{gv.HoTen}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{gv.Email || gv.MaGiangVien}</div>
                    </td>

                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>
                      {gv.totalClasses} lớp
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        background: gv.totalPeriodsPerWeek > 0 ? '#eef2ff' : '#f1f5f9',
                        color: gv.totalPeriodsPerWeek > 0 ? '#4338ca' : '#64748b'
                      }}>
                        {gv.totalPeriodsPerWeek} tiết/tuần
                      </span>
                    </td>

                    <td>
                      <div className="pcgv-quota-bar-wrap">
                        <div className="pcgv-quota-track">
                          <div
                            className={`pcgv-quota-fill ${fillClass}`}
                            style={{ width: `${Math.min(gv.quotaPercent, 100)}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '0.78125rem', fontWeight: 700, color: '#334155' }}>
                          {gv.quotaPercent}%
                        </span>
                      </div>
                    </td>

                    <td>
                      {gv.classList.length === 0 ? (
                        <span style={{ color: '#cbd5e1', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          Chưa được phân công lớp nào
                        </span>
                      ) : (
                        <div className="pcgv-class-chip-list">
                          {gv.classList.map((c, cIdx) => (
                            <div key={cIdx} className="pcgv-mini-class-chip" title={`${c.tenLopHocPhan} (${c.soTinChi} TC)`}>
                              <strong>{c.tenLopHocPhan || c.tenMonHoc}</strong>
                              {c.slots && c.slots.length > 0 && (
                                <span style={{ color: '#6366f1' }}>
                                  ({c.slots.map(s => `${s.thuLabel} ${s.tietLabel}`).join(', ')})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="pcgv-btn-preview-sched"
                        onClick={() => onPreviewSchedule(gv.MaGiangVien, gv.HoTen)}
                        title="Xem thời khóa biểu tuần"
                      >
                        <Eye size={13} />
                        <span>Xem TKB</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
