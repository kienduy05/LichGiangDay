import { Link } from 'react-router-dom';
import { Calendar, ShieldCheck, Users, Clock, ArrowRight, BookOpen, Layers } from 'lucide-react';
import './Home.css';

export default function Home() {
  return (
    <div className="home-container">
      {/* Header Navigation */}
      <header className="home-nav glass-panel">
        <div className="nav-brand">
          <div className="brand-icon">
            <Calendar size={22} />
          </div>
          <span>LịchGiảngDạy<span style={{ color: 'var(--primary)' }}>.edu</span></span>
        </div>
        <div className="nav-links">
          <Link to="/admin" className="gradient-btn btn-nav-admin">
            <span>Trang Admin</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero-section">
        <div className="hero-badge">
          <ShieldCheck size={16} />
          <span>Hệ Thống Quản Lý Đào Tạo & Thời Khóa Biểu</span>
        </div>

        <h1 className="hero-title">
          Chào Mừng Đến Với <br />
          <span className="gradient-text">Hệ Thống Quản Lý Lịch Giảng Dạy</span>
        </h1>

        <p className="hero-subtitle">
          Nền tảng quản lý thời khóa biểu giảng viên, phòng học, ca học, đăng ký dạy bù / dạy thay 
          và quản trị phân quyền tập trung dành cho Nhà trường & Giảng viên.
        </p>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/admin" className="gradient-btn" style={{ padding: '14px 32px', borderRadius: 'var(--radius-full)', fontSize: '1.05rem' }}>
            Truy Cập Trang Quản Trị (Admin)
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="features-grid">
          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper">
              <Calendar size={26} />
            </div>
            <h3 className="feature-title">Thời Khóa Biểu Thông Minh</h3>
            <p className="feature-desc">Quản lý và sắp xếp lịch dạy theo từng khoa, bộ môn, phòng học và ca học trực quan.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper" style={{ color: 'var(--accent-purple)' }}>
              <Clock size={26} />
            </div>
            <h3 className="feature-title">Dạy Thay & Dạy Bù</h3>
            <p className="feature-desc">Tiếp nhận yêu cầu báo nghỉ, phân công dạy thay và đăng ký dạy bù tự động hóa quy trình.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper" style={{ color: 'var(--accent-emerald)' }}>
              <ShieldCheck size={26} />
            </div>
            <h3 className="feature-title">Phân Quyền Bảo Mật</h3>
            <p className="feature-desc">Hệ thống phân quyền theo vai trò (Roles) & tài nguyên (Resources) chuẩn doanh nghiệp.</p>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <p>© 2026 Hệ Thống Quản Lý Lịch Giảng Dạy. All rights reserved.</p>
      </footer>
    </div>
  );
}
