import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Building, Layers, Plus, Search, X, RefreshCw,
  AlertCircle, Loader2, Edit2, Trash2, CheckCircle2,
  CheckCircle, Wrench, Users
} from 'lucide-react';
import {
  apiGetPhongHocList, apiCreatePhongHoc, apiUpdatePhongHoc,
  apiTogglePhongHocStatus, apiDeletePhongHoc, apiGetToaNhaList
} from '../../../utils/api';

import { groupRoomsByBuildingAndFloor } from './PhongHocManagement/roomParser';
import BuildingSection from './PhongHocManagement/BuildingSection';
import RoomStatusLegend from './PhongHocManagement/RoomStatusLegend';
import './PhongHocManagement/PhongHocManagement.css';

export default function PhongHocManagement() {
  const { hasPermission } = useAuth();

  // Data states
  const [phongHocList, setPhongHocList] = useState([]);
  const [toaNhaList, setToaNhaList] = useState([]);
  const [phongHocLoading, setPhongHocLoading] = useState(false);
  const [phongHocError, setPhongHocError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // View state: 'diagram' (Sơ đồ - Default) | 'table' (Bảng Fallback)
  const [viewMode, setViewMode] = useState('diagram');

  // Filter states
  const [selectedToaNhaFilter, setSelectedToaNhaFilter] = useState('ALL');
  const [selectedLoaiPhongFilter, setSelectedLoaiPhongFilter] = useState('ALL');
  const [selectedTrangThaiFilter, setSelectedTrangThaiFilter] = useState('ALL');

  // Modal Create/Edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState({
    maPhong: '',
    tenPhong: '',
    maToaNha: '',
    sucChua: 50,
    loaiPhong: 'Phòng lý thuyết',
    trangThai: 'Ready'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Modal Delete state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Fetch rooms list
  const fetchPhongHocList = async () => {
    setPhongHocLoading(true);
    setPhongHocError('');
    try {
      const data = await apiGetPhongHocList();
      setPhongHocList(data || []);
    } catch (err) {
      setPhongHocError(err.message || 'Không thể tải danh sách phòng học.');
    } finally {
      setPhongHocLoading(false);
    }
  };

  // Fetch buildings list for dropdown selects
  const fetchToaNhaList = async () => {
    try {
      const data = await apiGetToaNhaList();
      setToaNhaList(data || []);
    } catch (err) {
      console.error('Fetch building list error:', err);
    }
  };

  useEffect(() => {
    fetchPhongHocList();
    fetchToaNhaList();
  }, []);

  // Modal handlers
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData({
      maPhong: '',
      tenPhong: '',
      maToaNha: toaNhaList[0]?.MaToaNha || '',
      sucChua: 50,
      loaiPhong: 'Phòng lý thuyết',
      trangThai: 'Ready'
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setModalMode('edit');
    setFormData({
      maPhong: item.MaPhong,
      tenPhong: item.TenPhong || '',
      maToaNha: item.MaToaNha || '',
      sucChua: item.SucChua || 50,
      loaiPhong: item.LoaiPhong || 'Phòng lý thuyết',
      trangThai: item.TrangThai || 'Ready'
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (modalMode === 'create' && !formData.maPhong.trim()) {
      setFormError('Vui lòng nhập Mã Phòng.');
      return;
    }
    if (!formData.tenPhong.trim()) {
      setFormError('Vui lòng nhập Tên Phòng.');
      return;
    }
    if (!formData.maToaNha) {
      setFormError('Vui lòng chọn Tòa Nhà cho phòng học.');
      return;
    }

    setFormLoading(true);
    try {
      if (modalMode === 'create') {
        await apiCreatePhongHoc(formData);
        setFormSuccess('Tạo phòng học mới thành công!');
      } else {
        await apiUpdatePhongHoc(formData.maPhong, {
          tenPhong: formData.tenPhong,
          maToaNha: formData.maToaNha,
          sucChua: formData.sucChua,
          loaiPhong: formData.loaiPhong,
          trangThai: formData.trangThai
        });
        setFormSuccess('Cập nhật thông tin phòng học thành công!');
      }

      await fetchPhongHocList();

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

  // Quick toggle status
  const handleToggleStatus = async (maPhong) => {
    try {
      await apiTogglePhongHocStatus(maPhong);
      await fetchPhongHocList();
    } catch (err) {
      alert(err.message || 'Không thể đổi trạng thái phòng học.');
    }
  };

  // Delete Handlers
  const handleOpenDeleteModal = (item) => {
    setDeletingRoom(typeof item === 'object' ? item : phongHocList.find(r => r.MaPhong === item));
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRoom) return;
    setDeleteLoading(true);
    setDeleteError('');

    try {
      await apiDeletePhongHoc(deletingRoom.MaPhong);
      await fetchPhongHocList();
      setIsDeleteModalOpen(false);
      setDeletingRoom(null);
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa phòng học.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Compute Statistics & Filter options
  const readyCount = phongHocList.filter(r => r.TrangThai === 'Ready').length;
  const maintenanceCount = phongHocList.filter(r => r.TrangThai === 'Maintenance').length;
  const totalCapacity = phongHocList.reduce((acc, cur) => acc + (Number(cur.SucChua) || 0), 0);

  const loaiPhongOptions = Array.from(new Set(phongHocList.map(r => r.LoaiPhong).filter(Boolean)));

  const filteredList = phongHocList.filter(item => {
    const matchesSearch =
      item.MaPhong?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.TenPhong?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.TenToaNha?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.LoaiPhong?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.CoSo?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesToaNha = selectedToaNhaFilter === 'ALL' || item.MaToaNha === selectedToaNhaFilter;
    const matchesLoaiPhong = selectedLoaiPhongFilter === 'ALL' || item.LoaiPhong === selectedLoaiPhongFilter;
    const matchesTrangThai = selectedTrangThaiFilter === 'ALL' || item.TrangThai === selectedTrangThaiFilter;

    return matchesSearch && matchesToaNha && matchesLoaiPhong && matchesTrangThai;
  });

  // Gom nhóm danh sách phòng học đã lọc cho Giao diện Sơ đồ
  const groupedBuildings = groupRoomsByBuildingAndFloor(filteredList, toaNhaList);

  return (
    <div className="phonghoc-management-container">
      {/* Page Header Toolbar */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Phòng Học</h2>
          <p className="page-subtitle">Sơ đồ tòa nhà, tầng, phòng học, sức chứa và trạng thái vận hành</p>
        </div>
        {hasPermission('PhongHoc', 'CanCreate') && (
          <button className="btn-primary-add" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>Thêm Phòng Học</span>
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Layers size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{phongHocList.length}</div>
            <div className="admin-stat-text">Tổng số phòng học</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{readyCount}</div>
            <div className="admin-stat-text">Phòng sẵn sàng (Ready)</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <Wrench size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{maintenanceCount}</div>
            <div className="admin-stat-text">Phòng bảo trì (Maintenance)</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{totalCapacity}</div>
            <div className="admin-stat-text">Tổng sức chứa (chỗ ngồi)</div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="admin-card">
        {/* Search & Filter Toolbar */}
        <div className="roles-filter-bar" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="search-box" style={{ flex: '1 1 280px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã phòng, tên phòng, tòa nhà, loại phòng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Filter by Building */}
            <select
              className="modal-input"
              style={{ fontSize: '0.85rem', width: 'auto' }}
              value={selectedToaNhaFilter}
              onChange={(e) => setSelectedToaNhaFilter(e.target.value)}
            >
              <option value="ALL">Tất cả tòa nhà ({toaNhaList.length})</option>
              {toaNhaList.map(tn => (
                <option key={tn.MaToaNha} value={tn.MaToaNha}>
                  {tn.TenToaNha} ({tn.MaToaNha})
                </option>
              ))}
            </select>

            {/* Filter by Room Type */}
            <select
              className="modal-input"
              style={{ fontSize: '0.85rem', width: 'auto' }}
              value={selectedLoaiPhongFilter}
              onChange={(e) => setSelectedLoaiPhongFilter(e.target.value)}
            >
              <option value="ALL">Tất cả loại phòng</option>
              {loaiPhongOptions.map(lp => (
                <option key={lp} value={lp}>{lp}</option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              className="modal-input"
              style={{ fontSize: '0.85rem', width: 'auto' }}
              value={selectedTrangThaiFilter}
              onChange={(e) => setSelectedTrangThaiFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Ready">Sẵn sàng (Ready)</option>
              <option value="Maintenance">Bảo trì (Maintenance)</option>
            </select>

            <button className="btn-refresh" title="Tải lại danh sách" onClick={fetchPhongHocList}>
              <RefreshCw size={16} className={phongHocLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Legend Toolbar & View Toggle */}
        <RoomStatusLegend viewMode={viewMode} setViewMode={setViewMode} />

        {/* Alert Errors */}
        {phongHocError && (
          <div className="alert-banner error" style={{ margin: '16px 20px 0' }}>
            <AlertCircle size={18} />
            <span>{phongHocError}</span>
          </div>
        )}

        {/* BODY DISPLAY: Diagram View (Default) vs Table View (Fallback) */}
        {phongHocLoading ? (
          <div className="diagram-loading-container">
            <Loader2 size={32} className="animate-spin" style={{ color: '#2563eb' }} />
            <span>Đang tải sơ đồ phòng học...</span>
          </div>
        ) : viewMode === 'diagram' ? (
          <div className="diagram-view-container">
            {groupedBuildings.length === 0 ? (
              <div className="diagram-empty-container">
                <p>
                  {searchQuery || selectedToaNhaFilter !== 'ALL' || selectedTrangThaiFilter !== 'ALL'
                    ? 'Không tìm thấy phòng học nào phù hợp với điều kiện lọc.'
                    : 'Chưa có dữ liệu phòng học trong hệ thống.'}
                </p>
              </div>
            ) : (
              groupedBuildings.map((building) => (
                <BuildingSection
                  key={building.buildingCode}
                  building={building}
                  onEditRoom={handleOpenEditModal}
                  onDeleteRoom={handleOpenDeleteModal}
                  onToggleStatus={handleToggleStatus}
                />
              ))
            )}
          </div>
        ) : (
          /* Fallback Table View */
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Mã Phòng</th>
                  <th style={{ width: '180px' }}>Tên Phòng Học</th>
                  <th style={{ width: '200px' }}>Tòa Nhà / Cơ Sở</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Sức Chứa</th>
                  <th style={{ width: '180px' }}>Loại Phòng</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="table-empty-cell">
                      {searchQuery || selectedToaNhaFilter !== 'ALL' || selectedTrangThaiFilter !== 'ALL'
                        ? 'Không tìm thấy phòng học nào phù hợp với bộ lọc.'
                        : 'Chưa có phòng học nào trong hệ thống.'}
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.MaPhong}>
                      <td>
                        <span className="role-badge primary" style={{ fontWeight: 600 }}>
                          {item.MaPhong}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                          {item.TenPhong}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Building size={14} style={{ color: '#2563eb' }} />
                          <span>{item.TenToaNha || item.MaToaNha}</span>
                        </div>
                        {item.CoSo && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-sub)', marginTop: '2px' }}>
                            📍 {item.CoSo}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="user-count-tag" style={{ background: '#f5f3ff', color: '#7c3aed', fontWeight: 600 }}>
                          {item.SucChua} ghế
                        </span>
                      </td>
                      <td>
                        <span className="status-badge active" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                          {item.LoaiPhong || 'Phòng lý thuyết'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {hasPermission('PhongHoc', 'CanUpdate') ? (
                          <button
                            onClick={() => handleToggleStatus(item.MaPhong)}
                            className={`status-badge ${item.TrangThai === 'Ready' ? 'active' : 'locked'}`}
                            style={{ cursor: 'pointer', border: 'none', padding: '6px 12px' }}
                            title="Nhấn để đổi trạng thái nhanh"
                          >
                            {item.TrangThai === 'Ready' ? (
                              <>
                                <CheckCircle size={12} /> Sẵn sàng
                              </>
                            ) : (
                              <>
                                <Wrench size={12} /> Bảo trì
                              </>
                            )}
                          </button>
                        ) : (
                          <span className={`status-badge ${item.TrangThai === 'Ready' ? 'active' : 'locked'}`}>
                            {item.TrangThai === 'Ready' ? 'Sẵn sàng' : 'Bảo trì'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions-group" style={{ justifyContent: 'center' }}>
                          {hasPermission('PhongHoc', 'CanUpdate') && (
                            <button
                              className="action-btn edit"
                              title="Sửa thông tin phòng học"
                              onClick={() => handleOpenEditModal(item)}
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {hasPermission('PhongHoc', 'CanDelete') && (
                            <button
                              className="action-btn delete"
                              title="Xóa phòng học"
                              onClick={() => handleOpenDeleteModal(item)}
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
        )}
      </div>

      {/* Modal Create / Edit Phòng Học */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'create' ? 'Thêm Phòng Học Mới' : 'Cập Nhật Thông Tin Phòng Học'}
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
              <div className="modal-form-group">
                <label className="modal-label">
                  Mã Phòng Học <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Ví dụ: 101_A2, 202_A2, LAB01..."
                  value={formData.maPhong}
                  onChange={(e) => setFormData({ ...formData, maPhong: e.target.value })}
                  disabled={modalMode === 'edit'}
                  required
                />
                <span className="form-hint" style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Format khuyến nghị: &#123;số_phòng&#125;_&#123;mã_tòa&#125; (VD: 101_A2 = Tầng 1 phòng 01 tòa A2)
                </span>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">
                  Tên Phòng Học <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Ví dụ: Phòng Lý Thuyết A2.101..."
                  value={formData.tenPhong}
                  onChange={(e) => setFormData({ ...formData, tenPhong: e.target.value })}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">
                  Tòa Nhà <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="modal-input"
                  value={formData.maToaNha}
                  onChange={(e) => setFormData({ ...formData, maToaNha: e.target.value })}
                  required
                >
                  <option value="">-- Chọn tòa nhà --</option>
                  {toaNhaList.map((tn) => (
                    <option key={tn.MaToaNha} value={tn.MaToaNha}>
                      {tn.TenToaNha} ({tn.MaToaNha})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Sức Chứa (Ghế ngồi)</label>
                <input
                  type="number"
                  min="1"
                  className="modal-input"
                  value={formData.sucChua}
                  onChange={(e) => setFormData({ ...formData, sucChua: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Loại Phòng Học</label>
                <select
                  className="modal-input"
                  value={formData.loaiPhong}
                  onChange={(e) => setFormData({ ...formData, loaiPhong: e.target.value })}
                >
                  <option value="Phòng lý thuyết">Phòng lý thuyết</option>
                  <option value="Phòng máy tính">Phòng máy tính</option>
                  <option value="Phòng thí nghiệm">Phòng thí nghiệm</option>
                  <option value="Hội trường">Hội trường</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Trạng Thái Hoạt Động</label>
                <select
                  className="modal-input"
                  value={formData.trangThai}
                  onChange={(e) => setFormData({ ...formData, trangThai: e.target.value })}
                >
                  <option value="Ready">Sẵn sàng (Ready)</option>
                  <option value="Maintenance">Đang bảo trì (Maintenance)</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="btn-save" disabled={formLoading}>
                  {formLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={16} className="animate-spin" /> Đang lưu...
                    </span>
                  ) : modalMode === 'create' ? (
                    'Thêm Mới'
                  ) : (
                    'Cập Nhật'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      {isDeleteModalOpen && deletingRoom && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                <AlertCircle size={24} />
                <h3 className="modal-title" style={{ color: '#ef4444' }}>Xác Nhận Xóa Phòng Học</h3>
              </div>
              <button onClick={() => setIsDeleteModalOpen(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {deleteError && (
              <div className="alert-banner error" style={{ margin: '12px 0' }}>
                <AlertCircle size={18} />
                <span>{deleteError}</span>
              </div>
            )}

            <div style={{ padding: '16px 0', fontSize: '0.95rem', color: '#334155', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn xóa phòng học <strong>{deletingRoom.TenPhong} ({deletingRoom.MaPhong})</strong> khỏi hệ thống?
              <br />
              <span style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px', display: 'block' }}>
                ⚠️ Thao tác này không thể hoàn tác nếu phòng học chưa có thời khóa biểu liên quan.
              </span>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="btn-cancel">
                Hủy
              </button>
              <button
                type="button"
                className="btn-save"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
              >
                {deleteLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" /> Đang xóa...
                  </span>
                ) : (
                  'Xóa Phòng Học'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
