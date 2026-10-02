import React, { useState, useMemo } from 'react';
import {
  BookOpen, School, Network, ChevronDown, ChevronRight,
  Search, X, BookMarked, ChevronsDownUp, ChevronsUpDown, Layers
} from 'lucide-react';
import './MonHocComponents.css';

export default function MonHocTreeView({
  khoaList = [],
  boMonList = [],
  monHocList = [],
  selectedKhoaId = '',
  selectedBoMonId = '',
  selectedMhId = '',
  onSelectKhoa,
  onSelectBoMon,
  onSelectMh
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedKhoas, setExpandedKhoas] = useState({});
  const [expandedBoMons, setExpandedBoMons] = useState({});

  // Toggle node expand/collapse
  const toggleKhoa = (maKhoa, e) => {
    e?.stopPropagation();
    setExpandedKhoas(prev => ({ ...prev, [maKhoa]: !prev[maKhoa] }));
  };

  const toggleBoMon = (maBoMon, e) => {
    e?.stopPropagation();
    setExpandedBoMons(prev => ({ ...prev, [maBoMon]: !prev[maBoMon] }));
  };

  // Expand / Collapse all
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

  // Build hierarchical data structure
  const treeData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let filteredMHs = monHocList;
    if (term) {
      filteredMHs = filteredMHs.filter(mh =>
        (mh.TenMonHoc && mh.TenMonHoc.toLowerCase().includes(term)) ||
        (mh.MaMonHoc && mh.MaMonHoc.toLowerCase().includes(term)) ||
        (mh.TenBoMon && mh.TenBoMon.toLowerCase().includes(term)) ||
        (mh.TenKhoa && mh.TenKhoa.toLowerCase().includes(term))
      );
    }

    const result = [];

    for (const k of khoaList) {
      const boMonsOfKhoa = boMonList.filter(bm => bm.MaKhoa === k.MaKhoa);
      const boMonNodes = [];

      let khoaCount = 0;

      for (const bm of boMonsOfKhoa) {
        const mhsOfBm = filteredMHs.filter(mh => mh.MaBoMon === bm.MaBoMon);
        khoaCount += mhsOfBm.length;

        const bmMatchesSearch = term && bm.TenBoMon?.toLowerCase().includes(term);
        if (!term || mhsOfBm.length > 0 || bmMatchesSearch) {
          boMonNodes.push({
            MaBoMon: bm.MaBoMon,
            TenBoMon: bm.TenBoMon,
            MaKhoa: k.MaKhoa,
            totalCount: mhsOfBm.length,
            monHocs: mhsOfBm
          });
        }
      }

      const khoaMatchesSearch = term && k.TenKhoa?.toLowerCase().includes(term);
      if (!term || khoaCount > 0 || boMonNodes.length > 0 || khoaMatchesSearch) {
        result.push({
          MaKhoa: k.MaKhoa,
          TenKhoa: k.TenKhoa,
          totalCount: khoaCount,
          boMons: boMonNodes
        });
      }
    }

    // Nhóm Môn học chưa phân bộ môn (nếu có)
    const unassignedMHs = filteredMHs.filter(mh => !mh.MaBoMon);
    if (unassignedMHs.length > 0) {
      result.push({
        MaKhoa: '__NULL__',
        TenKhoa: 'Chưa phân Khoa / Bộ môn',
        totalCount: unassignedMHs.length,
        boMons: [
          {
            MaBoMon: '__NULL__',
            TenBoMon: 'Chưa phân bộ môn',
            MaKhoa: '__NULL__',
            totalCount: unassignedMHs.length,
            monHocs: unassignedMHs
          }
        ]
      });
    }

    return {
      tree: result,
      totalMHs: filteredMHs.length
    };
  }, [khoaList, boMonList, monHocList, searchTerm]);

  const isAllSelected = !selectedKhoaId && !selectedBoMonId && !selectedMhId;

  return (
    <aside className="mh-treeview-sidebar">
      {/* Header */}
      <div className="mh-treeview-header">
        <div className="mh-treeview-title-row">
          <div className="mh-treeview-title">
            <BookOpen size={16} color="#3b82f6" />
            <span>Phân Cấp Môn Học</span>
          </div>
          <div className="mh-tree-actions">
            <button
              type="button"
              className="mh-tree-action-btn"
              onClick={handleExpandAll}
              title="Mở rộng tất cả"
            >
              <ChevronsUpDown size={14} />
            </button>
            <button
              type="button"
              className="mh-tree-action-btn"
              onClick={handleCollapseAll}
              title="Thu gọn tất cả"
            >
              <ChevronsDownUp size={14} />
            </button>
          </div>
        </div>

        {/* Search inside tree */}
        <div className="mh-tree-search-box">
          <Search size={14} className="mh-tree-search-icon" />
          <input
            type="text"
            placeholder="Lọc khoa, bộ môn, môn học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="mh-tree-clear-btn"
              onClick={() => setSearchTerm('')}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Tree View Body */}
      <div className="mh-treeview-body">
        {/* Root Node: Tất cả Môn Học */}
        <div
          className={`mh-tree-node ${isAllSelected ? 'active' : ''}`}
          onClick={() => {
            onSelectKhoa('');
            onSelectBoMon('');
            onSelectMh('');
          }}
        >
          <div className="mh-tree-node-label">
            <BookMarked size={16} className="mh-tree-node-icon root" />
            <span className="mh-tree-node-text font-semibold">Tất cả môn học</span>
          </div>
          <span className="mh-tree-node-badge">{treeData.totalMHs}</span>
        </div>

        {/* Level 1: Khoa Nodes */}
        {treeData.tree.map(khoa => {
          const isKhoaExpanded = !!expandedKhoas[khoa.MaKhoa] || searchTerm.trim() !== '';
          const isKhoaSelected = selectedKhoaId === khoa.MaKhoa && !selectedBoMonId && !selectedMhId;

          return (
            <div key={khoa.MaKhoa} className="mh-tree-group-khoa">
              {/* Node Khoa */}
              <div
                className={`mh-tree-node level-1 ${isKhoaSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectKhoa(khoa.MaKhoa);
                  onSelectBoMon('');
                  onSelectMh('');
                }}
              >
                <div className="mh-tree-node-label">
                  <button
                    type="button"
                    className="mh-tree-expand-btn"
                    onClick={(e) => toggleKhoa(khoa.MaKhoa, e)}
                  >
                    {isKhoaExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                  <School size={15} className="mh-tree-node-icon khoa" />
                  <span className="mh-tree-node-text" title={khoa.TenKhoa}>
                    {khoa.TenKhoa}
                  </span>
                </div>
                <span className="mh-tree-node-badge">{khoa.totalCount}</span>
              </div>

              {/* Level 2: BoMon Nodes */}
              {isKhoaExpanded && khoa.boMons.map(bm => {
                const isBmExpanded = !!expandedBoMons[bm.MaBoMon] || searchTerm.trim() !== '';
                const isBmSelected = selectedBoMonId === bm.MaBoMon && !selectedMhId;

                return (
                  <div key={bm.MaBoMon} className="mh-tree-group-bomon">
                    {/* Node BoMon */}
                    <div
                      className={`mh-tree-node level-2 ${isBmSelected ? 'active' : ''}`}
                      onClick={() => {
                        onSelectKhoa(khoa.MaKhoa);
                        onSelectBoMon(bm.MaBoMon);
                        onSelectMh('');
                      }}
                    >
                      <div className="mh-tree-node-label">
                        <button
                          type="button"
                          className="mh-tree-expand-btn"
                          onClick={(e) => toggleBoMon(bm.MaBoMon, e)}
                        >
                          {isBmExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                        <Network size={14} className="mh-tree-node-icon bomon" />
                        <span className="mh-tree-node-text" title={bm.TenBoMon}>
                          {bm.TenBoMon}
                        </span>
                      </div>
                      <span className="mh-tree-node-badge sub">{bm.totalCount}</span>
                    </div>

                    {/* Level 3: MonHoc Nodes */}
                    {isBmExpanded && bm.monHocs.map(mh => {
                      const isMhSelected = selectedMhId === mh.MaMonHoc;

                      return (
                        <div
                          key={mh.MaMonHoc}
                          className={`mh-tree-mh-item ${isMhSelected ? 'active' : ''}`}
                          onClick={() => {
                            onSelectKhoa(khoa.MaKhoa);
                            onSelectBoMon(bm.MaBoMon);
                            onSelectMh(mh.MaMonHoc);
                          }}
                          title={`${mh.TenMonHoc} (${mh.MaMonHoc}) - ${mh.SoTinChi || 0} tín chỉ`}
                        >
                          <div className="mh-tree-mh-info">
                            <div className="mh-tree-mh-icon-wrap">
                              <BookOpen size={12} />
                            </div>
                            <span className="mh-tree-mh-name">{mh.TenMonHoc}</span>
                            <span className="mh-tree-mh-code">{mh.MaMonHoc}</span>
                          </div>
                          {mh.SoTinChi != null && (
                            <span className="mh-tree-tc-pill">{mh.SoTinChi}TC</span>
                          )}
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
