import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X, FlaskConical, Building, Send, AlertCircle, CheckCircle2,
  Loader2, ArrowRight, ArrowLeft, Search, Check, Calendar, Clock
} from 'lucide-react';
import {
  apiGetLopThucHanhCanDangKy,
  apiGetPhongTrongThucHanh,
  apiSubmitDangKyThucHanh
} from '../../../utils/apiBienDongLich';

export default function DangKyLichThucHanhModal({ isOpen, onClose, defaultClassCode = null, onSuccess }) {
  // Multi-step: 1 = Chọn lớp TH, 2 = Chọn ngày & ca, 3 = Chọn phòng trống, 4 = Thành công
  const [step, setStep] = useState(1);
  const [thClasses, setThClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Step 2 & 3 state
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d;
  }, []);
  const minDateStr = useMemo(() => {
    const y = minDate.getFullYear();
    const m = String(minDate.getMonth() + 1).padStart(2, '0');
    const day = String(minDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, [minDate]);

  const [ngayThucHanh, setNgayThucHanh] = useState(minDateStr);
  const [maTiet, setMaTiet] = useState('1');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [lecturerConflict, setLecturerConflict] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [searchRoomText, setSearchRoomText] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  const loadThClasses = useCallback(async (preferredCode = null) => {
    setLoadingClasses(true);
    setError('');
    try {
      const res = await apiGetLopThucHanhCanDangKy();
      const list = res?.classes || [];
      setThClasses(list);

      const codeToPick = preferredCode || defaultClassCode;
      if (codeToPick) {
        const match = list.find(c => c.MaLopHocPhan === codeToPick);
        if (match) {
          setSelectedClass(match);
          return list;
        }
      }
      const firstIncomplete = list.find(c => !c.isCompleted) || list[0] || null;
      setSelectedClass(firstIncomplete);
      return list;
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách lớp thực hành.');
      return [];
    } finally {
      setLoadingClasses(false);
    }
  }, [defaultClassCode]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      setSubmittedData(null);
      setNgayThucHanh(minDateStr);
      loadThClasses();
    }
  }, [isOpen, minDateStr, loadThClasses]);

  const handleLoadRooms = async () => {
    if (!ngayThucHanh) {
      setError('Vui lòng chọn ngày thực hành.');
      return;
    }
    if (ngayThucHanh < minDateStr) {
      setError('Quy định: Thời gian đăng ký lịch thực hành phải trước ít nhất 3 ngày tính từ hôm nay để kịp thông báo cho sinh viên.');
      return;
    }

    setError('');
    setLoadingRooms(true);
    setLecturerConflict(null);
    setStep(3);

    try {
      const res = await apiGetPhongTrongThucHanh({
        maLopHocPhan: selectedClass?.MaLopHocPhan,
        tuNgay: ngayThucHanh,
        maTiet
      });
      const rawRooms = res?.rooms || [];
      setLecturerConflict(res?.lecturerConflict || null);

      const filtered = rawRooms.filter(r => r.ngayHoc === ngayThucHanh && String(r.maTiet) === String(maTiet));
      setAvailableRooms(filtered);
      setSelectedBuilding('ALL');
      setSearchRoomText('');
      setSelectedRoom(filtered.length > 0 ? filtered[0] : null);
    } catch (err) {
      setError(err.message || 'Lỗi khi tìm kiếm phòng trống.');
      setAvailableRooms([]);
      setSelectedRoom(null);
    } finally {
      setLoadingRooms(false);
    }
  };

  const buildingTabs = useMemo(() => {
    const map = new Map();
    availableRooms.forEach(r => {
      const id = r.maToaNha || r.tenToaNha || 'OTHER';
      const name = r.tenToaNha || (r.maToaNha ? `Tòa ${r.maToaNha}` : 'Khác');
      if (!map.has(id)) map.set(id, { id, name, count: 0 });
      map.get(id).count += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [availableRooms]);

  const displayedRooms = useMemo(() => {
    return availableRooms.filter(r => {
      const matchBuilding =
        selectedBuilding === 'ALL' ||
        (r.maToaNha && r.maToaNha === selectedBuilding) ||
        (r.tenToaNha && r.tenToaNha === selectedBuilding);

      const matchSearch =
        !searchRoomText.trim() ||
        (r.tenPhong && r.tenPhong.toLowerCase().includes(searchRoomText.toLowerCase())) ||
        (r.maPhong && r.maPhong.toLowerCase().includes(searchRoomText.toLowerCase()));

      return matchBuilding && matchSearch;
    });
  }, [availableRooms, selectedBuilding, searchRoomText]);

  const handleConfirmSubmit = async () => {
    if (!selectedRoom || !selectedClass) {
      setError('Vui lòng chọn phòng học khả dụng.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await apiSubmitDangKyThucHanh({
        maLopHocPhan: selectedClass.MaLopHocPhan,
        ngayDeXuat: ngayThucHanh,
        maTiet: parseInt(maTiet, 10),
        maPhong: selectedRoom.maPhong
      });

      setSubmittedData(res);
      setStep(4);
      if (onSuccess) onSuccess(res);
    } catch (err) {
      if (err.status === 409) {
        setError('Phòng vừa bị chiếm bởi buổi học khác. Đang cập nhật lại danh sách phòng trống.');
        handleLoadRooms();
      } else {
        setError(err.message || 'Đăng ký lịch thực hành thất bại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueNextSession = async () => {
    const currentCode = selectedClass?.MaLopHocPhan;
    await loadThClasses(currentCode);
    setSubmittedData(null);
    setError('');
    setSelectedRoom(null);
    setStep(2);
  };

  const handleResetAndClose = () => {
    setStep(1);
    setError('');
    setSelectedBuilding('ALL');
    setSearchRoomText('');
    setSubmittedData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="lgd-modal-overlay" onClick={handleResetAndClose}>
      <div className="lgd-modal-content" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lgd-modal-header" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #2563eb 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FlaskConical size={22} />
            <div>
              <h3 className="lgd-modal-title">Đăng Ký Lịch Thực Hành (5 Buổi / Lớp)</h3>
              <p style={{ margin: 0, fontSize: '0.78125rem', color: 'rgba(255,255,255,0.88)' }}>
                Đăng ký từng buổi riêng lẻ (1 buổi = 1 ca 3 tiết) cho các lớp TH đã khóa • Trước ít nhất 3 ngày
              </p>
            </div>
          </div>
          <button className="lgd-modal-close" onClick={handleResetAndClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Multi-step progress bar */}
        {step < 4 && (
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0.75rem 1.5rem', fontSize: '0.8125rem' }}>
            <div style={{ flex: 1, fontWeight: step === 1 ? 700 : 500, color: step === 1 ? '#0d9488' : '#64748b' }}>
              1. Chọn lớp thực hành
            </div>
            <div style={{ flex: 1, fontWeight: step === 2 ? 700 : 500, color: step === 2 ? '#0d9488' : '#64748b' }}>
              2. Chọn ngày & ca (3 tiết)
            </div>
            <div style={{ flex: 1, fontWeight: step === 3 ? 700 : 500, color: step === 3 ? '#0d9488' : '#64748b' }}>
              3. Chọn phòng trống
            </div>
          </div>
        )}

        {/* Body */}
        <div className="lgd-modal-body" style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.84rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: CHỌN LỚP THỰC HÀNH */}
          {step === 1 && (
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#0f172a' }}>
                Bước 1: Chọn lớp học phần Thực hành (đã khóa) để đăng ký buổi học
              </h4>

              {loadingClasses ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
                  <p style={{ marginTop: '0.5rem' }}>Đang tải danh sách lớp thực hành...</p>
                </div>
              ) : thClasses.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', color: '#64748b' }}>
                  <CheckCircle2 size={36} style={{ color: '#0d9488', margin: '0 auto 0.75rem' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Hiện chưa có lớp Thực hành (TH) nào đã khóa cần đăng ký lịch.</p>
                  <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Khi Bộ môn phân công và Phòng Đào Tạo khóa lịch lớp TH, danh sách sẽ tự động xuất hiện tại đây.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                  {thClasses.map(cls => {
                    const isSelected = selectedClass?.MaLopHocPhan === cls.MaLopHocPhan;
                    const completed = cls.isCompleted;
                    const percent = Math.min(100, Math.round((cls.daDangKy / cls.tongCanDangKy) * 100));

                    return (
                      <div
                        key={cls.MaLopHocPhan}
                        onClick={() => !completed && setSelectedClass(cls)}
                        style={{
                          border: isSelected ? '2px solid #0d9488' : '1px solid #e2e8f0',
                          background: completed ? '#f8fafc' : (isSelected ? '#f0fdfa' : '#ffffff'),
                          padding: '0.95rem 1rem',
                          borderRadius: '10px',
                          cursor: completed ? 'default' : 'pointer',
                          opacity: completed ? 0.78 : 1,
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.93rem' }}>
                              {cls.TenLopHocPhan || cls.TenMonHoc}
                            </div>
                            <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '0.9rem', flexWrap: 'wrap' }}>
                              <span>Mã LHP: <strong>{cls.MaLopHocPhan}</strong></span>
                              <span>Sĩ số: <strong>{cls.SiSoDangKy} SV</strong></span>
                              {cls.TenHocKy && <span>Học kỳ: <strong>{cls.TenHocKy}</strong></span>}
                            </div>
                          </div>

                          {completed ? (
                            <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={13} /> Đã đủ 5/5 buổi
                            </span>
                          ) : (
                            <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>
                              Đã xếp {cls.daDangKy}/5 • Còn {cls.conLai} buổi
                            </span>
                          )}
                        </div>

                        {/* Progress bar 5 sessions */}
                        <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: completed ? '#10b981' : '#0d9488', transition: 'width 0.3s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                            {cls.daDangKy}/{cls.tongCanDangKy} buổi
                          </span>
                        </div>

                        {/* Registered sessions summary chips */}
                        {cls.registeredSessions && cls.registeredSessions.length > 0 && (
                          <div style={{ marginTop: '0.55rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {cls.registeredSessions.map((s, idx) => (
                              <span key={s.MaBuoiHoc} style={{
                                fontSize: '0.72rem',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                padding: '2px 7px',
                                borderRadius: '5px',
                                fontWeight: 600
                              }}>
                                B{idx + 1}: {s.NgayHoc ? new Date(s.NgayHoc).toLocaleDateString('vi-VN') : ''} • {s.TenTiet} • {s.TenPhong || s.MaPhong}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  disabled={!selectedClass || selectedClass.isCompleted}
                  onClick={() => setStep(2)}
                  style={{
                    padding: '0.65rem 1.4rem',
                    background: selectedClass && !selectedClass.isCompleted ? '#0d9488' : '#cbd5e1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: selectedClass && !selectedClass.isCompleted ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <span>Tiếp tục đăng ký buổi {(selectedClass?.daDangKy || 0) + 1}/5</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHỌN NGÀY & CA */}
          {step === 2 && selectedClass && (
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#0f172a' }}>
                Bước 2: Chọn ngày và ca học (1 ca = 3 tiết) cho buổi {(selectedClass.daDangKy || 0) + 1}/5
              </h4>

              <div style={{ background: '#f0fdfa', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #99f6e4', fontSize: '0.8125rem', color: '#0f766e', marginBottom: '1rem' }}>
                <div>
                  <strong>Lớp:</strong> {selectedClass.TenLopHocPhan || selectedClass.TenMonHoc} ({selectedClass.MaLopHocPhan}) • <strong>Tiến độ:</strong> {selectedClass.daDangKy}/5 buổi (Còn <strong>{selectedClass.conLai} buổi</strong>)
                </div>
                <div style={{ marginTop: '4px' }}>
                  💡 <strong>Quy định:</strong> Phải đăng ký lịch thực hành trước <strong>ít nhất 3 ngày</strong> tính từ hôm nay để hệ thống thông báo kịp thời tới sinh viên.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Ngày thực hành <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={minDateStr}
                    value={ngayThucHanh}
                    onChange={e => setNgayThucHanh(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                    Sớm nhất từ ngày: {minDate.toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Ca / Tiết (3 tiết / buổi) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={maTiet}
                    onChange={e => setMaTiet(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  >
                    <option value="1">Tiết 1 - 3 (07:00 - 09:25) - Sáng</option>
                    <option value="2">Tiết 4 - 6 (09:35 - 12:00) - Sáng</option>
                    <option value="3">Tiết 7 - 9 (13:00 - 15:25) - Chiều</option>
                    <option value="4">Tiết 10 - 12 (15:35 - 18:00) - Chiều</option>
                    <option value="5">Tiết 13 - 16 (18:00 - 21:30) - Tối</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ padding: '0.65rem 1.2rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <ArrowLeft size={16} /> Chọn lớp khác
                </button>
                <button
                  type="button"
                  onClick={handleLoadRooms}
                  style={{ padding: '0.65rem 1.4rem', background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <span>Tìm phòng trống khả dụng</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CHỌN PHÒNG TRỐNG */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>
                    Bước 3: Chọn phòng học khả dụng (tất cả phòng Ready đủ sức chứa)
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78125rem', color: '#64748b' }}>
                    Ngày: <strong>{new Date(ngayThucHanh).toLocaleDateString('vi-VN')}</strong> • {availableRooms[0]?.tenTiet || 'Ca ' + maTiet} • Sĩ số: <strong>{selectedClass?.SiSoDangKy || 0} SV</strong>
                  </p>
                </div>
                {availableRooms.length > 0 && (
                  <div style={{ position: 'relative', width: '210px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Tìm phòng..."
                      value={searchRoomText}
                      onChange={e => setSearchRoomText(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem 0.45rem 2.1rem',
                        fontSize: '0.8125rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              {lecturerConflict && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={17} style={{ flexShrink: 0 }} />
                  <span><strong>Cảnh báo trùng lịch giảng viên:</strong> {lecturerConflict} Vui lòng chọn ngày hoặc ca khác.</span>
                </div>
              )}

              {loadingRooms ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                  <Loader2 size={26} className="animate-spin" style={{ margin: '0 auto 0.5rem auto', color: '#0d9488' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Đang tra cứu tất cả phòng trống khả dụng...</p>
                </div>
              ) : availableRooms.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#fffbeb', borderRadius: '10px', color: '#b45309' }}>
                  <AlertCircle size={32} style={{ color: '#d97706', margin: '0 auto 0.75rem' }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>Không tìm thấy phòng trống phù hợp vào ca này!</p>
                  <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Các phòng đều đã kín lịch hoặc không đủ sức chứa. Vui lòng đổi ngày hoặc ca khác.</p>
                </div>
              ) : (
                <>
                  {/* Lọc theo Tòa nhà */}
                  <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building size={15} style={{ color: '#0d9488' }} />
                      <span>Chọn tòa nhà ({buildingTabs.length} tòa có phòng trống):</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedBuilding('ALL')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem',
                          borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                          border: selectedBuilding === 'ALL' ? '1.5px solid #0d9488' : '1px solid #cbd5e1',
                          background: selectedBuilding === 'ALL' ? '#0d9488' : '#ffffff',
                          color: selectedBuilding === 'ALL' ? '#ffffff' : '#334155', cursor: 'pointer'
                        }}
                      >
                        <span>Tất cả tòa nhà</span>
                        <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '10px', background: selectedBuilding === 'ALL' ? 'rgba(255,255,255,0.25)' : '#e2e8f0' }}>
                          {availableRooms.length}
                        </span>
                      </button>

                      {buildingTabs.map(b => {
                        const active = selectedBuilding === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setSelectedBuilding(b.id);
                              const firstOfB = availableRooms.find(r => (r.maToaNha && r.maToaNha === b.id) || (r.tenToaNha && r.tenToaNha === b.id));
                              if (firstOfB && selectedRoom?.maToaNha !== b.id) setSelectedRoom(firstOfB);
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem',
                              borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                              border: active ? '1.5px solid #0d9488' : '1px solid #cbd5e1',
                              background: active ? '#0d9488' : '#ffffff',
                              color: active ? '#ffffff' : '#334155', cursor: 'pointer'
                            }}
                          >
                            <span>{b.name}</span>
                            <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '10px', background: active ? 'rgba(255,255,255,0.25)' : '#e2e8f0' }}>
                              {b.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lưới phòng học */}
                  {displayedRooms.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.85rem' }}>
                      Không có phòng trống nào khớp từ khóa tìm kiếm.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                      {displayedRooms.map(r => {
                        const isSelected = selectedRoom?.maPhong === r.maPhong;
                        return (
                          <div
                            key={r.maPhong}
                            onClick={() => setSelectedRoom(r)}
                            style={{
                              border: isSelected ? '2px solid #0d9488' : '1px solid #cbd5e1',
                              background: isSelected ? '#f0fdfa' : '#ffffff',
                              padding: '0.8rem 0.95rem',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                                {r.tenPhong || r.maPhong}
                              </div>
                              {isSelected ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: '#0d9488', background: '#ccfbf1', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                  <Check size={12} /> Đã chọn
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, background: '#f0fdf4', padding: '2px 5px', borderRadius: '4px' }}>
                                  Khả dụng
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Building size={13} color="#94a3b8" />
                              <span>{r.tenToaNha || 'Tòa nhà'}</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#0d9488', fontWeight: 600, marginTop: '0.2rem' }}>
                              Sức chứa: {r.sucChua} chỗ ({r.loaiPhong || 'Phòng lý thuyết'})
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{ padding: '0.65rem 1.2rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <ArrowLeft size={16} /> Đổi ngày / ca
                </button>
                <button
                  type="button"
                  disabled={!selectedRoom || submitting || Boolean(lecturerConflict)}
                  onClick={handleConfirmSubmit}
                  style={{
                    padding: '0.65rem 1.4rem',
                    background: (!selectedRoom || submitting || lecturerConflict) ? '#cbd5e1' : '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: (!selectedRoom || submitting || lecturerConflict) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>Xác nhận đăng ký buổi này</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: THÀNH CÔNG */}
          {step === 4 && submittedData && (
            <div style={{ textAlign: 'center', padding: '1.25rem 0.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <CheckCircle2 size={36} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                Đăng Ký Buổi Thực Hành ({submittedData.daDangKy}/{submittedData.tongCanDangKy}) Thành Công!
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.6rem', lineHeight: 1.6 }}>
                Hệ thống đã tự động sinh buổi học và cập nhật lên thời khóa biểu. Lớp này hiện còn{' '}
                <strong style={{ color: '#0d9488' }}>{submittedData.conLai} buổi</strong> thực hành cần đăng ký.
              </p>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', margin: '1rem 0', fontSize: '0.84rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Mã buổi học: <strong>{submittedData.maBuoiHoc}</strong></div>
                <div>Lớp thực hành: <strong>{submittedData.tenLopHocPhan || submittedData.maLopHocPhan}</strong></div>
                <div>Thời gian: <strong>{new Date(submittedData.ngayDeXuat).toLocaleDateString('vi-VN')} ({selectedRoom?.tenTiet || 'Ca ' + submittedData.maTiet})</strong></div>
                <div>Phòng học: <strong>{selectedRoom?.tenPhong || submittedData.maPhong}</strong></div>
                <div>Tiến độ hiện tại: <strong style={{ color: '#0d9488' }}>{submittedData.daDangKy} / {submittedData.tongCanDangKy} buổi</strong> (Còn lại: <strong>{submittedData.conLai} buổi</strong>)</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {submittedData.conLai > 0 && (
                  <button
                    type="button"
                    onClick={handleContinueNextSession}
                    style={{ padding: '0.65rem 1.4rem', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Calendar size={16} />
                    <span>Đăng ký tiếp buổi tiếp theo (Còn {submittedData.conLai} buổi)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  style={{ padding: '0.65rem 1.75rem', background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Hoàn tất & Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
