import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  LayoutDashboard, Building, Layers, School, Network, UserCheck,
  BookOpen, Users, BookMarked, CalendarDays, Clock,
  Calendar, CalendarRange, ShieldCheck, KeyRound, GraduationCap
} from 'lucide-react';
import './AdminSidebar.css';

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const { user, hasPermission } = useAuth();

  // Kiểm tra xem nhóm Dữ liệu nền có mục nào được phép xem không
  const hasBaseDataPermissions = (
    hasPermission('ToaNha', 'CanRead') ||
    hasPermission('PhongHoc', 'CanRead') ||
    hasPermission('Khoa', 'CanRead') ||
    hasPermission('BoMon', 'CanRead') ||
    hasPermission('GiangVien', 'CanRead') ||
    hasPermission('MonHoc', 'CanRead') ||
    hasPermission('LopSinhVien', 'CanRead') ||
    hasPermission('LopHocPhan', 'CanRead') ||
    hasPermission('HocKy', 'CanRead') ||
    hasPermission('TietHoc', 'CanRead')
  );

  // Kiểm tra xem nhóm Lịch & Thời khóa biểu có mục nào được xem không
  const hasSchedulePermissions = (
    hasPermission('ThoiKhoaBieu', 'CanRead') ||
    hasPermission('LopHocPhan', 'CanRead')
  );

  // Kiểm tra xem nhóm Cấu hình hệ thống có mục nào được xem không
  const hasSystemPermissions = (
    hasPermission('Roles', 'CanRead') ||
    hasPermission('Users', 'CanRead') ||
    hasPermission('RolePermissions', 'CanRead')
  );

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-logo">
          <Calendar size={22} />
        </div>
        <span className="admin-brand-name">LịchGiảngDạy</span>
      </div>

      <nav className="admin-sidebar-nav">
        {/* TỔNG QUAN */}
        <div className="admin-nav-section">Tổng quan</div>
        <div
          className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </div>

        {/* DỮ LIỆU NỀN (Chỉ hiện các mục có quyền CanRead) */}
        {hasBaseDataPermissions && (
          <>
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

            {hasPermission('Khoa', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'khoa' ? 'active' : ''}`}
                onClick={() => setActiveTab('khoa')}
              >
                <School size={18} />
                <span>Quản lý Khoa</span>
              </div>
            )}

            {hasPermission('BoMon', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'bomon' ? 'active' : ''}`}
                onClick={() => setActiveTab('bomon')}
              >
                <Network size={18} />
                <span>Quản lý Bộ môn</span>
              </div>
            )}

            {hasPermission('GiangVien', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'giangvien' ? 'active' : ''}`}
                onClick={() => setActiveTab('giangvien')}
              >
                <UserCheck size={18} />
                <span>Quản lý Giảng viên</span>
              </div>
            )}

            {hasPermission('MonHoc', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'monhoc' ? 'active' : ''}`}
                onClick={() => setActiveTab('monhoc')}
              >
                <BookOpen size={18} />
                <span>Quản lý Môn học</span>
              </div>
            )}

            {hasPermission('LopSinhVien', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'lopsinhvien' ? 'active' : ''}`}
                onClick={() => setActiveTab('lopsinhvien')}
              >
                <Users size={18} />
                <span>Quản lý Lớp sinh viên</span>
              </div>
            )}

            {hasPermission('LopSinhVien', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'khoasinhvien' ? 'active' : ''}`}
                onClick={() => setActiveTab('khoasinhvien')}
              >
                <GraduationCap size={18} />
                <span>Quản lý Khóa sinh viên</span>
              </div>
            )}

            {hasPermission('LopHocPhan', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'lophocphan' ? 'active' : ''}`}
                onClick={() => setActiveTab('lophocphan')}
              >
                <BookMarked size={18} />
                <span>Quản lý Lớp học phần</span>
              </div>
            )}

            {hasPermission('HocKy', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'hocky' ? 'active' : ''}`}
                onClick={() => setActiveTab('hocky')}
              >
                <CalendarDays size={18} />
                <span>Học kỳ & Năm học</span>
              </div>
            )}

            {hasPermission('TietHoc', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'tiethoc' ? 'active' : ''}`}
                onClick={() => setActiveTab('tiethoc')}
              >
                <Clock size={18} />
                <span>Tiết học & Ca học</span>
              </div>
            )}
          </>
        )}

        {/* LỊCH & THỜI KHÓA BIỂU */}
        {hasSchedulePermissions && (
          <>
            <div className="admin-nav-section">Lịch & Thời Khóa Biểu</div>

            {hasPermission('ThoiKhoaBieu', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'thoikhoabieu' ? 'active' : ''}`}
                onClick={() => setActiveTab('thoikhoabieu')}
              >
                <Calendar size={18} />
                <span>Tạo & Xếp Thời Khóa Biểu</span>
              </div>
            )}

            {hasPermission('ThoiKhoaBieu', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'lichgiangday' ? 'active' : ''}`}
                onClick={() => setActiveTab('lichgiangday')}
              >
                <CalendarRange size={18} />
                <span>Lịch Giảng Dạy & Học Tập</span>
              </div>
            )}

            {/* PHÂN CÔNG GIẢNG VIÊN (ĐỘC QUYỀN ROLE BOMON) */}
            {user?.role === 'BOMON' && (
              <div
                className={`admin-nav-item ${activeTab === 'phanconggiangvien' ? 'active' : ''}`}
                onClick={() => setActiveTab('phanconggiangvien')}
              >
                <UserCheck size={18} />
                <span>Phân Công Giảng Viên</span>
              </div>
            )}
          </>
        )}

        {/* CẤU HÌNH HỆ THỐNG */}
        {hasSystemPermissions && (
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
