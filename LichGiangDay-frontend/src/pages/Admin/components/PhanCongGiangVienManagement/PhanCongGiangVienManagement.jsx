import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  UserCheck, BookOpen, CheckCircle2, AlertTriangle, Users,
  RefreshCw, Layers, BarChart2, ShieldAlert, Sparkles, AlertCircle
} from 'lucide-react';
import { apiGetHocKyList } from '../../../../utils/api';
import {
  apiGetBomonAssignableClasses,
  apiGetLecturerAvailability,
  apiGetBomonWorkloadSummary,
  apiAssignLecturerToClass,
  apiUnassignLecturerFromClass
} from '../../../../utils/apiPhanCongGiangVien';

import PhanCongClassList from './PhanCongClassList';
import PhanCongInspector from './PhanCongInspector';
import PhanCongWorkloadMatrix from './PhanCongWorkloadMatrix';
import PhanCongLecturerScheduleModal from './PhanCongLecturerScheduleModal';

import './PhanCongGiangVien.css';

export default function PhanCongGiangVienManagement() {
  const { user } = useAuth();

  // Học kỳ & Bộ môn
  const [hocKyList, setHocKyList] = useState([]);
  const [selectedHocKy, setSelectedHocKy] = useState('');
  const [boMonInfo, setBoMonInfo] = useState(null);

  // Tab: 'WORKSPACE' | 'WORKLOAD'
  const [activeTab, setActiveTab] = useState('WORKSPACE');

  // Master classes state
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Active class & Inspector state
  const [selectedClass, setSelectedClass] = useState(null);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Workload tab state
  const [workloadData, setWorkloadData] = useState(null);
  const [loadingWorkload, setLoadingWorkload] = useState(false);

  // Preview schedule modal
  const [previewModal, setPreviewModal] = useState({ isOpen: false, maGiangVien: '', lecturerName: '' });

  // Notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Khởi tạo danh sách Học kỳ
  useEffect(() => {
    const fetchHocKy = async () => {
      try {
        const list = await apiGetHocKyList();
        if (list && list.length > 0) {
          setHocKyList(list);
          setSelectedHocKy(list[0].MaHocKy);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách học kỳ:', err);
      }
    };
    fetchHocKy();
  }, []);

  // 2. Tải danh sách Lớp học phần của Bộ môn
  const fetchClasses = useCallback(async () => {
    if (!selectedHocKy) return;
    setLoadingClasses(true);
    setErrorMsg('');
    try {
      const res = await apiGetBomonAssignableClasses({
        maHocKy: selectedHocKy,
        search: searchTerm,
        filterStatus
      });
      setClasses(res.classes || []);
      setBoMonInfo(res.boMonInfo || null);
      setStats(res.stats || {});

      // Nếu đang chọn 1 lớp, cập nhật lại dữ liệu của lớp đó trong danh sách mới
      if (selectedClass) {
        const found = (res.classes || []).find(c => c.MaLopHocPhan === selectedClass.MaLopHocPhan);
        if (found) {
          setSelectedClass(found);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Không thể tải danh sách lớp học phần của bộ môn.');
    } finally {
      setLoadingClasses(false);
    }
  }, [selectedHocKy, searchTerm, filterStatus]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // 3. Khi chọn 1 lớp học phần -> Tải dữ liệu quét trùng lịch & khả dụng của GV
  const fetchAvailability = useCallback(async (cls) => {
    if (!cls || !cls.hasSchedule) {
      setAvailabilityData(null);
      return;
    }
    setLoadingAvailability(true);
    try {
      const res = await apiGetLecturerAvailability(cls.MaLopHocPhan);
      setAvailabilityData(res);
    } catch (err) {
      console.error('Lỗi kiểm tra khả dụng GV:', err);
      setAvailabilityData(null);
    } finally {
      setLoadingAvailability(false);
    }
  }, []);

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    fetchAvailability(cls);
  };

  // 4. Tải dữ liệu Tải giảng dạy (Tab 2)
  const fetchWorkload = useCallback(async () => {
    if (!selectedHocKy) return;
    setLoadingWorkload(true);
    try {
      const res = await apiGetBomonWorkloadSummary(selectedHocKy);
      setWorkloadData(res);
    } catch (err) {
      console.error('Lỗi tải thống kê tải giảng dạy:', err);
    } finally {
      setLoadingWorkload(false);
    }
  }, [selectedHocKy]);

  useEffect(() => {
    if (activeTab === 'WORKLOAD') {
      fetchWorkload();
    }
  }, [activeTab, fetchWorkload]);

  // 5. Hành động: Phân công Giảng viên
  const handleAssign = async (maLopHocPhan, maGiangVien, allowOverride = false) => {
    setAssigning(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await apiAssignLecturerToClass({ maLopHocPhan, maGiangVien, allowOverride });
      setSuccessMsg(`Đã phân công ${res.metadata?.tenGiangVien} vào lớp thành công!`);
      setTimeout(() => setSuccessMsg(''), 4000);

      // Refresh master list & availability
      await fetchClasses();
      if (selectedClass) {
        await fetchAvailability(selectedClass);
      }
      if (activeTab === 'WORKLOAD') {
        fetchWorkload();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi phân công giảng viên.');
    } finally {
      setAssigning(false);
    }
  };

  // 6. Hành động: Hủy phân công Giảng viên
  const handleUnassign = async (maLopHocPhan) => {
    setAssigning(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await apiUnassignLecturerFromClass(maLopHocPhan);
      setSuccessMsg('Đã hủy phân công giảng viên khỏi lớp học phần.');
      setTimeout(() => setSuccessMsg(''), 4000);

      await fetchClasses();
      if (selectedClass) {
        await fetchAvailability(selectedClass);
      }
      if (activeTab === 'WORKLOAD') {
        fetchWorkload();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi hủy phân công giảng viên.');
    } finally {
      setAssigning(false);
    }
  };

  // 7. Mở modal xem trước TKB tuần của Giảng viên
  const handlePreviewSchedule = (maGiangVien, lecturerName) => {
    setPreviewModal({
      isOpen: true,
      maGiangVien,
      lecturerName
    });
  };

  // Kiểm tra quyền role BOMON
  if (user?.role !== 'BOMON') {
    return (
      <div className="pcgv-container">
        <div style={{ padding: '3rem', background: '#fff', borderRadius: '14px', textAlign: 'center', border: '1px solid #fee2e2' }}>
          <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ margin: 0, color: '#991b1b' }}>Quyền Hạn Bị Từ Chối</h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
            Chức năng Phân công Giảng viên theo Thời khóa biểu là đặc quyền duy nhất của tài khoản <strong>Bộ Môn</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pcgv-container">
      {/* ─── 1. TOP HEADER & KPI CARDS ─── */}
      <div className="pcgv-header-card">
        <div className="pcgv-header-top">
          <div className="pcgv-header-left">
            <div className="pcgv-header-icon">
              <UserCheck size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2 className="pcgv-header-title">Phân Công Giảng Viên</h2>
                <span className="pcgv-dept-badge">
                  <Users size={13} />
                  {boMonInfo?.TenBoMon || `Bộ môn ${user?.username}`}
                </span>
              </div>
              <p className="pcgv-header-subtitle">
                Phân công giảng viên trực tiếp theo thời khóa biểu đã xếp • Tự động quét trùng lịch & cân bằng tải
              </p>
            </div>
          </div>

          <div className="pcgv-header-right">
            {/* Học kỳ Selector */}
            <select
              className="pcgv-select-hk"
              value={selectedHocKy}
              onChange={e => setSelectedHocKy(e.target.value)}
            >
              {hocKyList.map(hk => (
                <option key={hk.MaHocKy} value={hk.MaHocKy}>
                  {hk.TenHocKy} {hk.NamHoc ? `(${hk.NamHoc})` : ''}
                </option>
              ))}
            </select>

            <button
              className="pcgv-btn-refresh"
              onClick={() => {
                fetchClasses();
                if (activeTab === 'WORKLOAD') fetchWorkload();
              }}
              disabled={loadingClasses}
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={14} className={loadingClasses ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* KPI Stats Row */}
        <div className="pcgv-kpi-grid">
          <div className="pcgv-kpi-card kpi-indigo">
            <div className="pcgv-kpi-icon">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="pcgv-kpi-num">{stats.totalClasses || 0}</div>
              <div className="pcgv-kpi-label">Tổng lớp học phần</div>
            </div>
          </div>

          <div className="pcgv-kpi-card kpi-emerald">
            <div className="pcgv-kpi-icon">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="pcgv-kpi-num">{stats.assignedCount || 0}</div>
              <div className="pcgv-kpi-label">Đã phân công ({stats.completionRate || 0}%)</div>
            </div>
          </div>

          <div className="pcgv-kpi-card kpi-amber">
            <div className="pcgv-kpi-icon">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="pcgv-kpi-num">{stats.unassignedScheduledCount || 0}</div>
              <div className="pcgv-kpi-label">Chưa phân (Có TKB)</div>
            </div>
          </div>

          <div className="pcgv-kpi-card kpi-blue">
            <div className="pcgv-kpi-icon">
              <Users size={20} />
            </div>
            <div>
              <div className="pcgv-kpi-num">
                {stats.assignedLecturersCount || 0} / {stats.totalLecturersInDept || 0}
              </div>
              <div className="pcgv-kpi-label">GV đã nhận lớp</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pcgv-progress-box">
          <div className="pcgv-progress-header">
            <span>Tiến độ hoàn thành phân công giảng dạy:</span>
            <span style={{ color: '#4f46e5', fontWeight: 700 }}>
              {stats.assignedCount || 0} / {stats.scheduledCount || 0} lớp có TKB ({stats.completionRate || 0}%)
            </span>
          </div>
          <div className="pcgv-progress-track">
            <div
              className="pcgv-progress-fill"
              style={{ width: `${Math.min(stats.completionRate || 0, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Notifications Alert */}
      {successMsg && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', fontWeight: 600 }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ─── 2. VIEW TABS ─── */}
      <div className="pcgv-view-tabs">
        <button
          className={`pcgv-tab-btn ${activeTab === 'WORKSPACE' ? 'active' : ''}`}
          onClick={() => setActiveTab('WORKSPACE')}
        >
          <Layers size={16} />
          <span>Phân Công Theo Lớp (Workspace)</span>
        </button>

        <button
          className={`pcgv-tab-btn ${activeTab === 'WORKLOAD' ? 'active' : ''}`}
          onClick={() => setActiveTab('WORKLOAD')}
        >
          <BarChart2 size={16} />
          <span>Theo Dõi & Cân Bằng Tải Giảng Viên</span>
        </button>
      </div>

      {/* ─── 3. TAB 1: WORKSPACE (SPLIT-PANE) ─── */}
      {activeTab === 'WORKSPACE' && (
        <div className="pcgv-workspace">
          {/* Cột trái: Master Class List */}
          <PhanCongClassList
            classes={classes}
            selectedClass={selectedClass}
            onSelectClass={handleSelectClass}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            stats={stats}
            loading={loadingClasses}
          />

          {/* Cột phải: Inspector & Conflict Engine */}
          <PhanCongInspector
            selectedClass={selectedClass}
            availabilityData={availabilityData}
            loadingAvailability={loadingAvailability}
            onAssign={handleAssign}
            onUnassign={handleUnassign}
            onPreviewSchedule={handlePreviewSchedule}
            assigning={assigning}
          />
        </div>
      )}

      {/* ─── 4. TAB 2: WORKLOAD MATRIX ─── */}
      {activeTab === 'WORKLOAD' && (
        <PhanCongWorkloadMatrix
          workloadData={workloadData}
          loading={loadingWorkload}
          onPreviewSchedule={handlePreviewSchedule}
        />
      )}

      {/* ─── 5. PREVIEW WEEKLY SCHEDULE MODAL ─── */}
      <PhanCongLecturerScheduleModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, maGiangVien: '', lecturerName: '' })}
        maGiangVien={previewModal.maGiangVien}
        lecturerName={previewModal.lecturerName}
        maHocKy={selectedHocKy}
      />
    </div>
  );
}
