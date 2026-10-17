import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Search, Bell, ChevronDown, Mail, Shield, UserCog, KeyRound, LogOut, Menu,
  CheckCheck, Clock, AlertCircle, ArrowRight, Loader2, Calendar, UserCheck
} from 'lucide-react';
import {
  apiGetThongBao,
  apiCountThongBaoChuaDoc,
  apiMarkThongBaoDaDoc
} from '../../../utils/apiBienDongLich';
import './AdminTopbar.css';

export default function AdminTopbar({
  dropdownRef,
  isProfileOpen,
  setIsProfileOpen,
  onOpenEditModal,
  onOpenPasswordModal,
  onToggleMobileSidebar,
  onNavigateTab
}) {
  const { user, logout } = useAuth();

  const roleDisplayName = user?.role === 'ADMIN' ? 'Administrator' : user?.role || 'Administrator';
  const userEmail = user?.email || 'admin@lichgiangday.edu.vn';

  // ─── Notification States ───
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState('unread'); // 'unread' | 'read'
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifDropdownRef = useRef(null);

  // Fetch số lượng chưa đọc
  const fetchUnreadCount = async () => {
    try {
      const res = await apiCountThongBaoChuaDoc();
      setUnreadCount(Number(res?.unreadCount) || 0);
    } catch {
      // Bỏ qua lỗi kết nối polling ngầm
    }
  };

  // Fetch danh sách thông báo theo tab
  const fetchNotifications = async (tab = notifTab) => {
    setNotifLoading(true);
    try {
      const data = await apiGetThongBao({ tab, limit: 30 });
      setNotifications(data || []);
    } catch (err) {
      console.warn('Lỗi tải thông báo:', err.message);
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  // Lắng nghe click outside để đóng notification dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen]);

  // Polling unread count định kỳ mỗi 30 giây
  useEffect(() => {
    fetchUnreadCount();
    const timer = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Khi toggle dropdown hoặc đổi tab
  const handleToggleNotif = () => {
    const nextState = !isNotifOpen;
    setIsNotifOpen(nextState);
    if (nextState) {
      fetchNotifications(notifTab);
      fetchUnreadCount();
    }
  };

  const handleTabChange = (newTab) => {
    setNotifTab(newTab);
    fetchNotifications(newTab);
  };

  // Đánh dấu tất cả là đã đọc (đẩy toàn bộ sang ThongBaoDaDoc)
  const handleMarkAllRead = async () => {
    try {
      await apiMarkThongBaoDaDoc('all');
      setUnreadCount(0);
      if (notifTab === 'unread') {
        setNotifications([]);
      } else {
        fetchNotifications('read');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Click vào 1 thông báo
  const handleClickNotif = async (item) => {
    try {
      // Nếu là thông báo chưa đọc, đẩy sang ThongBaoDaDoc
      if (!item.DaDoc && item.DaDoc !== 1) {
        await apiMarkThongBaoDaDoc(item.MaThongBao);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.filter(n => n.MaThongBao !== item.MaThongBao));
      }
      setIsNotifOpen(false);

      // Nếu có điều hướng đến tab duyệt yêu cầu
      if (onNavigateTab && (item.LoaiThongBao === 'NewRequest' || item.MaDoiTuongLienQuan?.startsWith('YCN_') || item.MaDoiTuongLienQuan?.startsWith('DKDB_'))) {
        onNavigateTab('duyetyeucau');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper render icon theo loại thông báo
  const renderNotifIcon = (type) => {
    switch (type) {
      case 'NewRequest':
        return <AlertCircle size={18} className="notif-type-icon new-req" />;
      case 'Approved':
        return <UserCheck size={18} className="notif-type-icon approved" />;
      case 'Makeup':
        return <Calendar size={18} className="notif-type-icon makeup" />;
      case 'SubstituteRequest':
        return <UserCog size={18} className="notif-type-icon sub" />;
      default:
        return <Bell size={18} className="notif-type-icon default" />;
    }
  };

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        {/* Hamburger Toggle Button (Mobile & Tablet) */}
        <button
          className="admin-hamburger-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Mở thanh điều hướng"
        >
          <Menu size={22} />
        </button>

        <div className="admin-search-wrapper">
          <Search className="admin-search-icon" size={18} />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm kiếm thông tin, giảng viên, phòng học..."
          />
        </div>
      </div>

      <div className="admin-header-right">
        {/* Notification Bell Dropdown Container */}
        <div className="notif-bell-container" ref={notifDropdownRef}>
          <button
            className={`admin-icon-btn ${isNotifOpen ? 'active' : ''}`}
            title="Xem thông báo"
            onClick={handleToggleNotif}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="notification-badge-count">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {isNotifOpen && (
            <div className="admin-notif-dropdown">
              <div className="admin-notif-header">
                <div className="notif-header-title">
                  <span>Thông Báo</span>
                  {unreadCount > 0 && (
                    <span className="notif-unread-tag">{unreadCount} mới</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    className="notif-mark-all-btn"
                    onClick={handleMarkAllRead}
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <CheckCheck size={14} />
                    <span>Đã đọc tất cả</span>
                  </button>
                )}
              </div>

              {/* Tabs chuyển đổi: Chưa đọc (ThongBao) / Đã đọc (ThongBaoDaDoc) */}
              <div className="admin-notif-tabs">
                <button
                  className={`notif-tab-btn ${notifTab === 'unread' ? 'active' : ''}`}
                  onClick={() => handleTabChange('unread')}
                >
                  Chưa đọc {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <button
                  className={`notif-tab-btn ${notifTab === 'read' ? 'active' : ''}`}
                  onClick={() => handleTabChange('read')}
                >
                  Lịch sử đã đọc
                </button>
              </div>

              {/* Danh sách thông báo */}
              <div className="admin-notif-list">
                {notifLoading ? (
                  <div className="notif-loading-box">
                    <Loader2 size={20} className="animate-spin" />
                    <span>Đang tải thông báo...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="notif-empty-box">
                    <Bell size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <p>{notifTab === 'unread' ? 'Không có thông báo chưa đọc nào.' : 'Chưa có lịch sử thông báo đã đọc.'}</p>
                  </div>
                ) : (
                  notifications.map(item => (
                    <div
                      key={item.MaThongBao}
                      className={`admin-notif-item ${notifTab === 'unread' ? 'unread' : 'read'}`}
                      onClick={() => handleClickNotif(item)}
                    >
                      <div className="notif-item-icon-col">
                        {renderNotifIcon(item.LoaiThongBao)}
                      </div>
                      <div className="notif-item-body">
                        <div className="notif-item-title-row">
                          <span className="notif-item-title">{item.TieuDe || 'Thông báo hệ thống'}</span>
                        </div>
                        <p className="notif-item-content">{item.NoiDung}</p>
                        <div className="notif-item-meta">
                          <Clock size={12} />
                          <span>{new Date(item.ThoiGianGui).toLocaleString('vi-VN')}</span>
                          {item.ThoiGianDoc && (
                            <span style={{ marginLeft: '8px', color: '#94a3b8' }}>
                              (Đọc: {new Date(item.ThoiGianDoc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer chuyển sang Duyệt yêu cầu */}
              {onNavigateTab && (
                <div className="admin-notif-footer">
                  <button
                    className="notif-footer-link"
                    onClick={() => {
                      setIsNotifOpen(false);
                      onNavigateTab('duyetyeucau');
                    }}
                  >
                    <span>Vào module Duyệt Yêu Cầu</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
