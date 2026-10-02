const API_BASE_URL = 'http://localhost:5000/v1/api';

import { getAuthHeaders } from './api';

// ================================================================
// PHÂN CÔNG GIẢNG VIÊN (BOMON ĐỘC QUYỀN) - API SERVICES
// ================================================================

/** 1. Lấy danh sách Lớp học phần cần phân công của Bộ môn */
export const apiGetBomonAssignableClasses = async ({ maHocKy, search = '', filterStatus = 'ALL' } = {}) => {
  const params = new URLSearchParams();
  if (maHocKy) params.append('maHocKy', maHocKy);
  if (search) params.append('search', search);
  if (filterStatus) params.append('filterStatus', filterStatus);

  const url = `${API_BASE_URL}/thoikhoabieu/bomon/assignable-classes?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy danh sách lớp phân công thất bại.');
  return data.metadata;
};

/** 2. Quét kiểm tra tình trạng khả dụng của GV cho 1 lớp (Conflict Engine) */
export const apiGetLecturerAvailability = async (maLopHocPhan) => {
  const url = `${API_BASE_URL}/thoikhoabieu/bomon/lecturer-availability?maLopHocPhan=${encodeURIComponent(maLopHocPhan)}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Kiểm tra khả dụng của giảng viên thất bại.');
  return data.metadata;
};

/** 3. Xem trước Thời khóa biểu tuần của Giảng viên (Mini Matrix Preview) */
export const apiGetLecturerWeeklySchedule = async ({ maGiangVien, maHocKy }) => {
  const params = new URLSearchParams();
  if (maGiangVien) params.append('maGiangVien', maGiangVien);
  if (maHocKy) params.append('maHocKy', maHocKy);

  const url = `${API_BASE_URL}/thoikhoabieu/bomon/lecturer-weekly-schedule?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy lịch tuần của giảng viên thất bại.');
  return data.metadata;
};

/** 4. Thống kê Tải Giảng Dạy toàn bộ Giảng viên trong Bộ môn (Workload Matrix) */
export const apiGetBomonWorkloadSummary = async (maHocKy) => {
  const params = new URLSearchParams();
  if (maHocKy) params.append('maHocKy', maHocKy);

  const url = `${API_BASE_URL}/thoikhoabieu/bomon/workload-summary?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lấy thống kê tải giảng dạy thất bại.');
  return data.metadata;
};

/** 5. Thực hiện Phân công Giảng viên vào Lớp HP */
export const apiAssignLecturerToClass = async ({ maLopHocPhan, maGiangVien, allowOverride = false }) => {
  const url = `${API_BASE_URL}/thoikhoabieu/bomon/assign-lecturer`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maLopHocPhan, maGiangVien, allowOverride })
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Phân công giảng viên thất bại.');
    error.conflictDetails = data.conflictDetails;
    error.statusCode = response.status;
    throw error;
  }
  return data;
};

/** 6. Hủy phân công Giảng viên khỏi Lớp HP */
export const apiUnassignLecturerFromClass = async (maLopHocPhan) => {
  const url = `${API_BASE_URL}/thoikhoabieu/bomon/unassign-lecturer`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maLopHocPhan })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Hủy phân công giảng viên thất bại.');
  return data;
};
