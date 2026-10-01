import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  BookMarked, Plus, AlertCircle, Loader2, ShieldAlert, CheckCircle2,
  BookOpen, Users, UserCheck, Network
} from 'lucide-react';
import {
  apiGetLopHocPhanList, apiGetLopHocPhanChiTiet,
  apiCreateLopHocPhan, apiUpdateLopHocPhan, apiDeleteLopHocPhan,
  apiImportLopHocPhan, apiExportLopHocPhan
} from '../../../../utils/apiLopHocPhan';
import { apiGetBoMonList, apiGetHocKyList, apiGetMonHocList, apiGetKhoaSinhVienList } from '../../../../utils/api';

import LopHocPhanFilterBar from './LopHocPhanFilterBar';
import LopHocPhanTable from './LopHocPhanTable';
import LopHocPhanFormModal from './LopHocPhanFormModal';
import LopHocPhanDetailView from './LopHocPhanDetailView';
import { AssignGiangVienModal, AttachLopSinhVienModal, DetachLopSinhVienModal } from './LopHocPhanAssignModal';
import LopHocPhanImportExport from './LopHocPhanImportExport';

import './LopHocPhanManagement.css';
import './LopHocPhanComponents.css';

export default function LopHocPhanManagement() {
  const { hasPermission } = useAuth();

  // ─── View: 'list' | 'detail' ───
  const [view, setView] = useState('list');
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Danh sách LHP ───
  const [lhpList, setLhpList] = useState([]);
  const [lhpLoading, setLhpLoading] = useState(false);
  const [lhpError, setLhpError] = useState('');

  // ─── Lookup data ───
  const [hocKyList, setHocKyList] = useState([]);
  const [boMonList, setBoMonList] = useState([]);
  const [monHocList, setMonHocList] = useState([]);
  const [khoaSinhVienList, setKhoaSinhVienList] = useState([]);

  // ─── Filters ───
  const [filterHocKy, setFilterHocKy] = useState('');
  const [filterBoMon, setFilterBoMon] = useState('');
  const [filterMonHoc, setFilterMonHoc] = useState('');
  const [filterGiangVien, setFilterGiangVien] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Modal Thêm / Sửa ───
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState({
    maMonHoc: '', maNhom: '', tenLopHocPhan: '', maHocKy: '', loaiHoc: '',
    maBoMon: '', siSoDuKien: '', siSoDangKy: '', khoaHoc: '',
    ngayBatDau: '', ngayKetThuc: '', soTuan: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // ─── Modal Xóa ───
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ─── Modal Assign GV ───
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assigningItem, setAssigningItem] = useState(null);

  // ─── Modal Attach / Detach LSV ───
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [attachItem, setAttachItem] = useState(null);
  const [isDetachOpen, setIsDetachOpen] = useState(false);
  const [detachItem, setDetachItem] = useState(null);
  const [detachList, setDetachList] = useState([]);

  // ─── Import/Export ───
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // ═══════════════════════════════════════════════
  // FETCH
  // ═══════════════════════════════════════════════
  const fetchLookups = async () => {
    try {
      const [hk, bm, mh, ksv] = await Promise.all([
        apiGetHocKyList().catch(() => []),
        apiGetBoMonList().catch(() => []),
        apiGetMonHocList().catch(() => []),
        apiGetKhoaSinhVienList().catch(() => [])
      ]);
      setHocKyList(hk || []);
      setBoMonList(bm || []);
      setMonHocList(mh || []);
      setKhoaSinhVienList(ksv || []);
    } catch { /* ignore */ }
  };

  const fetchList = useCallback(async () => {
    if (!filterHocKy) { setLhpList([]); return; }
    setLhpLoading(true); setLhpError('');
    try {
      const data = await apiGetLopHocPhanList({
        maHocKy: filterHocKy, maBoMon: filterBoMon, maMonHoc: filterMonHoc,
        maGiangVien: filterGiangVien, trangThaiPhanCong: filterTrangThai, search: searchQuery
      });
      setLhpList(data || []);
    } catch (err) {
      setLhpError(err.message || 'Không thể tải danh sách.');
    } finally { setLhpLoading(false); }
  }, [filterHocKy, filterBoMon, filterMonHoc, filterGiangVien, filterTrangThai, searchQuery]);

  useEffect(() => { fetchLookups(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => { fetchList(); }, 300);
    return () => clearTimeout(timer);
  }, [filterHocKy, filterBoMon, filterMonHoc, filterGiangVien, filterTrangThai, searchQuery]);

  // ═══════════════════════════════════════════════
  // DETAIL VIEW
  // ═══════════════════════════════════════════════
  const handleViewDetail = async (item) => {
    setDetailLoading(true); setView('detail');
    try {
      const data = await apiGetLopHocPhanChiTiet(item.MaLopHocPhan);
      setDetailData(data);
    } catch {
      setDetailData({ lopHocPhan: item, lopSinhVienList: [] });
    } finally { setDetailLoading(false); }
  };

  const refreshDetail = async () => {
    if (!detailData?.lopHocPhan?.MaLopHocPhan) return;
    try {
      const data = await apiGetLopHocPhanChiTiet(detailData.lopHocPhan.MaLopHocPhan);
      setDetailData(data);
    } catch { /* keep current */ }
  };

  // ═══════════════════════════════════════════════
  // MODAL: CREATE / EDIT
  // ═══════════════════════════════════════════════
  const handleOpenCreate = () => {
    setFormMode('create');
    setFormData({
      maMonHoc: '', maNhom: '', tenLopHocPhan: '', maHocKy: filterHocKy || '', loaiHoc: '',
      maBoMon: filterBoMon || '', siSoDuKien: '', siSoDangKy: '', khoaHoc: '',
      ngayBatDau: '', ngayKetThuc: '', soTuan: ''
    });
    setFormError(''); setFormSuccess('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setFormMode('edit');
    const formatD = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
    setFormData({
      maLopHocPhan: item.MaLopHocPhan,
      maMonHoc: item.MaMonHoc,
      maNhom: '',
      tenLopHocPhan: item.TenLopHocPhan || '',
      maHocKy: item.MaHocKy,
      loaiHoc: item.LoaiHoc,
      maBoMon: item.MaBoMon || '',
      siSoDuKien: item.SiSoDuKien ?? '',
      siSoDangKy: item.SiSoDangKy ?? '',
      khoaHoc: item.KhoaHoc || '',
      ngayBatDau: formatD(item.NgayBatDau),
      ngayKetThuc: formatD(item.NgayKetThuc),
      soTuan: item.SoTuan ?? ''
    });
    setFormError(''); setFormSuccess('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    setFormLoading(true);
    try {
      if (formMode === 'create') {
        await apiCreateLopHocPhan(formData);
        setFormSuccess('Thêm lớp học phần thành công!');
      } else {
        await apiUpdateLopHocPhan(formData.maLopHocPhan, formData);
        setFormSuccess('Cập nhật thành công!');
      }
      await fetchList();
      setTimeout(() => { setIsFormOpen(false); setFormSuccess(''); }, 1000);
    } catch (err) {
      setFormError(err.message || 'Thao tác thất bại.');
    } finally { setFormLoading(false); }
  };

  // ═══════════════════════════════════════════════
  // DELETE
  // ═══════════════════════════════════════════════
  const handleOpenDelete = (item) => {
    setDeletingItem(item); setDeleteError(''); setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true); setDeleteError('');
    try {
      await apiDeleteLopHocPhan(deletingItem.MaLopHocPhan);
      await fetchList();
      setIsDeleteOpen(false); setDeletingItem(null);
    } catch (err) { setDeleteError(err.message); }
    finally { setDeleteLoading(false); }
  };

  // ═══════════════════════════════════════════════
  // ASSIGN GV
  // ═══════════════════════════════════════════════
  const handleOpenAssign = (item) => {
    setAssigningItem(item); setIsAssignOpen(true);
  };

  // ═══════════════════════════════════════════════
  // ATTACH / DETACH LSV
  // ═══════════════════════════════════════════════
  const handleOpenAttach = (item) => {
    setAttachItem(item); setIsAttachOpen(true);
  };
  const handleOpenDetach = (item, list) => {
    setDetachItem(item); setDetachList(list); setIsDetachOpen(true);
  };

  // ═══════════════════════════════════════════════
  // IMPORT / EXPORT
  // ═══════════════════════════════════════════════
  const handleImport = async (file) => {
    setImportLoading(true); setImportResult(null);
    try {
      const result = await apiImportLopHocPhan(file, filterBoMon, filterHocKy);
      setImportResult(result.metadata || result);
      await fetchList();
    } catch (err) {
      setImportResult({ dongThanhCong: 0, dongLoi: 1, tongSoDong: 0, errors: [err.message] });
    } finally { setImportLoading(false); }
  };

  const handleExport = async () => {
    try {
      const blob = await apiExportLopHocPhan(filterHocKy, filterBoMon);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LopHocPhan_${filterHocKy || 'all'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setLhpError(err.message || 'Export thất bại.');
    }
  };

  // ═══════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════
  const totalAssigned = lhpList.filter(l => l.TrangThaiPhanCong === 'Assigned').length;
  const totalUnassigned = lhpList.filter(l => l.TrangThaiPhanCong !== 'Assigned').length;
  const totalLopGhep = lhpList.reduce((s, l) => s + (l.SoLopSinhVienGhep || 0), 0);

  // ════════════════════════════════════════════════
  // RENDER — Detail View
  // ════════════════════════════════════════════════
  if (view === 'detail') {
    return (
      <>
        <LopHocPhanDetailView
          detailData={detailData}
          detailLoading={detailLoading}
          hasPermission={hasPermission}
          onBack={() => { setView('list'); setDetailData(null); }}
          onAttach={handleOpenAttach}
          onDetach={handleOpenDetach}
          onAssign={handleOpenAssign}
        />

        <AssignGiangVienModal
          isOpen={isAssignOpen}
          lopHocPhan={assigningItem}
          onClose={() => setIsAssignOpen(false)}
          onSuccess={() => { fetchList(); refreshDetail(); }}
        />
        <AttachLopSinhVienModal
          isOpen={isAttachOpen}
          lopHocPhan={attachItem}
          onClose={() => setIsAttachOpen(false)}
          onSuccess={() => { fetchList(); refreshDetail(); }}
        />
        <DetachLopSinhVienModal
          isOpen={isDetachOpen}
          lopHocPhan={detachItem}
          currentList={detachList}
          onClose={() => setIsDetachOpen(false)}
          onSuccess={() => { fetchList(); refreshDetail(); }}
        />
      </>
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
          <p className="page-subtitle">Dữ liệu nền lớp học phần: tạo, sửa, phân công giảng viên, gắn lớp sinh viên</p>
        </div>
        {hasPermission('LopHocPhan', 'CanCreate') && (
          <button className="btn-primary-add" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Thêm LHP</span>
          </button>
        )}
      </div>

      {/* KPI Stats */}
      {filterHocKy && (
        <div className="admin-stats-grid" style={{ marginBottom: 0 }}>
          <div className="admin-stat-item">
            <div className="admin-stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <BookMarked size={24} />
            </div>
            <div>
              <div className="admin-stat-number">{lhpList.length}</div>
              <div className="admin-stat-text">Tổng lớp HP</div>
            </div>
          </div>
          <div className="admin-stat-item">
            <div className="admin-stat-icon-bg" style={{ background: '#ecfdf5', color: '#059669' }}>
              <UserCheck size={24} />
            </div>
            <div>
              <div className="admin-stat-number">{totalAssigned}</div>
              <div className="admin-stat-text">Đã phân công</div>
            </div>
          </div>
          <div className="admin-stat-item">
            <div className="admin-stat-icon-bg" style={{ background: '#fff7ed', color: '#ea580c' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <div className="admin-stat-number">{totalUnassigned}</div>
              <div className="admin-stat-text">Chưa phân công</div>
            </div>
          </div>
          <div className="admin-stat-item">
            <div className="admin-stat-icon-bg" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <Users size={24} />
            </div>
            <div>
              <div className="admin-stat-number">{totalLopGhep}</div>
              <div className="admin-stat-text">Lớp SV ghép</div>
            </div>
          </div>
        </div>
      )}

      {/* Import/Export */}
      {hasPermission('LopHocPhan', 'CanCreate') && (
        <LopHocPhanImportExport
          filterHocKy={filterHocKy}
          filterBoMon={filterBoMon}
          importLoading={importLoading}
          importResult={importResult}
          onImport={handleImport}
          onExport={handleExport}
        />
      )}

      {/* Data Card */}
      <div className="admin-card" style={{ padding: 0 }}>
        {/* Filter Bar */}
        <LopHocPhanFilterBar
          hocKyList={hocKyList}
          boMonList={boMonList}
          monHocList={monHocList}
          giangVienList={[]}
          filterHocKy={filterHocKy} setFilterHocKy={setFilterHocKy}
          filterBoMon={filterBoMon} setFilterBoMon={setFilterBoMon}
          filterMonHoc={filterMonHoc} setFilterMonHoc={setFilterMonHoc}
          filterGiangVien={filterGiangVien} setFilterGiangVien={setFilterGiangVien}
          filterTrangThai={filterTrangThai} setFilterTrangThai={setFilterTrangThai}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          loading={lhpLoading} onRefresh={fetchList}
        />

        {/* Error Banner */}
        {lhpError && (
          <div className="alert-banner error" style={{ margin: '12px 20px' }}>
            <AlertCircle size={18} /><span>{lhpError}</span>
          </div>
        )}

        {/* Content */}
        {!filterHocKy ? (
          <div className="table-empty-cell" style={{ padding: '60px 20px' }}>
            <BookMarked size={36} style={{ color: '#cbd5e1', marginBottom: 12 }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: 6 }}>
              Chọn Học kỳ để bắt đầu
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--admin-text-sub)' }}>
              Vui lòng chọn học kỳ ở thanh lọc phía trên để hiển thị danh sách lớp học phần.
            </div>
          </div>
        ) : lhpLoading ? (
          <div className="table-loading-cell" style={{ padding: '50px 0' }}>
            <Loader2 size={24} className="animate-spin" />
            <span>Đang tải danh sách lớp học phần...</span>
          </div>
        ) : lhpList.length === 0 ? (
          <div className="table-empty-cell" style={{ padding: '50px 20px' }}>
            {searchQuery || filterBoMon || filterTrangThai
              ? 'Không tìm thấy lớp học phần nào phù hợp.'
              : 'Chưa có lớp học phần nào trong học kỳ này.'}
          </div>
        ) : (
          <LopHocPhanTable
            list={lhpList}
            hasPermission={hasPermission}
            onViewDetail={handleViewDetail}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
            onAssign={handleOpenAssign}
          />
        )}
      </div>

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
        formSuccess={formSuccess}
      />

      {/* ══════════ MODAL: Xóa ══════════ */}
      {isDeleteOpen && deletingItem && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="delete-icon-wrapper"><ShieldAlert size={32} /></div>
            <h3 className="delete-modal-title">Xác Nhận Xóa</h3>
            <p className="delete-modal-desc">
              Bạn có chắc muốn xóa lớp học phần{' '}
              <b style={{ color: 'var(--admin-text-main)' }}>{deletingItem.MaLopHocPhan}</b>?
            </p>
            {deleteError && (
              <div className="alert-banner error" style={{ textAlign: 'left', marginBottom: 16 }}>
                <AlertCircle size={18} /><span>{deleteError}</span>
              </div>
            )}
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button type="button" onClick={() => setIsDeleteOpen(false)} className="btn-cancel" disabled={deleteLoading}>Hủy</button>
              <button type="button" onClick={handleConfirmDelete} className="btn-delete" disabled={deleteLoading}>
                {deleteLoading
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Loader2 size={16} className="animate-spin" /> Đang xóa...</span>
                  : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: Assign GV ══════════ */}
      <AssignGiangVienModal
        isOpen={isAssignOpen}
        lopHocPhan={assigningItem}
        onClose={() => setIsAssignOpen(false)}
        onSuccess={() => fetchList()}
      />
    </div>
  );
}
