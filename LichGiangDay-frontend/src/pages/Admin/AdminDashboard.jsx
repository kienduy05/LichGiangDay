import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Building, GraduationCap, Users, Calendar, 
  Clock, FileText, Bell, LogOut, ShieldCheck, BookOpen, Search, 
  ChevronDown, ChevronRight, Mail, Shield, UserCog, KeyRound, X, CheckCircle2, AlertCircle, Loader2,
  Plus, Edit2, Trash2, ShieldAlert, Layers, RefreshCw, UserCheck, UserX, Key, Filter, Lock, Unlock,
  FolderTree, User, CheckSquare, Square, Save, Eye, PlusSquare, Edit3, Trash
} from 'lucide-react';
import { 
  apiGetRoles, apiCreateRole, apiUpdateRole, apiDeleteRole,
  apiGetUsers, apiCreateUser, apiUpdateUser, apiResetUserPassword, apiToggleUserStatus, apiDeleteUser,
  apiGetResources, apiGetRolePermissions, apiUpdateRolePermissions
} from '../../utils/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, hasPermission, logout, updateProfile, changePassword } = useAuth();
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'roles' | 'users' | 'permissions'

  // Header profile dropdown
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Edit profile modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');

  // Change password modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // ==========================================
  // ROLES MANAGEMENT STATES & LOGIC
  // ==========================================
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

  // Fetch Roles list from API
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

  // ==========================================
  // USERS MANAGEMENT STATES & LOGIC
  // ==========================================
  const [users, setUsers] = useState([]);
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

  // Fetch Users list
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

  // ==========================================
  // PERMISSIONS MANAGEMENT STATES & LOGIC
  // ==========================================
  const [permRoleId, setPermRoleId] = useState('ADMIN');
  const [permissionMatrix, setPermissionMatrix] = useState([]);
  const [permLoading, setPermLoading] = useState(false);
  const [permError, setPermError] = useState('');
  const [permSaveLoading, setPermSaveLoading] = useState(false);
  const [permSaveSuccess, setPermSaveSuccess] = useState('');
  const [permSearchQuery, setPermSearchQuery] = useState('');

  const fetchPermissions = async (roleId) => {
    setPermLoading(true);
    setPermError('');
    try {
      const data = await apiGetRolePermissions(roleId);
      setPermissionMatrix(data || []);
    } catch (err) {
      setPermError(err.message || 'Không thể tải ma trận phân quyền.');
    } finally {
      setPermLoading(false);
    }
  };

  // Load data according to active tab
  useEffect(() => {
    if (activeTab === 'roles') {
      fetchRoles();
    } else if (activeTab === 'users') {
      fetchUsers();
      fetchRoles();
    } else if (activeTab === 'permissions') {
      fetchRoles();
      fetchPermissions(permRoleId);
    }
  }, [activeTab, permRoleId]);

  // Expand / Collapse Treeview node
  const toggleRoleExpand = (roleId, e) => {
    e.stopPropagation();
    setExpandedRoleIds(prev => ({
      ...prev,
      [roleId]: !prev[roleId]
    }));
  };

  // Handle outside click for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal handlers for Admin User Profile
  const handleOpenEditModal = () => {
    setIsProfileOpen(false);
    setEditFullName(user?.fullName || '');
    setEditEmail(user?.email || 'admin@lichgiangday.edu.vn');
    setUpdateSuccess('');
    setUpdateError('');
    setIsEditModalOpen(true);
  };

  const handleOpenPasswordModal = () => {
    setIsProfileOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwdSuccess('');
    setPwdError('');
    setIsPasswordModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUpdateSuccess('');
    setUpdateError('');
    setUpdateLoading(true);

    try {
      await updateProfile({ fullName: editFullName, email: editEmail });
      setUpdateSuccess('Cập nhật thông tin thành công!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setUpdateSuccess('');
      }, 1200);
    } catch (err) {
      setUpdateError(err.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdSuccess('');
    setPwdError('');

    if (newPassword !== confirmPassword) {
      setPwdError('Mật khẩu mới và Nhập lại mật khẩu không khớp.');
      return;
    }

    if (newPassword.length < 6) {
      setPwdError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setPwdLoading(true);

    try {
      await changePassword({ oldPassword, newPassword });
      setPwdSuccess('Đổi mật khẩu thành công!');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPwdSuccess('');
      }, 1200);
    } catch (err) {
      setPwdError(err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setPwdLoading(false);
    }
  };

  // ==========================================
  // ROLE HANDLERS
  // ==========================================
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

  const handleSaveRole = async (e) => {
    e.preventDefault();
    setRoleFormError('');
    setRoleFormSuccess('');

    if (!roleFormData.roleName.trim()) {
      setRoleFormError('Vui lòng nhập tên nhóm người dùng.');
      return;
    }

    if (roleModalMode === 'create' && !roleFormData.roleId.trim()) {
      setRoleFormError('Vui lòng nhập mã nhóm người dùng.');
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
        setRoleFormSuccess('Cập nhật thông tin nhóm người dùng thành công!');
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

  const handleOpenDeleteModal = (role) => {
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

  // Filter roles
  const filteredRoles = roles.filter(role => 
    role.RoleId?.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
    role.RoleName?.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
    role.Description?.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );

  // ==========================================
  // USER HANDLERS
  // ==========================================
  const handleOpenCreateUserModal = () => {
    setUserModalMode('create');
    setUserFormData({
      userId: '',
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: selectedRoleId !== 'ALL' ? selectedRoleId : (roles.length > 0 ? roles[0].RoleId : 'ADMIN'),
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
      isActive: uItem.IsActive
    });
    setUserFormError('');
    setUserFormSuccess('');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
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

  // Reset Password Modal handlers
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

  // Toggle user status handler
  const handleToggleUserStatus = async (uItem) => {
    try {
      await apiToggleUserStatus(uItem.UserId);
      await fetchUsers();
    } catch (err) {
      alert(err.message || 'Không thể thay đổi trạng thái tài khoản.');
    }
  };

  // Delete User handlers
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

  // Filter users based on search, selected tree node, and locked toggle
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

  // ==========================================
  // PERMISSIONS MATRIX HANDLERS
  // ==========================================
  const handleToggleCell = (resourceId, field) => {
    setPermissionMatrix(prev => 
      prev.map(item => {
        if (item.ResourceId === resourceId) {
          return {
            ...item,
            [field]: item[field] === 1 ? 0 : 1
          };
        }
        return item;
      })
    );
  };

  const handleToggleRowAll = (resourceId) => {
    setPermissionMatrix(prev =>
      prev.map(item => {
        if (item.ResourceId === resourceId) {
          const isAllChecked = item.CanRead === 1 && item.CanCreate === 1 && item.CanUpdate === 1 && item.CanDelete === 1;
          const targetVal = isAllChecked ? 0 : 1;
          return {
            ...item,
            CanRead: targetVal,
            CanCreate: targetVal,
            CanUpdate: targetVal,
            CanDelete: targetVal
          };
        }
        return item;
      })
    );
  };

  const handleToggleColumnAll = (field) => {
    setPermissionMatrix(prev => {
      const isColumnAllChecked = prev.length > 0 && prev.every(item => item[field] === 1);
      const targetVal = isColumnAllChecked ? 0 : 1;
      return prev.map(item => ({
        ...item,
        [field]: targetVal
      }));
    });
  };

  const handleSavePermissions = async () => {
    setPermSaveLoading(true);
    setPermSaveSuccess('');
    setPermError('');

    try {
      const payload = permissionMatrix.map(item => ({
        resourceId: item.ResourceId,
        canRead: item.CanRead,
        canCreate: item.CanCreate,
        canUpdate: item.CanUpdate,
        canDelete: item.CanDelete
      }));

      await apiUpdateRolePermissions(permRoleId, payload);
      setPermSaveSuccess(`Lưu ma trận phân quyền cho nhóm '${permRoleId}' thành công!`);
      setTimeout(() => setPermSaveSuccess(''), 2500);
    } catch (err) {
      setPermError(err.message || 'Lưu phân quyền thất bại.');
    } finally {
      setPermSaveLoading(false);
    }
  };

  // Filter permission matrix by search query
  const filteredPermissionMatrix = permissionMatrix.filter(item => 
    item.ResourceId?.toLowerCase().includes(permSearchQuery.toLowerCase()) ||
    item.ResourceName?.toLowerCase().includes(permSearchQuery.toLowerCase()) ||
    item.Description?.toLowerCase().includes(permSearchQuery.toLowerCase())
  );

  const roleDisplayName = user?.role === 'ADMIN' ? 'Administrator' : user?.role || 'Administrator';
  const userEmail = user?.email || 'admin@lichgiangday.edu.vn';

  return (
    <div className="admin-light-theme">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <Calendar size={22} />
          </div>
          <span className="admin-brand-name">LịchGiảngDạy</span>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section">Tổng quan</div>
          <div 
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>

          <div className="admin-nav-section">Danh Mục Đào Tạo</div>
          <div className="admin-nav-item">
            <Building size={18} />
            <span>Tòa Nhà & Phòng Học</span>
          </div>
          <div className="admin-nav-item">
            <GraduationCap size={18} />
            <span>Khoa & Bộ Môn</span>
          </div>
          <div className="admin-nav-item">
            <Users size={18} />
            <span>Giảng Viên</span>
          </div>
          <div className="admin-nav-item">
            <BookOpen size={18} />
            <span>Môn Học & Lớp HP</span>
          </div>

          <div className="admin-nav-section">Lịch & Thời Khóa Biểu</div>
          <div className="admin-nav-item">
            <Calendar size={18} />
            <span>Thời Khóa Biểu</span>
          </div>
          <div className="admin-nav-item">
            <Clock size={18} />
            <span>Yêu Cầu Nghỉ & Dạy Bù</span>
          </div>

          {/* Cấu Hình Hệ Thống */}
          {(hasPermission('Roles', 'CanRead') || hasPermission('Users', 'CanRead') || hasPermission('RolePermissions', 'CanRead')) && (
            <>
              <div className="admin-nav-section">Cấu hình hệ thống</div>
              {hasPermission('Roles', 'CanRead') && (
                <div 
                  className={`admin-nav-item ${activeTab === 'roles' ? 'active' : ''}`}
                  onClick={() => setActiveTab('roles')}
                >
                  <ShieldCheck size={18} />
                  <span>Nhóm người dùng</span>
                </div>
              )}
              {hasPermission('Users', 'CanRead') && (
                <div 
                  className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  <Users size={18} />
                  <span>Người dùng</span>
                </div>
              )}
              {hasPermission('RolePermissions', 'CanRead') && (
                <div 
                  className={`admin-nav-item ${activeTab === 'permissions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('permissions')}
                >
                  <KeyRound size={18} />
                  <span>Phân quyền chức năng</span>
                </div>
              )}
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Header Topbar */}
        <header className="admin-topbar">
          {/* Header Search Bar */}
          <div className="admin-search-wrapper">
            <Search className="admin-search-icon" size={18} />
            <input 
              type="text" 
              className="admin-search-input"
              placeholder="Tìm kiếm thông tin, giảng viên, phòng học..."
            />
          </div>

          {/* Right Header Controls & Profile Dropdown */}
          <div className="admin-header-right">
            <button className="admin-icon-btn" title="Thông báo">
              <Bell size={19} />
              <span className="notification-dot"></span>
            </button>

            {/* Profile Dropdown Container */}
            <div className="profile-dropdown-container" ref={dropdownRef}>
              <div 
                className="profile-trigger" 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="avatar-circle">
                  {user?.username?.charAt(0) || 'A'}
                </div>
                <div className="profile-trigger-info">
                  <span className="profile-name">{user?.fullName || user?.username || 'Admin'}</span>
                  <span className="profile-role-badge">{roleDisplayName}</span>
                </div>
                <ChevronDown size={16} style={{ color: 'var(--admin-text-sub)' }} />
              </div>

              {/* Popup Dropdown Menu */}
              {isProfileOpen && (
                <div className="profile-dropdown-menu">
                  <div className="dropdown-header-card">
                    <div className="dropdown-avatar">
                      {user?.username?.charAt(0) || 'A'}
                    </div>
                    <div className="dropdown-user-details">
                      <div className="dropdown-fullname">{user?.fullName || user?.username}</div>
                      <div className="dropdown-email">
                        <Mail size={14} className="dropdown-icon" />
                        <span>{userEmail}</span>
                      </div>
                    </div>
                  </div>

                  <div className="dropdown-role-box">
                    <Shield size={16} className="role-icon" />
                    <div className="role-text-group">
                      <span className="role-label">Nhóm quyền:</span>
                      <span className="role-value">{roleDisplayName}</span>
                    </div>
                  </div>

                  <div className="dropdown-actions">
                    <button onClick={handleOpenEditModal} className="dropdown-btn-edit">
                      <UserCog size={16} />
                      <span>Thay Đổi Thông Tin</span>
                    </button>
                    <button onClick={handleOpenPasswordModal} className="dropdown-btn-edit">
                      <KeyRound size={16} />
                      <span>Đổi Mật Khẩu</span>
                    </button>
                    <button onClick={logout} className="dropdown-btn-logout">
                      <LogOut size={16} />
                      <span>Đăng Xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Body View Switching */}
        <main className="admin-body">

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <>
              <div className="admin-welcome-banner">
                <h2 className="admin-welcome-title">
                  Xin chào, {user?.fullName || user?.username}! 👋
                </h2>
                <p className="admin-welcome-desc">
                  Chào mừng bạn trở lại hệ thống quản trị <b>LịchGiảngDạy</b>. Tài khoản của bạn đang thuộc nhóm quyền <b>{roleDisplayName}</b>.
                </p>
              </div>

              {/* Quick Stats Grid */}
              <div className="admin-stats-grid">
                <div className="admin-stat-item">
                  <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <div className="admin-stat-number">{users.length || 1}</div>
                    <div className="admin-stat-text">Tài khoản người dùng</div>
                  </div>
                </div>

                <div className="admin-stat-item">
                  <div className="admin-stat-icon-bg" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="admin-stat-number">{roles.length || 1}</div>
                    <div className="admin-stat-text">Nhóm người dùng</div>
                  </div>
                </div>

                <div className="admin-stat-item">
                  <div className="admin-stat-icon-bg" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <div className="admin-stat-number">0</div>
                    <div className="admin-stat-text">Thời khóa biểu</div>
                  </div>
                </div>
              </div>

              <div className="admin-card" style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '40px' }}>
                <p style={{ fontSize: '0.95rem' }}>
                  📌 Các chức năng quản lý chi tiết (Khoa, Bộ môn, Tòa nhà, Giảng viên, Lịch dạy...) sẵn sàng phát triển trong các giai đoạn tiếp theo.
                </p>
              </div>
            </>
          )}

          {/* TAB 2: ROLES MANAGEMENT (NHÓM NGƯỜI DÙNG) */}
          {activeTab === 'roles' && (
            <div className="roles-management-container">
              {/* Page Header Toolbar */}
              <div className="page-header-toolbar">
                <div>
                  <h2 className="page-title">Quản Lý Nhóm Người Dùng</h2>
                  <p className="page-subtitle">Danh sách các nhóm quyền và phân định chức năng hệ thống</p>
                </div>
                <button className="btn-primary-add" onClick={handleOpenCreateRoleModal}>
                  <Plus size={18} />
                  <span>Thêm Nhóm Người Dùng</span>
                </button>
              </div>

              {/* Data Table Card */}
              <div className="table-container-card">
                <div className="table-filter-bar">
                  <div className="table-search-box">
                    <Search size={16} className="search-box-icon" />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm mã nhóm, tên nhóm, mô tả..."
                      value={roleSearchQuery}
                      onChange={(e) => setRoleSearchQuery(e.target.value)}
                    />
                  </div>
                  <button className="btn-refresh" onClick={fetchRoles} title="Làm mới danh sách">
                    <RefreshCw size={16} className={rolesLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {rolesError && (
                  <div className="alert-banner error">
                    <AlertCircle size={18} />
                    <span>{rolesError}</span>
                  </div>
                )}

                {/* Roles List Table */}
                <div className="table-responsive">
                  <table className="custom-data-table">
                    <thead>
                      <tr>
                        <th>Mã Nhóm</th>
                        <th>Tên Nhóm Người Dùng</th>
                        <th>Mô Tả</th>
                        <th>Số Tài Khoản</th>
                        <th>Loại Nhóm</th>
                        <th style={{ textAlign: 'right' }}>Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rolesLoading ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>
                            <div className="loading-state-box">
                              <Loader2 size={24} className="animate-spin" />
                              <span>Đang tải danh sách nhóm người dùng...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredRoles.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="empty-state-box">
                              <ShieldAlert size={36} style={{ color: 'var(--admin-text-sub)', marginBottom: '8px' }} />
                              <p style={{ margin: 0, fontWeight: 500 }}>Không tìm thấy nhóm người dùng nào</p>
                              <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>
                                {roleSearchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Bấm nút "Thêm Nhóm Người Dùng" để tạo nhóm mới'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredRoles.map((roleItem) => (
                          <tr key={roleItem.RoleId}>
                            <td>
                              <span className="role-code-badge">{roleItem.RoleId}</span>
                            </td>
                            <td className="role-name-cell">
                              <span className="font-semibold">{roleItem.RoleName}</span>
                            </td>
                            <td className="role-desc-cell">
                              {roleItem.Description || <i style={{ color: 'var(--admin-text-sub)' }}>Không có mô tả</i>}
                            </td>
                            <td>
                              <span className="user-count-badge">
                                <Users size={14} />
                                <span>{roleItem.UserCount || 0} tài khoản</span>
                              </span>
                            </td>
                            <td>
                              {roleItem.IsSystem === 1 ? (
                                <span className="badge-system">
                                  <Shield size={12} /> Hệ Thống
                                </span>
                              ) : (
                                <span className="badge-custom">
                                  <Layers size={12} /> Tùy Chỉnh
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="action-buttons-group">
                                <button 
                                  className="action-btn edit" 
                                  title="Chỉnh sửa"
                                  onClick={() => handleOpenEditRoleModal(roleItem)}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  className="action-btn delete" 
                                  title={roleItem.IsSystem === 1 ? 'Không thể xóa nhóm hệ thống' : 'Xóa nhóm người dùng'}
                                  onClick={() => handleOpenDeleteModal(roleItem)}
                                  disabled={roleItem.IsSystem === 1}
                                  style={roleItem.IsSystem === 1 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                                >
                                  <Trash2 size={16} />
                                </button>
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
          )}

          {/* TAB 3: USERS MANAGEMENT (NGƯỜI DÙNG DẠNG TREEVIEW) */}
          {activeTab === 'users' && (
            <div className="roles-management-container">
              {/* Page Header Toolbar */}
              <div className="page-header-toolbar">
                <div>
                  <h2 className="page-title">Quản Lý Người Dùng</h2>
                  <p className="page-subtitle">Quản lý danh sách tài khoản theo Cây thư mục Nhóm người dùng</p>
                </div>
                <button className="btn-primary-add" onClick={handleOpenCreateUserModal}>
                  <Plus size={18} />
                  <span>Thêm Người Dùng</span>
                </button>
              </div>

              {/* SPLIT PANEL LAYOUT (LEFT: TREEVIEW, RIGHT: DATA TABLE) */}
              <div className="user-management-split-layout">

                {/* LEFT COLUMN: TREEVIEW PANEL */}
                <div className="treeview-panel">
                  <div className="treeview-header">
                    <div className="treeview-title-group">
                      <FolderTree size={16} className="tree-header-icon" />
                      <span>NHÓM NGƯỜI DÙNG</span>
                    </div>
                  </div>

                  <div className="treeview-body">
                    {/* Root Node: Tất cả người dùng */}
                    <div 
                      className={`treeview-item root-node ${selectedRoleId === 'ALL' && !selectedUserId ? 'active' : ''}`}
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

                    {/* Roles Nodes List */}
                    <div className="treeview-list">
                      {roles.map(roleItem => {
                        const roleUsers = users.filter(u => u.Role === roleItem.RoleId);
                        const isExpanded = !!expandedRoleIds[roleItem.RoleId];
                        const isRoleSelected = selectedRoleId === roleItem.RoleId && !selectedUserId;

                        return (
                          <div key={roleItem.RoleId} className="treeview-group">
                            {/* Role Parent Node */}
                            <div 
                              className={`treeview-item role-node ${isRoleSelected ? 'active' : ''}`}
                              onClick={() => {
                                setSelectedRoleId(roleItem.RoleId);
                                setSelectedUserId(null);
                              }}
                            >
                              <div className="treeview-item-label">
                                <span 
                                  className="tree-expand-icon"
                                  onClick={(e) => toggleRoleExpand(roleItem.RoleId, e)}
                                >
                                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </span>
                                <ShieldCheck size={16} className="tree-icon role" />
                                <span className="role-title-text" title={roleItem.RoleName}>
                                  {roleItem.RoleName}
                                </span>
                              </div>
                              <span className="treeview-count-badge">{roleUsers.length}</span>
                            </div>

                            {/* Children Accounts List when Expanded */}
                            {isExpanded && (
                              <div className="treeview-children-list">
                                {roleUsers.length === 0 ? (
                                  <div className="treeview-child-empty">
                                    <span>Chưa có tài khoản</span>
                                  </div>
                                ) : (
                                  roleUsers.map(userItem => {
                                    const isUserSelected = selectedUserId === userItem.UserId;
                                    return (
                                      <div 
                                        key={userItem.UserId}
                                        className={`treeview-child-item ${isUserSelected ? 'active' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedRoleId(roleItem.RoleId);
                                          setSelectedUserId(userItem.UserId);
                                        }}
                                      >
                                        <div className="user-avatar-tiny">
                                          {userItem.Username?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div className="treeview-child-info">
                                          <span className="child-username">{userItem.Username}</span>
                                          <span className="child-fullname">{userItem.FullName || userItem.UserId}</span>
                                        </div>
                                        {userItem.IsActive === 0 && (
                                          <span className="tree-locked-badge" title="Đã bị khóa">Khóa</span>
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
                </div>

                {/* RIGHT COLUMN: MAIN DATA TABLE PANEL */}
                <div className="table-main-panel">
                  <div className="table-container-card" style={{ height: '100%' }}>
                    {/* Top Controls Toolbar */}
                    <div className="table-filter-bar" style={{ flexWrap: 'wrap', gap: '16px' }}>
                      <div className="table-search-box">
                        <Search size={16} className="search-box-icon" />
                        <input 
                          type="text" 
                          placeholder="Tìm kiếm tên, email, mã người dùng..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="filter-controls-right">
                        {/* Checkbox "Hiện tài khoản khóa" */}
                        <label className="checkbox-filter-label" onClick={() => setShowLockedUsersOnly(!showLockedUsersOnly)}>
                          {showLockedUsersOnly ? (
                            <CheckSquare size={17} className="checkbox-icon checked" />
                          ) : (
                            <Square size={17} className="checkbox-icon" />
                          )}
                          <span>Hiện tài khoản khóa</span>
                        </label>

                        <button className="btn-refresh" onClick={fetchUsers} title="Làm mới danh sách">
                          <RefreshCw size={16} className={usersLoading ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>

                    {usersError && (
                      <div className="alert-banner error">
                        <AlertCircle size={18} />
                        <span>{usersError}</span>
                      </div>
                    )}

                    {/* Users Table */}
                    <div className="table-responsive">
                      <table className="custom-data-table">
                        <thead>
                          <tr>
                            <th>NGƯỜI DÙNG</th>
                            <th>TÀI KHOẢN</th>
                            <th>EMAIL</th>
                            <th>NHÓM</th>
                            <th>TRẠNG THÁI</th>
                            <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersLoading ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>
                                <div className="loading-state-box">
                                  <Loader2 size={24} className="animate-spin" />
                                  <span>Đang tải danh sách tài khoản...</span>
                                </div>
                              </td>
                            </tr>
                          ) : filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                                <div className="empty-state-box">
                                  <Users size={36} style={{ color: 'var(--admin-text-sub)', marginBottom: '8px' }} />
                                  <p style={{ margin: 0, fontWeight: 500 }}>Không tìm thấy người dùng nào</p>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>
                                    {selectedRoleId !== 'ALL' ? `Thuộc nhóm ${selectedRoleId}` : 'Thử tìm kiếm với từ khóa khác'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((uItem) => {
                              const isSelf = user?.userId === uItem.UserId;
                              const isSuperAdmin = uItem.Username === 'ADMIN.0001' || uItem.UserId === 'USR000000000001';
                              const isRowHighlighted = selectedUserId === uItem.UserId;

                              return (
                                <tr key={uItem.UserId} className={isRowHighlighted ? 'row-highlighted' : ''}>
                                  <td>
                                    <div className="user-cell-flex">
                                      <div className="user-avatar-small">
                                        {uItem.Username?.charAt(0)?.toUpperCase() || 'U'}
                                      </div>
                                      <div>
                                        <div className="user-username-text font-semibold">
                                          {uItem.FullName || uItem.Username}
                                          {isSelf && <span className="self-tag">(Bạn)</span>}
                                        </div>
                                        <div className="user-id-sub">{uItem.UserId}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="font-mono text-sm" style={{ color: '#2563eb', fontWeight: 600 }}>
                                      {uItem.Username}
                                    </span>
                                  </td>
                                  <td style={{ color: 'var(--admin-text-muted)' }}>
                                    {uItem.Email || <i style={{ color: 'var(--admin-text-sub)' }}>Chưa có email</i>}
                                  </td>
                                  <td>
                                    <span className="role-code-badge" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
                                      {uItem.RoleName || uItem.Role}
                                    </span>
                                  </td>
                                  <td>
                                    {uItem.IsActive === 1 ? (
                                      <span className="badge-user-active">
                                        <UserCheck size={13} /> Hoạt động
                                      </span>
                                    ) : (
                                      <span className="badge-user-inactive">
                                        <UserX size={13} /> Đã khóa
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <div className="action-buttons-group">
                                      {/* Sửa */}
                                      <button 
                                        className="action-btn edit" 
                                        title="Chỉnh sửa thông tin"
                                        onClick={() => handleOpenEditUserModal(uItem)}
                                      >
                                        <Edit2 size={16} />
                                      </button>

                                      {/* Reset Mật Khẩu */}
                                      <button 
                                        className="action-btn key" 
                                        title="Đặt lại mật khẩu"
                                        onClick={() => handleOpenResetPwdModal(uItem)}
                                      >
                                        <Key size={16} />
                                      </button>

                                      {/* Bật/Tắt Khóa */}
                                      <button 
                                        className={`action-btn ${uItem.IsActive === 1 ? 'lock' : 'unlock'}`}
                                        title={
                                          isSuperAdmin ? 'Không thể khóa Admin tối cao' :
                                          isSelf ? 'Không thể tự khóa tài khoản của bạn' :
                                          uItem.IsActive === 1 ? 'Khóa tài khoản' : 'Mở khóa tài khoản'
                                        }
                                        onClick={() => handleToggleUserStatus(uItem)}
                                        disabled={isSuperAdmin || isSelf}
                                        style={isSuperAdmin || isSelf ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                                      >
                                        {uItem.IsActive === 1 ? <Lock size={16} /> : <Unlock size={16} />}
                                      </button>

                                      {/* Xóa */}
                                      <button 
                                        className="action-btn delete" 
                                        title={
                                          isSuperAdmin ? 'Không thể xóa Admin tối cao' :
                                          isSelf ? 'Không thể tự xóa tài khoản của bạn' : 'Xóa tài khoản'
                                        }
                                        onClick={() => handleOpenDeleteUserModal(uItem)}
                                        disabled={isSuperAdmin || isSelf}
                                        style={isSuperAdmin || isSelf ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                                      >
                                        <Trash2 size={16} />
                                      </button>
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
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: PERMISSIONS MANAGEMENT (PHÂN QUYỀN CHỨC NĂNG MA TRẬN) */}
          {activeTab === 'permissions' && (
            <div className="roles-management-container">
              {/* Page Header & Actions Toolbar */}
              <div className="page-header-toolbar">
                <div>
                  <h2 className="page-title">Phân Quyền Chức Năng</h2>
                  <p className="page-subtitle">Thiết lập quyền Xem, Thêm, Sửa, Xóa theo Nhóm người dùng</p>
                </div>

                <div className="perm-header-actions">
                  {/* Select Role Dropdown Box */}
                  <div className="perm-role-select-box">
                    <Shield size={16} className="perm-select-icon" />
                    <span className="perm-select-label">Nhóm quyền:</span>
                    <select 
                      className="perm-role-dropdown"
                      value={permRoleId}
                      onChange={(e) => setPermRoleId(e.target.value)}
                    >
                      {roles.map(r => (
                        <option key={r.RoleId} value={r.RoleId}>
                          {r.RoleName} ({r.RoleId})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Save Permissions Button */}
                  <button 
                    className="btn-primary-add" 
                    onClick={handleSavePermissions}
                    disabled={permSaveLoading}
                  >
                    {permSaveLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    <span>Lưu Phân Quyền</span>
                  </button>
                </div>
              </div>

              {/* Data Table Matrix Card */}
              <div className="table-container-card">
                {/* Search & Refresh Toolbar */}
                <div className="table-filter-bar">
                  <div className="table-search-box">
                    <Search size={16} className="search-box-icon" />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm tài nguyên, chức năng..."
                      value={permSearchQuery}
                      onChange={(e) => setPermSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    className="btn-refresh" 
                    onClick={() => fetchPermissions(permRoleId)} 
                    title="Tải lại ma trận phân quyền"
                  >
                    <RefreshCw size={16} className={permLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {permSaveSuccess && (
                  <div className="alert-banner success">
                    <CheckCircle2 size={18} />
                    <span>{permSaveSuccess}</span>
                  </div>
                )}

                {permError && (
                  <div className="alert-banner error">
                    <AlertCircle size={18} />
                    <span>{permError}</span>
                  </div>
                )}

                {/* Permissions Matrix Table */}
                <div className="table-responsive">
                  <table className="custom-data-table perm-matrix-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>TÀI NGUYÊN / CHỨC NĂNG</th>

                        {/* COLUMN: XEM */}
                        <th style={{ textAlign: 'center', width: '13%' }}>
                          <div 
                            className="perm-col-header-clickable"
                            onClick={() => handleToggleColumnAll('CanRead')}
                            title="Tích / Bỏ tích toàn bộ cột XEM"
                          >
                            <Eye size={15} />
                            <span>XEM</span>
                          </div>
                        </th>

                        {/* COLUMN: THÊM */}
                        <th style={{ textAlign: 'center', width: '13%' }}>
                          <div 
                            className="perm-col-header-clickable"
                            onClick={() => handleToggleColumnAll('CanCreate')}
                            title="Tích / Bỏ tích toàn bộ cột THÊM"
                          >
                            <PlusSquare size={15} />
                            <span>THÊM</span>
                          </div>
                        </th>

                        {/* COLUMN: SỬA */}
                        <th style={{ textAlign: 'center', width: '13%' }}>
                          <div 
                            className="perm-col-header-clickable"
                            onClick={() => handleToggleColumnAll('CanUpdate')}
                            title="Tích / Bỏ tích toàn bộ cột SỬA"
                          >
                            <Edit3 size={15} />
                            <span>SỬA</span>
                          </div>
                        </th>

                        {/* COLUMN: XÓA */}
                        <th style={{ textAlign: 'center', width: '13%' }}>
                          <div 
                            className="perm-col-header-clickable"
                            onClick={() => handleToggleColumnAll('CanDelete')}
                            title="Tích / Bỏ tích toàn bộ cột XÓA"
                          >
                            <Trash size={15} />
                            <span>XÓA</span>
                          </div>
                        </th>

                        {/* COLUMN: TẤT CẢ */}
                        <th style={{ textAlign: 'center', width: '8%' }}>
                          TẤT CẢ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {permLoading ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="loading-state-box">
                              <Loader2 size={24} className="animate-spin" />
                              <span>Đang tải ma trận phân quyền cho nhóm '{permRoleId}'...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredPermissionMatrix.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="empty-state-box">
                              <ShieldAlert size={36} style={{ color: 'var(--admin-text-sub)', marginBottom: '8px' }} />
                              <p style={{ margin: 0, fontWeight: 500 }}>Không tìm thấy tài nguyên nào</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredPermissionMatrix.map((item) => {
                          const isRowAllChecked = item.CanRead === 1 && item.CanCreate === 1 && item.CanUpdate === 1 && item.CanDelete === 1;

                          return (
                            <tr key={item.ResourceId}>
                              <td>
                                <div className="perm-resource-cell">
                                  <div className="resource-name-title font-semibold">
                                    {item.ResourceName}
                                  </div>
                                  <div className="resource-id-tag">
                                    <code>{item.ResourceId}</code> - <span style={{ color: 'var(--admin-text-sub)' }}>{item.Description || 'Tài nguyên hệ thống'}</span>
                                  </div>
                                </div>
                              </td>

                              {/* CHECKBOX XEM */}
                              <td style={{ textAlign: 'center' }}>
                                <label className="custom-checkbox-wrapper">
                                  <input 
                                    type="checkbox"
                                    checked={item.CanRead === 1}
                                    onChange={() => handleToggleCell(item.ResourceId, 'CanRead')}
                                  />
                                  <span className="checkbox-custom-box"></span>
                                </label>
                              </td>

                              {/* CHECKBOX THÊM */}
                              <td style={{ textAlign: 'center' }}>
                                <label className="custom-checkbox-wrapper">
                                  <input 
                                    type="checkbox"
                                    checked={item.CanCreate === 1}
                                    onChange={() => handleToggleCell(item.ResourceId, 'CanCreate')}
                                  />
                                  <span className="checkbox-custom-box"></span>
                                </label>
                              </td>

                              {/* CHECKBOX SỬA */}
                              <td style={{ textAlign: 'center' }}>
                                <label className="custom-checkbox-wrapper">
                                  <input 
                                    type="checkbox"
                                    checked={item.CanUpdate === 1}
                                    onChange={() => handleToggleCell(item.ResourceId, 'CanUpdate')}
                                  />
                                  <span className="checkbox-custom-box"></span>
                                </label>
                              </td>

                              {/* CHECKBOX XÓA */}
                              <td style={{ textAlign: 'center' }}>
                                <label className="custom-checkbox-wrapper">
                                  <input 
                                    type="checkbox"
                                    checked={item.CanDelete === 1}
                                    onChange={() => handleToggleCell(item.ResourceId, 'CanDelete')}
                                  />
                                  <span className="checkbox-custom-box"></span>
                                </label>
                              </td>

                              {/* CHECKBOX TẤT CẢ ROW */}
                              <td style={{ textAlign: 'center' }}>
                                <label className="custom-checkbox-wrapper row-all">
                                  <input 
                                    type="checkbox"
                                    checked={isRowAllChecked}
                                    onChange={() => handleToggleRowAll(item.ResourceId)}
                                  />
                                  <span className="checkbox-custom-box"></span>
                                </label>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ==========================================
          MODALS FOR USER PROFILE & CHANGE PASSWORD
         ========================================== */}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Thay Đổi Thông Tin Cá Nhân</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {updateSuccess && (
              <div className="alert-banner success">
                <CheckCircle2 size={18} />
                <span>{updateSuccess}</span>
              </div>
            )}

            {updateError && (
              <div className="alert-banner error">
                <AlertCircle size={18} />
                <span>{updateError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div className="modal-form-group">
                <label className="modal-label">Tên tài khoản (Username)</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  value={user?.username || ''} 
                  disabled 
                  style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} 
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Họ và Tên</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="Nhập họ và tên"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required 
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Địa chỉ Email</label>
                <input 
                  type="email" 
                  className="modal-input" 
                  placeholder="Nhập địa chỉ email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="btn-save" disabled={updateLoading}>
                  {updateLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={16} className="animate-spin" /> Đang lưu...
                    </span>
                  ) : (
                    'Lưu Thay Đổi'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Đổi Mật Khẩu</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {pwdSuccess && (
              <div className="alert-banner success">
                <CheckCircle2 size={18} />
                <span>{pwdSuccess}</span>
              </div>
            )}

            {pwdError && (
              <div className="alert-banner error">
                <AlertCircle size={18} />
                <span>{pwdError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="modal-form-group">
                <label className="modal-label">Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  className="modal-input" 
                  placeholder="Nhập mật khẩu hiện tại"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required 
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Mật khẩu mới</label>
                <input 
                  type="password" 
                  className="modal-input" 
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Nhập lại mật khẩu mới</label>
                <input 
                  type="password" 
                  className="modal-input" 
                  placeholder="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="btn-save" disabled={pwdLoading}>
                  {pwdLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={16} className="animate-spin" /> Đang đổi...
                    </span>
                  ) : (
                    'Đổi Mật Khẩu'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODALS FOR CREATE / EDIT / DELETE ROLE
         ========================================== */}

      {/* Create / Edit Role Modal */}
      {isRoleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {roleModalMode === 'create' ? 'Thêm Nhóm Người Dùng Mới' : 'Chỉnh Sửa Nhóm Người Dùng'}
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

            <form onSubmit={handleSaveRole}>
              <div className="modal-form-group">
                <label className="modal-label">
                  Mã Nhóm Quyền <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="Ví dụ: GIANGVIEN, SINHVIEN, TROGIANG"
                  value={roleFormData.roleId}
                  onChange={(e) => setRoleFormData({ ...roleFormData, roleId: e.target.value })}
                  disabled={roleModalMode === 'edit'}
                  style={roleModalMode === 'edit' ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : {}}
                  required 
                />
                <span className="form-help-text">
                  {roleModalMode === 'create' ? 'Mã định danh duy nhất (viết hoa, không dấu, không khoảng trắng)' : 'Mã định danh không được phép thay đổi'}
                </span>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">
                  Tên Nhóm Người Dùng <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="Ví dụ: Giảng Viên Khoa CNTT"
                  value={roleFormData.roleName}
                  onChange={(e) => setRoleFormData({ ...roleFormData, roleName: e.target.value })}
                  required 
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Mô Tả Diễn Giải</label>
                <textarea 
                  className="modal-input modal-textarea" 
                  placeholder="Mô tả chức năng hoặc phạm vi của nhóm quyền..."
                  value={roleFormData.description}
                  rows={3}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
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
                    roleModalMode === 'create' ? 'Tạo Nhóm Mới' : 'Lưu Thay Đổi'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Role Modal */}
      {isDeleteModalOpen && deletingRole && (
        <div className="modal-overlay">
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper">
              <ShieldAlert size={32} />
            </div>
            
            <h3 className="delete-modal-title">Xác Nhận Xóa Nhóm</h3>
            <p className="delete-modal-desc">
              Bạn có chắc chắn muốn xóa nhóm người dùng <b style={{ color: 'var(--admin-text-main)' }}>{deletingRole.RoleName} ({deletingRole.RoleId})</b> không? Hành động này không thể hoàn tác.
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
                  'Xóa Nhóm Người Dùng'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODALS FOR USER MANAGEMENT (CREATE / EDIT / RESET / DELETE)
         ========================================== */}

      {/* Create / Edit User Modal */}
      {isUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {userModalMode === 'create' ? 'Thêm Tài Khoản Người Dùng Mới' : 'Chỉnh Sửa Tài Khoản Người Dùng'}
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

            <form onSubmit={handleSaveUser}>
              <div className="modal-form-group">
                <label className="modal-label">
                  Tên đăng nhập (Username) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="Ví dụ: GIANGVIEN.0001, trogiang_cntt"
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
                    Mật khẩu khởi tạo <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="password" 
                    className="modal-input" 
                    placeholder="Mật khẩu khởi tạo (ít nhất 6 ký tự)"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    required 
                  />
                </div>
              )}

              <div className="modal-form-group">
                <label className="modal-label">Họ và Tên người dùng</label>
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
