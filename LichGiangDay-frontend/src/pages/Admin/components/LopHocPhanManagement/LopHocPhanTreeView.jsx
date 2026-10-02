import React, { useState, useMemo } from 'react';
import {
  BookMarked, School, Network, BookOpen, ChevronDown, ChevronRight,
  Search, X, ChevronsDownUp, ChevronsUpDown
} from 'lucide-react';
import './LopHocPhanComponents.css';

export default function LopHocPhanTreeView({
  khoaList = [],
  boMonList = [],
  monHocList = [],
  lhpList = [],
  selectedKhoaId = '',
  selectedBoMonId = '',
  selectedMonHocId = '',
  onSelectKhoa,
  onSelectBoMon,
  onSelectMonHoc
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedKhoas, setExpandedKhoas] = useState({});
  const [expandedBoMons, setExpandedBoMons] = useState({});

  const toggleKhoa = (maKhoa, e) => {
    e?.stopPropagation();
    setExpandedKhoas(prev => ({ ...prev, [maKhoa]: !prev[maKhoa] }));
  };

  const toggleBoMon = (maBoMon, e) => {
    e?.stopPropagation();
    setExpandedBoMons(prev => ({ ...prev, [maBoMon]: !prev[maBoMon] }));
  };

  const handleExpandAll = () => {
    const allK = {};
    const allBm = {};
    khoaList.forEach(k => { allK[k.MaKhoa] = true; });
    boMonList.forEach(b => { allBm[b.MaBoMon] = true; });
    setExpandedKhoas(allK);
    setExpandedBoMons(allBm);
  };

  const handleCollapseAll = () => {
    setExpandedKhoas({});
    setExpandedBoMons({});
  };

  // Build hierarchical data structure: Khoa -> BoMon -> MonHoc (with LHP counts in current semester)
  const treeData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    // Map số lượng LHP theo MaMonHoc trong học kỳ hiện tại
    const countByMonHoc = {};
    lhpList.forEach(lhp => {
      if (lhp.MaMonHoc) {
        countByMonHoc[lhp.MaMonHoc] = (countByMonHoc[lhp.MaMonHoc] || 0) + 1;
      }
    });

    const result = [];

    for (const k of khoaList) {
      const boMonsOfKhoa = boMonList.filter(bm => bm.MaKhoa === k.MaKhoa);
      const boMonNodes = [];
      let khoaLhpCount = 0;

      for (const bm of boMonsOfKhoa) {
        const mhsOfBm = monHocList.filter(mh => mh.MaBoMon === bm.MaBoMon);
        const monHocNodes = [];
        let boMonLhpCount = 0;

        for (const mh of mhsOfBm) {
          const lhpCount = countByMonHoc[mh.MaMonHoc] || 0;
          boMonLhpCount += lhpCount;

          const mhMatchesSearch = term && (
            mh.TenMonHoc?.toLowerCase().includes(term) ||
            mh.MaMonHoc?.toLowerCase().includes(term)
          );

          if (!term || lhpCount > 0 || mhMatchesSearch) {
            monHocNodes.push({
              MaMonHoc: mh.MaMonHoc,
              TenMonHoc: mh.TenMonHoc,
              SoTinChi: mh.SoTinChi,
              MaBoMon: bm.MaBoMon,
              totalLhp: lhpCount
            });
          }
        }

        khoaLhpCount += boMonLhpCount;

        const bmMatchesSearch = term && bm.TenBoMon?.toLowerCase().includes(term);
        if (!term || boMonLhpCount > 0 || monHocNodes.length > 0 || bmMatchesSearch) {
          boMonNodes.push({
            MaBoMon: bm.MaBoMon,
            TenBoMon: bm.TenBoMon,
            MaKhoa: k.MaKhoa,
            totalLhp: boMonLhpCount,
            monHocs: monHocNodes
          });
        }
      }

      const khoaMatchesSearch = term && k.TenKhoa?.toLowerCase().includes(term);
      if (!term || khoaLhpCount > 0 || boMonNodes.length > 0 || khoaMatchesSearch) {
        result.push({
          MaKhoa: k.MaKhoa,
          TenKhoa: k.TenKhoa,
          totalLhp: khoaLhpCount,
          boMons: boMonNodes
        });
      }
    }

    return {
      tree: result,
      totalLhps: lhpList.length
    };
  }, [khoaList, boMonList, monHocList, lhpList, searchTerm]);

  const isAllSelected = !selectedKhoaId && !selectedBoMonId && !selectedMonHocId;

  return (
    <aside className="lhp-treeview-sidebar">
      {/* Header */}
      <div className="lhp-treeview-header">
        <div className="lhp-treeview-title-row">
          <div className="lhp-treeview-title">
            <BookMarked size={16} color="#3b82f6" />
            <span>Phân Cấp Môn Học</span>
          </div>
          <div className="lhp-tree-actions">
            <button
              type="button"
              className="lhp-tree-action-btn"
              onClick={handleExpandAll}
              title="Mở rộng tất cả"
            >
              <ChevronsUpDown size={14} />
            </button>
            <button
              type="button"
              className="lhp-tree-action-btn"
              onClick={handleCollapseAll}
              title="Thu gọn tất cả"
            >
              <ChevronsDownUp size={14} />
            </button>
          </div>
        </div>

        {/* Search inside tree */}
        <div className="lhp-tree-search-box">
          <Search size={14} className="lhp-tree-search-icon" />
          <input
            type="text"
            placeholder="Lọc khoa, bộ môn, môn học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="lhp-tree-clear-btn"
              onClick={() => setSearchTerm('')}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Tree View Body */}
      <div className="lhp-treeview-body">
        {/* Root Node: Tất cả Lớp Học Phần */}
        <div
          className={`lhp-tree-node ${isAllSelected ? 'active' : ''}`}
          onClick={() => {
            onSelectKhoa('');
            onSelectBoMon('');
            onSelectMonHoc('');
          }}
        >
          <div className="lhp-tree-node-label">
            <BookMarked size={16} className="lhp-tree-node-icon root" />
            <span className="lhp-tree-node-text font-semibold">Tất cả lớp học phần</span>
          </div>
          <span className="lhp-tree-node-badge">{treeData.totalLhps}</span>
        </div>

        {/* Level 1: Khoa Nodes */}
        {treeData.tree.map(khoa => {
          const isKhoaExpanded = !!expandedKhoas[khoa.MaKhoa] || searchTerm.trim() !== '';
          const isKhoaSelected = selectedKhoaId === khoa.MaKhoa && !selectedBoMonId && !selectedMonHocId;

          return (
            <div key={khoa.MaKhoa} className="lhp-tree-group-khoa">
              {/* Node Khoa */}
              <div
                className={`lhp-tree-node level-1 ${isKhoaSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectKhoa(khoa.MaKhoa);
                  onSelectBoMon('');
                  onSelectMonHoc('');
                }}
              >
                <div className="lhp-tree-node-label">
                  <button
                    type="button"
                    className="lhp-tree-expand-btn"
                    onClick={(e) => toggleKhoa(khoa.MaKhoa, e)}
                  >
                    {isKhoaExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                  <School size={15} className="lhp-tree-node-icon khoa" />
                  <span className="lhp-tree-node-text" title={khoa.TenKhoa}>
                    {khoa.TenKhoa}
                  </span>
                </div>
                <span className="lhp-tree-node-badge">{khoa.totalLhp}</span>
              </div>

              {/* Level 2: BoMon Nodes */}
              {isKhoaExpanded && khoa.boMons.map(bm => {
                const isBmExpanded = !!expandedBoMons[bm.MaBoMon] || searchTerm.trim() !== '';
                const isBmSelected = selectedBoMonId === bm.MaBoMon && !selectedMonHocId;

                return (
                  <div key={bm.MaBoMon} className="lhp-tree-group-bomon">
                    {/* Node BoMon */}
                    <div
                      className={`lhp-tree-node level-2 ${isBmSelected ? 'active' : ''}`}
                      onClick={() => {
                        onSelectKhoa(khoa.MaKhoa);
                        onSelectBoMon(bm.MaBoMon);
                        onSelectMonHoc('');
                      }}
                    >
                      <div className="lhp-tree-node-label">
                        <button
                          type="button"
                          className="lhp-tree-expand-btn"
                          onClick={(e) => toggleBoMon(bm.MaBoMon, e)}
                        >
                          {isBmExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                        <Network size={14} className="lhp-tree-node-icon bomon" />
                        <span className="lhp-tree-node-text" title={bm.TenBoMon}>
                          {bm.TenBoMon}
                        </span>
                      </div>
                      <span className="lhp-tree-node-badge sub">{bm.totalLhp}</span>
                    </div>

                    {/* Level 3: MonHoc Nodes */}
                    {isBmExpanded && bm.monHocs.map(mh => {
                      const isMhSelected = selectedMonHocId === mh.MaMonHoc;

                      return (
                        <div
                          key={mh.MaMonHoc}
                          className={`lhp-tree-mh-item ${isMhSelected ? 'active' : ''}`}
                          onClick={() => {
                            onSelectKhoa(khoa.MaKhoa);
                            onSelectBoMon(bm.MaBoMon);
                            onSelectMonHoc(mh.MaMonHoc);
                          }}
                          title={`${mh.TenMonHoc} (${mh.MaMonHoc}) - ${mh.totalLhp} lớp HP`}
                        >
                          <div className="lhp-tree-mh-info">
                            <div className="lhp-tree-mh-icon-wrap">
                              <BookOpen size={12} />
                            </div>
                            <span className="lhp-tree-mh-name">{mh.TenMonHoc}</span>
                            <span className="lhp-tree-mh-code">{mh.MaMonHoc}</span>
                          </div>
                          <span className={`lhp-tree-count-pill ${mh.totalLhp === 0 ? 'empty' : ''}`}>
                            {mh.totalLhp} LHP
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}

        {treeData.tree.length === 0 && (
          <div className="tree-empty-text text-center" style={{ padding: '24px 10px', color: '#94a3b8', fontSize: '0.82rem' }}>
            Không tìm thấy khoa / bộ môn / môn học nào khớp từ khóa.
          </div>
        )}
      </div>
    </aside>
  );
}
