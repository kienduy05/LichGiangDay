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

/**
 * 8. GIẢNG VIÊN: Lấy ma trận lịch giảng dạy cá nhân
 */
export const apiGetLichGiangVien = async ({ tuNgay, denNgay } = {}) => {
  const params = new URLSearchParams();
  if (tuNgay) params.append('tuNgay', tuNgay);
  if (denNgay) params.append('denNgay', denNgay);
  const url = `${API_BASE_URL}/lich-giang-vien?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy lịch giảng dạy thất bại.');
  return data.metadata;
};

/**
 * 9. GIẢNG VIÊN: Lấy danh sách yêu cầu của tôi
 */
export const apiGetYeuCauCuaToi = async ({ loaiYeuCau = 'ALL', trangThai = 'ALL' } = {}) => {
  const params = new URLSearchParams();
  if (loaiYeuCau && loaiYeuCau !== 'ALL') params.append('loaiYeuCau', loaiYeuCau);
  if (trangThai && trangThai !== 'ALL') params.append('trangThai', trangThai);
  const url = `${API_BASE_URL}/yeucaunghi/cua-toi?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách yêu cầu của tôi thất bại.');
  return data.metadata;
};

/**
 * 10. GIẢNG VIÊN: Hủy yêu cầu đang chờ
 */
export const apiHuyYeuCau = async (id) => {
  const url = `${API_BASE_URL}/yeucaunghi/${encodeURIComponent(id)}/huy`;
  const response = await fetch(url, { method: 'PUT', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Hủy yêu cầu thất bại.');
  return data.metadata;
};

/**
 * 11. GIẢNG VIÊN: Lấy danh sách phòng trống trong 7 ngày
 */
export const apiGetPhongTrongDayBu = async ({ maBuoiHoc, tuNgay, maTiet } = {}) => {
  const params = new URLSearchParams();
  if (maBuoiHoc) params.append('maBuoiHoc', maBuoiHoc);
  if (tuNgay) params.append('tuNgay', tuNgay);
  if (maTiet) params.append('maTiet', maTiet);
  const url = `${API_BASE_URL}/dangkydaybu/phong-trong?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách phòng trống thất bại.');
  return data.metadata;
};

/**
 * 12. GIẢNG VIÊN: Tìm đồng nghiệp rảnh cùng bộ môn
 */
export const apiGetDongNghiepTrong = async (maBuoiHoc) => {
  const url = `${API_BASE_URL}/giangvien/dong-nghiep-trong?maBuoiHoc=${encodeURIComponent(maBuoiHoc)}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Tìm đồng nghiệp rảnh thất bại.');
  return data.metadata;
};

/**
 * 13. TRƯỞNG BỘ MÔN: Kiểm tra xung đột trước khi duyệt đơn
 */
export const apiCheckConflictYeuCau = async (id) => {
  const url = `${API_BASE_URL}/yeucaunghi/${encodeURIComponent(id)}/kiem-tra-xung-dot`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Kiểm tra xung đột thất bại.');
  return data.metadata;
};

/**
 * 14. TRƯỞNG BỘ MÔN: Phân công dạy thay cho ca đã nghỉ
 */
export const apiPhanCongDayThay = async ({ maBuoiHoc, maGiangVienDayThay, lyDo }) => {
  const url = `${API_BASE_URL}/yeucaunghi/phan-cong-day-thay`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maBuoiHoc, maGiangVienDayThay, lyDo })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Phân công dạy thay thất bại.');
  return data.metadata;
};

/**
 * 15. BỘ MÔN: Lấy biến động lịch bộ môn
 */
export const apiGetBienDongLichBoMon = async ({ maHocKy, loaiBienDong = 'ALL', trangThai = 'ALL', search = '' } = {}) => {
  const params = new URLSearchParams();
  if (maHocKy) params.append('maHocKy', maHocKy);
  if (loaiBienDong && loaiBienDong !== 'ALL') params.append('loaiBienDong', loaiBienDong);
  if (trangThai && trangThai !== 'ALL') params.append('trangThai', trangThai);
  if (search) params.append('search', search);

  const url = `${API_BASE_URL}/biendong-lich/bomon?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách biến động lịch bộ môn thất bại.');
  return data.metadata;
};

/**
 * 16. DASHBOARD HÔM NAY (US-13)
 */
export const apiGetDashboardHomNay = async () => {
  const url = `${API_BASE_URL}/dashboard/hom-nay`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy thông tin dashboard hôm nay thất bại.');
  return data.metadata;
};

/**
 * 17. THÔNG BÁO
 */
export const apiGetThongBao = async () => {
  const url = `${API_BASE_URL}/thongbao`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy thông báo thất bại.');
  return data.metadata;
};

export const apiCountThongBaoChuaDoc = async () => {
  const url = `${API_BASE_URL}/thongbao/chua-doc/count`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy số lượng thông báo thất bại.');
  return data.metadata;
};

export const apiMarkThongBaoDaDoc = async (id = 'all') => {
  const url = `${API_BASE_URL}/thongbao/${encodeURIComponent(id)}/da-doc`;
  const response = await fetch(url, { method: 'PUT', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Đánh dấu đã đọc thất bại.');
  return data.metadata;
};

