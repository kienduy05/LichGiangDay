import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Search, BookOpen, CheckSquare, Square, Check,
  AlertCircle, Loader2, Filter, School, Network
} from 'lucide-react';
import {
  apiGetMonHocList,
  apiGetKhoaList,
  apiGetBoMonList,
  apiUpdateGiangVienMonHoc
} from '../../../../utils/api';
import './GiangVienComponents.css';

export default function GiangVienAssignMonHocModal({
  isOpen = false,
  giangVien = null,
  currentMonHocList = [],
  onClose,
  onSuccess
}) {
  const [allMonHocs, setAllMonHocs] = useState([]);
  const [khoaList, setKhoaList] = useState([]);
  const [boMonList, setBoMonList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKhoa, setFilterKhoa] = useState('');
  const [filterBoMon, setFilterBoMon] = useState('');
  const [onlySelected, setOnlySelected] = useState(false);

  // Set các mã môn học được tick
  const [selectedCodes, setSelectedCodes] = useState(new Set());

  // Khi modal mở lên: tải dữ liệu và khởi tạo danh sách môn đã tick
  useEffect(() => {
    if (isOpen && giangVien) {
      setError('');
      setSearchTerm('');
      setOnlySelected(false);

      // Khởi tạo các mã môn đã có
      const initialCodes = new Set((currentMonHocList || []).map(m => m.MaMonHoc));
      setSelectedCodes(initialCodes);

      // Mặc định chọn bộ môn của giảng viên
      if (giangVien.MaBoMon) {
        setFilterBoMon(giangVien.MaBoMon);
      } else {
        setFilterBoMon('');
      }

      fetchData();
    }
  }, [isOpen, giangVien, currentMonHocList]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [monHocs, khoas, boMons] = await Promise.all([
        apiGetMonHocList().catch(() => []),
        apiGetKhoaList().catch(() => []),
        apiGetBoMonList().catch(() => [])
      ]);
      setAllMonHocs(monHocs || []);
      setKhoaList(khoas || []);
      setBoMonList(boMons || []);

      // Xác định Khoa của giảng viên nếu có
      if (giangVien?.MaBoMon && boMons) {
        const bm = boMons.find(b => b.MaBoMon === giangVien.MaBoMon);
        if (bm?.MaKhoa) {
          setFilterKhoa(bm.MaKhoa);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách môn học:', err);
      setError('Không thể tải danh sách môn học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle tick 1 môn
  const handleToggleCode = (maMonHoc) => {
    setSelectedCodes(prev => {
      const next = new Set(prev);
      if (next.has(maMonHoc)) {
        next.delete(maMonHoc);
      } else {
        next.add(maMonHoc);
      }
      return next;
    });
  };

  // Lọc danh sách môn học hiển thị
  const filteredMonHocs = useMemo(() => {
    return allMonHocs.filter(mh => {
      // 1. Chỉ xem môn đã chọn
      if (onlySelected && !selectedCodes.has(mh.MaMonHoc)) {
        return false;
      }

      // 2. Lọc theo Khoa
      if (filterKhoa) {
        const bm = boMonList.find(b => b.MaBoMon === mh.MaBoMon);
        if (bm && bm.MaKhoa !== filterKhoa) return false;
      }

      // 3. Lọc theo Bộ môn
      if (filterBoMon && mh.MaBoMon !== filterBoMon) {
        return false;
      }

      // 4. Tìm kiếm từ khóa (Mã hoặc Tên môn)
      if (searchTerm.trim()) {
        const kw = searchTerm.trim().toLowerCase();
        const matchMa = (mh.MaMonHoc || '').toLowerCase().includes(kw);
        const matchTen = (mh.TenMonHoc || '').toLowerCase().includes(kw);
        if (!matchMa && !matchTen) return false;
      }

      return true;
    });
  }, [allMonHocs, selectedCodes, onlySelected, filterKhoa, filterBoMon, boMonList, searchTerm]);

  // Chọn tất cả môn đang hiển thị
  const handleSelectAllVisible = () => {
    setSelectedCodes(prev => {
      const next = new Set(prev);
      filteredMonHocs.forEach(mh => next.add(mh.MaMonHoc));
      return next;
    });
  };

  // Bỏ chọn tất cả môn đang hiển thị
  const handleDeselectAllVisible = () => {
    setSelectedCodes(prev => {
      const next = new Set(prev);
      filteredMonHocs.forEach(mh => next.delete(mh.MaMonHoc));
      return next;
    });
  };

  // Lưu danh sách môn học đã tick
  const handleSave = async () => {
    if (!giangVien) return;
    setSaving(true);
    setError('');
    try {
      const codeList = Array.from(selectedCodes);
      const updatedList = await apiUpdateGiangVienMonHoc(giangVien.MaGiangVien, codeList);
      if (onSuccess) {
        onSuccess(updatedList);
      }
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu môn học giảng viên:', err);
      setError(err.message || 'Lưu danh sách môn học thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="admin-modal-container"
        style={{
          maxWidth: '850px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* 1. Modal Header */}
        <div className="admin-modal-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BookOpen size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                Phân Công Môn Học Giảng Dạy
              </h3>
            </div>
            <div style={{ marginTop: '4px', fontSize: '0.86rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>Giảng viên: <strong style={{ color: '#1e293b' }}>{giangVien?.HoTen}</strong> ({giangVien?.MaGiangVien})</span>
              {giangVien?.TenBoMon && (
                <span className="gv-bomon-badge" style={{ fontSize: '0.76rem', padding: '1px 8px' }}>
                  {giangVien.TenBoMon}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="admin-modal-close-btn"
            onClick={onClose}
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Filter & Search Toolbar */}
        <div style={{
          padding: '14px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Row 1: Search + Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search
                size={16}
                color="#94a3b8"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="admin-form-input"
                placeholder="Tìm mã hoặc tên môn học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px', height: '38px', borderRadius: '8px' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Khoa */}
            <div style={{ width: '180px' }}>
              <select
                className="admin-form-select"
                value={filterKhoa}
                onChange={(e) => {
                  setFilterKhoa(e.target.value);
                  setFilterBoMon('');
                }}
                style={{ height: '38px', borderRadius: '8px' }}
              >
                <option value="">Tất cả các khoa</option>
                {khoaList.map(k => (
                  <option key={k.MaKhoa} value={k.MaKhoa}>{k.TenKhoa}</option>
                ))}
              </select>
            </div>

            {/* Filter Bộ môn */}
            <div style={{ width: '190px' }}>
              <select
                className="admin-form-select"
                value={filterBoMon}
                onChange={(e) => setFilterBoMon(e.target.value)}
                style={{ height: '38px', borderRadius: '8px' }}
              >
                <option value="">Tất cả bộ môn</option>
                {boMonList
                  .filter(bm => !filterKhoa || bm.MaKhoa === filterKhoa)
                  .map(bm => (
                    <option key={bm.MaBoMon} value={bm.MaBoMon}>{bm.TenBoMon}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Row 2: Quick filters & Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '0.84rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className={`filter-chip ${!onlySelected ? 'active' : ''}`}
                onClick={() => setOnlySelected(false)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: !onlySelected ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                  background: !onlySelected ? '#eff6ff' : '#ffffff',
                  color: !onlySelected ? '#1d4ed8' : '#475569',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Tất cả môn ({allMonHocs.length})
              </button>

              <button
                type="button"
                className={`filter-chip ${onlySelected ? 'active' : ''}`}
                onClick={() => setOnlySelected(true)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: onlySelected ? '1px solid #16a34a' : '1px solid #cbd5e1',
                  background: onlySelected ? '#f0fdf4' : '#ffffff',
                  color: onlySelected ? '#15803d' : '#475569',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Đã chọn ({selectedCodes.size})
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleSelectAllVisible}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.82rem'
                }}
              >
                Chọn tất cả đang hiển thị ({filteredMonHocs.length})
              </button>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <button
                type="button"
                onClick={handleDeselectAllVisible}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.82rem'
                }}
              >
                Bỏ chọn tất cả
              </button>
            </div>
          </div>
        </div>

        {/* 3. Error message */}
        {error && (
          <div style={{
            margin: '12px 24px 0',
            padding: '10px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 4. Subject Checklist */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px',
          minHeight: '280px',
          maxHeight: '420px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <Loader2 size={32} className="animate-spin text-blue-500" style={{ margin: '0 auto 10px' }} />
              <div>Đang tải danh mục môn học...</div>
            </div>
          ) : filteredMonHocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <BookOpen size={40} style={{ margin: '0 auto 10px', color: '#cbd5e1' }} />
              <div style={{ fontWeight: 600, color: '#64748b' }}>Không tìm thấy môn học nào phù hợp</div>
              <p style={{ fontSize: '0.82rem', margin: '6px 0 0' }}>
                Thử đổi từ khóa tìm kiếm hoặc bỏ chọn các điều kiện lọc.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '10px'
            }}>
              {filteredMonHocs.map((mh) => {
                const isChecked = selectedCodes.has(mh.MaMonHoc);
                return (
                  <div
                    key={mh.MaMonHoc}
                    onClick={() => handleToggleCode(mh.MaMonHoc)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: isChecked ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                      background: isChecked ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Đã xử lý ở thẻ cha div onClick
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#2563eb'
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="gv-code-pill" style={{
                          fontSize: '0.78rem',
                          padding: '1px 7px',
                          background: isChecked ? '#dbeafe' : '#f1f5f9',
                          color: isChecked ? '#1e40af' : '#475569'
                        }}>
                          {mh.MaMonHoc}
                        </span>
                        <span style={{
                          fontSize: '0.76rem',
                          color: '#64748b',
                          fontWeight: 500
                        }}>
                          {mh.SoTinChi} tín chỉ
                        </span>
                      </div>

                      <div style={{
                        marginTop: '4px',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        color: isChecked ? '#1e3a8a' : '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {mh.TenMonHoc}
                      </div>

                      <div style={{
                        marginTop: '4px',
                        fontSize: '0.78rem',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Network size={12} color="#94a3b8" />
                        <span>{mh.TenBoMon || mh.MaBoMon || 'Chưa gán BM'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Modal Footer */}
        <div className="admin-modal-footer" style={{
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '0.88rem', color: '#475569' }}>
            Đã tick chọn: <strong style={{ color: '#2563eb' }}>{selectedCodes.size}</strong> môn học
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </button>

            <button
              type="button"
              className="admin-btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ minWidth: '130px' }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Check size={16} /> Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

