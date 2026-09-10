import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import './AdminLogin.css';

export default function AdminLogin() {
  const { login } = useAuth();
  const [username, setUsername] = useState('ADMIN.0001');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="login-logo">
            <Lock size={26} />
          </div>
          <h2 className="login-title">Đăng Nhập Quản Trị</h2>
          <p className="login-subtitle">Hệ thống Quản lý Lịch Giảng Dạy</p>
        </div>

        {error && (
          <div className="error-alert">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                type="text"
                className="form-input"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                className="form-input"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="gradient-btn btn-submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span>Đăng Nhập</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="hint-box">
          💡 Tài khoản mặc định: <b>ADMIN.0001</b> / <b>123456</b>
        </div>
      </div>
    </div>
  );
}
