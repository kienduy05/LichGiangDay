import { Users, ShieldCheck, Calendar } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import './DashboardOverview.css';

export default function DashboardOverview({ userCount = 0, roleCount = 0 }) {
  const { user } = useAuth();
  const roleDisplayName = user?.role === 'ADMIN' ? 'Administrator' : user?.role || 'Administrator';

  return (
    <>
      <div className="admin-welcome-banner">
        <h2 className="admin-welcome-title">
          Xin chào, {user?.fullName || user?.username}! 👋
        </h2>
        <p className="admin-welcome-desc">
          Chào mừng bạn trở lại hệ thống quản trị <b>LịchGiảngDạy</b>. Tài khoản của bạn đang thuộc nhóm quyền <b>{roleDisplayName}</b>.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{userCount || 1}</div>
            <div className="admin-stat-text">Tài khoản người dùng</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{roleCount || 1}</div>
            <div className="admin-stat-text">Nhóm người dùng</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="admin-stat-number">0</div>
            <div className="admin-stat-text">Thời khóa biểu</div>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '40px' }}>
        <p style={{ fontSize: '0.95rem' }}>
          📌 Các chức năng quản lý chi tiết (Khoa, Bộ môn, Tòa nhà, Giảng viên, Lịch dạy...) sẵn sàng phát triển trong các giai đoạn tiếp theo.
        </p>
      </div>
    </>
  );
}
