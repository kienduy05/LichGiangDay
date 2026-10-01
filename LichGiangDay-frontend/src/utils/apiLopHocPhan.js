const API_BASE_URL = 'http://localhost:5000/v1/api';

import { getAuthHeaders } from './api';

// ==========================================
// LOPHOCPHAN (LỚP HỌC PHẦN) API SERVICES
// ==========================================

/** 1. Danh sách LHP (bắt buộc maHocKy) */
export const apiGetLopHocPhanList = async ({ maHocKy, maBoMon = '', maMonHoc = '', maGiangVien = '', trangThaiPhanCong = '', search = '' } = {}) => {
  const params = new URLSearchParams();
  if (maHocKy) params.append('maHocKy', maHocKy);
  if (maBoMon) params.append('maBoMon', maBoMon);
  if (maMonHoc) params.append('maMonHoc', maMonHoc);
  if (maGiangVien) params.append('maGiangVien', maGiangVien);
  if (trangThaiPhanCong) params.append('trangThaiPhanCong', trangThaiPhanCong);
  if (search) params.append('search', search);
  const url = `${API_BASE_URL}/lophocphan${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách lớp học phần thất bại.');
  return data.metadata;
};

/** Lấy thông tin 1 LHP */
export const apiGetLopHocPhan = async (maLopHocPhan) => {
  const response = await fetch(`${API_BASE_URL}/lophocphan/${encodeURIComponent(maLopHocPhan)}`, {
    method: 'GET', headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy thông tin lớp học phần thất bại.');
  return data.metadata;
};

/** 6. Chi tiết LHP kèm lớp SV ghép */
export const apiGetLopHocPhanChiTiet = async (maLopHocPhan) => {
  const response = await fetch(`${API_BASE_URL}/lophocphan/${encodeURIComponent(maLopHocPhan)}/chitiet`, {
    method: 'GET', headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy chi tiết lớp học phần thất bại.');
  return data.metadata;
};

/** 2. Tạo mới LHP */
export const apiCreateLopHocPhan = async (body) => {
  const response = await fetch(`${API_BASE_URL}/lophocphan`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Tạo lớp học phần thất bại.');
  return data.metadata;
};

/** 3. Cập nhật LHP */
export const apiUpdateLopHocPhan = async (maLopHocPhan, body) => {
  const response = await fetch(`${API_BASE_URL}/lophocphan/${encodeURIComponent(maLopHocPhan)}`, {
    method: 'PUT', headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Cập nhật lớp học phần thất bại.');
  return data.metadata;
};

/** 7. Xóa LHP */
export const apiDeleteLopHocPhan = async (maLopHocPhan) => {
  const response = await fetch(`${API_BASE_URL}/lophocphan/${encodeURIComponent(maLopHocPhan)}`, {
    method: 'DELETE', headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Xóa lớp học phần thất bại.');
  return data.metadata;
};

/** 5. Phân công / Đổi / Gỡ GV */
export const apiAssignGiangVien = async (maLopHocPhan, maGiangVien) => {
  const response = await fetch(`${API_BASE_URL}/lophocphan/${encodeURIComponent(maLopHocPhan)}/giangvien`, {
    method: 'PUT', headers: getAuthHeaders(),
    body: JSON.stringify({ maGiangVien: maGiangVien || null })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Phân công giảng viên thất bại.');
  return { metadata: data.metadata, message: data.message };
};

/** 4a. Lấy danh sách lớp SV đã ghép */
export const apiGetLopSinhVienGhep = async (maLopHocPhan) => {
  const response = await fetch(`${API_BASE_URL}/lophocphan/${encodeURIComponent(maLopHocPhan)}/lopsinhvien`, {
    method: 'GET', headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách lớp SV ghép thất bại.');
  return data.metadata;
};

/** Gợi ý lớp SV */
export const apiGetSuggestedLopSinhVien = async (maLopHocPhan) => {
  const response = await fetch(`${API_BASE_URL}/lophocphan/${encodeURIComponent(maLopHocPhan)}/lopsinhvien/suggested`, {
    method: 'GET', headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy gợi ý lớp SV thất bại.');
  return data.metadata;
};

/** 4b. Gắn lớp SV */
export const apiAttachLopSinhVien = async (maLopHocPhan, dsLopSinhVien) => {
  const response = await fetch(`${API_BASE_URL}/lophocphan/${encodeURIComponent(maLopHocPhan)}/lopsinhvien`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ dsLopSinhVien })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Gắn lớp sinh viên thất bại.');
  return data.metadata;
};

/** 4c. Gỡ lớp SV */
export const apiDetachLopSinhVien = async (maLopHocPhan, dsLopSinhVien) => {
  const response = await fetch(`${API_BASE_URL}/lophocphan/${encodeURIComponent(maLopHocPhan)}/lopsinhvien`, {
    method: 'DELETE', headers: getAuthHeaders(),
    body: JSON.stringify({ dsLopSinhVien })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Gỡ lớp sinh viên thất bại.');
  return data.metadata;
};

/** 8. Import Excel (multipart) */
export const apiImportLopHocPhan = async (file, maBoMon, maHocKy) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('maBoMon', maBoMon);
  formData.append('maHocKy', maHocKy);

  // Custom headers without Content-Type (browser sets multipart boundary)
  const headers = {};
  const userId = localStorage.getItem('userId');
  const accessToken = localStorage.getItem('accessToken');
  headers['x-api-key'] = 'lichgiangday_secret_apikey_2026';
  if (userId) headers['x-client-id'] = userId;
  if (accessToken) headers['authorization'] = `Bearer ${accessToken}`;

  const response = await fetch(`${API_BASE_URL}/lophocphan/import`, {
    method: 'POST', headers, body: formData
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Import thất bại.');
  return data;
};

/** 9. Export Excel — returns blob */
export const apiExportLopHocPhan = async (maHocKy, maBoMon = '') => {
  const params = new URLSearchParams();
  if (maHocKy) params.append('maHocKy', maHocKy);
  if (maBoMon) params.append('maBoMon', maBoMon);

  const headers = {};
  const userId = localStorage.getItem('userId');
  const accessToken = localStorage.getItem('accessToken');
  headers['x-api-key'] = 'lichgiangday_secret_apikey_2026';
  if (userId) headers['x-client-id'] = userId;
  if (accessToken) headers['authorization'] = `Bearer ${accessToken}`;

  const response = await fetch(`${API_BASE_URL}/lophocphan/export?${params.toString()}`, {
    method: 'GET', headers
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Export thất bại.');
  }
  return response.blob();
};
