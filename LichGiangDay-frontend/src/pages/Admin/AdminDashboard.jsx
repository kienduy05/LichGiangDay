import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Import Layout & Page Components
import AdminSidebar from './components/AdminSidebar';
import AdminTopbar from './components/AdminTopbar';
import EditProfileModal from './components/EditProfileModal';
import ChangePasswordModal from './components/ChangePasswordModal';

import DashboardOverview from './components/DashboardOverview';
import RolesManagement from './components/RolesManagement';
import UsersManagement from './components/UsersManagement';
import PermissionsManagement from './components/PermissionsManagement';
import ToaNhaManagement from './components/ToaNhaManagement';
import PhongHocManagement from './components/PhongHocManagement';

import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, updateProfile, changePassword } = useAuth();

  // Navigation active tab: 'dashboard' | 'toanha' | 'phonghoc' | 'roles' | 'users' | 'permissions'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Header profile dropdown
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Edit profile modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');

  // Change password modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Handle outside click for profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Profile modal handlers
  const handleOpenEditModal = () => {
    setIsProfileOpen(false);
    setEditFullName(user?.fullName || '');
    setEditEmail(user?.email || 'admin@lichgiangday.edu.vn');
    setUpdateSuccess('');
    setUpdateError('');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateSuccess('');
    setUpdateError('');

    try {
      await updateProfile({ fullName: editFullName, email: editEmail });
      setUpdateSuccess('Cập nhật thông tin tài khoản thành công!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setUpdateSuccess('');
      }, 1200);
    } catch (err) {
      setUpdateError(err.message || 'Cập nhật thông tin thất bại.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleOpenPasswordModal = () => {
    setIsProfileOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwdSuccess('');
    setPwdError('');
    setIsPasswordModalOpen(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword !== confirmPassword) {
      setPwdError('Mật khẩu mới và nhập lại mật khẩu không khớp.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setPwdLoading(true);
    try {
      await changePassword({ oldPassword, newPassword });
      setPwdSuccess('Đổi mật khẩu thành công!');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPwdSuccess('');
      }, 1200);
    } catch (err) {
      setPwdError(err.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="admin-light-theme">
      {/* Sidebar Navigation */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Topbar Header */}
        <AdminTopbar
          dropdownRef={dropdownRef}
          isProfileOpen={isProfileOpen}
          setIsProfileOpen={setIsProfileOpen}
          onOpenEditModal={handleOpenEditModal}
          onOpenPasswordModal={handleOpenPasswordModal}
        />

        {/* Main Body Dynamic View Switching */}
        <main className="admin-body">
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'toanha' && <ToaNhaManagement />}
          {activeTab === 'phonghoc' && <PhongHocManagement />}
          {activeTab === 'roles' && <RolesManagement />}
          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'permissions' && <PermissionsManagement />}
        </main>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        username={user?.username}
        editFullName={editFullName}
        setEditFullName={setEditFullName}
        editEmail={editEmail}
        setEditEmail={setEditEmail}
        onSubmit={handleSaveProfile}
        loading={updateLoading}
        success={updateSuccess}
        error={updateError}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        oldPassword={oldPassword}
        setOldPassword={setOldPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        onSubmit={handleChangePassword}
        loading={pwdLoading}
        success={pwdSuccess}
        error={pwdError}
      />
    </div>
  );
}
