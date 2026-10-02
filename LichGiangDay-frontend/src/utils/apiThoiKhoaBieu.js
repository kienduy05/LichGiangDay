const API_BASE_URL = 'http://localhost:5000/v1/api';

import { getAuthHeaders } from './api';

// ================================================================
// THỜI KHÓA BIỂU (SCHEDULE) API SERVICES
// ================================================================

/** 1. Lấy dữ liệu phân cấp TreeView (Khoa -> Bộ môn -> Lớp học phần) */
export const apiGetThoiKhoaBieuTreeView = async ({ maHocKy, search = '', filterStatus = 'ALL' } = {}) => {
  const params = new URLSearchParams();
  if (maHocKy) params.append('maHocKy', maHocKy);
  if (search) params.append('search', search);
  if (filterStatus) params.append('filterStatus', filterStatus);

  const url = `${API_BASE_URL}/thoikhoabieu/treeview-data?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy sơ đồ phân cấp thời khóa biểu thất bại.');
  return data.metadata;
};

/** 2. Danh sách Thời khóa biểu dạng bảng (Table View) */
export const apiGetThoiKhoaBieuList = async ({
  maHocKy, maKhoa = '', maBoMon = '', maMonHoc = '',
  maPhong = '', thuTrongTuan = '', filterStatus = 'ALL', search = ''
} = {}) => {
  const params = new URLSearchParams();
  if (maHocKy) params.append('maHocKy', maHocKy);
  if (maKhoa) params.append('maKhoa', maKhoa);
  if (maBoMon) params.append('maBoMon', maBoMon);
  if (maMonHoc) params.append('maMonHoc', maMonHoc);
  if (maPhong) params.append('maPhong', maPhong);
  if (thuTrongTuan) params.append('thuTrongTuan', thuTrongTuan);
  if (filterStatus) params.append('filterStatus', filterStatus);
  if (search) params.append('search', search);

  const url = `${API_BASE_URL}/thoikhoabieu?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách thời khóa biểu thất bại.');
  return data.metadata;
};

/** 3. Chi tiết Thời khóa biểu của 1 Lớp học phần */
export const apiGetThoiKhoaBieuByLopHocPhan = async (maLopHocPhan) => {
  const response = await fetch(`${API_BASE_URL}/thoikhoabieu/lophocphan/${encodeURIComponent(maLopHocPhan)}`, {
    method: 'GET', headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy chi tiết thời khóa biểu lớp học phần thất bại.');
  return data.metadata;
};

/** 4. Lưới trạng thái phòng học (Room Selection Grid) */
export const apiGetRoomStatusGrid = async ({
  thuTrongTuan, maTiet, ngayBatDau, ngayKetThuc, excludeMaLopHocPhan = '', maToaNha = ''
}) => {
  const params = new URLSearchParams();
  if (thuTrongTuan) params.append('thuTrongTuan', thuTrongTuan);
  if (maTiet) params.append('maTiet', maTiet);
  if (ngayBatDau) params.append('ngayBatDau', ngayBatDau);
  if (ngayKetThuc) params.append('ngayKetThuc', ngayKetThuc);
  if (excludeMaLopHocPhan) params.append('excludeMaLopHocPhan', excludeMaLopHocPhan);
  if (maToaNha) params.append('maToaNha', maToaNha);

  const url = `${API_BASE_URL}/thoikhoabieu/room-status-grid?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy trạng thái phòng học thất bại.');
  return data.metadata;
};

/** 5. Kiểm tra xung đột trước khi lưu (Conflict Check) */
export const apiCheckScheduleConflict = async ({ maLopHocPhan, schedules = [] }) => {
  const response = await fetch(`${API_BASE_URL}/thoikhoabieu/check-conflict`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ maLopHocPhan, schedules })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Kiểm tra xung đột thất bại.');
  return data.metadata;
};

/** 6. Lưu toàn bộ Thời khóa biểu cho Lớp học phần (Transaction) */
export const apiSaveSchedules = async ({ maLopHocPhan, schedules = [] }) => {
  const response = await fetch(`${API_BASE_URL}/thoikhoabieu`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ maLopHocPhan, schedules })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lưu thời khóa biểu thất bại.');
  return data.metadata;
};

/** 7. Xóa toàn bộ Thời khóa biểu của Lớp học phần */
export const apiDeleteSchedulesByLopHocPhan = async (maLopHocPhan) => {
  const response = await fetch(`${API_BASE_URL}/thoikhoabieu/lophocphan/${encodeURIComponent(maLopHocPhan)}`, {
    method: 'DELETE', headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Xóa thời khóa biểu thất bại.');
  return data.metadata;
};

/** 8. Xóa 1 bản ghi thời khóa biểu */
export const apiDeleteScheduleItem = async (maThoiKhoaBieu) => {
  const response = await fetch(`${API_BASE_URL}/thoikhoabieu/${encodeURIComponent(maThoiKhoaBieu)}`, {
    method: 'DELETE', headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Xóa buổi học thất bại.');
  return data.metadata;
};

/** 9. Lấy dữ liệu dạng Lưới Ma trận (Matrix Grid View) */
export const apiGetMatrixGrid = async ({ maHocKy, maToaNha = '', maPhong = '', maKhoa = '', maBoMon = '' }) => {
  const params = new URLSearchParams();
  if (maHocKy) params.append('maHocKy', maHocKy);
  if (maToaNha) params.append('maToaNha', maToaNha);
  if (maPhong) params.append('maPhong', maPhong);
  if (maKhoa) params.append('maKhoa', maKhoa);
  if (maBoMon) params.append('maBoMon', maBoMon);

  const url = `${API_BASE_URL}/thoikhoabieu/matrix-grid?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy dữ liệu lưới thời khóa biểu thất bại.');
  return data.metadata;
};
