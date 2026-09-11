import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  LayoutDashboard, Building, GraduationCap, Users, Calendar,
  Clock, BookOpen, ShieldCheck, KeyRound, Layers
} from 'lucide-react';
import './AdminSidebar.css';

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const { hasPermission } = useAuth();

  return (
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
        {hasPermission('ToaNha', 'CanRead') && (
          <div
            className={`admin-nav-item ${activeTab === 'toanha' ? 'active' : ''}`}
            onClick={() => setActiveTab('toanha')}
          >
            <Building size={18} />
            <span>Quản lý Tòa nhà</span>
          </div>
        )}
        {hasPermission('PhongHoc', 'CanRead') && (
          <div
            className={`admin-nav-item ${activeTab === 'phonghoc' ? 'active' : ''}`}
            onClick={() => setActiveTab('phonghoc')}
          >
            <Layers size={18} />
            <span>Quản lý Phòng học</span>
          </div>
        )}
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
  );
}
