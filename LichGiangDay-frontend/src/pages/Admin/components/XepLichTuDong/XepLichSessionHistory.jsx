import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { deleteNhieuPhienXepLich, listPhienXepLich } from './apiXepLich';

const labels = {
  Processing: 'Đang xử lý', Completed: 'Hoàn tất', CompletedWithWarnings: 'Hoàn tất có cảnh báo',
  Failed: 'Thất bại', Cancelled: 'Đã hủy', Applied: 'Đã áp dụng'
};
const removable = session => session.TrangThai !== 'Processing' && !session.DangXuLy;
const formatDate = value => value ? new Date(value).toLocaleString('vi-VN') : '—';

export default function XepLichSessionHistory({ maHocKy, canDelete, onSelect, onDeleted }) {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const list = await listPhienXepLich(maHocKy);
      setError('');
      setSessions(list || []);
      setSelected(current => current.filter(id => (list || []).some(item => item.MaPhien === id && removable(item))));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [maHocKy]);

  useEffect(() => { load(); }, [load]);

  const eligible = sessions.filter(removable).map(item => item.MaPhien);
  const allSelected = eligible.length > 0 && eligible.every(id => selected.includes(id));
  const toggle = id => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const handleDelete = async () => {
    if (!selected.length || !window.confirm(`Xóa ${selected.length} phiên đã chọn? Các phương án nháp trong phiên sẽ bị xóa. Lịch chính thức đã áp dụng được giữ lại.`)) return;
    setDeleting(true);
    setError('');
    setMessage('');
    try {
      const { removed, errors } = await deleteNhieuPhienXepLich(selected);
      if (removed.length) {
        onDeleted(removed);
        setSelected(current => current.filter(id => !removed.includes(id)));
        setMessage(`Đã xóa ${removed.length} phiên.`);
      }
      setLoading(true);
      await load();
      if (errors.length) setError(`Không xóa được ${errors.length} phiên. ${errors[0].maPhien}: ${errors[0].message}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="xlt-history">
      <div className="xlt-history-toolbar">
        <div><h3>Danh sách phiên xếp lịch</h3><p>Học kỳ {maHocKy} · {sessions.length} phiên</p></div>
        <button type="button" className="xlt-btn secondary" onClick={() => { setLoading(true); load(); }} disabled={loading || deleting}><RefreshCw size={16} /> Làm mới</button>
        {canDelete && <button type="button" className="xlt-btn danger-ghost" onClick={handleDelete} disabled={!selected.length || loading || deleting}>
          {deleting ? <Loader2 size={16} className="xlt-spin" /> : <Trash2 size={16} />} {deleting ? 'Đang xóa…' : `Xóa đã chọn (${selected.length})`}
        </button>}
      </div>
      {error && <div className="xlt-inline-alert error"><AlertCircle size={17} /><span>{error}</span></div>}
      {message && <p role="status">{message}</p>}
      <div className="xlt-table-wrap xlt-history-table">
        <table className="xlt-table">
          <thead><tr>
            {canDelete && <th><input type="checkbox" aria-label="Chọn tất cả phiên có thể xóa" checked={allSelected} disabled={!eligible.length || deleting} onChange={() => setSelected(allSelected ? [] : eligible)} /></th>}
            <th>Thời gian tạo</th><th>Phiên</th><th>Trạng thái</th><th>Kết quả</th><th />
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={canDelete ? 6 : 5} className="xlt-empty">Đang tải danh sách phiên…</td></tr>
              : sessions.length === 0 ? <tr><td colSpan={canDelete ? 6 : 5} className="xlt-empty">Chưa có phiên nào trong học kỳ này.</td></tr>
              : sessions.map(item => <tr key={item.MaPhien}>
                {canDelete && <td><input type="checkbox" aria-label={`Chọn phiên ${item.MaPhien}`} checked={selected.includes(item.MaPhien)} disabled={!removable(item) || deleting} onChange={() => toggle(item.MaPhien)} /></td>}
                <td>{formatDate(item.ThoiGianTao)}</td>
                <td><strong>{item.MaPhien}</strong><span>{item.MaBoMon ? `Bộ môn ${item.MaBoMon}` : item.MaKhoa ? `Khoa ${item.MaKhoa}` : 'Toàn trường'}</span></td>
                <td><span className={`xlt-session-status ${item.TrangThai}`}>{labels[item.TrangThai] || item.TrangThai}</span></td>
                <td>{item.SoLopDaXep || 0}/{item.TongSoLop || 0} lớp</td>
                <td><button type="button" className="xlt-btn secondary" disabled={deleting} onClick={() => onSelect(item.MaPhien)}>Xem</button></td>
              </tr>)}
          </tbody>
        </table>
      </div>
      <p className="xlt-history-note">Phiên đang xử lý cần được hủy và dừng trước khi xóa.</p>
    </section>
  );
}
