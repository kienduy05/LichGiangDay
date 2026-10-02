import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  BookMarked, Plus, AlertCircle, Loader2, ShieldAlert, CheckCircle2,
  BookOpen, Hash, GraduationCap, Calendar, Layers
} from 'lucide-react';
import {
  apiGetLopHocPhanList,
  apiGetLopHocPhanChiTiet,
  apiCreateLopHocPhan,
  apiUpdateLopHocPhan,
  apiDeleteLopHocPhan,
  apiImportLopHocPhan,
  apiExportLopHocPhan
} from '../../../../utils/apiLopHocPhan';
import {
  apiGetKhoaList,
  apiGetBoMonList,
  apiGetHocKyList,
  apiGetMonHocList,
  apiGetKhoaSinhVienList
} from '../../../../utils/api';

import LopHocPhanTreeView from './LopHocPhanTreeView';
import LopHocPhanFilterBar from './LopHocPhanFilterBar';
import LopHocPhanTable from './LopHocPhanTable';
import LopHocPhanFormModal from './LopHocPhanFormModal';
import LopHocPhanDetailView from './LopHocPhanDetailView';
import LopHocPhanImportExport from './LopHocPhanImportExport';

import './LopHocPhanManagement.css';
import './LopHocPhanComponents.css';

const EMPTY_FORM = {
  maLopHocPhan: '',
  tenLopHocPhan: '',
  maMonHoc: '',
  maHocKy: '',
  loaiHoc: '',
  maBoMon: '',
  siSoDuKien: '',
  siSoDangKy: '',
  khoaHoc: '',
  ngayBatDau: '',
  ngayKetThuc: '',
  soTuan: ''
};

export default function LopHocPhanManagement() {
  const { hasPermission } = useAuth();

  // ─── View: 'list' | 'detail' ───
  const [view, setView] = useState('list');
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Lookup data ───
  const [hocKyList, setHocKyList] = useState([]);
  const [khoaList, setKhoaList] = useState([]);
  const [boMonList, setBoMonList] = useState([]);
  const [monHocList, setMonHocList] = useState([]);
  const [khoaSinhVienList, setKhoaSinhVienList] = useState([]);

  // ─── Học kỳ đang chọn ───
  const [filterHocKy, setFilterHocKy] = useState('');

  // ─── Toàn bộ LHP trong học kỳ (dùng cho TreeView counts & KPI stats) ───
  const [allLhpList, setAllLhpList] = useState([]);

  // ─── Danh sách LHP hiển thị trong bảng sau khi lọc ───
  const [lhpList, setLhpList] = useState([]);
  const [lhpLoading, setLhpLoading] = useState(false);
  const [lhpError, setLhpError] = useState('');

  // ─── Treeview Selection Filters ───
  const [selectedKhoaId, setSelectedKhoaId] = useState('');
  const [selectedBoMonId, setSelectedBoMonId] = useState('');
  const [selectedMonHocId, setSelectedMonHocId] = useState('');
  const [filterLoaiHoc, setFilterLoaiHoc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Modal Thêm / Sửa ───
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // ─── Modal Xóa ───
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ─── Import/Export ───
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // ═══════════════════════════════════════════════
  // 1. FETCH LOOKUPS BAN ĐẦU
  // ═══════════════════════════════════════════════
  const fetchLookups = async () => {
    try {
      const [hk, k, bm, mh, ksv] = await Promise.all([
        apiGetHocKyList().catch(() => []),
        apiGetKhoaList().catch(() => []),
        apiGetBoMonList().catch(() => []),
        apiGetMonHocList().catch(() => []),
        apiGetKhoaSinhVienList().catch(() => [])
      ]);
      setHocKyList(hk || []);
      setKhoaList(k || []);
      setBoMonList(bm || []);
      setMonHocList(mh || []);
      setKhoaSinhVienList(ksv || []);

      // Mặc định chọn học kỳ đầu tiên nếu chưa có
      if (hk && hk.length > 0 && !filterHocKy) {
        setFilterHocKy(hk[0].MaHocKy);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  // ═══════════════════════════════════════════════
  // 2. FETCH TOÀN BỘ LHP CHO HỌC KỲ (TREEVIEW + STATS)
  // ═══════════════════════════════════════════════
  const fetchAllLhpForSemester = useCallback(async () => {
    if (!filterHocKy) {
      setAllLhpList([]);
      return;
    }
    try {
      const data = await apiGetLopHocPhanList({ maHocKy: filterHocKy });
      setAllLhpList(data || []);
    } catch {
      setAllLhpList([]);
    }
  }, [filterHocKy]);

  useEffect(() => {
    fetchAllLhpForSemester();
  }, [fetchAllLhpForSemester]);

  // ═══════════════════════════════════════════════
  // 3. FETCH DANH SÁCH LHP THEO FILTER BẢNG
  // ═══════════════════════════════════════════════
  const fetchList = useCallback(async () => {
    if (!filterHocKy) {
      setLhpList([]);
      return;
    }
    setLhpLoading(true);
    setLhpError('');
    try {
      const data = await apiGetLopHocPhanList({
        maHocKy: filterHocKy,
        maKhoa: selectedKhoaId,
        maBoMon: selectedBoMonId,
        maMonHoc: selectedMonHocId,
        loaiHoc: filterLoaiHoc,
        search: searchQuery
      });
      setLhpList(data || []);
    } catch (err) {
      setLhpError(err.message || 'Không thể tải danh sách lớp học phần.');
    } finally {
      setLhpLoading(false);
    }
  }, [filterHocKy, selectedKhoaId, selectedBoMonId, selectedMonHocId, filterLoaiHoc, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchList();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchList]);

  const handleRefresh = async () => {
    await fetchLookups();
    await fetchAllLhpForSemester();
    await fetchList();
  };

  // ═══════════════════════════════════════════════
  // 4. TREEVIEW HANDLERS (Khoa -> BoMon -> MonHoc)
  // ═══════════════════════════════════════════════
  const handleSelectKhoa = (maKhoa) => {
    setSelectedKhoaId(maKhoa);
    setSelectedBoMonId('');
    setSelectedMonHocId('');
    setView('list');
  };

  const handleSelectBoMon = (maBoMon) => {
    setSelectedBoMonId(maBoMon);
    setSelectedMonHocId('');
    setView('list');
  };

  const handleSelectMonHoc = (maMonHoc) => {
    setSelectedMonHocId(maMonHoc);
    setView('list');
  };

  const handleClearAllFilters = () => {
    setSelectedKhoaId('');
    setSelectedBoMonId('');
    setSelectedMonHocId('');
    setFilterLoaiHoc('');
    setSearchQuery('');
    setView('list');
  };

  // ═══════════════════════════════════════════════
  // 5. DETAIL VIEW
  // ═══════════════════════════════════════════════
  const handleViewDetail = async (item) => {
    setDetailLoading(true);
    setView('detail');
    try {
      const data = await apiGetLopHocPhanChiTiet(item.MaLopHocPhan);
      setDetailData(data);
    } catch {
      setDetailData({ lopHocPhan: item });
    } finally {
      setDetailLoading(false);
    }
  };

  // ═══════════════════════════════════════════════
  // 6. MODAL: CREATE / EDIT
  // ═══════════════════════════════════════════════
  const handleOpenCreate = () => {
    setFormMode('create');
    const selectedHk = hocKyList.find(hk => hk.MaHocKy === filterHocKy);
    const nbd = selectedHk?.NgayBatDau ? String(selectedHk.NgayBatDau).split('T')[0] : '';
    const nkt = selectedHk?.NgayKetThuc ? String(selectedHk.NgayKetThuc).split('T')[0] : '';
    const st = nbd && nkt ? Math.ceil((new Date(nkt) - new Date(nbd)) / (7 * 24 * 60 * 60 * 1000)) : '';

    setFormData({
      ...EMPTY_FORM,
      maHocKy: filterHocKy || '',
      maBoMon: selectedBoMonId && selectedBoMonId !== '__NULL__' ? selectedBoMonId : '',
      maMonHoc: selectedMonHocId || '',
      ngayBatDau: nbd,
      ngayKetThuc: nkt,
      soTuan: st || '',
      siSoDangKy: 0
    });
    setFormError('');
    setFormSuccess('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setFormMode('edit');
    setFormData({
      ...EMPTY_FORM,
      maLopHocPhan: item.MaLopHocPhan || '',
      tenLopHocPhan: item.TenLopHocPhan || '',
      maMonHoc: item.MaMonHoc || '',
      maHocKy: item.MaHocKy || '',
      loaiHoc: item.LoaiHoc || '',
      maBoMon: item.MaBoMon || '',
      siSoDuKien: item.SiSoDuKien ?? '',
      siSoDangKy: item.SiSoDangKy ?? '',
      khoaHoc: item.KhoaHoc || '',
      ngayBatDau: item.NgayBatDau ? String(item.NgayBatDau).split('T')[0] : '',
      ngayKetThuc: item.NgayKetThuc ? String(item.NgayKetThuc).split('T')[0] : '',
      soTuan: item.SoTuan ?? ''
    });
    setFormError('');
    setFormSuccess('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.maLopHocPhan?.trim()) {
      setFormError('Mã lớp học phần không được để trống.');
      return;
    }
    if (!formData.maMonHoc) {
      setFormError('Vui lòng chọn Môn học.');
      return;
    }
    if (!formData.maHocKy) {
      setFormError('Vui lòng chọn Học kỳ.');
      return;
    }
    if (!formData.loaiHoc) {
      setFormError('Vui lòng chọn Loại học.');
      return;
    }
    if (!formData.maBoMon) {
      setFormError('Vui lòng chọn Bộ môn.');
      return;
    }

    if (formData.ngayBatDau && formData.ngayKetThuc && new Date(formData.ngayKetThuc) < new Date(formData.ngayBatDau)) {
      setFormError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
      return;
    }

    const dk = formData.siSoDuKien === '' || formData.siSoDuKien === null ? null : Number(formData.siSoDuKien);
    const dky = formData.siSoDangKy === '' || formData.siSoDangKy === null ? 0 : Number(formData.siSoDangKy);

    setFormLoading(true);
    try {
      if (formMode === 'create') {
        await apiCreateLopHocPhan({
          maLopHocPhan: formData.maLopHocPhan.trim(),
          tenLopHocPhan: formData.tenLopHocPhan?.trim() || null,
          maMonHoc: formData.maMonHoc,
          maHocKy: formData.maHocKy,
          loaiHoc: formData.loaiHoc,
          maBoMon: formData.maBoMon,
          siSoDuKien: dk,
          siSoDangKy: dky,
          khoaHoc: formData.khoaHoc || null,
          ngayBatDau: formData.ngayBatDau || undefined,
          ngayKetThuc: formData.ngayKetThuc || undefined,
          soTuan: formData.soTuan ? Number(formData.soTuan) : undefined
        });
        setFormSuccess('Thêm lớp học phần thành công!');
      } else {
        await apiUpdateLopHocPhan(formData.maLopHocPhan, {
          tenLopHocPhan: formData.tenLopHocPhan?.trim() || null,
          loaiHoc: formData.loaiHoc,
          siSoDuKien: dk,
          siSoDangKy: dky,
          khoaHoc: formData.khoaHoc || null,
          ngayBatDau: formData.ngayBatDau || undefined,
          ngayKetThuc: formData.ngayKetThuc || undefined,
          soTuan: formData.soTuan ? Number(formData.soTuan) : undefined
        });
        setFormSuccess('Cập nhật thành công!');
      }
      await handleRefresh();
      setTimeout(() => {
        setIsFormOpen(false);
        setFormSuccess('');
      }, 800);
    } catch (err) {
      setFormError(err.message || 'Thao tác thất bại.');
    } finally {
      setFormLoading(false);
    }
  };

  // ═══════════════════════════════════════════════
  // 7. DELETE
  // ═══════════════════════════════════════════════
  const handleOpenDelete = (item) => {
    setDeletingItem(item);
    setDeleteError('');
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await apiDeleteLopHocPhan(deletingItem.MaLopHocPhan);
      await handleRefresh();
      setIsDeleteOpen(false);
      setDeletingItem(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ═══════════════════════════════════════════════
  // 8. IMPORT / EXPORT
  // ═══════════════════════════════════════════════
  const handleImport = async (file) => {
    setImportLoading(true);
    setImportResult(null);
    try {
      const result = await apiImportLopHocPhan(file, selectedBoMonId, filterHocKy);
      setImportResult(result.metadata || result);
      await handleRefresh();
    } catch (err) {
      setImportResult({ dongThanhCong: 0, dongLoi: 1, tongSoDong: 0, errors: [err.message] });
    } finally {
      setImportLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await apiExportLopHocPhan(filterHocKy, selectedBoMonId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LopHocPhan_${filterHocKy || 'all'}_${selectedBoMonId || 'all'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setLhpError(err.message || 'Export thất bại.');
    }
  };

  // ═══════════════════════════════════════════════
  // 9. STATS
  // ═══════════════════════════════════════════════
  const totalSVDK = allLhpList.reduce((s, l) => s + (l.SiSoDuKien || 0), 0);
  const totalSVDangKy = allLhpList.reduce((s, l) => s + (l.SiSoDangKy || 0), 0);
  const loaiHocCounts = allLhpList.reduce((acc, l) => {
    acc[l.LoaiHoc] = (acc[l.LoaiHoc] || 0) + 1;
    return acc;
  }, {});

  // ════════════════════════════════════════════════
  // RENDER — Detail View
  // ════════════════════════════════════════════════
  if (view === 'detail') {
    return (
      <div className="lhp-management-container">
        <LopHocPhanDetailView
          detailData={detailData}
          detailLoading={detailLoading}
          hasPermission={hasPermission}
          onBack={() => {
            setView('list');
            setDetailData(null);
          }}
        />
      </div>
    );
  }

  // ════════════════════════════════════════════════
  // RENDER — List View
  // ════════════════════════════════════════════════
  return (
    <div className="lhp-management-container">
      {/* Page Header */}
      <div className="page-header-toolbar">
        <div>
          <h2 className="page-title">Quản Lý Lớp Học Phần</h2>
          <p className="page-subtitle">
            Dữ liệu nền lớp học phần: tạo, sửa, phân cấp theo Khoa - Bộ môn - Môn học và import/export
          </p>
        </div>
        {hasPermission('LopHocPhan', 'CanCreate') && (
          <button type="button" className="btn-primary-add" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Mở LHP</span>
          </button>
        )}
      </div>

      {/* Select Box Riêng Học Kỳ */}
      <div className="lhp-semester-bar">
        <div className="lhp-semester-label">
          <Calendar size={20} color="#2563eb" />
          <span>Học kỳ làm việc:</span>
          <select
            className="lhp-semester-select"
            value={filterHocKy}
            onChange={e => setFilterHocKy(e.target.value)}
          >
            <option value="">— Chọn Học kỳ —</option>
            {hocKyList.map(hk => (
              <option key={hk.MaHocKy} value={hk.MaHocKy}>
                {hk.TenHocKy} {hk.NamHoc ? `(${hk.NamHoc})` : ''}
              </option>
            ))}
          </select>
        </div>

        {filterHocKy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: '#64748b' }}>
            <span>Tổng cộng: <b style={{ color: '#0f172a' }}>{allLhpList.length}</b> lớp HP</span>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      {filterHocKy && (
        <div className="admin-stats-grid" style={{ marginBottom: '16px' }}>
          <div className="admin-stat-item">
            <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <BookMarked size={24} />
            </div>
            <div>
              <div className="admin-stat-number">{allLhpList.length}</div>
              <div className="admin-stat-text">Tổng lớp HP</div>
            </div>
          </div>
          <div className="admin-stat-item">
            <div className="admin-stat-icon-bg" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Hash size={24} />
            </div>
            <div>
              <div className="admin-stat-number">{totalSVDK}</div>
              <div className="admin-stat-text">Tổng SV dự kiến</div>
            </div>
          </div>
          <div className="admin-stat-item">
            <div className="admin-stat-icon-bg" style={{ background: '#fff7ed', color: '#ea580c' }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="admin-stat-number">{totalSVDangKy}</div>
              <div className="admin-stat-text">Tổng SV đăng ký</div>
            </div>
          </div>
          <div className="admin-stat-item">
            <div className="admin-stat-icon-bg" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <div className="admin-stat-number">
                {Object.entries(loaiHocCounts).map(([k, v]) => `${k}:${v}`).join(' · ') || '—'}
              </div>
              <div className="admin-stat-text">Phân bổ kiểu học</div>
            </div>
          </div>
        </div>
      )}

      {/* Import/Export Toolbar */}
      {hasPermission('LopHocPhan', 'CanCreate') && (
        <LopHocPhanImportExport
          filterHocKy={filterHocKy}
          filterBoMon={selectedBoMonId}
          importLoading={importLoading}
          importResult={importResult}
          onImport={handleImport}
          onExport={handleExport}
        />
      )}

      {/* Main 2-Column Split Layout: TreeView (Left) + Content (Right) */}
      {!filterHocKy ? (
        <div className="admin-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <BookMarked size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--admin-text-main)', marginBottom: 6 }}>
            Chọn Học kỳ để xem dữ liệu
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--admin-text-sub)' }}>
            Vui lòng chọn học kỳ ở thanh lựa chọn phía trên để tải cơ cấu tổ chức và danh sách lớp học phần.
          </div>
        </div>
      ) : (
        <div className="lhp-page-layout">
          {/* 1. LEFT PANEL: TreeView Khoa -> BoMon -> MonHoc */}
          <LopHocPhanTreeView
            khoaList={khoaList}
            boMonList={boMonList}
            monHocList={monHocList}
            lhpList={allLhpList}
            selectedKhoaId={selectedKhoaId}
            selectedBoMonId={selectedBoMonId}
            selectedMonHocId={selectedMonHocId}
            onSelectKhoa={handleSelectKhoa}
            onSelectBoMon={handleSelectBoMon}
            onSelectMonHoc={handleSelectMonHoc}
          />

          {/* 2. RIGHT PANEL: Content Area */}
          <main className="lhp-main-content">
            <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Filter & Context Bar */}
              <LopHocPhanFilterBar
                khoaList={khoaList}
                boMonList={boMonList}
                monHocList={monHocList}
                selectedKhoaId={selectedKhoaId}
                selectedBoMonId={selectedBoMonId}
                selectedMonHocId={selectedMonHocId}
                filterLoaiHoc={filterLoaiHoc}
                setFilterLoaiHoc={setFilterLoaiHoc}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onRefresh={handleRefresh}
                loading={lhpLoading}
                totalCount={lhpList.length}
                onClearSelection={handleClearAllFilters}
              />

              {/* Error Banner */}
              {lhpError && (
                <div className="alert-banner error" style={{ margin: '0' }}>
                  <AlertCircle size={18} />
                  <span>{lhpError}</span>
                </div>
              )}

              {/* Table */}
              {lhpLoading ? (
                <div className="table-loading-cell" style={{ padding: '50px 0', textAlign: 'center' }}>
                  <Loader2 size={32} className="animate-spin text-blue-500" style={{ margin: '0 auto 10px' }} />
                  <span>Đang tải danh sách lớp học phần...</span>
                </div>
              ) : lhpList.length === 0 ? (
                <div className="table-empty-cell" style={{ padding: '50px 20px', textAlign: 'center' }}>
                  <BookMarked size={36} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                    Không tìm thấy lớp học phần nào phù hợp
                  </p>
                  <p style={{ color: 'var(--admin-text-sub)', fontSize: '0.82rem', marginTop: '4px' }}>
                    Thử chọn môn học khác trên cây thư mục hoặc xóa các điều kiện lọc.
                  </p>
                </div>
              ) : (
                <LopHocPhanTable
                  list={lhpList}
                  hasPermission={hasPermission}
                  onViewDetail={handleViewDetail}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                />
              )}
            </div>
          </main>
        </div>
      )}

      {/* ══════════ MODAL: Thêm / Sửa ══════════ */}
      <LopHocPhanFormModal
        isOpen={isFormOpen}
        mode={formMode}
        formData={formData}
        setFormData={setFormData}
        boMonList={boMonList}
        monHocList={monHocList}
        hocKyList={hocKyList}
        khoaSinhVienList={khoaSinhVienList}
        onSubmit={handleFormSubmit}
        onClose={() => setIsFormOpen(false)}
        formLoading={formLoading}
        formError={formError}
        setFormError={setFormError}
        formSuccess={formSuccess}
      />

      {/* ══════════ MODAL: Xóa ══════════ */}
      {isDeleteOpen && deletingItem && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card">
            <div className="delete-icon-wrapper">
              <ShieldAlert size={32} />
            </div>
            <h3 className="delete-modal-title">Xác Nhận Xóa</h3>
            <p className="delete-modal-desc">
              Bạn có chắc muốn xóa lớp học phần{' '}
              <b style={{ color: 'var(--admin-text-main)' }}>{deletingItem.MaLopHocPhan}</b>?
            </p>
            {deleteError && (
              <div className="alert-banner error" style={{ textAlign: 'left', marginBottom: 16 }}>
                <AlertCircle size={18} />
                <span>{deleteError}</span>
              </div>
            )}
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="btn-cancel"
                disabled={deleteLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn-delete"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
    </div>
  );
}
