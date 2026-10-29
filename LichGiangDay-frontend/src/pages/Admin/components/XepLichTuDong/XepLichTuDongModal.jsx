import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Play, Sparkles, X } from 'lucide-react';
import XepLichClassList from './XepLichClassList';
import XepLichResults from './XepLichResults';
import XepLichDraftEditModal from './XepLichDraftEditModal';
import {
  applyPhienXepLich,
  cancelPhienXepLich,
  createPhienXepLich,
  getLopChuaXep,
  getPhienXepLich
} from './apiXepLich';
import './XepLichTuDong.css';

const storageKey = maHocKy => `xeplich-active-session:${maHocKy}`;

export default function XepLichTuDongModal({
  isOpen,
  onClose,
  maHocKy,
  maKhoa = '',
  maBoMon = '',
  onApplied
}) {
  const [classes, setClasses] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => (
    maHocKy ? localStorage.getItem(storageKey(maHocKy)) || '' : ''
  ));
  const [sessionData, setSessionData] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [error, setError] = useState('');
  const mountedRef = useRef(false);

  const loadClasses = useCallback(async (keyword = '') => {
    if (!maHocKy) return;
    setLoadingClasses(true);
    setError('');
    try {
      const list = await getLopChuaXep({ maHocKy, maKhoa, maBoMon, search: keyword });
      if (!mountedRef.current) return;
      setClasses(list || []);
      setSelectedIds((list || []).filter(row => row.trangThaiDuLieu === 'Ready').map(row => row.MaLopHocPhan));
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoadingClasses(false);
    }
  }, [maHocKy, maKhoa, maBoMon]);

  const refreshSession = useCallback(async (id = sessionId) => {
    if (!id) return null;
    const data = await getPhienXepLich(id);
    if (mountedRef.current) setSessionData(data);
    return data;
  }, [sessionId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isOpen || !maHocKy) return;
    if (sessionId) {
      getPhienXepLich(sessionId)
        .then(data => mountedRef.current && setSessionData(data))
        .catch(() => {
          localStorage.removeItem(storageKey(maHocKy));
          if (mountedRef.current) {
            setSessionId('');
            setSessionData(null);
          }
        });
    }
  }, [isOpen, maHocKy, sessionId, loadClasses]);

  useEffect(() => {
    if (!isOpen || sessionId || !maHocKy) return undefined;
    const timeout = setTimeout(() => loadClasses(search), 300);
    return () => clearTimeout(timeout);
  }, [search, isOpen, sessionId, maHocKy, loadClasses]);

  useEffect(() => {
    if (!isOpen || !sessionId || sessionData?.phien?.TrangThai !== 'Processing') return undefined;
    const timeout = setTimeout(() => {
      refreshSession().catch(err => setError(err.message));
    }, 1500);
    return () => clearTimeout(timeout);
  }, [isOpen, sessionId, sessionData?.phien?.TrangThai, sessionData?.phien?.SoLopDaXuLy, refreshSession]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (selectedIds.length === 0) {
      setError('Vui lòng chọn ít nhất một lớp học phần đủ dữ liệu.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const result = await createPhienXepLich({
        maHocKy,
        maKhoa: maKhoa || null,
        maBoMon: maBoMon || null,
        maLopHocPhans: selectedIds,
        uuTienPhongGanSiSo: true,
        choPhepXepLaiLichDaCo: false
      });
      setSessionId(result.maPhien);
      localStorage.setItem(storageKey(maHocKy), result.maPhien);
      setSessionData({
        phien: {
          MaPhien: result.maPhien,
          TrangThai: result.trangThai,
          TongSoLop: result.tongSoLop,
          SoLopDaXuLy: 0,
          SoLopDaXep: 0,
          SoLopKhongXep: 0,
          SoLopThieuDuLieu: 0
        },
        dong: []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleApply = async () => {
    if (!window.confirm('Áp dụng toàn bộ lịch nháp hợp lệ thành thời khóa biểu chính thức?')) return;
    setActionLoading(true);
    setError('');
    try {
      const result = await applyPhienXepLich(sessionId);
      localStorage.removeItem(storageKey(maHocKy));
      onApplied?.(`Đã áp dụng ${result.soLopDaApDung} lớp với ${result.soDongDaApDung} buổi học.`);
      onClose();
    } catch (err) {
      setError(err.message);
      if (err.metadata) await refreshSession();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Hủy phiên xếp lịch này? Các dòng nháp sẽ không thể áp dụng.')) return;
    setActionLoading(true);
    setError('');
    try {
      await cancelPhienXepLich(sessionId);
      localStorage.removeItem(storageKey(maHocKy));
      setSessionId('');
      setSessionData(null);
      await loadClasses(search);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="xlt-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className="xlt-modal">
        <header className="xlt-modal-header">
          <div className="xlt-heading-icon"><Sparkles size={22} /></div>
          <div>
            <h2>Xếp thời khóa biểu tự động</h2>
            <p>Học kỳ {maHocKy}{maBoMon ? ` · Bộ môn ${maBoMon}` : maKhoa ? ` · Khoa ${maKhoa}` : ' · Toàn trường'}</p>
          </div>
          <button type="button" className="xlt-icon-button close" onClick={onClose}><X size={21} /></button>
        </header>

        <div className="xlt-modal-body">
          {error && <div className="xlt-inline-alert error"><AlertCircle size={17} /><span>{error}</span></div>}

          {sessionData ? (
            <XepLichResults
              data={sessionData}
              onRefresh={() => refreshSession().catch(err => setError(err.message))}
              onEdit={setEditingRow}
              onApply={handleApply}
              onCancel={handleCancel}
              actionLoading={actionLoading}
            />
          ) : (
            <>
              <XepLichClassList
                classes={classes}
                selectedIds={selectedIds}
                onSelectedIdsChange={setSelectedIds}
                search={search}
                onSearchChange={setSearch}
                loading={loadingClasses}
              />
              <div className="xlt-create-footer">
                <div>
                  <strong>{selectedIds.length} lớp sẽ được đưa vào phiên</strong>
                  <span>Hệ thống chỉ tạo lịch nháp để bạn kiểm tra trước khi áp dụng.</span>
                </div>
                <button type="button" className="xlt-btn primary large" onClick={handleCreate} disabled={creating || loadingClasses || selectedIds.length === 0}>
                  <Play size={17} /> {creating ? 'Đang tạo phiên…' : 'Xếp lịch tự động'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {editingRow && (
        <XepLichDraftEditModal
          key={editingRow.MaDong}
          maPhien={sessionId}
          dong={editingRow}
          onClose={() => setEditingRow(null)}
          onSaved={refreshSession}
        />
      )}
    </div>
  );
}
