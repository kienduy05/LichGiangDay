import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  LayoutDashboard, Building, Layers, School, Network, UserCheck,
  BookOpen, Users, BookMarked, CalendarDays, Clock,
  Calendar, CalendarRange, ShieldCheck, KeyRound, GraduationCap, X,
  ClipboardCheck, Activity
} from 'lucide-react';
import './AdminSidebar.css';

export default function AdminSidebar({ activeTab, setActiveTab, isOpenMobile, onCloseMobile }) {
  const { user, hasPermission } = useAuth();

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

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
    hasPermission('LopHocPhan', 'CanRead') ||
    ['ADMIN', 'PHONGDAOTAO', 'BOMON'].includes(user?.role)
  );

  // Kiểm tra xem nhóm Cấu hình hệ thống có mục nào được xem không
  const hasSystemPermissions = (
    hasPermission('Roles', 'CanRead') ||
    hasPermission('Users', 'CanRead') ||
    hasPermission('RolePermissions', 'CanRead')
  );

  return (
    <aside className={`admin-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-brand-group">
          <div className="admin-sidebar-logo">
            <Calendar size={22} />
          </div>
          <span className="admin-brand-name">LịchGiảngDạy</span>
        </div>
        {/* Nút đóng trên mobile */}
        <button
          className="admin-sidebar-close-btn"
          onClick={onCloseMobile}
          aria-label="Đóng thanh điều hướng"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        {/* TỔNG QUAN */}
        <div className="admin-nav-section">Tổng quan</div>
        <div
          className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('dashboard')}
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
                onClick={() => handleNavClick('toanha')}
              >
                <Building size={18} />
                <span>Quản lý Tòa nhà</span>
              </div>
            )}

            {hasPermission('PhongHoc', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'phonghoc' ? 'active' : ''}`}
                onClick={() => handleNavClick('phonghoc')}
              >
                <Layers size={18} />
                <span>Quản lý Phòng học</span>
              </div>
            )}

            {hasPermission('Khoa', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'khoa' ? 'active' : ''}`}
                onClick={() => handleNavClick('khoa')}
              >
                <School size={18} />
                <span>Quản lý Khoa</span>
              </div>
            )}

            {hasPermission('BoMon', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'bomon' ? 'active' : ''}`}
                onClick={() => handleNavClick('bomon')}
              >
                <Network size={18} />
                <span>Quản lý Bộ môn</span>
              </div>
            )}

            {hasPermission('GiangVien', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'giangvien' ? 'active' : ''}`}
                onClick={() => handleNavClick('giangvien')}
              >
                <UserCheck size={18} />
                <span>Quản lý Giảng viên</span>
              </div>
            )}

            {hasPermission('MonHoc', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'monhoc' ? 'active' : ''}`}
                onClick={() => handleNavClick('monhoc')}
              >
                <BookOpen size={18} />
                <span>Quản lý Môn học</span>
              </div>
            )}

            {hasPermission('LopSinhVien', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'lopsinhvien' ? 'active' : ''}`}
                onClick={() => handleNavClick('lopsinhvien')}
              >
                <Users size={18} />
                <span>Quản lý Lớp sinh viên</span>
              </div>
            )}

            {hasPermission('LopSinhVien', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'khoasinhvien' ? 'active' : ''}`}
                onClick={() => handleNavClick('khoasinhvien')}
              >
                <GraduationCap size={18} />
                <span>Quản lý Khóa sinh viên</span>
              </div>
            )}

            {hasPermission('LopHocPhan', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'lophocphan' ? 'active' : ''}`}
                onClick={() => handleNavClick('lophocphan')}
              >
                <BookMarked size={18} />
                <span>Quản lý Lớp học phần</span>
              </div>
            )}

            {hasPermission('HocKy', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'hocky' ? 'active' : ''}`}
                onClick={() => handleNavClick('hocky')}
              >
                <CalendarDays size={18} />
                <span>Học kỳ & Năm học</span>
              </div>
            )}

            {hasPermission('TietHoc', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'tiethoc' ? 'active' : ''}`}
                onClick={() => handleNavClick('tiethoc')}
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
                onClick={() => handleNavClick('thoikhoabieu')}
              >
                <Calendar size={18} />
                <span>Tạo & Xếp Thời Khóa Biểu</span>
              </div>
            )}

            {hasPermission('ThoiKhoaBieu', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'lichgiangday' ? 'active' : ''}`}
                onClick={() => handleNavClick('lichgiangday')}
              >
                <CalendarRange size={18} />
                <span>Lịch Giảng Dạy & Học Tập</span>
              </div>
            )}

            {/* PHÂN CÔNG GIẢNG VIÊN (ROLE BOMON) */}
            {user?.role === 'BOMON' && (
              <div
                className={`admin-nav-item ${activeTab === 'phanconggiangvien' ? 'active' : ''}`}
                onClick={() => handleNavClick('phanconggiangvien')}
              >
                <UserCheck size={18} />
                <span>Phân Công Giảng Viên</span>
              </div>
            )}

            {/* DUYỆT YÊU CẦU GIẢNG DẠY (ĐỘC QUYỀN ROLE BOMON) */}
            {user?.role === 'BOMON' && (
              <div
                className={`admin-nav-item ${activeTab === 'duyetyeucau' ? 'active' : ''}`}
                onClick={() => handleNavClick('duyetyeucau')}
              >
                <ClipboardCheck size={18} />
                <span>Duyệt Yêu Cầu</span>
                <span className="admin-nav-badge">4</span>
              </div>
            )}

            {/* GIÁM SÁT BIẾN ĐỘNG LỊCH (ADMIN / PHONGDAOTAO & BOMON) */}
            {(['ADMIN', 'PHONGDAOTAO', 'BOMON'].includes(user?.role)) && (
              <div
                className={`admin-nav-item ${activeTab === 'biendonglich' ? 'active' : ''}`}
                onClick={() => handleNavClick('biendonglich')}
              >
                <Activity size={18} />
                <span>Biến Động Lịch</span>
                {['ADMIN', 'PHONGDAOTAO'].includes(user?.role) && (
                  <span className="admin-nav-badge" style={{ background: '#3b82f6' }}>Toàn trường</span>
                )}
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
                onClick={() => handleNavClick('roles')}
              >
                <ShieldCheck size={18} />
                <span>Nhóm người dùng</span>
              </div>
            )}
            {hasPermission('Users', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => handleNavClick('users')}
              >
                <Users size={18} />
                <span>Người dùng</span>
              </div>
            )}
            {hasPermission('RolePermissions', 'CanRead') && (
              <div
                className={`admin-nav-item ${activeTab === 'permissions' ? 'active' : ''}`}
                onClick={() => handleNavClick('permissions')}
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
