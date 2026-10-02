import React, { useState, useEffect, useCallback } from 'react';
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
  const { hasPermission } = useAuth();

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
  const [selectedBoMonId, setSelectedBoMonId] = useState('');
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
    maBoMon: ''
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

  // ─────────────────────────────────────────────────────────────
  // 1. TẢI DANH MỤC BAN ĐẦU (Khoa, Bộ môn, Toàn bộ GV cho tree)
  // ─────────────────────────────────────────────────────────────
  const fetchMetadata = async () => {
    try {
      const [khoas, boMons, allGvs] = await Promise.all([
        apiGetKhoaList().catch(() => []),
        apiGetBoMonList().catch(() => []),
        apiGetGiangVienList().catch(() => [])
      ]);
      setKhoaList(khoas || []);
      setBoMonList(boMons || []);
      setAllGvList(allGvs || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu ban đầu:', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 2. FETCH DANH SÁCH GIẢNG VIÊN THEO FILTER
  // ─────────────────────────────────────────────────────────────
  const fetchFilteredGvList = useCallback(async () => {
    setGvLoading(true);
    setGvError('');
    try {
      const data = await apiGetGiangVienList({
        maKhoa: selectedKhoaId,
        maBoMon: selectedBoMonId,
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
  }, [selectedKhoaId, selectedBoMonId, selectedGvId, filterTrangThai, searchQuery]);

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
    setSelectedBoMonId('');
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
    setSelectedBoMonId('');
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
    setFormData({
      maGiangVien: '',
      hoTen: '',
      email: '',
      soDienThoai: '',
      maBoMon: selectedBoMonId && selectedBoMonId !== '__NULL__' ? selectedBoMonId : ''
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
      maBoMon: item.MaBoMon || ''
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
            Hồ sơ đội ngũ giảng viên, cơ cấu phân cấp Khoa - Bộ môn và phân công chuyên môn
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
            <div className="admin-stat-text">Tổng số giảng viên</div>
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
      />

      {/* ══════════ MODAL: Xóa Giảng Viên ══════════ */}
      {isDeleteModalOpen && deletingGV && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card modal-delete-card">
            <div className="delete-icon-wrapper">
              <ShieldAlert size={32} />
            </div>
            <h3 className="delete-modal-title">Xác Nhận Xóa Giảng Viên</h3>
            <p className="delete-modal-desc">
              Bạn có chắc muốn xóa giảng viên{' '}
              <b style={{ color: 'var(--admin-text-main)' }}>
                {deletingGV.HoTen} ({deletingGV.MaGiangVien})
              </b>{' '}
              không?
            </p>
            <div className="alert-banner warning" style={{ textAlign: 'left', marginBottom: '16px', fontSize: '0.83rem' }}>
              <AlertCircle size={16} />
              <span>
                Hệ thống sẽ kiểm tra toàn bộ dữ liệu liên kết trước khi xóa. Nếu giảng viên đã từng có lớp học phần,
                buổi học hoặc yêu cầu nghỉ, hệ thống sẽ từ chối xóa nhằm bảo toàn tính toàn vẹn dữ liệu. Hãy sử dụng tùy chọn "Tạm dừng" thay thế.
              </span>
            </div>
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
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: Cảnh báo Toggle Trạng thái ══════════ */}
      {warnToggle && (
        <div className="gv-warn-overlay" style={{ zIndex: 1000 }}>
          <div className="gv-warn-card">
            <div className="gv-warn-icon">
              <AlertCircle size={26} />
            </div>
            <h3 className="gv-warn-title">Thông báo trạng thái công tác</h3>
            <p className="gv-warn-desc">{warnToggle.message}</p>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-save"
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
