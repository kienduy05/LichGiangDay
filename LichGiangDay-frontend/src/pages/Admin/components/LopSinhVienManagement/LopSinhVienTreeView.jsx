import React, { useState, useMemo } from 'react';
import {
  Users, School, ChevronDown, ChevronRight,
  Search, X, ChevronsDownUp, ChevronsUpDown, GraduationCap,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import './LopSinhVienComponents.css';

export default function LopSinhVienTreeView({
  khoaList = [],
  lsvList = [],
  selectedKhoaId = '',
  selectedLsvId = '',
  onSelectKhoa,
  onSelectLsv,
  isCollapsed = false,
  onToggleCollapse
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedKhoas, setExpandedKhoas] = useState({});

  const toggleKhoa = (maKhoa, e) => {
    e?.stopPropagation();
    setExpandedKhoas(prev => ({ ...prev, [maKhoa]: !prev[maKhoa] }));
  };

  const handleExpandAll = () => {
    const allK = {};
    khoaList.forEach(k => { allK[k.MaKhoa] = true; });
    setExpandedKhoas(allK);
  };

  const handleCollapseAll = () => {
    setExpandedKhoas({});
  };

  // Build 1-level hierarchical tree: Khoa -> LopSinhVien
  const treeData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let filteredLSVs = lsvList;
    if (term) {
      filteredLSVs = filteredLSVs.filter(lsv =>
        (lsv.TenLopSinhVien && lsv.TenLopSinhVien.toLowerCase().includes(term)) ||
        (lsv.MaLopSinhVien && lsv.MaLopSinhVien.toLowerCase().includes(term)) ||
        (lsv.TenKhoa && lsv.TenKhoa.toLowerCase().includes(term))
      );
    }

    const result = [];

    for (const k of khoaList) {
      const lsvsOfKhoa = filteredLSVs.filter(lsv => lsv.MaKhoa === k.MaKhoa);
      const khoaMatchesSearch = term && k.TenKhoa?.toLowerCase().includes(term);

      if (!term || lsvsOfKhoa.length > 0 || khoaMatchesSearch) {
        result.push({
          MaKhoa: k.MaKhoa,
          TenKhoa: k.TenKhoa,
          totalCount: lsvsOfKhoa.length,
          classes: lsvsOfKhoa
        });
      }
    }

    // Nhóm lớp chưa phân khoa (nếu có)
    const unassignedLSVs = filteredLSVs.filter(lsv => !lsv.MaKhoa);
    if (unassignedLSVs.length > 0) {
      result.push({
        MaKhoa: '__NULL__',
        TenKhoa: 'Chưa phân Khoa',
        totalCount: unassignedLSVs.length,
        classes: unassignedLSVs
      });
    }

    return {
      tree: result,
      totalClasses: filteredLSVs.length
    };
  }, [khoaList, lsvList, searchTerm]);

  const isAllSelected = !selectedKhoaId && !selectedLsvId;

  if (isCollapsed) {
    return (
      <aside
        className="lsv-treeview-sidebar collapsed"
        onClick={onToggleCollapse}
        title="Nhấn để mở rộng Phân Cấp Khoa"
      >
        <button type="button" className="lsv-btn-expand-bar" aria-label="Mở rộng phân cấp khoa">
          <GraduationCap size={16} />
          <span className="lsv-collapsed-vertical-text">Phân Cấp Khoa</span>
          <span className="lsv-collapsed-badge">{treeData.totalClasses || 0}</span>
          <PanelLeftOpen size={16} className="lsv-collapsed-open-icon" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="lsv-treeview-sidebar">
      {/* Header */}
      <div className="lsv-treeview-header">
        <div className="lsv-treeview-title-row">
          <div className="lsv-treeview-title">
            <GraduationCap size={16} color="#3b82f6" />
            <span>Cơ Cấu Lớp Sinh Viên</span>
          </div>
          <div className="lsv-tree-actions">
            <button
              type="button"
              className="lsv-tree-action-btn"
              onClick={handleExpandAll}
              title="Mở rộng tất cả"
            >
              <ChevronsUpDown size={14} />
            </button>
            <button
              type="button"
              className="lsv-tree-action-btn"
              onClick={handleCollapseAll}
              title="Thu gọn tất cả"
            >
              <ChevronsDownUp size={14} />
            </button>
            {onToggleCollapse && (
              <button
                type="button"
                className="lsv-tree-action-btn collapse-btn"
                onClick={onToggleCollapse}
                title="Thu gọn cây khoa"
              >
                <PanelLeftClose size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Search inside tree */}
        <div className="lsv-tree-search-box">
          <Search size={14} className="lsv-tree-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên đơn vị..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="lsv-tree-clear-btn"
              onClick={() => setSearchTerm('')}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Tree View Body */}
      <div className="lsv-treeview-body">
        {/* Root Node: Tất cả Lớp Sinh Viên */}
        <div
          className={`lsv-tree-node ${isAllSelected ? 'active' : ''}`}
          onClick={() => {
            onSelectKhoa('');
            onSelectLsv('');
          }}
        >
          <div className="lsv-tree-node-label">
            <Users size={16} className="lsv-tree-node-icon root" />
            <span className="lsv-tree-node-text font-semibold">Tất cả lớp sinh viên</span>
          </div>
          <span className="lsv-tree-node-badge">{treeData.totalClasses}</span>
        </div>

        {/* Level 1: Khoa Nodes */}
        {treeData.tree.map(khoa => {
          const isKhoaExpanded = !!expandedKhoas[khoa.MaKhoa] || searchTerm.trim() !== '';
          const isKhoaSelected = selectedKhoaId === khoa.MaKhoa && !selectedLsvId;

          return (
            <div key={khoa.MaKhoa} className="lsv-tree-group-khoa">
              {/* Node Khoa */}
              <div
                className={`lsv-tree-node level-1 ${isKhoaSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectKhoa(khoa.MaKhoa);
                  onSelectLsv('');
                }}
              >
                <div className="lsv-tree-node-label">
                  <button
                    type="button"
                    className="lsv-tree-expand-btn"
                    onClick={(e) => toggleKhoa(khoa.MaKhoa, e)}
                  >
                    {isKhoaExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                  <School size={15} className="lsv-tree-node-icon khoa" />
                  <span className="lsv-tree-node-text" title={khoa.TenKhoa}>
                    {khoa.TenKhoa}
                  </span>
                </div>
                <span className="lsv-tree-node-badge">{khoa.totalCount}</span>
              </div>

              {/* Class items under Khoa */}
              {isKhoaExpanded && khoa.classes.map(lsv => {
                const isLsvSelected = selectedLsvId === lsv.MaLopSinhVien;

                return (
                  <div
                    key={lsv.MaLopSinhVien}
                    className={`lsv-tree-class-item ${isLsvSelected ? 'active' : ''}`}
                    onClick={() => {
                      onSelectKhoa(khoa.MaKhoa);
                      onSelectLsv(lsv.MaLopSinhVien);
                    }}
                    title={`${lsv.TenLopSinhVien} (${lsv.MaLopSinhVien}) - ${lsv.SoLopHocPhan || 0} lớp HP`}
                  >
                    <div className="lsv-tree-class-info">
                      <div className="lsv-tree-class-icon-wrap">
                        <Users size={12} />
                      </div>
                      <span className="lsv-tree-class-name">{lsv.TenLopSinhVien}</span>
                      <span className="lsv-tree-class-code">{lsv.MaLopSinhVien}</span>
                    </div>
                    {(lsv.SoLopHocPhan || 0) > 0 && (
                      <span className="lsv-tree-lhp-pill">{lsv.SoLopHocPhan} HP</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {treeData.tree.length === 0 && (
          <div className="tree-empty-text text-center" style={{ padding: '24px 10px', color: '#94a3b8', fontSize: '0.82rem' }}>
            Không tìm thấy khoa / lớp nào khớp từ khóa.
          </div>
        )}
      </div>
    </aside>
  );
}
