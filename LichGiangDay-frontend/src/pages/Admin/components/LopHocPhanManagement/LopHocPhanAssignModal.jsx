import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2, Search, Network } from 'lucide-react';
import { apiGetGiangVienList } from '../../../../utils/api';
import { apiAssignGiangVien, apiGetSuggestedLopSinhVien, apiAttachLopSinhVien, apiDetachLopSinhVien } from '../../../../utils/apiLopHocPhan';

// ==========================================
// MODAL: Phân công Giảng viên
// ==========================================
export function AssignGiangVienModal({ isOpen, lopHocPhan, onClose, onSuccess }) {
  const [gvList, setGvList] = useState([]);
  const [searchGV, setSearchGV] = useState('');
  const [selectedGV, setSelectedGV] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedGV(lopHocPhan?.MaGiangVien || '');
    setError(''); setSuccess('');
    fetchGV();
  }, [isOpen]);

  const fetchGV = async () => {
    setFetchLoading(true);
    try {
      const data = await apiGetGiangVienList({ trangThai: 'Active' });
      setGvList(data || []);
    } catch { setGvList([]); }
    finally { setFetchLoading(false); }
  };

  const handleSave = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const result = await apiAssignGiangVien(lopHocPhan.MaLopHocPhan, selectedGV || null);
      setSuccess(result.message || 'Thành công!');
      setTimeout(() => { onSuccess(); onClose(); }, 800);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  // Ưu tiên GV cùng bộ môn
  const sortedGV = [...gvList].sort((a, b) => {
    const aMatch = a.MaBoMon === lopHocPhan?.MaBoMon ? 0 : 1;
    const bMatch = b.MaBoMon === lopHocPhan?.MaBoMon ? 0 : 1;
    return aMatch - bMatch || a.HoTen.localeCompare(b.HoTen);
  });

  const filtered = searchGV
    ? sortedGV.filter(gv => gv.HoTen.toLowerCase().includes(searchGV.toLowerCase()) || gv.MaGiangVien.toLowerCase().includes(searchGV.toLowerCase()))
    : sortedGV;

  return (
    <div className="modal-overlay">
      <div className="modal-card wide">
        <div className="modal-header">
          <h3 className="modal-title">Phân Công Giảng Viên</h3>
          <button onClick={onClose} className="modal-close-btn"><X size={20} /></button>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)', marginBottom: 12 }}>
          Lớp: <b style={{ color: 'var(--admin-text-main)' }}>{lopHocPhan?.MaLopHocPhan}</b>
          {lopHocPhan?.TenBoMon && <> — Bộ môn: <b>{lopHocPhan.TenBoMon}</b></>}
        </div>

        {success && <div className="alert-banner success"><CheckCircle2 size={18} /><span>{success}</span></div>}
        {error && <div className="alert-banner error"><AlertCircle size={18} /><span>{error}</span></div>}

        {/* Search GV */}
        <div className="search-box" style={{ marginBottom: 10, maxWidth: '100%' }}>
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Tìm giảng viên..." value={searchGV} onChange={e => setSearchGV(e.target.value)} />
        </div>

        {/* GV picker */}
        <div className="lhp-picker-list">
          {/* Option: Bỏ phân công */}
          <div
            className={`lhp-picker-item ${selectedGV === '' ? 'selected' : ''}`}
            onClick={() => setSelectedGV('')}
          >
            <input type="radio" checked={selectedGV === ''} readOnly className="lhp-picker-checkbox" />
            <div>
              <div className="lhp-picker-name" style={{ color: '#ea580c' }}>— Bỏ phân công (Unassigned) —</div>
            </div>
          </div>

          {fetchLoading ? (
            <div className="table-loading-cell" style={{ padding: 20 }}>
              <Loader2 size={18} className="animate-spin" /> Đang tải...
            </div>
          ) : filtered.map(gv => (
            <div
              key={gv.MaGiangVien}
              className={`lhp-picker-item ${selectedGV === gv.MaGiangVien ? 'selected' : ''}`}
              onClick={() => setSelectedGV(gv.MaGiangVien)}
            >
              <input type="radio" checked={selectedGV === gv.MaGiangVien} readOnly className="lhp-picker-checkbox" />
              <div style={{ flex: 1 }}>
                <div className="lhp-picker-name">{gv.HoTen} <span style={{ fontWeight: 400, color: 'var(--admin-text-sub)', fontSize: '0.8rem' }}>({gv.MaGiangVien})</span></div>
                <div className="lhp-picker-sub">
                  {gv.TenBoMon || 'Chưa phân BM'}
                  {gv.MaBoMon === lopHocPhan?.MaBoMon && <span style={{ marginLeft: 6, color: '#059669', fontWeight: 600 }}>★ Cùng BM</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-cancel">Hủy</button>
          <button type="button" onClick={handleSave} className="btn-save" disabled={loading}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Đang lưu...</> : 'Xác Nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: Gắn lớp sinh viên
// ==========================================
export function AttachLopSinhVienModal({ isOpen, lopHocPhan, onClose, onSuccess }) {
  const [allLSV, setAllLSV] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searchLSV, setSearchLSV] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelected([]); setError(''); setSuccess(''); setSearchLSV('');
    fetchSuggested();
  }, [isOpen]);

  const fetchSuggested = async () => {
    setFetchLoading(true);
    try {
      const data = await apiGetSuggestedLopSinhVien(lopHocPhan.MaLopHocPhan);
      setAllLSV(data || []);
    } catch { setAllLSV([]); }
    finally { setFetchLoading(false); }
  };

  const toggleSelect = (maLSV) => {
    setSelected(prev => prev.includes(maLSV) ? prev.filter(m => m !== maLSV) : [...prev, maLSV]);
  };

  const handleSave = async () => {
    if (selected.length === 0) { setError('Chưa chọn lớp SV nào.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await apiAttachLopSinhVien(lopHocPhan.MaLopHocPhan, selected);
      setSuccess('Gắn lớp sinh viên thành công!');
      setTimeout(() => { onSuccess(); onClose(); }, 800);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const filtered = searchLSV
    ? allLSV.filter(l => l.MaLopSinhVien.toLowerCase().includes(searchLSV.toLowerCase()) || l.TenLopSinhVien.toLowerCase().includes(searchLSV.toLowerCase()))
    : allLSV;

  return (
    <div className="modal-overlay">
      <div className="modal-card wide">
        <div className="modal-header">
          <h3 className="modal-title">Gắn Lớp Sinh Viên</h3>
          <button onClick={onClose} className="modal-close-btn"><X size={20} /></button>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)', marginBottom: 8 }}>
          Chọn lớp SV muốn gắn vào <b style={{ color: 'var(--admin-text-main)' }}>{lopHocPhan?.MaLopHocPhan}</b>
          {selected.length > 0 && <span style={{ marginLeft: 8, fontWeight: 600, color: '#2563eb' }}>— Đã chọn: {selected.length}</span>}
        </div>

        {success && <div className="alert-banner success"><CheckCircle2 size={18} /><span>{success}</span></div>}
        {error && <div className="alert-banner error"><AlertCircle size={18} /><span>{error}</span></div>}

        <div className="search-box" style={{ marginBottom: 8, maxWidth: '100%' }}>
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Tìm lớp sinh viên..." value={searchLSV} onChange={e => setSearchLSV(e.target.value)} />
        </div>

        <div className="lhp-picker-list">
          {fetchLoading ? (
            <div className="table-loading-cell" style={{ padding: 20 }}><Loader2 size={18} className="animate-spin" /> Đang tải...</div>
          ) : filtered.map(lsv => {
            const already = lsv.DaGhep === 1;
            return (
              <div
                key={lsv.MaLopSinhVien}
                className={`lhp-picker-item ${already ? 'already' : selected.includes(lsv.MaLopSinhVien) ? 'selected' : ''}`}
                onClick={() => !already && toggleSelect(lsv.MaLopSinhVien)}
              >
                <input
                  type="checkbox"
                  checked={already || selected.includes(lsv.MaLopSinhVien)}
                  disabled={already}
                  readOnly
                  className="lhp-picker-checkbox"
                />
                <div style={{ flex: 1 }}>
                  <div className="lhp-picker-name">{lsv.TenLopSinhVien} <span style={{ fontWeight: 400, color: 'var(--admin-text-sub)', fontSize: '0.8rem' }}>({lsv.MaLopSinhVien})</span></div>
                  <div className="lhp-picker-sub">{lsv.TenKhoa || '—'} {already && <span style={{ color: '#059669', fontWeight: 600 }}>✓ Đã ghép</span>}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-cancel">Hủy</button>
          <button type="button" onClick={handleSave} className="btn-save" disabled={loading || selected.length === 0}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Đang gắn...</> : `Gắn ${selected.length} Lớp SV`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: Gỡ lớp sinh viên
// ==========================================
export function DetachLopSinhVienModal({ isOpen, lopHocPhan, currentList, onClose, onSuccess }) {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelected([]); setError(''); setSuccess('');
  }, [isOpen]);

  const toggleSelect = (maLSV) => {
    setSelected(prev => prev.includes(maLSV) ? prev.filter(m => m !== maLSV) : [...prev, maLSV]);
  };

  const handleSave = async () => {
    if (selected.length === 0) { setError('Chưa chọn lớp SV nào.'); return; }
    setLoading(true); setError('');
    try {
      await apiDetachLopSinhVien(lopHocPhan.MaLopHocPhan, selected);
      setSuccess('Gỡ lớp sinh viên thành công!');
      setTimeout(() => { onSuccess(); onClose(); }, 800);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card wide">
        <div className="modal-header">
          <h3 className="modal-title">Gỡ Lớp Sinh Viên</h3>
          <button onClick={onClose} className="modal-close-btn"><X size={20} /></button>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)', marginBottom: 12 }}>
          Chọn lớp SV muốn gỡ khỏi <b style={{ color: 'var(--admin-text-main)' }}>{lopHocPhan?.MaLopHocPhan}</b>
          {selected.length > 0 && <span style={{ marginLeft: 8, fontWeight: 600, color: '#dc2626' }}>— Đã chọn: {selected.length}</span>}
        </div>

        {success && <div className="alert-banner success"><CheckCircle2 size={18} /><span>{success}</span></div>}
        {error && <div className="alert-banner error"><AlertCircle size={18} /><span>{error}</span></div>}

        <div className="lhp-picker-list">
          {(currentList || []).map(lsv => (
            <div
              key={lsv.MaLopSinhVien}
              className={`lhp-picker-item ${selected.includes(lsv.MaLopSinhVien) ? 'selected' : ''}`}
              onClick={() => toggleSelect(lsv.MaLopSinhVien)}
            >
              <input type="checkbox" checked={selected.includes(lsv.MaLopSinhVien)} readOnly className="lhp-picker-checkbox" />
              <div>
                <div className="lhp-picker-name">{lsv.TenLopSinhVien} ({lsv.MaLopSinhVien})</div>
                <div className="lhp-picker-sub">{lsv.TenKhoa || '—'}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-cancel">Hủy</button>
          <button type="button" onClick={handleSave} className="btn-delete" disabled={loading || selected.length === 0}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Đang gỡ...</> : `Gỡ ${selected.length} Lớp SV`}
          </button>
        </div>
      </div>
    </div>
  );
}
