import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Search, Bell, ChevronDown, Mail, Shield, UserCog, KeyRound, LogOut
} from 'lucide-react';
import './AdminTopbar.css';

export default function AdminTopbar({
  dropdownRef,
  isProfileOpen,
  setIsProfileOpen,
  onOpenEditModal,
  onOpenPasswordModal
}) {
  const { user, logout } = useAuth();

  const roleDisplayName = user?.role === 'ADMIN' ? 'Administrator' : user?.role || 'Administrator';
  const userEmail = user?.email || 'admin@lichgiangday.edu.vn';

  return (
    <header className="admin-topbar">
      <div className="admin-search-wrapper">
        <Search className="admin-search-icon" size={18} />
        <input
          type="text"
          className="admin-search-input"
          placeholder="Tìm kiếm thông tin, giảng viên, phòng học..."
        />
      </div>

      <div className="admin-header-right">
        <button className="admin-icon-btn" title="Thông báo">
          <Bell size={19} />
          <span className="notification-dot"></span>
        </button>

        {/* Profile Dropdown */}
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
                <button onClick={onOpenEditModal} className="dropdown-btn-edit">
                  <UserCog size={16} />
                  <span>Thay Đổi Thông Tin</span>
                </button>
                <button onClick={onOpenPasswordModal} className="dropdown-btn-edit">
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
  );
}
