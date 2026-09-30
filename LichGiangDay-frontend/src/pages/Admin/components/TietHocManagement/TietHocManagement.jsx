import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  Clock, BookMarked, Plus, RefreshCw, X, RotateCcw,
  AlertCircle, AlertTriangle, Loader2, Edit2, Trash2,
  ShieldAlert, CheckCircle2
} from 'lucide-react';
import {
  apiGetTietHocList,
  apiCreateTietHoc,
  apiUpdateTietHoc,
  apiDeleteTietHoc
} from '../../../../utils/api';
import './TietHocManagement.css';

// ── 5 Mẫu tiết chuẩn của nhà trường ──
const TIET_TEMPLATES = [
  { maTiet: 1, tenTiet: 'Tiết 1-3',        gioBatDau: '07:00', gioKetThuc: '09:25' },
  { maTiet: 2, tenTiet: 'Tiết 4-6',        gioBatDau: '09:35', gioKetThuc: '12:00' },
  { maTiet: 3, tenTiet: 'Tiết 7-9',        gioBatDau: '13:00', gioKetThuc: '15:25' },
  { maTiet: 4, tenTiet: 'Tiết 10-12',      gioBatDau: '15:35', gioKetThuc: '18:00' },
  { maTiet: 5, tenTiet: 'Tiết 13-16 (tối)', gioBatDau: '18:00', gioKetThuc: '21:30' },
];

// Kiểm tra một tiết có giờ khớp với mẫu chuẩn không
const isNonStandard = (item) => {
  const tmpl = TIET_TEMPLATES.find(t => t.maTiet === item.MaTiet);
  if (!tmpl) return false;
  return tmpl.gioBatDau !== item.GioBatDau || tmpl.gioKetThuc !== item.GioKetThuc;
};

const EMPTY_FORM = { maTiet: '', tenTiet: '', gioBatDau: '', gioKetThuc: '' };

export default function TietHocManagement() {
  const { hasPermission } = useAuth();

  const [thList, setThList] = useState([]);
  const [thLoading, setThLoading] = useState(false);
  const [thError, setThError] = useState('');

  // ── Modal Thêm / Sửa ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [editItem, setEditItem] = useState(null); // item gốc khi edit

  // ── Modal Xóa ──
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTH, setDeletingTH] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ──────────────────────────────────────
  // FETCH
  // ──────────────────────────────────────
  const fetchList = useCallback(async () => {
    setThLoading(true);
    setThError('');
    try {
      const data = await apiGetTietHocList();
      setThList(data || []);
    } catch (err) {
      setThError(err.message || 'Không thể tải danh sách tiết học.');
    } finally {
      setThLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, []);

  // ──────────────────────────────────────
  // MODAL THÊM
  // ──────────────────────────────────────
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData(EMPTY_FORM);
    setSelectedTemplate('');
    setFormError(''); setFormSuccess('');
    setEditItem(null);
    setIsModalOpen(true);
  };

  const handleTemplateChange = (e) => {
    const val = e.target.value;
    setSelectedTemplate(val);
    if (val === 'custom') {
      setFormData(prev => ({ ...prev, tenTiet: '', gioBatDau: '', gioKetThuc: '' }));
    } else if (val !== '') {
      const tmpl = TIET_TEMPLATES.find(t => t.maTiet === Number(val));
      if (tmpl) {
        setFormData(prev => ({
          ...prev,
          maTiet: String(tmpl.maTiet),
          tenTiet: tmpl.tenTiet,
          gioBatDau: tmpl.gioBatDau,
          gioKetThuc: tmpl.gioKetThuc
        }));
      }
    }
  };

  // ──────────────────────────────────────
  // MODAL SỬA
  // ──────────────────────────────────────
  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setEditItem(item);
    setFormData({
      maTiet: String(item.MaTiet),
      tenTiet: item.TenTiet,
      gioBatDau: item.GioBatDau,
      gioKetThuc: item.GioKetThuc
    });
    setSelectedTemplate('');
    setFormError(''); setFormSuccess('');
    setIsModalOpen(true);
  };

  // Nút "Khôi phục giờ chuẩn" khi edit
  const handleRestoreDefault = () => {
    if (!editItem) return;
    const tmpl = TIET_TEMPLATES.find(t => t.maTiet === editItem.MaTiet);
    if (tmpl) {
      setFormData(prev => ({ ...prev, gioBatDau: tmpl.gioBatDau, gioKetThuc: tmpl.gioKetThuc }));
    }
  };

  const hasDefaultTemplate = editItem && TIET_TEMPLATES.some(t => t.maTiet === editItem.MaTiet);

  // ──────────────────────────────────────
  // SUBMIT FORM
  // ──────────────────────────────────────
  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');

    if (modalMode === 'create' && (formData.maTiet === '' || formData.maTiet === null)) {
      setFormError('Vui lòng nhập Mã tiết.'); return;
    }
    if (!formData.tenTiet.trim()) {
      setFormError('Vui lòng nhập Tên tiết.'); return;
    }
    if (!formData.gioBatDau) {
      setFormError('Vui lòng nhập Giờ bắt đầu.'); return;
    }
    if (!formData.gioKetThuc) {
      setFormError('Vui lòng nhập Giờ kết thúc.'); return;
    }
    if (formData.gioBatDau >= formData.gioKetThuc) {
      setFormError('Giờ bắt đầu phải nhỏ hơn giờ kết thúc.'); return;
    }

    setFormLoading(true);
    try {
      if (modalMode === 'create') {
        await apiCreateTietHoc({
          maTiet: Number(formData.maTiet),
          tenTiet: formData.tenTiet,
          gioBatDau: formData.gioBatDau,
          gioKetThuc: formData.gioKetThuc
        });
        setFormSuccess('Tạo tiết học mới thành công!');
      } else {
        await apiUpdateTietHoc(Number(formData.maTiet), {
          tenTiet: formData.tenTiet,
          gioBatDau: formData.gioBatDau,
          gioKetThuc: formData.gioKetThuc
        });
        setFormSuccess('Cập nhật tiết học thành công!');
      }
      await fetchList();
      setTimeout(() => { setIsModalOpen(false); setFormSuccess(''); }, 900);
    } catch (err) {
      setFormError(err.message || 'Thao tác thất bại.');
    } finally {
      setFormLoading(false);
    }
  };

  // ──────────────────────────────────────
  // XÓA
  // ──────────────────────────────────────
  const handleOpenDelete = (item) => {
    setDeletingTH(item);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTH) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await apiDeleteTietHoc(deletingTH.MaTiet);
      await fetchList();
      setIsDeleteModalOpen(false);
      setDeletingTH(null);
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa tiết học.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Usages của tiết đang sửa ──
  const editUsages = editItem
    ? (thList.find(t => t.MaTiet === editItem.MaTiet) || editItem)
    : null;
  const editHasUsage = editUsages &&
    ((editUsages.SoThoiKhoaBieu || 0) + (editUsages.SoBuoiHoc || 0)) > 0;

  // ── Stats ──
  const tongTiet = thList.length;
  const tongLichDung = thList.reduce((s, t) => s + (t.SoThoiKhoaBieu || 0) + (t.SoBuoiHoc || 0), 0);

  // ══════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════
  return (
    <div className="th-management-container">

      {/* Page Header */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Tiết Học</h2>
          <p className="page-subtitle">Khung giờ các ca học — thay đổi giờ áp dụng ngay cho toàn bộ lịch</p>
        </div>
        {hasPermission('TietHoc', 'CanCreate') && (
          <button className="btn-primary-add" onClick={handleOpenCreate}>
            <Plus size={18} /><span>Thêm Tiết học</span>
          </button>
        )}
      </div>

      {/* KPI */}
      <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{tongTiet}</div>
            <div className="admin-stat-text">Tổng ca học</div>
          </div>
        </div>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <BookMarked size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{tongLichDung}</div>
            <div className="admin-stat-text">Lượt dùng trong lịch</div>
          </div>
        </div>
      </div>

      {/* Data Card */}
      <div className="admin-card">
        {/* Toolbar nhỏ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '12px 20px', borderBottom: '1px solid var(--admin-border)' }}>
          <button className="btn-refresh" title="Tải lại" onClick={fetchList}>
            <RefreshCw size={16} className={thLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {thError && (
          <div className="alert-banner error" style={{ margin: '0 20px 16px' }}>
            <AlertCircle size={18} /><span>{thError}</span>
          </div>
        )}

        {thLoading ? (
          <div className="table-loading-cell" style={{ padding: '40px 0' }}>
            <Loader2 size={24} className="animate-spin" />
            <span>Đang tải danh sách tiết học...</span>
          </div>
        ) : thList.length === 0 ? (
          <div className="table-empty-cell" style={{ padding: '40px 0' }}>
            Chưa có tiết học nào trong hệ thống.
          </div>
        ) : (
          <div className="th-card-list">
            {thList.map(item => {
              const nonStd = isNonStandard(item);
              const totalUsage = (item.SoThoiKhoaBieu || 0) + (item.SoBuoiHoc || 0);
              return (
                <div key={item.MaTiet} className="th-card-item">

                  {/* Header */}
                  <div className="th-card-header">
                    <div className="th-card-header-left">
                      <span className="th-card-name">{item.TenTiet}</span>
                      <span className="th-time-badge">
                        <Clock size={11} />
                        {item.GioBatDau} – {item.GioKetThuc}
                      </span>
                      <span className={`th-usage-badge ${totalUsage === 0 ? 'clean' : ''}`}>
                        <BookMarked size={11} />
                        {totalUsage > 0 ? `${totalUsage} lượt dùng` : 'Chưa dùng'}
                      </span>
                      {nonStd && (
                        <span className="th-custom-badge">Đã chỉnh khác mẫu chuẩn</span>
                      )}
                    </div>
                    <div className="th-card-actions" onClick={e => e.stopPropagation()}>
                      {hasPermission('TietHoc', 'CanUpdate') && (
                        <button className="action-btn edit" title="Sửa" onClick={() => handleOpenEdit(item)}>
                          <Edit2 size={15} />
                        </button>
                      )}
                      {hasPermission('TietHoc', 'CanDelete') && (
                        <button className="action-btn delete" title="Xóa" onClick={() => handleOpenDelete(item)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="th-card-fields">
                    <div className="th-card-field">
                      <span className="th-field-label">Mã tiết</span>
                      <span className="th-field-value">{item.MaTiet}</span>
                    </div>
                    <div className="th-card-field">
                      <span className="th-field-label">Tên ca</span>
                      <span className="th-field-value">{item.TenTiet}</span>
                    </div>
                    <div className="th-card-field">
                      <span className="th-field-label">Giờ BĐ</span>
                      <span className="th-field-value">{item.GioBatDau}</span>
                    </div>
                    <div className="th-card-field">
                      <span className="th-field-label">Giờ KT</span>
                      <span className="th-field-value">{item.GioKetThuc}</span>
                    </div>
                    <div className="th-card-field">
                      <span className="th-field-label">Lịch dùng</span>
                      <span className="th-field-value" style={{ fontSize: '0.82rem', color: 'var(--admin-text-sub)' }}>
                        {item.SoThoiKhoaBieu || 0} giai đoạn TKB · {item.SoBuoiHoc || 0} buổi học
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ MODAL: Thêm / Sửa ══ */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'create' ? 'Thêm Tiết Học Mới' : `Cập Nhật Tiết ${formData.maTiet} — ${editItem?.TenTiet}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn"><X size={20} /></button>
            </div>

            {formSuccess && <div className="alert-banner success"><CheckCircle2 size={18} /><span>{formSuccess}</span></div>}
            {formError && <div className="alert-banner error"><AlertCircle size={18} /><span>{formError}</span></div>}

            {/* Cảnh báo usage khi sửa */}
            {modalMode === 'edit' && editHasUsage && (
              <div className="th-usage-warning">
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <b>Cảnh báo ảnh hưởng lịch:</b> Tiết này đang được dùng trong{' '}
                  <b>{editUsages?.SoThoiKhoaBieu || 0}</b> giai đoạn TKB và{' '}
                  <b>{editUsages?.SoBuoiHoc || 0}</b> buổi học.{' '}
                  Thay đổi giờ sẽ áp dụng ngay cho toàn bộ các lịch đó.
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSubmit}>
              {/* Chọn mẫu (chỉ khi Thêm) */}
              {modalMode === 'create' && (
                <div className="modal-form-group">
                  <label className="modal-label">Chọn mẫu tiết chuẩn</label>
                  <select
                    className="modal-input"
                    value={selectedTemplate}
                    onChange={handleTemplateChange}
                  >
                    <option value="">— Chọn mẫu để điền nhanh —</option>
                    {TIET_TEMPLATES.map(t => (
                      <option key={t.maTiet} value={t.maTiet}>
                        {t.tenTiet} ({t.gioBatDau} – {t.gioKetThuc})
                      </option>
                    ))}
                    <option value="custom">✏️ Tùy chỉnh (nhập tay)</option>
                  </select>
                </div>
              )}

              {/* Mã tiết */}
              <div className="modal-form-group">
                <label className="modal-label">Mã Tiết <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="number" className="modal-input"
                  placeholder="VD: 6"
                  min={1}
                  value={formData.maTiet}
                  onChange={e => setFormData({ ...formData, maTiet: e.target.value })}
                  disabled={modalMode === 'edit'}
                  style={modalMode === 'edit' ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : {}}
                  required
                />
              </div>

              {/* Tên tiết */}
              <div className="modal-form-group">
                <label className="modal-label">Tên Ca Học <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text" className="modal-input"
                  placeholder="VD: Tiết 1-3"
                  value={formData.tenTiet}
                  onChange={e => setFormData({ ...formData, tenTiet: e.target.value })}
                  required
                />
              </div>

              {/* Giờ (2 cột) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="modal-form-group">
                  <label className="modal-label">Giờ Bắt Đầu <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="time" className="modal-input"
                    value={formData.gioBatDau}
                    onChange={e => setFormData({ ...formData, gioBatDau: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label className="modal-label">Giờ Kết Thúc <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="time" className="modal-input"
                    value={formData.gioKetThuc}
                    onChange={e => setFormData({ ...formData, gioKetThuc: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Nút khôi phục giờ chuẩn (chỉ khi Sửa) */}
              {modalMode === 'edit' && hasDefaultTemplate && (
                <button
                  type="button"
                  className="btn-restore-default"
                  onClick={handleRestoreDefault}
                >
                  <RotateCcw size={13} />
                  Khôi phục giờ chuẩn
                </button>
              )}

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">Hủy</button>
                <button type="submit" className="btn-save" disabled={formLoading}>
                  {formLoading
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Loader2 size={16} className="animate-spin" /> Đang lưu...</span>
                    : modalMode === 'create' ? 'Thêm Tiết Học' : (editHasUsage ? 'Lưu (Đã hiểu cảnh báo)' : 'Lưu Thay Đổi')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: Xóa ══ */}
      {isDeleteModalOpen && deletingTH && (
        <div className="modal-overlay">
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper"><ShieldAlert size={32} /></div>
            <h3 className="delete-modal-title">Xác Nhận Xóa Tiết Học</h3>
            <p className="delete-modal-desc">
              Bạn có chắc muốn xóa{' '}
              <b style={{ color: 'var(--admin-text-main)' }}>
                {deletingTH.TenTiet} (Mã {deletingTH.MaTiet})
              </b>?
            </p>

            {/* Chặn xóa nếu đang dùng */}
            {((deletingTH.SoThoiKhoaBieu || 0) > 0 || (deletingTH.SoBuoiHoc || 0) > 0) && (
              <div className="alert-banner error" style={{ margin: '0 0 12px', fontSize: '0.84rem' }}>
                <AlertCircle size={16} />
                <div>
                  Tiết này đang được dùng trong{' '}
                  <b>{deletingTH.SoThoiKhoaBieu || 0}</b> giai đoạn TKB
                  và <b>{deletingTH.SoBuoiHoc || 0}</b> buổi học. Không thể xóa.
                </div>
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
              {(deletingTH.SoThoiKhoaBieu || 0) === 0 && (deletingTH.SoBuoiHoc || 0) === 0 && (
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
