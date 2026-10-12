import React from 'react';
import { Search, Clock, Building, User, AlertCircle, CheckCircle2, AlertTriangle, Layers, BookOpen } from 'lucide-react';
import './PhanCongGiangVien.css';

export default function PhanCongClassList({
  classes = [],
  selectedClass = null,
  onSelectClass,
  searchTerm = '',
  setSearchTerm,
  filterStatus = 'ALL',
  setFilterStatus,
  stats = {},
  loading = false
}) {
  const loaiHocLabels = {
    LT: 'Lý thuyết',
    TH: 'Thực hành',
    BT: 'Bài tập',
    BTL: 'Bài tập lớn'
  };

  const thuLabels = { 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5', 6: 'T6', 7: 'T7', 8: 'CN' };

  return (
    <div className="pcgv-master-panel">
      {/* Search & Filter Chips */}
      <div className="pcgv-master-header">
        <div className="pcgv-search-wrap">
          <Search size={14} className="pcgv-search-icon" />
          <input
            type="text"
            className="pcgv-search-input"
            placeholder="Tìm theo tên lớp, mã lớp, môn, GV..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="pcgv-filter-chips">
          <button
            className={`pcgv-chip-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterStatus('ALL')}
          >
            Tất cả ({stats.totalClasses || 0})
          </button>
          <button
            className={`pcgv-chip-btn chip-unassigned ${filterStatus === 'UNASSIGNED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('UNASSIGNED')}
          >
            Chưa phân ({stats.unassignedScheduledCount || 0})
          </button>
          <button
            className={`pcgv-chip-btn ${filterStatus === 'ASSIGNED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('ASSIGNED')}
          >
            Đã phân ({stats.assignedCount || 0})
          </button>
          <button
            className={`pcgv-chip-btn ${filterStatus === 'UNSCHEDULED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('UNSCHEDULED')}
          >
            Chưa có TKB ({stats.unscheduledCount || 0})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="pcgv-master-list">
        {loading && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
            Đang tải danh sách lớp học phần...
          </div>
        )}

        {!loading && classes.length === 0 && (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <Layers size={36} style={{ margin: '0 auto 0.5rem auto' }} />
            <p style={{ margin: 0, fontSize: '0.84rem' }}>Không có lớp học phần nào phù hợp</p>
          </div>
        )}

        {!loading && classes.map(item => {
          const isSelected = selectedClass?.MaLopHocPhan === item.MaLopHocPhan;
          const loaiTagClass = `tag-${(item.LoaiHoc || 'LT').toLowerCase()}`;

          return (
            <div
              key={item.MaLopHocPhan}
              className={`pcgv-master-item ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectClass(item)}
            >
              <div className="pcgv-item-header">
                <span className="pcgv-item-title">
                  {item.TenLopHocPhan || item.TenMonHoc}
                </span>
                <span className={`pcgv-item-tag ${loaiTagClass}`}>
                  {item.LoaiHoc || 'LT'}
                </span>
              </div>

              {/* Schedules Info */}
              {item.schedules && item.schedules.length > 0 ? (
                <div className="pcgv-item-schedules">
                  {item.schedules.map((sc, idx) => (
                    <div key={idx} className="pcgv-item-sched-row">
                      <Clock size={12} color="#4f46e5" />
                      <span><strong>{thuLabels[sc.ThuTrongTuan] || `T${sc.ThuTrongTuan}`}</strong> • {sc.TenTiet} ({sc.GioBatDau?.slice(0, 5)}-{sc.GioKetThuc?.slice(0, 5)})</span>
                      <span style={{ marginLeft: 'auto', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Building size={11} />
                        P.{sc.TenPhong}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.71875rem', color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={12} />
                  Chưa xếp lịch thời khóa biểu
                </div>
              )}

              {/* Status Footer */}
              <div className="pcgv-item-footer">
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {item.SoTinChi ? `${item.SoTinChi} TC` : ''} • {item.SiSoDangKy || item.SiSoDuKien || 0} SV
                </span>

                {item.isAssigned ? (
                  <span className="pcgv-status-pill status-assigned">
                    <CheckCircle2 size={12} />
                    {item.TenGiangVien}
                  </span>
                ) : item.hasSchedule ? (
                  <span className="pcgv-status-pill status-unassigned">
                    <AlertTriangle size={12} />
                    Chưa phân công
                  </span>
                ) : (
                  <span className="pcgv-status-pill status-noschedule">
                    Chờ xếp TKB
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
