import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  Users, Plus, Search, RefreshCw, X, AlertCircle, Loader2, Edit2, Trash2, 
  UserCheck, UserX, Key, Lock, Unlock, FolderTree, ChevronDown, ChevronRight, 
  User, CheckCircle2, ShieldAlert, Mail, Shield
} from 'lucide-react';
import { 
  apiGetUsers, apiCreateUser, apiUpdateUser, apiResetUserPassword, 
  apiToggleUserStatus, apiDeleteUser, apiGetRoles 
} from '../../../utils/api';
import './UsersManagement.css';

export default function UsersManagement() {
  const { user: currentUser, hasPermission } = useAuth();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Treeview selection & filter states
  const [selectedRoleId, setSelectedRoleId] = useState('ALL');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [expandedRoleIds, setExpandedRoleIds] = useState({ ADMIN: true }); // Default expanded ADMIN node
  const [showLockedUsersOnly, setShowLockedUsersOnly] = useState(false);

  // Modal Create / Edit User
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState('create'); // 'create' | 'edit'
  const [userFormData, setUserFormData] = useState({
    userId: '',
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'ADMIN',
    isActive: 1
  });
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [userFormError, setUserFormError] = useState('');
  const [userFormSuccess, setUserFormSuccess] = useState('');

  // Modal Reset Password
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [resetPwdUser, setResetPwdUser] = useState(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetPwdLoading, setResetPwdLoading] = useState(false);
  const [resetPwdError, setResetPwdError] = useState('');
  const [resetPwdSuccess, setResetPwdSuccess] = useState('');

  // Modal Delete User
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [deletingUserItem, setDeletingUserItem] = useState(null);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState('');

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const data = await apiGetUsers();
      setUsers(data || []);
    } catch (err) {
      setUsersError(err.message || 'Không thể tải danh sách tài khoản người dùng.');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await apiGetRoles();
      setRoles(data || []);
    } catch (err) {
      console.error('Fetch roles error:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const toggleRoleExpand = (roleId, e) => {
    e.stopPropagation();
    setExpandedRoleIds(prev => ({
      ...prev,
      [roleId]: !prev[roleId]
    }));
  };

  const handleOpenCreateUserModal = () => {
    setUserModalMode('create');
    setUserFormData({
      userId: '',
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: selectedRoleId !== 'ALL' ? selectedRoleId : (roles[0]?.RoleId || 'ADMIN'),
      isActive: 1
    });
    setUserFormError('');
    setUserFormSuccess('');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (uItem) => {
    setUserModalMode('edit');
    setUserFormData({
      userId: uItem.UserId,
      username: uItem.Username,
      password: '',
      fullName: uItem.FullName || '',
      email: uItem.Email || '',
      role: uItem.Role || 'ADMIN',
      isActive: uItem.IsActive !== undefined ? uItem.IsActive : 1
    });
    setUserFormError('');
    setUserFormSuccess('');
    setIsUserModalOpen(true);
  };

  const handleSaveUserSubmit = async (e) => {
    e.preventDefault();
    setUserFormError('');
    setUserFormSuccess('');

    if (userModalMode === 'create') {
      if (!userFormData.username.trim()) {
        setUserFormError('Vui lòng nhập Tên tài khoản (Username).');
        return;
      }
      if (!userFormData.password || userFormData.password.length < 6) {
        setUserFormError('Mật khẩu khởi tạo phải từ 6 ký tự trở lên.');
        return;
      }
    }

    if (!userFormData.role) {
      setUserFormError('Vui lòng chọn Nhóm quyền cho người dùng.');
      return;
    }

    setUserFormLoading(true);
    try {
      if (userModalMode === 'create') {
        await apiCreateUser({
          username: userFormData.username,
          password: userFormData.password,
          fullName: userFormData.fullName,
          email: userFormData.email,
          role: userFormData.role
        });
        setUserFormSuccess('Tạo tài khoản người dùng mới thành công!');
      } else {
        await apiUpdateUser(userFormData.userId, {
          fullName: userFormData.fullName,
          email: userFormData.email,
          role: userFormData.role,
          isActive: userFormData.isActive
        });
        setUserFormSuccess('Cập nhật tài khoản người dùng thành công!');
      }

      await fetchUsers();

      setTimeout(() => {
        setIsUserModalOpen(false);
        setUserFormSuccess('');
      }, 1000);
    } catch (err) {
      setUserFormError(err.message || 'Thao tác thất bại.');
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleOpenResetPwdModal = (uItem) => {
    setResetPwdUser(uItem);
    setNewResetPassword('');
    setResetPwdError('');
    setResetPwdSuccess('');
    setIsResetPwdModalOpen(true);
  };

  const handleResetUserPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetPwdError('');
    setResetPwdSuccess('');

    if (!newResetPassword || newResetPassword.length < 6) {
      setResetPwdError('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }

    setResetPwdLoading(true);
    try {
      await apiResetUserPassword(resetPwdUser.UserId, newResetPassword);
      setResetPwdSuccess(`Đã đặt lại mật khẩu cho tài khoản ${resetPwdUser.Username}!`);
      setTimeout(() => {
        setIsResetPwdModalOpen(false);
        setResetPwdSuccess('');
      }, 1200);
    } catch (err) {
      setResetPwdError(err.message || 'Đặt lại mật khẩu thất bại.');
    } finally {
      setResetPwdLoading(false);
    }
  };

  const handleToggleUserStatus = async (uItem) => {
    try {
      await apiToggleUserStatus(uItem.UserId);
      await fetchUsers();
    } catch (err) {
      alert(err.message || 'Không thể thay đổi trạng thái tài khoản.');
    }
  };

  const handleOpenDeleteUserModal = (uItem) => {
    setDeletingUserItem(uItem);
    setDeleteUserError('');
    setIsDeleteUserModalOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUserItem) return;
    setDeleteUserLoading(true);
    setDeleteUserError('');

    try {
      await apiDeleteUser(deletingUserItem.UserId);
      await fetchUsers();
      setIsDeleteUserModalOpen(false);
      setDeletingUserItem(null);
    } catch (err) {
      setDeleteUserError(err.message || 'Không thể xóa tài khoản người dùng.');
    } finally {
      setDeleteUserLoading(false);
    }
  };

  const filteredUsers = users.filter(uItem => {
    const matchesSearch = 
      uItem.Username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      uItem.FullName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      uItem.Email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      uItem.UserId?.toLowerCase().includes(userSearchQuery.toLowerCase());

    const matchesRole = selectedRoleId === 'ALL' || uItem.Role === selectedRoleId;
    const matchesLocked = showLockedUsersOnly ? uItem.IsActive === 0 : true;

    return matchesSearch && matchesRole && matchesLocked;
  });

  return (
    <div className="users-management-container">
      {/* Page Header Toolbar */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Người Dùng & Cây Nhóm Quyền</h2>
          <p className="page-subtitle">Danh sách tài khoản, phân nhóm sơ đồ cây và quản lý quyền hạn truy cập</p>
        </div>
        {hasPermission('Users', 'CanCreate') && (
          <button className="btn-primary-add" onClick={handleOpenCreateUserModal}>
            <Plus size={18} />
            <span>Thêm Người Dùng</span>
          </button>
        )}
      </div>

      {/* Split Panel Layout */}
      <div className="user-management-split-layout">
        
        {/* LEFT PANEL: TREEVIEW NAVIGATION */}
        <div className="treeview-panel">
          <div className="treeview-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="treeview-title-group">
              <FolderTree size={18} className="tree-header-icon" />
              <span>Sơ Đồ Nhóm Quyền</span>
            </div>
            <button className="btn-refresh" title="Làm mới" onClick={fetchRoles}>
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="treeview-body">
            {/* Node Tất cả người dùng */}
            <div 
              className={`treeview-item ${selectedRoleId === 'ALL' ? 'active' : ''}`}
              onClick={() => {
                setSelectedRoleId('ALL');
                setSelectedUserId(null);
              }}
            >
              <div className="treeview-item-label">
                <Users size={16} className="tree-icon" />
                <span>Tất cả người dùng</span>
              </div>
              <span className="treeview-count-badge">{users.length}</span>
            </div>

            {/* Tree Nodes By Role */}
            {roles.map(role => {
              const usersInRole = users.filter(u => u.Role === role.RoleId);
              const isExpanded = !!expandedRoleIds[role.RoleId];
              const isRoleSelected = selectedRoleId === role.RoleId && !selectedUserId;

              return (
                <div key={role.RoleId} className="tree-group">
                  <div 
                    className={`treeview-item ${isRoleSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedRoleId(role.RoleId);
                      setSelectedUserId(null);
                    }}
                  >
                    <div className="treeview-item-label">
                      <button 
                        className="tree-expand-icon" 
                        onClick={(e) => toggleRoleExpand(role.RoleId, e)}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <Shield size={15} className="tree-icon role" />
                      <span className="role-title-text">{role.RoleName}</span>
                    </div>
                    <span className="treeview-count-badge">{usersInRole.length}</span>
                  </div>

                  {/* Children User Nodes */}
                  {isExpanded && (
                    <div className="treeview-children-list">
                      {usersInRole.length === 0 ? (
                        <div className="treeview-child-empty">Chưa có người dùng</div>
                      ) : (
                        usersInRole.map(uItem => {
                          const isUserSelected = selectedUserId === uItem.UserId;
                          const initial = (uItem.FullName || uItem.Username || 'U').substring(0, 1).toUpperCase();
                          return (
                            <div 
                              key={uItem.UserId}
                              className={`treeview-child-item ${isUserSelected ? 'active' : ''}`}
                              onClick={() => {
                                setSelectedRoleId(role.RoleId);
                                setSelectedUserId(uItem.UserId);
                              }}
                            >
                              <div className="user-avatar-tiny">{initial}</div>
                              <div className="treeview-child-info">
                                <span className="child-username">{uItem.Username}</span>
                                <span className="child-fullname">{uItem.FullName || uItem.Email || 'Tài khoản'}</span>
                              </div>
                              {uItem.IsActive === 0 && (
                                <span className="tree-locked-badge" title="Tài khoản đang bị khóa">
                                  Khóa
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: MAIN DATA TABLE & USER DETAILS */}
        <div className="table-container-card">
          {/* Toolbar & Filters */}
          <div className="table-filter-bar">
            <div className="table-search-box">
              <Search size={18} className="search-box-icon" />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo Mã, Username, Email, Họ tên..." 
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
              {userSearchQuery && (
                <button className="clear-search-btn" onClick={() => setUserSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="filter-controls-right">
              <label 
                className="checkbox-filter-label"
                onClick={() => setShowLockedUsersOnly(!showLockedUsersOnly)}
              >
                <Lock size={14} className={`checkbox-icon ${showLockedUsersOnly ? 'checked' : ''}`} />
                <span>{showLockedUsersOnly ? 'Đang lọc: Đã khóa' : 'Chỉ xem tài khoản khóa'}</span>
              </label>

              <button className="btn-refresh" title="Tải lại danh sách" onClick={fetchUsers}>
                <RefreshCw size={16} className={usersLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Alert Errors */}
          {usersError && (
            <div className="alert-banner error" style={{ margin: '16px 20px 0' }}>
              <AlertCircle size={18} />
              <span>{usersError}</span>
            </div>
          )}

          {/* Data Table */}
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th style={{ width: '220px' }}>Tên Tài Khoản & Mã</th>
                  <th>Họ và Tên / Email</th>
                  <th style={{ width: '130px' }}>Nhóm Quyền</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan="5" className="table-loading-cell">
                      <Loader2 size={24} className="animate-spin" />
                      <span>Đang tải danh sách người dùng...</span>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="table-empty-cell">
                      {userSearchQuery || showLockedUsersOnly 
                        ? 'Không tìm thấy tài khoản người dùng phù hợp điều kiện lọc.' 
                        : 'Chưa có người dùng nào thuộc nhóm được chọn.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((uItem) => (
                    <tr 
                      key={uItem.UserId}
                      className={selectedUserId === uItem.UserId ? 'row-highlighted' : ''}
                    >
                      <td>
                        <div className="user-cell-flex">
                          <div className="user-avatar-small">
                            {(uItem.FullName || uItem.Username || 'U').substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="user-username-text">
                              <span>{uItem.Username}</span>
                              {uItem.UserId === currentUser?.userId && <span className="self-tag">Bạn</span>}
                            </div>
                            <div className="user-id-sub">{uItem.UserId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>{uItem.FullName || 'Chưa cập nhật'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-sub)' }}>{uItem.Email || 'Chưa có email'}</div>
                      </td>
                      <td>
                        <span className={`role-badge ${uItem.Role === 'ADMIN' ? 'admin' : 'primary'}`}>
                          {uItem.Role}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {uItem.IsActive === 1 ? (
                          <span className="badge-user-active">
                            <UserCheck size={12} /> Hoạt động
                          </span>
                        ) : (
                          <span className="badge-user-inactive">
                            <UserX size={12} /> Đã khóa
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions-group" style={{ justifyContent: 'center' }}>
                          {hasPermission('Users', 'CanUpdate') && (
                            <>
                              <button 
                                className="action-btn edit" 
                                title="Sửa thông tin tài khoản"
                                onClick={() => handleOpenEditUserModal(uItem)}
                              >
                                <Edit2 size={16} />
                              </button>

                              <button 
                                className="action-btn key" 
                                title="Đặt lại mật khẩu mới"
                                onClick={() => handleOpenResetPwdModal(uItem)}
                              >
                                <Key size={16} />
                              </button>

                              <button 
                                className={`action-btn ${uItem.IsActive === 1 ? 'lock' : 'unlock'}`}
                                title={uItem.IsActive === 1 ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                onClick={() => handleToggleUserStatus(uItem)}
                                disabled={uItem.UserId === currentUser?.userId}
                              >
                                {uItem.IsActive === 1 ? <Lock size={15} /> : <Unlock size={15} />}
                              </button>
                            </>
                          )}

                          {hasPermission('Users', 'CanDelete') && (
                            <button 
                              className="action-btn delete" 
                              title="Xóa tài khoản"
                              onClick={() => handleOpenDeleteUserModal(uItem)}
                              disabled={uItem.UserId === currentUser?.userId || uItem.Username === 'ADMIN'}
                            >
                              <Trash2 size={16} />
                            </button>
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
      </div>

      {/* Modal Create / Edit User */}
      {isUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {userModalMode === 'create' ? 'Tạo Tài Khoản Người Dùng Mới' : 'Cập Nhật Tài Khoản Người Dùng'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {userFormSuccess && (
              <div className="alert-banner success">
                <CheckCircle2 size={18} />
                <span>{userFormSuccess}</span>
              </div>
            )}

            {userFormError && (
              <div className="alert-banner error">
                <AlertCircle size={18} />
                <span>{userFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUserSubmit}>
              <div className="modal-form-group">
                <label className="modal-label">
                  Tên Tài Khoản (Username) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="Ví dụ: nguyen.van.a"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  disabled={userModalMode === 'edit'}
                  style={userModalMode === 'edit' ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : {}}
                  required
                />
              </div>

              {userModalMode === 'create' && (
                <div className="modal-form-group">
                  <label className="modal-label">
                    Mật Khẩu Khởi Tạo <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="password" 
                    className="modal-input" 
                    placeholder="Nhập mật khẩu khởi tạo (ít nhất 6 ký tự)"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="modal-form-group">
                <label className="modal-label">Họ và Tên Nguời Dùng</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={userFormData.fullName}
                  onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Địa chỉ Email</label>
                <input 
                  type="email" 
                  className="modal-input" 
                  placeholder="Ví dụ: nguyenvana@gmail.com"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">
                  Nhóm Quyền (Role) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select 
                  className="modal-input"
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  required
                >
                  {roles.map(r => (
                    <option key={r.RoleId} value={r.RoleId}>
                      {r.RoleName} ({r.RoleId})
                    </option>
                  ))}
                </select>
              </div>

              {userModalMode === 'edit' && (
                <div className="modal-form-group">
                  <label className="modal-label">Trạng thái tài khoản</label>
                  <select 
                    className="modal-input"
                    value={userFormData.isActive}
                    onChange={(e) => setUserFormData({ ...userFormData, isActive: Number(e.target.value) })}
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Khóa (Vô hiệu hóa)</option>
                  </select>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="btn-save" disabled={userFormLoading}>
                  {userFormLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={16} className="animate-spin" /> Đang lưu...
                    </span>
                  ) : (
                    userModalMode === 'create' ? 'Tạo Tài Khoản' : 'Lưu Thay Đổi'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reset User Password Modal */}
      {isResetPwdModalOpen && resetPwdUser && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Đặt Lại Mật Khẩu Tài Khoản</h3>
              <button onClick={() => setIsResetPwdModalOpen(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)', marginBottom: '16px' }}>
              Đặt lại mật khẩu mới cho tài khoản <b style={{ color: 'var(--admin-text-main)' }}>{resetPwdUser.Username}</b>
            </p>

            {resetPwdSuccess && (
              <div className="alert-banner success">
                <CheckCircle2 size={18} />
                <span>{resetPwdSuccess}</span>
              </div>
            )}

            {resetPwdError && (
              <div className="alert-banner error">
                <AlertCircle size={18} />
                <span>{resetPwdError}</span>
              </div>
            )}

            <form onSubmit={handleResetUserPasswordSubmit}>
              <div className="modal-form-group">
                <label className="modal-label">Mật khẩu mới</label>
                <input 
                  type="password" 
                  className="modal-input" 
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  required 
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsResetPwdModalOpen(false)} className="btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="btn-save" disabled={resetPwdLoading}>
                  {resetPwdLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={16} className="animate-spin" /> Đang lưu...
                    </span>
                  ) : (
                    'Cập Nhật Mật Khẩu'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm User Modal */}
      {isDeleteUserModalOpen && deletingUserItem && (
        <div className="modal-overlay">
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper">
              <ShieldAlert size={32} />
            </div>
            
            <h3 className="delete-modal-title">Xác Nhận Xóa Tài Khoản</h3>
            <p className="delete-modal-desc">
              Bạn có chắc chắn muốn xóa tài khoản <b style={{ color: 'var(--admin-text-main)' }}>{deletingUserItem.Username} ({deletingUserItem.UserId})</b> không? Hành động này không thể hoàn tác.
            </p>

            {deleteUserError && (
              <div className="alert-banner error" style={{ textAlign: 'left', marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <span>{deleteUserError}</span>
              </div>
            )}

            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button 
                type="button" 
                onClick={() => setIsDeleteUserModalOpen(false)} 
                className="btn-cancel"
                disabled={deleteUserLoading}
              >
                Hủy Bỏ
              </button>
              <button 
                type="button" 
                onClick={handleConfirmDeleteUser} 
                className="btn-delete-confirm"
                disabled={deleteUserLoading}
              >
                {deleteUserLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" /> Đang xóa...
                  </span>
                ) : (
                  'Xóa Tài Khoản'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
