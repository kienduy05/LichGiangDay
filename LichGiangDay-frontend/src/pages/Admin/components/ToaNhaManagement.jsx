import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  Building, MapPin, Home, Plus, Search, Filter, X, RefreshCw, 
  AlertCircle, Loader2, Edit2, Trash2, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { 
  apiGetToaNhaList, apiCreateToaNha, apiUpdateToaNha, apiDeleteToaNha 
} from '../../../utils/api';
import './ToaNhaManagement.css';

export default function ToaNhaManagement() {
  const { hasPermission } = useAuth();

  // Data states
  const [toaNhaList, setToaNhaList] = useState([]);
  const [toaNhaLoading, setToaNhaLoading] = useState(false);
  const [toaNhaError, setToaNhaError] = useState('');
  const [toaNhaSearchQuery, setToaNhaSearchQuery] = useState('');
  const [selectedCoSoFilter, setSelectedCoSoFilter] = useState('ALL');

  // Modal Create/Edit ToaNha
  const [isToaNhaModalOpen, setIsToaNhaModalOpen] = useState(false);
  const [toaNhaModalMode, setToaNhaModalMode] = useState('create'); // 'create' | 'edit'
  const [toaNhaFormData, setToaNhaFormData] = useState({ maToaNha: '', tenToaNha: '', coSo: '', diaChi: '' });
  const [toaNhaFormLoading, setToaNhaFormLoading] = useState(false);
  const [toaNhaFormError, setToaNhaFormError] = useState('');
  const [toaNhaFormSuccess, setToaNhaFormSuccess] = useState('');

  // Modal Delete ToaNha
  const [isDeleteToaNhaModalOpen, setIsDeleteToaNhaModalOpen] = useState(false);
  const [deletingToaNha, setDeletingToaNha] = useState(null);
  const [deleteToaNhaLoading, setDeleteToaNhaLoading] = useState(false);
  const [deleteToaNhaError, setDeleteToaNhaError] = useState('');

  // Fetch building list
  const fetchToaNhaList = async () => {
    setToaNhaLoading(true);
    setToaNhaError('');
    try {
      const data = await apiGetToaNhaList();
      setToaNhaList(data || []);
    } catch (err) {
      setToaNhaError(err.message || 'Không thể tải danh sách tòa nhà.');
    } finally {
      setToaNhaLoading(false);
    }
  };

  useEffect(() => {
    fetchToaNhaList();
  }, []);

  // Modal Handlers
  const handleOpenCreateToaNhaModal = () => {
    setToaNhaModalMode('create');
    setToaNhaFormData({ maToaNha: '', tenToaNha: '', coSo: '', diaChi: '' });
    setToaNhaFormError('');
    setToaNhaFormSuccess('');
    setIsToaNhaModalOpen(true);
  };

  const handleOpenEditToaNhaModal = (item) => {
    setToaNhaModalMode('edit');
    setToaNhaFormData({
      maToaNha: item.MaToaNha,
      tenToaNha: item.TenToaNha || '',
      coSo: item.CoSo || '',
      diaChi: item.DiaChi || ''
    });
    setToaNhaFormError('');
    setToaNhaFormSuccess('');
    setIsToaNhaModalOpen(true);
  };

  const handleSaveToaNhaSubmit = async (e) => {
    e.preventDefault();
    setToaNhaFormError('');
    setToaNhaFormSuccess('');

    if (toaNhaModalMode === 'create' && !toaNhaFormData.maToaNha.trim()) {
      setToaNhaFormError('Vui lòng nhập Mã Tòa Nhà.');
      return;
    }
    if (!toaNhaFormData.tenToaNha.trim()) {
      setToaNhaFormError('Vui lòng nhập Tên Tòa Nhà.');
      return;
    }

    setToaNhaFormLoading(true);
    try {
      if (toaNhaModalMode === 'create') {
        await apiCreateToaNha(toaNhaFormData);
        setToaNhaFormSuccess('Tạo tòa nhà mới thành công!');
      } else {
        await apiUpdateToaNha(toaNhaFormData.maToaNha, {
          tenToaNha: toaNhaFormData.tenToaNha,
          coSo: toaNhaFormData.coSo,
          diaChi: toaNhaFormData.diaChi
        });
        setToaNhaFormSuccess('Cập nhật thông tin tòa nhà thành công!');
      }

      await fetchToaNhaList();

      setTimeout(() => {
        setIsToaNhaModalOpen(false);
        setToaNhaFormSuccess('');
      }, 1000);
    } catch (err) {
      setToaNhaFormError(err.message || 'Thao tác thất bại.');
    } finally {
      setToaNhaFormLoading(false);
    }
  };

  // Delete Handlers
  const handleOpenDeleteToaNhaModal = (item) => {
    setDeletingToaNha(item);
    setDeleteToaNhaError('');
    setIsDeleteToaNhaModalOpen(true);
  };

  const handleConfirmDeleteToaNha = async () => {
    if (!deletingToaNha) return;
    setDeleteToaNhaLoading(true);
    setDeleteToaNhaError('');

    try {
      await apiDeleteToaNha(deletingToaNha.MaToaNha);
      await fetchToaNhaList();
      setIsDeleteToaNhaModalOpen(false);
      setDeletingToaNha(null);
    } catch (err) {
      setDeleteToaNhaError(err.message || 'Không thể xóa tòa nhà.');
    } finally {
      setDeleteToaNhaLoading(false);
    }
  };

  // Filter building list
  const coSoOptions = Array.from(new Set(toaNhaList.map(item => item.CoSo).filter(Boolean)));

  const filteredToaNhaList = toaNhaList.filter(item => {
    const matchesSearch = 
      item.MaToaNha?.toLowerCase().includes(toaNhaSearchQuery.toLowerCase()) ||
      item.TenToaNha?.toLowerCase().includes(toaNhaSearchQuery.toLowerCase()) ||
      item.CoSo?.toLowerCase().includes(toaNhaSearchQuery.toLowerCase()) ||
      item.DiaChi?.toLowerCase().includes(toaNhaSearchQuery.toLowerCase());
    
    const matchesCoSo = selectedCoSoFilter === 'ALL' || item.CoSo === selectedCoSoFilter;

    return matchesSearch && matchesCoSo;
  });

  return (
    <div className="toanha-management-container">
      {/* Page Header Toolbar */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Tòa Nhà</h2>
          <p className="page-subtitle">Danh sách tòa nhà, dãy nhà học và phân bố theo từng cơ sở</p>
        </div>
        {hasPermission('ToaNha', 'CanCreate') && (
          <button className="btn-primary-add" onClick={handleOpenCreateToaNhaModal}>
            <Plus size={18} />
            <span>Thêm Tòa Nhà</span>
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Building size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{toaNhaList.length}</div>
            <div className="admin-stat-text">Tổng số tòa nhà</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <MapPin size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{coSoOptions.length || 1}</div>
            <div className="admin-stat-text">Cơ sở đào tạo</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Home size={24} />
          </div>
          <div>
            <div className="admin-stat-number">
              {toaNhaList.reduce((acc, cur) => acc + (Number(cur.SoPhongHoc) || 0), 0)}
            </div>
            <div className="admin-stat-text">Phòng học liên kết</div>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="admin-card">
        {/* Search & Filter Toolbar */}
        <div className="roles-filter-bar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm mã tòa nhà, tên tòa nhà, cơ sở, địa chỉ..." 
              value={toaNhaSearchQuery}
              onChange={(e) => setToaNhaSearchQuery(e.target.value)}
            />
            {toaNhaSearchQuery && (
              <button className="clear-search-btn" onClick={() => setToaNhaSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} style={{ color: 'var(--admin-text-sub)' }} />
              <select 
                className="modal-input" 
                style={{ fontSize: '0.85rem', width: 'auto' }}
                value={selectedCoSoFilter}
                onChange={(e) => setSelectedCoSoFilter(e.target.value)}
              >
                <option value="ALL">Tất cả cơ sở ({toaNhaList.length})</option>
                {coSoOptions.map(cs => (
                  <option key={cs} value={cs}>{cs}</option>
                ))}
              </select>
            </div>

            <button className="btn-refresh" title="Tải lại danh sách" onClick={fetchToaNhaList}>
              <RefreshCw size={16} className={toaNhaLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Alert Errors */}
        {toaNhaError && (
          <div className="alert-banner error" style={{ margin: '16px 20px 0' }}>
            <AlertCircle size={18} />
            <span>{toaNhaError}</span>
          </div>
        )}

        {/* Table View */}
        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Mã Tòa Nhà</th>
                <th style={{ width: '220px' }}>Tên Tòa Nhà</th>
                <th style={{ width: '180px' }}>Cơ Sở</th>
                <th>Địa Chỉ</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Số Phòng Học</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {toaNhaLoading ? (
                <tr>
                  <td colSpan="6" className="table-loading-cell">
                    <Loader2 size={24} className="animate-spin" />
                    <span>Đang tải danh sách tòa nhà...</span>
                  </td>
                </tr>
              ) : filteredToaNhaList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty-cell">
                    {toaNhaSearchQuery || selectedCoSoFilter !== 'ALL' 
                      ? 'Không tìm thấy tòa nhà nào phù hợp với bộ lọc.' 
                      : 'Chưa có tòa nhà nào trong hệ thống.'}
                  </td>
                </tr>
              ) : (
                filteredToaNhaList.map((item) => (
                  <tr key={item.MaToaNha}>
                    <td>
                      <span className="role-badge primary" style={{ fontWeight: 600 }}>
                        {item.MaToaNha}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                        {item.TenToaNha}
                      </div>
                    </td>
                    <td>
                      {item.CoSo ? (
                        <span className="status-badge active" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
                          <MapPin size={12} style={{ color: '#0284c7' }} />
                          {item.CoSo}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>---</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                        {item.DiaChi || '---'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="user-count-tag" style={{ background: item.SoPhongHoc > 0 ? '#e0f2fe' : '#f1f5f9', color: item.SoPhongHoc > 0 ? '#0369a1' : '#64748b' }}>
                        {item.SoPhongHoc || 0} phòng
                      </span>
                    </td>
                    <td>
                      <div className="table-actions-group" style={{ justifyContent: 'center' }}>
                        {hasPermission('ToaNha', 'CanUpdate') && (
                          <button 
                            className="action-btn edit" 
                            title="Sửa thông tin tòa nhà"
                            onClick={() => handleOpenEditToaNhaModal(item)}
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {hasPermission('ToaNha', 'CanDelete') && (
                          <button 
                            className="action-btn delete" 
                            title="Xóa tòa nhà"
                            onClick={() => handleOpenDeleteToaNhaModal(item)}
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

      {/* Modal Create / Edit Tòa Nhà */}
      {isToaNhaModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {toaNhaModalMode === 'create' ? 'Thêm Tòa Nhà Mới' : 'Cập Nhật Thông Tin Tòa Nhà'}
              </h3>
              <button onClick={() => setIsToaNhaModalOpen(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {toaNhaFormSuccess && (
              <div className="alert-banner success">
                <CheckCircle2 size={18} />
                <span>{toaNhaFormSuccess}</span>
              </div>
            )}

            {toaNhaFormError && (
              <div className="alert-banner error">
                <AlertCircle size={18} />
                <span>{toaNhaFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveToaNhaSubmit}>
              <div className="modal-form-group">
                <label className="modal-label">
                  Mã Tòa Nhà <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="Ví dụ: A1, B2, A10, nhà C..."
                  value={toaNhaFormData.maToaNha}
                  onChange={(e) => setToaNhaFormData({ ...toaNhaFormData, maToaNha: e.target.value })}
                  disabled={toaNhaModalMode === 'edit'}
                  style={toaNhaModalMode === 'edit' ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : {}}
                  required
                />
                {toaNhaModalMode === 'create' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)', marginTop: '4px', display: 'block' }}>
                    Mã tòa nhà là duy nhất và không thể thay đổi sau khi tạo.
                  </span>
                )}
              </div>

              <div className="modal-form-group">
                <label className="modal-label">
                  Tên Tòa Nhà <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="Ví dụ: Tòa nhà Giảng đường A1"
                  value={toaNhaFormData.tenToaNha}
                  onChange={(e) => setToaNhaFormData({ ...toaNhaFormData, tenToaNha: e.target.value })}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Cơ Sở Đào Tạo</label>
                <input 
                  type="text" 
                  className="modal-input" 
                  placeholder="Ví dụ: Cơ sở chính, Cơ sở 2, Cơ sở Nam Từ Liêm..."
                  value={toaNhaFormData.coSo}
                  onChange={(e) => setToaNhaFormData({ ...toaNhaFormData, coSo: e.target.value })}
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Địa Chỉ Chi Tiết</label>
                <textarea 
                  className="modal-input" 
                  rows="3"
                  placeholder="Ví dụ: Số 235 Hoàng Quốc Việt, Cầu Giấy, Hà Nội"
                  value={toaNhaFormData.diaChi}
                  onChange={(e) => setToaNhaFormData({ ...toaNhaFormData, diaChi: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsToaNhaModalOpen(false)} className="btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="btn-save" disabled={toaNhaFormLoading}>
                  {toaNhaFormLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={16} className="animate-spin" /> Đang lưu...
                    </span>
                  ) : (
                    toaNhaModalMode === 'create' ? 'Tạo Tòa Nhà' : 'Lưu Thay Đổi'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm ToaNha Modal */}
      {isDeleteToaNhaModalOpen && deletingToaNha && (
        <div className="modal-overlay">
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper">
              <ShieldAlert size={32} />
            </div>
            
            <h3 className="delete-modal-title">Xác Nhận Xóa Tòa Nhà</h3>
            <p className="delete-modal-desc">
              Bạn có chắc chắn muốn xóa tòa nhà <b style={{ color: 'var(--admin-text-main)' }}>{deletingToaNha.TenToaNha} ({deletingToaNha.MaToaNha})</b> không? 
            </p>

            {deletingToaNha.SoPhongHoc > 0 && (
              <div className="alert-banner warning" style={{ textAlign: 'left', marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <span>
                  Cảnh báo: Tòa nhà này đang chứa <b>{deletingToaNha.SoPhongHoc} phòng học</b> trực thuộc. Hệ thống sẽ không cho phép xóa nếu chưa di chuyển hoặc xóa các phòng học liên quan.
                </span>
              </div>
            )}

            {deleteToaNhaError && (
              <div className="alert-banner error" style={{ textAlign: 'left', marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <span>{deleteToaNhaError}</span>
              </div>
            )}

            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button 
                type="button" 
                onClick={() => setIsDeleteToaNhaModalOpen(false)} 
                className="btn-cancel"
                disabled={deleteToaNhaLoading}
              >
                Hủy Bỏ
              </button>
              <button 
                type="button" 
                onClick={handleConfirmDeleteToaNha} 
                className="btn-delete-confirm"
                disabled={deleteToaNhaLoading}
              >
                {deleteToaNhaLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" /> Đang xóa...
                  </span>
                ) : (
                  'Xóa Tòa Nhà'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
