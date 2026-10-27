import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, BookMarked, CheckCircle2, Loader2, Search, X
} from 'lucide-react';
import { apiGetHocKyList } from '../../../../utils/api';
import { apiAttachLopSinhVien, apiGetLopHocPhanList } from '../../../../utils/apiLopHocPhan';

const chooseDefaultSemester = (semesters) => {
  const today = new Date().toISOString().slice(0, 10);
  return semesters.find(item => (
    String(item.NgayBatDau || '').slice(0, 10) <= today
    && String(item.NgayKetThuc || '').slice(0, 10) >= today
  )) || semesters[0] || null;
};

export default function LopSinhVienAttachClassesModal({
  lopSinhVien,
  currentList = [],
  onClose,
  onSuccess
}) {
  const [semesters, setSemesters] = useState([]);
  const [semesterId, setSemesterId] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const attachedIds = useMemo(
    () => new Set(currentList.map(item => item.MaLopHocPhan)),
    [currentList]
  );

  useEffect(() => {
    let active = true;
    apiGetHocKyList()
      .then(async (items) => {
        if (!active) return;
        const semesterList = items || [];
        const defaultSemester = chooseDefaultSemester(semesterList);
        setSemesters(semesterList);
        setSemesterId(defaultSemester?.MaHocKy || '');
        if (!defaultSemester) {
          setClasses([]);
          return;
        }
        const classList = await apiGetLopHocPhanList({ maHocKy: defaultSemester.MaHocKy });
        if (active) setClasses(classList || []);
      })
      .catch(err => active && setError(err.message || 'Không thể tải danh sách lớp học phần.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const handleSemesterChange = async (event) => {
    const value = event.target.value;
    setSemesterId(value);
    setSelectedIds([]);
    setLoading(true);
    setError('');
    try {
      const classList = await apiGetLopHocPhanList({ maHocKy: value });
      setClasses(classList || []);
    } catch (err) {
      setClasses([]);
      setError(err.message || 'Không thể tải danh sách lớp học phần.');
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return classes;
    return classes.filter(item => (
      String(item.MaLopHocPhan || '').toLowerCase().includes(keyword)
      || String(item.TenLopHocPhan || '').toLowerCase().includes(keyword)
      || String(item.TenMonHoc || '').toLowerCase().includes(keyword)
    ));
  }, [classes, search]);

  const toggleClass = (maLopHocPhan) => {
    if (attachedIds.has(maLopHocPhan)) return;
    setSelectedIds(current => current.includes(maLopHocPhan)
      ? current.filter(value => value !== maLopHocPhan)
      : [...current, maLopHocPhan]);
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setError('Vui lòng chọn ít nhất một lớp học phần.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    const results = await Promise.allSettled(
      selectedIds.map(maLopHocPhan => apiAttachLopSinhVien(
        maLopHocPhan,
        [lopSinhVien.MaLopSinhVien]
      ))
    );
    const failed = results.filter(result => result.status === 'rejected');
    const succeeded = results.length - failed.length;
    if (succeeded > 0) {
      setSuccess(`Đã gắn lớp sinh viên vào ${succeeded} lớp học phần.`);
      await onSuccess();
    }
    if (failed.length > 0) {
      setError(failed[0].reason?.message || `Có ${failed.length} lớp học phần chưa gắn được.`);
      setSaving(false);
      return;
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className="modal-card wide lsv-attach-modal">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Gắn lớp học phần</h3>
            <p className="lsv-attach-subtitle">
              {lopSinhVien.TenLopSinhVien} ({lopSinhVien.MaLopSinhVien})
            </p>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn"><X size={20} /></button>
        </div>

        {success && <div className="alert-banner success"><CheckCircle2 size={18} /><span>{success}</span></div>}
        {error && <div className="alert-banner error"><AlertCircle size={18} /><span>{error}</span></div>}

        <div className="lsv-attach-toolbar">
          <label>
            <span>Học kỳ</span>
            <select value={semesterId} onChange={handleSemesterChange} disabled={loading || saving}>
              {semesters.map(item => (
                <option key={item.MaHocKy} value={item.MaHocKy}>
                  {item.TenHocKy || item.MaHocKy} {item.NamHoc ? `- ${item.NamHoc}` : ''}
                </option>
              ))}
            </select>
          </label>
          <div className="search-box lsv-attach-search">
            <Search size={17} className="search-icon" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Tìm mã lớp hoặc tên môn học"
            />
          </div>
        </div>

        <div className="lhp-picker-list lsv-attach-list">
          {loading ? (
            <div className="table-loading-cell"><Loader2 size={20} className="animate-spin" /> Đang tải lớp học phần...</div>
          ) : filteredClasses.length === 0 ? (
            <div className="table-empty-cell">
              <BookMarked size={30} />
              <p>Không có lớp học phần trong học kỳ hoặc từ khóa đã chọn.</p>
            </div>
          ) : filteredClasses.map(item => {
            const attached = attachedIds.has(item.MaLopHocPhan);
            const selected = selectedIds.includes(item.MaLopHocPhan);
            return (
              <button
                type="button"
                key={item.MaLopHocPhan}
                className={`lhp-picker-item lsv-attach-item ${attached ? 'already' : selected ? 'selected' : ''}`}
                onClick={() => toggleClass(item.MaLopHocPhan)}
                disabled={attached || saving}
              >
                <input type="checkbox" checked={attached || selected} readOnly disabled={attached} />
                <span className="lsv-attach-class-info">
                  <strong>{item.TenLopHocPhan || item.TenMonHoc || item.MaLopHocPhan}</strong>
                  <small>{item.MaLopHocPhan} · {item.LoaiHoc} · {item.TenBoMon || item.MaBoMon}</small>
                </span>
                {attached && <span className="lsv-attached-label">Đã gắn</span>}
              </button>
            );
          })}
        </div>

        <div className="modal-footer">
          <span className="lsv-selection-count">Đã chọn {selectedIds.length} lớp học phần</span>
          <button type="button" onClick={onClose} className="btn-cancel" disabled={saving}>Hủy</button>
          <button type="button" onClick={handleSave} className="btn-save" disabled={saving || selectedIds.length === 0}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Đang gắn...</> : `Gắn ${selectedIds.length} lớp`}
          </button>
        </div>
      </div>
    </div>
  );
}
