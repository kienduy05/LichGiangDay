import React, { useCallback, useEffect, useState } from 'react';
import { getLichChoXacNhan, deleteLichNhap, applyPhienXepLich } from './apiXepLich';
import { apiLockClassSchedule } from '../../../../utils/apiThoiKhoaBieu';
import './XepLichTuDong.css';

export default function XepLichApprovalQueue({ maHocKy, user, refreshToken, onChanged, canUpdate = true, canDelete = false, focusSessionId }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const allowed = ['ADMIN', 'PHONGDAOTAO', 'BOMON'].includes(user?.role);
  const load = useCallback(async () => {
    if (!maHocKy || !allowed) return;
    setLoading(true); setError('');
    try { setRows(await getLichChoXacNhan(maHocKy)); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [maHocKy, allowed]);
  useEffect(() => {
    if (!maHocKy || !allowed) return;
    let cancelled = false;
    getLichChoXacNhan(maHocKy)
      .then(result => { if (!cancelled) { setRows(result); setError(''); } })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [maHocKy, allowed, refreshToken]);
  useEffect(() => {
    if (focusSessionId && !loading) document.getElementById('lich-nhap-cho-xac-nhan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusSessionId, loading]);
  const act = async row => {
    if (user.role === 'BOMON') return;
    if (!window.confirm(`Khóa lịch lớp ${row.TenLopHocPhan || row.MaLopHocPhan}? Lịch đã có giảng viên sẽ được chốt và sinh buổi học.`)) return;
    setBusy(true); setError('');
    try { await apiLockClassSchedule(row.MaLopHocPhan); await load(); onChanged?.(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const remove = async row => {
    if (!window.confirm(`Xóa toàn bộ lịch nháp của lớp ${row.TenLopHocPhan || row.MaLopHocPhan}? Cần xếp và gửi bộ môn lại nếu muốn sử dụng.`)) return;
    setBusy(true); setError('');
    try { await deleteLichNhap(row.MaPhien, row.MaLopHocPhan); await load(); onChanged?.(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const retryNotification = async row => {
    setBusy(true); setError('');
    try {
      const result = await applyPhienXepLich(row.MaPhien);
      await load();
      if (result.canhBaoThongBao?.length) setError(result.canhBaoThongBao.join(' '));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  if (!maHocKy || !allowed) return null;
  return <section id="lich-nhap-cho-xac-nhan" className="xlt-approval-queue">
    <div className="xlt-approval-heading"><div><h3>Lịch nháp chờ phân công và khóa</h3>
      <p>Bộ môn phân công giảng viên; ADMIN/Phòng đào tạo khóa lịch để sinh buổi học. Không có bước xác nhận riêng.</p></div>
      <button type="button" className="xlt-btn secondary" onClick={load} disabled={loading || busy}>Làm mới nháp</button></div>
    {focusSessionId && !loading && !rows.some(row => row.MaPhien === focusSessionId) && <p>Nháp trong thông báo đã được xử lý hoặc không còn lịch chờ phân công/khóa ở học kỳ này.</p>}
    {error && <div role="alert" className="xlt-inline-alert error">{error}</div>}
    {loading ? <p>Đang tải lịch nháp…</p> : rows.length === 0 ? <p>Không có lịch nháp chờ xử lý trong học kỳ.</p> :
      <div className="xlt-table-wrap"><table className="xlt-table"><thead><tr>
        <th>Lớp học phần</th><th>Lịch đề xuất</th><th>Trạng thái</th><th>Thao tác</th>
      </tr></thead><tbody>{rows.map(row => <tr key={`${row.MaPhien}:${row.MaLopHocPhan}`} className={row.MaPhien === focusSessionId ? 'xlt-approval-highlight' : ''}>
        <td><strong>{row.MaLopHocPhan}</strong><span>{row.TenLopHocPhan}</span><span>Bộ môn: {row.MaBoMon}</span></td>
        <td><details><summary>Xem {row.dong.length} dòng nháp</summary>{row.dong.map(slot =>
          <p key={slot.MaDong}>Thứ {slot.ThuTrongTuan} · {slot.TenTiet || slot.MaTiet} · {slot.TenPhong || slot.MaPhong}<br />
            {String(slot.NgayBatDau).slice(0, 10)} → {String(slot.NgayKetThuc).slice(0, 10)}</p>)}</details></td>
        <td>{row.MaGiangVien ? 'Đã phân công · PĐT có thể khóa' : 'Chờ bộ môn phân công'}<span>{row.MaGiangVien ? `Giảng viên: ${row.MaGiangVien}` : 'Cần phân công giảng viên trước'}</span>{row.LoiThongBao && <span className="xlt-notification-error">Chưa gửi được thông báo: {row.LoiThongBao}</span>}</td>
        <td>{canUpdate && user.role !== 'BOMON' && <button type="button" className="xlt-btn primary" onClick={() => act(row)}
          disabled={busy || !row.MaGiangVien}>
          Khóa lịch & sinh buổi học</button>}
          {canDelete && <button type="button" className="xlt-btn danger-ghost" disabled={busy} onClick={() => remove(row)}>Xóa nháp</button>}
          {canUpdate && row.CanGuiLaiThongBao && <button type="button" className="xlt-btn secondary" disabled={busy} onClick={() => retryNotification(row)}>{row.LoiThongBao ? 'Gửi lại thông báo' : 'Gửi thông báo bộ môn'}</button>}
        </td>
      </tr>)}</tbody></table></div>}
  </section>;
}
