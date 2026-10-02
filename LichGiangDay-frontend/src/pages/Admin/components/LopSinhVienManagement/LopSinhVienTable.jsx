import React from 'react';
import {
  Users, Edit2, Trash2, Eye, School, Loader2, BookMarked
} from 'lucide-react';
import './LopSinhVienComponents.css';

export default function LopSinhVienTable({
  lsvList = [],
  loading = false,
  error = '',
  selectedLsvId = '',
  onViewDetail,
  onEdit,
  onDelete,
  hasPermission = () => true
}) {
  if (loading) {
    return (
      <div className="table-loading-cell" style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span style={{ color: 'var(--admin-text-sub)', fontSize: '0.9rem' }}>Đang tải danh sách lớp sinh viên...</span>
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

  if (lsvList.length === 0) {
    return (
      <div className="table-empty-cell" style={{ padding: '50px 20px', textAlign: 'center' }}>
        <div style={{ color: '#94a3b8', marginBottom: '8px' }}>
          <Users size={40} style={{ margin: '0 auto', opacity: 0.5 }} />
        </div>
        <p style={{ fontWeight: 600, color: 'var(--admin-text-main)', fontSize: '0.95rem' }}>
          Không tìm thấy lớp sinh viên nào
        </p>
        <p style={{ color: 'var(--admin-text-sub)', fontSize: '0.82rem', marginTop: '4px' }}>
          Thử chọn khoa khác trên cây thư mục hoặc thay đổi từ khóa tìm kiếm.
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
            <th style={{ minWidth: '240px' }}>Lớp Sinh Viên</th>
            <th style={{ minWidth: '220px' }}>Khoa Quản Lý</th>
            <th style={{ width: '180px', textAlign: 'center' }}>Lớp Học Phần Tham Gia</th>
            <th style={{ width: '120px', textAlign: 'center' }}>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {lsvList.map((item, index) => {
            const isSelected = selectedLsvId === item.MaLopSinhVien;
            const hasLhp = (item.SoLopHocPhan || 0) > 0;

            return (
              <tr
                key={item.MaLopSinhVien}
                className={isSelected ? 'row-selected' : ''}
                style={isSelected ? { backgroundColor: '#f0f7ff' } : {}}
              >
                {/* 1. STT */}
                <td style={{ textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '0.82rem' }}>
                  {index + 1}
                </td>

                {/* 2. Lớp sinh viên */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="lsv-icon-circle">
                      <Users size={18} />
                    </div>
                    <div>
                      <div className="lsv-name-title" title={item.TenLopSinhVien}>
                        {item.TenLopSinhVien}
                      </div>
                      <span className="lsv-code-pill">
                        {item.MaLopSinhVien}
                      </span>
                    </div>
                  </div>
                </td>

                {/* 3. Khoa quản lý */}
                <td>
                  <div className="lsv-khoa-badge" title={item.TenKhoa || 'Chưa phân khoa'}>
                    <School size={13} color="#8b5cf6" />
                    <span>{item.TenKhoa ? `${item.TenKhoa} (${item.MaKhoa})` : 'Chưa phân khoa'}</span>
                  </div>
                </td>

                {/* 4. Số lớp học phần tham gia */}
                <td style={{ textAlign: 'center' }}>
                  {hasLhp ? (
                    <button
                      type="button"
                      className="lsv-classes-badge"
                      onClick={() => onViewDetail(item)}
                      title="Nhấn để xem danh sách lớp học phần đang tham gia"
                    >
                      <BookMarked size={12} />
                      <span>{item.SoLopHocPhan} lớp HP</span>
                    </button>
                  ) : (
                    <span className="lsv-classes-badge empty" title="Chưa tham gia lớp HP nào">
                      0 lớp HP
                    </span>
                  )}
                </td>

                {/* 5. Thao tác */}
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="action-btn view"
                      title="Xem danh sách lớp học phần của lớp này"
                      onClick={() => onViewDetail(item)}
                    >
                      <Eye size={15} />
                    </button>

                    {hasPermission('LopSinhVien', 'CanUpdate') && (
                      <button
                        type="button"
                        className="action-btn edit"
                        title="Sửa thông tin lớp sinh viên"
                        onClick={() => onEdit(item)}
                      >
                        <Edit2 size={15} />
                      </button>
                    )}

                    {hasPermission('LopSinhVien', 'CanDelete') && (
                      <button
                        type="button"
                        className="action-btn delete"
                        title="Xóa lớp sinh viên"
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
