import React from 'react';
import { Search, X, RefreshCw, Layers, School, Users } from 'lucide-react';
import './LopSinhVienComponents.css';

export default function LopSinhVienFilterBar({
  khoaList = [],
  filterKhoa = '',
  setFilterKhoa,
  searchQuery = '',
  setSearchQuery,
  onRefresh,
  loading = false,
  totalCount = 0,
  selectedLsvInfo = null,
  onClearSelection
}) {
  const hasFilter = !!filterKhoa || !!searchQuery || !!selectedLsvInfo;
  const currentKhoaObj = khoaList.find(k => k.MaKhoa === filterKhoa);

  return (
    <div className="lsv-filter-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 1. Context Breadcrumb */}
      <div className="lsv-context-bar">
        <div className="lsv-breadcrumb">
          <Layers size={15} style={{ color: '#3b82f6' }} />
          <span>Phạm vi hiển thị:</span>

          {!filterKhoa && !selectedLsvInfo ? (
            <span className="lsv-breadcrumb-item">Tất cả lớp sinh viên</span>
          ) : (
            <>
              {filterKhoa && (
                <>
                  <span style={{ color: '#cbd5e1' }}>/</span>
                  <span className="lsv-breadcrumb-item">
                    <School size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px', color: '#8b5cf6' }} />
                    {filterKhoa === '__NULL__' ? 'Chưa phân Khoa' : (currentKhoaObj?.TenKhoa || filterKhoa)}
                  </span>
                </>
              )}
              {selectedLsvInfo && (
                <>
                  <span style={{ color: '#cbd5e1' }}>/</span>
                  <span className="lsv-breadcrumb-item" style={{ color: '#2563eb' }}>
                    <Users size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                    {selectedLsvInfo.TenLopSinhVien} ({selectedLsvInfo.MaLopSinhVien})
                  </span>
                </>
              )}
            </>
          )}

          <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '6px' }}>
            ({totalCount} lớp sinh viên)
          </span>
        </div>

        {hasFilter && (
          <button
            type="button"
            className="lsv-breadcrumb-clear"
            onClick={onClearSelection}
            title="Xóa bộ lọc và hiển thị tất cả"
          >
            <X size={12} style={{ display: 'inline', marginRight: '3px', verticalAlign: '-1px' }} />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* 2. Filter Controls Bar */}
      <div className="lsv-filter-bar" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Lọc Khoa */}
        <select
          className="lsv-filter-select"
          style={{ minWidth: '220px' }}
          value={filterKhoa}
          onChange={(e) => setFilterKhoa(e.target.value)}
        >
          <option value="">— Tất cả các Khoa —</option>
          <option value="__NULL__">⊘ Chưa phân Khoa</option>
          {khoaList.map(k => (
            <option key={k.MaKhoa} value={k.MaKhoa}>
              {k.TenKhoa} ({k.MaKhoa})
            </option>
          ))}
        </select>

        {/* Search Input */}
        <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo mã lớp, tên lớp sinh viên..."
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
          title="Tải lại danh sách lớp sinh viên"
          onClick={onRefresh}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}
