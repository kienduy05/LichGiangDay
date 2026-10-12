import React, { useState, useEffect, useMemo } from 'react';
import {
  BookMarked, School, Network, BookOpen, ChevronDown, ChevronRight,
  Search, X, ChevronsDownUp, ChevronsUpDown, PanelLeftClose, PanelLeftOpen
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
  onSelectMonHoc,
  isBoMonRole = false,
  scopedBoMonId = '',
  departmentFullName = '',
  isCollapsed = false,
  onToggleCollapse
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedKhoas, setExpandedKhoas] = useState({});
  const [expandedBoMons, setExpandedBoMons] = useState({});

  // Nếu là role BOMON: tự động mở rộng Khoa & Bộ môn của tài khoản
  useEffect(() => {
    if (isBoMonRole && scopedBoMonId) {
      setExpandedBoMons(prev => ({ ...prev, [scopedBoMonId]: true }));
      const foundBm = boMonList.find(b => b.MaBoMon === scopedBoMonId);
      if (foundBm?.MaKhoa) {
        setExpandedKhoas(prev => ({ ...prev, [foundBm.MaKhoa]: true }));
      }
    }
  }, [isBoMonRole, scopedBoMonId, boMonList]);

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

  // Build hierarchical data structure: CHỈ HIỆN MÔN NÀO CÓ LỚP HỌC PHẦN TRONG HỌC KỲ
  const treeData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    // 1. Map số lượng LHP theo MaMonHoc trong học kỳ hiện tại
    const countByMonHoc = {};
    let filteredLhpList = lhpList;

    if (isBoMonRole && scopedBoMonId) {
      filteredLhpList = filteredLhpList.filter(lhp => lhp.MaBoMon === scopedBoMonId);
    }

    filteredLhpList.forEach(lhp => {
      if (lhp.MaMonHoc) {
        countByMonHoc[lhp.MaMonHoc] = (countByMonHoc[lhp.MaMonHoc] || 0) + 1;
      }
    });

    let effectiveBoMonList = boMonList;
    let effectiveKhoaList = khoaList;

    if (isBoMonRole && scopedBoMonId) {
      effectiveBoMonList = effectiveBoMonList.filter(bm => bm.MaBoMon === scopedBoMonId);
      const targetKhoaIds = new Set(effectiveBoMonList.map(bm => bm.MaKhoa));
      effectiveKhoaList = effectiveKhoaList.filter(k => targetKhoaIds.has(k.MaKhoa));
    }

    const result = [];

    for (const k of effectiveKhoaList) {
      const boMonsOfKhoa = effectiveBoMonList.filter(bm => bm.MaKhoa === k.MaKhoa || (isBoMonRole && bm.MaBoMon === scopedBoMonId));
      const boMonNodes = [];
      let khoaLhpCount = 0;

      for (const bm of boMonsOfKhoa) {
        const mhsOfBm = monHocList.filter(mh => mh.MaBoMon === bm.MaBoMon);
        const monHocNodes = [];
        let boMonLhpCount = 0;

        for (const mh of mhsOfBm) {
          const lhpCount = countByMonHoc[mh.MaMonHoc] || 0;
          
          // 🔥 CHỈ LẤY MÔN HỌC ĐANG CÓ LỚP HỌC PHẦN TRONG HỌC KỲ (lhpCount > 0)
          if (lhpCount === 0) continue;

          boMonLhpCount += lhpCount;

          const mhMatchesSearch = !term || (
            mh.TenMonHoc?.toLowerCase().includes(term) ||
            mh.MaMonHoc?.toLowerCase().includes(term)
          );

          if (mhMatchesSearch) {
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

        // Chỉ hiển thị Bộ môn nếu có môn học mở lớp
        if (monHocNodes.length > 0) {
          boMonNodes.push({
            MaBoMon: bm.MaBoMon,
            TenBoMon: bm.TenBoMon || (bm.MaBoMon === scopedBoMonId ? departmentFullName : bm.MaBoMon),
            MaKhoa: k.MaKhoa,
            totalLhp: boMonLhpCount,
            monHocs: monHocNodes
          });
        }
      }

      // Chỉ hiển thị Khoa nếu có bộ môn mở lớp
      if (boMonNodes.length > 0) {
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
      totalLhps: filteredLhpList.length
    };
  }, [khoaList, boMonList, monHocList, lhpList, searchTerm, isBoMonRole, scopedBoMonId, departmentFullName]);

  const isAllSelected = !selectedKhoaId && (!selectedBoMonId || (isBoMonRole && selectedBoMonId === scopedBoMonId && !selectedMonHocId)) && !selectedMonHocId;

  if (isCollapsed) {
    return (
      <aside
        className="lhp-treeview-sidebar collapsed"
        onClick={onToggleCollapse}
        title="Nhấn để mở rộng Cây Môn Học Mở Lớp"
      >
        <button type="button" className="lhp-btn-expand-bar" aria-label="Mở rộng cây môn học">
          <BookMarked size={16} />
          <span className="lhp-collapsed-vertical-text">Cây Môn Học</span>
          <span className="lhp-collapsed-badge">{treeData.totalLhps || 0}</span>
          <PanelLeftOpen size={16} className="lhp-collapsed-open-icon" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="lhp-treeview-sidebar">
      {/* Header */}
      <div className="lhp-treeview-header">
        <div className="lhp-treeview-title-row">
          <div className="lhp-treeview-title">
            <BookMarked size={16} color="#3b82f6" />
            <span>Môn Học Mở Lớp</span>
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
            {onToggleCollapse && (
              <button
                type="button"
                className="lhp-tree-action-btn collapse-btn"
                onClick={onToggleCollapse}
                title="Thu gọn cây môn học"
              >
                <PanelLeftClose size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Search inside tree */}
        <div className="lhp-tree-search-box">
          <Search size={14} className="lhp-tree-search-icon" />
          <input
            type="text"
            placeholder={isBoMonRole ? "Tìm theo mã hoặc tên môn học..." : "Tìm theo mã hoặc tên đơn vị..."}
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
            onSelectBoMon(isBoMonRole ? scopedBoMonId : '');
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
          const isKhoaExpanded = !!expandedKhoas[khoa.MaKhoa] || searchTerm.trim() !== '' || isBoMonRole;
          const isKhoaSelected = selectedKhoaId === khoa.MaKhoa && (!selectedBoMonId || (isBoMonRole && selectedBoMonId === scopedBoMonId)) && !selectedMonHocId;

          return (
            <div key={khoa.MaKhoa} className="lhp-tree-group-khoa">
              {/* Node Khoa */}
              <div
                className={`lhp-tree-node level-1 ${isKhoaSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectKhoa(khoa.MaKhoa);
                  onSelectBoMon(isBoMonRole ? scopedBoMonId : '');
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
                const isBmExpanded = !!expandedBoMons[bm.MaBoMon] || searchTerm.trim() !== '' || isBoMonRole;
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
                          <span className="lhp-tree-count-pill">
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
            Không có môn học nào mở lớp trong học kỳ này.
          </div>
        )}
      </div>
    </aside>
  );
}
