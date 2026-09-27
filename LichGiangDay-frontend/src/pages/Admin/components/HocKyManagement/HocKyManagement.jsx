import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  CalendarDays, BookMarked, Clock, Plus, Search, X, RefreshCw,
  AlertCircle, AlertTriangle, Loader2, Edit2, Trash2,
  ShieldAlert, CheckCircle2
} from 'lucide-react';
import {
  apiGetHocKyList,
  apiCreateHocKy,
  apiUpdateHocKy,
  apiDeleteHocKy
} from '../../../../utils/api';
import './HocKyManagement.css';

// Format date YYYY-MM-DD → DD/MM/YYYY
const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('vi-VN');
};

// Format date cho input[type=date] (YYYY-MM-DD)
const toInputDate = (d) => {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
};

export default function HocKyManagement() {
  const { hasPermission } = useAuth();

  // ── Danh sách ──
  const [hkList, setHkList] = useState([]);
  const [hkLoading, setHkLoading] = useState(false);
  const [hkError, setHkError] = useState('');

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState('');

  // ── Modal Thêm / Sửa ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({
    maHocKy: '', tenHocKy: '', dot: '', namHoc: '', ngayBatDau: '', ngayKetThuc: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [overlapWarning, setOverlapWarning] = useState(null);
  const [narrowWarning, setNarrowWarning] = useState(false);

  // ── Modal Xóa ──
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingHK, setDeletingHK] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ─────────────────────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setHkLoading(true);
    setHkError('');
    try {
      const data = await apiGetHocKyList({ search: searchQuery });
      setHkList(data || []);
    } catch (err) {
      setHkError(err.message || 'Không thể tải danh sách học kỳ.');
    } finally {
      setHkLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => { fetchList(); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchList(), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ─────────────────────────────────────────────────────────────
  // MODAL THÊM / SỬA
  // ─────────────────────────────────────────────────────────────
  const resetFormState = () => {
    setFormError(''); setFormSuccess('');
    setOverlapWarning(null); setNarrowWarning(false);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({ maHocKy: '', tenHocKy: '', dot: '', namHoc: '', ngayBatDau: '', ngayKetThuc: '' });
    resetFormState();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setFormData({
      maHocKy: item.MaHocKy,
      tenHocKy: item.TenHocKy,
      dot: item.Dot != null ? String(item.Dot) : '',
      namHoc: item.NamHoc || '',
      ngayBatDau: toInputDate(item.NgayBatDau),
      ngayKetThuc: toInputDate(item.NgayKetThuc)
    });
    resetFormState();
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    resetFormState();

    if (modalMode === 'create' && !formData.maHocKy.trim()) {
      setFormError('Vui lòng nhập Mã học kỳ.'); return;
    }
    if (!formData.tenHocKy.trim()) {
      setFormError('Vui lòng nhập Tên học kỳ.'); return;
    }
    if (!formData.ngayBatDau) {
      setFormError('Vui lòng chọn Ngày bắt đầu.'); return;
    }
    if (!formData.ngayKetThuc) {
      setFormError('Vui lòng chọn Ngày kết thúc.'); return;
    }
    if (formData.ngayBatDau >= formData.ngayKetThuc) {
      setFormError('Ngày bắt đầu phải trước ngày kết thúc.'); return;
    }

    setFormLoading(true);
    try {
      let result;
      if (modalMode === 'create') {
        result = await apiCreateHocKy(formData);
        setFormSuccess('Tạo học kỳ mới thành công!');
      } else {
        result = await apiUpdateHocKy(formData.maHocKy, {
          tenHocKy: formData.tenHocKy,
          dot: formData.dot,
          namHoc: formData.namHoc,
          ngayBatDau: formData.ngayBatDau,
          ngayKetThuc: formData.ngayKetThuc
        });
        setFormSuccess('Cập nhật học kỳ thành công!');
      }

      // Hiển thị cảnh báo từ server nếu có
      if (result?.overlapWarning) setOverlapWarning(result.overlapWarning);
      if (result?.dateNarrowWarning) setNarrowWarning(true);

      await fetchList();

      // Tự đóng modal sau 1.2s nếu không có warning
      if (!result?.overlapWarning && !result?.dateNarrowWarning) {
        setTimeout(() => { setIsModalOpen(false); resetFormState(); }, 900);
      }
    } catch (err) {
      setFormError(err.message || 'Thao tác thất bại.');
    } finally {
      setFormLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // XÓA
  // ─────────────────────────────────────────────────────────────
  const handleOpenDelete = (item) => {
    setDeletingHK(item);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingHK) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await apiDeleteHocKy(deletingHK.MaHocKy);
      await fetchList();
      setIsDeleteModalOpen(false);
      setDeletingHK(null);
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa học kỳ.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Stats ──
  const tongLopHP = hkList.reduce((s, h) => s + (h.SoLopHocPhan || 0), 0);
  const namHocSet = new Set(hkList.filter(h => h.NamHoc).map(h => h.NamHoc)).size;

  // ════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════
  return (
    <div className="hk-management-container">

      {/* Page Header */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Học Kỳ</h2>
          <p className="page-subtitle">Danh sách học kỳ, năm học và số lớp học phần đang mở</p>
        </div>
        {hasPermission('HocKy', 'CanCreate') && (
          <button className="btn-primary-add" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Thêm Học kỳ</span>
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <CalendarDays size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{hkList.length}</div>
            <div className="admin-stat-text">Tổng học kỳ</div>
          </div>
        </div>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{namHocSet}</div>
            <div className="admin-stat-text">Năm học khác nhau</div>
          </div>
        </div>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <BookMarked size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{tongLopHP}</div>
            <div className="admin-stat-text">Tổng lớp học phần</div>
          </div>
        </div>
      </div>

      {/* Data Card */}
      <div className="admin-card">
        {/* Search */}
        <div className="hk-filter-bar">
          <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm theo mã HK, tên học kỳ, năm học..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}><X size={14} /></button>
            )}
          </div>
          <button className="btn-refresh" title="Tải lại" onClick={fetchList}>
            <RefreshCw size={16} className={hkLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Error */}
        {hkError && (
          <div className="alert-banner error" style={{ margin: '0 20px 16px' }}>
            <AlertCircle size={18} /><span>{hkError}</span>
          </div>
        )}

        {/* Card List */}
        {hkLoading ? (
          <div className="table-loading-cell" style={{ padding: '40px 0' }}>
            <Loader2 size={24} className="animate-spin" />
            <span>Đang tải danh sách học kỳ...</span>
          </div>
        ) : hkList.length === 0 ? (
          <div className="table-empty-cell" style={{ padding: '40px 0' }}>
            {searchQuery ? 'Không tìm thấy học kỳ nào phù hợp.' : 'Chưa có học kỳ nào trong hệ thống.'}
          </div>
        ) : (
          <div className="hk-card-list">
            {hkList.map(item => (
              <div key={item.MaHocKy} className="hk-card-item">

                {/* Header */}
                <div className="hk-card-header">
                  <div className="hk-card-header-left">
                    <span className="hk-card-name">{item.TenHocKy}</span>
                    {item.NamHoc && (
                      <span className="hk-namhoc-badge"><CalendarDays size={10} /> {item.NamHoc}</span>
                    )}
                    {item.Dot != null && (
                      <span className="hk-dot-badge">Đợt {item.Dot}</span>
                    )}
                    <span className={`hk-lhp-badge ${item.SoLopHocPhan === 0 ? 'zero' : ''}`}>
                      <BookMarked size={11} />
                      {item.SoLopHocPhan > 0 ? `${item.SoLopHocPhan} lớp HP` : 'Chưa có lớp HP'}
                    </span>
                  </div>
                  <div className="hk-card-actions" onClick={e => e.stopPropagation()}>
                    {hasPermission('HocKy', 'CanUpdate') && (
                      <button className="action-btn edit" title="Sửa" onClick={() => handleOpenEdit(item)}>
                        <Edit2 size={15} />
                      </button>
                    )}
                    {hasPermission('HocKy', 'CanDelete') && (
                      <button className="action-btn delete" title="Xóa" onClick={() => handleOpenDelete(item)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Fields dọc */}
                <div className="hk-card-fields">
                  <div className="hk-card-field">
                    <span className="hk-field-label">Mã HK</span>
                    <span className="hk-field-value">{item.MaHocKy}</span>
                  </div>
                  <div className="hk-card-field">
                    <span className="hk-field-label">Tên HK</span>
                    <span className="hk-field-value">{item.TenHocKy}</span>
                  </div>
                  <div className="hk-card-field">
                    <span className="hk-field-label">Năm học</span>
                    <span className={`hk-field-value ${!item.NamHoc ? 'muted' : ''}`}>
                      {item.NamHoc || 'Chưa xác định'}
                    </span>
                  </div>
                  <div className="hk-card-field">
                    <span className="hk-field-label">Đợt</span>
                    <span className={`hk-field-value ${item.Dot == null ? 'muted' : ''}`}>
                      {item.Dot != null ? `Đợt ${item.Dot}` : 'Chưa xác định'}
                    </span>
                  </div>
                  <div className="hk-card-field">
                    <span className="hk-field-label">Thời gian</span>
                    <span className="hk-field-value">
                      {fmtDate(item.NgayBatDau)} – {fmtDate(item.NgayKetThuc)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════ MODAL: Thêm / Sửa ══════════ */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'create' ? 'Thêm Học Kỳ Mới' : `Cập Nhật Học Kỳ — ${formData.maHocKy}`}
              </h3>
              <button onClick={() => { setIsModalOpen(false); resetFormState(); }} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {formSuccess && <div className="alert-banner success"><CheckCircle2 size={18} /><span>{formSuccess}</span></div>}
            {formError && <div className="alert-banner error"><AlertCircle size={18} /><span>{formError}</span></div>}

            {/* Overlap warning */}
            {overlapWarning && (
              <div className="hk-overlap-warning" style={{ margin: '0 0 14px' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <b>Cảnh báo chồng lấn thời gian:</b> Học kỳ này có khoảng thời gian giao nhau với:
                  <ul style={{ margin: '4px 0 0 16px', paddingLeft: 0 }}>
                    {overlapWarning.map(o => (
                      <li key={o.MaHocKy}><b>{o.TenHocKy}</b> ({fmtDate(o.NgayBatDau)} – {fmtDate(o.NgayKetThuc)})</li>
                    ))}
                  </ul>
                  Đây là cảnh báo — không bắt buộc phải sửa nếu 2 hệ đào tạo chạy song song.
                </div>
              </div>
            )}

            {/* Date narrow warning */}
            {narrowWarning && (
              <div className="hk-narrow-warning" style={{ margin: '0 0 14px' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <b>Cảnh báo thu hẹp thời gian:</b> Bạn đã rút ngắn khoảng thời gian học kỳ. Vui lòng kiểm tra lại lịch dạy của các lớp học phần thuộc học kỳ này để đảm bảo không có buổi học nằm ngoài khoảng ngày mới.
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSubmit}>
              {/* Mã học kỳ */}
              <div className="modal-form-group">
                <label className="modal-label">Mã Học Kỳ <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text" className="modal-input"
                  placeholder="VD: HK1-2425, 2024-1..."
                  value={formData.maHocKy}
                  onChange={e => setFormData({ ...formData, maHocKy: e.target.value })}
                  disabled={modalMode === 'edit'}
                  style={modalMode === 'edit' ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : {}}
                  required
                />
              </div>

              {/* Tên học kỳ */}
              <div className="modal-form-group">
                <label className="modal-label">Tên Học Kỳ <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text" className="modal-input"
                  placeholder="VD: Học kỳ 1 năm học 2024-2025"
                  value={formData.tenHocKy}
                  onChange={e => setFormData({ ...formData, tenHocKy: e.target.value })}
                  required
                />
              </div>

              {/* Đợt + Năm học (2 cột) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="modal-form-group">
                  <label className="modal-label">Đợt</label>
                  <input
                    type="number" className="modal-input"
                    placeholder="1, 2, 3..."
                    min={1}
                    value={formData.dot}
                    onChange={e => setFormData({ ...formData, dot: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label className="modal-label">Năm học</label>
                  <input
                    type="text" className="modal-input"
                    placeholder="VD: 2024-2025"
                    value={formData.namHoc}
                    onChange={e => setFormData({ ...formData, namHoc: e.target.value })}
                  />
                </div>
              </div>

              {/* Ngày bắt đầu + kết thúc (2 cột) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="modal-form-group">
                  <label className="modal-label">Ngày Bắt Đầu <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="date" className="modal-input"
                    value={formData.ngayBatDau}
                    onChange={e => setFormData({ ...formData, ngayBatDau: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label className="modal-label">Ngày Kết Thúc <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="date" className="modal-input"
                    value={formData.ngayKetThuc}
                    onChange={e => setFormData({ ...formData, ngayKetThuc: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => { setIsModalOpen(false); resetFormState(); }} className="btn-cancel">
                  {overlapWarning || narrowWarning ? 'Đóng' : 'Hủy'}
                </button>
                {!overlapWarning && !narrowWarning && (
                  <button type="submit" className="btn-save" disabled={formLoading}>
                    {formLoading
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Loader2 size={16} className="animate-spin" /> Đang lưu...</span>
                      : modalMode === 'create' ? 'Thêm Học Kỳ' : 'Lưu Thay Đổi'}
                  </button>
                )}
                {(overlapWarning || narrowWarning) && !formLoading && (
                  <button type="button" onClick={() => { setIsModalOpen(false); resetFormState(); }} className="btn-save">
                    Đã hiểu, đóng
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: Xóa ══════════ */}
      {isDeleteModalOpen && deletingHK && (
        <div className="modal-overlay">
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper"><ShieldAlert size={32} /></div>
            <h3 className="delete-modal-title">Xác Nhận Xóa Học Kỳ</h3>
            <p className="delete-modal-desc">
              Bạn có chắc muốn xóa học kỳ{' '}
              <b style={{ color: 'var(--admin-text-main)' }}>
                {deletingHK.TenHocKy} ({deletingHK.MaHocKy})
              </b> không?
            </p>
            {deletingHK.SoLopHocPhan > 0 && (
              <div className="alert-banner error" style={{ margin: '0 0 12px', fontSize: '0.84rem' }}>
                <AlertCircle size={16} />
                <span>
                  Học kỳ này đang có <b>{deletingHK.SoLopHocPhan}</b> lớp học phần. Không thể xóa.
                </span>
              </div>
            )}
            {deleteError && (
              <div className="alert-banner error" style={{ margin: '0 0 12px' }}>
                <AlertCircle size={16} /><span>{deleteError}</span>
              </div>
            )}
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button onClick={() => { setIsDeleteModalOpen(false); setDeleteError(''); }} className="btn-cancel">
                Hủy
              </button>
              {deletingHK.SoLopHocPhan === 0 && (
                <button onClick={handleConfirmDelete} className="btn-delete-confirm" disabled={deleteLoading}>
                  {deleteLoading
                    ? <><Loader2 size={16} className="animate-spin" /> Đang xóa...</>
                    : 'Xác nhận Xóa'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
