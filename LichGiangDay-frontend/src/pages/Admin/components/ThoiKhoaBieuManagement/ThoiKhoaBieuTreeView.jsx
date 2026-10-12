import React, { useState } from 'react';
import {
  FolderTree, School, Network, BookOpen, ChevronDown,
  ChevronRight, Search, RefreshCw, Layers, CheckCircle2,
  AlertCircle, Sparkles, Filter, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import './ThoiKhoaBieuComponents.css';

export default function ThoiKhoaBieuTreeView({
  treeData = [],
  stats = { total: 0, scheduled: 0, unscheduled: 0 },
  selectedKhoaId,
  onSelectKhoa,
  selectedBoMonId,
  onSelectBoMon,
  selectedLhpId,
  onSelectLhp,
  filterStatus = 'ALL',
  onFilterStatusChange,
  searchTerm = '',
  onSearchChange,
  onRefresh,
  loading = false,
  isCollapsed = false,
  onToggleCollapse
}) {
  // State quản lý việc đóng/mở rộng các node Khoa và Bộ môn
  const [expandedKhoas, setExpandedKhoas] = useState({});
  const [expandedBoMons, setExpandedBoMons] = useState({});

  // Toggle mở rộng Khoa
  const toggleKhoaExpand = (maKhoa, e) => {
    e.stopPropagation();
    setExpandedKhoas(prev => ({
      ...prev,
      [maKhoa]: !prev[maKhoa]
    }));
  };

  // Toggle mở rộng Bộ môn
  const toggleBoMonExpand = (maBoMon, e) => {
    e.stopPropagation();
    setExpandedBoMons(prev => ({
      ...prev,
      [maBoMon]: !prev[maBoMon]
    }));
  };

  // Mở rộng tất cả hoặc Thu gọn tất cả
  const handleExpandAll = () => {
    const allKhoas = {};
    const allBoMons = {};
    treeData.forEach(k => {
      allKhoas[k.MaKhoa] = true;
      k.boMons?.forEach(bm => {
        allBoMons[bm.MaBoMon] = true;
      });
    });
    setExpandedKhoas(allKhoas);
    setExpandedBoMons(allBoMons);
  };

  const handleCollapseAll = () => {
    setExpandedKhoas({});
    setExpandedBoMons({});
  };

  const isAllSelected = selectedKhoaId === 'ALL' && selectedBoMonId === 'ALL' && !selectedLhpId;

  // Nếu đang ở trạng thái thu gọn
  if (isCollapsed) {
    return (
      <div
        className="tkb-treeview-panel collapsed"
        onClick={onToggleCollapse}
        title="Nhấn để mở rộng Sơ đồ đào tạo"
      >
        <button type="button" className="btn-tree-expand-bar" aria-label="Mở rộng sơ đồ">
          <FolderTree size={16} />
          <span className="collapsed-vertical-text">Sơ Đồ Đào Tạo</span>
          <span className="collapsed-badge">{stats.total || 0}</span>
          <PanelLeftOpen size={16} className="collapsed-open-icon" />
        </button>
      </div>
    );
  }

  return (
    <div className="tkb-treeview-panel">
      {/* 1. Header TreeView */}
      <div className="tkb-treeview-header">
        <div className="tkb-treeview-title-group">
          <FolderTree size={16} className="tree-header-icon" />
          <span>Sơ Đồ Đào Tạo</span>
        </div>
        <div className="tree-header-actions">
          <button className="btn-tree-tool" title="Mở rộng tất cả" onClick={handleExpandAll}>
            <ChevronDown size={13} />
          </button>
          <button className="btn-tree-tool" title="Thu gọn tất cả" onClick={handleCollapseAll}>
            <ChevronRight size={13} />
          </button>
          <button className="btn-tree-tool" title="Làm mới" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spinning' : ''} />
          </button>
          {onToggleCollapse && (
            <button className="btn-tree-tool collapse-btn" title="Thu gọn sơ đồ" onClick={onToggleCollapse}>
              <PanelLeftClose size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Status Tabs (Tất cả / Đã xếp / Chưa xếp) */}
      <div className="tree-filter-pills">
        <button
          type="button"
          className={`filter-pill ${filterStatus === 'ALL' ? 'active' : ''}`}
          onClick={() => onFilterStatusChange('ALL')}
        >
          <span>Tất cả</span>
          <span className="pill-count">{stats.total || 0}</span>
        </button>
        <button
          type="button"
          className={`filter-pill scheduled ${filterStatus === 'SCHEDULED' ? 'active' : ''}`}
          onClick={() => onFilterStatusChange('SCHEDULED')}
        >
          <span className="dot green"></span>
          <span>Đã xếp</span>
          <span className="pill-count">{stats.scheduled || 0}</span>
        </button>
        <button
          type="button"
          className={`filter-pill unscheduled ${filterStatus === 'UNSCHEDULED' ? 'active' : ''}`}
          onClick={() => onFilterStatusChange('UNSCHEDULED')}
        >
          <span className="dot orange"></span>
          <span>Chưa xếp</span>
          <span className="pill-count">{stats.unscheduled || 0}</span>
        </button>
      </div>

      {/* 3. Search Box in Tree */}
      <div className="tree-search-wrapper">
        <Search size={14} className="tree-search-icon" />
        <input
          type="text"
          placeholder="Tìm theo mã hoặc tên đơn vị..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* 4. TreeView Body */}
      <div className="tkb-treeview-body">
        
        {/* Node Tất Cả Lớp Học Phần (Root) */}
        <div
          className={`tree-node-item root ${isAllSelected ? 'active' : ''}`}
          onClick={() => {
            onSelectKhoa('ALL');
            onSelectBoMon('ALL');
            onSelectLhp(null);
          }}
        >
          <div className="tree-node-label">
            <Layers size={16} className="tree-node-icon root-icon" />
            <span className="tree-node-text font-semibold">Tất cả lớp học phần</span>
          </div>
          <span className="tree-node-badge">{stats.total || 0}</span>
        </div>

        {/* Tree Nodes By Khoa */}
        {treeData.map(khoa => {
          const isKhoaSelected = selectedKhoaId === khoa.MaKhoa && selectedBoMonId === 'ALL' && !selectedLhpId;
          const isKhoaExpanded = !!expandedKhoas[khoa.MaKhoa] || searchTerm.trim() !== '';

          return (
            <div key={khoa.MaKhoa} className="tree-group-khoa">
              
              {/* Node Khoa */}
              <div
                className={`tree-node-item level-1 ${isKhoaSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectKhoa(khoa.MaKhoa);
                  onSelectBoMon('ALL');
                  onSelectLhp(null);
                }}
              >
                <div className="tree-node-label">
                  <button
                    type="button"
                    className="tree-expand-btn"
                    onClick={(e) => toggleKhoaExpand(khoa.MaKhoa, e)}
                  >
                    {isKhoaExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <School size={15} className="tree-node-icon khoa-icon" />
                  <span className="tree-node-text" title={khoa.TenKhoa}>{khoa.TenKhoa}</span>
                </div>
                <div className="tree-badge-group">
                  <span className="tree-node-badge" title="Tổng số lớp học phần">{khoa.totalClasses}</span>
                </div>
              </div>

              {/* Children BoMon Nodes */}
              {isKhoaExpanded && (
                <div className="tree-children-bomon-list">
                  {khoa.boMons?.length === 0 ? (
                    <div className="tree-empty-text">Chưa có bộ môn</div>
                  ) : (
                    khoa.boMons.map(bm => {
                      const isBmSelected = selectedBoMonId === bm.MaBoMon && !selectedLhpId;
                      const isBmExpanded = !!expandedBoMons[bm.MaBoMon] || searchTerm.trim() !== '';

                      return (
                        <div key={bm.MaBoMon} className="tree-group-bomon">
                          
                          {/* Node BoMon */}
                          <div
                            className={`tree-node-item level-2 ${isBmSelected ? 'active' : ''}`}
                            onClick={() => {
                              onSelectKhoa(khoa.MaKhoa);
                              onSelectBoMon(bm.MaBoMon);
                              onSelectLhp(null);
                            }}
                          >
                            <div className="tree-node-label">
                              <button
                                type="button"
                                className="tree-expand-btn"
                                onClick={(e) => toggleBoMonExpand(bm.MaBoMon, e)}
                              >
                                {isBmExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              </button>
                              <Network size={14} className="tree-node-icon bomon-icon" />
                              <span className="tree-node-text" title={bm.TenBoMon}>{bm.TenBoMon}</span>
                            </div>
                            <span className="tree-node-badge sub">{bm.totalClasses}</span>
                          </div>

                          {/* Children LopHocPhan Nodes */}
                          {isBmExpanded && (
                            <div className="tree-children-lhp-list">
                              {bm.lopHocPhans?.length === 0 ? (
                                <div className="tree-empty-text">Chưa có lớp học phần</div>
                              ) : (
                                bm.lopHocPhans.map(lhp => {
                                  const isLhpSelected = selectedLhpId === lhp.MaLopHocPhan;
                                  const hasSchedule = lhp.hasSchedule;

                                  // Format tóm tắt lịch
                                  const scheduleSummary = lhp.schedules && lhp.schedules.length > 0
                                    ? lhp.schedules.map(s => `T${s.ThuTrongTuan}(${s.TenPhong || s.MaPhong})`).join(', ')
                                    : 'Chưa xếp lịch';

                                  return (
                                    <div
                                      key={lhp.MaLopHocPhan}
                                      className={`tree-node-lhp-item ${isLhpSelected ? 'active' : ''} ${hasSchedule ? 'scheduled' : 'unscheduled'}`}
                                      onClick={() => {
                                        onSelectKhoa(khoa.MaKhoa);
                                        onSelectBoMon(bm.MaBoMon);
                                        onSelectLhp(lhp.MaLopHocPhan);
                                      }}
                                    >
                                      <div className="lhp-item-status-dot">
                                        <span className={`dot ${hasSchedule ? 'green' : 'orange'}`}></span>
                                      </div>

                                      <div className="lhp-item-info">
                                        <div className="lhp-item-title-row">
                                          <span
                                            className="lhp-item-name"
                                            title={lhp.TenLopHocPhan || lhp.TenMonHoc || lhp.MaLopHocPhan}
                                          >
                                            {lhp.TenLopHocPhan || lhp.TenMonHoc || lhp.MaMonHoc}
                                          </span>
                                          <span className="lhp-item-code" title={lhp.MaLopHocPhan}>{lhp.MaLopHocPhan}</span>
                                        </div>
                                        {lhp.TenMonHoc && lhp.TenLopHocPhan && lhp.TenLopHocPhan !== lhp.TenMonHoc && (
                                          <div
                                            className="lhp-item-subject-row"
                                            style={{
                                              fontSize: '0.72rem',
                                              color: '#64748b',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                              marginTop: '1px'
                                            }}
                                            title={lhp.TenMonHoc}
                                          >
                                            {lhp.TenMonHoc}
                                          </div>
                                        )}
                                        <div className="lhp-item-sub-row">
                                          <span className={`lhp-schedule-pill ${hasSchedule ? 'scheduled' : 'unscheduled'}`}>
                                            {scheduleSummary}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          );
        })}

        {treeData.length === 0 && !loading && (
          <div className="tree-empty-state">
            <AlertCircle size={24} />
            <span>Không tìm thấy dữ liệu lớp học phần.</span>
          </div>
        )}

      </div>
    </div>
  );
}
