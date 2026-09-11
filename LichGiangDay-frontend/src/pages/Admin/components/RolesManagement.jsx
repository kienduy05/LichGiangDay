import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  Plus, Search, RefreshCw, X, AlertCircle, Loader2, 
  Edit2, Trash2, ShieldAlert, CheckCircle2, ShieldCheck 
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

  const filteredRoles = roles.filter(role => 
    role.RoleId?.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
    role.RoleName?.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
    role.Description?.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );

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

      {/* Data Table Card */}
      <div className="table-container-card">
        {/* Search Toolbar */}
        <div className="table-filter-bar">
          <div className="table-search-box">
            <Search size={18} className="search-box-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo Mã nhóm (RoleId), Tên nhóm..." 
              value={roleSearchQuery}
              onChange={(e) => setRoleSearchQuery(e.target.value)}
            />
            {roleSearchQuery && (
              <button className="clear-search-btn" onClick={() => setRoleSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>

          <button className="btn-refresh" title="Tải lại danh sách" onClick={fetchRoles}>
            <RefreshCw size={16} className={rolesLoading ? 'animate-spin' : ''} />
          </button>
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
                <th style={{ width: '140px' }}>Mã Nhóm</th>
                <th style={{ width: '220px' }}>Tên Nhóm Người Dùng</th>
                <th>Mô Tả Chức Năng</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Số Người Dùng</th>
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
                    {roleSearchQuery ? 'Không tìm thấy nhóm quyền nào khớp từ khóa.' : 'Chưa có nhóm quyền nào trong hệ thống.'}
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.RoleId}>
                    <td>
                      <span className={`role-badge ${role.RoleId === 'ADMIN' ? 'admin' : 'primary'}`}>
                        {role.RoleId}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                        {role.RoleName}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                        {role.Description || 'Chưa có mô tả'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="user-count-tag">
                        {role.UserCount || 0} người dùng
                      </span>
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

                        {role.RoleId === 'ADMIN' ? (
                          <span title="Nhóm ADMIN tối cao của hệ thống không thể xóa" style={{ cursor: 'not-allowed', opacity: 0.4 }}>
                            <Trash2 size={16} color="#94a3b8" />
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
                ))
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
                <X size={20} />
              </button>
            </div>

            {roleFormSuccess && (
              <div className="alert-banner success">
                <CheckCircle2 size={18} />
                <span>{roleFormSuccess}</span>
              </div>
            )}

            {roleFormError && (
              <div className="alert-banner error">
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
