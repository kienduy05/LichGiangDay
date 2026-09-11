import { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiLogout, apiGetMe, apiUpdateProfile, apiChangePassword, apiGetRolePermissions } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch permissions for the logged-in user's role
  const loadUserPermissions = async (roleId) => {
    if (!roleId || roleId === 'ADMIN') {
      setUserPermissions([]); // ADMIN has bypass full permissions
      return;
    }
    try {
      const perms = await apiGetRolePermissions(roleId);
      setUserPermissions(perms || []);
    } catch (err) {
      console.warn('Failed to load user permissions for role:', roleId, err);
      setUserPermissions([]);
    }
  };

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await apiGetMe();
          if (res.metadata) {
            const currentUser = res.metadata;
            const normalizedRole = currentUser.role || currentUser.Role;
            const normalizedUser = {
              ...currentUser,
              role: normalizedRole
            };
            setUser(normalizedUser);
            localStorage.setItem('user', JSON.stringify(normalizedUser));

            if (normalizedRole) {
              await loadUserPermissions(normalizedRole);
            }
          }
        } catch (err) {
          console.warn('Session expired, logging out:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (username, password) => {
    const res = await apiLogin(username, password);
    const { user: userData, tokens } = res.metadata;
    const normalizedRole = userData.role || userData.Role;
    const normalizedUser = {
      ...userData,
      role: normalizedRole
    };

    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('userId', normalizedUser.userId || normalizedUser.UserId);
    localStorage.setItem('user', JSON.stringify(normalizedUser));

    setUser(normalizedUser);
    if (normalizedRole) {
      await loadUserPermissions(normalizedRole);
    }
    return normalizedUser;
  };

  const logout = async () => {
    await apiLogout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    setUser(null);
    setUserPermissions([]);
  };

  const updateProfile = async ({ fullName, email }) => {
    const res = await apiUpdateProfile({ fullName, email });
    const updatedUser = res.metadata;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const changePassword = async ({ oldPassword, newPassword }) => {
    const res = await apiChangePassword({ oldPassword, newPassword });
    return res;
  };

  /**
   * Kiểm tra người dùng có quyền thực hiện hành động trên tài nguyên không
   * @param {string} resourceId - Mã tài nguyên (VD: 'Roles', 'Users', 'RolePermissions', 'ToaNha', 'BoMon'...)
   * @param {string} action - 'CanRead' | 'CanCreate' | 'CanUpdate' | 'CanDelete'
   */
  const hasPermission = (resourceId, action) => {
    if (!user) return false;
    const currentRole = user.role || user.Role;
    if (currentRole === 'ADMIN') return true; // ADMIN có 100% quyền

    const permRow = userPermissions.find(p => p.ResourceId === resourceId);
    if (!permRow) return false;
    return permRow[action] === 1;
  };

  return (
    <AuthContext.Provider value={{
      user,
      userPermissions,
      hasPermission,
      login,
      logout,
      updateProfile,
      changePassword,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
