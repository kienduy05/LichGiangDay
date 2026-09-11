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

// ==========================================
// ROLES (NHÓM NGƯỜI DÙNG) API SERVICES
// ==========================================

export const apiGetRoles = async () => {
  const response = await fetch(`${API_BASE_URL}/roles`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lấy danh sách nhóm người dùng thất bại.');
  }

  return data.metadata;
};

export const apiCreateRole = async ({ roleId, roleName, description }) => {
  const response = await fetch(`${API_BASE_URL}/roles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ roleId, roleName, description })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Tạo nhóm người dùng thất bại.');
  }

  return data.metadata;
};

export const apiUpdateRole = async (roleId, { roleName, description }) => {
  const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ roleName, description })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Cập nhật nhóm người dùng thất bại.');
  }

  return data.metadata;
};

export const apiDeleteRole = async (roleId) => {
  const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Xóa nhóm người dùng thất bại.');
  }

  return data.metadata;
};

// ==========================================
// USERS (NGƯỜI DÙNG) API SERVICES
// ==========================================

export const apiGetUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lấy danh sách người dùng thất bại.');
  }

  return data.metadata;
};

export const apiCreateUser = async ({ username, password, fullName, email, role }) => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, password, fullName, email, role })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Tạo người dùng mới thất bại.');
  }

  return data.metadata;
};

export const apiUpdateUser = async (userId, { fullName, email, role, isActive }) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ fullName, email, role, isActive })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Cập nhật tài khoản thất bại.');
  }

  return data.metadata;
};

export const apiResetUserPassword = async (userId, newPassword) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/reset-password`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ newPassword })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Đặt lại mật khẩu thất bại.');
  }

  return data.metadata;
};

export const apiToggleUserStatus = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/toggle-status`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Thay đổi trạng thái thất bại.');
  }

  return data.metadata;
};

export const apiDeleteUser = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Xóa tài khoản thất bại.');
  }

  return data.metadata;
};

// ==========================================
// PERMISSIONS (PHÂN QUYỀN CHỨC NĂNG) API SERVICES
// ==========================================

export const apiGetResources = async () => {
  const response = await fetch(`${API_BASE_URL}/permissions/resources`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lấy danh sách tài nguyên thất bại.');
  }

  return data.metadata;
};

export const apiGetRolePermissions = async (roleId) => {
  const response = await fetch(`${API_BASE_URL}/permissions/role/${roleId}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lấy ma trận phân quyền thất bại.');
  }

  return data.metadata;
};

export const apiUpdateRolePermissions = async (roleId, permissions) => {
  const response = await fetch(`${API_BASE_URL}/permissions/role/${roleId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ permissions })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lưu ma trận phân quyền thất bại.');
  }

  return data.metadata;
};

// ==========================================
// TOANHA (TÒA NHÀ) API SERVICES
// ==========================================

export const apiGetToaNhaList = async () => {
  const response = await fetch(`${API_BASE_URL}/toanha`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lấy danh sách tòa nhà thất bại.');
  }

  return data.metadata;
};

export const apiCreateToaNha = async ({ maToaNha, tenToaNha, coSo, diaChi }) => {
  const response = await fetch(`${API_BASE_URL}/toanha`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maToaNha, tenToaNha, coSo, diaChi })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Tạo tòa nhà thất bại.');
  }

  return data.metadata;
};

export const apiUpdateToaNha = async (maToaNha, { tenToaNha, coSo, diaChi }) => {
  const response = await fetch(`${API_BASE_URL}/toanha/${maToaNha}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tenToaNha, coSo, diaChi })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Cập nhật tòa nhà thất bại.');
  }

  return data.metadata;
};

export const apiDeleteToaNha = async (maToaNha) => {
  const response = await fetch(`${API_BASE_URL}/toanha/${maToaNha}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Xóa tòa nhà thất bại.');
  }

  return data.metadata;
};

// ==========================================
// PHONGHOC (PHÒNG HỌC) API SERVICES
// ==========================================

export const apiGetPhongHocList = async () => {
  const response = await fetch(`${API_BASE_URL}/phonghoc`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lấy danh sách phòng học thất bại.');
  }

  return data.metadata;
};

export const apiCreatePhongHoc = async ({ maPhong, tenPhong, maToaNha, sucChua, loaiPhong, trangThai }) => {
  const response = await fetch(`${API_BASE_URL}/phonghoc`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maPhong, tenPhong, maToaNha, sucChua, loaiPhong, trangThai })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Tạo phòng học thất bại.');
  }

  return data.metadata;
};

export const apiUpdatePhongHoc = async (maPhong, { tenPhong, maToaNha, sucChua, loaiPhong, trangThai }) => {
  const response = await fetch(`${API_BASE_URL}/phonghoc/${maPhong}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tenPhong, maToaNha, sucChua, loaiPhong, trangThai })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Cập nhật phòng học thất bại.');
  }

  return data.metadata;
};

export const apiTogglePhongHocStatus = async (maPhong) => {
  const response = await fetch(`${API_BASE_URL}/phonghoc/${maPhong}/toggle-status`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Cập nhật trạng thái thất bại.');
  }

  return data.metadata;
};

export const apiDeletePhongHoc = async (maPhong) => {
  const response = await fetch(`${API_BASE_URL}/phonghoc/${maPhong}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Xóa phòng học thất bại.');
  }

  return data.metadata;
};





