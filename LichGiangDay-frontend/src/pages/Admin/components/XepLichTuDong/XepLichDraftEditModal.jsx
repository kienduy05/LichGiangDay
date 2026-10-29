import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Save, X } from 'lucide-react';
import { apiGetPhongHocList, apiGetTietHocList } from '../../../../utils/api';
import { checkDongXepLich, updateDongXepLich } from './apiXepLich';

const WEEKDAYS = [
  [2, 'Thứ 2'], [3, 'Thứ 3'], [4, 'Thứ 4'], [5, 'Thứ 5'],
  [6, 'Thứ 6'], [7, 'Thứ 7'], [8, 'Chủ nhật (ngày nghỉ)']
];

const dateValue = value => value ? String(value).slice(0, 10) : '';
const hasThreePeriods = item => {
  const match = String(item.TenTiet || '').match(/(\d+)\s*[-–—]\s*(\d+)/);
  return Number(item.SoTiet) === 3 || (match && Number(match[2]) - Number(match[1]) + 1 === 3);
};

export default function XepLichDraftEditModal({ maPhien, dong, onClose, onSaved }) {
  const [periods, setPeriods] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(() => ({
    thuTrongTuan: Number(dong.ThuTrongTuan),
    maTiet: Number(dong.MaTiet),
    maPhong: dong.MaPhong || '',
    ngayBatDau: dateValue(dong.NgayBatDau),
    ngayKetThuc: dateValue(dong.NgayKetThuc),
    daKhoa: Boolean(dong.DaKhoa)
  }));
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([apiGetTietHocList(), apiGetPhongHocList()])
      .then(([periodList, roomList]) => {
        setPeriods((periodList || []).filter(hasThreePeriods));
        setRooms(roomList || []);
      })
      .catch(err => setError(err.message || 'Không thể tải danh mục tiết và phòng học.'));
  }, []);

  const isSunday = Number(form.thuTrongTuan) === 8;

  const payload = {
    maLopHocPhan: dong.MaLopHocPhan,
    ...form,
    maPhien,
    excludeMaDong: dong.MaDong
  };

  const changeDate = (value) => {
    const date = new Date(`${value}T00:00:00Z`);
    const day = date.getUTCDay();
    setForm(current => ({ ...current, ngayBatDau: value, ngayKetThuc: value,
      thuTrongTuan: Number.isFinite(day) ? (day === 0 ? 8 : day + 1) : current.thuTrongTuan }));
    setResult(null);
  };

  const handleCheck = async () => {
    if (isSunday) return;
    setChecking(true);
    setError('');
    try {
      const response = await checkDongXepLich(payload);
      setResult(response);
    } catch (err) {
      setError(err.message);
      setResult(err.metadata || null);
    } finally {
      setChecking(false);
    }
  };

  const handleSave = async () => {
    if (isSunday) return;
    setSaving(true);
    setError('');
    try {
      await updateDongXepLich(maPhien, dong.MaDong, form);
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
      setResult(err.metadata || null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="xlt-nested-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className="xlt-edit-card">
        <div className="xlt-edit-header">
          <div>
            <h3>Chỉnh buổi học</h3>
            <p>{dong.MaLopHocPhan} · {dong.TenMonHoc}</p>
          </div>
          <button type="button" className="xlt-icon-button" onClick={onClose}><X size={19} /></button>
        </div>

        <div className="xlt-edit-grid">
          <label>Thứ
            <select value={form.thuTrongTuan} disabled>
              {WEEKDAYS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Ca/Tiết
            <select value={form.maTiet} onChange={event => setForm({ ...form, maTiet: Number(event.target.value) })}>
              {periods.map(item => (
                <option key={item.MaTiet} value={item.MaTiet}>
                  {item.TenTiet} ({item.GioBatDau}–{item.GioKetThuc})
                </option>
              ))}
            </select>
          </label>
          <label className="xlt-field-wide">Phòng học
            <select value={form.maPhong} onChange={event => setForm({ ...form, maPhong: event.target.value })}>
              <option value="">Chọn phòng học</option>
              {rooms.map(room => (
                <option key={room.MaPhong} value={room.MaPhong}>
                  {room.TenPhong || room.MaPhong} · {room.SucChua || 0} chỗ · {room.TrangThai}
                </option>
              ))}
            </select>
          </label>
          <label className="xlt-field-wide">Ngày học (một buổi gồm 3 tiết)
            <input type="date" value={form.ngayBatDau} onChange={event => changeDate(event.target.value)} />
          </label>
        </div>

        {isSunday && <div className="xlt-inline-alert error">Chủ nhật là ngày nghỉ. Vui lòng chọn ngày từ Thứ 2 đến Thứ 7.</div>}
        {error && <div className="xlt-inline-alert error"><AlertTriangle size={16} /> {error}</div>}
        {result && (
          <div className={`xlt-check-result ${result.valid ? 'valid' : 'invalid'}`}>
            {result.valid ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
            <div>
              <strong>{result.valid ? 'Vị trí lịch hợp lệ' : 'Vị trí lịch còn xung đột'}</strong>
              {(result.conflicts || []).map((conflict, index) => <p key={`${conflict.code}-${index}`}>{conflict.message}</p>)}
            </div>
          </div>
        )}

        <div className="xlt-edit-footer">
          <button type="button" className="xlt-btn secondary" onClick={handleCheck} disabled={checking || saving || !form.maPhong || !form.ngayBatDau || isSunday}>
            {checking ? 'Đang kiểm tra…' : 'Kiểm tra xung đột'}
          </button>
          <button type="button" className="xlt-btn primary" onClick={handleSave} disabled={saving || checking || !form.maPhong || !form.ngayBatDau || isSunday}>
            <Save size={16} /> {saving ? 'Đang lưu…' : 'Lưu dòng nháp'}
          </button>
        </div>
      </div>
    </div>
  );
}
