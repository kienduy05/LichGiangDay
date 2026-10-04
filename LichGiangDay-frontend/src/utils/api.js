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

export const apiCreateUser = async ({ username, password, fullName, email, role, maGiangVien }) => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, password, fullName, email, role, maGiangVien })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Tạo người dùng mới thất bại.');
  }

  return data.metadata;
};

export const apiUpdateUser = async (userId, { fullName, email, role, isActive, maGiangVien }) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ fullName, email, role, isActive, maGiangVien })
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

// ==========================================
// KHOA (KHOA HỌC) API SERVICES
// ==========================================

export const apiGetKhoaList = async (search = '') => {
  const url = search
    ? `${API_BASE_URL}/khoa?search=${encodeURIComponent(search)}`
    : `${API_BASE_URL}/khoa`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách khoa thất bại.');
  return data.metadata;
};

export const apiGetKhoaChiTiet = async (maKhoa) => {
  const response = await fetch(`${API_BASE_URL}/khoa/${maKhoa}/chitiet`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy chi tiết khoa thất bại.');
  return data.metadata;
};

export const apiGetGiangVienByKhoa = async (maKhoa) => {
  const response = await fetch(`${API_BASE_URL}/khoa/${maKhoa}/giangvien`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách giảng viên thất bại.');
  return data.metadata;
};

export const apiCreateKhoa = async ({ maKhoa, tenKhoa }) => {
  const response = await fetch(`${API_BASE_URL}/khoa`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maKhoa, tenKhoa })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Tạo khoa thất bại.');
  return data.metadata;
};

export const apiUpdateKhoa = async (maKhoa, { tenKhoa }) => {
  const response = await fetch(`${API_BASE_URL}/khoa/${maKhoa}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tenKhoa })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Cập nhật khoa thất bại.');
  return data.metadata;
};

export const apiAssignTruongKhoa = async (maKhoa, maGiangVien) => {
  const response = await fetch(`${API_BASE_URL}/khoa/${maKhoa}/truongkhoa`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maGiangVien })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Phân công trưởng khoa thất bại.');
  return data.metadata;
};

export const apiDeleteKhoa = async (maKhoa) => {
  const response = await fetch(`${API_BASE_URL}/khoa/${maKhoa}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Xóa khoa thất bại.');
  return data.metadata;
};



// ==========================================
// BOMON (BỘ MÔN) API SERVICES
// ==========================================

export const apiGetBoMonList = async (maKhoa = '') => {
  const url = maKhoa
    ? `${API_BASE_URL}/bomon?maKhoa=${encodeURIComponent(maKhoa)}`
    : `${API_BASE_URL}/bomon`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách bộ môn thất bại.');
  return data.metadata;
};

export const apiGetBoMonChiTiet = async (maBoMon) => {
  const response = await fetch(`${API_BASE_URL}/bomon/${maBoMon}/chitiet`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy chi tiết bộ môn thất bại.');
  return data.metadata;
};

export const apiCreateBoMon = async ({ maBoMon, tenBoMon, maKhoa }) => {
  const response = await fetch(`${API_BASE_URL}/bomon`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maBoMon, tenBoMon, maKhoa })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Tạo bộ môn thất bại.');
  return data.metadata;
};

export const apiUpdateBoMon = async (maBoMon, { tenBoMon, maKhoa }) => {
  const response = await fetch(`${API_BASE_URL}/bomon/${maBoMon}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tenBoMon, maKhoa })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Cập nhật bộ môn thất bại.');
  return data.metadata;
};

export const apiDeleteBoMon = async (maBoMon) => {
  const response = await fetch(`${API_BASE_URL}/bomon/${maBoMon}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Xóa bộ môn thất bại.');
  return data.metadata;
};



// ==========================================
// GIANGVIEN (GIẢNG VIÊN) API SERVICES
// ==========================================

export const apiGetGiangVienList = async ({ maKhoa = '', maBoMon = '', trangThai = '', search = '' } = {}) => {
  const params = new URLSearchParams();
  if (maKhoa) params.append('maKhoa', maKhoa);
  if (maBoMon) params.append('maBoMon', maBoMon);
  if (trangThai) params.append('trangThai', trangThai);
  if (search) params.append('search', search);
  const url = `${API_BASE_URL}/giangvien${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách giảng viên thất bại.');
  return data.metadata;
};

export const apiGetGiangVienChiTiet = async (maGiangVien) => {
  const response = await fetch(`${API_BASE_URL}/giangvien/${encodeURIComponent(maGiangVien)}/chitiet`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy chi tiết giảng viên thất bại.');
  return data.metadata;
};

export const apiCreateGiangVien = async ({ maGiangVien, hoTen, email, soDienThoai, maBoMon }) => {
  const response = await fetch(`${API_BASE_URL}/giangvien`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maGiangVien, hoTen, email, soDienThoai, maBoMon })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Tạo giảng viên thất bại.');
  return data.metadata;
};

export const apiUpdateGiangVien = async (maGiangVien, { hoTen, email, soDienThoai, maBoMon, userId }) => {
  const response = await fetch(`${API_BASE_URL}/giangvien/${encodeURIComponent(maGiangVien)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ hoTen, email, soDienThoai, maBoMon, userId })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Cập nhật giảng viên thất bại.');
  return data.metadata;
};

export const apiGetAvailableAccountsForGiangVien = async (maGiangVien = '') => {
  const url = maGiangVien 
    ? `${API_BASE_URL}/giangvien/available-accounts?maGiangVien=${encodeURIComponent(maGiangVien)}`
    : `${API_BASE_URL}/giangvien/available-accounts`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách tài khoản khả dụng thất bại.');
  return data.metadata;
};

export const apiLinkGiangVienAccount = async (maGiangVien, userId) => {
  const response = await fetch(`${API_BASE_URL}/giangvien/${encodeURIComponent(maGiangVien)}/link-account`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Thao tác liên kết tài khoản thất bại.');
  return data.metadata;
};

export const apiCreateAndLinkGiangVienAccount = async (maGiangVien, { username, password, fullName, email }) => {
  const response = await fetch(`${API_BASE_URL}/giangvien/${encodeURIComponent(maGiangVien)}/create-account`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, password, fullName, email })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Tạo tài khoản thất bại.');
  return data.metadata;
};

export const apiToggleGiangVienTrangThai = async (maGiangVien) => {
  const response = await fetch(`${API_BASE_URL}/giangvien/${encodeURIComponent(maGiangVien)}/toggle-trangthai`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Đổi trạng thái giảng viên thất bại.');
  return data.metadata;
};

export const apiDeleteGiangVien = async (maGiangVien) => {
  const response = await fetch(`${API_BASE_URL}/giangvien/${encodeURIComponent(maGiangVien)}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Xóa giảng viên thất bại.');
  return data.metadata;
};



// ==========================================
// MONHOC (MÔN HỌC) API SERVICES
// ==========================================

export const apiGetMonHocList = async ({ maKhoa = '', maBoMon = '', search = '' } = {}) => {
  const params = new URLSearchParams();
  if (maKhoa) params.append('maKhoa', maKhoa);
  if (maBoMon) params.append('maBoMon', maBoMon);
  if (search) params.append('search', search);
  const url = `${API_BASE_URL}/monhoc${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách môn học thất bại.');
  return data.metadata;
};

export const apiGetMonHocChiTiet = async (maMonHoc) => {
  const response = await fetch(`${API_BASE_URL}/monhoc/${encodeURIComponent(maMonHoc)}/chitiet`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy chi tiết môn học thất bại.');
  return data.metadata;
};

export const apiCreateMonHoc = async ({ maMonHoc, tenMonHoc, soTinChi, maBoMon, loaiMonHoc }) => {
  const response = await fetch(`${API_BASE_URL}/monhoc`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maMonHoc, tenMonHoc, soTinChi, maBoMon, loaiMonHoc })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Tạo môn học thất bại.');
  return data.metadata;
};

export const apiUpdateMonHoc = async (maMonHoc, { tenMonHoc, soTinChi, maBoMon, loaiMonHoc }) => {
  const response = await fetch(`${API_BASE_URL}/monhoc/${encodeURIComponent(maMonHoc)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tenMonHoc, soTinChi, maBoMon, loaiMonHoc })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Cập nhật môn học thất bại.');
  return data.metadata;
};

export const apiDeleteMonHoc = async (maMonHoc) => {
  const response = await fetch(`${API_BASE_URL}/monhoc/${encodeURIComponent(maMonHoc)}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Xóa môn học thất bại.');
  return data.metadata;
};

// ==========================================
// LOPSINHVIEN (LỚP SINH VIÊN) API SERVICES
// ==========================================

export const apiGetLopSinhVienList = async ({ maKhoa = '', search = '' } = {}) => {
  const params = new URLSearchParams();
  if (maKhoa) params.append('maKhoa', maKhoa);
  if (search) params.append('search', search);
  const url = `${API_BASE_URL}/lopsinhvien${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách lớp sinh viên thất bại.');
  return data.metadata;
};

export const apiGetLopSinhVienChiTiet = async (maLopSinhVien) => {
  const response = await fetch(`${API_BASE_URL}/lopsinhvien/${encodeURIComponent(maLopSinhVien)}/chitiet`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy chi tiết lớp sinh viên thất bại.');
  return data.metadata;
};

export const apiCreateLopSinhVien = async ({ maLopSinhVien, tenLopSinhVien, maKhoa }) => {
  const response = await fetch(`${API_BASE_URL}/lopsinhvien`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maLopSinhVien, tenLopSinhVien, maKhoa })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Tạo lớp sinh viên thất bại.');
  return data.metadata;
};

export const apiUpdateLopSinhVien = async (maLopSinhVien, { tenLopSinhVien, maKhoa }) => {
  const response = await fetch(`${API_BASE_URL}/lopsinhvien/${encodeURIComponent(maLopSinhVien)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tenLopSinhVien, maKhoa })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Cập nhật lớp sinh viên thất bại.');
  return data.metadata;
};

export const apiDeleteLopSinhVien = async (maLopSinhVien) => {
  const response = await fetch(`${API_BASE_URL}/lopsinhvien/${encodeURIComponent(maLopSinhVien)}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Xóa lớp sinh viên thất bại.');
  return data.metadata;
};


// ==========================================
// KHOASINHVIEN (KHÓA SINH VIÊN) API SERVICES
// ==========================================

export const apiGetKhoaSinhVienList = async ({ search = '' } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const url = `${API_BASE_URL}/khoasinhvien${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách khóa sinh viên thất bại.');
  return data.metadata;
};

export const apiCreateKhoaSinhVien = async ({ maKhoaSinhVien, tenKhoaSinhVien }) => {
  const response = await fetch(`${API_BASE_URL}/khoasinhvien`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maKhoaSinhVien, tenKhoaSinhVien })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Tạo khóa sinh viên thất bại.');
  return data.metadata;
};

export const apiUpdateKhoaSinhVien = async (maKhoaSinhVien, { tenKhoaSinhVien }) => {
  const response = await fetch(`${API_BASE_URL}/khoasinhvien/${encodeURIComponent(maKhoaSinhVien)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tenKhoaSinhVien })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Cập nhật khóa sinh viên thất bại.');
  return data.metadata;
};

export const apiDeleteKhoaSinhVien = async (maKhoaSinhVien) => {
  const response = await fetch(`${API_BASE_URL}/khoasinhvien/${encodeURIComponent(maKhoaSinhVien)}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Xóa khóa sinh viên thất bại.');
  return data.metadata;
};


// ==========================================
// HOCKY (HỌC KỲ) API SERVICES
// ==========================================

export const apiGetHocKyList = async ({ search = '' } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const url = `${API_BASE_URL}/hocky${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách học kỳ thất bại.');
  return data.metadata;
};

export const apiCreateHocKy = async ({ maHocKy, tenHocKy, dot, namHoc, ngayBatDau, ngayKetThuc }) => {
  const response = await fetch(`${API_BASE_URL}/hocky`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maHocKy, tenHocKy, dot, namHoc, ngayBatDau, ngayKetThuc })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Tạo học kỳ thất bại.');
  return data.metadata;
};

export const apiUpdateHocKy = async (maHocKy, { tenHocKy, dot, namHoc, ngayBatDau, ngayKetThuc }) => {
  const response = await fetch(`${API_BASE_URL}/hocky/${encodeURIComponent(maHocKy)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tenHocKy, dot, namHoc, ngayBatDau, ngayKetThuc })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Cập nhật học kỳ thất bại.');
  return data.metadata;
};

export const apiDeleteHocKy = async (maHocKy) => {
  const response = await fetch(`${API_BASE_URL}/hocky/${encodeURIComponent(maHocKy)}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Xóa học kỳ thất bại.');
  return data.metadata;
};


// ==========================================
// TIETHOC (TIẾT HỌC) API SERVICES
// ==========================================

export const apiGetTietHocList = async () => {
  const response = await fetch(`${API_BASE_URL}/tiethoc`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách tiết học thất bại.');
  return data.metadata;
};

export const apiCreateTietHoc = async ({ maTiet, tenTiet, gioBatDau, gioKetThuc }) => {
  const response = await fetch(`${API_BASE_URL}/tiethoc`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maTiet, tenTiet, gioBatDau, gioKetThuc })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Tạo tiết học thất bại.');
  return data.metadata;
};

export const apiUpdateTietHoc = async (maTiet, { tenTiet, gioBatDau, gioKetThuc }) => {
  const response = await fetch(`${API_BASE_URL}/tiethoc/${maTiet}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tenTiet, gioBatDau, gioKetThuc })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Cập nhật tiết học thất bại.');
  return data.metadata;
};

export const apiDeleteTietHoc = async (maTiet) => {
  const response = await fetch(`${API_BASE_URL}/tiethoc/${maTiet}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Xóa tiết học thất bại.');
  return data.metadata;
};
