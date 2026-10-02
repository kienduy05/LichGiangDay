import React, { useState, useEffect } from 'react';
import { apiGetMatrixGrid } from '../../../../utils/apiThoiKhoaBieu';
import { apiGetToaNhaList, apiGetPhongHocList } from '../../../../utils/api';
import {
  Calendar, Clock, Building2, User, Users,
  Filter, RefreshCw, AlertCircle, BookOpen, Layers
} from 'lucide-react';
import './ThoiKhoaBieuComponents.css';

const DAYS_OF_WEEK = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
  { value: 8, label: 'Chủ nhật' },
];

const PERIOD_ROWS = [
  { maTiet: 1, label: 'Tiết 1 - 3', time: '07:00 - 09:25' },
  { maTiet: 2, label: 'Tiết 4 - 6', time: '09:35 - 12:00' },
  { maTiet: 3, label: 'Tiết 7 - 9', time: '13:00 - 15:25' },
  { maTiet: 4, label: 'Tiết 10 - 12', time: '15:35 - 18:00' },
  { maTiet: 5, label: 'Tiết 13 - 16', time: '18:00 - 21:30' },
];

export default function ThoiKhoaBieuGrid({
  maHocKy,
  onScheduleClick
}) {
  const [matrixData, setMatrixData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters for Grid
  const [toaNhas, setToaNhas] = useState([]);
  const [phongHocs, setPhongHocs] = useState([]);
  const [filterToaNha, setFilterToaNha] = useState('');
  const [filterPhongHoc, setFilterPhongHoc] = useState('');

  // Load danh mục Tòa nhà & Phòng học
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [tnList, phList] = await Promise.all([
          apiGetToaNhaList(),
          apiGetPhongHocList()
        ]);
        setToaNhas(tnList || []);
        setPhongHocs(phList || []);
      } catch (err) {
        console.error('Lỗi tải danh mục phòng:', err);
      }
    };
    loadCategories();
  }, []);

  // Tải dữ liệu ma trận
  const fetchMatrix = async () => {
    if (!maHocKy) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiGetMatrixGrid({
        maHocKy,
        maToaNha: filterToaNha,
        maPhong: filterPhongHoc
      });
      setMatrixData(data?.matrix || {});
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu lưới thời khóa biểu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, [maHocKy, filterToaNha, filterPhongHoc]);

  // Lọc danh sách phòng theo tòa nhà đã chọn
  const filteredPhongHocs = filterToaNha
    ? phongHocs.filter(p => p.MaToaNha === filterToaNha)
    : phongHocs;

  return (
    <div className="tkb-matrix-view-container">
      
      {/* Grid Sub-Filter Bar */}
      <div className="matrix-filter-bar">
        <div className="matrix-filter-group">
          <label><Building2 size={14} /> Tòa nhà:</label>
          <select
            className="matrix-select"
            value={filterToaNha}
            onChange={(e) => {
              setFilterToaNha(e.target.value);
              setFilterPhongHoc('');
            }}
          >
            <option value="">-- Tất cả tòa nhà --</option>
            {toaNhas.map(tn => (
              <option key={tn.MaToaNha} value={tn.MaToaNha}>{tn.TenToaNha}</option>
            ))}
          </select>
        </div>

        <div className="matrix-filter-group">
          <label><Layers size={14} /> Phòng học:</label>
          <select
            className="matrix-select"
            value={filterPhongHoc}
            onChange={(e) => setFilterPhongHoc(e.target.value)}
          >
            <option value="">-- Tất cả phòng học --</option>
            {filteredPhongHocs.map(ph => (
              <option key={ph.MaPhong} value={ph.MaPhong}>
                {ph.TenPhong} ({ph.MaToaNha} - {ph.SucChua} chỗ)
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn-refresh-matrix"
          onClick={fetchMatrix}
          disabled={loading}
          title="Làm mới lưới"
        >
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {error && (
        <div className="matrix-error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* MATRIX GRID TABLE */}
      <div className="matrix-table-scroll-container">
        <table className="matrix-grid-table">
          <thead>
            <tr>
              <th className="period-corner-col">
                <Clock size={15} />
                <span>Tiết / Thứ</span>
              </th>
              {DAYS_OF_WEEK.map(day => (
                <th key={day.value} className="day-header-col">
                  <span className="day-name">{day.label}</span>
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
                    <span className="period-name">{period.label}</span>
                    <span className="period-time">{period.time}</span>
                  </div>
                </td>

                {/* Các ô lịch của từng Thứ */}
                {DAYS_OF_WEEK.map(day => {
                  const cellClasses = matrixData[day.value]?.[period.maTiet] || [];

                  return (
                    <td key={day.value} className="matrix-slot-cell">
                      {cellClasses.length === 0 ? (
                        <div className="empty-cell-placeholder">
                          <span>Trống</span>
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
                              title={`Bấm để chỉnh sửa lịch lớp ${item.MaLopHocPhan}`}
                            >
                              <div className="card-top-row">
                                <span className="card-course-name" title={item.TenLopHocPhan || item.TenMonHoc}>
                                  {item.TenLopHocPhan || item.TenMonHoc}
                                </span>
                                <span className="card-type-tag">{item.LoaiHoc}</span>
                              </div>

                              <div className="card-middle-row">
                                <span className="card-lhp-code">{item.MaLopHocPhan}</span>
                                <span className="card-room-badge">
                                  <Building2 size={11} />
                                  {item.TenPhong || item.MaPhong}
                                </span>
                              </div>

                              <div className="card-bottom-row">
                                <span className="card-lecturer" title={item.TenGiangVien || 'Chưa phân công'}>
                                  <User size={11} />
                                  {item.TenGiangVien || 'Chưa phân công'}
                                </span>
                                <span className="card-students">
                                  <Users size={11} />
                                  {item.SiSoDuKien || 50}
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
