import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap, Calendar, Clock, BookOpen, Building2,
  User, Lock, Eye, EyeOff, ArrowRight, Loader2,
  Sparkles, CheckCircle2, AlertCircle, School, ShieldAlert
} from 'lucide-react';
import './LecturerLogin.css';

export default function LecturerLogin() {
  const { login, logout } = useAuth();
  const [username, setUsername] = useState('minh.nl');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [errorIsAdmin, setErrorIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorIsAdmin(false);
    setLoading(true);

    try {
      const authUser = await login(username.trim(), password);
      // Kiểm tra nghiêm ngặt: chỉ tài khoản role GIANGVIEN mới được truy cập cổng này
      if (authUser && authUser.role !== 'GIANGVIEN') {
        await logout();
        setErrorIsAdmin(true);
        setError(`Tài khoản "${authUser.username}" có quyền [${authUser.role}]. Cổng này chỉ dành riêng cho Giảng viên.`);
      }
    } catch (err) {
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (gvUsername = 'minh.nl') => {
    setUsername(gvUsername);
    setPassword('123456');
    setError('');
    setErrorIsAdmin(false);
  };

  return (
    <div className="lec-login-wrapper">
      {/* Decorative Light Background Orbs */}
      <div className="lec-bg-orb orb-1"></div>
      <div className="lec-bg-orb orb-2"></div>

      <div className="lec-login-shell">
        {/* ========================================================
            LEFT COLUMN: UNIVERSITY & FACULTY HERO SHOWCASE
            ======================================================== */}
        <div className="lec-hero-panel">
          <div className="lec-hero-brand">
            <div className="lec-hero-logo-box">
              <GraduationCap size={28} />
            </div>
            <div>
              <div className="lec-hero-subbrand">TRƯỜNG ĐẠI HỌC • CỔNG GIẢNG VIÊN</div>
              <div className="lec-hero-brandname">HỆ THỐNG LỊCH GIẢNG DẠY</div>
            </div>
          </div>

          <div className="lec-hero-content">
            <div className="lec-hero-pill">
              <Sparkles size={14} />
              <span>Dành Riêng Cho Cán Bộ & Giảng Viên</span>
            </div>

            <h1 className="lec-hero-title">
              Cổng Tra Cứu Lịch Giảng Dạy & Quản Lý Ca Dạy
            </h1>

            <p className="lec-hero-desc">
              Không gian số hóa tiện lợi cho Giảng viên theo dõi thời khóa biểu cá nhân theo tuần, kiểm tra phòng học, quy mô lớp học phần và gửi các yêu cầu đổi ca, dạy bù trực tuyến.
            </p>

            <div className="lec-feature-list">
              <div className="lec-feature-item">
                <div className="lec-feature-icon-wrap icon-blue">
                  <Calendar size={18} />
                </div>
                <div className="lec-feature-text">
                  <strong>Thời Khóa Biểu Tuần Cá Nhân</strong>
                  <span>Ma trận lịch dạy chi tiết theo ca học, phòng học và thời gian bắt đầu - kết thúc</span>
                </div>
              </div>

              <div className="lec-feature-item">
                <div className="lec-feature-icon-wrap icon-sky">
                  <Clock size={18} />
                </div>
                <div className="lec-feature-text">
                  <strong>Yêu Cầu Đổi Ca & Đăng Ký Dạy Bù</strong>
                  <span>Khởi tạo yêu cầu đổi lịch, đăng ký bù giờ giảng nhanh chóng và minh bạch</span>
                </div>
              </div>

              <div className="lec-feature-item">
                <div className="lec-feature-icon-wrap icon-emerald">
                  <BookOpen size={18} />
                </div>
                <div className="lec-feature-text">
                  <strong>Quản Lý Sĩ Số & Lớp Học Phần</strong>
                  <span>Nắm bắt đầy đủ mã học phần, số tín chỉ, tòa nhà và số lượng sinh viên đăng ký</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lec-hero-footer">
            <div className="lec-status-badge">
              <span className="lec-status-dot"></span>
              <span>Cổng Dịch Vụ Giảng Viên 2026</span>
            </div>
            <div className="lec-version-text">Học kỳ 1 • 2026 - 2027</div>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: LECTURER LOGIN FORM
            ======================================================== */}
        <div className="lec-form-panel">
          <div className="lec-form-card">
            <div className="lec-form-header">
              <div className="lec-form-icon-bubble">
                <School size={28} />
              </div>
              <h2 className="lec-form-title">Đăng Nhập Giảng Viên</h2>
              <p className="lec-form-subtitle">
                Sử dụng tài khoản Giảng viên được cấp bởi Nhà trường
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="lec-error-banner">
                <AlertCircle size={18} className="flex-shrink-0" />
                <div style={{ flex: 1 }}>
                  <div>{error}</div>
                  {errorIsAdmin && (
                    <div style={{ marginTop: '0.4rem' }}>
                      <Link to="/admin" className="lec-error-link">
                        👉 Nhấn vào đây để chuyển sang Cổng Quản Trị (/admin)
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="lec-form">
              {/* Username Field */}
              <div className="lec-field-group">
                <label className="lec-field-label">
                  Tên đăng nhập / Mã giảng viên
                  <span className="text-red-500">*</span>
                </label>
                <div className="lec-input-box">
                  <User size={18} className="lec-input-icon" />
                  <input
                    type="text"
                    className="lec-input"
                    placeholder="Ví dụ: minh.nl hoặc tuan.nq"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="lec-field-group">
                <label className="lec-field-label">
                  Mật khẩu truy cập
                  <span className="text-red-500">*</span>
                </label>
                <div className="lec-input-box">
                  <Lock size={18} className="lec-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="lec-input"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="lec-btn-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="lec-form-options">
                <label className="lec-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="lec-checkbox"
                  />
                  <span>Ghi nhớ phiên đăng nhập</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="lec-btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    <span>Đang xác thực thông tin giảng viên...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Nhập Cổng Giảng Viên</span>
                    <ArrowRight size={18} className="lec-btn-arrow" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="lec-demo-box">
              <div className="lec-demo-header">
                <div className="lec-demo-tag">
                  <Sparkles size={13} />
                  <span>Tài khoản thử nghiệm</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="lec-btn-autofill"
                    onClick={() => handleQuickFill('minh.nl')}
                    title="Điền tài khoản GV Nguyễn Lê Minh"
                  >
                    minh.nl
                  </button>
                  <button
                    type="button"
                    className="lec-btn-autofill"
                    onClick={() => handleQuickFill('tuan.nq')}
                    title="Điền tài khoản GV Nguyễn Quốc Tuấn"
                  >
                    tuan.nq
                  </button>
                </div>
              </div>
              <div className="lec-demo-body">
                <span>Mật khẩu chung: <strong>123456</strong></span>
                <span>• Role: <strong>GIANGVIEN</strong></span>
              </div>
            </div>

            {/* Link to Admin */}
            <div className="lec-admin-portal-box">
              <span>Bạn là Cán bộ Quản trị / Ban Đào tạo?</span>
              <Link to="/admin" className="lec-link-admin">
                Đăng nhập Cổng Quản Trị & Đào Tạo &rarr;
              </Link>
            </div>

            <div className="lec-form-footer">
              <p>© 2026 Trường Đại học • Cổng Tra Cứu Lịch Giảng Dạy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
