import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  School, Network, UserCheck, Plus, Search, X, RefreshCw,
  AlertCircle, Loader2, Edit2, Trash2, ShieldAlert, CheckCircle2,
  UserCog, ArrowLeft, ChevronRight
} from 'lucide-react';
import {
  apiGetKhoaList,
  apiCreateKhoa,
  apiUpdateKhoa,
  apiDeleteKhoa,
  apiAssignTruongKhoa,
  apiGetKhoaChiTiet,
  apiGetGiangVienByKhoa
} from '../../../utils/api';
import './KhoaManagement.css';

export default function KhoaManagement() {
  const { hasPermission } = useAuth();

  // ─── View: 'list' | 'detail' ───
  const [view, setView] = useState('list');
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Danh sách Khoa ───
  const [khoaList, setKhoaList] = useState([]);
  const [khoaLoading, setKhoaLoading] = useState(false);
  const [khoaError, setKhoaError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Modal Thêm / Sửa ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState({ maKhoa: '', tenKhoa: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // ─── Modal Xóa ───
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingKhoa, setDeletingKhoa] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ─── Modal Phân công Trưởng khoa ───
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningKhoa, setAssigningKhoa] = useState(null);
  const [giangVienList, setGiangVienList] = useState([]);
  const [giangVienLoading, setGiangVienLoading] = useState(false);
  const [selectedGV, setSelectedGV] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  // ─── Fetch danh sách Khoa ───
  const fetchKhoaList = async (search = '') => {
    setKhoaLoading(true);
    setKhoaError('');
    try {
      const data = await apiGetKhoaList(search);
      setKhoaList(data || []);
    } catch (err) {
      setKhoaError(err.message || 'Không thể tải danh sách khoa.');
    } finally {
      setKhoaLoading(false);
    }
  };

  useEffect(() => {
    fetchKhoaList();
  }, []);

  // ─── Search (client-side filter, server đã hỗ trợ cả 2) ───
  const filteredList = khoaList.filter(k =>
    k.MaKhoa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.TenKhoa?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Xem chi tiết ───
  const handleViewDetail = async (item) => {
    setDetailLoading(true);
    setView('detail');
    try {
      const data = await apiGetKhoaChiTiet(item.MaKhoa);
      setDetailData(data);
    } catch (err) {
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setDetailData(null);
  };

  // ─── Modal Thêm/Sửa ───
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({ maKhoa: '', tenKhoa: '' });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setFormData({ maKhoa: item.MaKhoa, tenKhoa: item.TenKhoa });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (modalMode === 'create' && !formData.maKhoa.trim()) {
      setFormError('Vui lòng nhập Mã Khoa.');
      return;
    }
    if (!formData.tenKhoa.trim()) {
      setFormError('Vui lòng nhập Tên Khoa.');
      return;
    }

    setFormLoading(true);
    try {
      if (modalMode === 'create') {
        await apiCreateKhoa({ maKhoa: formData.maKhoa, tenKhoa: formData.tenKhoa });
        setFormSuccess('Tạo khoa mới thành công!');
      } else {
        await apiUpdateKhoa(formData.maKhoa, { tenKhoa: formData.tenKhoa });
        setFormSuccess('Cập nhật khoa thành công!');
      }
      await fetchKhoaList(searchQuery);
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess('');
      }, 1000);
    } catch (err) {
      setFormError(err.message || 'Thao tác thất bại.');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Modal Xóa ───
  const handleOpenDelete = (item) => {
    setDeletingKhoa(item);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingKhoa) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await apiDeleteKhoa(deletingKhoa.MaKhoa);
      await fetchKhoaList(searchQuery);
      setIsDeleteModalOpen(false);
      setDeletingKhoa(null);
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa khoa.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Modal Phân công Trưởng khoa ───
  const handleOpenAssign = async (item) => {
    setAssigningKhoa(item);
    setSelectedGV(item.MaTruongKhoa || '');
    setAssignError('');
    setAssignSuccess('');
    setGiangVienLoading(true);
    setIsAssignModalOpen(true);
    try {
      const list = await apiGetGiangVienByKhoa(item.MaKhoa);
      setGiangVienList(list || []);
    } catch (err) {
      setGiangVienList([]);
      setAssignError('Không thể tải danh sách giảng viên.');
    } finally {
      setGiangVienLoading(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (!assigningKhoa) return;
    setAssignLoading(true);
    setAssignError('');
    setAssignSuccess('');
    try {
      // selectedGV = '' nghĩa là bãi nhiệm
      await apiAssignTruongKhoa(assigningKhoa.MaKhoa, selectedGV || null);
      setAssignSuccess(selectedGV ? 'Phân công Trưởng khoa thành công!' : 'Bãi nhiệm Trưởng khoa thành công!');
      await fetchKhoaList(searchQuery);
      setTimeout(() => {
        setIsAssignModalOpen(false);
        setAssignSuccess('');
      }, 1000);
    } catch (err) {
      setAssignError(err.message || 'Thao tác phân công thất bại.');
    } finally {
      setAssignLoading(false);
    }
  };

  // ════════════════════════════════════════════════
  // RENDER — Detail View
  // ════════════════════════════════════════════════
  if (view === 'detail') {
    return (
      <div className="khoa-management-container">
        <div className="admin-card" style={{ padding: 0 }}>
          <div className="khoa-detail-header">
            <button className="khoa-detail-back-btn" onClick={handleBackToList}>
              <ArrowLeft size={16} />
              Quay lại
            </button>
            <div>
              {detailLoading ? (
                <div className="khoa-detail-title">Đang tải...</div>
              ) : (
                <>
                  <div className="khoa-detail-title">
                    {detailData?.khoa?.TenKhoa} ({detailData?.khoa?.MaKhoa})
                  </div>
                  <div className="khoa-detail-subtitle">
                    Trưởng khoa: {detailData?.khoa?.TenTruongKhoa || 'Chưa phân công'}
                    {' · '}
                    {detailData?.boMonList?.length || 0} bộ môn trực thuộc
                  </div>
                </>
              )}
            </div>
          </div>

          {detailLoading ? (
            <div className="table-loading-cell" style={{ padding: '40px 20px' }}>
              <Loader2 size={24} className="animate-spin" />
              <span>Đang tải chi tiết...</span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '140px' }}>Mã Bộ Môn</th>
                    <th>Tên Bộ Môn</th>
                    <th style={{ width: '150px', textAlign: 'center' }}>Số Giảng Viên</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Chi Tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {!detailData?.boMonList?.length ? (
                    <tr>
                      <td colSpan="4" className="table-empty-cell">
                        Khoa này chưa có bộ môn nào trực thuộc.
                      </td>
                    </tr>
                  ) : (
                    detailData.boMonList.map(bm => (
                      <tr key={bm.MaBoMon}>
                        <td>
                          <span className="role-badge primary" style={{ fontWeight: 600 }}>
                            {bm.MaBoMon}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                            {bm.TenBoMon}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="user-count-tag"
                            style={{
                              background: bm.SoGiangVien > 0 ? '#ecfdf5' : '#f1f5f9',
                              color: bm.SoGiangVien > 0 ? '#059669' : '#64748b'
                            }}
                          >
                            {bm.SoGiangVien} GV
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="action-btn edit"
                            title="Xem chi tiết bộ môn"
                            style={{ margin: 'auto' }}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════
  // RENDER — List View
  // ════════════════════════════════════════════════
  return (
    <div className="khoa-management-container">

      {/* Page Header Toolbar */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Khoa</h2>
          <p className="page-subtitle">Danh sách khoa, trưởng khoa và các bộ môn trực thuộc</p>
        </div>
        {hasPermission('Khoa', 'CanCreate') && (
          <button className="btn-primary-add" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Thêm Khoa</span>
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#fdf4ff', color: '#9333ea' }}>
            <School size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{khoaList.length}</div>
            <div className="admin-stat-text">Tổng số khoa</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Network size={24} />
          </div>
          <div>
            <div className="admin-stat-number">
              {khoaList.reduce((acc, k) => acc + (Number(k.SoBoMon) || 0), 0)}
            </div>
            <div className="admin-stat-text">Tổng số bộ môn</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#ecfdf5', color: '#059669' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div className="admin-stat-number">
              {khoaList.filter(k => k.MaTruongKhoa).length}
            </div>
            <div className="admin-stat-text">Đã phân công trưởng khoa</div>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="admin-card">
        {/* Search & Refresh Toolbar */}
        <div className="roles-filter-bar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã khoa hoặc tên khoa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <button
            className="btn-refresh"
            title="Tải lại danh sách"
            onClick={() => fetchKhoaList(searchQuery)}
          >
            <RefreshCw size={16} className={khoaLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Error Banner */}
        {khoaError && (
          <div className="alert-banner error" style={{ margin: '16px 20px 0' }}>
            <AlertCircle size={18} />
            <span>{khoaError}</span>
          </div>
        )}

        {/* Table */}
        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Mã Khoa</th>
                <th>Tên Khoa</th>
                <th style={{ width: '220px' }}>Trưởng Khoa</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Số Bộ Môn</th>
                <th style={{ width: '180px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {khoaLoading ? (
                <tr>
                  <td colSpan="5" className="table-loading-cell">
                    <Loader2 size={24} className="animate-spin" />
                    <span>Đang tải danh sách khoa...</span>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-empty-cell">
                    {searchQuery
                      ? 'Không tìm thấy khoa nào phù hợp.'
                      : 'Chưa có khoa nào trong hệ thống.'}
                  </td>
                </tr>
              ) : (
                filteredList.map(item => (
                  <tr key={item.MaKhoa}>
                    {/* Mã Khoa — click để xem chi tiết */}
                    <td>
                      <span
                        className="role-badge primary"
                        style={{ fontWeight: 600, cursor: 'pointer' }}
                        title="Xem chi tiết bộ môn trực thuộc"
                        onClick={() => handleViewDetail(item)}
                      >
                        {item.MaKhoa}
                      </span>
                    </td>

                    {/* Tên Khoa */}
                    <td>
                      <div
                        style={{ fontWeight: 600, color: 'var(--admin-text-main)', cursor: 'pointer' }}
                        onClick={() => handleViewDetail(item)}
                        title="Xem chi tiết bộ môn trực thuộc"
                      >
                        {item.TenKhoa}
                      </div>
                    </td>

                    {/* Trưởng khoa */}
                    <td>
                      <div className="truongkhoa-cell">
                        {item.TenTruongKhoa ? (
                          <span className="truongkhoa-name">{item.TenTruongKhoa}</span>
                        ) : (
                          <span className="truongkhoa-empty">Chưa phân công</span>
                        )}
                        {hasPermission('Khoa', 'CanUpdate') && (
                          <button
                            className="btn-assign"
                            title="Phân công / Thay đổi Trưởng khoa"
                            onClick={() => handleOpenAssign(item)}
                          >
                            <UserCog size={13} />
                            {item.MaTruongKhoa ? 'Thay đổi' : 'Phân công'}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Số bộ môn */}
                    <td style={{ textAlign: 'center' }}>
                      <span className={`bomon-badge ${!item.SoBoMon ? 'empty' : ''}`}>
                        <Network size={12} />
                        {item.SoBoMon || 0} bộ môn
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td>
                      <div className="table-actions-group" style={{ justifyContent: 'center' }}>
                        {hasPermission('Khoa', 'CanUpdate') && (
                          <button
                            className="action-btn edit"
                            title="Sửa tên khoa"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {hasPermission('Khoa', 'CanDelete') && (
                          <button
                            className="action-btn delete"
                            title="Xóa khoa"
                            onClick={() => handleOpenDelete(item)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════ MODAL: Thêm / Sửa Khoa ══════════ */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'create' ? 'Thêm Khoa Mới' : 'Cập Nhật Thông Tin Khoa'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {formSuccess && (
              <div className="alert-banner success">
                <CheckCircle2 size={18} />
                <span>{formSuccess}</span>
              </div>
            )}
            {formError && (
              <div className="alert-banner error">
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubmit}>
              {/* Mã Khoa */}
              <div className="modal-form-group">
                <label className="modal-label">
                  Mã Khoa <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Ví dụ: CNTT, KTDT, KHCB..."
                  value={formData.maKhoa}
                  onChange={(e) => setFormData({ ...formData, maKhoa: e.target.value })}
                  disabled={modalMode === 'edit'}
                  style={modalMode === 'edit' ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : {}}
                  required
                />
                {modalMode === 'create' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)', marginTop: '4px', display: 'block' }}>
                    Mã khoa là duy nhất, sẽ được tự động viết hoa và không thể thay đổi sau khi tạo.
                  </span>
                )}
              </div>

              {/* Tên Khoa */}
              <div className="modal-form-group">
                <label className="modal-label">
                  Tên Khoa <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Ví dụ: Khoa Công nghệ Thông tin"
                  value={formData.tenKhoa}
                  onChange={(e) => setFormData({ ...formData, tenKhoa: e.target.value })}
                  required
                />
              </div>

              {modalMode === 'create' && (
                <div className="alert-banner" style={{
                  background: '#f0fdf4', borderColor: '#86efac',
                  color: '#166534', marginBottom: '8px', fontSize: '0.82rem'
                }}>
                  <CheckCircle2 size={15} />
                  <span>
                    Trưởng khoa sẽ được phân công sau khi đã có bộ môn và giảng viên trực thuộc.
                  </span>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="btn-save" disabled={formLoading}>
                  {formLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={16} className="animate-spin" /> Đang lưu...
                    </span>
                  ) : (
                    modalMode === 'create' ? 'Tạo Khoa' : 'Lưu Thay Đổi'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: Xóa Khoa ══════════ */}
      {isDeleteModalOpen && deletingKhoa && (
        <div className="modal-overlay">
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper">
              <ShieldAlert size={32} />
            </div>

            <h3 className="delete-modal-title">Xác Nhận Xóa Khoa</h3>
            <p className="delete-modal-desc">
              Bạn có chắc muốn xóa khoa{' '}
              <b style={{ color: 'var(--admin-text-main)' }}>
                {deletingKhoa.TenKhoa} ({deletingKhoa.MaKhoa})
              </b>
              {' '}không?
            </p>

            {deletingKhoa.SoBoMon > 0 && (
              <div className="alert-banner warning" style={{ textAlign: 'left', marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <span>
                  Cảnh báo: Khoa này đang chứa{' '}
                  <b>{deletingKhoa.SoBoMon} bộ môn</b> trực thuộc. Hệ thống sẽ không cho phép xóa.
                </span>
              </div>
            )}

            {deleteError && (
              <div className="alert-banner error" style={{ textAlign: 'left', marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-cancel"
                disabled={deleteLoading}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn-delete-confirm"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" /> Đang xóa...
                  </span>
                ) : (
                  'Xóa Khoa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: Phân công Trưởng Khoa ══════════ */}
      {isAssignModalOpen && assigningKhoa && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                <UserCog size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Phân Công Trưởng Khoa
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {assignSuccess && (
              <div className="alert-banner success">
                <CheckCircle2 size={18} />
                <span>{assignSuccess}</span>
              </div>
            )}
            {assignError && (
              <div className="alert-banner error">
                <AlertCircle size={18} />
                <span>{assignError}</span>
              </div>
            )}

            <p className="truongkhoa-modal-desc">
              Khoa: <b>{assigningKhoa.TenKhoa}</b> ({assigningKhoa.MaKhoa})
              <br />
              Trưởng khoa hiện tại:{' '}
              <b>{assigningKhoa.TenTruongKhoa || 'Chưa phân công'}</b>
            </p>

            <div className="modal-form-group">
              <label className="modal-label">Chọn Trưởng Khoa</label>
              {giangVienLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0', color: 'var(--admin-text-sub)', fontSize: '0.88rem' }}>
                  <Loader2 size={16} className="animate-spin" />
                  Đang tải danh sách giảng viên...
                </div>
              ) : (
                <div className="truongkhoa-select-wrap">
                  <select
                    className="modal-input"
                    value={selectedGV}
                    onChange={(e) => setSelectedGV(e.target.value)}
                  >
                    <option value="">— Bãi nhiệm (không phân công) —</option>
                    {giangVienList.map(gv => (
                      <option key={gv.MaGiangVien} value={gv.MaGiangVien}>
                        {gv.HoTen} ({gv.MaGiangVien}) — {gv.TenBoMon}
                      </option>
                    ))}
                  </select>
                  {giangVienList.length === 0 && !giangVienLoading && (
                    <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '4px' }}>
                      Khoa này chưa có giảng viên Active nào. Hãy thêm bộ môn và giảng viên trước.
                    </span>
                  )}
                  {selectedGV === '' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
                      Chọn "Bãi nhiệm" để xóa phân công hiện tại.
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsAssignModalOpen(false)} className="btn-cancel">
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                className="btn-save"
                disabled={assignLoading || giangVienLoading}
              >
                {assignLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" /> Đang lưu...
                  </span>
                ) : (
                  selectedGV ? 'Xác Nhận Phân Công' : 'Xác Nhận Bãi Nhiệm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
