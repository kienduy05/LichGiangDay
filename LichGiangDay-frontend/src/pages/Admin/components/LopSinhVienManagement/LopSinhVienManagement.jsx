import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  Users, School, BookMarked, Plus, AlertCircle,
  ShieldAlert, Loader2
} from 'lucide-react';
import {
  apiGetLopSinhVienList,
  apiGetLopSinhVienChiTiet,
  apiCreateLopSinhVien,
  apiUpdateLopSinhVien,
  apiDeleteLopSinhVien,
  apiGetKhoaList
} from '../../../../utils/api';
import LopSinhVienTreeView from './LopSinhVienTreeView';
import LopSinhVienFilterBar from './LopSinhVienFilterBar';
import LopSinhVienTable from './LopSinhVienTable';
import LopSinhVienDetailView from './LopSinhVienDetailView';
import LopSinhVienFormModal from './LopSinhVienFormModal';
import './LopSinhVienManagement.css';
import './LopSinhVienComponents.css';

export default function LopSinhVienManagement() {
  const { hasPermission } = useAuth();

  // ─── View mode: 'list' | 'detail' ───
  const [view, setView] = useState('list');
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Danh mục Khoa ───
  const [khoaList, setKhoaList] = useState([]);

  // ─── Dữ liệu đầy đủ (TreeView counts & KPI stats) ───
  const [allLsvList, setAllLsvList] = useState([]);

  // ─── Dữ liệu hiển thị trong bảng ───
  const [lsvList, setLsvList] = useState([]);
  const [lsvLoading, setLsvLoading] = useState(false);
  const [lsvError, setLsvError] = useState('');

  // ─── Bộ lọc & Tree selection ───
  const [selectedKhoaId, setSelectedKhoaId] = useState('');
  const [selectedLsvId, setSelectedLsvId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Modal Thêm / Sửa ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({
    maLopSinhVien: '',
    tenLopSinhVien: '',
    maKhoa: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // ─── Modal Xóa ───
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingLSV, setDeletingLSV] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ─────────────────────────────────────────────────────────────
  // 1. TẢI DANH MỤC BAN ĐẦU (Khoa & Toàn bộ Lớp cho TreeView)
  // ─────────────────────────────────────────────────────────────
  const fetchMetadata = async () => {
    try {
      const [khoas, allLsvs] = await Promise.all([
        apiGetKhoaList().catch(() => []),
        apiGetLopSinhVienList().catch(() => [])
      ]);
      setKhoaList(khoas || []);
      setAllLsvList(allLsvs || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu lớp sinh viên:', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 2. FETCH DANH SÁCH LỚP SINH VIÊN THEO FILTER
  // ─────────────────────────────────────────────────────────────
  const fetchFilteredList = useCallback(async () => {
    setLsvLoading(true);
    setLsvError('');
    try {
      const data = await apiGetLopSinhVienList({
        maKhoa: selectedKhoaId,
        search: searchQuery
      });

      let results = data || [];
      if (selectedLsvId) {
        results = results.filter(l => l.MaLopSinhVien === selectedLsvId);
      }

      setLsvList(results);
    } catch (err) {
      setLsvError(err.message || 'Không thể tải danh sách lớp sinh viên.');
    } finally {
      setLsvLoading(false);
    }
  }, [selectedKhoaId, selectedLsvId, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFilteredList();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchFilteredList]);

  const handleRefresh = async () => {
    await fetchMetadata();
    await fetchFilteredList();
  };

  // ─────────────────────────────────────────────────────────────
  // 3. TREEVIEW HANDLERS (1 CẤP LÀ KHOA)
  // ─────────────────────────────────────────────────────────────
  const handleSelectKhoa = (maKhoa) => {
    setSelectedKhoaId(maKhoa);
    setSelectedLsvId('');
    setView('list');
  };

  const handleSelectLsv = (maLopSinhVien) => {
    setSelectedLsvId(maLopSinhVien);
    setView('list');
  };

  const handleClearAllFilters = () => {
    setSelectedKhoaId('');
    setSelectedLsvId('');
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
      const data = await apiGetLopSinhVienChiTiet(item.MaLopSinhVien);
      setDetailData(data);
    } catch {
      setDetailData({ lopSinhVien: item, lopHocPhanList: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setDetailData(null);
  };

  // ─────────────────────────────────────────────────────────────
  // 5. THÊM / SỬA LỚP SINH VIÊN
  // ─────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      maLopSinhVien: '',
      tenLopSinhVien: '',
      maKhoa: selectedKhoaId && selectedKhoaId !== '__NULL__' ? selectedKhoaId : ''
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setFormData({
      maLopSinhVien: item.MaLopSinhVien,
      tenLopSinhVien: item.TenLopSinhVien,
      maKhoa: item.MaKhoa || ''
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (modalMode === 'create' && !formData.maLopSinhVien.trim()) {
      setFormError('Vui lòng nhập Mã lớp sinh viên.');
      return;
    }
    if (!formData.tenLopSinhVien.trim()) {
      setFormError('Vui lòng nhập Tên lớp sinh viên.');
      return;
    }
    if (!formData.maKhoa) {
      setFormError('Vui lòng chọn Khoa quản lý.');
      return;
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

      await handleRefresh();

      if (view === 'detail' && detailData?.lopSinhVien?.MaLopSinhVien === formData.maLopSinhVien) {
        const updatedDetail = await apiGetLopSinhVienChiTiet(formData.maLopSinhVien);
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
  // 6. XÓA LỚP SINH VIÊN
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
      await handleRefresh();
      setIsDeleteModalOpen(false);
      setDeletingLSV(null);
      if (view === 'detail' && detailData?.lopSinhVien?.MaLopSinhVien === deletingLSV.MaLopSinhVien) {
        setView('list');
        setDetailData(null);
      }
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa lớp sinh viên.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 7. KPI STATS
  // ─────────────────────────────────────────────────────────────
  const tongLopHP = allLsvList.reduce((s, l) => s + (l.SoLopHocPhan || 0), 0);
  const soKhoa = new Set(allLsvList.map(l => l.MaKhoa).filter(Boolean)).size;

  const selectedLsvInfo = selectedLsvId
    ? allLsvList.find(l => l.MaLopSinhVien === selectedLsvId)
    : null;

  return (
    <div className="lsv-management-container">
      {/* Page Header */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Lớp Sinh Viên</h2>
          <p className="page-subtitle">
            Danh sách lớp sinh viên, khoa trực thuộc và tình hình tham gia các lớp học phần
          </p>
        </div>
        {hasPermission('LopSinhVien', 'CanCreate') && (
          <button type="button" className="btn-primary-add" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Thêm Lớp sinh viên</span>
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
            <div className="admin-stat-number">{allLsvList.length}</div>
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

      {/* Main 2-Column Split Layout: TreeView (Left) + Content (Right) */}
      <div className="lsv-page-layout">
        {/* 1. LEFT PANEL: TreeView 1 cấp là Khoa */}
        <LopSinhVienTreeView
          khoaList={khoaList}
          lsvList={allLsvList}
          selectedKhoaId={selectedKhoaId}
          selectedLsvId={selectedLsvId}
          onSelectKhoa={handleSelectKhoa}
          onSelectLsv={handleSelectLsv}
        />

        {/* 2. RIGHT PANEL: Content Area */}
        <main className="lsv-main-content">
          {view === 'detail' ? (
            <LopSinhVienDetailView
              detailData={detailData}
              loading={detailLoading}
              onBack={handleBackToList}
              onEdit={handleOpenEdit}
              hasPermission={hasPermission}
            />
          ) : (
            <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Filter & Context Bar */}
              <LopSinhVienFilterBar
                khoaList={khoaList}
                filterKhoa={selectedKhoaId}
                setFilterKhoa={setSelectedKhoaId}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onRefresh={handleRefresh}
                loading={lsvLoading}
                totalCount={lsvList.length}
                selectedLsvInfo={selectedLsvInfo}
                onClearSelection={handleClearAllFilters}
              />

              {/* Data Table */}
              <LopSinhVienTable
                lsvList={lsvList}
                loading={lsvLoading}
                error={lsvError}
                selectedLsvId={selectedLsvId}
                onViewDetail={handleViewDetail}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                hasPermission={hasPermission}
              />
            </div>
          )}
        </main>
      </div>

      {/* ══════════ MODAL: Thêm / Sửa Lớp Sinh Viên ══════════ */}
      <LopSinhVienFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        formData={formData}
        setFormData={setFormData}
        khoaList={khoaList}
        onClose={() => {
          setIsModalOpen(false);
          setFormSuccess('');
          setFormError('');
        }}
        onSubmit={handleFormSubmit}
        loading={formLoading}
        error={formError}
        success={formSuccess}
      />

      {/* ══════════ MODAL: Xóa Lớp Sinh Viên ══════════ */}
      {isDeleteModalOpen && deletingLSV && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper">
              <ShieldAlert size={32} />
            </div>
            <h3 className="delete-modal-title">Xác Nhận Xóa Lớp Sinh Viên</h3>
            <p className="delete-modal-desc">
              Bạn có chắc muốn xóa lớp sinh viên{' '}
              <b style={{ color: 'var(--admin-text-main)' }}>
                {deletingLSV.TenLopSinhVien} ({deletingLSV.MaLopSinhVien})
              </b>{' '}
              không?
            </p>

            {(deletingLSV.SoLopHocPhan || 0) > 0 && (
              <div className="alert-banner error" style={{ textAlign: 'left', marginBottom: '16px', fontSize: '0.84rem' }}>
                <AlertCircle size={16} />
                <span>
                  Lớp sinh viên này hiện đang tham gia <b>{deletingLSV.SoLopHocPhan}</b> lớp học phần. Không thể xóa nhằm đảm bảo toàn vẹn dữ liệu.
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

              {(deletingLSV.SoLopHocPhan || 0) === 0 && (
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
