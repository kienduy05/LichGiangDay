import React from 'react';
import {
  BookOpen, Edit2, Trash2, Eye, Network, Loader2, Layers, BookMarked
} from 'lucide-react';
import './MonHocComponents.css';

export default function MonHocTable({
  mhList = [],
  loading = false,
  error = '',
  selectedMhId = '',
  onViewDetail,
  onEdit,
  onDelete,
  hasPermission = () => true
}) {
  if (loading) {
    return (
      <div className="table-loading-cell" style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span style={{ color: 'var(--admin-text-sub)', fontSize: '0.9rem' }}>Đang tải danh sách môn học...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-banner error" style={{ margin: '16px' }}>
        <span>{error}</span>
      </div>
    );
  }

  if (mhList.length === 0) {
    return (
      <div className="table-empty-cell" style={{ padding: '50px 20px', textAlign: 'center' }}>
        <div style={{ color: '#94a3b8', marginBottom: '8px' }}>
          <BookOpen size={40} style={{ margin: '0 auto', opacity: 0.5 }} />
        </div>
        <p style={{ fontWeight: 600, color: 'var(--admin-text-main)', fontSize: '0.95rem' }}>
          Không tìm thấy môn học nào
        </p>
        <p style={{ color: 'var(--admin-text-sub)', fontSize: '0.82rem', marginTop: '4px' }}>
          Thử chọn nhánh khác trên cây thư mục hoặc thay đổi bộ lọc tìm kiếm.
        </p>
      </div>
    );
  }

  return (
    <div className="table-responsive" style={{ overflowX: 'auto' }}>
      <table className="custom-data-table">
        <thead>
          <tr>
            <th style={{ width: '45px', textAlign: 'center' }}>#</th>
            <th style={{ minWidth: '240px' }}>Môn Học</th>
            <th style={{ minWidth: '200px' }}>Đơn Vị Quản Lý</th>
            <th style={{ width: '120px', textAlign: 'center' }}>Số Tín Chỉ</th>
            <th style={{ width: '130px', textAlign: 'center' }}>Loại Môn</th>
            <th style={{ width: '140px', textAlign: 'center' }}>Lớp Học Phần</th>
            <th style={{ width: '120px', textAlign: 'center' }}>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {mhList.map((mh, index) => {
            const isSelected = selectedMhId === mh.MaMonHoc;
            const hasLhp = (mh.SoLopHocPhan || 0) > 0;

            return (
              <tr
                key={mh.MaMonHoc}
                className={isSelected ? 'row-selected' : ''}
                style={isSelected ? { backgroundColor: '#f0f7ff' } : {}}
              >
                {/* 1. STT */}
                <td style={{ textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '0.82rem' }}>
                  {index + 1}
                </td>

                {/* 2. Môn học */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="mh-icon-circle">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <div className="mh-name-title" title={mh.TenMonHoc}>
                        {mh.TenMonHoc}
                      </div>
                      <span className="mh-code-pill">
                        {mh.MaMonHoc}
                      </span>
                    </div>
                  </div>
                </td>

                {/* 3. Đơn vị */}
                <td>
                  <div className="mh-dept-cell">
                    <div className="mh-dept-bomon" title={mh.TenBoMon || 'Chưa phân bộ môn'}>
                      <Network size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px', color: '#0ea5e9' }} />
                      {mh.TenBoMon || <span style={{ color: '#94a3b8', fontWeight: 'normal', fontStyle: 'italic' }}>Chưa phân bộ môn</span>}
                    </div>
                    {mh.TenKhoa && (
                      <div className="mh-dept-khoa" title={mh.TenKhoa}>
                        {mh.TenKhoa}
                      </div>
                    )}
                  </div>
                </td>

                {/* 4. Số tín chỉ */}
                <td style={{ textAlign: 'center' }}>
                  {mh.SoTinChi != null ? (
                    <span className="mh-credits-badge">
                      {mh.SoTinChi} TC
                    </span>
                  ) : (
                    <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>
                  )}
                </td>

                {/* 5. Loại môn học */}
                <td style={{ textAlign: 'center' }}>
                  <span className="role-badge" style={{ fontSize: '0.78rem' }}>
                    {mh.LoaiMonHoc || 'Regular'}
                  </span>
                </td>

                {/* 6. Lớp học phần đang mở */}
                <td style={{ textAlign: 'center' }}>
                  {hasLhp ? (
                    <button
                      type="button"
                      className="mh-classes-badge"
                      onClick={() => onViewDetail(mh)}
                      title="Xem danh sách lớp học phần"
                    >
                      <Layers size={12} />
                      <span>{mh.SoLopHocPhan} lớp HP</span>
                    </button>
                  ) : (
                    <span className="mh-classes-badge empty" title="Chưa mở lớp học phần">
                      0 lớp HP
                    </span>
                  )}
                </td>

                {/* 7. Thao tác */}
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="action-btn view"
                      title="Xem danh sách lớp học phần của môn"
                      onClick={() => onViewDetail(mh)}
                    >
                      <Eye size={15} />
                    </button>

                    {hasPermission('MonHoc', 'CanUpdate') && (
                      <button
                        type="button"
                        className="action-btn edit"
                        title="Sửa thông tin môn học"
                        onClick={() => onEdit(mh)}
                      >
                        <Edit2 size={15} />
                      </button>
                    )}

                    {hasPermission('MonHoc', 'CanDelete') && (
                      <button
                        type="button"
                        className="action-btn delete"
                        title="Xóa môn học"
                        onClick={() => onDelete(mh)}
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
