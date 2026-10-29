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

export const checkDongXepLich = (payload) => request('/kiem-tra', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const updateDongXepLich = (maPhien, maDong, payload) => request(
  `/phien/${encodeURIComponent(maPhien)}/dong/${encodeURIComponent(maDong)}`,
  { method: 'PATCH', body: JSON.stringify(payload) }
);

export const applyPhienXepLich = (maPhien) => request(
  `/phien/${encodeURIComponent(maPhien)}/gui-xac-nhan`,
  { method: 'POST', body: JSON.stringify({}) }
);

export const cancelPhienXepLich = (maPhien) => request(
  `/phien/${encodeURIComponent(maPhien)}`,
  { method: 'DELETE' }
);


export const getLichChoXacNhan = maHocKy => request(`/cho-xac-nhan?${new URLSearchParams({ maHocKy })}`);
export const updateClassLichNhap = (maPhien, maLopHocPhan, schedules) => request(
  `/phien/${encodeURIComponent(maPhien)}/lop/${encodeURIComponent(maLopHocPhan)}/nhap`,
  { method: 'PUT', body: JSON.stringify({ schedules }) }
);

export const deleteLichNhap = (maPhien, maLopHocPhan) => request(
  `/phien/${encodeURIComponent(maPhien)}/lop/${encodeURIComponent(maLopHocPhan)}/nhap`, { method: 'DELETE' }
);
export const resolveLichNhapNotification = reference => request(`/thong-bao/${encodeURIComponent(reference)}`);
