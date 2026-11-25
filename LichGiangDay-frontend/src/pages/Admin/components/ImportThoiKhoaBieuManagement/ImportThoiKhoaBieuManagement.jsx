import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileSpreadsheet, UploadCloud, Layers, Calendar, Clock,
  CheckCircle2, AlertTriangle, AlertCircle, Trash2, Plus,
  Search, ArrowRight, Loader2, RefreshCw, X, Building, Check
} from 'lucide-react';
import { apiGetHocKyList, apiGetBoMonList } from '../../../../utils/api';
import { apiPreviewImportThoiKhoaBieu, apiSaveImportedThoiKhoaBieu } from '../../../../utils/apiThoiKhoaBieu';
import './ImportThoiKhoaBieuManagement.css';

const TIET_OPTIONS = [
  { value: 1, label: 'Ca 1 (Tiết 1-3: 07:00 - 09:25)' },
  { value: 2, label: 'Ca 2 (Tiết 4-6: 09:35 - 12:00)' },
  { value: 3, label: 'Ca 3 (Tiết 7-9: 13:00 - 15:25)' },
  { value: 4, label: 'Ca 4 (Tiết 10-12: 15:35 - 18:00)' }
];

const THU_OPTIONS = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' }
];

export default function ImportThoiKhoaBieuManagement({ onNavigateTab }) {
  // ─── Dropdown state ───
  const [hocKyList, setHocKyList] = useState([]);
  const [boMonList, setBoMonList] = useState([]);
  const [selectedHocKy, setSelectedHocKy] = useState('');
  const [selectedBoMon, setSelectedBoMon] = useState('');

  // ─── File upload state ───
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // ─── Parse / Preview state ───
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [classesList, setClassesList] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [monHocList, setMonHocList] = useState([]);

  // ─── Filter & Search state ───
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ERROR' | 'VALID'
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Saving & Success Modal state ───
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedStats, setSavedStats] = useState(null);
  const [countdown, setCountdown] = useState(4);

  // Đếm ngược tự động chuyển trang sau khi lưu thành công
  useEffect(() => {
    let timer;
    if (showSuccessModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (showSuccessModal && countdown === 0) {
      if (onNavigateTab) {
        onNavigateTab('thoikhoabieu');
      }
    }
    return () => clearTimeout(timer);
  }, [showSuccessModal, countdown, onNavigateTab]);

  // Tải danh sách Học kỳ & Bộ môn ban đầu
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [hks, bms] = await Promise.all([
          apiGetHocKyList(),
          apiGetBoMonList()
        ]);
        setHocKyList(hks || []);
        setBoMonList(bms || []);
        if (hks && hks.length > 0) {
          setSelectedHocKy(hks[0].MaHocKy);
        }
        if (bms && bms.length > 0) {
          setSelectedBoMon(bms[0].MaBoMon);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh mục ban đầu:', err);
      }
    };
    fetchInit();
  }, []);

  // Xử lý kéo thả file
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      setParseError('');
      setSaveSuccess(null);
    } else {
      setParseError('Chỉ chấp nhận file Excel có định dạng .xlsx hoặc .xls');
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setParseError('');
      setSaveSuccess(null);
    }
  };

  // Gửi file lên backend để phân tích (Parse & Preview)
  const handleParseFile = async () => {
    if (!file) {
      setParseError('Vui lòng chọn hoặc kéo thả file Excel.');
      return;
    }
    if (!selectedHocKy) {
      setParseError('Vui lòng chọn Học kỳ.');
      return;
    }

    setParsing(true);
    setParseError('');
    setSaveError('');
    setSaveSuccess(null);

    try {
      const res = await apiPreviewImportThoiKhoaBieu(file, selectedHocKy, selectedBoMon);
      if (!res || !res.classes || res.classes.length === 0) {
        setParseError('Không tìm thấy dòng lớp học phần nào trong file Excel. Vui lòng kiểm tra lại cấu trúc cột của file.');
        setPreviewData(null);
        setClassesList([]);
        return;
      }
      setPreviewData(res);
      setClassesList(res.classes || []);
      setRoomList(res.danhSachPhongHoc || []);
      setMonHocList(res.danhSachMonHoc || []);
      if (res.detectedBoMon) {
        setSelectedBoMon(res.detectedBoMon);
      }
    } catch (err) {
      setParseError(err.message || 'Lỗi khi đọc file Excel.');
    } finally {
      setParsing(false);
    }
  };

  // ─── Cập nhật chỉnh sửa tay cho Lớp chính (Inline Edit) ───
  const handleUpdateClassField = (tempId, field, value) => {
    setClassesList(prev => prev.map(cls => {
      if (cls.tempId !== tempId) return cls;
      const updated = { ...cls, [field]: value };

      // Nếu sửa mã môn học, tự tra cứu tên môn tương ứng
      if (field === 'maMonHoc') {
        const found = monHocList.find(m => m.MaMonHoc === value.trim());
        if (found) {
          updated.tenMonHoc = found.TenMonHoc;
          updated.soTinChi = found.SoTinChi;
        }
      }
      return updated;
    }));
  };

  // Xóa 1 lớp
  const handleDeleteClass = (tempId) => {
    setClassesList(prev => prev.filter(c => c.tempId !== tempId));
  };

  // ─── Cập nhật chỉnh sửa tay cho Khung lịch con ───
  const handleUpdateScheduleField = (classTempId, scheduleTempId, field, value) => {
    setClassesList(prev => prev.map(cls => {
      if (cls.tempId !== classTempId) return cls;

      const newSchedules = cls.schedules.map(sc => {
        if (sc.tempId !== scheduleTempId) return sc;
        return { ...sc, [field]: value };
      });

      // Tự động tính lại ngày min/max và tổng số tuần của lớp
      let minStart = newSchedules[0]?.ngayBatDau || cls.ngayBatDau;
      let maxEnd = newSchedules[0]?.ngayKetThuc || cls.ngayKetThuc;
      let totalWeeks = 0;

      newSchedules.forEach(sc => {
        if (sc.ngayBatDau && sc.ngayBatDau < minStart) minStart = sc.ngayBatDau;
        if (sc.ngayKetThuc && sc.ngayKetThuc > maxEnd) maxEnd = sc.ngayKetThuc;
        totalWeeks += (parseInt(sc.soTuan, 10) || 0);
      });

      return {
        ...cls,
        schedules: newSchedules,
        ngayBatDau: minStart,
        ngayKetThuc: maxEnd,
        soTuan: totalWeeks > 0 ? totalWeeks : cls.soTuan
      };
    }));
  };

  // Xóa 1 khung lịch con
  const handleDeleteSchedule = (classTempId, scheduleTempId) => {
    setClassesList(prev => prev.map(cls => {
      if (cls.tempId !== classTempId) return cls;
      return {
        ...cls,
        schedules: cls.schedules.filter(sc => sc.tempId !== scheduleTempId)
      };
    }));
  };

  // Thêm 1 khung lịch mới cho lớp
  const handleAddSchedule = (classTempId) => {
    setClassesList(prev => prev.map(cls => {
      if (cls.tempId !== classTempId) return cls;
      const newSchedule = {
        tempId: `sc_${classTempId}_${Date.now()}`,
        thuTrongTuan: 2,
        maTiet: 1,
        rawTiet: 'Tiết 1-3',
        maPhong: 'ONLINE',
        rawPhong: 'Phòng trực tuyến',
        ngayBatDau: cls.ngayBatDau,
        ngayKetThuc: cls.ngayKetThuc,
        soTuan: 3
      };
      return {
        ...cls,
        schedules: [...cls.schedules, newSchedule]
      };
    }));
  };

  // ─── Lưu dữ liệu cuối cùng vào CSDL ───
  const handleSaveToDatabase = async () => {
    if (classesList.length === 0) return;

    if (kpiStats.errorCount > 0) {
      const confirmSave = window.confirm(
        `Đang có ${kpiStats.errorCount} lớp học phần có cảnh báo / lỗi xung đột trùng phòng học. Bạn có chắc chắn muốn gửi yêu cầu lưu không? Hệ thống sẽ kiểm tra và chặn nếu phát hiện phòng học bị xung đột.`
      );
      if (!confirmSave) return;
    }

    setSaving(true);
    setSaveError('');
    setSaveSuccess(null);

    try {
      const res = await apiSaveImportedThoiKhoaBieu({
        maHocKy: selectedHocKy,
        maBoMon: selectedBoMon,
        classes: classesList
      });

      // Lưu thông tin kết quả để hiển thị Modal
      setSavedStats({
        message: res.message,
        soLopDaLuu: res.soLopDaLuu || classesList.length,
        soLopMoi: res.soLopMoi || 0,
        soKhungLichDaLuu: res.soKhungLichDaLuu || 0,
        soMonHocMoi: res.soMonHocMoi || 0,
        soToaNhaMoi: res.soToaNhaMoi || 0,
        soPhongHocMoi: res.soPhongHocMoi || 0,
        soKhoaMoi: res.soKhoaMoi || 0
      });
      setSaveSuccess(res);

      // Đóng danh sách xem trước và xóa file để dọn sạch giao diện
      setClassesList([]);
      setFile(null);
      setPreviewData(null);
      setCountdown(4);
      setShowSuccessModal(true);
    } catch (err) {
      setSaveError(err.message || 'Lỗi khi lưu Thời khóa biểu vào hệ thống.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Tính toán KPI & Lọc danh sách ───
  const kpiStats = useMemo(() => {
    const totalClasses = classesList.length;
    const totalSchedules = classesList.reduce((sum, c) => sum + (c.schedules?.length || 0), 0);
    const validCount = classesList.filter(c => c.isValid).length;
    const errorCount = totalClasses - validCount;
    return { totalClasses, totalSchedules, validCount, errorCount };
  }, [classesList]);

  const filteredClasses = useMemo(() => {
    return classesList.filter(cls => {
      if (filterMode === 'VALID' && !cls.isValid) return false;
      if (filterMode === 'ERROR' && cls.isValid) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = cls.maLopHocPhan?.toLowerCase().includes(q);
        const matchName = cls.tenLopHocPhan?.toLowerCase().includes(q);
        const matchSub = cls.maMonHoc?.toLowerCase().includes(q) || cls.tenMonHoc?.toLowerCase().includes(q);
        const matchRoom = cls.schedules?.some(sc => sc.maPhong?.toLowerCase().includes(q));
        return matchCode || matchName || matchSub || matchRoom;
      }
      return true;
    });
  }, [classesList, filterMode, searchQuery]);

  return (
    <div className="import-tkb-container">
      {/* Header */}
      <div className="import-tkb-header">
        <div className="import-tkb-title-group">
          <h2>
            <FileSpreadsheet size={26} style={{ color: '#2563eb' }} />
            Import Thời Khóa Biểu
          </h2>
          <p>Tự động nhận diện Lớp học phần, phân kỳ đợt học và xếp lịch Thứ/Tiết/Phòng từ file Excel của trường</p>
        </div>
      </div>

      {/* Main Control Card: Học kỳ, Bộ môn, File Upload */}
      <div className="import-tkb-card">
        <div className="import-tkb-controls-grid">
          <div className="import-field-group">
            <label className="import-field-label">
              1. Chọn Học kỳ <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="import-field-select"
              value={selectedHocKy}
              onChange={(e) => setSelectedHocKy(e.target.value)}
              disabled={parsing || saving}
            >
              {hocKyList.map(hk => (
                <option key={hk.MaHocKy} value={hk.MaHocKy}>
                  {hk.TenHocKy} ({hk.MaHocKy})
                </option>
              ))}
            </select>
          </div>

          <div className="import-field-group">
            <label className="import-field-label">
              2. Bộ môn phụ trách
            </label>
            <select
              className="import-field-select"
              value={selectedBoMon}
              onChange={(e) => setSelectedBoMon(e.target.value)}
              disabled={parsing || saving}
            >
              {boMonList.map(bm => (
                <option key={bm.MaBoMon} value={bm.MaBoMon}>
                  {bm.TenBoMon} ({bm.MaBoMon})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dropzone Upload File */}
        <div
          className={`import-dropzone ${isDragging ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div className="import-dropzone-icon">
            <UploadCloud size={28} />
          </div>
          <div className="import-dropzone-text">
            <h4>Kéo thả file Excel Thời khóa biểu vào đây hoặc bấm để chọn tệp</h4>
            <p>Hỗ trợ định dạng .xlsx, .xls xuất từ cổng đào tạo UTC (chứa các cột Stt, Mã học phần, Lớp tín chỉ, Thứ, Tiết, Phòng...)</p>
          </div>
        </div>

        {/* Selected File Banner */}
        {file && (
          <div className="import-file-selected">
            <div className="import-file-info">
              <FileSpreadsheet size={20} style={{ color: '#059669' }} />
              <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button
              className="btn-primary-save-import"
              onClick={handleParseFile}
              disabled={parsing}
              style={{ height: '36px', padding: '0 16px', fontSize: '0.85rem' }}
            >
              {parsing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              <span>{parsing ? 'Đang phân tích...' : 'Phân tích file Excel'}</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {parseError && (
          <div className="alert-banner error" style={{ marginTop: '16px' }}>
            <AlertCircle size={18} />
            <span>{parseError}</span>
          </div>
        )}
      </div>

      {/* SUCCESS BANNER AFTER SAVING */}
      {saveSuccess && (
        <div className="alert-banner success" style={{ marginBottom: '24px', padding: '16px 20px' }}>
          <CheckCircle2 size={22} />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>Import Thời khóa biểu thành công!</h4>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>{saveSuccess.message}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {onNavigateTab && (
              <>
                <button
                  className="btn-primary-save-import"
                  style={{ height: '36px', padding: '0 14px', fontSize: '0.82rem', background: '#059669' }}
                  onClick={() => onNavigateTab('thoikhoabieu')}
                >
                  <span>Xem Ma trận TKB</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  className="btn-secondary-cancel"
                  style={{ height: '36px', padding: '0 14px', fontSize: '0.82rem' }}
                  onClick={() => onNavigateTab('lophocphan')}
                >
                  Xem Lớp học phần
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Save Error */}
      {saveError && (
        <div className="alert-banner error" style={{ marginBottom: '24px' }}>
          <AlertCircle size={18} />
          <span>{saveError}</span>
        </div>
      )}

      {/* PREVIEW SECTION (WHEN CLASSES PARSED) */}
      {classesList.length > 0 && (
        <>
          {/* KPI Summary Cards */}
          <div className="import-kpi-grid">
            <div className="import-kpi-card">
              <div className="import-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Layers size={22} />
              </div>
              <div className="import-kpi-info">
                <div className="kpi-num">{kpiStats.totalClasses}</div>
                <div className="kpi-label">Tổng số Lớp học phần</div>
              </div>
            </div>

            <div className="import-kpi-card">
              <div className="import-kpi-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <Clock size={22} />
              </div>
              <div className="import-kpi-info">
                <div className="kpi-num">{kpiStats.totalSchedules}</div>
                <div className="kpi-label">Tổng khung Thời khóa biểu</div>
              </div>
            </div>

            <div className="import-kpi-card">
              <div className="import-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                <CheckCircle2 size={22} />
              </div>
              <div className="import-kpi-info">
                <div className="kpi-num" style={{ color: '#059669' }}>{kpiStats.validCount}</div>
                <div className="kpi-label">Lớp hợp lệ (Sẵn sàng lưu)</div>
              </div>
            </div>

            <div className="import-kpi-card">
              <div className="import-kpi-icon" style={{ background: '#fff1f2', color: '#e11d48' }}>
                <AlertTriangle size={22} />
              </div>
              <div className="import-kpi-info">
                <div className="kpi-num" style={{ color: '#e11d48' }}>{kpiStats.errorCount}</div>
                <div className="kpi-label">Lớp có cảnh báo / lỗi</div>
              </div>
            </div>
          </div>

          {/* Auto-create Master Data Banner */}
          {previewData?.autoCreateSummary && (
            (previewData.autoCreateSummary.monHoc?.length > 0 ||
              previewData.autoCreateSummary.phongHoc?.length > 0 ||
              previewData.autoCreateSummary.toaNha?.length > 0 ||
              previewData.autoCreateSummary.khoaSinhVien?.length > 0) && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '16px',
                fontSize: '0.84rem',
                color: '#166534'
              }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <CheckCircle2 size={16} color="#16a34a" />
                  <span>Hệ thống sẽ tự động thêm mới dữ liệu nền chưa có trong CSDL khi bạn bấm Lưu:</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '24px' }}>
                  {previewData.autoCreateSummary.monHoc?.map(m => (
                    <span key={m.MaMonHoc} style={{ background: '#dcfce7', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                      + Môn: {m.MaMonHoc} - {m.TenMonHoc} ({m.SoTinChi} TC)
                    </span>
                  ))}
                  {previewData.autoCreateSummary.toaNha?.map(t => (
                    <span key={t.MaToaNha} style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                      + Tòa: {t.TenToaNha} ({t.MaToaNha})
                    </span>
                  ))}
                  {previewData.autoCreateSummary.phongHoc?.map(p => (
                    <span key={p.MaPhong} style={{ background: '#ede9fe', border: '1px solid #ddd6fe', color: '#6d28d9', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                      + Phòng: {p.TenPhong} ({p.MaPhong})
                    </span>
                  ))}
                  {previewData.autoCreateSummary.khoaSinhVien?.map(k => (
                    <span key={k.MaKhoaSinhVien} style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                      + Khóa: {k.MaKhoaSinhVien}
                    </span>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Top Action Bar (Nút Hủy & Lưu đặt ngay phía trên) */}
          <div className="import-top-action-bar">
            <button
              className="btn-secondary-cancel"
              onClick={() => {
                setClassesList([]);
                setFile(null);
                setPreviewData(null);
              }}
              disabled={saving}
            >
              Hủy / Chọn file khác
            </button>

            <button
              className="btn-primary-save-import"
              onClick={handleSaveToDatabase}
              disabled={saving || kpiStats.totalClasses === 0}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              <span>
                {saving
                  ? 'Đang lưu vào CSDL...'
                  : `Lưu ${kpiStats.totalClasses} Lớp & ${kpiStats.totalSchedules} Khung TKB vào hệ thống`}
              </span>
            </button>
          </div>

          {/* Filter Pills & Search */}
          <div className="import-filter-toolbar">
            <div className="import-filter-pills">
              <button
                className={`filter-pill ${filterMode === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterMode('ALL')}
              >
                Tất cả ({kpiStats.totalClasses})
              </button>
              <button
                className={`filter-pill ${filterMode === 'VALID' ? 'active' : ''}`}
                onClick={() => setFilterMode('VALID')}
              >
                Hợp lệ ({kpiStats.validCount})
              </button>
              {kpiStats.errorCount > 0 && (
                <button
                  className={`filter-pill ${filterMode === 'ERROR' ? 'active' : ''}`}
                  onClick={() => setFilterMode('ERROR')}
                  style={{ color: filterMode === 'ERROR' ? '#ffffff' : '#e11d48', borderColor: '#fca5a5' }}
                >
                  Có lỗi / Cần sửa ({kpiStats.errorCount})
                </button>
              )}
            </div>

            <div className="import-search-box">
              <Search size={16} className="import-search-icon" />
              <input
                type="text"
                placeholder="Tìm mã lớp, tên lớp, mã môn, phòng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer' }}
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Table Header Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px minmax(180px, 1.2fr) minmax(200px, 1.5fr) minmax(140px, 1fr) 90px 80px 80px 100px 40px',
            gap: '12px',
            padding: '10px 16px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div style={{ textAlign: 'center' }}>STT</div>
            <div>Mã Lớp Học Phần</div>
            <div>Tên Lớp Môn Tín Chỉ</div>
            <div>Mã Môn Học</div>
            <div>Loại Học</div>
            <div style={{ textAlign: 'center' }}>SV DK</div>
            <div style={{ textAlign: 'center' }}>SV ĐK</div>
            <div style={{ textAlign: 'center' }}>Khóa</div>
            <div style={{ textAlign: 'center' }}>Xóa</div>
          </div>

          {/* List of Classes */}
          <div className="import-classes-list">
            {filteredClasses.map((cls) => (
              <div
                key={cls.tempId}
                className={`import-class-card ${cls.isValid ? 'is-valid' : 'has-error'}`}
              >
                {/* Main Class Row */}
                <div className="import-class-main-row">
                  <div className="import-stt-badge">{cls.stt}</div>

                  <div>
                    <input
                      type="text"
                      className="import-inline-input"
                      value={cls.maLopHocPhan}
                      onChange={(e) => handleUpdateClassField(cls.tempId, 'maLopHocPhan', e.target.value)}
                      title="Mã lớp học phần (khóa chính)"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      className="import-inline-input"
                      value={cls.tenLopHocPhan}
                      onChange={(e) => handleUpdateClassField(cls.tempId, 'tenLopHocPhan', e.target.value)}
                      title={cls.tenLopHocPhan}
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      className={`import-inline-input ${!cls.tenMonHoc || cls.tenMonHoc === 'Chưa xác định' ? 'error' : ''}`}
                      value={cls.maMonHoc}
                      onChange={(e) => handleUpdateClassField(cls.tempId, 'maMonHoc', e.target.value)}
                      title={`Tên môn: ${cls.tenMonHoc} (${cls.soTinChi || 3} TC)`}
                    />
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cls.tenMonHoc} ({cls.soTinChi || 3} TC)
                      </span>
                      {cls.isNewMonHoc && (
                        <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', flexShrink: 0 }}>
                          + Mới
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <select
                      className="import-inline-input"
                      value={cls.loaiHoc}
                      onChange={(e) => handleUpdateClassField(cls.tempId, 'loaiHoc', e.target.value)}
                    >
                      <option value="LT">LT</option>
                      <option value="BT">BT</option>
                      <option value="TH">TH</option>
                      <option value="BTL">BTL</option>
                    </select>
                  </div>

                  <div>
                    <input
                      type="number"
                      className="import-inline-input"
                      style={{ textAlign: 'center' }}
                      value={cls.siSoDuKien}
                      onChange={(e) => handleUpdateClassField(cls.tempId, 'siSoDuKien', parseInt(e.target.value, 10) || 0)}
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      className="import-inline-input"
                      style={{ textAlign: 'center' }}
                      value={cls.siSoDangKy}
                      onChange={(e) => handleUpdateClassField(cls.tempId, 'siSoDangKy', parseInt(e.target.value, 10) || 0)}
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      className="import-inline-input"
                      style={{ textAlign: 'center' }}
                      value={cls.khoaHoc}
                      onChange={(e) => handleUpdateClassField(cls.tempId, 'khoaHoc', e.target.value)}
                      placeholder="K63"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      className="btn-remove-sub"
                      onClick={() => handleDeleteClass(cls.tempId)}
                      title="Xóa lớp học phần này"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Sub-Schedules List */}
                <div className="import-schedules-sublist">
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    📅 Khung Thời khóa biểu ({cls.schedules.length} đợt học):
                  </div>

                  {cls.schedules.map((sc, scIdx) => (
                    <div key={sc.tempId} className="import-schedule-row">
                      {/* Thứ */}
                      <div>
                        <select
                          className="import-inline-input"
                          value={sc.thuTrongTuan}
                          onChange={(e) => handleUpdateScheduleField(cls.tempId, sc.tempId, 'thuTrongTuan', parseInt(e.target.value, 10))}
                        >
                          {THU_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Ca học / Tiết */}
                      <div>
                        <select
                          className="import-inline-input"
                          value={sc.maTiet}
                          onChange={(e) => handleUpdateScheduleField(cls.tempId, sc.tempId, 'maTiet', parseInt(e.target.value, 10))}
                        >
                          {TIET_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label.split(':')[0]}</option>
                          ))}
                        </select>
                      </div>

                      {/* Phòng học */}
                      <div>
                        <select
                          className="import-inline-input"
                          value={sc.maPhong}
                          onChange={(e) => handleUpdateScheduleField(cls.tempId, sc.tempId, 'maPhong', e.target.value)}
                          style={{
                            fontWeight: sc.maPhong === 'ONLINE' ? 700 : 500,
                            color: sc.maPhong === 'ONLINE' ? '#2563eb' : '#1e293b'
                          }}
                        >
                          <option value="ONLINE">🌐 Phòng trực tuyến (ONLINE)</option>
                          {roomList.filter(r => r.MaPhong !== 'ONLINE').map(r => (
                            <option key={r.MaPhong} value={r.MaPhong}>
                              {r.TenPhong || r.MaPhong}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Khoảng ngày học */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="date"
                          className="import-inline-input"
                          value={sc.ngayBatDau}
                          onChange={(e) => handleUpdateScheduleField(cls.tempId, sc.tempId, 'ngayBatDau', e.target.value)}
                        />
                        <span style={{ color: '#94a3b8' }}>-</span>
                        <input
                          type="date"
                          className="import-inline-input"
                          value={sc.ngayKetThuc}
                          onChange={(e) => handleUpdateScheduleField(cls.tempId, sc.tempId, 'ngayKetThuc', e.target.value)}
                        />
                      </div>

                      {/* Số tuần */}
                      <div>
                        <input
                          type="number"
                          className="import-inline-input"
                          style={{ textAlign: 'center' }}
                          value={sc.soTuan}
                          onChange={(e) => handleUpdateScheduleField(cls.tempId, sc.tempId, 'soTuan', parseInt(e.target.value, 10) || 1)}
                          title="Số tuần học của đợt này"
                        />
                      </div>

                      {/* Xóa khung lịch con */}
                      <div className="import-schedule-actions">
                        <button
                          className="btn-remove-sub"
                          onClick={() => handleDeleteSchedule(cls.tempId, sc.tempId)}
                          title="Xóa khung lịch này"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    className="btn-add-schedule-sub"
                    onClick={() => handleAddSchedule(cls.tempId)}
                  >
                    <Plus size={14} />
                    <span>Thêm khung lịch cho lớp này</span>
                  </button>
                </div>

                {/* Validation Warnings / Errors on Card */}
                {(cls.errors?.length > 0 || cls.warnings?.length > 0) && (
                  <div className="import-card-messages">
                    {cls.errors?.map((err, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626' }}>
                        <AlertCircle size={13} />
                        <span>{err}</span>
                      </div>
                    ))}
                    {cls.warnings?.map((warn, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706' }}>
                        <AlertTriangle size={13} />
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* MODAL THÔNG BÁO LƯU THÀNH CÔNG */}
      {showSuccessModal && savedStats && (
        <div className="import-modal-overlay">
          <div className="import-modal-card">
            <div className="import-modal-icon-wrapper">
              <CheckCircle2 size={44} className="import-modal-icon" />
            </div>

            <h3 className="import-modal-title">Lưu Thời Khóa Biểu Thành Công!</h3>

            <p className="import-modal-desc">
              {savedStats.message || 'Dữ liệu Lớp học phần và các khung Thời khóa biểu đã được lưu trọn vẹn vào hệ thống CSDL.'}
            </p>

            <div className="import-modal-stats-grid">
              <div className="import-modal-stat-box">
                <span className="stat-box-num">{savedStats.soLopDaLuu}</span>
                <span className="stat-box-label">Lớp học phần</span>
              </div>
              <div className="import-modal-stat-box">
                <span className="stat-box-num" style={{ color: '#059669' }}>{savedStats.soLopMoi}</span>
                <span className="stat-box-label">Lớp mới tạo</span>
              </div>
              <div className="import-modal-stat-box">
                <span className="stat-box-num" style={{ color: '#7c3aed' }}>{savedStats.soKhungLichDaLuu}</span>
                <span className="stat-box-label">Khung TKB đã xếp</span>
              </div>
            </div>

            {(savedStats.soMonHocMoi > 0 || savedStats.soPhongHocMoi > 0 || savedStats.soToaNhaMoi > 0 || savedStats.soKhoaMoi > 0) && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '12px',
                fontSize: '0.8rem',
                color: '#15803d',
                fontWeight: 600
              }}>
                Tự động thêm mới dữ liệu nền:
                {savedStats.soMonHocMoi > 0 && ` ${savedStats.soMonHocMoi} Môn học`}
                {savedStats.soToaNhaMoi > 0 && ` • ${savedStats.soToaNhaMoi} Tòa nhà`}
                {savedStats.soPhongHocMoi > 0 && ` • ${savedStats.soPhongHocMoi} Phòng học`}
                {savedStats.soKhoaMoi > 0 && ` • ${savedStats.soKhoaMoi} Khóa SV`}
              </div>
            )}

            <div className="import-modal-countdown">
              <Clock size={15} />
              <span>Tự động chuyển đến <strong>Thời khóa biểu</strong> sau <strong>{countdown}s</strong>...</span>
            </div>

            <div className="import-modal-actions">
              <button
                className="btn-modal-primary"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onNavigateTab) onNavigateTab('thoikhoabieu');
                }}
              >
                <span>Xem Ma trận Thời Khóa Biểu ngay</span>
                <ArrowRight size={16} />
              </button>

              <button
                className="btn-modal-secondary"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onNavigateTab) onNavigateTab('lophocphan');
                }}
              >
                <span>Xem Danh Sách Lớp Học Phần</span>
              </button>

              <button
                className="btn-modal-tertiary"
                onClick={() => {
                  setShowSuccessModal(false);
                  setSavedStats(null);
                }}
              >
                <span>Ở lại / Import thêm file khác</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
