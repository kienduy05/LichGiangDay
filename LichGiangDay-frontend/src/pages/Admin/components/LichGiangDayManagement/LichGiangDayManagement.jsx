import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  apiGetHocKyList,
  apiGetKhoaList,
  apiGetBoMonList,
  apiGetGiangVienList,
  apiGetToaNhaList,
  apiGetPhongHocList
} from '../../../../utils/api';
import { apiGetMatrixGrid } from '../../../../utils/apiThoiKhoaBieu';

import LichGiangDayFilterBar from './LichGiangDayFilterBar';
import LichGiangDayMatrixGrid from './LichGiangDayMatrixGrid';
import LichGiangDayRoomGrid from './LichGiangDayRoomGrid';
import LichGiangDayLecturerGrid from './LichGiangDayLecturerGrid';
import LichGiangDayAgendaView from './LichGiangDayAgendaView';
import LichGiangDayDetailModal from './LichGiangDayDetailModal';
import LichGiangDaySlotModal from './LichGiangDaySlotModal';

import './LichGiangDayComponents.css';

const DAYS_DEF = [
  { value: 2, label: 'Thứ 2', short: 'T2' },
  { value: 3, label: 'Thứ 3', short: 'T3' },
  { value: 4, label: 'Thứ 4', short: 'T4' },
  { value: 5, label: 'Thứ 5', short: 'T5' },
  { value: 6, label: 'Thứ 6', short: 'T6' },
  { value: 7, label: 'Thứ 7', short: 'T7' },
  { value: 8, label: 'Chủ nhật', short: 'CN' },
];

// Helper: Format Date to YYYY-MM-DD
const toInputDateFormat = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Format Date to DD/MM/YYYY
const toDisplayDateFormat = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// Helper: Get Monday of given date
const getMondayOfWeek = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

// Helper: Add days
const addDays = (d, days) => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

export default function LichGiangDayManagement() {
  const { user } = useAuth();

  // Phân quyền dữ liệu theo vai trò Bộ môn (Role: BOMON)
  // ADMIN và PHONGDAOTAO được xem toàn trường
  const isBoMonRole = user?.role === 'BOMON';
  const scopedBoMonId = isBoMonRole ? (user?.username || '') : '';

  // Lookups data
  const [hocKyList, setHocKyList] = useState([]);
  const [khoaList, setKhoaList] = useState([]);
  const [boMonList, setBoMonList] = useState([]);
  const [giangVienList, setGiangVienList] = useState([]);
  const [toaNhaList, setToaNhaList] = useState([]);
  const [phongHocList, setPhongHocList] = useState([]);

  // Filter states
  const [selectedHocKy, setSelectedHocKy] = useState('');
  const [selectedKhoaId, setSelectedKhoaId] = useState('');
  const [selectedBoMonId, setSelectedBoMonId] = useState('');
  const [selectedGiangVien, setSelectedGiangVien] = useState('');
  const [selectedToaNha, setSelectedToaNha] = useState('');
  const [selectedPhongHoc, setSelectedPhongHoc] = useState('');
  const [selectedLoaiHoc, setSelectedLoaiHoc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Date range states
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [activeDatePreset, setActiveDatePreset] = useState('THIS_WEEK');

  // View mode: 'MATRIX' (Tổng quan) | 'ROOM' (Theo Phòng) | 'LECTURER' (Theo GV) | 'AGENDA' (Theo Ngày)
  const [viewMode, setViewMode] = useState('MATRIX');

  // Matrix data state
  const [matrixData, setMatrixData] = useState({});
  const [rawList, setRawList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Detail Modal state
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Slot Multi-Class Modal state
  const [slotModalInfo, setSlotModalInfo] = useState(null);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);

  // Tên hiển thị đầy đủ của bộ môn
  const departmentFullName = useMemo(() => {
    if (!isBoMonRole || !scopedBoMonId) return '';
    const found = boMonList.find(b => b.MaBoMon === scopedBoMonId);
    if (found?.TenBoMon) return found.TenBoMon;
    return user?.fullName || `Bộ môn ${scopedBoMonId}`;
  }, [isBoMonRole, scopedBoMonId, boMonList, user?.fullName]);

  // Xác định Thứ trong tuần của Hôm nay (2: T2 -> 8: CN)
  const todayDayOfWeek = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    return day === 0 ? 8 : day + 1;
  }, []);

  // Tính toán 7 ngày của tuần đang chọn
  const weekDays = useMemo(() => {
    return DAYS_DEF.map((def, idx) => {
      const dayDate = addDays(currentWeekStart, idx);
      const isoDate = toInputDateFormat(dayDate);
      const parts = isoDate.split('-');
      const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : '';
      return {
        ...def,
        isoDate,
        displayDate
      };
    });
  }, [currentWeekStart]);

  // Hiển thị nhãn tuần trên thanh điều hướng
  const weekRangeDisplay = useMemo(() => {
    const startIso = toInputDateFormat(currentWeekStart);
    const endIso = toInputDateFormat(addDays(currentWeekStart, 6));
    return `${toDisplayDateFormat(startIso)} - ${toDisplayDateFormat(endIso)}`;
  }, [currentWeekStart]);

  // Đặt khoảng ngày mặc định khi mount
  useEffect(() => {
    const monday = getMondayOfWeek(new Date());
    const sunday = addDays(monday, 6);
    setCurrentWeekStart(monday);
    setTuNgay(toInputDateFormat(monday));
    setDenNgay(toInputDateFormat(sunday));
    setActiveDatePreset('THIS_WEEK');
  }, []);

  // 1. Tải danh mục tra cứu ban đầu
  const fetchLookups = async () => {
    try {
      const [hks, ks, bms, gvs, tns, phs] = await Promise.all([
        apiGetHocKyList().catch(() => []),
        apiGetKhoaList().catch(() => []),
        apiGetBoMonList().catch(() => []),
        apiGetGiangVienList({ maBoMon: isBoMonRole ? scopedBoMonId : '' }).catch(() => []),
        apiGetToaNhaList().catch(() => []),
        apiGetPhongHocList().catch(() => [])
      ]);

      setHocKyList(hks || []);
      setKhoaList(ks || []);
      setBoMonList(bms || []);
      setGiangVienList(gvs || []);
      setToaNhaList(tns || []);
      setPhongHocList(phs || []);

      if (hks && hks.length > 0 && !selectedHocKy) {
        setSelectedHocKy(hks[0].MaHocKy);
      }
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  // 2. Tải dữ liệu ma trận lịch học
  const fetchMatrix = useCallback(async () => {
    if (!selectedHocKy) return;
    setLoading(true);
    try {
      const effectiveBoMon = isBoMonRole ? scopedBoMonId : selectedBoMonId;

      const data = await apiGetMatrixGrid({
        maHocKy: selectedHocKy,
        maKhoa: selectedKhoaId,
        maBoMon: effectiveBoMon,
        maGiangVien: selectedGiangVien,
        maToaNha: selectedToaNha,
        maPhong: selectedPhongHoc,
        loaiHoc: selectedLoaiHoc,
        search: searchTerm,
        tuNgay,
        denNgay
      });

      setMatrixData(data?.matrix || {});
      setRawList(data?.rawList || []);
    } catch (err) {
      console.error('Lỗi tải lịch giảng dạy:', err);
      setMatrixData({});
      setRawList([]);
    } finally {
      setLoading(false);
    }
  }, [
    selectedHocKy, selectedKhoaId, selectedBoMonId, isBoMonRole, scopedBoMonId,
    selectedGiangVien, selectedToaNha, selectedPhongHoc, selectedLoaiHoc,
    searchTerm, tuNgay, denNgay
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMatrix();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchMatrix]);

  // 3. Tính toán KPI thống kê từ dữ liệu đã tải
  const stats = useMemo(() => {
    const uniqueClasses = new Set();
    const uniqueLecturers = new Set();
    const uniqueRooms = new Set();
    let totalPeriods = rawList.length;

    rawList.forEach(item => {
      if (item.MaLopHocPhan) uniqueClasses.add(item.MaLopHocPhan);
      if (item.MaGiangVien) uniqueLecturers.add(item.MaGiangVien);
      if (item.MaPhong) uniqueRooms.add(item.MaPhong);
    });

    return {
      totalClasses: uniqueClasses.size,
      totalLecturers: uniqueLecturers.size,
      totalRooms: uniqueRooms.size,
      totalPeriods
    };
  }, [rawList]);

  // 4. Handlers cho các nút chọn nhanh khoảng ngày
  const handleSetDatePreset = (preset) => {
    setActiveDatePreset(preset);
    const today = new Date();

    if (preset === 'TODAY') {
      const iso = toInputDateFormat(today);
      const monday = getMondayOfWeek(today);
      setCurrentWeekStart(monday);
      setTuNgay(iso);
      setDenNgay(iso);
    } else if (preset === 'THIS_WEEK') {
      const monday = getMondayOfWeek(today);
      const sunday = addDays(monday, 6);
      setCurrentWeekStart(monday);
      setTuNgay(toInputDateFormat(monday));
      setDenNgay(toInputDateFormat(sunday));
    } else if (preset === 'NEXT_WEEK') {
      const monday = addDays(getMondayOfWeek(today), 7);
      const sunday = addDays(monday, 6);
      setCurrentWeekStart(monday);
      setTuNgay(toInputDateFormat(monday));
      setDenNgay(toInputDateFormat(sunday));
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setCurrentWeekStart(getMondayOfWeek(firstDay));
      setTuNgay(toInputDateFormat(firstDay));
      setDenNgay(toInputDateFormat(lastDay));
    }
  };

  const handlePrevWeek = () => {
    const newStart = addDays(currentWeekStart, -7);
    const newEnd = addDays(newStart, 6);
    setCurrentWeekStart(newStart);
    setTuNgay(toInputDateFormat(newStart));
    setDenNgay(toInputDateFormat(newEnd));
    setActiveDatePreset('CUSTOM');
  };

  const handleNextWeek = () => {
    const newStart = addDays(currentWeekStart, 7);
    const newEnd = addDays(newStart, 6);
    setCurrentWeekStart(newStart);
    setTuNgay(toInputDateFormat(newStart));
    setDenNgay(toInputDateFormat(newEnd));
    setActiveDatePreset('CUSTOM');
  };

  const handleCardClick = (item) => {
    setSelectedItemForModal(item);
    setIsDetailModalOpen(true);
  };

  const handleOpenSlotModal = (slotData) => {
    setSlotModalInfo(slotData);
    setIsSlotModalOpen(true);
  };

  return (
    <div className="lgd-container">
      {/* ─── BỘ LỌC ĐA CHIỀU & KPI BANNER ─── */}
      <LichGiangDayFilterBar
        hocKyList={hocKyList}
        khoaList={khoaList}
        boMonList={boMonList}
        giangVienList={giangVienList}
        toaNhaList={toaNhaList}
        phongHocList={phongHocList}
        isBoMonRole={isBoMonRole}
        scopedBoMonId={scopedBoMonId}
        departmentFullName={departmentFullName}
        selectedHocKy={selectedHocKy}
        setSelectedHocKy={setSelectedHocKy}
        selectedKhoaId={selectedKhoaId}
        setSelectedKhoaId={setSelectedKhoaId}
        selectedBoMonId={selectedBoMonId}
        setSelectedBoMonId={setSelectedBoMonId}
        selectedGiangVien={selectedGiangVien}
        setSelectedGiangVien={setSelectedGiangVien}
        selectedToaNha={selectedToaNha}
        setSelectedToaNha={setSelectedToaNha}
        selectedPhongHoc={selectedPhongHoc}
        setSelectedPhongHoc={setSelectedPhongHoc}
        selectedLoaiHoc={selectedLoaiHoc}
        setSelectedLoaiHoc={setSelectedLoaiHoc}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeDatePreset={activeDatePreset}
        handleSetDatePreset={handleSetDatePreset}
        handlePrevWeek={handlePrevWeek}
        handleNextWeek={handleNextWeek}
        weekRangeDisplay={weekRangeDisplay}
        viewMode={viewMode}
        setViewMode={setViewMode}
        stats={stats}
        onRefresh={() => {
          fetchLookups();
          fetchMatrix();
        }}
        loading={loading}
      />

      {/* ─── 4 CHẾ ĐỘ XEM THÔNG MINH ─── */}
      {viewMode === 'MATRIX' && (
        <LichGiangDayMatrixGrid
          matrixData={matrixData}
          weekDays={weekDays}
          onCardClick={handleCardClick}
          onOpenSlotModal={handleOpenSlotModal}
          todayDayOfWeek={todayDayOfWeek}
          loading={loading}
        />
      )}

      {viewMode === 'ROOM' && (
        <LichGiangDayRoomGrid
          rawList={rawList}
          phongHocList={phongHocList}
          selectedToaNha={selectedToaNha}
          weekDays={weekDays}
          onCardClick={handleCardClick}
          todayDayOfWeek={todayDayOfWeek}
          loading={loading}
        />
      )}

      {viewMode === 'LECTURER' && (
        <LichGiangDayLecturerGrid
          rawList={rawList}
          giangVienList={giangVienList}
          selectedBoMonId={selectedBoMonId}
          scopedBoMonId={scopedBoMonId}
          isBoMonRole={isBoMonRole}
          weekDays={weekDays}
          onCardClick={handleCardClick}
          todayDayOfWeek={todayDayOfWeek}
          loading={loading}
        />
      )}

      {viewMode === 'AGENDA' && (
        <LichGiangDayAgendaView
          matrixData={matrixData}
          weekDays={weekDays}
          onCardClick={handleCardClick}
          todayDayOfWeek={todayDayOfWeek}
        />
      )}

      {/* ─── MODAL XEM CHI TIẾT 1 LỚP HỌC ─── */}
      <LichGiangDayDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedItemForModal(null);
        }}
        item={selectedItemForModal}
      />

      {/* ─── MODAL XEM DANH SÁCH LỚP TRONG 1 CA HỌC ─── */}
      <LichGiangDaySlotModal
        isOpen={isSlotModalOpen}
        onClose={() => {
          setIsSlotModalOpen(false);
          setSlotModalInfo(null);
        }}
        slotInfo={slotModalInfo}
        onClassClick={handleCardClick}
      />
    </div>
  );
}
