import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  Users, UserCheck, Link, Network, Plus, AlertCircle,
  ShieldAlert, Loader2
} from 'lucide-react';
import {
  apiGetGiangVienList,
  apiGetGiangVienChiTiet,
  apiCreateGiangVien,
  apiUpdateGiangVien,
  apiToggleGiangVienTrangThai,
  apiDeleteGiangVien,
  apiGetKhoaList,
  apiGetBoMonList
} from '../../../../utils/api';
import GiangVienTreeView from './GiangVienTreeView';
import GiangVienFilterBar from './GiangVienFilterBar';
import GiangVienTable from './GiangVienTable';
import GiangVienDetailView from './GiangVienDetailView';
import GiangVienFormModal from './GiangVienFormModal';
import './GiangVienManagement.css';
import './GiangVienComponents.css';

export default function GiangVienManagement() {
  const { user, hasPermission } = useAuth();

  // ─── Phân quyền dữ liệu Bộ môn động theo tài khoản đăng nhập ───
  const isBoMonRole = user?.role === 'BOMON';
  const scopedBoMonId = useMemo(() => {
    return isBoMonRole ? (user?.username || '') : '';
  }, [isBoMonRole, user?.username]);

  // ─── View mode: 'list' | 'detail' ───
  const [view, setView] = useState('list');
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('lophocphan');

  // ─── Danh mục Khoa & Bộ môn ───
  const [khoaList, setKhoaList] = useState([]);
  const [boMonList, setBoMonList] = useState([]);

  // ─── Dữ liệu đầy đủ (dùng cho TreeView counts & KPI stats) ───
  const [allGvList, setAllGvList] = useState([]);

  // ─── Dữ liệu hiển thị trong bảng ───
  const [gvList, setGvList] = useState([]);
  const [gvLoading, setGvLoading] = useState(false);
  const [gvError, setGvError] = useState('');

  // ─── Bộ lọc & Tree selection ───
  const [selectedKhoaId, setSelectedKhoaId] = useState('');
  const [selectedBoMonId, setSelectedBoMonId] = useState(scopedBoMonId);
  const [selectedGvId, setSelectedGvId] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Modal Thêm / Sửa ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({
    maGiangVien: '',
    hoTen: '',
    email: '',
    soDienThoai: '',
    maBoMon: scopedBoMonId || ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formWarn, setFormWarn] = useState('');

  // ─── Modal Xóa ───
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingGV, setDeletingGV] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ─── Modal Cảnh báo Toggle Trạng thái ───
  const [warnToggle, setWarnToggle] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Cập nhật selectedBoMonId khi user thay đổi
  useEffect(() => {
    if (isBoMonRole && scopedBoMonId) {
      setSelectedBoMonId(scopedBoMonId);
    }
  }, [isBoMonRole, scopedBoMonId]);

  // ─────────────────────────────────────────────────────────────
  // 1. TẢI DANH MỤC BAN ĐẦU (Khoa, Bộ môn, Toàn bộ GV cho tree)
  // ─────────────────────────────────────────────────────────────
  const fetchMetadata = async () => {
    try {
      const [khoas, boMons, allGvs] = await Promise.all([
        apiGetKhoaList().catch(() => []),
        apiGetBoMonList().catch(() => []),
        apiGetGiangVienList(isBoMonRole && scopedBoMonId ? { maBoMon: scopedBoMonId } : {}).catch(() => [])
      ]);
      setKhoaList(khoas || []);
      setBoMonList(boMons || []);
      
      // Nếu là role BOMON, chỉ lấy danh sách GV của bộ môn đó
      let filteredAllGvs = allGvs || [];
      if (isBoMonRole && scopedBoMonId) {
        filteredAllGvs = filteredAllGvs.filter(gv => gv.MaBoMon === scopedBoMonId);
      }
      setAllGvList(filteredAllGvs);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu ban đầu:', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, [isBoMonRole, scopedBoMonId]);

  // ─── Tìm tên đầy đủ của Bộ môn đang thao tác ───
  const departmentFullName = useMemo(() => {
    if (!isBoMonRole || !scopedBoMonId) return '';
    const foundInBm = boMonList.find(b => b.MaBoMon === scopedBoMonId);
    if (foundInBm?.TenBoMon) return foundInBm.TenBoMon;
    const foundInGv = allGvList.find(g => g.MaBoMon === scopedBoMonId);
    if (foundInGv?.TenBoMon) return foundInGv.TenBoMon;
    if (user?.fullName && !user.fullName.toLowerCase().includes('admin')) return user.fullName;
    return scopedBoMonId;
  }, [isBoMonRole, scopedBoMonId, boMonList, allGvList, user?.fullName]);

  // ─────────────────────────────────────────────────────────────
  // 2. FETCH DANH SÁCH GIẢNG VIÊN THEO FILTER
  // ─────────────────────────────────────────────────────────────
  const fetchFilteredGvList = useCallback(async () => {
    setGvLoading(true);
    setGvError('');
    try {
      const effectiveBoMon = isBoMonRole && scopedBoMonId ? scopedBoMonId : selectedBoMonId;
      const data = await apiGetGiangVienList({
        maKhoa: selectedKhoaId,
        maBoMon: effectiveBoMon,
        trangThai: filterTrangThai,
        search: searchQuery
      });

      let results = data || [];
      // Nếu có chọn đích danh 1 giảng viên từ TreeView
      if (selectedGvId) {
        results = results.filter(gv => gv.MaGiangVien === selectedGvId);
      }

      setGvList(results);
    } catch (err) {
      setGvError(err.message || 'Không thể tải danh sách giảng viên.');
    } finally {
      setGvLoading(false);
    }
  }, [selectedKhoaId, selectedBoMonId, selectedGvId, filterTrangThai, searchQuery, isBoMonRole, scopedBoMonId]);

  // Debounce gọi API khi filter thay đổi
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFilteredGvList();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchFilteredGvList]);

  // Refresh cả metadata lẫn filtered data
  const handleRefresh = async () => {
    await fetchMetadata();
    await fetchFilteredGvList();
  };

  // ─────────────────────────────────────────────────────────────
  // 3. TREEVIEW HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleSelectKhoa = (maKhoa) => {
    setSelectedKhoaId(maKhoa);
    setSelectedBoMonId(isBoMonRole ? scopedBoMonId : '');
    setSelectedGvId('');
    setView('list');
  };

  const handleSelectBoMon = (maBoMon) => {
    setSelectedBoMonId(maBoMon);
    setSelectedGvId('');
    setView('list');
  };

  const handleSelectGv = (maGiangVien) => {
    setSelectedGvId(maGiangVien);
    setView('list');
  };

  const handleClearAllFilters = () => {
    setSelectedKhoaId('');
    setSelectedBoMonId(isBoMonRole ? scopedBoMonId : '');
    setSelectedGvId('');
    setFilterTrangThai('');
    setSearchQuery('');
    setView('list');
  };

  // ─────────────────────────────────────────────────────────────
  // 4. DETAIL VIEW HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleViewDetail = async (item) => {
    setDetailLoading(true);
    setView('detail');
    setDetailTab('lophocphan');
    try {
      const data = await apiGetGiangVienChiTiet(item.MaGiangVien);
      setDetailData(data);
    } catch (err) {
      setDetailData({
        giangVien: item,
        lopHocPhanList: [],
        yeuCauNghiList: [],
        dayThayList: [],
        dayBuList: []
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setDetailData(null);
  };

  // ─────────────────────────────────────────────────────────────
  // 5. THÊM / SỬA GIẢNG VIÊN
  // ─────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setModalMode('create');
    const defaultBm = isBoMonRole && scopedBoMonId
      ? scopedBoMonId
      : (selectedBoMonId && selectedBoMonId !== '__NULL__' ? selectedBoMonId : '');

    setFormData({
      maGiangVien: '',
      hoTen: '',
      email: '',
      soDienThoai: '',
      maBoMon: defaultBm
    });
    setFormError('');
    setFormSuccess('');
    setFormWarn('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setFormData({
      maGiangVien: item.MaGiangVien,
      hoTen: item.HoTen,
      email: item.Email || '',
      soDienThoai: item.SoDienThoai || '',
      maBoMon: isBoMonRole && scopedBoMonId ? scopedBoMonId : (item.MaBoMon || '')
    });
    setFormError('');
    setFormSuccess('');
    setFormWarn('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormWarn('');

    if (modalMode === 'create' && !formData.maGiangVien.trim()) {
      setFormError('Vui lòng nhập Mã giảng viên.');
      return;
    }
    if (!formData.hoTen.trim()) {
      setFormError('Vui lòng nhập Họ tên giảng viên.');
      return;
    }

    const payload = {
      ...formData,
      maBoMon: isBoMonRole && scopedBoMonId ? scopedBoMonId : formData.maBoMon
    };

    setFormLoading(true);
    try {
      if (modalMode === 'create') {
        await apiCreateGiangVien(payload);
        setFormSuccess('Thêm giảng viên mới thành công!');
      } else {
        const result = await apiUpdateGiangVien(formData.maGiangVien, {
          hoTen: formData.hoTen,
          email: formData.email,
          soDienThoai: formData.soDienThoai,
          maBoMon: payload.maBoMon
        });
        setFormSuccess('Cập nhật giảng viên thành công!');
        if (result?.warnLanhDao) {
          setFormWarn(
            'Lưu ý: Giảng viên này đang được gán làm Trưởng bộ môn hoặc Trưởng khoa. ' +
            'Vui lòng rà soát lại phân công lãnh đạo sau khi đổi bộ môn.'
          );
        }
      }

      await handleRefresh();

      // Cập nhật lại view chi tiết nếu đang mở chi tiết giảng viên đó
      if (view === 'detail' && detailData?.giangVien?.MaGiangVien === formData.maGiangVien) {
        const updatedDetail = await apiGetGiangVienChiTiet(formData.maGiangVien);
        setDetailData(updatedDetail);
      }

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

  // ─────────────────────────────────────────────────────────────
  // 6. TOGGLE TRẠNG THÁI
  // ─────────────────────────────────────────────────────────────
  const handleToggle = async (item) => {
    setToggleLoading(true);
    try {
      const result = await apiToggleGiangVienTrangThai(item.MaGiangVien);
      if (result.warnHoatDong) {
        setWarnToggle({ message: result.warnHoatDong });
      }
      await handleRefresh();

      if (view === 'detail' && detailData?.giangVien?.MaGiangVien === item.MaGiangVien) {
        const updatedDetail = await apiGetGiangVienChiTiet(item.MaGiangVien);
        setDetailData(updatedDetail);
      }
    } catch (err) {
      setGvError(err.message || 'Đổi trạng thái thất bại.');
    } finally {
      setToggleLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 7. XÓA GIẢNG VIÊN
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
      await handleRefresh();
      setIsDeleteModalOpen(false);
      setDeletingGV(null);
      if (view === 'detail' && detailData?.giangVien?.MaGiangVien === deletingGV.MaGiangVien) {
        setView('list');
        setDetailData(null);
      }
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa giảng viên.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 8. STATS TÍNH TOÁN
  // ─────────────────────────────────────────────────────────────
  const totalActive = allGvList.filter(gv => gv.TrangThai === 'Active').length;
  const totalLinked = allGvList.filter(gv => gv.DaLienKetTaiKhoan).length;
  const totalNoBoMon = allGvList.filter(gv => !gv.MaBoMon).length;

  const selectedGvInfo = selectedGvId
    ? allGvList.find(gv => gv.MaGiangVien === selectedGvId)
    : null;

  return (
    <div className="gv-management-container">
      {/* Page Header */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Giảng Viên</h2>
          <p className="page-subtitle">
            {isBoMonRole
              ? `Hồ sơ đội ngũ giảng viên trực thuộc Bộ môn ${departmentFullName}`
              : 'Hồ sơ đội ngũ giảng viên, cơ cấu phân cấp Khoa - Bộ môn và phân công chuyên môn'}
          </p>
        </div>
        {hasPermission('GiangVien', 'CanCreate') && (
          <button type="button" className="btn-primary-add" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Thêm Giảng viên</span>
          </button>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="admin-stats-grid" style={{ marginBottom: '16px' }}>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{allGvList.length}</div>
            <div className="admin-stat-text">
              {isBoMonRole ? `Giảng viên bộ môn ${departmentFullName}` : 'Tổng số giảng viên'}
            </div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#ecfdf5', color: '#059669' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{totalActive}</div>
            <div className="admin-stat-text">Đang giảng dạy</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Link size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{totalLinked}</div>
            <div className="admin-stat-text">Có tài khoản liên kết</div>
          </div>
        </div>

        {!isBoMonRole && (
          <div className="admin-stat-item">
            <div className="admin-stat-icon-bg" style={{ background: '#fff7ed', color: '#ea580c' }}>
              <Network size={24} />
            </div>
            <div>
              <div className="admin-stat-number">{totalNoBoMon}</div>
              <div className="admin-stat-text">Chưa phân bộ môn</div>
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Column Split Layout: TreeView (Left) + Content (Right) */}
      <div className="gv-page-layout">
        {/* 1. LEFT PANEL: TreeView Hierarchy */}
        <GiangVienTreeView
          khoaList={khoaList}
          boMonList={boMonList}
          giangVienList={allGvList}
          selectedKhoaId={selectedKhoaId}
          selectedBoMonId={selectedBoMonId}
          selectedGvId={selectedGvId}
          onSelectKhoa={handleSelectKhoa}
          onSelectBoMon={handleSelectBoMon}
          onSelectGv={handleSelectGv}
          filterTrangThai={filterTrangThai}
          setFilterTrangThai={setFilterTrangThai}
          isBoMonRole={isBoMonRole}
          scopedBoMonId={scopedBoMonId}
          departmentFullName={departmentFullName}
        />

        {/* 2. RIGHT PANEL: Content Area (Filter Bar + Table / Detail View) */}
        <main className="gv-main-content">
          {view === 'detail' ? (
            <GiangVienDetailView
              detailData={detailData}
              loading={detailLoading}
              activeTab={detailTab}
              setActiveTab={setDetailTab}
              onBack={handleBackToList}
              onEdit={handleOpenEdit}
              hasPermission={hasPermission}
            />
          ) : (
            <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Filter & Context Bar */}
              <GiangVienFilterBar
                khoaList={khoaList}
                boMonList={boMonList}
                filterKhoa={selectedKhoaId}
                setFilterKhoa={setSelectedKhoaId}
                filterBoMon={selectedBoMonId}
                setFilterBoMon={setSelectedBoMonId}
                filterTrangThai={filterTrangThai}
                setFilterTrangThai={setFilterTrangThai}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onRefresh={handleRefresh}
                loading={gvLoading}
                totalCount={gvList.length}
                selectedGvInfo={selectedGvInfo}
                onClearSelection={handleClearAllFilters}
                isBoMonRole={isBoMonRole}
                scopedBoMonId={scopedBoMonId}
                departmentFullName={departmentFullName}
              />

              {/* Data Table */}
              <GiangVienTable
                gvList={gvList}
                loading={gvLoading}
                error={gvError}
                selectedGvId={selectedGvId}
                onViewDetail={handleViewDetail}
                onEdit={handleOpenEdit}
                onToggle={handleToggle}
                onDelete={handleOpenDelete}
                toggleLoading={toggleLoading}
                hasPermission={hasPermission}
              />
            </div>
          )}
        </main>
      </div>

      {/* ══════════ MODAL: Thêm / Sửa Giảng Viên ══════════ */}
      <GiangVienFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        formData={formData}
        setFormData={setFormData}
        khoaList={khoaList}
        boMonList={boMonList}
        onClose={() => {
          setIsModalOpen(false);
          setFormWarn('');
          setFormSuccess('');
          setFormError('');
        }}
        onSubmit={handleFormSubmit}
        loading={formLoading}
        error={formError}
        success={formSuccess}
        warning={formWarn}
        isBoMonRole={isBoMonRole}
        scopedBoMonId={scopedBoMonId}
      />

      {/* ══════════ MODAL: Xác nhận Xóa Giảng Viên ══════════ */}
      {isDeleteModalOpen && deletingGV && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldAlert size={18} />
                </div>
                <h3 className="modal-title" style={{ margin: 0 }}>Xác Nhận Xóa Giảng Viên</h3>
              </div>
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setDeletingGV(null); }}
                className="modal-close-btn"
              >
                ×
              </button>
            </div>

            {deleteError && (
              <div className="alert-banner error" style={{ margin: '12px 0' }}>
                <AlertCircle size={18} />
                <span>{deleteError}</span>
              </div>
            )}

            <div style={{ padding: '16px 0', fontSize: '0.9rem', color: '#334155', lineHeight: '1.6' }}>
              Bạn có chắc chắn muốn xóa giảng viên{' '}
              <strong style={{ color: '#0f172a' }}>{deletingGV.HoTen}</strong> (Mã:{' '}
              <span className="gv-code-badge">{deletingGV.MaGiangVien}</span>)?
              <div style={{ marginTop: '10px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b' }}>
                ⚠️ Hệ thống sẽ kiểm tra toàn diện 7 bảng liên quan (Trưởng khoa, Trưởng bộ môn, Lớp học phần, Buổi học, Yêu cầu nghỉ, Dạy thay, Dạy bù) trước khi xóa.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => { setIsDeleteModalOpen(false); setDeletingGV(null); }}
                disabled={deleteLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-delete-confirm"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" /> Đang kiểm tra & xóa...
                  </span>
                ) : (
                  'Xóa Giảng Viên'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: Cảnh báo khi Toggle Trạng thái ══════════ */}
      {warnToggle && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#fffbeb',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertCircle size={18} />
                </div>
                <h3 className="modal-title" style={{ margin: 0 }}>Cảnh Báo Hoạt Động</h3>
              </div>
              <button type="button" onClick={() => setWarnToggle(null)} className="modal-close-btn">
                ×
              </button>
            </div>

            <div style={{ padding: '16px 0', fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}>
              {warnToggle.message}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setWarnToggle(null)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
