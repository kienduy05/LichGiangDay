import React from 'react';
import { Search, X, RefreshCw, Layers, School, Network, BookOpen, Lock } from 'lucide-react';
import './MonHocComponents.css';

export default function MonHocFilterBar({
  khoaList = [],
  boMonList = [],
  filterKhoa = '',
  setFilterKhoa,
  filterBoMon = '',
  setFilterBoMon,
  searchQuery = '',
  setSearchQuery,
  onRefresh,
  loading = false,
  totalCount = 0,
  selectedMhInfo = null,
  onClearSelection,
  isBoMonRole = false,
  scopedBoMonId = '',
  departmentFullName = ''
}) {
  const availableBoMons = isBoMonRole && scopedBoMonId
    ? boMonList.filter(bm => bm.MaBoMon === scopedBoMonId)
    : (filterKhoa && filterKhoa !== '__NULL__'
        ? boMonList.filter(bm => bm.MaKhoa === filterKhoa)
        : boMonList);

  const handleKhoaChange = (e) => {
    if (isBoMonRole) return;
    const newKhoa = e.target.value;
    setFilterKhoa(newKhoa);
    if (newKhoa && filterBoMon && filterBoMon !== '__NULL__') {
      const bm = boMonList.find(b => b.MaBoMon === filterBoMon);
      if (bm && bm.MaKhoa !== newKhoa) {
        setFilterBoMon('');
      }
    }
  };

  const hasFilter = isBoMonRole
    ? (!!searchQuery || !!selectedMhInfo)
    : (!!filterKhoa || !!filterBoMon || !!searchQuery || !!selectedMhInfo);

  const currentKhoaObj = khoaList.find(k => k.MaKhoa === filterKhoa);
  const currentBoMonObj = boMonList.find(b => b.MaBoMon === (isBoMonRole ? scopedBoMonId : filterBoMon));

  return (
    <div className="mh-filter-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 1. Context Breadcrumb */}
      <div className="mh-context-bar">
        <div className="mh-breadcrumb">
          <Layers size={15} style={{ color: '#3b82f6' }} />
          <span>Phạm vi hiển thị:</span>

          {isBoMonRole ? (
            <>
              <span className="mh-breadcrumb-item" style={{ color: '#0284c7', fontWeight: '700' }}>
                <Network size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px', color: '#0ea5e9' }} />
                {departmentFullName || currentBoMonObj?.TenBoMon || `Bộ môn ${scopedBoMonId}`}
              </span>
              {selectedMhInfo && (
                <>
                  <span style={{ color: '#cbd5e1' }}>/</span>
                  <span className="mh-breadcrumb-item" style={{ color: '#2563eb' }}>
                    <BookOpen size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                    {selectedMhInfo.TenMonHoc} ({selectedMhInfo.MaMonHoc})
                  </span>
                </>
              )}
            </>
          ) : (
            !filterKhoa && !filterBoMon && !selectedMhInfo ? (
              <span className="mh-breadcrumb-item">Tất cả môn học</span>
            ) : (
              <>
                {filterKhoa && (
                  <>
                    <span style={{ color: '#cbd5e1' }}>/</span>
                    <span className="mh-breadcrumb-item">
                      <School size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px', color: '#8b5cf6' }} />
                      {filterKhoa === '__NULL__' ? 'Chưa phân Khoa' : (currentKhoaObj?.TenKhoa || filterKhoa)}
                    </span>
                  </>
                )}
                {filterBoMon && (
                  <>
                    <span style={{ color: '#cbd5e1' }}>/</span>
                    <span className="mh-breadcrumb-item">
                      <Network size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px', color: '#0ea5e9' }} />
                      {filterBoMon === '__NULL__' ? 'Chưa phân bộ môn' : (currentBoMonObj?.TenBoMon || filterBoMon)}
                    </span>
                  </>
                )}
                {selectedMhInfo && (
                  <>
                    <span style={{ color: '#cbd5e1' }}>/</span>
                    <span className="mh-breadcrumb-item" style={{ color: '#2563eb' }}>
                      <BookOpen size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                      {selectedMhInfo.TenMonHoc} ({selectedMhInfo.MaMonHoc})
                    </span>
                  </>
                )}
              </>
            )
          )}

          <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '6px' }}>
            ({totalCount} môn học)
          </span>
        </div>

        {hasFilter && (
          <button
            type="button"
            className="mh-breadcrumb-clear"
            onClick={onClearSelection}
            title="Xóa bộ lọc và hiển thị tất cả"
          >
            <X size={12} style={{ display: 'inline', marginRight: '3px', verticalAlign: '-1px' }} />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* 2. Filter Controls Bar */}
      <div className="mh-filter-bar" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Lọc Khoa */}
        {!isBoMonRole && (
          <select
            className="mh-filter-select"
            style={{ minWidth: '180px' }}
            value={filterKhoa}
            onChange={handleKhoaChange}
          >
            <option value="">— Tất cả Khoa —</option>
            <option value="__NULL__">⊘ Chưa phân Khoa</option>
            {khoaList.map(k => (
              <option key={k.MaKhoa} value={k.MaKhoa}>
                {k.TenKhoa} ({k.MaKhoa})
              </option>
            ))}
          </select>
        )}

        {/* Lọc Bộ môn */}
        {!isBoMonRole ? (
          <select
            className="mh-filter-select"
            style={{ minWidth: '190px' }}
            value={filterBoMon}
            onChange={(e) => setFilterBoMon(e.target.value)}
          >
            <option value="">— Tất cả Bộ môn —</option>
            <option value="__NULL__">⊘ Chưa phân bộ môn</option>
            {availableBoMons.map(bm => (
              <option key={bm.MaBoMon} value={bm.MaBoMon}>
                {bm.TenBoMon} ({bm.MaBoMon})
              </option>
            ))}
          </select>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#f1f5f9',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.84rem',
            color: '#334155',
            fontWeight: '600'
          }}>
            <Network size={14} color="#0284c7" />
            <span>Bộ môn: {departmentFullName || currentBoMonObj?.TenBoMon || scopedBoMonId}</span>
            <Lock size={12} color="#64748b" />
          </div>
        )}

        {/* Search Input */}
        <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={isBoMonRole ? "Tìm môn học theo mã, tên môn..." : "Tìm theo mã MH, tên môn học..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          className="btn-refresh"
          title="Tải lại danh sách môn học"
          onClick={onRefresh}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}
