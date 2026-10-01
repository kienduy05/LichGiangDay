import { Search, X, RefreshCw } from 'lucide-react';

export default function LopHocPhanFilterBar({
  hocKyList, boMonList, monHocList, giangVienList,
  filterHocKy, setFilterHocKy,
  filterBoMon, setFilterBoMon,
  filterMonHoc, setFilterMonHoc,
  filterGiangVien, setFilterGiangVien,
  filterTrangThai, setFilterTrangThai,
  searchQuery, setSearchQuery,
  loading, onRefresh
}) {
  return (
    <div className="lhp-filter-bar">
      {/* Học kỳ (bắt buộc) */}
      <select className="lhp-filter-select" value={filterHocKy} onChange={e => setFilterHocKy(e.target.value)}>
        <option value="">— Chọn Học kỳ —</option>
        {hocKyList.map(hk => (
          <option key={hk.MaHocKy} value={hk.MaHocKy}>
            {hk.TenHocKy} {hk.NamHoc ? `(${hk.NamHoc})` : ''}
          </option>
        ))}
      </select>

      {/* Bộ môn */}
      <select className="lhp-filter-select" style={{ minWidth: '160px' }} value={filterBoMon} onChange={e => setFilterBoMon(e.target.value)}>
        <option value="">— Tất cả Bộ môn —</option>
        {boMonList.map(bm => (
          <option key={bm.MaBoMon} value={bm.MaBoMon}>{bm.TenBoMon}</option>
        ))}
      </select>

      {/* Trạng thái phân công */}
      <select className="lhp-filter-select" style={{ minWidth: '170px' }} value={filterTrangThai} onChange={e => setFilterTrangThai(e.target.value)}>
        <option value="">— Trạng thái PC —</option>
        <option value="Assigned">✓ Đã phân công</option>
        <option value="Unassigned">✕ Chưa phân công</option>
      </select>

      {/* Search */}
      <div className="search-box" style={{ flex: 1, minWidth: '180px' }}>
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Tìm mã LHP, tên môn..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-search-btn" onClick={() => setSearchQuery('')}><X size={14} /></button>
        )}
      </div>

      <button className="btn-refresh" title="Tải lại" onClick={onRefresh}>
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}
