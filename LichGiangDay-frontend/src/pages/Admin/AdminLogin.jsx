import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap, Calendar, Clock, BookOpen, Building2,
  ShieldCheck, User, Lock, Eye, EyeOff, ArrowRight,
  Loader2, Sparkles, CheckCircle2, HelpCircle, School,
  Layers, AlertCircle
} from 'lucide-react';
import './AdminLogin.css';

export default function AdminLogin() {
  const { login, logout } = useAuth();
  const [username, setUsername] = useState('ADMIN.0001');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [errorIsLecturer, setErrorIsLecturer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorIsLecturer(false);
    setLoading(true);

    try {
      const authUser = await login(username.trim(), password);
      // Chặn tài khoản role GIANGVIEN không được đăng nhập tại cổng /admin
      if (authUser && authUser.role === 'GIANGVIEN') {
        await logout();
        setErrorIsLecturer(true);
        setError(`Tài khoản "${authUser.username}" thuộc nhóm [GIANGVIEN]. Cổng Quản trị (/admin) không cho phép tài khoản Giảng viên đăng nhập.`);
      }
    } catch (err) {
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('ADMIN.0001');
    setPassword('123456');
    setError('');
    setErrorIsLecturer(false);
  };

  return (
    <div className="uni-login-wrapper">
      {/* Decorative Background Orbs */}
      <div className="uni-bg-orb orb-1"></div>
      <div className="uni-bg-orb orb-2"></div>
      <div className="uni-bg-orb orb-3"></div>

      <div className="uni-login-shell">
        {/* ========================================================
            LEFT COLUMN: UNIVERSITY & SYSTEM SHOWCASE (BRANDING)
            ======================================================== */}
        <div className="uni-hero-panel">
          {/* Header Brand */}
          <div className="uni-hero-brand">
            <div className="uni-hero-logo-box">
              <School size={28} className="text-blue-600" />
            </div>
            <div>
              <div className="uni-hero-subbrand">TRƯỜNG ĐẠI HỌC • CỔNG ĐÀO TẠO</div>
              <div className="uni-hero-brandname">HỆ THỐNG LỊCH GIẢNG DẠY</div>
            </div>
          </div>

          {/* Hero Main Copy */}
          <div className="uni-hero-content">
            <div className="uni-hero-pill">
              <Sparkles size={14} />
              <span>Nền Tảng Quản Lý Đào Tạo Hiện Đại</span>
            </div>
            <h1 className="uni-hero-title">
              Quản lý Lịch Giảng Dạy & Thời Khóa Biểu Đại Học
            </h1>
            <p className="uni-hero-desc">
              Hệ thống đồng bộ dữ liệu thời khóa biểu toàn diện, hỗ trợ Ban Đào tạo, các Khoa - Bộ môn và Giảng viên theo dõi lịch trình, phòng học và tiến độ đào tạo thông minh.
            </p>

            {/* Feature Highlight Cards */}
            <div className="uni-feature-list">
              <div className="uni-feature-item">
                <div className="uni-feature-icon-wrap icon-blue">
                  <Calendar size={18} />
                </div>
                <div className="uni-feature-text">
                  <strong>Ma trận Lịch Học Trực Quan</strong>
                  <span>Lịch theo tuần, ngày, phòng học và giảng viên, hạn chế trùng lịch</span>
                </div>
              </div>

              <div className="uni-feature-item">
                <div className="uni-feature-icon-wrap icon-sky">
                  <Building2 size={18} />
                </div>
                <div className="uni-feature-text">
                  <strong>Điều Phối Phòng Học Thông Minh</strong>
                  <span>Kiểm soát sức chứa, trang thiết bị và tòa nhà giảng đường theo thời gian thực</span>
                </div>
              </div>

              <div className="uni-feature-item">
                <div className="uni-feature-icon-wrap icon-indigo">
                  <GraduationCap size={18} />
                </div>
                <div className="uni-feature-text">
                  <strong>Phân Công & Phân Quyền Bộ Môn</strong>
                  <span>Quản lý phân công giảng dạy, số tiết học phần theo tiêu chuẩn đào tạo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Bottom Footer */}
          <div className="uni-hero-footer">
            <div className="uni-status-badge">
              <span className="uni-status-dot"></span>
              <span>Học kỳ 1 • Năm học 2026 - 2027 (Trực tuyến)</span>
            </div>
            <div className="uni-version-text">Phiên bản 2.5 EduPortal</div>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: LOGIN FORM PANEL
            ======================================================== */}
        <div className="uni-form-panel">
          <div className="uni-form-card">
            {/* Form Top Identity */}
            <div className="uni-form-header">
              <div className="uni-form-icon-bubble">
                <Calendar size={26} />
              </div>
              <h2 className="uni-form-title">Đăng Nhập Hệ Thống</h2>
              <p className="uni-form-subtitle">
                Dành cho Cán bộ Quản trị, Ban Đào tạo & Trưởng Bộ môn
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="uni-error-banner" style={errorIsLecturer ? { flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' } : {}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
                {errorIsLecturer && (
                  <Link
                    to="/"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#047857',
                      background: '#ecfdf5',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      marginTop: '0.25rem',
                      border: '1px solid #a7f3d0'
                    }}
                  >
                    👉 Bấm vào đây để chuyển sang Cổng Giảng Viên
                  </Link>
                )}
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="uni-form">
              {/* Username Input */}
              <div className="uni-field-group">
                <label className="uni-field-label">
                  Tên đăng nhập / Mã định danh
                  <span className="text-red-500">*</span>
                </label>
                <div className="uni-input-box">
                  <User size={18} className="uni-input-icon" />
                  <input
                    type="text"
                    className="uni-input"
                    placeholder="Ví dụ: ADMIN.0001 hoặc mã GV"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="uni-field-group">
                <label className="uni-field-label">
                  Mật khẩu truy cập
                  <span className="text-red-500">*</span>
                </label>
                <div className="uni-input-box">
                  <Lock size={18} className="uni-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="uni-input"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="uni-btn-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Options Row: Remember Me & Forgot Password */}
              <div className="uni-form-options">
                <label className="uni-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="uni-checkbox"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>

                <button
                  type="button"
                  className="uni-link-forgot"
                  onClick={() => setForgotModalOpen(true)}
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="uni-btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    <span>Đang xác thực thông tin...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Nhập Hệ Thống</span>
                    <ArrowRight size={18} className="uni-btn-arrow" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Box */}
            <div className="uni-demo-box">
              <div className="uni-demo-header">
                <div className="uni-demo-tag">
                  <Sparkles size={13} />
                  <span>Tài khoản thử nghiệm</span>
                </div>
                <button
                  type="button"
                  className="uni-btn-autofill"
                  onClick={handleQuickFill}
                  title="Điền nhanh tài khoản Admin mặc định"
                >
                  Tự động điền
                </button>
              </div>
              <div className="uni-demo-body">
                <span>Tài khoản: <strong>ADMIN.0001</strong></span>
                <span>•</span>
                <span>Mật khẩu: <strong>123456</strong></span>
              </div>
            </div>

            {/* Switch to Lecturer Portal link */}
            <div style={{ textAlign: 'center', marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '0.8125rem' }}>
              <span style={{ color: '#64748b' }}>Bạn là Giảng viên xem lịch dạy? </span>
              <Link to="/" style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }}>
                Đến Cổng Giảng Viên →
              </Link>
            </div>

            {/* Form Footer */}
            <div className="uni-form-footer">
              <p className="uni-support-text">
                Cần hỗ trợ truy cập? Liên hệ Ban Công Nghệ Thông Tin
              </p>
              <p className="uni-copyright-text">
                © 2026 Trường Đại học • Cổng Quản lý Lịch Giảng Dạy & Học Tập
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="uni-modal-overlay" onClick={() => setForgotModalOpen(false)}>
          <div className="uni-modal-card" onClick={e => e.stopPropagation()}>
            <div className="uni-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e40af' }}>
                <HelpCircle size={22} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Hỗ Trợ Khôi Phục Mật Khẩu</h3>
              </div>
            </div>
            <div className="uni-modal-body">
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
                Để đảm bảo tính bảo mật của dữ liệu đào tạo và phân công giảng dạy, vui lòng liên hệ trực tiếp với:
              </p>
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.75rem', fontSize: '0.84rem' }}>
                <div>🏛️ <strong>Phòng Đào Tạo / Trung Tâm CNTT</strong></div>
                <div style={{ marginTop: '0.25rem', color: '#64748b' }}>📧 Email: <strong>it.support@university.edu.vn</strong></div>
                <div style={{ marginTop: '0.25rem', color: '#64748b' }}>📞 Hotline nội bộ: <strong>(024) 3869 1234 - Máy lẻ 102</strong></div>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.75rem' }}>
                * Với tài khoản Giảng viên, bạn cũng có thể nhờ Trưởng Bộ môn hỗ trợ kiểm tra trạng thái liên kết tài khoản.
              </p>
            </div>
            <div className="uni-modal-footer">
              <button
                type="button"
                className="uni-modal-btn-close"
                onClick={() => setForgotModalOpen(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
