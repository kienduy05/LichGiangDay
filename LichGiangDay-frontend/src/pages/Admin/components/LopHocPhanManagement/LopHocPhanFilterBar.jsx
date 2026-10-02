import { Search, X, RefreshCw } from 'lucide-react';

export default function LopHocPhanFilterBar({
  hocKyList, boMonList, monHocList,
  filterHocKy, setFilterHocKy,
  filterBoMon, setFilterBoMon,
  filterMonHoc, setFilterMonHoc,
  filterLoaiHoc, setFilterLoaiHoc,
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

      {/* Môn học */}
      <select className="lhp-filter-select" style={{ minWidth: '160px' }} value={filterMonHoc} onChange={e => setFilterMonHoc(e.target.value)}>
        <option value="">— Tất cả Môn học —</option>
        {monHocList.map(mh => (
          <option key={mh.MaMonHoc} value={mh.MaMonHoc}>{mh.TenMonHoc}</option>
        ))}
      </select>

      {/* Kiểu học */}
      <select className="lhp-filter-select" style={{ minWidth: '130px' }} value={filterLoaiHoc} onChange={e => setFilterLoaiHoc(e.target.value)}>
        <option value="">— Kiểu học —</option>
        <option value="LT">LT — Lý thuyết</option>
        <option value="BT">BT — Bài tập</option>
        <option value="TH">TH — Thực hành</option>
        <option value="BTL">BTL — Bài tập lớn</option>
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
