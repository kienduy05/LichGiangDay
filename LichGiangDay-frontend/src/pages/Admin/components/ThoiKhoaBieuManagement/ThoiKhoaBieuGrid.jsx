import React, { useState, useEffect, useMemo } from 'react';
import { apiGetMatrixGrid } from '../../../../utils/apiThoiKhoaBieu';
import { apiGetToaNhaList, apiGetPhongHocList } from '../../../../utils/api';
import {
  Calendar, Clock, Building2, User, Users,
  Filter, RefreshCw, AlertCircle, BookOpen, Layers,
  ChevronLeft, ChevronRight, CheckCircle, Info, Sparkles
} from 'lucide-react';
import './ThoiKhoaBieuComponents.css';

const DAYS_OF_WEEK = [
  { value: 2, label: 'Thứ 2', short: 'T2' },
  { value: 3, label: 'Thứ 3', short: 'T3' },
  { value: 4, label: 'Thứ 4', short: 'T4' },
  { value: 5, label: 'Thứ 5', short: 'T5' },
  { value: 6, label: 'Thứ 6', short: 'T6' },
  { value: 7, label: 'Thứ 7', short: 'T7' },
  { value: 8, label: 'Chủ nhật', short: 'CN' },
];

const PERIOD_ROWS = [
  { maTiet: 1, label: 'Tiết 1 - 3', time: '07:00 - 09:25', session: 'Sáng' },
  { maTiet: 2, label: 'Tiết 4 - 6', time: '09:35 - 12:00', session: 'Sáng' },
  { maTiet: 3, label: 'Tiết 7 - 9', time: '13:00 - 15:25', session: 'Chiều' },
  { maTiet: 4, label: 'Tiết 10 - 12', time: '15:35 - 18:00', session: 'Chiều' },
  { maTiet: 5, label: 'Tiết 13 - 16', time: '18:00 - 21:30', session: 'Tối' },
];

// Helper: Format Date to YYYY-MM-DD for <input type="date">
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

// Helper: Get Monday of a week
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

export default function ThoiKhoaBieuGrid({
  onScheduleClick
}) {
  const [matrixData, setMatrixData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Danh mục Tòa nhà & Phòng học
  const [toaNhas, setToaNhas] = useState([]);
  const [phongHocs, setPhongHocs] = useState([]);
  const [filterToaNha, setFilterToaNha] = useState('');
  const [filterPhongHoc, setFilterPhongHoc] = useState('');

  // Khoảng ngày (Date Range Filter)
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState('THIS_WEEK'); // 'THIS_WEEK' | 'NEXT_WEEK' | 'THIS_MONTH' | 'CUSTOM'

  // Khởi tạo ngày mặc định là Tuần hiện tại
  useEffect(() => {
    const today = new Date();
    const monday = getMondayOfWeek(today);
    const sunday = addDays(monday, 6);
    setTuNgay(toInputDateFormat(monday));
    setDenNgay(toInputDateFormat(sunday));
    setActiveDatePreset('THIS_WEEK');
  }, []);

  // Load danh mục Tòa nhà & Phòng học
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [tnList, phList] = await Promise.all([
          apiGetToaNhaList(),
          apiGetPhongHocList()
        ]);
        const validTnList = tnList || [];
        const validPhList = (phList || []).filter(p => p.TrangThai !== 'Inactive');
        
        setToaNhas(validTnList);
        setPhongHocs(validPhList);

        // Mặc định chọn phòng đầu tiên
        if (validPhList.length > 0) {
          setFilterPhongHoc(validPhList[0].MaPhong);
          if (validPhList[0].MaToaNha) {
            setFilterToaNha(validPhList[0].MaToaNha);
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh mục phòng:', err);
      }
    };
    loadCategories();
  }, []);

  // Lọc danh sách phòng theo tòa nhà đã chọn (KHÔNG CÓ TẤT CẢ PHÒNG)
  const filteredPhongHocs = useMemo(() => {
    if (!filterToaNha) return phongHocs;
    return phongHocs.filter(p => p.MaToaNha === filterToaNha);
  }, [phongHocs, filterToaNha]);

  // Tự động chọn phòng hợp lệ khi đổi Tòa nhà
  useEffect(() => {
    if (filteredPhongHocs.length > 0) {
      const exists = filteredPhongHocs.some(p => p.MaPhong === filterPhongHoc);
      if (!exists) {
        setFilterPhongHoc(filteredPhongHocs[0].MaPhong);
      }
    } else {
      setFilterPhongHoc('');
    }
  }, [filteredPhongHocs]);

  // Phòng học đang chọn
  const selectedRoomObj = useMemo(() => {
    return phongHocs.find(p => p.MaPhong === filterPhongHoc) || null;
  }, [phongHocs, filterPhongHoc]);

  // Tải dữ liệu ma trận (dựa trên Phòng và Khoảng ngày)
  const fetchMatrix = async () => {
    if (!filterPhongHoc) {
      setMatrixData({});
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiGetMatrixGrid({
        maToaNha: filterToaNha,
        maPhong: filterPhongHoc,
        tuNgay: tuNgay || undefined,
        denNgay: denNgay || undefined
      });
      setMatrixData(data?.matrix || {});
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu ma trận thời khóa biểu phòng học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, [filterPhongHoc, tuNgay, denNgay]);

  // Xử lý các nút Preset nhanh cho ngày
  const handleSelectPreset = (preset) => {
    setActiveDatePreset(preset);
    const today = new Date();
    if (preset === 'THIS_WEEK') {
      const monday = getMondayOfWeek(today);
      const sunday = addDays(monday, 6);
      setTuNgay(toInputDateFormat(monday));
      setDenNgay(toInputDateFormat(sunday));
    } else if (preset === 'NEXT_WEEK') {
      const monday = addDays(getMondayOfWeek(today), 7);
      const sunday = addDays(monday, 6);
      setTuNgay(toInputDateFormat(monday));
      setDenNgay(toInputDateFormat(sunday));
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setTuNgay(toInputDateFormat(firstDay));
      setDenNgay(toInputDateFormat(lastDay));
    }
  };

  // Điều hướng tuần trước / tuần sau
  const handlePrevWeek = () => {
    const currentStart = tuNgay ? new Date(tuNgay) : new Date();
    const newMonday = addDays(getMondayOfWeek(currentStart), -7);
    const newSunday = addDays(newMonday, 6);
    setTuNgay(toInputDateFormat(newMonday));
    setDenNgay(toInputDateFormat(newSunday));
    setActiveDatePreset('CUSTOM');
  };

  const handleNextWeek = () => {
    const currentStart = tuNgay ? new Date(tuNgay) : new Date();
    const newMonday = addDays(getMondayOfWeek(currentStart), 7);
    const newSunday = addDays(newMonday, 6);
    setTuNgay(toInputDateFormat(newMonday));
    setDenNgay(toInputDateFormat(newSunday));
    setActiveDatePreset('CUSTOM');
  };

  // Tính ngày cụ thể cho từng cột Thứ (nếu khoảng ngày là 1 tuần chuẩn)
  const columnDatesMap = useMemo(() => {
    if (!tuNgay) return {};
    const startDate = new Date(tuNgay);
    if (isNaN(startDate.getTime())) return {};
    
    // Nếu tuNgay là Thứ 2, map từng ngày
    const map = {};
    const monday = getMondayOfWeek(startDate);
    DAYS_OF_WEEK.forEach((day, index) => {
      const d = addDays(monday, index);
      map[day.value] = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    return map;
  }, [tuNgay]);

  // Thống kê nhanh số tiết bận / trống trong ma trận
  const matrixStats = useMemo(() => {
    let busySlots = 0;
    let totalClasses = 0;
    for (let thu = 2; thu <= 8; thu++) {
      for (let tiet = 1; tiet <= 5; tiet++) {
        const classes = matrixData[thu]?.[tiet] || [];
        if (classes.length > 0) {
          busySlots++;
          totalClasses += classes.length;
        }
      }
    }
    return {
      totalSlots: 35, // 7 ngày x 5 ca
      busySlots,
      freeSlots: 35 - busySlots,
      totalClasses
    };
  }, [matrixData]);

  return (
    <div className="tkb-matrix-view-container">
      
      {/* 1. FILTER CONTROLS & DATE RANGE TOOLBAR */}
      <div className="matrix-filter-card">
        
        {/* Hàng 1: Chọn Tòa nhà & Phòng học (BẮT BUỘC CHỌN 1 PHÒNG CỤ THỂ) */}
        <div className="matrix-filter-row">
          <div className="matrix-room-selectors">
            
            {/* Tòa nhà */}
            <div className="matrix-control-item">
              <label><Building2 size={15} /> Tòa nhà:</label>
              <select
                className="matrix-styled-select"
                value={filterToaNha}
                onChange={(e) => {
                  setFilterToaNha(e.target.value);
                }}
              >
                <option value="">-- Tất cả tòa nhà --</option>
                {toaNhas.map(tn => (
                  <option key={tn.MaToaNha} value={tn.MaToaNha}>
                    {tn.TenToaNha} {tn.CoSo ? `(${tn.CoSo})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Phòng học: ĐÃ BỎ LỰA CHỌN "TẤT CẢ PHÒNG HỌC" */}
            <div className="matrix-control-item">
              <label><Layers size={15} /> Phòng học cụ thể: <span className="text-required">*</span></label>
              <select
                className="matrix-styled-select room-highlight-select"
                value={filterPhongHoc}
                onChange={(e) => setFilterPhongHoc(e.target.value)}
              >
                {filteredPhongHocs.length === 0 ? (
                  <option value="">Không có phòng học nào</option>
                ) : (
                  filteredPhongHocs.map(ph => (
                    <option key={ph.MaPhong} value={ph.MaPhong}>
                      {ph.TenPhong} ({ph.MaToaNha} • {ph.SucChua || 50} chỗ • {ph.LoaiPhong || 'LT'})
                    </option>
                  ))
                )}
              </select>
            </div>

          </div>

          <button
            type="button"
            className="btn-refresh-matrix"
            onClick={fetchMatrix}
            disabled={loading}
            title="Làm mới ma trận"
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Hàng 2: Lọc khoảng ngày (Từ ngày -> Đến ngày) & Điều hướng tuần */}
        <div className="matrix-date-filter-row">
          
          <div className="matrix-date-inputs-group">
            <div className="date-input-field">
              <label><Calendar size={14} /> Từ ngày:</label>
              <input
                type="date"
                value={tuNgay}
                onChange={(e) => {
                  setTuNgay(e.target.value);
                  setActiveDatePreset('CUSTOM');
                }}
              />
            </div>

            <span className="date-range-arrow">→</span>

            <div className="date-input-field">
              <label><Calendar size={14} /> Đến ngày:</label>
              <input
                type="date"
                value={denNgay}
                onChange={(e) => {
                  setDenNgay(e.target.value);
                  setActiveDatePreset('CUSTOM');
                }}
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="date-preset-pills">
            <button
              type="button"
              className={`preset-pill ${activeDatePreset === 'THIS_WEEK' ? 'active' : ''}`}
              onClick={() => handleSelectPreset('THIS_WEEK')}
            >
              Tuần này
            </button>
            <button
              type="button"
              className={`preset-pill ${activeDatePreset === 'NEXT_WEEK' ? 'active' : ''}`}
              onClick={() => handleSelectPreset('NEXT_WEEK')}
            >
              Tuần tới
            </button>
            <button
              type="button"
              className={`preset-pill ${activeDatePreset === 'THIS_MONTH' ? 'active' : ''}`}
              onClick={() => handleSelectPreset('THIS_MONTH')}
            >
              Tháng này
            </button>
          </div>

          {/* Next / Prev Week Buttons */}
          <div className="week-stepper-group">
            <button
              type="button"
              className="btn-stepper"
              onClick={handlePrevWeek}
              title="Xem tuần trước"
            >
              <ChevronLeft size={16} />
              <span>Tuần trước</span>
            </button>
            <button
              type="button"
              className="btn-stepper"
              onClick={handleNextWeek}
              title="Xem tuần sau"
            >
              <span>Tuần sau</span>
              <ChevronRight size={16} />
            </button>
          </div>

        </div>

      </div>

      {/* 2. BANNER THÔNG TIN PHÒNG HỌC & TRẠNG THÁI SỬ DỤNG */}
      {selectedRoomObj && (
        <div className="matrix-room-info-banner">
          <div className="room-banner-left">
            <div className="room-badge-avatar">
              <Building2 size={22} />
            </div>
            <div className="room-banner-meta">
              <div className="room-banner-title-row">
                <h4>Phòng {selectedRoomObj.TenPhong}</h4>
                <span className="room-type-tag">{selectedRoomObj.LoaiPhong || 'Lý thuyết'}</span>
                <span className="room-capacity-tag">
                  <Users size={13} /> {selectedRoomObj.SucChua || 50} chỗ ngồi
                </span>
              </div>
              <p className="room-banner-subtitle">
                Tòa nhà: <strong>{selectedRoomObj.MaToaNha}</strong> • Khoảng kiểm tra lịch: <strong>{toDisplayDateFormat(tuNgay)}</strong> đến <strong>{toDisplayDateFormat(denNgay)}</strong>
              </p>
            </div>
          </div>

          <div className="room-banner-right">
            <div className="occupancy-stat-box free">
              <span className="stat-value">{matrixStats.freeSlots}</span>
              <span className="stat-label">Ca trống</span>
            </div>
            <div className="occupancy-stat-box busy">
              <span className="stat-value">{matrixStats.busySlots}</span>
              <span className="stat-label">Ca có lớp</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="matrix-error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 3. MATRIX GRID TABLE */}
      <div className="matrix-table-scroll-container">
        <table className="matrix-grid-table">
          <thead>
            <tr>
              <th className="period-corner-col">
                <Clock size={16} />
                <span>Tiết / Thứ</span>
              </th>
              {DAYS_OF_WEEK.map(day => (
                <th key={day.value} className="day-header-col">
                  <div className="day-header-content">
                    <span className="day-name">{day.label}</span>
                    {columnDatesMap[day.value] && (
                      <span className="day-date-tag">({columnDatesMap[day.value]})</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIOD_ROWS.map(period => (
              <tr key={period.maTiet}>
                
                {/* Cột Tiết học bên trái */}
                <td className="period-label-cell">
                  <div className="period-info-box">
                    <span className="period-badge-session">{period.session}</span>
                    <span className="period-name">{period.label}</span>
                    <span className="period-time">{period.time}</span>
                  </div>
                </td>

                {/* Các ô lịch của từng Thứ trong tuần */}
                {DAYS_OF_WEEK.map(day => {
                  const cellClasses = matrixData[day.value]?.[period.maTiet] || [];
                  const isSlotBusy = cellClasses.length > 0;

                  return (
                    <td
                      key={day.value}
                      className={`matrix-slot-cell ${isSlotBusy ? 'slot-occupied' : 'slot-available'}`}
                    >
                      {!isSlotBusy ? (
                        <div
                          className="empty-room-slot-card"
                          title={`Phòng ${selectedRoomObj?.TenPhong || ''} TRỐNG vào ${day.label}, ${period.label}`}
                        >
                          <div className="empty-slot-indicator">
                            <span className="empty-status-text">Phòng trống</span>
                            <span className="empty-subtext">Sẵn sàng xếp lịch</span>
                          </div>
                        </div>
                      ) : (
                        <div className="matrix-cards-stack">
                          {cellClasses.map((item, idx) => (
                            <div
                              key={item.MaThoiKhoaBieu || idx}
                              className={`matrix-schedule-card ${item.LoaiHoc?.toLowerCase() || 'lt'}`}
                              onClick={() => {
                                if (onScheduleClick) {
                                  onScheduleClick({
                                    MaLopHocPhan: item.MaLopHocPhan,
                                    TenLopHocPhan: item.TenLopHocPhan,
                                    TenMonHoc: item.TenMonHoc,
                                    SoTinChi: item.SoTinChi,
                                    LoaiHoc: item.LoaiHoc,
                                    SiSoDuKien: item.SiSoDuKien,
                                    NgayBatDau: item.NgayBatDau,
                                    NgayKetThuc: item.NgayKetThuc,
                                    TenGiangVien: item.TenGiangVien
                                  });
                                }
                              }}
                              title={`Bấm để xem/chỉnh sửa lịch lớp: ${item.TenLopHocPhan || item.TenMonHoc} (${item.MaLopHocPhan})`}
                            >
                              <div className="card-top-row">
                                <span className="card-course-name" title={item.TenLopHocPhan || item.TenMonHoc}>
                                  {item.TenLopHocPhan || item.TenMonHoc}
                                </span>
                                <span className={`card-type-badge ${item.LoaiHoc?.toLowerCase() || 'lt'}`}>
                                  {item.LoaiHoc || 'LT'}
                                </span>
                              </div>

                              <div className="card-middle-row">
                                <span className="card-lhp-code">{item.MaLopHocPhan}</span>
                                {item.SoTinChi && (
                                  <span className="card-credit-badge">{item.SoTinChi} TC</span>
                                )}
                              </div>

                              <div className="card-lecturer-row">
                                <span className="card-lecturer" title={item.TenGiangVien || 'Chưa phân công'}>
                                  <User size={12} />
                                  {item.TenGiangVien || 'Chưa phân công'}
                                </span>
                              </div>

                              <div className="card-bottom-row">
                                <span className="card-date-span" title={`Thời gian học: ${toDisplayDateFormat(item.NgayBatDau)} - ${toDisplayDateFormat(item.NgayKetThuc)}`}>
                                  <Calendar size={11} />
                                  {toDisplayDateFormat(item.NgayBatDau)?.substring(0, 5)} - {toDisplayDateFormat(item.NgayKetThuc)?.substring(0, 5)}
                                </span>
                                <span className="card-students">
                                  <Users size={11} />
                                  {item.SiSoDangKy || item.SiSoDuKien || 50} SV
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
