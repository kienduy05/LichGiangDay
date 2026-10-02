import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, School, Network, ChevronDown, ChevronRight,
  Search, X, UserCheck, ChevronsDownUp, ChevronsUpDown
} from 'lucide-react';
import './GiangVienComponents.css';

export default function GiangVienTreeView({
  khoaList = [],
  boMonList = [],
  giangVienList = [],
  selectedKhoaId = '',
  selectedBoMonId = '',
  selectedGvId = '',
  onSelectKhoa,
  onSelectBoMon,
  onSelectGv,
  filterTrangThai = '',
  setFilterTrangThai,
  isBoMonRole = false,
  scopedBoMonId = '',
  departmentFullName = ''
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
      } else {
        // Tìm qua giangVienList nếu có
        const foundGv = giangVienList.find(g => g.MaBoMon === scopedBoMonId);
        if (foundGv?.MaKhoa) {
          setExpandedKhoas(prev => ({ ...prev, [foundGv.MaKhoa]: true }));
        }
      }
    }
  }, [isBoMonRole, scopedBoMonId, boMonList, giangVienList]);

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

    // 1. Phân quyền dữ liệu Bộ môn: nếu là role BOMON, chỉ lấy dữ liệu của scopedBoMonId
    let effectiveBoMonList = boMonList;
    let effectiveKhoaList = khoaList;

    // Tự tổng hợp danh mục từ giangVienList nếu boMonList hoặc khoaList chưa kịp tải
    if (effectiveBoMonList.length === 0 && giangVienList.length > 0) {
      const bmMap = new Map();
      giangVienList.forEach(g => {
        if (g.MaBoMon && !bmMap.has(g.MaBoMon)) {
          bmMap.set(g.MaBoMon, {
            MaBoMon: g.MaBoMon,
            TenBoMon: g.TenBoMon || g.MaBoMon,
            MaKhoa: g.MaKhoa || 'CNTT'
          });
        }
      });
      effectiveBoMonList = Array.from(bmMap.values());
    }

    if (effectiveKhoaList.length === 0 && giangVienList.length > 0) {
      const kMap = new Map();
      giangVienList.forEach(g => {
        if (g.MaKhoa && !kMap.has(g.MaKhoa)) {
          kMap.set(g.MaKhoa, {
            MaKhoa: g.MaKhoa,
            TenKhoa: g.TenKhoa || g.MaKhoa
          });
        }
      });
      effectiveKhoaList = Array.from(kMap.values());
    }

    // Nếu vẫn chưa có và là BOMON, tự tạo node từ scopedBoMonId và departmentFullName
    if (isBoMonRole && scopedBoMonId && effectiveBoMonList.length === 0) {
      effectiveBoMonList = [{
        MaBoMon: scopedBoMonId,
        TenBoMon: departmentFullName || scopedBoMonId,
        MaKhoa: 'CNTT'
      }];
      if (effectiveKhoaList.length === 0) {
        effectiveKhoaList = [{
          MaKhoa: 'CNTT',
          TenKhoa: 'Khoa Công nghệ thông tin'
        }];
      }
    }

    if (isBoMonRole && scopedBoMonId) {
      effectiveBoMonList = effectiveBoMonList.filter(bm => bm.MaBoMon === scopedBoMonId);
      const targetKhoaIds = new Set(effectiveBoMonList.map(bm => bm.MaKhoa));
      effectiveKhoaList = effectiveKhoaList.filter(k => targetKhoaIds.has(k.MaKhoa));
      // Nếu khoa chưa có trong effectiveKhoaList, tìm từ giangVienList
      if (effectiveKhoaList.length === 0 && giangVienList.length > 0) {
        const firstGv = giangVienList.find(g => g.MaBoMon === scopedBoMonId);
        if (firstGv?.MaKhoa) {
          effectiveKhoaList = [{
            MaKhoa: firstGv.MaKhoa,
            TenKhoa: firstGv.TenKhoa || firstGv.MaKhoa
          }];
        }
      }
    }

    // Lọc GV theo trạng thái nếu có
    let filteredGVs = giangVienList;
    if (isBoMonRole && scopedBoMonId) {
      filteredGVs = filteredGVs.filter(gv => gv.MaBoMon === scopedBoMonId);
    }

    if (filterTrangThai === 'Active') {
      filteredGVs = filteredGVs.filter(gv => gv.TrangThai === 'Active');
    } else if (filterTrangThai === 'Inactive') {
      filteredGVs = filteredGVs.filter(gv => gv.TrangThai !== 'Active');
    }

    // Nếu có tìm kiếm từ khóa
    if (term) {
      filteredGVs = filteredGVs.filter(gv =>
        (gv.HoTen && gv.HoTen.toLowerCase().includes(term)) ||
        (gv.MaGiangVien && gv.MaGiangVien.toLowerCase().includes(term)) ||
        (gv.Email && gv.Email.toLowerCase().includes(term)) ||
        (gv.TenBoMon && gv.TenBoMon.toLowerCase().includes(term)) ||
        (gv.TenKhoa && gv.TenKhoa.toLowerCase().includes(term))
      );
    }

    // Tổ chức cây
    const result = [];

    for (const k of effectiveKhoaList) {
      const boMonsOfKhoa = effectiveBoMonList.filter(bm => bm.MaKhoa === k.MaKhoa || (isBoMonRole && bm.MaBoMon === scopedBoMonId));
      const boMonNodes = [];

      let khoaCount = 0;

      for (const bm of boMonsOfKhoa) {
        const gvsOfBm = filteredGVs.filter(gv => gv.MaBoMon === bm.MaBoMon);
        khoaCount += gvsOfBm.length;

        // Nếu có search term và BM có khớp tên thì hiện, hoặc có GV thì hiện
        const bmMatchesSearch = term && bm.TenBoMon?.toLowerCase().includes(term);
        if (!term || gvsOfBm.length > 0 || bmMatchesSearch) {
          boMonNodes.push({
            MaBoMon: bm.MaBoMon,
            TenBoMon: bm.TenBoMon || (bm.MaBoMon === scopedBoMonId ? departmentFullName : bm.MaBoMon),
            MaKhoa: k.MaKhoa,
            totalCount: gvsOfBm.length,
            giangViens: gvsOfBm
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

    // Nhóm Giảng viên chưa phân bộ môn (Chỉ hiển thị cho ADMIN)
    if (!isBoMonRole) {
      const unassignedGVs = filteredGVs.filter(gv => !gv.MaBoMon);
      if (unassignedGVs.length > 0) {
        result.push({
          MaKhoa: '__NULL__',
          TenKhoa: 'Chưa phân Khoa / Bộ môn',
          totalCount: unassignedGVs.length,
          boMons: [
            {
              MaBoMon: '__NULL__',
              TenBoMon: 'Chưa phân bộ môn',
              MaKhoa: '__NULL__',
              totalCount: unassignedGVs.length,
              giangViens: unassignedGVs
            }
          ]
        });
      }
    }

    return {
      tree: result,
      totalGVs: filteredGVs.length
    };
  }, [khoaList, boMonList, giangVienList, filterTrangThai, searchTerm, isBoMonRole, scopedBoMonId, departmentFullName]);

  const isAllSelected = !selectedKhoaId && (!selectedBoMonId || (isBoMonRole && selectedBoMonId === scopedBoMonId && !selectedGvId)) && !selectedGvId;

  return (
    <aside className="gv-treeview-sidebar">
      {/* Header */}
      <div className="gv-treeview-header">
        <div className="gv-treeview-title-row">
          <div className="gv-treeview-title">
            <Users size={16} color="#3b82f6" />
            <span>Cơ Cấu Tổ Chức</span>
          </div>
          <div className="gv-tree-actions">
            <button
              type="button"
              className="gv-tree-action-btn"
              onClick={handleExpandAll}
              title="Mở rộng tất cả"
            >
              <ChevronsUpDown size={14} />
            </button>
            <button
              type="button"
              className="gv-tree-action-btn"
              onClick={handleCollapseAll}
              title="Thu gọn tất cả"
            >
              <ChevronsDownUp size={14} />
            </button>
          </div>
        </div>

        {/* Search inside tree */}
        <div className="gv-tree-search-box">
          <Search size={14} className="gv-tree-search-icon" />
          <input
            type="text"
            placeholder={isBoMonRole ? "Tìm giảng viên bộ môn..." : "Lọc khoa, bộ môn, GV..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="gv-tree-clear-btn"
              onClick={() => setSearchTerm('')}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status quick tabs */}
        <div className="gv-tree-status-tabs">
          <button
            type="button"
            className={`gv-tree-status-tab ${!filterTrangThai ? 'active' : ''}`}
            onClick={() => setFilterTrangThai('')}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`gv-tree-status-tab ${filterTrangThai === 'Active' ? 'active' : ''}`}
            onClick={() => setFilterTrangThai('Active')}
          >
            Đang dạy
          </button>
          <button
            type="button"
            className={`gv-tree-status-tab ${filterTrangThai === 'Inactive' ? 'active' : ''}`}
            onClick={() => setFilterTrangThai('Inactive')}
          >
            Tạm dừng
          </button>
        </div>
      </div>

      {/* Tree View Body */}
      <div className="gv-treeview-body">
        
        {/* Root Node: Tất cả Giảng Viên */}
        <div
          className={`gv-tree-node ${isAllSelected ? 'active' : ''}`}
          onClick={() => {
            onSelectKhoa('');
            onSelectBoMon(isBoMonRole ? scopedBoMonId : '');
            onSelectGv('');
          }}
        >
          <div className="gv-tree-node-label">
            <UserCheck size={16} className="gv-tree-node-icon root" />
            <span className="gv-tree-node-text font-semibold">
              Tất cả giảng viên
            </span>
          </div>
          <span className="gv-tree-node-badge">{treeData.totalGVs}</span>
        </div>

        {/* Level 1: Khoa Nodes */}
        {treeData.tree.map(khoa => {
          const isKhoaExpanded = !!expandedKhoas[khoa.MaKhoa] || searchTerm.trim() !== '' || isBoMonRole;
          const isKhoaSelected = selectedKhoaId === khoa.MaKhoa && (!selectedBoMonId || (isBoMonRole && selectedBoMonId === scopedBoMonId)) && !selectedGvId;

          return (
            <div key={khoa.MaKhoa} className="gv-tree-group-khoa">
              {/* Node Khoa */}
              <div
                className={`gv-tree-node level-1 ${isKhoaSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectKhoa(khoa.MaKhoa);
                  onSelectBoMon(isBoMonRole ? scopedBoMonId : '');
                  onSelectGv('');
                }}
              >
                <div className="gv-tree-node-label">
                  <button
                    type="button"
                    className="gv-tree-expand-btn"
                    onClick={(e) => toggleKhoa(khoa.MaKhoa, e)}
                  >
                    {isKhoaExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                  <School size={15} className="gv-tree-node-icon khoa" />
                  <span className="gv-tree-node-text" title={khoa.TenKhoa}>
                    {khoa.TenKhoa}
                  </span>
                </div>
                <span className="gv-tree-node-badge">{khoa.totalCount}</span>
              </div>

              {/* Level 2: BoMon Nodes */}
              {isKhoaExpanded && khoa.boMons.map(bm => {
                const isBmExpanded = !!expandedBoMons[bm.MaBoMon] || searchTerm.trim() !== '' || isBoMonRole;
                const isBmSelected = selectedBoMonId === bm.MaBoMon && !selectedGvId;

                return (
                  <div key={bm.MaBoMon} className="gv-tree-group-bomon">
                    {/* Node BoMon */}
                    <div
                      className={`gv-tree-node level-2 ${isBmSelected ? 'active' : ''}`}
                      onClick={() => {
                        onSelectKhoa(khoa.MaKhoa);
                        onSelectBoMon(bm.MaBoMon);
                        onSelectGv('');
                      }}
                    >
                      <div className="gv-tree-node-label">
                        <button
                          type="button"
                          className="gv-tree-expand-btn"
                          onClick={(e) => toggleBoMon(bm.MaBoMon, e)}
                        >
                          {isBmExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                        <Network size={14} className="gv-tree-node-icon bomon" />
                        <span className="gv-tree-node-text" title={bm.TenBoMon}>
                          {bm.TenBoMon}
                        </span>
                      </div>
                      <span className="gv-tree-node-badge sub">{bm.totalCount}</span>
                    </div>

                    {/* Level 3: GiangVien Nodes */}
                    {isBmExpanded && bm.giangViens.map(gv => {
                      const isGvSelected = selectedGvId === gv.MaGiangVien;
                      const isActive = gv.TrangThai === 'Active';

                      return (
                        <div
                          key={gv.MaGiangVien}
                          className={`gv-tree-gv-item ${isGvSelected ? 'active' : ''}`}
                          onClick={() => {
                            onSelectKhoa(khoa.MaKhoa);
                            onSelectBoMon(bm.MaBoMon);
                            onSelectGv(gv.MaGiangVien);
                          }}
                          title={`${gv.HoTen} (${gv.MaGiangVien}) - ${isActive ? 'Đang hoạt động' : 'Tạm dừng'}`}
                        >
                          <div className="gv-tree-gv-info">
                            <div className="gv-tree-gv-avatar">
                              {gv.HoTen ? gv.HoTen.charAt(0).toUpperCase() : 'G'}
                            </div>
                            <span className="gv-tree-gv-name">{gv.HoTen}</span>
                            <span className="gv-tree-gv-code">{gv.MaGiangVien}</span>
                          </div>
                          <span className={`gv-status-dot ${isActive ? 'active' : 'inactive'}`}></span>
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
          <div className="tree-empty-text text-center" style={{ padding: '24px 10px' }}>
            Không tìm thấy khoa / bộ môn nào khớp từ khóa.
          </div>
        )}
      </div>
    </aside>
  );
}
