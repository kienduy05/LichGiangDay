import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LecturerLogin from './pages/Lecturer/LecturerLogin';
import LecturerScheduleView from './pages/Lecturer/LecturerScheduleView';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import { Loader2 } from 'lucide-react';

// Route Guard cho Cổng Giảng Viên (Root: /)
function LecturerRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', background: '#f8fafc' }}>
        <Loader2 size={36} className="animate-spin" />
      </div>
    );
  }

  // Nếu chưa đăng nhập: hiện Form đăng nhập Giảng viên
  if (!user) {
    return <LecturerLogin />;
  }

  // Nếu đã đăng nhập nhưng role không phải GIANGVIEN: chuyển hướng sang cổng Quản trị
  if (user.role !== 'GIANGVIEN') {
    return <Navigate to="/admin" replace />;
  }

  // Đúng role GIANGVIEN: hiện Cổng Lịch Giảng Dạy Cá Nhân
  return <LecturerScheduleView />;
}

// Route Guard cho Cổng Quản Trị (/admin)
function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', background: '#f8fafc' }}>
        <Loader2 size={36} className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  // Chặn tài khoản GIANGVIEN truy cập cổng Quản trị (/admin) -> Chuyển về cổng Giảng viên
  if (user.role === 'GIANGVIEN') {
    return <Navigate to="/" replace />;
  }

  return <AdminDashboard />;
}

export default function App() {
  return (
    <Routes>
      {/* Cổng Giảng Viên */}
      <Route path="/" element={<LecturerRoute />} />

      {/* Cổng Quản Trị & Đào Tạo */}
      <Route path="/admin" element={<AdminRoute />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
