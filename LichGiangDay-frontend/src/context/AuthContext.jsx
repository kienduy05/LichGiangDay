import { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiLogout, apiGetMe, apiUpdateProfile, apiChangePassword } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await apiGetMe();
          if (res.metadata) {
            // Keep user valid
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

    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('user', JSON.stringify(userData));

    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await apiLogout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    setUser(null);
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

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, changePassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
