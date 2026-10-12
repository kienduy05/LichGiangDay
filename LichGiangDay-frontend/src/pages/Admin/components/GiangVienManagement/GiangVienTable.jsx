import React from 'react';
import {
  Edit2, Trash2, Power, PowerOff, Link, Unlink, Network,
  Mail, Phone, Eye, Loader2, BookOpen
} from 'lucide-react';
import './GiangVienComponents.css';

export default function GiangVienTable({
  gvList = [],
  loading = false,
  error = '',
  selectedGvId = '',
  onViewDetail,
  onEdit,
  onToggle,
  onDelete,
  toggleLoading = false,
  hasPermission = () => true
}) {
  if (loading) {
    return (
      <div className="table-loading-cell" style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span style={{ color: 'var(--admin-text-sub)', fontSize: '0.9rem' }}>Đang tải danh sách giảng viên...</span>
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

  if (gvList.length === 0) {
    return (
      <div className="table-empty-cell" style={{ padding: '50px 20px', textAlign: 'center' }}>
        <div style={{ color: '#94a3b8', marginBottom: '8px' }}>
          <BookOpen size={40} style={{ margin: '0 auto', opacity: 0.5 }} />
        </div>
        <p style={{ fontWeight: 600, color: 'var(--admin-text-main)', fontSize: '0.95rem' }}>
          Không tìm thấy giảng viên nào
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
            <th style={{ minWidth: '220px' }}>Giảng Viên</th>
            <th style={{ minWidth: '180px' }}>Đơn Vị Công Tác</th>
            <th style={{ minWidth: '190px' }}>Thông Tin Liên Hệ</th>
            <th style={{ width: '130px', textAlign: 'center' }}>Tài Khoản</th>
            <th style={{ width: '120px', textAlign: 'center' }}>Trạng Thái</th>
            <th style={{ width: '130px', textAlign: 'center' }}>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {gvList.map((gv, index) => {
            const isActive = gv.TrangThai === 'Active';
            const isSelected = selectedGvId === gv.MaGiangVien;
            const initials = gv.HoTen
              ? gv.HoTen.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase()
              : 'GV';

            return (
              <tr
                key={gv.MaGiangVien}
                className={`${isSelected ? 'row-selected' : ''} ${!isActive ? 'row-inactive' : ''}`}
                style={isSelected ? { backgroundColor: '#f0f7ff' } : {}}
              >
                {/* 1. STT */}
                <td style={{ textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '0.82rem' }}>
                  {index + 1}
                </td>

                {/* 2. Giảng Viên */}
                <td>
                  <div className="gv-avatar-cell">
                    <div className="gv-avatar-circle">
                      {initials}
                    </div>
                    <div>
                      <div className="gv-name-title" title={gv.HoTen}>
                        {gv.HoTen}
                      </div>
                      <span className="gv-code-pill">
                        {gv.MaGiangVien}
                      </span>
                    </div>
                  </div>
                </td>

                {/* 3. Đơn vị */}
                <td>
                  <div className="gv-dept-cell">
                    <div className="gv-dept-bomon" title={gv.TenBoMon || 'Chưa phân bộ môn'}>
                      <Network size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px', color: '#0ea5e9' }} />
                      {gv.TenBoMon || <span style={{ color: '#94a3b8', fontWeight: 'normal', fontStyle: 'italic' }}>Chưa phân bộ môn</span>}
                    </div>
                    {gv.TenKhoa && (
                      <div className="gv-dept-khoa" title={gv.TenKhoa}>
                        {gv.TenKhoa}
                      </div>
                    )}
                  </div>
                </td>

                {/* 4. Liên hệ */}
                <td>
                  <div className="gv-contact-cell">
                    {gv.Email ? (
                      <div className="gv-contact-item" title={gv.Email}>
                        <Mail size={12} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gv.Email}</span>
                      </div>
                    ) : (
                      <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>Chưa có email</span>
                    )}
                    {gv.SoDienThoai && (
                      <div className="gv-contact-item" title={gv.SoDienThoai}>
                        <Phone size={12} />
                        <span>{gv.SoDienThoai}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* 5. Tài khoản liên kết */}
                <td style={{ textAlign: 'center' }}>
                  <span
                    className={`gv-account-badge ${gv.DaLienKetTaiKhoan ? 'linked' : 'unlinked'}`}
                    title={gv.Username ? `Tài khoản: @${gv.Username} (${gv.RoleName || gv.UserRole || 'Giảng viên'})` : 'Chưa liên kết tài khoản hệ thống'}
                  >
                    {gv.DaLienKetTaiKhoan ? (
                      <><Link size={11} /> {gv.Username ? `@${gv.Username}` : 'Đã liên kết'}</>
                    ) : (
                      <><Unlink size={11} /> Chưa có</>
                    )}
                  </span>
                </td>

                {/* 6. Trạng thái & Toggle */}
                <td style={{ textAlign: 'center' }}>
                  {hasPermission('GiangVien', 'CanUpdate') ? (
                    <button
                      type="button"
                      className={`gv-toggle-status-btn ${isActive ? 'active' : 'inactive'}`}
                      onClick={() => onToggle(gv)}
                      disabled={toggleLoading}
                      title={isActive ? 'Nhấn để tạm dừng công tác' : 'Nhấn để kích hoạt lại'}
                    >
                      {isActive ? (
                        <>
                          <Power size={11} />
                          <span>Đang dạy</span>
                        </>
                      ) : (
                        <>
                          <PowerOff size={11} />
                          <span>Tạm dừng</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                      {isActive ? 'Đang dạy' : 'Tạm dừng'}
                    </span>
                  )}
                </td>

                {/* 7. Thao tác */}
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="action-btn view"
                      title="Xem hồ sơ chi tiết & phân công"
                      onClick={() => onViewDetail(gv)}
                    >
                      <Eye size={15} />
                    </button>

                    {hasPermission('GiangVien', 'CanUpdate') && (
                      <button
                        type="button"
                        className="action-btn edit"
                        title="Sửa thông tin giảng viên"
                        onClick={() => onEdit(gv)}
                      >
                        <Edit2 size={15} />
                      </button>
                    )}

                    {hasPermission('GiangVien', 'CanDelete') && (
                      <button
                        type="button"
                        className="action-btn delete"
                        title="Xóa giảng viên"
                        onClick={() => onDelete(gv)}
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
