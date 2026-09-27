import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  BookOpen, BookMarked, Plus, Search, X, RefreshCw,
  AlertCircle, Loader2, Edit2, Trash2, ShieldAlert, CheckCircle2,
  ArrowLeft, Network, CalendarDays, Users
} from 'lucide-react';
import {
  apiGetMonHocList,
  apiGetMonHocChiTiet,
  apiCreateMonHoc,
  apiUpdateMonHoc,
  apiDeleteMonHoc,
  apiGetBoMonList
} from '../../../../utils/api';
import './MonHocManagement.css';

export default function MonHocManagement() {
  const { hasPermission } = useAuth();

  // ── View ──
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Danh sách môn học ──
  const [mhList, setMhList] = useState([]);
  const [mhLoading, setMhLoading] = useState(false);
  const [mhError, setMhError] = useState('');

  // ── Danh sách bộ môn (dropdown) ──
  const [boMonList, setBoMonList] = useState([]);

  // ── Bộ lọc ──
  const [filterBoMon, setFilterBoMon] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Modal Thêm / Sửa ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({
    maMonHoc: '', tenMonHoc: '', soTinChi: '', maBoMon: '', loaiMonHoc: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // ── Modal Xóa ──
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMH, setDeletingMH] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ─────────────────────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────────────────────
  const fetchMhList = useCallback(async () => {
    setMhLoading(true);
    setMhError('');
    try {
      const data = await apiGetMonHocList({ maBoMon: filterBoMon, search: searchQuery });
      setMhList(data || []);
    } catch (err) {
      setMhError(err.message || 'Không thể tải danh sách môn học.');
    } finally {
      setMhLoading(false);
    }
  }, [filterBoMon, searchQuery]);

  const fetchBoMonList = async () => {
    try {
      const data = await apiGetBoMonList();
      setBoMonList(data || []);
    } catch {
      setBoMonList([]);
    }
  };

  useEffect(() => {
    fetchMhList();
    fetchBoMonList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchMhList(), 300);
    return () => clearTimeout(timer);
  }, [filterBoMon, searchQuery]);

  // ─────────────────────────────────────────────────────────────
  // DETAIL VIEW
  // ─────────────────────────────────────────────────────────────
  const handleViewDetail = async (item) => {
    setDetailLoading(true);
    setView('detail');
    try {
      const data = await apiGetMonHocChiTiet(item.MaMonHoc);
      setDetailData(data);
    } catch {
      setDetailData({ monHoc: item, lopHocPhanList: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setDetailData(null);
  };

  // ─────────────────────────────────────────────────────────────
  // MODAL THÊM / SỬA
  // ─────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      maMonHoc: '', tenMonHoc: '',
      soTinChi: '', maBoMon: filterBoMon || '', loaiMonHoc: ''
    });
    setFormError(''); setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setFormData({
      maMonHoc: item.MaMonHoc,
      tenMonHoc: item.TenMonHoc,
      soTinChi: item.SoTinChi !== null && item.SoTinChi !== undefined ? String(item.SoTinChi) : '',
      maBoMon: item.MaBoMon || '',
      loaiMonHoc: item.LoaiMonHoc || ''
    });
    setFormError(''); setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');

    if (modalMode === 'create' && !formData.maMonHoc.trim()) {
      setFormError('Vui lòng nhập Mã môn học.'); return;
    }
    if (!formData.tenMonHoc.trim()) {
      setFormError('Vui lòng nhập Tên môn học.'); return;
    }
    if (!formData.maBoMon) {
      setFormError('Vui lòng chọn Bộ môn quản lý.'); return;
    }

    setFormLoading(true);
    try {
      if (modalMode === 'create') {
        await apiCreateMonHoc(formData);
        setFormSuccess('Thêm môn học mới thành công!');
      } else {
        await apiUpdateMonHoc(formData.maMonHoc, {
          tenMonHoc: formData.tenMonHoc,
          soTinChi: formData.soTinChi,
          maBoMon: formData.maBoMon,
          loaiMonHoc: formData.loaiMonHoc
        });
        setFormSuccess('Cập nhật môn học thành công!');
      }
      await fetchMhList();
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
    setDeletingMH(item);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMH) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await apiDeleteMonHoc(deletingMH.MaMonHoc);
      await fetchMhList();
      setIsDeleteModalOpen(false);
      setDeletingMH(null);
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa môn học.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Stats ──
  const totalTC = mhList.reduce((s, m) => s + (m.SoTinChi || 0), 0);
  const coBoMon = mhList.filter(m => m.MaBoMon).length;
  const coLopHP = mhList.filter(m => m.SoLopHocPhan > 0).length;

  // ════════════════════════════════════════════════
  // RENDER — Detail View
  // ════════════════════════════════════════════════
  if (view === 'detail') {
    const { monHoc, lopHocPhanList = [] } = detailData || {};
    return (
      <div className="mh-management-container">
        <div className="admin-card" style={{ padding: 0 }}>
          {/* Header */}
          <div className="mh-detail-header">
            <button className="mh-detail-back-btn" onClick={handleBackToList}>
              <ArrowLeft size={16} /> Quay lại
            </button>
            <div style={{ flex: 1 }}>
              {detailLoading ? (
                <div className="mh-detail-title">Đang tải...</div>
              ) : (
                <>
                  <div className="mh-detail-title">
                    {monHoc?.TenMonHoc}
                    <span style={{ marginLeft: 8, fontSize: '0.85rem', fontWeight: 400, color: 'var(--admin-text-sub)' }}>
                      ({monHoc?.MaMonHoc})
                    </span>
                  </div>
                  <div className="mh-detail-subtitle">
                    <span className="mh-bomon-badge">
                      <Network size={11} /> {monHoc?.TenBoMon || 'Chưa phân bộ môn'}
                    </span>
                    {monHoc?.SoTinChi != null && (
                      <span className="mh-tc-badge">{monHoc.SoTinChi} tín chỉ</span>
                    )}
                    {monHoc?.LoaiMonHoc && (
                      <span className="mh-loai-badge">{monHoc.LoaiMonHoc}</span>
                    )}
                    <span style={{ color: 'var(--admin-text-sub)', fontSize: '0.82rem' }}>
                      {lopHocPhanList.length} lớp học phần
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Table LopHocPhan */}
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
                    <th style={{ width: '160px' }}>Mã lớp HP</th>
                    <th>Tên lớp / Môn học</th>
                    <th style={{ width: '140px' }}>Học kỳ</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Loại</th>
                    <th style={{ width: '160px' }}>Giảng viên</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Sĩ số</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Trạng thái PC</th>
                  </tr>
                </thead>
                <tbody>
                  {lopHocPhanList.length === 0 ? (
                    <tr><td colSpan="7" className="table-empty-cell">Chưa có lớp học phần nào được mở cho môn này.</td></tr>
                  ) : (
                    lopHocPhanList.map(lhp => (
                      <tr key={lhp.MaLopHocPhan}>
                        <td>
                          <span className="role-badge primary" style={{ fontWeight: 600 }}>
                            {lhp.MaLopHocPhan}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--admin-text-main)' }}>
                            {lhp.TenLopHocPhan || lhp.MaLopHocPhan}
                          </div>
                          {lhp.KhoaHoc && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-sub)' }}>Khoá {lhp.KhoaHoc}</div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.84rem', color: 'var(--admin-text-sub)' }}>
                          {lhp.TenHocKy || lhp.MaHocKy}
                          {lhp.NamHoc && <div style={{ fontSize: '0.76rem' }}>{lhp.NamHoc}</div>}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="role-badge" style={{ fontSize: '0.75rem' }}>{lhp.LoaiHoc}</span>
                        </td>
                        <td style={{ fontSize: '0.84rem', color: 'var(--admin-text-main)' }}>
                          {lhp.TenGiangVien || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa phân công</span>}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '0.84rem' }}>
                          {lhp.SiSoDangKy != null ? lhp.SiSoDangKy : '—'}
                          {lhp.SiSoDuKien != null && (
                            <span style={{ color: 'var(--admin-text-sub)' }}>/{lhp.SiSoDuKien}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`status-badge ${lhp.TrangThaiPhanCong === 'Assigned' ? 'active' : ''}`}
                            style={{ fontSize: '0.74rem' }}
                          >
                            {lhp.TrangThaiPhanCong}
                          </span>
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
    <div className="mh-management-container">

      {/* Page Header */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Môn Học</h2>
          <p className="page-subtitle">Danh sách môn học, số tín chỉ và lớp học phần đang mở</p>
        </div>
        {hasPermission('MonHoc', 'CanCreate') && (
          <button className="btn-primary-add" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Thêm Môn học</span>
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{mhList.length}</div>
            <div className="admin-stat-text">Tổng môn học</div>
          </div>
        </div>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#ecfdf5', color: '#059669' }}>
            <BookMarked size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{totalTC}</div>
            <div className="admin-stat-text">Tổng tín chỉ</div>
          </div>
        </div>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Network size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{coBoMon}</div>
            <div className="admin-stat-text">Có bộ môn quản lý</div>
          </div>
        </div>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{coLopHP}</div>
            <div className="admin-stat-text">Đang có lớp học phần</div>
          </div>
        </div>
      </div>

      {/* Data Card */}
      <div className="admin-card">

        {/* Filter + Search */}
        <div className="mh-filter-bar">
          <select
            className="mh-filter-select"
            value={filterBoMon}
            onChange={e => setFilterBoMon(e.target.value)}
          >
            <option value="">— Tất cả Bộ môn —</option>
            {boMonList.map(bm => (
              <option key={bm.MaBoMon} value={bm.MaBoMon}>{bm.TenBoMon} ({bm.MaBoMon})</option>
            ))}
          </select>

          <div className="search-box" style={{ flex: 1, minWidth: '180px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm theo mã MH, tên môn học..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}><X size={14} /></button>
            )}
          </div>

          <button className="btn-refresh" title="Tải lại" onClick={fetchMhList}>
            <RefreshCw size={16} className={mhLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Error Banner */}
        {mhError && (
          <div className="alert-banner error" style={{ margin: '0 20px 16px' }}>
            <AlertCircle size={18} /><span>{mhError}</span>
          </div>
        )}

        {/* Card List */}
        {mhLoading ? (
          <div className="table-loading-cell" style={{ padding: '40px 0' }}>
            <Loader2 size={24} className="animate-spin" />
            <span>Đang tải danh sách môn học...</span>
          </div>
        ) : mhList.length === 0 ? (
          <div className="table-empty-cell" style={{ padding: '40px 0' }}>
            {searchQuery || filterBoMon
              ? 'Không tìm thấy môn học nào phù hợp.'
              : 'Chưa có môn học nào trong hệ thống.'}
          </div>
        ) : (
          <div className="mh-card-list">
            {mhList.map(item => (
              <div key={item.MaMonHoc} className="mh-card-item">

                {/* Header: Tên + badges + actions */}
                <div className="mh-card-header">
                  <div className="mh-card-header-left">
                    <span className="mh-card-name">{item.TenMonHoc}</span>
                    <div className="mh-card-badges">
                      {item.SoTinChi != null ? (
                        <span className="mh-tc-badge">{item.SoTinChi} TC</span>
                      ) : (
                        <span className="mh-tc-badge empty">Chưa có TC</span>
                      )}
                      {item.LoaiMonHoc && (
                        <span className="mh-loai-badge">{item.LoaiMonHoc}</span>
                      )}
                      {item.SoLopHocPhan > 0 && (
                        <span className="role-badge" style={{ fontSize: '0.73rem' }}>
                          {item.SoLopHocPhan} lớp HP
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mh-card-actions" onClick={e => e.stopPropagation()}>
                    {hasPermission('MonHoc', 'CanUpdate') && (
                      <button className="action-btn edit" title="Sửa thông tin" onClick={() => handleOpenEdit(item)}>
                        <Edit2 size={15} />
                      </button>
                    )}
                    {hasPermission('MonHoc', 'CanDelete') && (
                      <button className="action-btn delete" title="Xóa môn học" onClick={() => handleOpenDelete(item)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Fields dọc — click xem chi tiết */}
                <div className="mh-card-fields" onClick={() => handleViewDetail(item)} title="Xem lớp học phần">
                  <div className="mh-card-field">
                    <span className="mh-field-label">Mã MH</span>
                    <span className="mh-field-value">{item.MaMonHoc}</span>
                  </div>
                  <div className="mh-card-field">
                    <span className="mh-field-label">Tên MH</span>
                    <span className="mh-field-value">{item.TenMonHoc}</span>
                  </div>
                  <div className="mh-card-field">
                    <span className="mh-field-label">Số TC</span>
                    <span className={`mh-field-value ${item.SoTinChi == null ? 'muted' : ''}`}>
                      {item.SoTinChi != null ? `${item.SoTinChi} tín chỉ` : 'Chưa xác định'}
                    </span>
                  </div>
                  <div className="mh-card-field">
                    <span className="mh-field-label">Bộ môn</span>
                    <span className={`mh-bomon-badge ${!item.MaBoMon ? 'empty' : ''}`}>
                      <Network size={10} />
                      {item.TenBoMon || 'Chưa phân công'}
                    </span>
                  </div>
                  <div className="mh-card-field">
                    <span className="mh-field-label">Loại MH</span>
                    <span className="mh-field-value muted">{item.LoaiMonHoc || '—'}</span>
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
                {modalMode === 'create' ? 'Thêm Môn Học Mới' : 'Cập Nhật Thông Tin Môn Học'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn"><X size={20} /></button>
            </div>

            {formSuccess && <div className="alert-banner success"><CheckCircle2 size={18} /><span>{formSuccess}</span></div>}
            {formError && <div className="alert-banner error"><AlertCircle size={18} /><span>{formError}</span></div>}

            <form onSubmit={handleSaveSubmit}>
              {/* Mã môn học */}
              <div className="modal-form-group">
                <label className="modal-label">Mã Môn Học <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text" className="modal-input"
                  placeholder="VD: CNPM01, GT101..."
                  value={formData.maMonHoc}
                  onChange={e => setFormData({ ...formData, maMonHoc: e.target.value })}
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

              {/* Tên môn học */}
              <div className="modal-form-group">
                <label className="modal-label">Tên Môn Học <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text" className="modal-input"
                  placeholder="VD: Công nghệ phần mềm"
                  value={formData.tenMonHoc}
                  onChange={e => setFormData({ ...formData, tenMonHoc: e.target.value })}
                  required
                />
              </div>

              {/* Bộ môn (bắt buộc) */}
              <div className="modal-form-group">
                <label className="modal-label">Bộ Môn Quản Lý <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="modal-input"
                  value={formData.maBoMon}
                  onChange={e => setFormData({ ...formData, maBoMon: e.target.value })}
                  required
                >
                  <option value="">— Chọn bộ môn —</option>
                  {boMonList.map(bm => (
                    <option key={bm.MaBoMon} value={bm.MaBoMon}>{bm.TenBoMon} ({bm.MaBoMon})</option>
                  ))}
                </select>
              </div>

              {/* Số tín chỉ */}
              <div className="modal-form-group">
                <label className="modal-label">Số Tín Chỉ <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="number" className="modal-input"
                  placeholder="VD: 3"
                  min={1}
                  value={formData.soTinChi}
                  onChange={e => setFormData({ ...formData, soTinChi: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)', marginTop: '4px', display: 'block' }}>
                  Phải là số nguyên dương. Ảnh hưởng đến thời lượng xếp lịch.
                </span>
              </div>

              {/* Loại môn học */}
              <div className="modal-form-group">
                <label className="modal-label">Loại Môn Học</label>
                <input
                  type="text" className="modal-input"
                  placeholder="VD: Regular, Thực hành... (mặc định: Regular)"
                  value={formData.loaiMonHoc}
                  onChange={e => setFormData({ ...formData, loaiMonHoc: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)', marginTop: '4px', display: 'block' }}>
                  Để trống sẽ tự động gán "Regular".
                </span>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">Hủy</button>
                <button type="submit" className="btn-save" disabled={formLoading}>
                  {formLoading
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Loader2 size={16} className="animate-spin" /> Đang lưu...</span>
                    : modalMode === 'create' ? 'Thêm Môn Học' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: Xóa ══════════ */}
      {isDeleteModalOpen && deletingMH && (
        <div className="modal-overlay">
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper"><ShieldAlert size={32} /></div>
            <h3 className="delete-modal-title">Xác Nhận Xóa Môn Học</h3>
            <p className="delete-modal-desc">
              Bạn có chắc muốn xóa môn học{' '}
              <b style={{ color: 'var(--admin-text-main)' }}>{deletingMH.TenMonHoc} ({deletingMH.MaMonHoc})</b> không?
            </p>
            {deletingMH.SoLopHocPhan > 0 && (
              <div className="alert-banner error" style={{ margin: '0 0 12px', fontSize: '0.84rem' }}>
                <AlertCircle size={16} />
                <span>Môn học này đang có <b>{deletingMH.SoLopHocPhan}</b> lớp học phần. Không thể xóa.</span>
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
              {deletingMH.SoLopHocPhan === 0 && (
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
