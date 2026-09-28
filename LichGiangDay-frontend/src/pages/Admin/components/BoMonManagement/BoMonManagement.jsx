import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  Network, School, UserCheck, BookOpen, Plus, Search, X, RefreshCw,
  AlertCircle, Loader2, Edit2, Trash2, ShieldAlert, CheckCircle2,
  ArrowLeft, Users, GraduationCap
} from 'lucide-react';
import {
  apiGetBoMonList,
  apiCreateBoMon,
  apiUpdateBoMon,
  apiDeleteBoMon,
  apiGetBoMonChiTiet,
  apiGetKhoaList
} from '../../../../utils/api';
import './BoMonManagement.css';

export default function BoMonManagement() {
  const { hasPermission } = useAuth();

  // ─── View: 'list' | 'detail' ───
  const [view, setView] = useState('list');
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('giangvien'); // 'giangvien' | 'monhoc'

  // ─── Danh sách Bộ môn ───
  const [boMonList, setBoMonList] = useState([]);
  const [boMonLoading, setBoMonLoading] = useState(false);
  const [boMonError, setBoMonError] = useState('');

  // ─── Danh sách Khoa (cho dropdown lọc) ───
  const [khoaList, setKhoaList] = useState([]);
  const [selectedKhoa, setSelectedKhoa] = useState(''); // '' = tất cả

  // ─── Search ───
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Modal Thêm / Sửa ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState({ maBoMon: '', tenBoMon: '', maKhoa: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formWarn, setFormWarn] = useState('');

  // ─── Modal Xóa ───
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingBoMon, setDeletingBoMon] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ─── Fetch danh sách Bộ môn (lọc theo khoa nếu có) ───
  const fetchBoMonList = async (maKhoa = '') => {
    setBoMonLoading(true);
    setBoMonError('');
    try {
      const data = await apiGetBoMonList(maKhoa);
      setBoMonList(data || []);
    } catch (err) {
      setBoMonError(err.message || 'Không thể tải danh sách bộ môn.');
    } finally {
      setBoMonLoading(false);
    }
  };

  // ─── Fetch danh sách Khoa cho dropdown ───
  const fetchKhoaList = async () => {
    try {
      const data = await apiGetKhoaList();
      setKhoaList(data || []);
    } catch {
      setKhoaList([]);
    }
  };

  useEffect(() => {
    fetchBoMonList();
    fetchKhoaList();
  }, []);

  // ─── Khi đổi dropdown Khoa → lọc tức thì ───
  const handleKhoaChange = (maKhoa) => {
    setSelectedKhoa(maKhoa);
    fetchBoMonList(maKhoa);
  };

  // ─── Tìm kiếm client-side trên tên / mã ───
  const filteredList = boMonList.filter(bm =>
    bm.MaBoMon?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bm.TenBoMon?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Xem chi tiết ───
  const handleViewDetail = async (item) => {
    setDetailLoading(true);
    setView('detail');
    setDetailTab('giangvien');
    try {
      const data = await apiGetBoMonChiTiet(item.MaBoMon);
      setDetailData(data);
    } catch {
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setDetailData(null);
  };

  // ─── Modal Thêm ───
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({ maBoMon: '', tenBoMon: '', maKhoa: selectedKhoa || '' });
    setFormError('');
    setFormSuccess('');
    setFormWarn('');
    setIsModalOpen(true);
  };

  // ─── Modal Sửa ───
  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setFormData({ maBoMon: item.MaBoMon, tenBoMon: item.TenBoMon, maKhoa: item.MaKhoa });
    setFormError('');
    setFormSuccess('');
    setFormWarn('');
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormWarn('');

    if (modalMode === 'create' && !formData.maBoMon.trim()) {
      setFormError('Vui lòng nhập Mã Bộ môn.');
      return;
    }
    if (!formData.tenBoMon.trim()) {
      setFormError('Vui lòng nhập Tên Bộ môn.');
      return;
    }
    if (!formData.maKhoa) {
      setFormError('Vui lòng chọn Khoa trực thuộc.');
      return;
    }

    setFormLoading(true);
    try {
      if (modalMode === 'create') {
        await apiCreateBoMon(formData);
        setFormSuccess('Tạo bộ môn mới thành công!');
      } else {
        const result = await apiUpdateBoMon(formData.maBoMon, {
          tenBoMon: formData.tenBoMon,
          maKhoa: formData.maKhoa
        });
        setFormSuccess('Cập nhật bộ môn thành công!');
        if (result?.warnTruongBoMon) {
          setFormWarn(
            'Lưu ý: Bộ môn đang có Trưởng bộ môn được gán. ' +
            'Việc chuyển sang Khoa khác có thể ảnh hưởng đến tính hợp lý của phân công hiện tại.'
          );
        }
      }
      await fetchBoMonList(selectedKhoa);
      if (!formWarn) {
        setTimeout(() => {
          setIsModalOpen(false);
          setFormSuccess('');
        }, 1000);
      }
    } catch (err) {
      setFormError(err.message || 'Thao tác thất bại.');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Modal Xóa ───
  const handleOpenDelete = (item) => {
    setDeletingBoMon(item);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBoMon) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await apiDeleteBoMon(deletingBoMon.MaBoMon);
      await fetchBoMonList(selectedKhoa);
      setIsDeleteModalOpen(false);
      setDeletingBoMon(null);
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa bộ môn.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ════════════════════════════════════════════════
  // RENDER — Detail View
  // ════════════════════════════════════════════════
  if (view === 'detail') {
    const { boMon, giangVienList = [], monHocList = [] } = detailData || {};
    return (
      <div className="bomon-management-container">
        <div className="admin-card" style={{ padding: 0 }}>
          <div className="bomon-detail-header">
            <button className="bomon-detail-back-btn" onClick={handleBackToList}>
              <ArrowLeft size={16} />
              Quay lại
            </button>
            <div>
              {detailLoading ? (
                <div className="bomon-detail-title">Đang tải...</div>
              ) : (
                <>
                  <div className="bomon-detail-title">
                    {boMon?.TenBoMon} ({boMon?.MaBoMon})
                  </div>
                  <div className="bomon-detail-subtitle">
                    Khoa: {boMon?.TenKhoa}
                    {' · '}
                    Trưởng bộ môn: {boMon?.TenTruongBoMon || 'Chưa phân công'}
                    {' · '}
                    {giangVienList.length} giảng viên · {monHocList.length} môn học
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="bomon-tab-bar">
            <button
              className={`bomon-tab-btn ${detailTab === 'giangvien' ? 'active' : ''}`}
              onClick={() => setDetailTab('giangvien')}
            >
              <Users size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Giảng viên ({giangVienList.length})
            </button>
            <button
              className={`bomon-tab-btn ${detailTab === 'monhoc' ? 'active' : ''}`}
              onClick={() => setDetailTab('monhoc')}
            >
              <BookOpen size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Môn học ({monHocList.length})
            </button>
          </div>

          {detailLoading ? (
            <div className="table-loading-cell" style={{ padding: '40px 20px' }}>
              <Loader2 size={24} className="animate-spin" />
              <span>Đang tải chi tiết...</span>
            </div>
          ) : (
            <div className="table-responsive">
              {/* Tab: Giảng viên */}
              {detailTab === 'giangvien' && (
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '140px' }}>Mã GV</th>
                      <th>Họ tên</th>
                      <th style={{ width: '200px' }}>Email</th>
                      <th style={{ width: '150px' }}>Số điện thoại</th>
                      <th style={{ width: '110px', textAlign: 'center' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {giangVienList.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="table-empty-cell">
                          Bộ môn này chưa có giảng viên nào.
                        </td>
                      </tr>
                    ) : (
                      giangVienList.map(gv => (
                        <tr key={gv.MaGiangVien}>
                          <td>
                            <span className="role-badge primary" style={{ fontWeight: 600 }}>
                              {gv.MaGiangVien}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                              {gv.HoTen}
                            </div>
                          </td>
                          <td style={{ color: 'var(--admin-text-sub)', fontSize: '0.86rem' }}>
                            {gv.Email || '—'}
                          </td>
                          <td style={{ color: 'var(--admin-text-sub)', fontSize: '0.86rem' }}>
                            {gv.SoDienThoai || '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`status-badge ${gv.TrangThai === 'Active' ? 'active' : 'inactive'}`}>
                              {gv.TrangThai}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tab: Môn học */}
              {detailTab === 'monhoc' && (
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '140px' }}>Mã môn</th>
                      <th>Tên môn học</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>Số tín chỉ</th>
                      <th style={{ width: '150px', textAlign: 'center' }}>Loại môn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monHocList.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="table-empty-cell">
                          Bộ môn này chưa có môn học nào.
                        </td>
                      </tr>
                    ) : (
                      monHocList.map(mh => (
                        <tr key={mh.MaMonHoc}>
                          <td>
                            <span className="role-badge primary" style={{ fontWeight: 600 }}>
                              {mh.MaMonHoc}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                              {mh.TenMonHoc}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="bomon-mh-badge">
                              {mh.SoTinChi} TC
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {mh.LoaiMonHoc ? (
                              <span className="role-badge">{mh.LoaiMonHoc}</span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
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
    <div className="bomon-management-container">

      {/* Page Header Toolbar */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Bộ Môn</h2>
          <p className="page-subtitle">Danh sách bộ môn, trưởng bộ môn và các giảng viên, môn học trực thuộc</p>
        </div>
        {hasPermission('BoMon', 'CanCreate') && (
          <button className="btn-primary-add" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Thêm Bộ môn</span>
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Network size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{boMonList.length}</div>
            <div className="admin-stat-text">
              {selectedKhoa ? 'Bộ môn trong khoa' : 'Tổng số bộ môn'}
            </div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#ecfdf5', color: '#059669' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div className="admin-stat-number">
              {boMonList.filter(bm => bm.MaTruongBoMon).length}
            </div>
            <div className="admin-stat-text">Đã có trưởng bộ môn</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#fdf4ff', color: '#9333ea' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="admin-stat-number">
              {boMonList.reduce((acc, bm) => acc + (Number(bm.SoGiangVien) || 0), 0)}
            </div>
            <div className="admin-stat-text">Tổng giảng viên</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="admin-stat-number">
              {boMonList.reduce((acc, bm) => acc + (Number(bm.SoMonHoc) || 0), 0)}
            </div>
            <div className="admin-stat-text">Tổng môn học</div>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="admin-card">
        {/* Filter + Search Toolbar */}
        <div className="bomon-filter-bar">
          {/* Dropdown lọc theo Khoa */}
          <select
            className="bomon-khoa-select"
            value={selectedKhoa}
            onChange={(e) => handleKhoaChange(e.target.value)}
          >
            <option value="">— Tất cả các Khoa —</option>
            {khoaList.map(k => (
              <option key={k.MaKhoa} value={k.MaKhoa}>
                {k.TenKhoa} ({k.MaKhoa})
              </option>
            ))}
          </select>

          {/* Search box */}
          <div className="search-box" style={{ flex: 1, minWidth: '180px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã hoặc tên bộ môn..."
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
            onClick={() => fetchBoMonList(selectedKhoa)}
          >
            <RefreshCw size={16} className={boMonLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Error Banner */}
        {boMonError && (
          <div className="alert-banner error" style={{ margin: '16px 20px 0' }}>
            <AlertCircle size={18} />
            <span>{boMonError}</span>
          </div>
        )}

        {/* Table */}
        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Mã Bộ Môn</th>
                <th>Tên Bộ Môn</th>
                <th style={{ width: '190px' }}>Khoa trực thuộc</th>
                <th style={{ width: '200px' }}>Trưởng Bộ Môn</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Giảng viên</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Môn học</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {boMonLoading ? (
                <tr>
                  <td colSpan="7" className="table-loading-cell">
                    <Loader2 size={24} className="animate-spin" />
                    <span>Đang tải danh sách bộ môn...</span>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty-cell">
                    {searchQuery
                      ? 'Không tìm thấy bộ môn nào phù hợp.'
                      : selectedKhoa
                        ? 'Khoa này chưa có bộ môn nào.'
                        : 'Chưa có bộ môn nào trong hệ thống.'}
                  </td>
                </tr>
              ) : (
                filteredList.map(item => (
                  <tr key={item.MaBoMon}>
                    {/* Mã Bộ Môn — click xem chi tiết */}
                    <td>
                      <span
                        className="role-badge primary"
                        style={{ fontWeight: 600, cursor: 'pointer' }}
                        title="Xem chi tiết giảng viên & môn học"
                        onClick={() => handleViewDetail(item)}
                      >
                        {item.MaBoMon}
                      </span>
                    </td>

                    {/* Tên Bộ Môn */}
                    <td>
                      <div
                        style={{ fontWeight: 600, color: 'var(--admin-text-main)', cursor: 'pointer' }}
                        onClick={() => handleViewDetail(item)}
                        title="Xem chi tiết giảng viên & môn học"
                      >
                        {item.TenBoMon}
                      </div>
                    </td>

                    {/* Khoa trực thuộc */}
                    <td>
                      <span className="khoa-badge-inline">
                        <School size={11} />
                        {item.TenKhoa || item.MaKhoa}
                      </span>
                    </td>

                    {/* Trưởng Bộ Môn — chỉ xem, không chỉnh sửa */}
                    <td>
                      <div className="truongbomon-cell">
                        {item.TenTruongBoMon ? (
                          <span className="truongbomon-name">{item.TenTruongBoMon}</span>
                        ) : (
                          <span className="truongbomon-empty">Chưa phân công</span>
                        )}
                      </div>
                    </td>

                    {/* Số Giảng viên */}
                    <td style={{ textAlign: 'center' }}>
                      <span className={`bomon-gv-badge ${!item.SoGiangVien ? 'empty' : ''}`}>
                        <Users size={11} />
                        {item.SoGiangVien || 0} GV
                      </span>
                    </td>

                    {/* Số Môn học */}
                    <td style={{ textAlign: 'center' }}>
                      <span className={`bomon-mh-badge ${!item.SoMonHoc ? 'empty' : ''}`}>
                        <BookOpen size={11} />
                        {item.SoMonHoc || 0} MH
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td>
                      <div className="table-actions-group" style={{ justifyContent: 'center' }}>
                        {hasPermission('BoMon', 'CanUpdate') && (
                          <button
                            className="action-btn edit"
                            title="Sửa thông tin bộ môn"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {hasPermission('BoMon', 'CanDelete') && (
                          <button
                            className="action-btn delete"
                            title="Xóa bộ môn"
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

      {/* ══════════ MODAL: Thêm / Sửa Bộ Môn ══════════ */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'create' ? 'Thêm Bộ Môn Mới' : 'Cập Nhật Thông Tin Bộ Môn'}
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
            {formWarn && (
              <div className="alert-banner warning">
                <AlertCircle size={18} />
                <span>{formWarn}</span>
              </div>
            )}
            {formError && (
              <div className="alert-banner error">
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubmit}>
              {/* Mã Bộ Môn */}
              <div className="modal-form-group">
                <label className="modal-label">
                  Mã Bộ Môn <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Ví dụ: CNPM, KTPM, HTTT..."
                  value={formData.maBoMon}
                  onChange={(e) => setFormData({ ...formData, maBoMon: e.target.value })}
                  disabled={modalMode === 'edit'}
                  style={modalMode === 'edit'
                    ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }
                    : {}}
                  required
                />
                {modalMode === 'create' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)', marginTop: '4px', display: 'block' }}>
                    Mã bộ môn là duy nhất, sẽ tự động viết hoa và không thể thay đổi sau khi tạo.
                  </span>
                )}
              </div>

              {/* Tên Bộ Môn */}
              <div className="modal-form-group">
                <label className="modal-label">
                  Tên Bộ Môn <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Ví dụ: Bộ môn Công nghệ Phần mềm"
                  value={formData.tenBoMon}
                  onChange={(e) => setFormData({ ...formData, tenBoMon: e.target.value })}
                  required
                />
              </div>

              {/* Khoa trực thuộc */}
              <div className="modal-form-group">
                <label className="modal-label">
                  Khoa trực thuộc <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="modal-input"
                  value={formData.maKhoa}
                  onChange={(e) => setFormData({ ...formData, maKhoa: e.target.value })}
                  required
                >
                  <option value="">— Chọn Khoa —</option>
                  {khoaList.map(k => (
                    <option key={k.MaKhoa} value={k.MaKhoa}>
                      {k.TenKhoa} ({k.MaKhoa})
                    </option>
                  ))}
                </select>
                {modalMode === 'edit' && formData.maKhoa && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)', marginTop: '4px', display: 'block' }}>
                    Thay đổi Khoa sẽ chuyển toàn bộ bộ môn này sang khoa mới.
                  </span>
                )}
              </div>

              {modalMode === 'create' && (
                <div className="alert-banner" style={{
                  background: '#f0fdf4', borderColor: '#86efac',
                  color: '#166534', marginBottom: '8px', fontSize: '0.82rem'
                }}>
                  <CheckCircle2 size={15} />
                  <span>
                    Trưởng bộ môn sẽ được phân công sau khi đã có giảng viên trực thuộc.
                  </span>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    if (formWarn) { setIsModalOpen(false); setFormWarn(''); setFormSuccess(''); }
                    else setIsModalOpen(false);
                  }}
                  className="btn-cancel"
                >
                  {formWarn ? 'Đóng' : 'Hủy'}
                </button>
                {!formWarn && (
                  <button type="submit" className="btn-save" disabled={formLoading}>
                    {formLoading ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Loader2 size={16} className="animate-spin" /> Đang lưu...
                      </span>
                    ) : (
                      modalMode === 'create' ? 'Tạo Bộ Môn' : 'Lưu Thay Đổi'
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: Xóa Bộ Môn ══════════ */}
      {isDeleteModalOpen && deletingBoMon && (
        <div className="modal-overlay">
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper">
              <ShieldAlert size={32} />
            </div>

            <h3 className="delete-modal-title">Xác Nhận Xóa Bộ Môn</h3>
            <p className="delete-modal-desc">
              Bạn có chắc muốn xóa bộ môn{' '}
              <b style={{ color: 'var(--admin-text-main)' }}>
                {deletingBoMon.TenBoMon} ({deletingBoMon.MaBoMon})
              </b>
              {' '}không?
            </p>

            {(deletingBoMon.SoGiangVien > 0 || deletingBoMon.SoMonHoc > 0) && (
              <div className="alert-banner warning" style={{ textAlign: 'left', marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <span>
                  Cảnh báo: Bộ môn này đang có{' '}
                  {deletingBoMon.SoGiangVien > 0 && <b>{deletingBoMon.SoGiangVien} giảng viên</b>}
                  {deletingBoMon.SoGiangVien > 0 && deletingBoMon.SoMonHoc > 0 && ' và '}
                  {deletingBoMon.SoMonHoc > 0 && <b>{deletingBoMon.SoMonHoc} môn học</b>}
                  {' '}trực thuộc. Hệ thống sẽ không cho phép xóa.
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
                  'Xóa Bộ Môn'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
