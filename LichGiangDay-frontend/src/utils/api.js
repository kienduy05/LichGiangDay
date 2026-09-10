const API_BASE_URL = 'http://localhost:5000/v1/api';
const API_KEY = 'lichgiangday_secret_apikey_2026';

export const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  };

  const userId = localStorage.getItem('userId');
  const accessToken = localStorage.getItem('accessToken');

  if (userId) {
    headers['x-client-id'] = userId;
  }
  if (accessToken) {
    headers['authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
};

export const apiLogin = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Đăng nhập thất bại.');
  }

  return data;
};

export const apiLogout = async () => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } catch (err) {
    console.error('Logout error:', err);
  }
};

export const apiGetMe = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Xác thực thất bại.');
  }

  return data;
};

export const apiUpdateProfile = async ({ fullName, email }) => {
  const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ fullName, email })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Cập nhật thông tin thất bại.');
  }

  return data;
};

export const apiChangePassword = async ({ oldPassword, newPassword }) => {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ oldPassword, newPassword })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Đổi mật khẩu thất bại.');
  }

  return data;
};
