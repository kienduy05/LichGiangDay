import React from 'react';
import { Search, X, RefreshCw, Layers, School, Network, BookOpen, Filter, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import './LopHocPhanComponents.css';

export default function LopHocPhanFilterBar({
  khoaList = [],
  boMonList = [],
  monHocList = [],
  selectedKhoaId = '',
  selectedBoMonId = '',
  selectedMonHocId = '',
  filterLoaiHoc = '',
  setFilterLoaiHoc,
  searchQuery = '',
  setSearchQuery,
  onRefresh,
  loading = false,
  totalCount = 0,
  onClearSelection,
  isTreeCollapsed = false,
  onToggleTree
}) {
  const hasFilter = !!selectedKhoaId || !!selectedBoMonId || !!selectedMonHocId || !!filterLoaiHoc || !!searchQuery;

  const currentKhoaObj = khoaList.find(k => k.MaKhoa === selectedKhoaId);
  const currentBoMonObj = boMonList.find(b => b.MaBoMon === selectedBoMonId);
  const currentMonHocObj = monHocList.find(m => m.MaMonHoc === selectedMonHocId);

  return (
    <div className="lhp-filter-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 1. Context Breadcrumb */}
      <div className="lhp-context-bar">
        <div className="lhp-breadcrumb">
          {onToggleTree && (
            <button
              type="button"
              className={`lhp-btn-toggle-tree ${isTreeCollapsed ? 'collapsed' : ''}`}
              onClick={onToggleTree}
              title={isTreeCollapsed ? 'Mở rộng Cây Môn Học' : 'Thu gọn Cây Môn Học để tăng diện tích bảng'}
            >
              {isTreeCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
              <span>{isTreeCollapsed ? 'Hiện Cây' : 'Thu Gọn Cây'}</span>
            </button>
          )}

          <Layers size={15} style={{ color: '#3b82f6' }} />
          <span>Phạm vi:</span>

          {!selectedKhoaId && !selectedBoMonId && !selectedMonHocId ? (
            <span className="lhp-breadcrumb-item">Tất cả lớp học phần</span>
          ) : (
            <>
              {selectedKhoaId && (
                <>
                  <span style={{ color: '#cbd5e1' }}>/</span>
                  <span className="lhp-breadcrumb-item">
                    <School size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px', color: '#8b5cf6' }} />
                    {selectedKhoaId === '__NULL__' ? 'Chưa phân Khoa' : (currentKhoaObj?.TenKhoa || selectedKhoaId)}
                  </span>
                </>
              )}
              {selectedBoMonId && (
                <>
                  <span style={{ color: '#cbd5e1' }}>/</span>
                  <span className="lhp-breadcrumb-item">
                    <Network size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px', color: '#0ea5e9' }} />
                    {selectedBoMonId === '__NULL__' ? 'Chưa phân bộ môn' : (currentBoMonObj?.TenBoMon || selectedBoMonId)}
                  </span>
                </>
              )}
              {selectedMonHocId && (
                <>
                  <span style={{ color: '#cbd5e1' }}>/</span>
                  <span className="lhp-breadcrumb-item" style={{ color: '#2563eb' }}>
                    <BookOpen size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                    {currentMonHocObj?.TenMonHoc || selectedMonHocId}
                  </span>
                </>
              )}
            </>
          )}

          <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '6px' }}>
            ({totalCount} lớp HP)
          </span>
        </div>

        {hasFilter && (
          <button
            type="button"
            className="lhp-breadcrumb-clear"
            onClick={onClearSelection}
            title="Xóa bộ lọc và hiển thị toàn bộ"
          >
            <X size={12} style={{ display: 'inline', marginRight: '3px', verticalAlign: '-1px' }} />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* 2. Filter Controls Bar */}
      <div className="lhp-filter-bar" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Lọc Kiểu học */}
        <select
          className="lhp-filter-select"
          style={{ minWidth: '150px' }}
          value={filterLoaiHoc}
          onChange={(e) => setFilterLoaiHoc(e.target.value)}
        >
          <option value="">— Tất cả kiểu học —</option>
          <option value="LT">LT — Lý thuyết</option>
          <option value="BT">BT — Bài tập</option>
          <option value="TH">TH — Thực hành</option>
          <option value="BTL">BTL — Bài tập lớn</option>
        </select>

        {/* Search Input */}
        <div className="search-box" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo mã LHP, tên lớp HP, tên môn..."
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
          title="Tải lại danh sách"
          onClick={onRefresh}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}
