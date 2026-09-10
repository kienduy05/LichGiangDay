import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Building, GraduationCap, Users, Calendar, 
  Clock, FileText, Bell, LogOut, ShieldCheck, BookOpen, Search, 
  ChevronDown, Mail, Shield, UserCog, KeyRound, X, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, logout, updateProfile, changePassword } = useAuth();
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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      await updateProfile({
        fullName: editFullName,
        email: editEmail
      });
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
          <div className="admin-nav-item active">
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

          <div className="admin-nav-section">Hệ Thống</div>
          <div className="admin-nav-item">
            <ShieldCheck size={18} />
            <span>Phân Quyền (Roles)</span>
          </div>
          <div className="admin-nav-item">
            <FileText size={18} />
            <span>Nhật Ký Hệ Thống</span>
          </div>
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

        {/* Main Dashboard Body */}
        <main className="admin-body">
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
                <div className="admin-stat-number">0</div>
                <div className="admin-stat-text">Giảng viên</div>
              </div>
            </div>

            <div className="admin-stat-item">
              <div className="admin-stat-icon-bg" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <Building size={24} />
              </div>
              <div>
                <div className="admin-stat-number">0</div>
                <div className="admin-stat-text">Phòng học</div>
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
        </main>
      </div>

      {/* Edit Profile Modal Dialog */}
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
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '12px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} />
                <span>{updateSuccess}</span>
              </div>
            )}

            {updateError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {/* Change Password Modal Dialog */}
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
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '12px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} />
                <span>{pwdSuccess}</span>
              </div>
            )}

            {pwdError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
    </div>
  );
}
