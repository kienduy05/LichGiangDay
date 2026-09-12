import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  LayoutDashboard, Building, Layers, School, Network, UserCheck,
  BookOpen, Users, BookMarked, CalendarDays, Clock,
  Calendar, ShieldCheck, KeyRound
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

        {/* DỮ LIỆU NỀN */}
        <div className="admin-nav-section">Dữ liệu nền</div>
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
        <div
          className={`admin-nav-item ${activeTab === 'khoa' ? 'active' : ''}`}
          onClick={() => setActiveTab('khoa')}
        >
          <School size={18} />
          <span>Quản lý Khoa</span>
        </div>
        <div
          className={`admin-nav-item ${activeTab === 'bomon' ? 'active' : ''}`}
          onClick={() => setActiveTab('bomon')}
        >
          <Network size={18} />
          <span>Quản lý Bộ môn</span>
        </div>
        <div
          className={`admin-nav-item ${activeTab === 'giangvien' ? 'active' : ''}`}
          onClick={() => setActiveTab('giangvien')}
        >
          <UserCheck size={18} />
          <span>Quản lý Giảng viên</span>
        </div>
        <div
          className={`admin-nav-item ${activeTab === 'monhoc' ? 'active' : ''}`}
          onClick={() => setActiveTab('monhoc')}
        >
          <BookOpen size={18} />
          <span>Quản lý Môn học</span>
        </div>
        <div
          className={`admin-nav-item ${activeTab === 'lopsinhvien' ? 'active' : ''}`}
          onClick={() => setActiveTab('lopsinhvien')}
        >
          <Users size={18} />
          <span>Quản lý Lớp sinh viên</span>
        </div>
        <div
          className={`admin-nav-item ${activeTab === 'lophocphan' ? 'active' : ''}`}
          onClick={() => setActiveTab('lophocphan')}
        >
          <BookMarked size={18} />
          <span>Quản lý Lớp học phần</span>
        </div>
        <div
          className={`admin-nav-item ${activeTab === 'hocky' ? 'active' : ''}`}
          onClick={() => setActiveTab('hocky')}
        >
          <CalendarDays size={18} />
          <span>Học kỳ & Năm học</span>
        </div>
        <div
          className={`admin-nav-item ${activeTab === 'tiethoc' ? 'active' : ''}`}
          onClick={() => setActiveTab('tiethoc')}
        >
          <Clock size={18} />
          <span>Tiết học & Ca học</span>
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
