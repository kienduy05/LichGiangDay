import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  BookOpen, BookMarked, Network, Plus, AlertCircle,
  ShieldAlert, Loader2, Layers
} from 'lucide-react';
import {
  apiGetMonHocList,
  apiGetMonHocChiTiet,
  apiCreateMonHoc,
  apiUpdateMonHoc,
  apiDeleteMonHoc,
  apiGetKhoaList,
  apiGetBoMonList
} from '../../../../utils/api';
import MonHocTreeView from './MonHocTreeView';
import MonHocFilterBar from './MonHocFilterBar';
import MonHocTable from './MonHocTable';
import MonHocDetailView from './MonHocDetailView';
import MonHocFormModal from './MonHocFormModal';
import './MonHocManagement.css';
import './MonHocComponents.css';

export default function MonHocManagement() {
  const { user, hasPermission } = useAuth();

  // ─── Phân quyền dữ liệu theo vai trò Bộ môn (Role: BOMON) ───
  const isBoMonRole = user?.role === 'BOMON';
  const scopedBoMonId = isBoMonRole ? (user?.username || '') : '';

  // ─── View mode: 'list' | 'detail' ───
  const [view, setView] = useState('list');
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Danh mục Khoa & Bộ môn ───
  const [khoaList, setKhoaList] = useState([]);
  const [boMonList, setBoMonList] = useState([]);

  // ─── Dữ liệu đầy đủ (dùng cho TreeView counts & KPI stats) ───
  const [allMhList, setAllMhList] = useState([]);

  // ─── Dữ liệu hiển thị trong bảng ───
  const [mhList, setMhList] = useState([]);
  const [mhLoading, setMhLoading] = useState(false);
  const [mhError, setMhError] = useState('');

  // ─── Bộ lọc & Tree selection ───
  const [selectedKhoaId, setSelectedKhoaId] = useState('');
  const [selectedBoMonId, setSelectedBoMonId] = useState(isBoMonRole ? scopedBoMonId : '');
  const [selectedMhId, setSelectedMhId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Đồng bộ selectedBoMonId khi scopedBoMonId thay đổi
  useEffect(() => {
    if (isBoMonRole && scopedBoMonId) {
      setSelectedBoMonId(scopedBoMonId);
    }
  }, [isBoMonRole, scopedBoMonId]);

  // Tìm tên đầy đủ của Bộ môn đang đăng nhập
  const departmentFullName = useMemo(() => {
    if (!isBoMonRole || !scopedBoMonId) return '';
    const found = boMonList.find(b => b.MaBoMon === scopedBoMonId);
    if (found?.TenBoMon) return found.TenBoMon;
    const foundInMh = allMhList.find(m => m.MaBoMon === scopedBoMonId);
    if (foundInMh?.TenBoMon) return foundInMh.TenBoMon;
    return user?.fullName || `Bộ môn ${scopedBoMonId}`;
  }, [isBoMonRole, scopedBoMonId, boMonList, allMhList, user?.fullName]);

  // ─── Modal Thêm / Sửa ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({
    maMonHoc: '',
    tenMonHoc: '',
    soTinChi: '',
    maBoMon: isBoMonRole ? scopedBoMonId : '',
    loaiMonHoc: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // ─── Modal Xóa ───
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMH, setDeletingMH] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ─────────────────────────────────────────────────────────────
  // 1. TẢI DANH MỤC BAN ĐẦU (Khoa, Bộ môn, Toàn bộ Môn học cho tree)
  // ─────────────────────────────────────────────────────────────
  const fetchMetadata = async () => {
    try {
      const [khoas, boMons, allMhs] = await Promise.all([
        apiGetKhoaList().catch(() => []),
        apiGetBoMonList().catch(() => []),
        apiGetMonHocList().catch(() => [])
      ]);
      setKhoaList(khoas || []);
      setBoMonList(boMons || []);
      setAllMhList(allMhs || []);
    } catch (err) {
      console.error('Lỗi khi tải metadata môn học:', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 2. FETCH DANH SÁCH MÔN HỌC THEO FILTER
  // ─────────────────────────────────────────────────────────────
  const fetchFilteredMhList = useCallback(async () => {
    setMhLoading(true);
    setMhError('');
    try {
      const effectiveBoMon = isBoMonRole ? scopedBoMonId : selectedBoMonId;
      const effectiveKhoa = isBoMonRole ? '' : selectedKhoaId;

      const data = await apiGetMonHocList({
        maKhoa: effectiveKhoa,
        maBoMon: effectiveBoMon,
        search: searchQuery
      });

      let results = data || [];
      if (selectedMhId) {
        results = results.filter(mh => mh.MaMonHoc === selectedMhId);
      }

      setMhList(results);
    } catch (err) {
      setMhError(err.message || 'Không thể tải danh sách môn học.');
    } finally {
      setMhLoading(false);
    }
  }, [selectedKhoaId, selectedBoMonId, selectedMhId, searchQuery, isBoMonRole, scopedBoMonId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFilteredMhList();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchFilteredMhList]);

  const handleRefresh = async () => {
    await fetchMetadata();
    await fetchFilteredMhList();
  };

  // ─────────────────────────────────────────────────────────────
  // 3. TREEVIEW HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleSelectKhoa = (maKhoa) => {
    setSelectedKhoaId(maKhoa);
    setSelectedBoMonId(isBoMonRole ? scopedBoMonId : '');
    setSelectedMhId('');
    setView('list');
  };

  const handleSelectBoMon = (maBoMon) => {
    setSelectedBoMonId(maBoMon);
    setSelectedMhId('');
    setView('list');
  };

  const handleSelectMh = (maMonHoc) => {
    setSelectedMhId(maMonHoc);
    setView('list');
  };

  const handleClearAllFilters = () => {
    setSelectedKhoaId('');
    setSelectedBoMonId(isBoMonRole ? scopedBoMonId : '');
    setSelectedMhId('');
    setSearchQuery('');
    setView('list');
  };

  // ─────────────────────────────────────────────────────────────
  // 4. DETAIL VIEW HANDLERS
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
  // 5. THÊM / SỬA MÔN HỌC
  // ─────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      maMonHoc: '',
      tenMonHoc: '',
      soTinChi: '',
      maBoMon: isBoMonRole ? scopedBoMonId : (selectedBoMonId && selectedBoMonId !== '__NULL__' ? selectedBoMonId : ''),
      loaiMonHoc: ''
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setFormData({
      maMonHoc: item.MaMonHoc,
      tenMonHoc: item.TenMonHoc,
      soTinChi: item.SoTinChi !== null && item.SoTinChi !== undefined ? String(item.SoTinChi) : '',
      maBoMon: isBoMonRole ? scopedBoMonId : (item.MaBoMon || ''),
      loaiMonHoc: item.LoaiMonHoc || ''
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (modalMode === 'create' && !formData.maMonHoc.trim()) {
      setFormError('Vui lòng nhập Mã môn học.');
      return;
    }
    if (!formData.tenMonHoc.trim()) {
      setFormError('Vui lòng nhập Tên môn học.');
      return;
    }
    if (!formData.maBoMon) {
      setFormError('Vui lòng chọn Bộ môn quản lý.');
      return;
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

      await handleRefresh();

      if (view === 'detail' && detailData?.monHoc?.MaMonHoc === formData.maMonHoc) {
        const updatedDetail = await apiGetMonHocChiTiet(formData.maMonHoc);
        setDetailData(updatedDetail);
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess('');
      }, 900);
    } catch (err) {
      setFormError(err.message || 'Thao tác thất bại.');
    } finally {
      setFormLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 6. XÓA MÔN HỌC
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
      await handleRefresh();
      setIsDeleteModalOpen(false);
      setDeletingMH(null);
      if (view === 'detail' && detailData?.monHoc?.MaMonHoc === deletingMH.MaMonHoc) {
        setView('list');
        setDetailData(null);
      }
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa môn học.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 7. KPI STATS (Tự động tính theo phạm vi Bộ môn nếu role = BOMON)
  // ─────────────────────────────────────────────────────────────
  const displayedAllMh = useMemo(() => {
    if (isBoMonRole && scopedBoMonId) {
      return allMhList.filter(mh => mh.MaBoMon === scopedBoMonId);
    }
    return allMhList;
  }, [allMhList, isBoMonRole, scopedBoMonId]);

  const totalTC = displayedAllMh.reduce((s, m) => s + (m.SoTinChi || 0), 0);
  const coBoMon = displayedAllMh.filter(m => m.MaBoMon).length;
  const coLopHP = displayedAllMh.filter(m => (m.SoLopHocPhan || 0) > 0).length;

  const selectedMhInfo = selectedMhId
    ? displayedAllMh.find(mh => mh.MaMonHoc === selectedMhId)
    : null;

  return (
    <div className="mh-management-container">
      {/* Page Header */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Môn Học</h2>
          <p className="page-subtitle">
            {isBoMonRole && departmentFullName
              ? `Danh mục môn học và lớp học phần thuộc ${departmentFullName}`
              : 'Danh mục môn học, số tín chỉ định lượng và tình hình tổ chức lớp học phần'}
          </p>
        </div>
        {hasPermission('MonHoc', 'CanCreate') && (
          <button type="button" className="btn-primary-add" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Thêm Môn học</span>
          </button>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="admin-stats-grid" style={{ marginBottom: '16px' }}>
        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{displayedAllMh.length}</div>
            <div className="admin-stat-text">{isBoMonRole ? 'Môn học của bộ môn' : 'Tổng số môn học'}</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#ecfdf5', color: '#059669' }}>
            <BookMarked size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{totalTC}</div>
            <div className="admin-stat-text">Tổng số tín chỉ</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Network size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{coBoMon}</div>
            <div className="admin-stat-text">{isBoMonRole ? 'Đúng mã bộ môn' : 'Có bộ môn quản lý'}</div>
          </div>
        </div>

        <div className="admin-stat-item">
          <div className="admin-stat-icon-bg" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <Layers size={24} />
          </div>
          <div>
            <div className="admin-stat-number">{coLopHP}</div>
            <div className="admin-stat-text">Đang có lớp học phần</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split Layout: TreeView (Left) + Content (Right) */}
      <div className="mh-page-layout">
        {/* 1. LEFT PANEL: TreeView Hierarchy */}
        <MonHocTreeView
          khoaList={khoaList}
          boMonList={boMonList}
          monHocList={allMhList}
          selectedKhoaId={selectedKhoaId}
          selectedBoMonId={selectedBoMonId}
          selectedMhId={selectedMhId}
          onSelectKhoa={handleSelectKhoa}
          onSelectBoMon={handleSelectBoMon}
          onSelectMh={handleSelectMh}
          isBoMonRole={isBoMonRole}
          scopedBoMonId={scopedBoMonId}
          departmentFullName={departmentFullName}
        />

        {/* 2. RIGHT PANEL: Content Area */}
        <main className="mh-main-content">
          {view === 'detail' ? (
            <MonHocDetailView
              detailData={detailData}
              loading={detailLoading}
              onBack={handleBackToList}
              onEdit={handleOpenEdit}
              hasPermission={hasPermission}
            />
          ) : (
            <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Filter & Context Bar */}
              <MonHocFilterBar
                khoaList={khoaList}
                boMonList={boMonList}
                filterKhoa={selectedKhoaId}
                setFilterKhoa={setSelectedKhoaId}
                filterBoMon={selectedBoMonId}
                setFilterBoMon={setSelectedBoMonId}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onRefresh={handleRefresh}
                loading={mhLoading}
                totalCount={mhList.length}
                selectedMhInfo={selectedMhInfo}
                onClearSelection={handleClearAllFilters}
                isBoMonRole={isBoMonRole}
                scopedBoMonId={scopedBoMonId}
                departmentFullName={departmentFullName}
              />

              {/* Data Table */}
              <MonHocTable
                mhList={mhList}
                loading={mhLoading}
                error={mhError}
                selectedMhId={selectedMhId}
                onViewDetail={handleViewDetail}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                hasPermission={hasPermission}
              />
            </div>
          )}
        </main>
      </div>

      {/* ══════════ MODAL: Thêm / Sửa Môn Học ══════════ */}
      <MonHocFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        formData={formData}
        setFormData={setFormData}
        khoaList={khoaList}
        boMonList={boMonList}
        onClose={() => {
          setIsModalOpen(false);
          setFormSuccess('');
          setFormError('');
        }}
        onSubmit={handleFormSubmit}
        loading={formLoading}
        error={formError}
        success={formSuccess}
        isBoMonRole={isBoMonRole}
        scopedBoMonId={scopedBoMonId}
        departmentFullName={departmentFullName}
      />

      {/* ══════════ MODAL: Xóa Môn Học ══════════ */}
      {isDeleteModalOpen && deletingMH && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper">
              <ShieldAlert size={32} />
            </div>
            <h3 className="delete-modal-title">Xác Nhận Xóa Môn Học</h3>
            <p className="delete-modal-desc">
              Bạn có chắc muốn xóa môn học{' '}
              <b style={{ color: 'var(--admin-text-main)' }}>
                {deletingMH.TenMonHoc} ({deletingMH.MaMonHoc})
              </b>{' '}
              không?
            </p>

            {(deletingMH.SoLopHocPhan || 0) > 0 && (
              <div className="alert-banner error" style={{ textAlign: 'left', marginBottom: '16px', fontSize: '0.84rem' }}>
                <AlertCircle size={16} />
                <span>
                  Môn học này hiện đang có <b>{deletingMH.SoLopHocPhan}</b> lớp học phần được mở trong hệ thống. Bạn không thể xóa môn học này.
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
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteError('');
                }}
                className="btn-cancel"
                disabled={deleteLoading}
              >
                Hủy
              </button>

              {(deletingMH.SoLopHocPhan || 0) === 0 && (
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="btn-delete"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={16} className="animate-spin" /> Đang xóa...
                    </span>
                  ) : (
                    'Xác Nhận Xóa'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
