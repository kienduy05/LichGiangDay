import { useState, useEffect, useMemo } from 'react';
import { X, CalendarPlus, Building, Send, AlertCircle, CheckCircle2, Loader2, ArrowRight, ArrowLeft, Search, Check } from 'lucide-react';
import { apiGetCaNghiChuaDayBu, apiGetPhongTrongDayBu, apiSubmitDangKyDayBu } from '../../../utils/apiBienDongLich';

export default function TaoLichDayBuModal({ isOpen, onClose, defaultClass = null, onSuccess }) {
  // Multi-step: 1 = Chọn ca nghỉ, 2 = Chọn ngày & tiết, 3 = Chọn phòng học, 4 = Thành công
  const [step, setStep] = useState(1);
  const [caNghiList, setCaNghiList] = useState([]);
  const [selectedCaNghi, setSelectedCaNghi] = useState(defaultClass);
  const [loadingCaNghi, setLoadingCaNghi] = useState(false);

  // Step 2 & 3 state
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 3);
  const minDateStr = minDate.toISOString().slice(0, 10);

  const [ngayDayBu, setNgayDayBu] = useState(minDateStr);
  const [maTietDayBu, setMaTietDayBu] = useState('1');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [searchRoomText, setSearchRoomText] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  // Load ca nghỉ chưa bù
  useEffect(() => {
    const fetchCaNghi = async () => {
      setLoadingCaNghi(true);
      try {
        const list = await apiGetCaNghiChuaDayBu({});
        setCaNghiList(list || []);
        if (defaultClass) {
          const match = (list || []).find(c => c.MaBuoiHoc === defaultClass.MaBuoiHoc);
          if (match) setSelectedCaNghi(match);
        } else if (list && list.length > 0) {
          setSelectedCaNghi(list[0]);
        }
      } catch (err) {
        console.warn('Lỗi tải ca nghỉ chưa bù:', err);
      } finally {
        setLoadingCaNghi(false);
      }
    };

    fetchCaNghi();
  }, [defaultClass]);

  // Load phòng trống khi sang step 3
  const handleLoadRooms = async () => {
    if (!ngayDayBu) {
      setError('Vui lòng chọn ngày dạy bù.');
      return;
    }
    if (ngayDayBu < minDateStr) {
      setError('Quy định: Thời gian đăng ký dạy bù phải trước ít nhất 3 ngày tính từ hôm nay để kịp thông báo cho sinh viên.');
      return;
    }

    setError('');
    setLoadingRooms(true);
    setStep(3);

    try {
      const rooms = await apiGetPhongTrongDayBu({
        maBuoiHoc: selectedCaNghi?.MaBuoiHoc,
        tuNgay: ngayDayBu,
        maTiet: maTietDayBu
      });
      // Lọc các phòng đúng ngày đã chọn
      const filtered = (rooms || []).filter(r => r.ngayHoc === ngayDayBu && String(r.maTiet) === String(maTietDayBu));
      setAvailableRooms(filtered);
      setSelectedBuilding('ALL');
      setSearchRoomText('');
      if (filtered.length > 0) {
        setSelectedRoom(filtered[0]);
      } else {
        setSelectedRoom(null);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tìm kiếm phòng trống.');
    } finally {
      setLoadingRooms(false);
    }
  };

  // Group buildings from availableRooms
  const buildingTabs = useMemo(() => {
    const map = new Map();
    availableRooms.forEach(r => {
      const id = r.maToaNha || r.tenToaNha || 'OTHER';
      const name = r.tenToaNha || (r.maToaNha ? `Tòa ${r.maToaNha}` : 'Khác');
      if (!map.has(id)) {
        map.set(id, { id, name, count: 0 });
      }
      map.get(id).count += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [availableRooms]);

  // Filtered rooms by selectedBuilding and search text
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
    if (!selectedRoom) {
      setError('Vui lòng chọn phòng học khả dụng.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await apiSubmitDangKyDayBu({
        maBuoiHoc: selectedCaNghi.MaBuoiHoc,
        ngayDeXuat: ngayDayBu,
        maTiet: parseInt(maTietDayBu, 10),
        maPhong: selectedRoom.maPhong
      });

      setSubmittedData(res);
      setStep(4);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.status === 409 || err.code === 409) {
        setError('Phòng vừa bị chiếm bởi buổi học khác. Danh sách phòng trống đã được cập nhật.');
        handleLoadRooms();
      } else {
        setError(err.message || 'Đăng ký dạy bù thất bại.');
      }
    } finally {
      setSubmitting(false);
    }
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
      <div className="lgd-modal-content" style={{ maxWidth: '750px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lgd-modal-header" style={{ background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CalendarPlus size={22} />
            <div>
              <h3 className="lgd-modal-title">Đăng Ký Lịch Dạy Bù</h3>
              <p style={{ margin: 0, fontSize: '0.78125rem', color: 'rgba(255,255,255,0.85)' }}>
                Quy trình tự động xếp phòng và xác nhận lịch dạy bù theo quy định đào tạo
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
            <div style={{ flex: 1, fontWeight: step === 1 ? 700 : 500, color: step === 1 ? '#059669' : '#64748b' }}>
              1. Chọn ca nghỉ
            </div>
            <div style={{ flex: 1, fontWeight: step === 2 ? 700 : 500, color: step === 2 ? '#059669' : '#64748b' }}>
              2. Chọn ngày & ca
            </div>
            <div style={{ flex: 1, fontWeight: step === 3 ? 700 : 500, color: step === 3 ? '#059669' : '#64748b' }}>
              3. Chọn phòng trống
            </div>
          </div>
        )}

        {/* Body */}
        <div className="lgd-modal-body" style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.84rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {/* STEP 1: CHỌN CA NGHỈ */}
          {step === 1 && (
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#0f172a' }}>
                Bước 1: Chọn buổi học đã báo nghỉ cần dạy bù
              </h4>
              {loadingCaNghi ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  <Loader2 size={24} className="animate-spin" />
                  <p style={{ marginTop: '0.5rem' }}>Đang tải danh sách ca đã nghỉ...</p>
                </div>
              ) : caNghiList.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', color: '#64748b' }}>
                  <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 0.75rem' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Bạn không có ca nghỉ nào đang chờ dạy bù!</p>
                  <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Tất cả các ca nghỉ trước đó đã được tổ chức dạy bù đầy đủ.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {caNghiList.map(ca => {
                    const isSelected = selectedCaNghi?.MaBuoiHoc === ca.MaBuoiHoc;
                    return (
                      <div
                        key={ca.MaBuoiHoc}
                        onClick={() => setSelectedCaNghi(ca)}
                        style={{
                          border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                          background: isSelected ? '#f0fdf4' : '#ffffff',
                          padding: '1rem',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.925rem' }}>
                            {ca.TenMonHoc || ca.TenLopHocPhan}
                          </span>
                          {ca.overdueWarning && (
                            <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                              Quá 14 ngày ({ca.SoNgayDaQua} ngày)
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: '0.4rem', fontSize: '0.8125rem', color: '#64748b', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <span>Mã lớp: <strong>{ca.MaLopHocPhan}</strong></span>
                          <span>Ngày nghỉ: <strong>{ca.NgayHoc ? new Date(ca.NgayHoc).toLocaleDateString('vi-VN') : '-'}</strong></span>
                          <span>Ca: <strong>{ca.TenTiet}</strong></span>
                          <span>Phòng cũ: <strong>{ca.TenPhong}</strong></span>
                        </div>
                        {ca.LyDoNghi && (
                          <div style={{ marginTop: '0.35rem', fontSize: '0.78125rem', color: '#dc2626' }}>
                            Lý do nghỉ: {ca.LyDoNghi}
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
                  disabled={!selectedCaNghi}
                  onClick={() => setStep(2)}
                  style={{
                    padding: '0.65rem 1.4rem',
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: selectedCaNghi ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <span>Tiếp tục chọn ngày</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHỌN NGÀY VÀ TIẾT */}
          {step === 2 && (
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#0f172a' }}>
                Bước 2: Chọn ngày và ca học dự kiến dạy bù
              </h4>

              <div style={{ background: '#f0fdf4', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '0.8125rem', color: '#065f46', marginBottom: '1.25rem' }}>
                💡 <strong>Quy định đào tạo:</strong> Buổi dạy bù phải được đăng ký trước <strong>ít nhất 3 ngày</strong> tính từ ngày hiện tại để bảo đảm thời gian phát thông báo đến sinh viên.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Ngày dạy bù <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={minDateStr}
                    value={ngayDayBu}
                    onChange={e => setNgayDayBu(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                    Sớm nhất từ ngày: {minDate.toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Ca / Tiết dạy bù <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={maTietDayBu}
                    onChange={e => setMaTietDayBu(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  >
                    <option value="1">Tiết 1 - 3 (07:00 - 09:25) - Sáng</option>
                    <option value="2">Tiết 4 - 6 (09:35 - 12:00) - Sáng</option>
                    <option value="3">Tiết 7 - 9 (13:00 - 15:25) - Chiều</option>
                    <option value="4">Tiết 10 - 12 (15:35 - 18:00) - Chiều</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ padding: '0.65rem 1.2rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <ArrowLeft size={16} /> Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleLoadRooms}
                  style={{ padding: '0.65rem 1.4rem', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <span>Tìm phòng trống trong 7 ngày</span>
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
                    Bước 3: Chọn phòng học khả dụng
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78125rem', color: '#64748b' }}>
                    Ngày: <strong>{new Date(ngayDayBu).toLocaleDateString('vi-VN')}</strong> • {availableRooms[0]?.tenTiet || 'Tiết ' + maTietDayBu} • Sĩ số: <strong>{selectedCaNghi?.SiSoDangKy || selectedCaNghi?.SiSoDuKien || 50} SV</strong>
                  </p>
                </div>
                {/* Search room filter */}
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

              {loadingRooms ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                  <Loader2 size={26} className="animate-spin" style={{ margin: '0 auto 0.5rem auto', color: '#059669' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Đang tra cứu danh sách phòng trống từ hệ thống...</p>
                </div>
              ) : availableRooms.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#fffbeb', borderRadius: '10px', color: '#b45309' }}>
                  <AlertCircle size={32} style={{ color: '#d97706', margin: '0 auto 0.75rem' }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>Không tìm thấy phòng trống phù hợp vào ca này!</p>
                  <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Các phòng đều đã kín lịch hoặc không đủ sức chứa. Vui lòng quay lại đổi ngày hoặc ca khác.</p>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{ marginTop: '1rem', padding: '0.5rem 1.2rem', background: '#d97706', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Chọn lại ngày / ca khác
                  </button>
                </div>
              ) : (
                <>
                  {/* BƯỚC CHỌN TÒA NHÀ TRƯỚC */}
                  <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building size={15} style={{ color: '#059669' }} />
                      <span>Chọn tòa nhà trước ({buildingTabs.length} tòa có phòng trống):</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedBuilding('ALL')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.42rem 0.8rem',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          border: selectedBuilding === 'ALL' ? '1.5px solid #059669' : '1px solid #cbd5e1',
                          background: selectedBuilding === 'ALL' ? '#059669' : '#ffffff',
                          color: selectedBuilding === 'ALL' ? '#ffffff' : '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>Tất cả tòa nhà</span>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          background: selectedBuilding === 'ALL' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                          color: selectedBuilding === 'ALL' ? '#ffffff' : '#475569'
                        }}>
                          {availableRooms.length}
                        </span>
                      </button>

                      {buildingTabs.map(b => {
                        const isBuildingActive = selectedBuilding === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setSelectedBuilding(b.id);
                              // Tự động chuyển phòng được chọn sang phòng đầu tiên của tòa này nếu phòng hiện tại không thuộc tòa này
                              const firstOfB = availableRooms.find(r => (r.maToaNha && r.maToaNha === b.id) || (r.tenToaNha && r.tenToaNha === b.id));
                              if (firstOfB && selectedRoom?.maToaNha !== b.id) {
                                setSelectedRoom(firstOfB);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.42rem 0.8rem',
                              borderRadius: '6px',
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              border: isBuildingActive ? '1.5px solid #059669' : '1px solid #cbd5e1',
                              background: isBuildingActive ? '#059669' : '#ffffff',
                              color: isBuildingActive ? '#ffffff' : '#334155',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{b.name}</span>
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              background: isBuildingActive ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                              color: isBuildingActive ? '#ffffff' : '#475569'
                            }}>
                              {b.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* LƯỚI PHÒNG HỌC CỦA TÒA NHÀ ĐÃ CHỌN */}
                  {displayedRooms.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.85rem' }}>
                      Không có phòng trống nào thuộc tòa nhà này phù hợp với từ khóa tìm kiếm.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                      {displayedRooms.map(r => {
                        const isSelected = selectedRoom?.maPhong === r.maPhong;
                        return (
                          <div
                            key={r.maPhong}
                            onClick={() => setSelectedRoom(r)}
                            style={{
                              border: isSelected ? '2px solid #059669' : '1px solid #cbd5e1',
                              background: isSelected ? '#f0fdf4' : '#ffffff',
                              padding: '0.8rem 0.95rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              position: 'relative',
                              boxShadow: isSelected ? '0 2px 6px rgba(5,150,105,0.15)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                                {r.tenPhong || r.maPhong}
                              </div>
                              {isSelected ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: '#059669', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                  <Check size={12} /> Đã chọn
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, background: '#f0fdf4', padding: '2px 5px', borderRadius: '4px' }}>
                                  Khả dụng
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78125rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Building size={13} style={{ color: '#94a3b8' }} />
                              <span>Toà nhà: <strong>{r.tenToaNha || 'Khu A3'}</strong></span>
                            </div>
                            <div style={{ fontSize: '0.78125rem', color: '#059669', fontWeight: 600, marginTop: '0.2rem' }}>
                              Sức chứa: {r.sucChua} chỗ ({r.loaiPhong || 'Phòng lý thuyết'})
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* THANH THÔNG BÁO PHÒNG ĐÃ CHỌN */}
                  {selectedRoom && (
                    <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0', fontSize: '0.8125rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
                      <span>
                        Phòng đã chọn: <strong>{selectedRoom.tenPhong || selectedRoom.maPhong}</strong> ({selectedRoom.tenToaNha || 'Tòa nhà'}) • Sức chứa: <strong>{selectedRoom.sucChua} chỗ</strong>
                      </span>
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
                  disabled={!selectedRoom || submitting}
                  onClick={handleConfirmSubmit}
                  style={{ padding: '0.65rem 1.4rem', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: selectedRoom && !submitting ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>Xác nhận đăng ký dạy bù</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: THÀNH CÔNG */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <CheckCircle2 size={36} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Đăng Ký Dạy Bù Thành Công!</h4>
              <p style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.6rem', lineHeight: 1.6 }}>
                Hệ thống đã tự động xác nhận lịch dạy bù và xếp phòng học <strong>{selectedRoom?.tenPhong || selectedRoom?.maPhong}</strong> vào ngày <strong>{new Date(ngayDayBu).toLocaleDateString('vi-VN')}</strong>.
              </p>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', margin: '1rem 0', fontSize: '0.84rem', textAlign: 'left' }}>
                <div>Mã đăng ký: <strong>{submittedData?.maDangKyDayBu}</strong></div>
                <div>Lớp học phần: <strong>{selectedCaNghi?.TenMonHoc || selectedCaNghi?.TenLopHocPhan}</strong></div>
                <div>Phòng học: <strong>{selectedRoom?.tenPhong}</strong></div>
                <div>Thời gian: <strong>{new Date(ngayDayBu).toLocaleDateString('vi-VN')} ({selectedRoom?.tenTiet || 'Tiết ' + maTietDayBu})</strong></div>
                <div>Trạng thái: <span style={{ color: '#16a34a', fontWeight: 700 }}>Đã xác nhận (Confirmed)</span></div>
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                style={{ padding: '0.65rem 2rem', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Hoàn tất & Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
