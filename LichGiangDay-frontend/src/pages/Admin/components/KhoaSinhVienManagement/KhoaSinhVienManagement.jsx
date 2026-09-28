import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  GraduationCap, BookMarked, Plus, Search, X, RefreshCw,
  AlertCircle, Loader2, Edit2, Trash2, ShieldAlert, CheckCircle2
} from 'lucide-react';
import {
  apiGetKhoaSinhVienList,
  apiCreateKhoaSinhVien,
  apiUpdateKhoaSinhVien,
  apiDeleteKhoaSinhVien
} from '../../../../utils/api';
import './KhoaSinhVienManagement.css';

export default function KhoaSinhVienManagement() {
  const { hasPermission } = useAuth();

  // ── Danh sách ──
  const [ksvList, setKsvList] = useState([]);
  const [ksvLoading, setKsvLoading] = useState(false);
  const [ksvError, setKsvError] = useState('');

  // ── Tìm kiếm ──
  const [searchQuery, setSearchQuery] = useState('');

  // ── Modal Thêm / Sửa ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({ maKhoaSinhVien: '', tenKhoaSinhVien: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // ── Modal Xóa ──
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingKSV, setDeletingKSV] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ─────────────────────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setKsvLoading(true);
    setKsvError('');
    try {
      const data = await apiGetKhoaSinhVienList({ search: searchQuery });
      setKsvList(data || []);
    } catch (err) {
      setKsvError(err.message || 'Không thể tải danh sách khóa sinh viên.');
    } finally {
      setKsvLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => { fetchList(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchList(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─────────────────────────────────────────────────────────────
  // MODAL THÊM / SỬA
  // ─────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({ maKhoaSinhVien: '', tenKhoaSinhVien: '' });
    setFormError(''); setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setFormData({
      maKhoaSinhVien: item.MaKhoaSinhVien,
      tenKhoaSinhVien: item.TenKhoaSinhVien
    });
    setFormError(''); setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');

    if (modalMode === 'create' && !formData.maKhoaSinhVien.trim()) {
      setFormError('Vui lòng nhập Mã khóa sinh viên.'); return;
    }
    if (!formData.tenKhoaSinhVien.trim()) {
      setFormError('Vui lòng nhập Tên khóa sinh viên.'); return;
    }

    setFormLoading(true);
    try {
      if (modalMode === 'create') {
        await apiCreateKhoaSinhVien(formData);
        setFormSuccess('Thêm khóa sinh viên mới thành công!');
      } else {
        await apiUpdateKhoaSinhVien(formData.maKhoaSinhVien, {
          tenKhoaSinhVien: formData.tenKhoaSinhVien
        });
        setFormSuccess('Cập nhật khóa sinh viên thành công!');
      }
      await fetchList();
      setTimeout(() => { setIsModalOpen(false); setFormSuccess(''); }, 900);
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
    setDeletingKSV(item);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingKSV) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await apiDeleteKhoaSinhVien(deletingKSV.MaKhoaSinhVien);
      await fetchList();
      setIsDeleteModalOpen(false);
      setDeletingKSV(null);
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa khóa sinh viên.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Stats ──
  const tongLopHP = ksvList.reduce((s, k) => s + (k.SoLopHocPhan || 0), 0);

  // ════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════
  return (
    <div className="ksv-management-container">

      {/* Page Header */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Khóa Sinh Viên</h2>
          <p className="page-subtitle">Danh sách niên khóa và số lớp học phần gắn theo</p>
        </div>
        {hasPermission('KhoaSinhVien', 'CanCreate') && (
          <button className="btn-primary-add" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Thêm Khóa sinh viên</span>
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{ksvList.length}</div>
            <div className="admin-stat-text">Tổng niên khóa</div>
          </div>
        </div>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <BookMarked size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{tongLopHP}</div>
            <div className="admin-stat-text">Lớp HP được gắn niên khóa</div>
          </div>
        </div>
      </div>

      {/* Data Card */}
      <div className="admin-card">

        {/* Search Bar */}
        <div className="ksv-filter-bar">
          <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm theo mã khóa, tên khóa... (VD: K65)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}><X size={14} /></button>
            )}
          </div>
          <button className="btn-refresh" title="Tải lại" onClick={fetchList}>
            <RefreshCw size={16} className={ksvLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Error Banner */}
        {ksvError && (
          <div className="alert-banner error" style={{ margin: '0 20px 16px' }}>
            <AlertCircle size={18} /><span>{ksvError}</span>
          </div>
        )}

        {/* Card List */}
        {ksvLoading ? (
          <div className="table-loading-cell" style={{ padding: '40px 0' }}>
            <Loader2 size={24} className="animate-spin" />
            <span>Đang tải danh sách khóa sinh viên...</span>
          </div>
        ) : ksvList.length === 0 ? (
          <div className="table-empty-cell" style={{ padding: '40px 0' }}>
            {searchQuery ? 'Không tìm thấy khóa sinh viên nào phù hợp.' : 'Chưa có khóa sinh viên nào trong hệ thống.'}
          </div>
        ) : (
          <div className="ksv-card-list">
            {ksvList.map(item => (
              <div key={item.MaKhoaSinhVien} className="ksv-card-item">

                {/* Header */}
                <div className="ksv-card-header">
                  <div className="ksv-card-header-left">
                    <span className="ksv-card-name">{item.TenKhoaSinhVien}</span>
                    <span className={`ksv-lhp-badge ${item.SoLopHocPhan === 0 ? 'zero' : ''}`}>
                      <BookMarked size={11} />
                      {item.SoLopHocPhan > 0
                        ? `${item.SoLopHocPhan} lớp HP`
                        : 'Chưa có lớp HP'}
                    </span>
                  </div>
                  <div className="ksv-card-actions" onClick={e => e.stopPropagation()}>
                    {hasPermission('KhoaSinhVien', 'CanUpdate') && (
                      <button className="action-btn edit" title="Sửa tên" onClick={() => handleOpenEdit(item)}>
                        <Edit2 size={15} />
                      </button>
                    )}
                    {hasPermission('KhoaSinhVien', 'CanDelete') && (
                      <button className="action-btn delete" title="Xóa" onClick={() => handleOpenDelete(item)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Fields dọc */}
                <div className="ksv-card-fields">
                  <div className="ksv-card-field">
                    <span className="ksv-field-label">Mã khóa</span>
                    <span className="ksv-field-value">{item.MaKhoaSinhVien}</span>
                  </div>
                  <div className="ksv-card-field">
                    <span className="ksv-field-label">Tên khóa</span>
                    <span className="ksv-field-value">{item.TenKhoaSinhVien}</span>
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
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'create' ? 'Thêm Khóa Sinh Viên Mới' : 'Cập Nhật Khóa Sinh Viên'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn"><X size={20} /></button>
            </div>

            {formSuccess && <div className="alert-banner success"><CheckCircle2 size={18} /><span>{formSuccess}</span></div>}
            {formError && <div className="alert-banner error"><AlertCircle size={18} /><span>{formError}</span></div>}

            <form onSubmit={handleSaveSubmit}>
              {/* Mã khóa */}
              <div className="modal-form-group">
                <label className="modal-label">Mã Khóa Sinh Viên <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text" className="modal-input"
                  placeholder="VD: K66"
                  value={formData.maKhoaSinhVien}
                  onChange={e => setFormData({ ...formData, maKhoaSinhVien: e.target.value })}
                  disabled={modalMode === 'edit'}
                  style={modalMode === 'edit' ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : {}}
                  required
                />
                {modalMode === 'create' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)', marginTop: '4px', display: 'block' }}>
                    Mã sẽ được viết hoa tự động. Không thể thay đổi sau khi tạo.
                  </span>
                )}
              </div>

              {/* Tên khóa */}
              <div className="modal-form-group">
                <label className="modal-label">Tên Khóa Sinh Viên <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text" className="modal-input"
                  placeholder="VD: Khóa 66"
                  value={formData.tenKhoaSinhVien}
                  onChange={e => setFormData({ ...formData, tenKhoaSinhVien: e.target.value })}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">Hủy</button>
                <button type="submit" className="btn-save" disabled={formLoading}>
                  {formLoading
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Loader2 size={16} className="animate-spin" /> Đang lưu...</span>
                    : modalMode === 'create' ? 'Thêm Khóa' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: Xóa ══════════ */}
      {isDeleteModalOpen && deletingKSV && (
        <div className="modal-overlay">
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper"><ShieldAlert size={32} /></div>
            <h3 className="delete-modal-title">Xác Nhận Xóa Khóa Sinh Viên</h3>
            <p className="delete-modal-desc">
              Bạn có chắc muốn xóa niên khóa{' '}
              <b style={{ color: 'var(--admin-text-main)' }}>
                {deletingKSV.TenKhoaSinhVien} ({deletingKSV.MaKhoaSinhVien})
              </b> không?
            </p>
            {deletingKSV.SoLopHocPhan > 0 && (
              <div className="alert-banner error" style={{ margin: '0 0 12px', fontSize: '0.84rem' }}>
                <AlertCircle size={16} />
                <span>
                  Niên khóa này đang có <b>{deletingKSV.SoLopHocPhan}</b> lớp học phần gắn theo. Không thể xóa.
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
              {deletingKSV.SoLopHocPhan === 0 && (
                <button
                  onClick={handleConfirmDelete}
                  className="btn-delete-confirm"
                  disabled={deleteLoading}
                >
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
