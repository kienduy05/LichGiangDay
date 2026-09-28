import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  Users, School, BookMarked, Plus, Search, X, RefreshCw,
  AlertCircle, Loader2, Edit2, Trash2, ShieldAlert, CheckCircle2
} from 'lucide-react';
import {
  apiGetLopSinhVienList,
  apiCreateLopSinhVien,
  apiUpdateLopSinhVien,
  apiDeleteLopSinhVien,
  apiGetKhoaList
} from '../../../../utils/api';
import './LopSinhVienManagement.css';

export default function LopSinhVienManagement() {
  const { hasPermission } = useAuth();

  // ── Danh sách ──
  const [lsvList, setLsvList] = useState([]);
  const [lsvLoading, setLsvLoading] = useState(false);
  const [lsvError, setLsvError] = useState('');

  // ── Dropdown Khoa ──
  const [khoaList, setKhoaList] = useState([]);

  // ── Bộ lọc ──
  const [filterKhoa, setFilterKhoa] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Modal Thêm / Sửa ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({ maLopSinhVien: '', tenLopSinhVien: '', maKhoa: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // ── Modal Xóa ──
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingLSV, setDeletingLSV] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ─────────────────────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLsvLoading(true);
    setLsvError('');
    try {
      const data = await apiGetLopSinhVienList({ maKhoa: filterKhoa, search: searchQuery });
      setLsvList(data || []);
    } catch (err) {
      setLsvError(err.message || 'Không thể tải danh sách lớp sinh viên.');
    } finally {
      setLsvLoading(false);
    }
  }, [filterKhoa, searchQuery]);

  const fetchKhoaList = async () => {
    try {
      const data = await apiGetKhoaList();
      setKhoaList(data || []);
    } catch {
      setKhoaList([]);
    }
  };

  useEffect(() => {
    fetchList();
    fetchKhoaList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchList(), 300);
    return () => clearTimeout(timer);
  }, [filterKhoa, searchQuery]);

  // ─────────────────────────────────────────────────────────────
  // MODAL THÊM / SỬA
  // ─────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({ maLopSinhVien: '', tenLopSinhVien: '', maKhoa: filterKhoa || '' });
    setFormError(''); setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setFormData({
      maLopSinhVien: item.MaLopSinhVien,
      tenLopSinhVien: item.TenLopSinhVien,
      maKhoa: item.MaKhoa
    });
    setFormError(''); setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');

    if (modalMode === 'create' && !formData.maLopSinhVien.trim()) {
      setFormError('Vui lòng nhập Mã lớp sinh viên.'); return;
    }
    if (!formData.tenLopSinhVien.trim()) {
      setFormError('Vui lòng nhập Tên lớp sinh viên.'); return;
    }
    if (!formData.maKhoa) {
      setFormError('Vui lòng chọn Khoa quản lý.'); return;
    }

    setFormLoading(true);
    try {
      if (modalMode === 'create') {
        await apiCreateLopSinhVien(formData);
        setFormSuccess('Thêm lớp sinh viên mới thành công!');
      } else {
        await apiUpdateLopSinhVien(formData.maLopSinhVien, {
          tenLopSinhVien: formData.tenLopSinhVien,
          maKhoa: formData.maKhoa
        });
        setFormSuccess('Cập nhật lớp sinh viên thành công!');
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
    setDeletingLSV(item);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingLSV) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await apiDeleteLopSinhVien(deletingLSV.MaLopSinhVien);
      await fetchList();
      setIsDeleteModalOpen(false);
      setDeletingLSV(null);
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa lớp sinh viên.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Stats ──
  const tongLopHP = lsvList.reduce((s, l) => s + (l.SoLopHocPhan || 0), 0);
  const soKhoa = new Set(lsvList.map(l => l.MaKhoa)).size;

  // ════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════
  return (
    <div className="lsv-management-container">

      {/* Page Header */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Lớp Sinh Viên</h2>
          <p className="page-subtitle">Danh sách lớp sinh viên và số lớp học phần đang tham gia</p>
        </div>
        {hasPermission('LopSinhVien', 'CanCreate') && (
          <button className="btn-primary-add" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Thêm Lớp sinh viên</span>
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{lsvList.length}</div>
            <div className="admin-stat-text">Tổng lớp sinh viên</div>
          </div>
        </div>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#ecfdf5', color: '#059669' }}>
            <School size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{soKhoa}</div>
            <div className="admin-stat-text">Khoa có lớp</div>
          </div>
        </div>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <BookMarked size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{tongLopHP}</div>
            <div className="admin-stat-text">Lượt tham gia lớp HP</div>
          </div>
        </div>
      </div>

      {/* Data Card */}
      <div className="admin-card">

        {/* Filter + Search */}
        <div className="lsv-filter-bar">
          <select
            className="lsv-filter-select"
            value={filterKhoa}
            onChange={e => setFilterKhoa(e.target.value)}
          >
            <option value="">— Tất cả các Khoa —</option>
            {khoaList.map(k => (
              <option key={k.MaKhoa} value={k.MaKhoa}>{k.TenKhoa} ({k.MaKhoa})</option>
            ))}
          </select>

          <div className="search-box" style={{ flex: 1, minWidth: '180px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm theo mã lớp, tên lớp..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}><X size={14} /></button>
            )}
          </div>

          <button className="btn-refresh" title="Tải lại" onClick={fetchList}>
            <RefreshCw size={16} className={lsvLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Error Banner */}
        {lsvError && (
          <div className="alert-banner error" style={{ margin: '0 20px 16px' }}>
            <AlertCircle size={18} /><span>{lsvError}</span>
          </div>
        )}

        {/* Card List */}
        {lsvLoading ? (
          <div className="table-loading-cell" style={{ padding: '40px 0' }}>
            <Loader2 size={24} className="animate-spin" />
            <span>Đang tải danh sách lớp sinh viên...</span>
          </div>
        ) : lsvList.length === 0 ? (
          <div className="table-empty-cell" style={{ padding: '40px 0' }}>
            {searchQuery || filterKhoa
              ? 'Không tìm thấy lớp sinh viên nào phù hợp.'
              : 'Chưa có lớp sinh viên nào trong hệ thống.'}
          </div>
        ) : (
          <div className="lsv-card-list">
            {lsvList.map(item => (
              <div key={item.MaLopSinhVien} className="lsv-card-item">

                {/* Header: Tên + badge + actions */}
                <div className="lsv-card-header">
                  <div className="lsv-card-header-left">
                    <span className="lsv-card-name">{item.TenLopSinhVien}</span>
                    <span className={`lsv-lhp-badge ${item.SoLopHocPhan === 0 ? 'zero' : ''}`}>
                      <BookMarked size={11} />
                      {item.SoLopHocPhan > 0
                        ? `${item.SoLopHocPhan} lớp HP`
                        : 'Chưa có lớp HP'}
                    </span>
                  </div>
                  <div className="lsv-card-actions" onClick={e => e.stopPropagation()}>
                    {hasPermission('LopSinhVien', 'CanUpdate') && (
                      <button className="action-btn edit" title="Sửa thông tin" onClick={() => handleOpenEdit(item)}>
                        <Edit2 size={15} />
                      </button>
                    )}
                    {hasPermission('LopSinhVien', 'CanDelete') && (
                      <button className="action-btn delete" title="Xóa lớp sinh viên" onClick={() => handleOpenDelete(item)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Fields dọc */}
                <div className="lsv-card-fields">
                  <div className="lsv-card-field">
                    <span className="lsv-field-label">Mã lớp</span>
                    <span className="lsv-field-value">{item.MaLopSinhVien}</span>
                  </div>
                  <div className="lsv-card-field">
                    <span className="lsv-field-label">Tên lớp</span>
                    <span className="lsv-field-value">{item.TenLopSinhVien}</span>
                  </div>
                  <div className="lsv-card-field">
                    <span className="lsv-field-label">Khoa</span>
                    <span className="lsv-khoa-badge">
                      <School size={11} />
                      {item.TenKhoa} ({item.MaKhoa})
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
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'create' ? 'Thêm Lớp Sinh Viên Mới' : 'Cập Nhật Lớp Sinh Viên'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn"><X size={20} /></button>
            </div>

            {formSuccess && <div className="alert-banner success"><CheckCircle2 size={18} /><span>{formSuccess}</span></div>}
            {formError && <div className="alert-banner error"><AlertCircle size={18} /><span>{formError}</span></div>}

            <form onSubmit={handleSaveSubmit}>
              {/* Mã lớp */}
              <div className="modal-form-group">
                <label className="modal-label">Mã Lớp Sinh Viên <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text" className="modal-input"
                  placeholder="VD: CNPM62A, KTMT63B..."
                  value={formData.maLopSinhVien}
                  onChange={e => setFormData({ ...formData, maLopSinhVien: e.target.value })}
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

              {/* Tên lớp */}
              <div className="modal-form-group">
                <label className="modal-label">Tên Lớp Sinh Viên <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text" className="modal-input"
                  placeholder="VD: Lớp Công nghệ phần mềm K62A"
                  value={formData.tenLopSinhVien}
                  onChange={e => setFormData({ ...formData, tenLopSinhVien: e.target.value })}
                  required
                />
              </div>

              {/* Khoa (bắt buộc) */}
              <div className="modal-form-group">
                <label className="modal-label">Khoa Quản Lý <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="modal-input"
                  value={formData.maKhoa}
                  onChange={e => setFormData({ ...formData, maKhoa: e.target.value })}
                  required
                >
                  <option value="">— Chọn khoa —</option>
                  {khoaList.map(k => (
                    <option key={k.MaKhoa} value={k.MaKhoa}>{k.TenKhoa} ({k.MaKhoa})</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">Hủy</button>
                <button type="submit" className="btn-save" disabled={formLoading}>
                  {formLoading
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Loader2 size={16} className="animate-spin" /> Đang lưu...</span>
                    : modalMode === 'create' ? 'Thêm Lớp Sinh Viên' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: Xóa ══════════ */}
      {isDeleteModalOpen && deletingLSV && (
        <div className="modal-overlay">
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper"><ShieldAlert size={32} /></div>
            <h3 className="delete-modal-title">Xác Nhận Xóa Lớp Sinh Viên</h3>
            <p className="delete-modal-desc">
              Bạn có chắc muốn xóa lớp sinh viên{' '}
              <b style={{ color: 'var(--admin-text-main)' }}>
                {deletingLSV.TenLopSinhVien} ({deletingLSV.MaLopSinhVien})
              </b> không?
            </p>
            {deletingLSV.SoLopHocPhan > 0 && (
              <div className="alert-banner error" style={{ margin: '0 0 12px', fontSize: '0.84rem' }}>
                <AlertCircle size={16} />
                <span>
                  Lớp này đang tham gia <b>{deletingLSV.SoLopHocPhan}</b> lớp học phần. Không thể xóa.
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
              {deletingLSV.SoLopHocPhan === 0 && (
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
