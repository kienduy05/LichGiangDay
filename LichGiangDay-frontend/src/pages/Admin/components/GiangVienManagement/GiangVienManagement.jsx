import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  UserCheck, Network, Users, BookMarked, Plus, Search, X, RefreshCw,
  AlertCircle, Loader2, Edit2, Trash2, ShieldAlert, CheckCircle2,
  ArrowLeft, Link, Unlink, Power, PowerOff, CalendarDays, Clock
} from 'lucide-react';
import {
  apiGetGiangVienList,
  apiGetGiangVienChiTiet,
  apiCreateGiangVien,
  apiUpdateGiangVien,
  apiToggleGiangVienTrangThai,
  apiDeleteGiangVien,
  apiGetBoMonList
} from '../../../../utils/api';
import './GiangVienManagement.css';

export default function GiangVienManagement() {
  const { hasPermission } = useAuth();

  // ─── View: 'list' | 'detail' ───
  const [view, setView] = useState('list');
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('lophocphan');

  // ─── Danh sách Giảng viên ───
  const [gvList, setGvList] = useState([]);
  const [gvLoading, setGvLoading] = useState(false);
  const [gvError, setGvError] = useState('');

  // ─── Danh sách Bộ môn (dropdown lọc + modal form) ───
  const [boMonList, setBoMonList] = useState([]);

  // ─── Bộ lọc ───
  const [filterBoMon, setFilterBoMon] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Modal Thêm / Sửa ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({ maGiangVien: '', hoTen: '', email: '', soDienThoai: '', maBoMon: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formWarn, setFormWarn] = useState('');

  // ─── Modal Xóa ───
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingGV, setDeletingGV] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ─── Modal Toggle cảnh báo ───
  const [warnToggle, setWarnToggle] = useState(null); // { maGiangVien, hoTen, message }
  const [toggleLoading, setToggleLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────────────────────
  const fetchGvList = useCallback(async () => {
    setGvLoading(true);
    setGvError('');
    try {
      const data = await apiGetGiangVienList({
        maBoMon: filterBoMon,
        trangThai: filterTrangThai,
        search: searchQuery
      });
      setGvList(data || []);
    } catch (err) {
      setGvError(err.message || 'Không thể tải danh sách giảng viên.');
    } finally {
      setGvLoading(false);
    }
  }, [filterBoMon, filterTrangThai, searchQuery]);

  const fetchBoMonList = async () => {
    try {
      const data = await apiGetBoMonList();
      setBoMonList(data || []);
    } catch {
      setBoMonList([]);
    }
  };

  useEffect(() => {
    fetchGvList();
    fetchBoMonList();
  }, []);

  // Khi thay filter → fetch lại (debounce tìm kiếm)
  useEffect(() => {
    const timer = setTimeout(() => { fetchGvList(); }, 300);
    return () => clearTimeout(timer);
  }, [filterBoMon, filterTrangThai, searchQuery]);

  // ─────────────────────────────────────────────────────────────
  // DETAIL VIEW
  // ─────────────────────────────────────────────────────────────
  const handleViewDetail = async (item) => {
    setDetailLoading(true);
    setView('detail');
    setDetailTab('lophocphan');
    try {
      const data = await apiGetGiangVienChiTiet(item.MaGiangVien);
      setDetailData(data);
    } catch (err) {
      setDetailData({ giangVien: item, lopHocPhanList: [], yeuCauNghiList: [], dayThayList: [], dayBuList: [] });
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
    setFormData({ maGiangVien: '', hoTen: '', email: '', soDienThoai: '', maBoMon: filterBoMon || '' });
    setFormError(''); setFormSuccess(''); setFormWarn('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setFormData({
      maGiangVien: item.MaGiangVien,
      hoTen: item.HoTen,
      email: item.Email || '',
      soDienThoai: item.SoDienThoai || '',
      maBoMon: item.MaBoMon || ''
    });
    setFormError(''); setFormSuccess(''); setFormWarn('');
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess(''); setFormWarn('');

    if (modalMode === 'create' && !formData.maGiangVien.trim()) {
      setFormError('Vui lòng nhập Mã giảng viên.'); return;
    }
    if (!formData.hoTen.trim()) {
      setFormError('Vui lòng nhập Họ tên giảng viên.'); return;
    }

    setFormLoading(true);
    try {
      if (modalMode === 'create') {
        await apiCreateGiangVien(formData);
        setFormSuccess('Thêm giảng viên mới thành công!');
      } else {
        const result = await apiUpdateGiangVien(formData.maGiangVien, {
          hoTen: formData.hoTen,
          email: formData.email,
          soDienThoai: formData.soDienThoai,
          maBoMon: formData.maBoMon
        });
        setFormSuccess('Cập nhật giảng viên thành công!');
        if (result?.warnLanhDao) {
          setFormWarn(
            'Lưu ý: Giảng viên này đang được gán làm Trưởng bộ môn hoặc Trưởng khoa. ' +
            'Vui lòng rà soát lại phân công lãnh đạo sau khi đổi bộ môn.'
          );
        }
      }
      await fetchGvList();
      if (!formWarn) {
        setTimeout(() => { setIsModalOpen(false); setFormSuccess(''); }, 1000);
      }
    } catch (err) {
      setFormError(err.message || 'Thao tác thất bại.');
    } finally {
      setFormLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // TOGGLE TRẠNG THÁI
  // ─────────────────────────────────────────────────────────────
  const handleToggle = async (item) => {
    // Lần đầu click → gọi API, nếu có warn thì hiện modal xác nhận
    setToggleLoading(true);
    try {
      const result = await apiToggleGiangVienTrangThai(item.MaGiangVien);
      if (result.warnHoatDong) {
        // API đã thực hiện toggle, nhưng trả kèm cảnh báo → chỉ thông báo
        setWarnToggle({ message: result.warnHoatDong, done: true });
      }
      await fetchGvList();
    } catch (err) {
      setGvError(err.message || 'Đổi trạng thái thất bại.');
    } finally {
      setToggleLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // XÓA
  // ─────────────────────────────────────────────────────────────
  const handleOpenDelete = (item) => {
    setDeletingGV(item);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingGV) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await apiDeleteGiangVien(deletingGV.MaGiangVien);
      await fetchGvList();
      setIsDeleteModalOpen(false);
      setDeletingGV(null);
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa giảng viên.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // STATS
  // ─────────────────────────────────────────────────────────────
  const totalActive = gvList.filter(gv => gv.TrangThai === 'Active').length;
  const totalLinked = gvList.filter(gv => gv.DaLienKetTaiKhoan).length;
  const totalNoBoMon = gvList.filter(gv => !gv.MaBoMon).length;

  // ════════════════════════════════════════════════
  // RENDER — Detail View
  // ════════════════════════════════════════════════
  if (view === 'detail') {
    const { giangVien, lopHocPhanList = [], yeuCauNghiList = [], dayThayList = [], dayBuList = [] } = detailData || {};

    return (
      <div className="gv-management-container">
        <div className="admin-card" style={{ padding: 0 }}>

          {/* Header */}
          <div className="gv-detail-header">
            <button className="gv-detail-back-btn" onClick={handleBackToList}>
              <ArrowLeft size={16} /> Quay lại
            </button>
            <div style={{ flex: 1 }}>
              {detailLoading ? (
                <div className="gv-detail-title">Đang tải...</div>
              ) : (
                <>
                  <div className="gv-detail-title">
                    {giangVien?.HoTen}
                    <span style={{ marginLeft: 8, fontSize: '0.85rem', fontWeight: 400, color: 'var(--admin-text-sub)' }}>
                      ({giangVien?.MaGiangVien})
                    </span>
                  </div>
                  <div className="gv-detail-subtitle">
                    <span className={`gv-bomon-badge ${!giangVien?.MaBoMon ? 'empty' : ''}`}>
                      <Network size={11} />
                      {giangVien?.TenBoMon || 'Chưa phân bộ môn'}
                    </span>
                    <span className={`status-badge ${giangVien?.TrangThai === 'Active' ? 'active' : 'inactive'}`}>
                      {giangVien?.TrangThai}
                    </span>
                    <span className={`gv-account-badge ${giangVien?.DaLienKetTaiKhoan ? 'linked' : 'unlinked'}`}>
                      {giangVien?.DaLienKetTaiKhoan ? <><Link size={11} /> Có tài khoản</> : <><Unlink size={11} /> Chưa liên kết</>}
                    </span>
                    {giangVien?.Email && <span style={{ color: 'var(--admin-text-sub)', fontSize: '0.82rem' }}>{giangVien.Email}</span>}
                    {giangVien?.SoDienThoai && <span style={{ color: 'var(--admin-text-sub)', fontSize: '0.82rem' }}>{giangVien.SoDienThoai}</span>}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="gv-tab-bar">
            <button className={`gv-tab-btn ${detailTab === 'lophocphan' ? 'active' : ''}`} onClick={() => setDetailTab('lophocphan')}>
              <BookMarked size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Lớp học phần ({lopHocPhanList.length})
            </button>
            <button className={`gv-tab-btn ${detailTab === 'yeucaunghi' ? 'active' : ''}`} onClick={() => setDetailTab('yeucaunghi')}>
              <CalendarDays size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Yêu cầu nghỉ ({yeuCauNghiList.length})
            </button>
            <button className={`gv-tab-btn ${detailTab === 'daythay' ? 'active' : ''}`} onClick={() => setDetailTab('daythay')}>
              <Clock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Dạy thay/Dạy bù ({dayThayList.length + dayBuList.length})
            </button>
          </div>

          {/* Tab content */}
          {detailLoading ? (
            <div className="table-loading-cell" style={{ padding: '40px 20px' }}>
              <Loader2 size={24} className="animate-spin" />
              <span>Đang tải chi tiết...</span>
            </div>
          ) : (
            <div className="table-responsive">

              {/* Tab: Lớp học phần */}
              {detailTab === 'lophocphan' && (
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '160px' }}>Mã lớp HP</th>
                      <th>Tên lớp / Môn học</th>
                      <th style={{ width: '130px' }}>Học kỳ</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>Loại</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Trạng thái PC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lopHocPhanList.length === 0 ? (
                      <tr><td colSpan="5" className="table-empty-cell">Giảng viên chưa phụ trách lớp học phần nào.</td></tr>
                    ) : (
                      lopHocPhanList.map(lhp => (
                        <tr key={lhp.MaLopHocPhan}>
                          <td><span className="role-badge primary" style={{ fontWeight: 600 }}>{lhp.MaLopHocPhan}</span></td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--admin-text-main)', fontSize: '0.88rem' }}>{lhp.TenLopHocPhan || lhp.MaLopHocPhan}</div>
                            <div style={{ color: 'var(--admin-text-sub)', fontSize: '0.8rem' }}>{lhp.TenMonHoc}</div>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>{lhp.TenHocKy}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="role-badge">{lhp.LoaiHoc}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`status-badge ${lhp.TrangThaiPhanCong === 'Assigned' ? 'active' : ''}`} style={{ fontSize: '0.75rem' }}>
                              {lhp.TrangThaiPhanCong}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tab: Yêu cầu nghỉ */}
              {detailTab === 'yeucaunghi' && (
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '160px' }}>Mã yêu cầu</th>
                      <th style={{ width: '120px' }}>Loại</th>
                      <th>Lý do</th>
                      <th style={{ width: '120px' }}>Ngày học</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yeuCauNghiList.length === 0 ? (
                      <tr><td colSpan="5" className="table-empty-cell">Giảng viên chưa có yêu cầu nghỉ nào.</td></tr>
                    ) : (
                      yeuCauNghiList.map(ycn => (
                        <tr key={ycn.MaYeuCauNghi}>
                          <td><span className="role-badge primary" style={{ fontWeight: 600 }}>{ycn.MaYeuCauNghi}</span></td>
                          <td><span className="role-badge">{ycn.LoaiYeuCau}</span></td>
                          <td style={{ fontSize: '0.86rem', color: 'var(--admin-text-sub)' }}>{ycn.LyDo}</td>
                          <td style={{ fontSize: '0.85rem' }}>{ycn.NgayHoc ? new Date(ycn.NgayHoc).toLocaleDateString('vi-VN') : '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`status-badge ${ycn.TrangThai === 'Approved' ? 'active' : ''}`} style={{ fontSize: '0.75rem' }}>
                              {ycn.TrangThai}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tab: Dạy thay / Dạy bù */}
              {detailTab === 'daythay' && (
                <>
                  {dayThayList.length > 0 && (
                    <>
                      <div style={{ padding: '12px 20px 4px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>
                        Phân công dạy thay ({dayThayList.length})
                      </div>
                      <table className="custom-data-table">
                        <thead>
                          <tr>
                            <th style={{ width: '160px' }}>Mã phân công</th>
                            <th style={{ width: '120px' }}>Ngày dạy thay</th>
                            <th>Lớp học phần</th>
                            <th style={{ width: '110px', textAlign: 'center' }}>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayThayList.map(dt => (
                            <tr key={dt.MaPhanCongDayThay}>
                              <td><span className="role-badge primary" style={{ fontWeight: 600 }}>{dt.MaPhanCongDayThay}</span></td>
                              <td style={{ fontSize: '0.85rem' }}>{dt.NgayHoc ? new Date(dt.NgayHoc).toLocaleDateString('vi-VN') : '—'}</td>
                              <td style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>{dt.MaLopHocPhan}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="status-badge active" style={{ fontSize: '0.75rem' }}>{dt.TrangThai}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                  {dayBuList.length > 0 && (
                    <>
                      <div style={{ padding: '12px 20px 4px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>
                        Đăng ký dạy bù ({dayBuList.length})
                      </div>
                      <table className="custom-data-table">
                        <thead>
                          <tr>
                            <th style={{ width: '160px' }}>Mã đăng ký</th>
                            <th style={{ width: '130px' }}>Ngày đề xuất</th>
                            <th>Lớp học phần</th>
                            <th style={{ width: '110px', textAlign: 'center' }}>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayBuList.map(db => (
                            <tr key={db.MaDangKyDayBu}>
                              <td><span className="role-badge primary" style={{ fontWeight: 600 }}>{db.MaDangKyDayBu}</span></td>
                              <td style={{ fontSize: '0.85rem' }}>{db.NgayDeXuat ? new Date(db.NgayDeXuat).toLocaleDateString('vi-VN') : '—'}</td>
                              <td style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>{db.MaLopHocPhan}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={`status-badge ${db.TrangThai === 'Approved' ? 'active' : ''}`} style={{ fontSize: '0.75rem' }}>{db.TrangThai}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                  {dayThayList.length === 0 && dayBuList.length === 0 && (
                    <div className="table-empty-cell" style={{ padding: '40px 20px' }}>Giảng viên chưa có lịch sử dạy thay hoặc dạy bù.</div>
                  )}
                </>
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
    <div className="gv-management-container">

      {/* Page Header */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Giảng Viên</h2>
          <p className="page-subtitle">Danh sách giảng viên, trạng thái công tác và liên kết tài khoản</p>
        </div>
        {hasPermission('GiangVien', 'CanCreate') && (
          <button className="btn-primary-add" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Thêm Giảng viên</span>
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
            <div className="admin-stat-number">{gvList.length}</div>
            <div className="admin-stat-text">Tổng giảng viên</div>
          </div>
        </div>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#ecfdf5', color: '#059669' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{totalActive}</div>
            <div className="admin-stat-text">Đang công tác</div>
          </div>
        </div>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Link size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{totalLinked}</div>
            <div className="admin-stat-text">Có tài khoản</div>
          </div>
        </div>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <Network size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{totalNoBoMon}</div>
            <div className="admin-stat-text">Chưa phân bộ môn</div>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="admin-card">

        {/* Filter + Search */}
        <div className="gv-filter-bar">
          {/* Lọc bộ môn */}
          <select className="gv-filter-select" value={filterBoMon} onChange={e => setFilterBoMon(e.target.value)}>
            <option value="">— Tất cả Bộ môn —</option>
            <option value="__NULL__">⊘ Chưa phân bộ môn</option>
            {boMonList.map(bm => (
              <option key={bm.MaBoMon} value={bm.MaBoMon}>{bm.TenBoMon} ({bm.MaBoMon})</option>
            ))}
          </select>

          {/* Lọc trạng thái */}
          <select className="gv-filter-select" style={{ minWidth: '160px' }} value={filterTrangThai} onChange={e => setFilterTrangThai(e.target.value)}>
            <option value="">— Tất cả trạng thái —</option>
            <option value="Active">✓ Đang công tác</option>
            <option value="Inactive">✕ Ngừng công tác</option>
          </select>

          {/* Search */}
          <div className="search-box" style={{ flex: 1, minWidth: '180px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm theo mã GV, họ tên, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}><X size={14} /></button>
            )}
          </div>

          <button className="btn-refresh" title="Tải lại" onClick={fetchGvList}>
            <RefreshCw size={16} className={gvLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Error Banner */}
        {gvError && (
          <div className="alert-banner error" style={{ margin: '0 0 16px' }}>
            <AlertCircle size={18} /><span>{gvError}</span>
          </div>
        )}

        {/* Card List */}
        {gvLoading ? (
          <div className="table-loading-cell" style={{ padding: '40px 0' }}>
            <Loader2 size={24} className="animate-spin" />
            <span>Đang tải danh sách giảng viên...</span>
          </div>
        ) : gvList.length === 0 ? (
          <div className="table-empty-cell" style={{ padding: '40px 0' }}>
            {searchQuery || filterBoMon || filterTrangThai
              ? 'Không tìm thấy giảng viên nào phù hợp.'
              : 'Chưa có giảng viên nào trong hệ thống.'}
          </div>
        ) : (
          <div className="gv-card-list">
            {gvList.map(item => {
              const initials = item.HoTen
                ? item.HoTen.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
                : '?';
              const isActive = item.TrangThai === 'Active';
              return (
                <div
                  key={item.MaGiangVien}
                  className={`gv-card-item ${!isActive ? 'gv-card-inactive' : ''}`}
                >
                  {/* Header card: Tên + actions */}
                  <div className="gv-card-header">
                    <div className="gv-card-header-left">
                      <span className="gv-card-name">{item.HoTen}</span>
                      <div className="gv-card-badges">
                        <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>{item.TrangThai}</span>
                        <span className={`gv-account-badge ${item.DaLienKetTaiKhoan ? 'linked' : 'unlinked'}`}>
                          {item.DaLienKetTaiKhoan ? <><Link size={11} /> Có tài khoản</> : <><Unlink size={11} /> Chưa liên kết</>}
                        </span>
                      </div>
                    </div>
                    <div className="gv-card-actions" onClick={e => e.stopPropagation()}>
                      {hasPermission('GiangVien', 'CanUpdate') && (
                        <button className="action-btn edit" title="Sửa thông tin" onClick={() => handleOpenEdit(item)}>
                          <Edit2 size={15} />
                        </button>
                      )}
                      {hasPermission('GiangVien', 'CanUpdate') && (
                        <button
                          className={`gv-toggle-btn ${isActive ? 'deactivate' : 'activate'}`}
                          onClick={() => handleToggle(item)}
                          disabled={toggleLoading}
                        >
                          {isActive ? <><PowerOff size={13} /> Ngừng</> : <><Power size={13} /> Kích hoạt</>}
                        </button>
                      )}
                      {hasPermission('GiangVien', 'CanDelete') && (
                        <button className="action-btn delete" title="Xóa" onClick={() => handleOpenDelete(item)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fields dọc — click để xem chi tiết */}
                  <div className="gv-card-fields" onClick={() => handleViewDetail(item)} title="Xem chi tiết">
                    <div className="gv-card-field">
                      <span className="gv-field-label">Mã GV</span>
                      <span className="gv-field-value">{item.MaGiangVien}</span>
                    </div>
                    <div className="gv-card-field">
                      <span className="gv-field-label">Họ tên</span>
                      <span className="gv-field-value">{item.HoTen}</span>
                    </div>
                    <div className="gv-card-field">
                      <span className="gv-field-label">Email</span>
                      <span className="gv-field-value muted">{item.Email || '—'}</span>
                    </div>
                    <div className="gv-card-field">
                      <span className="gv-field-label">SĐT</span>
                      <span className="gv-field-value muted">{item.SoDienThoai || '—'}</span>
                    </div>
                    <div className="gv-card-field">
                      <span className="gv-field-label">Bộ môn</span>
                      <span className={`gv-bomon-badge ${!item.MaBoMon ? 'empty' : ''}`} style={{ fontSize: '0.78rem' }}>
                        <Network size={10} />
                        {item.TenBoMon || 'Chưa phân công'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ MODAL: Thêm / Sửa ══════════ */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'create' ? 'Thêm Giảng Viên Mới' : 'Cập Nhật Thông Tin Giảng Viên'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn"><X size={20} /></button>
            </div>

            {formSuccess && <div className="alert-banner success"><CheckCircle2 size={18} /><span>{formSuccess}</span></div>}
            {formWarn && <div className="alert-banner warning"><AlertCircle size={18} /><span>{formWarn}</span></div>}
            {formError && <div className="alert-banner error"><AlertCircle size={18} /><span>{formError}</span></div>}

            <form onSubmit={handleSaveSubmit}>
              {/* Mã GV */}
              <div className="modal-form-group">
                <label className="modal-label">Mã Giảng Viên <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text" className="modal-input"
                  placeholder="VD: GV001, GV.001..."
                  value={formData.maGiangVien}
                  onChange={e => setFormData({ ...formData, maGiangVien: e.target.value })}
                  disabled={modalMode === 'edit'}
                  style={modalMode === 'edit' ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : {}}
                  required
                />
                {modalMode === 'create' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)', marginTop: '4px', display: 'block' }}>
                    Mã giảng viên là duy nhất, sẽ tự động viết hoa và không thể thay đổi sau khi tạo.
                  </span>
                )}
              </div>

              {/* Họ tên */}
              <div className="modal-form-group">
                <label className="modal-label">Họ Tên <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text" className="modal-input"
                  placeholder="Nhập họ tên đầy đủ"
                  value={formData.hoTen}
                  onChange={e => setFormData({ ...formData, hoTen: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div className="modal-form-group">
                <label className="modal-label">Email</label>
                <input
                  type="email" className="modal-input"
                  placeholder="VD: giangvien@university.edu.vn"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* SĐT */}
              <div className="modal-form-group">
                <label className="modal-label">Số Điện Thoại</label>
                <input
                  type="text" className="modal-input"
                  placeholder="VD: 0912345678"
                  value={formData.soDienThoai}
                  onChange={e => setFormData({ ...formData, soDienThoai: e.target.value })}
                />
              </div>

              {/* Bộ môn */}
              <div className="modal-form-group">
                <label className="modal-label">Bộ Môn trực thuộc</label>
                <select
                  className="modal-input"
                  value={formData.maBoMon}
                  onChange={e => setFormData({ ...formData, maBoMon: e.target.value })}
                >
                  <option value="">— Chưa phân công bộ môn —</option>
                  {boMonList.map(bm => (
                    <option key={bm.MaBoMon} value={bm.MaBoMon}>{bm.TenBoMon} ({bm.MaBoMon})</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)', marginTop: '4px', display: 'block' }}>
                  Không bắt buộc — có thể phân công sau.
                </span>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setFormWarn(''); setFormSuccess(''); }}
                  className="btn-cancel"
                >
                  {formWarn ? 'Đóng' : 'Hủy'}
                </button>
                {!formWarn && (
                  <button type="submit" className="btn-save" disabled={formLoading}>
                    {formLoading
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Loader2 size={16} className="animate-spin" /> Đang lưu...</span>
                      : modalMode === 'create' ? 'Thêm Giảng Viên' : 'Lưu Thay Đổi'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: Xóa ══════════ */}
      {isDeleteModalOpen && deletingGV && (
        <div className="modal-overlay">
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper"><ShieldAlert size={32} /></div>
            <h3 className="delete-modal-title">Xác Nhận Xóa Giảng Viên</h3>
            <p className="delete-modal-desc">
              Bạn có chắc muốn xóa giảng viên{' '}
              <b style={{ color: 'var(--admin-text-main)' }}>{deletingGV.HoTen} ({deletingGV.MaGiangVien})</b> không?
            </p>
            <div className="alert-banner warning" style={{ textAlign: 'left', marginBottom: '16px', fontSize: '0.83rem' }}>
              <AlertCircle size={16} />
              <span>
                Hệ thống sẽ kiểm tra 7 bảng ràng buộc trước khi xóa. Nếu giảng viên đã có bất kỳ hoạt động nào
                (lớp học phần, buổi học, yêu cầu nghỉ...), xóa sẽ bị từ chối. Hãy dùng "Ngừng công tác" thay thế.
              </span>
            </div>
            {deleteError && (
              <div className="alert-banner error" style={{ textAlign: 'left', marginBottom: '16px' }}>
                <AlertCircle size={18} /><span>{deleteError}</span>
              </div>
            )}
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="btn-cancel" disabled={deleteLoading}>
                Hủy Bỏ
              </button>
              <button type="button" onClick={handleConfirmDelete} className="btn-delete" disabled={deleteLoading}>
                {deleteLoading
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Loader2 size={16} className="animate-spin" /> Đang xóa...</span>
                  : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: Cảnh báo toggle trạng thái ══════════ */}
      {warnToggle && (
        <div className="gv-warn-overlay">
          <div className="gv-warn-card">
            <div className="gv-warn-icon"><AlertCircle size={26} /></div>
            <h3 className="gv-warn-title">Thông báo sau khi đổi trạng thái</h3>
            <p className="gv-warn-desc">{warnToggle.message}</p>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn-save" onClick={() => setWarnToggle(null)}>Đã hiểu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
