import React, { useState, useEffect } from 'react';
import {
  apiGetThoiKhoaBieuByLopHocPhan,
  apiCheckScheduleConflict,
  apiSaveSchedules,
  apiDeleteSchedulesByLopHocPhan
} from '../../../../utils/apiThoiKhoaBieu';
import { apiGetTietHocList } from '../../../../utils/api';
import RoomGridPicker from './RoomGridPicker';
import {
  X, Calendar, Clock, Plus, Trash2, CheckCircle2,
  AlertTriangle, AlertCircle, RefreshCw, Copy, Layers,
  BookOpen, Building2, User, Users
} from 'lucide-react';
import './ThoiKhoaBieuComponents.css';

const THU_OPTIONS = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
  { value: 8, label: 'Chủ nhật' },
];

export default function ThoiKhoaBieuScheduleModal({
  isOpen,
  onClose,
  lopHocPhan,
  onSuccess
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [error, setError] = useState('');
  const [conflictResult, setConflictResult] = useState(null);

  const [tietHocList, setTietHocList] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);

  // Load danh sách Tiết học và Dữ liệu lịch của lớp học phần
  useEffect(() => {
    if (isOpen && lopHocPhan?.MaLopHocPhan) {
      loadInitialData();
    } else {
      setSchedules([]);
      setConflictResult(null);
      setError('');
    }
  }, [isOpen, lopHocPhan]);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    setConflictResult(null);
    try {
      // 1. Tải danh sách Tiết học
      const tietList = await apiGetTietHocList();
      setTietHocList(tietList || []);

      // 2. Tải lịch hiện có của LHP
      const detailData = await apiGetThoiKhoaBieuByLopHocPhan(lopHocPhan.MaLopHocPhan);
      const existingSchedules = detailData?.schedules || [];

      if (existingSchedules.length > 0) {
        setSchedules(existingSchedules.map(s => ({
          maThoiKhoaBieu: s.MaThoiKhoaBieu,
          thuTrongTuan: s.ThuTrongTuan,
          maTiet: s.MaTiet,
          maPhong: s.MaPhong,
          tenPhong: s.TenPhong,
          ngayBatDau: s.NgayBatDau ? s.NgayBatDau.substring(0, 10) : lopHocPhan.NgayBatDau?.substring(0, 10),
          ngayKetThuc: s.NgayKetThuc ? s.NgayKetThuc.substring(0, 10) : lopHocPhan.NgayKetThuc?.substring(0, 10)
        })));
      } else {
        // Mặc định tạo 1 buổi đầu tiên
        setSchedules([{
          thuTrongTuan: 2,
          maTiet: tietList?.[0]?.MaTiet || 1,
          maPhong: '',
          tenPhong: '',
          ngayBatDau: lopHocPhan.NgayBatDau ? lopHocPhan.NgayBatDau.substring(0, 10) : '',
          ngayKetThuc: lopHocPhan.NgayKetThuc ? lopHocPhan.NgayKetThuc.substring(0, 10) : ''
        }]);
      }
      setActiveSessionIndex(0);
    } catch (err) {
      setError(err.message || 'Lỗi tải dữ liệu lịch học.');
    } finally {
      setLoading(false);
    }
  };

  // Thêm 1 buổi học mới trong tuần
  const handleAddSession = () => {
    const defaultTiet = tietHocList?.[0]?.MaTiet || 1;
    // Gợi ý thứ tiếp theo chưa dùng
    const usedDays = schedules.map(s => s.thuTrongTuan);
    const nextDay = [2, 3, 4, 5, 6, 7, 8].find(d => !usedDays.includes(d)) || 2;

    const newSession = {
      thuTrongTuan: nextDay,
      maTiet: defaultTiet,
      maPhong: '',
      tenPhong: '',
      ngayBatDau: lopHocPhan.NgayBatDau ? lopHocPhan.NgayBatDau.substring(0, 10) : '',
      ngayKetThuc: lopHocPhan.NgayKetThuc ? lopHocPhan.NgayKetThuc.substring(0, 10) : ''
    };

    const newSchedules = [...schedules, newSession];
    setSchedules(newSchedules);
    setActiveSessionIndex(newSchedules.length - 1);
    setConflictResult(null);
  };

  // Xóa 1 buổi học
  const handleRemoveSession = (index, e) => {
    e.stopPropagation();
    if (schedules.length === 1) {
      alert('Lớp học phần cần có ít nhất 1 buổi học, hoặc bạn có thể dùng nút "Xóa toàn bộ lịch" bên dưới.');
      return;
    }
    const newSchedules = schedules.filter((_, i) => i !== index);
    setSchedules(newSchedules);
    setActiveSessionIndex(Math.max(0, index - 1));
    setConflictResult(null);
  };

  // Cập nhật thông tin cho buổi đang chọn
  const handleUpdateCurrentSession = (field, value) => {
    const updated = [...schedules];
    updated[activeSessionIndex] = {
      ...updated[activeSessionIndex],
      [field]: value
    };
    setSchedules(updated);
    setConflictResult(null);
  };

  // Chọn phòng từ RoomGridPicker
  const handleSelectRoom = (maPhong, roomObj) => {
    const updated = [...schedules];
    updated[activeSessionIndex] = {
      ...updated[activeSessionIndex],
      maPhong,
      tenPhong: roomObj.TenPhong
    };
    setSchedules(updated);
    setConflictResult(null);
  };

  // Nút tiện ích: Áp dụng nhanh cấu hình Tiết & Phòng sang các Thứ khác (VD: 2, 4, 6 hoặc 3, 5)
  const handleQuickApplyDays = (daysArray) => {
    const current = schedules[activeSessionIndex];
    if (!current) return;

    const newSchedules = daysArray.map(day => ({
      thuTrongTuan: day,
      maTiet: current.maTiet,
      maPhong: current.maPhong,
      tenPhong: current.tenPhong,
      ngayBatDau: current.ngayBatDau,
      ngayKetThuc: current.ngayKetThuc
    }));

    setSchedules(newSchedules);
    setActiveSessionIndex(0);
    setConflictResult(null);
  };

  // Kiểm tra xung đột
  const handleCheckConflict = async () => {
    setCheckingConflict(true);
    setError('');
    try {
      const result = await apiCheckScheduleConflict({
        maLopHocPhan: lopHocPhan.MaLopHocPhan,
        schedules
      });
      setConflictResult(result);
    } catch (err) {
      setError(err.message || 'Lỗi khi kiểm tra xung đột.');
    } finally {
      setCheckingConflict(false);
    }
  };

  // Lưu Thời khóa biểu
  const handleSave = async () => {
    // Validate trước khi submit
    for (let i = 0; i < schedules.length; i++) {
      const s = schedules[i];
      if (!s.maPhong || !s.maPhong.trim()) {
        setError(`Buổi ${i + 1} (Thứ ${s.thuTrongTuan}): Vui lòng chọn Phòng học trước khi lưu.`);
        setActiveSessionIndex(i);
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      await apiSaveSchedules({
        maLopHocPhan: lopHocPhan.MaLopHocPhan,
        schedules
      });

      if (onSuccess) {
        onSuccess('Lưu thời khóa biểu thành công!');
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Lưu thời khóa biểu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  // Xóa toàn bộ lịch
  const handleDeleteAll = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ lịch thời khóa biểu của lớp '${lopHocPhan.MaLopHocPhan}'?`)) {
      return;
    }

    setDeleting(true);
    setError('');
    try {
      await apiDeleteSchedulesByLopHocPhan(lopHocPhan.MaLopHocPhan);
      if (onSuccess) {
        onSuccess('Đã xóa toàn bộ lịch thời khóa biểu của lớp học phần.');
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Xóa lịch thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !lopHocPhan) return null;

  const currentSession = schedules[activeSessionIndex] || {};

  return (
    <div className="tkb-modal-overlay">
      <div className="tkb-modal-container">
        
        {/* MODAL HEADER */}
        <div className="tkb-modal-header">
          <div className="tkb-modal-title-group">
            <div className="tkb-modal-icon-badge">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="tkb-modal-title">Xếp Thời Khóa Biểu Lớp Học Phần</h3>
              <span className="tkb-modal-subtitle">
                {lopHocPhan.TenLopHocPhan || lopHocPhan.TenMonHoc} • <code>{lopHocPhan.MaLopHocPhan}</code>
              </span>
            </div>
          </div>
          <button className="tkb-modal-btn-close" onClick={onClose} disabled={saving || deleting}>
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="tkb-modal-body">
          
          {/* 1. THÔNG TIN LỚP HỌC PHẦN */}
          <div className="lhp-info-banner">
            <div className="info-badge-item">
              <BookOpen size={14} className="info-icon" />
              <span>Môn học: <strong>{lopHocPhan.TenMonHoc}</strong> ({lopHocPhan.SoTinChi || 3} TC)</span>
            </div>
            <div className="info-badge-item">
              <Layers size={14} className="info-icon" />
              <span>Loại học: <span className="tag-loai-hoc">{lopHocPhan.LoaiHoc || 'LT'}</span></span>
            </div>
            <div className="info-badge-item">
              <Users size={14} className="info-icon" />
              <span>Sĩ số: <strong>{lopHocPhan.SiSoDuKien || 50} SV</strong> {lopHocPhan.SiSoDangKy ? `(${lopHocPhan.SiSoDangKy} đk)` : ''}</span>
            </div>
            <div className="info-badge-item">
              <Calendar size={14} className="info-icon" />
              <span>Giai đoạn: <strong>{lopHocPhan.NgayBatDau ? String(lopHocPhan.NgayBatDau).substring(0, 10) : '—'}</strong> → <strong>{lopHocPhan.NgayKetThuc ? String(lopHocPhan.NgayKetThuc).substring(0, 10) : '—'}</strong> ({lopHocPhan.SoTuan || 15} tuần)</span>
            </div>
            <div className="info-badge-item">
              <User size={14} className="info-icon" />
              <span>Giảng viên: <em>{lopHocPhan.TenGiangVien || 'Chưa phân công'}</em></span>
            </div>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="tkb-alert-box error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* CONFLICT RESULT ALERT */}
          {conflictResult && (
            <div className={`tkb-alert-box ${conflictResult.hasConflict ? 'warning' : 'success'}`}>
              {conflictResult.hasConflict ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <div className="conflict-detail-list">
                <strong>{conflictResult.hasConflict ? 'Phát hiện xung đột lịch học:' : 'Lịch học hợp lệ, không có xung đột!'}</strong>
                {conflictResult.conflicts?.map((c, i) => (
                  <div key={i} className="conflict-item-text">• {c.message}</div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="tkb-loading-spinner">
              <RefreshCw size={28} className="spinning" />
              <span>Đang tải thông tin thời khóa biểu...</span>
            </div>
          ) : (
            <div className="schedule-builder-layout">
              
              {/* SESSIONS TAB BAR (Thứ trong tuần) */}
              <div className="sessions-tabs-header">
                <div className="sessions-tabs-list">
                  {schedules.map((s, idx) => {
                    const thuLabel = THU_OPTIONS.find(t => t.value === s.thuTrongTuan)?.label || `Thứ ${s.thuTrongTuan}`;
                    const tietLabel = tietHocList.find(t => t.MaTiet === s.maTiet)?.TenTiet || `Tiết ${s.maTiet}`;
                    const isActive = activeSessionIndex === idx;

                    return (
                      <div
                        key={idx}
                        className={`session-tab-card ${isActive ? 'active' : ''} ${s.maPhong ? 'has-room' : 'missing-room'}`}
                        onClick={() => setActiveSessionIndex(idx)}
                      >
                        <div className="session-tab-title">
                          <span className="session-number">Buổi {idx + 1}:</span>
                          <span className="session-thu">{thuLabel}</span>
                        </div>
                        <div className="session-tab-sub">
                          <span>{tietLabel}</span>
                          <span className="session-room-tag">
                            {s.tenPhong || s.maPhong || 'Chưa chọn phòng'}
                          </span>
                        </div>
                        {schedules.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-session"
                            title="Xóa buổi này"
                            onClick={(e) => handleRemoveSession(idx, e)}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    className="btn-add-session"
                    onClick={handleAddSession}
                  >
                    <Plus size={16} />
                    <span>Thêm buổi học</span>
                  </button>
                </div>

                {/* Quick Apply Preset Buttons */}
                <div className="quick-apply-group">
                  <span className="quick-apply-label"><Copy size={12} /> Mẫu nhanh:</span>
                  <button
                    type="button"
                    className="btn-quick-preset"
                    onClick={() => handleQuickApplyDays([2, 4, 6])}
                    title="Xếp 3 buổi vào Thứ 2, Thứ 4, Thứ 6"
                  >
                    Thứ 2, 4, 6
                  </button>
                  <button
                    type="button"
                    className="btn-quick-preset"
                    onClick={() => handleQuickApplyDays([3, 5])}
                    title="Xếp 2 buổi vào Thứ 3, Thứ 5"
                  >
                    Thứ 3, 5
                  </button>
                </div>
              </div>

              {/* ACTIVE SESSION CONFIGURATION */}
              {currentSession && (
                <div className="active-session-panel">
                  
                  {/* Row 1: Chọn Thứ & Tiết */}
                  <div className="session-config-row">
                    <div className="config-form-group">
                      <label><Calendar size={14} /> Thứ trong tuần:</label>
                      <select
                        className="form-select-custom"
                        value={currentSession.thuTrongTuan || 2}
                        onChange={(e) => handleUpdateCurrentSession('thuTrongTuan', parseInt(e.target.value, 10))}
                      >
                        {THU_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="config-form-group">
                      <label><Clock size={14} /> Tiết học / Khung ca học:</label>
                      <select
                        className="form-select-custom"
                        value={currentSession.maTiet || 1}
                        onChange={(e) => handleUpdateCurrentSession('maTiet', parseInt(e.target.value, 10))}
                      >
                        {tietHocList.map(th => (
                          <option key={th.MaTiet} value={th.MaTiet}>
                            {th.TenTiet} ({th.GioBatDau?.substring(0, 5)} - {th.GioKetThuc?.substring(0, 5)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="config-form-group selected-room-display">
                      <label><Building2 size={14} /> Phòng học đã chọn:</label>
                      <div className={`selected-room-badge ${currentSession.maPhong ? 'active' : 'empty'}`}>
                        {currentSession.tenPhong || currentSession.maPhong ? (
                          <>
                            <CheckCircle2 size={16} className="text-success" />
                            <strong>{currentSession.tenPhong || currentSession.maPhong}</strong>
                          </>
                        ) : (
                          <span className="text-muted">👉 Hãy chọn phòng từ lưới bên dưới</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: LƯỚI CHỌN PHÒNG HỌC TRỰC QUAN (RoomGridPicker) */}
                  <div className="room-picker-section">
                    <div className="room-picker-title">
                      <span>Lưới Phòng Học Khả Dụng (Thứ {currentSession.thuTrongTuan} - Tiết {currentSession.maTiet})</span>
                      <span className="room-picker-hint">💡 Các phòng trống hiển thị sáng rõ; phòng đã có lịch hoặc bảo trì sẽ bị làm mờ.</span>
                    </div>

                    <RoomGridPicker
                      thuTrongTuan={currentSession.thuTrongTuan}
                      maTiet={currentSession.maTiet}
                      ngayBatDau={currentSession.ngayBatDau || lopHocPhan.NgayBatDau}
                      ngayKetThuc={currentSession.ngayKetThuc || lopHocPhan.NgayKetThuc}
                      excludeMaLopHocPhan={lopHocPhan.MaLopHocPhan}
                      selectedMaPhong={currentSession.maPhong}
                      onSelectRoom={handleSelectRoom}
                      siSoDuKien={lopHocPhan.SiSoDuKien || 0}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="tkb-modal-footer">
          <div className="footer-left-actions">
            {schedules.some(s => s.maThoiKhoaBieu) && (
              <button
                type="button"
                className="btn-delete-all-schedules"
                onClick={handleDeleteAll}
                disabled={saving || deleting}
              >
                <Trash2 size={15} />
                <span>{deleting ? 'Đang xóa...' : 'Xóa toàn bộ lịch'}</span>
              </button>
            )}

            <button
              type="button"
              className="btn-check-conflict"
              onClick={handleCheckConflict}
              disabled={checkingConflict || saving || schedules.length === 0}
            >
              <RefreshCw size={14} className={checkingConflict ? 'spinning' : ''} />
              <span>Kiểm tra xung đột</span>
            </button>
          </div>

          <div className="footer-right-actions">
            <button
              type="button"
              className="btn-cancel-modal"
              onClick={onClose}
              disabled={saving || deleting}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              className="btn-save-schedules"
              onClick={handleSave}
              disabled={saving || deleting || schedules.length === 0}
            >
              <CheckCircle2 size={16} />
              <span>{saving ? 'Đang lưu thời khóa biểu...' : 'Lưu Thời Khóa Biểu'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
