import { getAuthHeaders } from '../../../../utils/api';

const API_URL = 'http://localhost:5000/v1/api/xeplich';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...(options.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Không thể xử lý yêu cầu xếp lịch.');
    error.status = response.status;
    error.metadata = data.metadata;
    throw error;
  }
  return data.metadata;
};

export const getLopChuaXep = ({ maHocKy, maKhoa = '', maBoMon = '', search = '' }) => {
  const params = new URLSearchParams({ maHocKy });
  if (maKhoa) params.set('maKhoa', maKhoa);
  if (maBoMon) params.set('maBoMon', maBoMon);
  if (search) params.set('search', search);
  return request(`/lop-chua-xep?${params.toString()}`);
};

export const createPhienXepLich = (payload) => request('/phien', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const getPhienXepLich = (maPhien) => request(`/phien/${encodeURIComponent(maPhien)}`);

export const listPhienXepLich = (maHocKy) => request(`/phien?${new URLSearchParams({ maHocKy })}`);

export const deletePhienXepLich = (maPhien) => request(
  `/phien/${encodeURIComponent(maPhien)}/ban-ghi`, { method: 'DELETE' }
);

export const deleteNhieuPhienXepLich = (maPhien) => request('/phien/xoa', {
  method: 'POST', body: JSON.stringify({ maPhien })
});

export const checkDongXepLich = (payload) => request('/kiem-tra', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const updateDongXepLich = (maPhien, maDong, payload) => request(
  `/phien/${encodeURIComponent(maPhien)}/dong/${encodeURIComponent(maDong)}`,
  { method: 'PATCH', body: JSON.stringify(payload) }
);

export const applyPhienXepLich = (maPhien) => request(
  `/phien/${encodeURIComponent(maPhien)}/ap-dung`,
  { method: 'POST', body: JSON.stringify({}) }
);

export const cancelPhienXepLich = (maPhien) => request(
  `/phien/${encodeURIComponent(maPhien)}`,
  { method: 'DELETE' }
);

