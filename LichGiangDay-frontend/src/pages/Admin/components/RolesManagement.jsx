import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  Plus, Search, RefreshCw, X, AlertCircle, Loader2, 
  Edit2, Trash2, ShieldAlert, CheckCircle2, ShieldCheck,
  Users, UserX, Crown, School, Network, GraduationCap, Shield, KeyRound
} from 'lucide-react';
import { 
  apiGetRoles, apiCreateRole, apiUpdateRole, apiDeleteRole 
} from '../../../utils/api';
import './RolesManagement.css';

export default function RolesManagement() {
  const { hasPermission } = useAuth();

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState('');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [roleFilterTab, setRoleFilterTab] = useState('ALL'); // 'ALL' | 'SYSTEM' | 'CUSTOM'

  // Modal Create/Edit Role
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState('create'); // 'create' | 'edit'
  const [roleFormData, setRoleFormData] = useState({ roleId: '', roleName: '', description: '' });
  const [roleFormLoading, setRoleFormLoading] = useState(false);
  const [roleFormError, setRoleFormError] = useState('');
  const [roleFormSuccess, setRoleFormSuccess] = useState('');

  // Modal Delete Role
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchRoles = async () => {
    setRolesLoading(true);
    setRolesError('');
    try {
      const data = await apiGetRoles();
      setRoles(data || []);
    } catch (err) {
      setRolesError(err.message || 'Không thể tải danh sách nhóm người dùng.');
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreateRoleModal = () => {
    setRoleModalMode('create');
    setRoleFormData({ roleId: '', roleName: '', description: '' });
    setRoleFormError('');
    setRoleFormSuccess('');
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRoleModal = (role) => {
    setRoleModalMode('edit');
    setRoleFormData({
      roleId: role.RoleId,
      roleName: role.RoleName,
      description: role.Description || ''
    });
    setRoleFormError('');
    setRoleFormSuccess('');
    setIsRoleModalOpen(true);
  };

  const handleSaveRoleSubmit = async (e) => {
    e.preventDefault();
    setRoleFormError('');
    setRoleFormSuccess('');

    if (roleModalMode === 'create' && !roleFormData.roleId.trim()) {
      setRoleFormError('Vui lòng nhập Mã nhóm (RoleId).');
      return;
    }
    if (!roleFormData.roleName.trim()) {
      setRoleFormError('Vui lòng nhập Tên nhóm người dùng.');
      return;
    }

    setRoleFormLoading(true);
    try {
      if (roleModalMode === 'create') {
        await apiCreateRole(roleFormData);
        setRoleFormSuccess('Tạo nhóm người dùng mới thành công!');
      } else {
        await apiUpdateRole(roleFormData.roleId, {
          roleName: roleFormData.roleName,
          description: roleFormData.description
        });
        setRoleFormSuccess('Cập nhật nhóm người dùng thành công!');
      }

      await fetchRoles();

      setTimeout(() => {
        setIsRoleModalOpen(false);
        setRoleFormSuccess('');
      }, 1000);
    } catch (err) {
      setRoleFormError(err.message || 'Thao tác thất bại.');
    } finally {
      setRoleFormLoading(false);
    }
  };

  const handleOpenDeleteRoleModal = (role) => {
    setDeletingRole(role);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteRole = async () => {
    if (!deletingRole) return;
    setDeleteLoading(true);
    setDeleteError('');

    try {
      await apiDeleteRole(deletingRole.RoleId);
      await fetchRoles();
      setIsDeleteModalOpen(false);
      setDeletingRole(null);
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa nhóm người dùng.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Helper checking if a role is a system role (IsSystem === 1 in DB)
  const isSystemRole = (role) => {
    return role.IsSystem === 1 || Number(role.IsSystem) === 1;
  };

  // Filter roles by tab & search query
  const filteredRoles = roles.filter(role => {
    const matchesSearch = 
      role.RoleId?.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
      role.RoleName?.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
      role.Description?.toLowerCase().includes(roleSearchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (roleFilterTab === 'SYSTEM') return isSystemRole(role);
    if (roleFilterTab === 'CUSTOM') return !isSystemRole(role);
    return true;
  });

  // Calculate summary stats
  const totalRolesCount = roles.length;
  const systemRolesCount = roles.filter(r => isSystemRole(r)).length;
  const customRolesCount = totalRolesCount - systemRolesCount;
  const totalAssignedUsers = roles.reduce((sum, r) => sum + (r.UserCount || 0), 0);

  // Helper for role avatar & icon
  const getRoleIconAndClass = (roleId) => {
    switch (roleId?.toUpperCase()) {
      case 'ADMIN':
        return { icon: <Crown size={20} />, className: 'admin', badgeClass: 'admin' };
      case 'KHOA':
        return { icon: <School size={20} />, className: 'khoa', badgeClass: 'khoa' };
      case 'BOMON':
        return { icon: <Network size={20} />, className: 'bomon', badgeClass: 'bomon' };
      case 'GIANGVIEN':
        return { icon: <GraduationCap size={20} />, className: 'giangvien', badgeClass: 'giangvien' };
      default:
        return { icon: <ShieldCheck size={20} />, className: 'default', badgeClass: 'default' };
    }
  };

  return (
    <div className="roles-management-container">
      {/* Page Header Toolbar */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Nhóm Người Dùng</h2>
          <p className="page-subtitle">Danh sách các nhóm quyền và phân định chức năng hệ thống</p>
        </div>
        {hasPermission('Roles', 'CanCreate') && (
          <button className="btn-primary-add" onClick={handleOpenCreateRoleModal}>
            <Plus size={18} />
            <span>Thêm Nhóm Người Dùng</span>
          </button>
        )}
      </div>

      {/* KPI Stat Cards Summary */}
      <div className="roles-stats-grid">
        <div className="roles-stat-card">
          <div className="roles-stat-icon blue">
            <Shield size={24} />
          </div>
          <div className="roles-stat-info">
            <div className="roles-stat-value">{totalRolesCount}</div>
            <div className="roles-stat-label">Tổng số nhóm quyền</div>
          </div>
        </div>

        <div className="roles-stat-card">
          <div className="roles-stat-icon purple">
            <Crown size={24} />
          </div>
          <div className="roles-stat-info">
            <div className="roles-stat-value">{systemRolesCount}</div>
            <div className="roles-stat-label">Nhóm quyền Hệ thống</div>
          </div>
        </div>

        <div className="roles-stat-card">
          <div className="roles-stat-icon emerald">
            <Users size={24} />
          </div>
          <div className="roles-stat-info">
            <div className="roles-stat-value">{totalAssignedUsers}</div>
            <div className="roles-stat-label">Người dùng được phân quyền</div>
          </div>
        </div>

        <div className="roles-stat-card">
          <div className="roles-stat-icon amber">
            <KeyRound size={24} />
          </div>
          <div className="roles-stat-info">
            <div className="roles-stat-value">{customRolesCount}</div>
            <div className="roles-stat-label">Nhóm quyền Tùy chỉnh</div>
          </div>
        </div>
      </div>

      {/* Main Data Table Card */}
      <div className="table-container-card">
        {/* Search & Filter Toolbar */}
        <div className="roles-filter-bar-enhanced">
          <div className="role-filter-tabs">
            <button 
              className={`role-filter-tab ${roleFilterTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setRoleFilterTab('ALL')}
            >
              Tất cả ({totalRolesCount})
            </button>
            <button 
              className={`role-filter-tab ${roleFilterTab === 'SYSTEM' ? 'active' : ''}`}
              onClick={() => setRoleFilterTab('SYSTEM')}
            >
              Hệ thống ({systemRolesCount})
            </button>
            <button 
              className={`role-filter-tab ${roleFilterTab === 'CUSTOM' ? 'active' : ''}`}
              onClick={() => setRoleFilterTab('CUSTOM')}
            >
              Tùy chỉnh ({customRolesCount})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', justifyContent: 'flex-end', minWidth: '260px' }}>
            <div className="table-search-box" style={{ maxWidth: '340px' }}>
              <Search size={18} className="search-box-icon" />
              <input 
                type="text" 
                placeholder="Tìm kiếm mã nhóm, tên nhóm người dùng..." 
                value={roleSearchQuery}
                onChange={(e) => setRoleSearchQuery(e.target.value)}
              />
              {roleSearchQuery && (
                <button className="clear-search-btn" onClick={() => setRoleSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <button className="btn-refresh" title="Tải lại danh sách" onClick={fetchRoles}>
              <RefreshCw size={16} className={rolesLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Alert Errors */}
        {rolesError && (
          <div className="alert-banner error" style={{ margin: '16px 20px 0' }}>
            <AlertCircle size={18} />
            <span>{rolesError}</span>
          </div>
        )}

        {/* Table View */}
        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th style={{ width: '240px' }}>Nhóm Người Dùng</th>
                <th style={{ width: '130px' }}>Mã Nhóm</th>
                <th>Mô Tả Chức Năng</th>
                <th style={{ width: '160px', textAlign: 'center' }}>Số Người Dùng</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {rolesLoading ? (
                <tr>
                  <td colSpan="5" className="table-loading-cell">
                    <Loader2 size={24} className="animate-spin" />
                    <span>Đang tải dữ liệu nhóm người dùng...</span>
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-empty-cell">
                    {roleSearchQuery ? 'Không tìm thấy nhóm quyền nào khớp từ khóa.' : 'Chưa có nhóm quyền nào trong danh sách.'}
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => {
                  const roleTheme = getRoleIconAndClass(role.RoleId);
                  const isSys = isSystemRole(role);

                  return (
                    <tr key={role.RoleId}>
                      <td>
                        <div className="role-cell-flex">
                          <div className={`role-avatar-icon ${roleTheme.className}`}>
                            {roleTheme.icon}
                          </div>
                          <div className="role-meta-info">
                            <div className="role-title-text">{role.RoleName}</div>
                            <div className="role-type-badge-row">
                              {isSys ? (
                                <span className="badge-system">
                                  <ShieldCheck size={12} /> Hệ thống
                                </span>
                              ) : (
                                <span className="badge-custom">
                                  <Shield size={12} /> Tùy chỉnh
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`role-code-badge ${roleTheme.badgeClass}`}>
                          {role.RoleId}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.4' }}>
                          {role.Description || 'Chưa có mô tả chi tiết'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {role.UserCount > 0 ? (
                          <span className="user-count-pill active">
                            <Users size={14} />
                            <span><b>{role.UserCount}</b> người dùng</span>
                          </span>
                        ) : (
                          <span className="user-count-pill empty">
                            <UserX size={14} />
                            <span>0 người dùng</span>
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="table-actions-group" style={{ justifyContent: 'center' }}>
                          {hasPermission('Roles', 'CanUpdate') && (
                            <button 
                              className="action-btn edit" 
                              title="Sửa thông tin nhóm quyền"
                              onClick={() => handleOpenEditRoleModal(role)}
                            >
                              <Edit2 size={16} />
                            </button>
                          )}

                          {isSys ? (
                            <span 
                              className="action-btn-disabled" 
                              title="Nhóm quyền hệ thống không thể xóa"
                            >
                              <Trash2 size={16} />
                            </span>
                          ) : (
                            hasPermission('Roles', 'CanDelete') && (
                              <button 
                                className="action-btn delete" 
                                title="Xóa nhóm quyền"
                                onClick={() => handleOpenDeleteRoleModal(role)}
                              >
                                <Trash2 size={16} />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create / Edit Role */}
      {isRoleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {roleModalMode === 'create' ? 'Thêm Nhóm Người Dùng Mới' : 'Cập Nhật Nhóm Người Dùng'}
              </h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            {roleFormSuccess && (
              <div className="alert-banner success" style={{ marginBottom: '16px' }}>
                <CheckCircle2 size={18} />
                <span>{roleFormSuccess}</span>
              </div>
            )}

            {roleFormError && (
              <div className="alert-banner error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <span>{roleFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRoleSubmit}>
              <div className="modal-form-group">
                <label className="modal-label">
                  Mã Nhóm Quyền (RoleId) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="Ví dụ: KHOA, BOMON, GIANGVIEN..."
                  value={roleFormData.roleId}
                  onChange={(e) => setRoleFormData({ ...roleFormData, roleId: e.target.value.toUpperCase() })}
                  disabled={roleModalMode === 'edit'}
                  style={roleModalMode === 'edit' ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : {}}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">
                  Tên Nhóm Người Dùng <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="Ví dụ: Ban Giám Hiệu, Trưởng Khoa, Bộ Môn..."
                  value={roleFormData.roleName}
                  onChange={(e) => setRoleFormData({ ...roleFormData, roleName: e.target.value })}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Mô Tả Chức Năng</label>
                <textarea 
                  className="modal-input" 
                  rows="3"
                  placeholder="Nhập mô tả phạm vi quyền hạn của nhóm này..."
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsRoleModalOpen(false)} className="btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="btn-save" disabled={roleFormLoading}>
                  {roleFormLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={16} className="animate-spin" /> Đang lưu...
                    </span>
                  ) : (
                    roleModalMode === 'create' ? 'Tạo Nhóm Quyền' : 'Lưu Thay Đổi'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Confirm */}
      {isDeleteModalOpen && deletingRole && (
        <div className="modal-overlay">
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper">
              <ShieldAlert size={32} />
            </div>
            
            <h3 className="delete-modal-title">Xác Nhận Xóa Nhóm Quyền</h3>
            <p className="delete-modal-desc">
              Bạn có chắc chắn muốn xóa nhóm quyền <b style={{ color: 'var(--admin-text-main)' }}>{deletingRole.RoleName} ({deletingRole.RoleId})</b> không? 
            </p>

            {deleteError && (
              <div className="alert-banner error" style={{ textAlign: 'left', marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button 
                type="button" 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="btn-cancel"
                disabled={deleteLoading}
              >
                Hủy Bỏ
              </button>
              <button 
                type="button" 
                onClick={handleConfirmDeleteRole} 
                className="btn-delete-confirm"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" /> Đang xóa...
                  </span>
                ) : (
                  'Xóa Nhóm Quyền'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
