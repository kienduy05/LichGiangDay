import { Edit2, Trash2, UserCheck, Users } from 'lucide-react';

export default function LopHocPhanTable({
  list, hasPermission,
  onViewDetail, onEdit, onDelete, onAssign
}) {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

  return (
    <div className="lhp-card-list">
      {list.map(item => (
        <div key={item.MaLopHocPhan} className="lhp-card-item">
          {/* Header */}
          <div className="lhp-card-header">
            <div className="lhp-card-header-left">
              <span className="lhp-card-ma">{item.MaLopHocPhan}</span>
              <span className="lhp-card-tenmon">{item.TenMonHoc || item.MaMonHoc}</span>
              <div className="lhp-card-badges">
                <span className="lhp-badge loaihoc">{item.LoaiHoc}</span>
                
                {item.SoLopSinhVienGhep > 0 && (
                  <span className="lhp-badge count">
                    <Users size={11} /> {item.SoLopSinhVienGhep} lớp ghép
                  </span>
                )}
              </div>
            </div>
            <div className="lhp-card-actions" onClick={e => e.stopPropagation()}>
              {hasPermission('LopHocPhan', 'CanUpdate') }
              {hasPermission('LopHocPhan', 'CanUpdate') && (
                <button className="action-btn edit" title="Sửa" onClick={() => onEdit(item)}>
                  <Edit2 size={15} />
                </button>
              )}
              {hasPermission('LopHocPhan', 'CanDelete') && (
                <button className="action-btn delete" title="Xóa" onClick={() => onDelete(item)}>
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Body (clickable → detail) */}
          <div className="lhp-card-body" onClick={() => onViewDetail(item)} title="Xem chi tiết">
            <div className="lhp-card-field">
              <span className="lhp-field-label">Tên LHP</span>
              <span className="lhp-field-value">{item.TenLopHocPhan || '—'}</span>
            </div>
            
            <div className="lhp-card-field">
              <span className="lhp-field-label">Sĩ số</span>
              <span className="lhp-field-value">
                DK: {item.SiSoDuKien ?? '—'} / ĐK: {item.SiSoDangKy ?? '—'}
              </span>
            </div>
            <div className="lhp-card-field">
              <span className="lhp-field-label">Bộ môn</span>
              <span className="lhp-field-value">{item.TenBoMon || '—'}</span>
            </div>
            <div className="lhp-card-field">
              <span className="lhp-field-label">Khoảng ngày</span>
              <span className="lhp-field-value">
                {formatDate(item.NgayBatDau)} → {formatDate(item.NgayKetThuc)} ({item.SoTuan} tuần)
              </span>
            </div>
            <div className="lhp-card-field">
              <span className="lhp-field-label">Khóa</span>
              <span className="lhp-field-value muted">{item.TenKhoaSinhVien || item.KhoaHoc || '—'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
