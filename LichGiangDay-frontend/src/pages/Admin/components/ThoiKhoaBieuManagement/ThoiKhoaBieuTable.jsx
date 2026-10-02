import React from 'react';
import {
  Calendar, Clock, Building2, User, Users,
  Edit3, Plus, Trash2, CheckCircle2, AlertCircle,
  BookOpen, Layers, Sparkles
} from 'lucide-react';
import './ThoiKhoaBieuComponents.css';

const THU_MAP = {
  2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4',
  5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật'
};

export default function ThoiKhoaBieuTable({
  lopHocPhans = [],
  loading = false,
  onScheduleClick,
  onDeleteSchedule
}) {
  if (loading) {
    return (
      <div className="tkb-table-loading-card">
        <div className="loading-spinner-ring"></div>
        <span>Đang tải danh sách lớp học phần và thời khóa biểu...</span>
      </div>
    );
  }

  if (!lopHocPhans || lopHocPhans.length === 0) {
    return (
      <div className="tkb-table-empty-card">
        <BookOpen size={40} className="text-muted" />
        <h4>Không tìm thấy lớp học phần</h4>
        <p>Vui lòng thử chọn Khoa, Bộ môn hoặc đổi từ khóa tìm kiếm.</p>
      </div>
    );
  }

  return (
    <div className="tkb-table-wrapper">
      <table className="tkb-data-table">
        <thead>
          <tr>
            <th style={{ width: '45px' }}>#</th>
            <th style={{ width: '220px' }}>Lớp Học Phần</th>
            <th style={{ width: '180px' }}>Khoa / Bộ Môn</th>
            <th style={{ width: '100px' }}>Sĩ Số</th>
            <th style={{ width: '170px' }}>Giảng Viên</th>
            <th>Khung Thời Khóa Biểu (Lịch Học)</th>
            <th style={{ width: '130px', textAlign: 'center' }}>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {lopHocPhans.map((lhp, index) => {
            const hasSchedule = lhp.hasSchedule && lhp.schedules && lhp.schedules.length > 0;

            return (
              <tr key={lhp.MaLopHocPhan} className={`tkb-row ${hasSchedule ? 'row-scheduled' : 'row-unscheduled'}`}>
                
                {/* 1. STT */}
                <td className="text-center text-muted font-mono">{index + 1}</td>

                {/* 2. Lớp học phần */}
                <td>
                  <div className="lhp-cell-title">
                    <span className="lhp-course-name" title={lhp.TenLopHocPhan || lhp.TenMonHoc || lhp.MaMonHoc}>
                      {lhp.TenLopHocPhan || lhp.TenMonHoc || lhp.MaMonHoc}
                    </span>
                    {lhp.TenMonHoc && (
                      <span className="lhp-subject-sub" style={{ fontSize: '0.8rem', color: 'var(--admin-text-sub)' }}>
                        {lhp.TenMonHoc} {lhp.MaMonHoc ? `(${lhp.MaMonHoc})` : ''}
                      </span>
                    )}
                    <div className="lhp-cell-subtags">
                      <span className="code-pill font-mono">{lhp.MaLopHocPhan}</span>
                      <span className="credit-pill">{lhp.SoTinChi || 3} TC</span>
                      <span className={`type-pill ${lhp.LoaiHoc?.toLowerCase()}`}>{lhp.LoaiHoc || 'LT'}</span>
                    </div>
                  </div>
                </td>

                {/* 3. Khoa / Bộ môn */}
                <td>
                  <div className="dept-cell">
                    <span className="dept-name">{lhp.TenBoMon || lhp.MaBoMon}</span>
                    <span className="faculty-name">{lhp.TenKhoa || lhp.MaKhoa}</span>
                  </div>
                </td>

                {/* 4. Sĩ số */}
                <td>
                  <div className="siso-cell">
                    <span className="siso-val font-semibold">{lhp.SiSoDuKien || 50} SV</span>
                    {lhp.SiSoDangKy ? (
                      <span className="siso-registered text-muted font-xs">({lhp.SiSoDangKy} đk)</span>
                    ) : null}
                  </div>
                </td>

                {/* 5. Giảng viên */}
                <td>
                  <div className="gv-cell">
                    {lhp.TenGiangVien ? (
                      <div className="gv-assigned">
                        <User size={13} className="text-primary" />
                        <span>{lhp.TenGiangVien}</span>
                      </div>
                    ) : (
                      <span className="gv-unassigned text-muted font-xs">
                        Chưa phân công
                      </span>
                    )}
                  </div>
                </td>

                {/* 6. Khung Thời Khóa Biểu */}
                <td>
                  <div className="schedule-slots-container">
                    {hasSchedule ? (
                      <div className="schedule-badges-list">
                        {lhp.schedules.map((s, sIdx) => {
                          const thuStr = THU_MAP[s.ThuTrongTuan] || `Thứ ${s.ThuTrongTuan}`;
                          return (
                            <div key={s.MaThoiKhoaBieu || sIdx} className="schedule-badge-chip">
                              <span className="chip-thu">{thuStr}</span>
                              <span className="chip-tiet">{s.TenTiet || `Tiết ${s.MaTiet}`}</span>
                              <span className="chip-room">
                                <Building2 size={11} />
                                <strong>{s.TenPhong || s.MaPhong}</strong>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="unscheduled-warning-chip">
                        <AlertCircle size={13} />
                        <span>Chưa xếp lịch học</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* 7. Thao tác */}
                <td className="text-center">
                  <div className="action-buttons-group">
                    <button
                      type="button"
                      className={`btn-action-schedule ${hasSchedule ? 'edit' : 'add'}`}
                      onClick={() => onScheduleClick(lhp)}
                      title={hasSchedule ? 'Chỉnh sửa thời khóa biểu' : 'Xếp thời khóa biểu'}
                    >
                      {hasSchedule ? (
                        <>
                          <Edit3 size={13} />
                          <span>Sửa lịch</span>
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          <span>Xếp lịch</span>
                        </>
                      )}
                    </button>

                    {hasSchedule && (
                      <button
                        type="button"
                        className="btn-action-delete"
                        onClick={() => onDeleteSchedule(lhp)}
                        title="Xóa toàn bộ lịch của lớp này"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
