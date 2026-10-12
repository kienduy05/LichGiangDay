const API_BASE_URL = 'http://localhost:5000/v1/api';

import { getAuthHeaders } from './api';

// ==========================================================================
// PHÂN HỆ DUYỆT YÊU CẦU & BIẾN ĐỘNG LỊCH GIẢNG DẠY - API SERVICES
// (Dành cho Giảng Viên, Trưởng Bộ Môn & Admin/Phòng Đào Tạo)
// ==========================================================================

/**
 * 1. TRƯỞNG BỘ MÔN: Lấy danh sách các đơn yêu cầu (Báo nghỉ, Dạy thay, Đổi ca, Dạy bù)
 * Backend tự động lọc theo Bộ môn của Trưởng BM đang đăng nhập (req.user.maBoMon hoặc req.user.username)
 */
export const apiGetYeuCauNghiByBoMon = async ({ maHocKy, loaiYeuCau = 'ALL', trangThai = 'ALL', search = '' } = {}) => {
  const params = new URLSearchParams();
  if (maHocKy) params.append('maHocKy', maHocKy);
  if (loaiYeuCau && loaiYeuCau !== 'ALL') params.append('loaiYeuCau', loaiYeuCau);
  if (trangThai && trangThai !== 'ALL') params.append('trangThai', trangThai);
  if (search) params.append('search', search);

  const url = `${API_BASE_URL}/yeucaunghi/bomon?${params.toString()}`;
  try {
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Lấy danh sách yêu cầu của bộ môn thất bại.');
    return data.metadata;
  } catch (err) {
    console.warn('[API fallback] apiGetYeuCauNghiByBoMon:', err.message);
    throw err;
  }
};

/**
 * 2. TRƯỞNG BỘ MÔN: Phê duyệt hoặc Từ chối một đơn yêu cầu
 * @param {string} maYeuCauNghi - Mã yêu cầu (VD: YCN-001)
 * @param {string} trangThai - 'Approved' | 'Rejected'
 * @param {string} lyDoTuChoi - Bắt buộc nếu trangThai === 'Rejected'
 */
export const apiDuyetYeuCauNghi = async ({ maYeuCauNghi, trangThai, lyDoTuChoi = '' }) => {
  const url = `${API_BASE_URL}/yeucaunghi/${encodeURIComponent(maYeuCauNghi)}/duyet`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ trangThai, lyDoTuChoi })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Phê duyệt yêu cầu thất bại.');
  return data.metadata;
};

/**
 * 3. ADMIN / PHÒNG ĐÀO TẠO: Lấy toàn bộ biến động lịch giảng dạy toàn trường
 */
export const apiGetBienDongLichAll = async ({
  maHocKy,
  maKhoa = 'ALL',
  maBoMon = 'ALL',
  loaiBienDong = 'ALL',
  trangThai = 'ALL',
  search = ''
} = {}) => {
  const params = new URLSearchParams();
  if (maHocKy) params.append('maHocKy', maHocKy);
  if (maKhoa && maKhoa !== 'ALL') params.append('maKhoa', maKhoa);
  if (maBoMon && maBoMon !== 'ALL') params.append('maBoMon', maBoMon);
  if (loaiBienDong && loaiBienDong !== 'ALL') params.append('loaiBienDong', loaiBienDong);
  if (trangThai && trangThai !== 'ALL') params.append('trangThai', trangThai);
  if (search) params.append('search', search);

  const url = `${API_BASE_URL}/biendong-lich/all?${params.toString()}`;
  try {
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Lấy danh sách biến động lịch toàn trường thất bại.');
    return data.metadata;
  } catch (err) {
    console.warn('[API fallback] apiGetBienDongLichAll:', err.message);
    throw err;
  }
};

/**
 * 4. ADMIN / PHÒNG ĐÀO TẠO: Can thiệp thu hồi / Hủy quyết định biến động lịch (Admin Override)
 */
export const apiRevokeBienDongLich = async ({ maBienDong, lyDoThuHoi }) => {
  const url = `${API_BASE_URL}/biendong-lich/${encodeURIComponent(maBienDong)}/revoke`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ lyDoThuHoi })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Thu hồi biến động lịch thất bại.');
  return data.metadata;
};

/**
 * 5. GIẢNG VIÊN: Lấy danh sách các ca đã nghỉ đang chờ dạy bù
 */
export const apiGetCaNghiChuaDayBu = async ({ maGiangVien, maHocKy }) => {
  const params = new URLSearchParams();
  if (maGiangVien) params.append('maGiangVien', maGiangVien);
  if (maHocKy) params.append('maHocKy', maHocKy);

  const url = `${API_BASE_URL}/dangkydaybu/ca-chua-bu?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách ca đã nghỉ thất bại.');
  return data.metadata;
};

/**
 * 6. GIẢNG VIÊN: Gửi yêu cầu Báo nghỉ / Dạy thay / Đổi ca
 */
export const apiSubmitYeuCauNghi = async (payload) => {
  const url = `${API_BASE_URL}/yeucaunghi`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Gửi yêu cầu giảng dạy thất bại.');
  return data.metadata;
};

/**
 * 7. GIẢNG VIÊN: Đăng ký lịch dạy bù
 */
export const apiSubmitDangKyDayBu = async (payload) => {
  const url = `${API_BASE_URL}/dangkydaybu`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Đăng ký lịch dạy bù thất bại.');
  return data.metadata;
};
