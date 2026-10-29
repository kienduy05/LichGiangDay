import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, History, Play, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import XepLichClassList from './XepLichClassList';
import XepLichResults from './XepLichResults';
import XepLichDraftEditModal from './XepLichDraftEditModal';
import XepLichSessionHistory from './XepLichSessionHistory';
import {
  applyPhienXepLich,
  cancelPhienXepLich,
  createPhienXepLich,
  getLopChuaXep,
  getPhienXepLich
} from './apiXepLich';
import './XepLichTuDong.css';

export default function XepLichTuDongModal({
  isOpen,
  onClose,
  maHocKy,
  maKhoa = '',
  maBoMon = '',
  onApplied
}) {
  const { hasPermission } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const mountedRef = useRef(false);
  const sessionIdRef = useRef(sessionId);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  const loadClasses = useCallback(async (keyword = '') => {
    if (!maHocKy) return;
    setLoadingClasses(true);
    setError('');
    try {
      const list = await getLopChuaXep({ maHocKy, maKhoa, maBoMon, search: keyword });
      if (!mountedRef.current) return;
      setClasses(list || []);
      setSelectedIds([...new Set((list || []).filter(row => row.trangThaiDuLieu === 'Ready').flatMap(row => row.MaLopCungNhom || [row.MaLopHocPhan]))]);
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoadingClasses(false);
    }
  }, [maHocKy, maKhoa, maBoMon]);

  const refreshSession = useCallback(async (id = sessionId) => {
    if (!id) return null;
    const data = await getPhienXepLich(id);
    if (mountedRef.current && sessionIdRef.current === id) setSessionData(data);
    return data;
  }, [sessionId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isOpen || !maHocKy) return;
    let active = true;
    if (sessionId) {
      getPhienXepLich(sessionId)
        .then(data => active && mountedRef.current && setSessionData(data))
        .catch((err) => {
          if (!active || !mountedRef.current) return;
          if (err.status !== 404) {
            setError(err.message);
            return;
          }
          if (mountedRef.current) {
            setSessionId('');
            setSessionData(null);
          }
        });
    }
    return () => { active = false; };
  }, [isOpen, maHocKy, sessionId, loadClasses]);

  useEffect(() => {
    if (!isOpen || sessionId || !maHocKy) return undefined;
    const timeout = setTimeout(() => loadClasses(search), 300);
    return () => clearTimeout(timeout);
  }, [search, isOpen, sessionId, maHocKy, loadClasses]);

  useEffect(() => {
    if (!isOpen || !sessionId || actionLoading || sessionData?.phien?.TrangThai !== 'Processing') return undefined;
    let active = true;
    let timeout;
    let delay = 3000;
    let previousProgress = sessionData?.phien?.SoLopDaXuLy;
    const poll = async () => {
      try {
        const data = await getPhienXepLich(sessionId);
        if (!active) return;
        setSessionData(data);
        if (data.phien.TrangThai !== 'Processing') return;
        delay = data.phien.SoLopDaXuLy === previousProgress ? Math.min(delay * 1.5, 10000) : 3000;
        previousProgress = data.phien.SoLopDaXuLy;
      } catch (err) {
        if (!active) return;
        setError(err.message);
        delay = Math.min(delay * 1.5, 10000);
      }
      if (active) timeout = setTimeout(poll, delay);
    };
    timeout = setTimeout(poll, delay);
    return () => { active = false; clearTimeout(timeout); };
  }, [isOpen, sessionId, sessionData?.phien?.TrangThai, sessionData?.phien?.SoLopDaXuLy, actionLoading]);

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
      sessionIdRef.current = '';
      setSessionId('');
      setSessionData(null);
      await loadClasses(search);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectSession = (id) => {
    if (id === sessionIdRef.current) {
      setShowHistory(false);
      if (!sessionData) refreshSession(id).catch(err => setError(err.message));
      return;
    }
    sessionIdRef.current = id;
    setSessionData(null);
    setSessionId(id);
    setError('');
    setShowHistory(false);
  };

  const handleDeletedSessions = (ids) => {
    if (!ids.includes(sessionIdRef.current)) return;
    sessionIdRef.current = '';
    setSessionId('');
    setSessionData(null);
  };

  const handleNewSession = () => {
    sessionIdRef.current = '';
    setSessionId('');
    setSessionData(null);
    setEditingRow(null);
    setError('');
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
          <button type="button" className="xlt-btn secondary xlt-history-toggle" disabled={actionLoading || creating} onClick={() => setShowHistory(value => !value)}>
            <History size={16} /> {showHistory ? 'Quay lại xếp lịch' : 'Quản lý phiên'}
          </button>
          <button type="button" className="xlt-icon-button close" onClick={onClose}><X size={21} /></button>
        </header>

        <div className="xlt-modal-body">
          {error && <div className="xlt-inline-alert error"><AlertCircle size={17} /><span>{error}</span></div>}

          {showHistory ? (
            <XepLichSessionHistory key={maHocKy} maHocKy={maHocKy} canDelete={hasPermission('ThoiKhoaBieu', 'CanDelete')} onSelect={handleSelectSession} onDeleted={handleDeletedSessions} />
          ) : sessionData ? (
            <XepLichResults
              data={sessionData}
              onRefresh={() => refreshSession().catch(err => setError(err.message))}
              onEdit={setEditingRow}
              onApply={handleApply}
              onCancel={handleCancel}
              onNewSession={handleNewSession}
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
                  <span>Lặp cố định thứ, ca và phòng · 3 tín chỉ LT: 2 buổi/tuần · TH/BT, loại khác và 2 tín chỉ: 1 buổi/tuần · Nghỉ Chủ nhật.</span>
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
