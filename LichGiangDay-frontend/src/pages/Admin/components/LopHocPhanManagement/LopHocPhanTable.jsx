import React from 'react';
import {
  Edit2, Trash2, Eye, Users, BookOpen, Network, Calendar,
  CheckCircle2, Clock
} from 'lucide-react';
import './LopHocPhanComponents.css';

export default function LopHocPhanTable({
  list = [],
  hasPermission = () => true,
  onViewDetail,
  onEdit,
  onDelete
}) {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

  return (
    <div className="table-responsive" style={{ overflowX: 'auto' }}>
      <table className="custom-data-table">
        <thead>
          <tr>
            <th style={{ width: '45px', textAlign: 'center' }}>#</th>
            <th style={{ minWidth: '220px' }}>Lớp Học Phần</th>
            <th style={{ minWidth: '200px' }}>Môn Học</th>
            <th style={{ minWidth: '180px' }}>Đơn Vị Quản Lý</th>
            <th style={{ width: '90px', textAlign: 'center' }}>Hình Thức</th>
            <th style={{ width: '130px', textAlign: 'center' }}>Sĩ Số (ĐK/DK)</th>
            <th style={{ width: '150px' }}>Thời Gian</th>
            <th style={{ width: '110px', textAlign: 'center' }}>Lớp Ghép</th>
            <th style={{ width: '110px', textAlign: 'center' }}>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item, index) => {
            const hasGhep = (item.SoLopSinhVienGhep || 0) > 0;

            return (
              <tr key={item.MaLopHocPhan}>
                {/* 1. STT */}
                <td style={{ textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '0.82rem' }}>
                  {index + 1}
                </td>

                {/* 2. Lớp Học Phần */}
                <td>
                  <div className="lhp-name-cell">
                    <span className="lhp-code-pill">{item.MaLopHocPhan}</span>
                    <div className="lhp-name-text" title={item.TenLopHocPhan || item.MaLopHocPhan}>
                      {item.TenLopHocPhan || item.MaLopHocPhan}
                    </div>
                  </div>
                </td>

                {/* 3. Môn học */}
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--admin-text-main)', fontSize: '0.88rem' }}>
                    {item.TenMonHoc || item.MaMonHoc}
                  </div>
                  <div style={{ color: 'var(--admin-text-sub)', fontSize: '0.78rem' }}>
                    Mã MH: {item.MaMonHoc} {item.SoTinChi ? `• ${item.SoTinChi} TC` : ''}
                  </div>
                </td>

                {/* 4. Đơn vị */}
                <td>
                  <div className="lhp-dept-cell">
                    <div className="lhp-dept-bomon" title={item.TenBoMon || 'Chưa phân bộ môn'}>
                      <Network size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px', color: '#0ea5e9' }} />
                      {item.TenBoMon || <span style={{ color: '#94a3b8', fontWeight: 'normal', fontStyle: 'italic' }}>Chưa phân bộ môn</span>}
                    </div>
                    {item.TenKhoa && (
                      <div className="lhp-dept-khoa" title={item.TenKhoa}>
                        {item.TenKhoa}
                      </div>
                    )}
                  </div>
                </td>

                {/* 5. Hình thức */}
                <td style={{ textAlign: 'center' }}>
                  <span className="role-badge" style={{ fontSize: '0.76rem' }}>
                    {item.LoaiHoc || 'LT'}
                  </span>
                </td>

                {/* 6. Sĩ số */}
                <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                  <b>{item.SiSoDangKy ?? 0}</b>
                  <span style={{ color: 'var(--admin-text-sub)' }}> / {item.SiSoDuKien ?? '—'}</span>
                </td>

                {/* 7. Thời gian */}
                <td style={{ fontSize: '0.82rem', color: 'var(--admin-text-sub)' }}>
                  <div>{formatDate(item.NgayBatDau)} → {formatDate(item.NgayKetThuc)}</div>
                  {item.SoTuan && (
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({item.SoTuan} tuần)</span>
                  )}
                </td>

                {/* 8. Lớp ghép */}
                <td style={{ textAlign: 'center' }}>
                  {hasGhep ? (
                    <span className="role-badge primary" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Users size={11} /> {item.SoLopSinhVienGhep}
                    </span>
                  ) : (
                    <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>
                  )}
                </td>

                {/* 9. Thao tác */}
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="action-btn view"
                      title="Xem chi tiết lớp học phần"
                      onClick={() => onViewDetail(item)}
                    >
                      <Eye size={15} />
                    </button>

                    {hasPermission('LopHocPhan', 'CanUpdate') && (
                      <button
                        type="button"
                        className="action-btn edit"
                        title="Sửa thông tin"
                        onClick={() => onEdit(item)}
                      >
                        <Edit2 size={15} />
                      </button>
                    )}

                    {hasPermission('LopHocPhan', 'CanDelete') && (
                      <button
                        type="button"
                        className="action-btn delete"
                        title="Xóa lớp học phần"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 size={15} />
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
