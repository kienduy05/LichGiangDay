import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  apiGetThoiKhoaBieuTreeView,
  apiGetThoiKhoaBieuList,
  apiDeleteSchedulesByLopHocPhan
} from '../../../../utils/apiThoiKhoaBieu';
import { apiGetHocKyList } from '../../../../utils/api';

import ThoiKhoaBieuTreeView from './ThoiKhoaBieuTreeView';
import ThoiKhoaBieuTable from './ThoiKhoaBieuTable';
import ThoiKhoaBieuGrid from './ThoiKhoaBieuGrid';
import ThoiKhoaBieuScheduleModal from './ThoiKhoaBieuScheduleModal';

import {
  Calendar, LayoutGrid, List, RefreshCw, CheckCircle2,
  AlertCircle, Building2, School, Network, Filter, Search
} from 'lucide-react';
import './ThoiKhoaBieuManagement.css';

export default function ThoiKhoaBieuManagement() {
  const { user } = useAuth();
  const isBoMonRole = user?.role === 'BOMON';
  const scopedBoMonId = isBoMonRole ? (user?.username || '') : '';

  // 1. Học kỳ states
  const [hocKyList, setHocKyList] = useState([]);
  const [selectedHocKy, setSelectedHocKy] = useState('');
  const [loadingHocKy, setLoadingHocKy] = useState(false);

  // 2. View mode: 'TABLE' (Dạng bảng) | 'GRID' (Dạng lưới ma trận)
  const [viewMode, setViewMode] = useState('TABLE');

  // 3. TreeView Navigation states
  const [treeData, setTreeData] = useState([]);
  const [treeStats, setTreeStats] = useState({ total: 0, scheduled: 0, unscheduled: 0 });
  const [selectedKhoaId, setSelectedKhoaId] = useState('ALL');
  const [selectedBoMonId, setSelectedBoMonId] = useState(isBoMonRole ? scopedBoMonId : 'ALL');
  const [selectedLhpId, setSelectedLhpId] = useState(null);
  const [treeSearchTerm, setTreeSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'SCHEDULED' | 'UNSCHEDULED'
  const [loadingTree, setLoadingTree] = useState(false);

  // 4. Table view data states
  const [lopHocPhans, setLopHocPhans] = useState([]);
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [loadingTable, setLoadingTable] = useState(false);

  // 5. Schedule Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedLhpForModal, setSelectedLhpForModal] = useState(null);

  // 6. Toast message
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // --- Tải danh sách Học kỳ khi mount ---
  useEffect(() => {
    const fetchHocKy = async () => {
      setLoadingHocKy(true);
      try {
        const list = await apiGetHocKyList();
        setHocKyList(list || []);
        if (list && list.length > 0) {
          // Mặc định chọn học kỳ đầu tiên
          setSelectedHocKy(list[0].MaHocKy);
        }
      } catch (err) {
        showToast(err.message || 'Lỗi tải danh sách học kỳ.', 'error');
      } finally {
        setLoadingHocKy(false);
      }
    };
    fetchHocKy();
  }, []);

  // --- Tải TreeView Data khi Học kỳ hoặc Search Tree thay đổi ---
  const fetchTreeView = async () => {
    if (!selectedHocKy) return;
    setLoadingTree(true);
    try {
      const data = await apiGetThoiKhoaBieuTreeView({
        maHocKy: selectedHocKy,
        search: treeSearchTerm,
        filterStatus
      });
      setTreeData(data?.tree || []);
      setTreeStats(data?.stats || { total: 0, scheduled: 0, unscheduled: 0 });
    } catch (err) {
      console.error('Lỗi tải TreeView:', err);
    } finally {
      setLoadingTree(false);
    }
  };

  useEffect(() => {
    fetchTreeView();
  }, [selectedHocKy, treeSearchTerm, filterStatus]);

  // --- Tải danh sách Table Data khi filter hoặc node thay đổi ---
  const fetchTableData = async () => {
    if (!selectedHocKy) return;
    setLoadingTable(true);
    try {
      const list = await apiGetThoiKhoaBieuList({
        maHocKy: selectedHocKy,
        maKhoa: selectedKhoaId !== 'ALL' ? selectedKhoaId : '',
        maBoMon: selectedBoMonId !== 'ALL' ? selectedBoMonId : '',
        filterStatus,
        search: tableSearchTerm
      });

      // Nếu người dùng click vào cụ thể 1 LHP ở TreeView
      let filtered = list || [];
      if (selectedLhpId) {
        filtered = filtered.filter(l => l.MaLopHocPhan === selectedLhpId);
      }
      setLopHocPhans(filtered);
    } catch (err) {
      showToast(err.message || 'Lỗi tải danh sách thời khóa biểu.', 'error');
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'TABLE') {
      fetchTableData();
    }
  }, [selectedHocKy, selectedKhoaId, selectedBoMonId, selectedLhpId, filterStatus, tableSearchTerm, viewMode]);

  // --- Mở modal xếp lịch cho 1 LHP ---
  const handleOpenScheduleModal = (lhp) => {
    setSelectedLhpForModal(lhp);
    setIsScheduleModalOpen(true);
  };

  // --- Xóa lịch học của 1 LHP ---
  const handleDeleteSchedule = async (lhp) => {
    if (!window.confirm(`Bạn có chắc muốn xóa toàn bộ lịch học của lớp ${lhp.TenMonHoc} (${lhp.MaLopHocPhan})?`)) {
      return;
    }

    try {
      await apiDeleteSchedulesByLopHocPhan(lhp.MaLopHocPhan);
      showToast(`Đã xóa thời khóa biểu của lớp ${lhp.MaLopHocPhan}`);
      fetchTreeView();
      fetchTableData();
    } catch (err) {
      showToast(err.message || 'Xóa lịch thất bại.', 'error');
    }
  };

  // Làm mới toàn bộ
  const handleRefreshAll = () => {
    fetchTreeView();
    fetchTableData();
  };

  // Lấy tên Khoa / Bộ môn đang chọn để hiển thị tag
  const getCurrentFilterLabel = () => {
    if (selectedLhpId) {
      const found = lopHocPhans.find(l => l.MaLopHocPhan === selectedLhpId);
      return `Lớp: ${found?.TenMonHoc || selectedLhpId}`;
    }
    if (selectedBoMonId && selectedBoMonId !== 'ALL') {
      return `Bộ môn: ${selectedBoMonId}`;
    }
    if (selectedKhoaId && selectedKhoaId !== 'ALL') {
      return `Khoa: ${selectedKhoaId}`;
    }
    return 'Tất cả Khoa & Bộ môn';
  };

  return (
    <div className="tkb-management-container">
      
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="tkb-header-toolbar">
        <div className="tkb-title-section">
          <h2>
            <span className="tkb-title-icon-badge">
              <Calendar size={22} />
            </span>
            Tạo & Xếp Thời Khóa Biểu
          </h2>
          <p>Phân bổ Thứ học, Tiết học (Ca học) và Phòng học cho các Lớp học phần</p>
        </div>

        <div className="tkb-header-controls">
          {/* Học kỳ Selector (Chỉ hiển thị khi ở chế độ Dạng Danh Sách) */}
          {viewMode === 'TABLE' && (
            <div className="tkb-semester-select-box">
              <label><Calendar size={15} /> Học kỳ:</label>
              <select
                value={selectedHocKy}
                onChange={(e) => {
                  setSelectedHocKy(e.target.value);
                  setSelectedKhoaId('ALL');
                  setSelectedBoMonId('ALL');
                  setSelectedLhpId(null);
                }}
                disabled={loadingHocKy}
              >
                {hocKyList.map(hk => (
                  <option key={hk.MaHocKy} value={hk.MaHocKy}>
                    {hk.TenHocKy} {hk.NamHoc ? `(${hk.NamHoc})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Chuyển đổi View Mode */}
          <div className="tkb-view-mode-group">
            <button
              type="button"
              className={`tkb-btn-view-mode ${viewMode === 'TABLE' ? 'active' : ''}`}
              onClick={() => setViewMode('TABLE')}
            >
              <List size={16} />
              <span>Dạng Danh Sách</span>
            </button>
            <button
              type="button"
              className={`tkb-btn-view-mode ${viewMode === 'GRID' ? 'active' : ''}`}
              onClick={() => setViewMode('GRID')}
            >
              <LayoutGrid size={16} />
              <span>Lưới Ma Trận</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className={`tkb-toast-banner ${toastMessage.type}`}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 2. SPLIT LAYOUT: TREEVIEW (LEFT) + MAIN CONTENT (RIGHT) */}
      <div className="tkb-split-layout">
        
        {/* LEFT PANEL: TREEVIEW NAVIGATION */}
        <ThoiKhoaBieuTreeView
          treeData={treeData}
          stats={treeStats}
          selectedKhoaId={selectedKhoaId}
          onSelectKhoa={setSelectedKhoaId}
          selectedBoMonId={selectedBoMonId}
          onSelectBoMon={setSelectedBoMonId}
          selectedLhpId={selectedLhpId}
          onSelectLhp={setSelectedLhpId}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          searchTerm={treeSearchTerm}
          onSearchChange={setTreeSearchTerm}
          onRefresh={fetchTreeView}
          loading={loadingTree}
        />

        {/* RIGHT PANEL: MAIN CONTENT */}
        <div className="tkb-right-content-panel">
          
          {/* Header Toolbar bên phải */}
          <div className="tkb-right-panel-toolbar">
            <div className="tkb-toolbar-left">
              <div className={`tkb-current-node-tag ${selectedKhoaId !== 'ALL' || selectedBoMonId !== 'ALL' || selectedLhpId ? 'filtered' : ''}`}>
                {selectedKhoaId === 'ALL' && selectedBoMonId === 'ALL' && !selectedLhpId ? (
                  <School size={16} color="#2563eb" />
                ) : (
                  <Network size={16} color="#2563eb" />
                )}
                <span>{getCurrentFilterLabel()}</span>
              </div>

              {(selectedKhoaId !== 'ALL' || selectedBoMonId !== 'ALL' || selectedLhpId) && (
                <button
                  type="button"
                  className="tkb-btn-reset-filter"
                  onClick={() => {
                    setSelectedKhoaId('ALL');
                    setSelectedBoMonId('ALL');
                    setSelectedLhpId(null);
                  }}
                >
                  Xóa lọc node
                </button>
              )}
            </div>

            <div className="tkb-toolbar-right">
              {viewMode === 'TABLE' && (
                <div className="tkb-search-box">
                  <Search size={15} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Tìm tên môn, mã LHP..."
                    value={tableSearchTerm}
                    onChange={(e) => setTableSearchTerm(e.target.value)}
                  />
                </div>
              )}

              <button
                type="button"
                className="tkb-btn-refresh-content"
                onClick={handleRefreshAll}
                disabled={loadingTable}
                title="Làm mới bảng"
              >
                <RefreshCw size={14} className={loadingTable ? 'animate-spin' : ''} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* VIEW CONTENT (TABLE vs MATRIX GRID) */}
          {viewMode === 'TABLE' ? (
            <ThoiKhoaBieuTable
              lopHocPhans={lopHocPhans}
              loading={loadingTable}
              onScheduleClick={handleOpenScheduleModal}
              onDeleteSchedule={handleDeleteSchedule}
            />
          ) : (
            <ThoiKhoaBieuGrid
              onScheduleClick={handleOpenScheduleModal}
            />
          )}

        </div>

      </div>

      {/* 3. SCHEDULE MODAL */}
      <ThoiKhoaBieuScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        lopHocPhan={selectedLhpForModal}
        onSuccess={(msg) => {
          showToast(msg);
          fetchTreeView();
          fetchTableData();
        }}
      />

    </div>
  );
}
