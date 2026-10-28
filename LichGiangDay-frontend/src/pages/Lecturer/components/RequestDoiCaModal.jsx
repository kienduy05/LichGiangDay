import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, RefreshCw, Calendar, Clock, Building, Send, AlertCircle, CheckCircle2, Loader2, Search, Check } from 'lucide-react';
import { apiSubmitYeuCauNghi, apiGetPhongTrongDayBu } from '../../../utils/apiBienDongLich';

export default function RequestDoiCaModal({ isOpen, onClose, classItem, onSuccess }) {
  if (!isOpen || !classItem) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const siSo = classItem?.SiSoDangKy || classItem?.SiSoDuKien || 0;

  // Form states
  const [ngayDeXuat, setNgayDeXuat] = useState(() => {
    if (classItem?.NgayHoc) {
      const dStr = String(classItem.NgayHoc).slice(0, 10);
      if (dStr >= todayStr) return dStr;
    }
    return todayStr;
  });
  const [maTietDeXuat, setMaTietDeXuat] = useState(String(classItem?.MaTiet || '1'));
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [lyDo, setLyDo] = useState('');

  // Available rooms query states
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [searchRoomText, setSearchRoomText] = useState('');

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Fetch phòng trống khi ngày hoặc ca thay đổi
  const fetchAvailableRooms = useCallback(async (ngay, tiet) => {
    if (!ngay || !tiet) return;
    setLoadingRooms(true);
    setError('');
    setSelectedRoom(null);

    try {
      const rooms = await apiGetPhongTrongDayBu({
        maBuoiHoc: classItem.MaBuoiHoc,
        tuNgay: ngay,
        maTiet: tiet
      });

      // Lọc các phòng đúng ngày và tiết đã chọn
      const filtered = (rooms || []).filter(
        r => r.ngayHoc === ngay && String(r.maTiet) === String(tiet)
      );
      setAvailableRooms(filtered);
      setSelectedBuilding('ALL');
      setSearchRoomText('');

      // Tự động chọn phòng hiện tại nếu nó đang trống, hoặc chọn phòng đầu tiên
      if (filtered.length > 0) {
        const currentRoomMatch = filtered.find(r => r.maPhong === classItem.MaPhong);
        setSelectedRoom(currentRoomMatch || filtered[0]);
      } else {
        setSelectedRoom(null);
      }
    } catch (err) {
      console.warn('Lỗi tải phòng trống:', err);
      setError(err.message || 'Không thể tra cứu phòng trống.');
      setAvailableRooms([]);
      setSelectedRoom(null);
    } finally {
      setLoadingRooms(false);
    }
  }, [classItem.MaBuoiHoc, classItem.MaPhong]);

  // Gọi fetch phòng trống khi mở modal hoặc khi ngày/ca đổi
  useEffect(() => {
    if (isOpen && ngayDeXuat && maTietDeXuat) {
      fetchAvailableRooms(ngayDeXuat, maTietDeXuat);
    }
  }, [isOpen, ngayDeXuat, maTietDeXuat, fetchAvailableRooms]);

  // Gom nhóm danh sách tòa nhà từ availableRooms
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

  // Lọc danh sách phòng theo tòa nhà và từ khóa tìm kiếm
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ngayDeXuat || !maTietDeXuat || !selectedRoom || !lyDo.trim()) {
      setError('Vui lòng chọn ngày, ca học, phòng học khả dụng và nhập lý do đổi ca.');
      return;
    }

    if (ngayDeXuat < todayStr) {
      setError('Ngày đề xuất đổi ca phải từ hôm nay trở đi.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await apiSubmitYeuCauNghi({
        loaiYeuCau: 'SWAP',
        maBuoiHoc: classItem.MaBuoiHoc,
        ngayDeXuat,
        maTietDeXuat: parseInt(maTietDeXuat, 10),
        maPhongDeXuat: selectedRoom.maPhong,
        lyDo: lyDo.trim()
      });

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.status === 409 || err.code === 409 || err.message?.includes('giữ chỗ') || err.message?.includes('chiếm')) {
        setError(err.message || 'Phòng học vừa được chọn hoặc đang có yêu cầu khác chờ duyệt. Danh sách phòng trống đã được cập nhật.');
        fetchAvailableRooms(ngayDeXuat, maTietDeXuat);
      } else {
        setError(err.message || 'Gửi yêu cầu đổi ca thất bại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setLyDo('');
    setError('');
    setSelectedRoom(null);
    onClose();
  };

  return (
    <div className="lgd-modal-overlay" onClick={handleResetAndClose}>
      <div
        className="lgd-modal-content"
        style={{ maxWidth: '780px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="lgd-modal-header" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <RefreshCw size={20} />
            <h3 className="lgd-modal-title">Xin Đổi Ca / Hoán Đổi Lịch Dạy</h3>
          </div>
          <button className="lgd-modal-close" onClick={handleResetAndClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="lgd-modal-body" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '1.75rem 0.5rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Gửi Yêu Cầu Đổi Ca Thành Công!</h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Đề xuất đổi ca đến phòng <strong>{selectedRoom?.tenPhong || selectedRoom?.maPhong}</strong> vào ngày <strong>{new Date(ngayDeXuat).toLocaleDateString('vi-VN')}</strong> đã được gửi đến Trưởng Bộ Môn.
              </p>
              <div style={{ margin: '1rem auto', maxWidth: '480px', padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.8125rem', color: '#166534', textAlign: 'left' }}>
                🔒 <strong>Trạng thái giữ chỗ (Treo phòng):</strong> Phòng học này đã được hệ thống tạm khóa giữ chỗ cho đơn của bạn trong thời gian chờ Trưởng bộ môn phê duyệt, không ai có thể chọn trùng vào ca này.
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                style={{
                  marginTop: '0.75rem',
                  padding: '0.6rem 2rem',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem 1rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <div>{error}</div>
                </div>
              )}

              {/* Class Info Box */}
              <div style={{ background: '#eff6ff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '0.84rem' }}>
                <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.925rem' }}>
                  {classItem.TenMonHoc || classItem.TenLopHocPhan}
                </div>
                <div style={{ marginTop: '0.3rem', color: '#64748b', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <span>Lịch hiện tại: <strong>{classItem.NgayHoc ? new Date(classItem.NgayHoc).toLocaleDateString('vi-VN') : '-'}</strong></span>
                  <span>{classItem.TenTiet}</span>
                  <span>Phòng: <strong>{classItem.TenPhong || classItem.MaPhong}</strong></span>
                  <span>Sĩ số: <strong>{siSo} sinh viên</strong></span>
                </div>
              </div>

              {/* Date & Period Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Ngày đề xuất mới <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={ngayDeXuat}
                    onChange={e => setNgayDeXuat(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                    Từ ngày hôm nay ({new Date().toLocaleDateString('vi-VN')}) trở đi
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Ca / Tiết đề xuất <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={maTietDeXuat}
                    onChange={e => setMaTietDeXuat(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  >
                    <option value="1">Tiết 1 - 3 (07:00 - 09:25) - Sáng</option>
                    <option value="2">Tiết 4 - 6 (09:35 - 12:00) - Sáng</option>
                    <option value="3">Tiết 7 - 9 (13:00 - 15:25) - Chiều</option>
                    <option value="4">Tiết 10 - 12 (15:35 - 18:00) - Chiều</option>
                  </select>
                </div>
              </div>

              {/* CHỌN PHÒNG TRỐNG (TƯƠNG TỰ PHẦN TẠO LỊCH DẠY BÙ) */}
              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building size={16} color="#1d4ed8" />
                      <span>Chọn phòng học khả dụng</span>
                      <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Hệ thống tự động loại bỏ các phòng đã có lịch hoặc đang có đơn khác chờ duyệt
                    </span>
                  </div>

                  {/* Ô tìm kiếm phòng */}
                  {availableRooms.length > 0 && (
                    <div style={{ position: 'relative', width: '200px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        placeholder="Tìm theo tên phòng..."
                        value={searchRoomText}
                        onChange={e => setSearchRoomText(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.4rem 0.6rem 0.4rem 1.85rem',
                          fontSize: '0.8125rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Loading spinner */}
                {loadingRooms ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.4rem auto', color: '#1d4ed8' }} />
                    <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600 }}>Đang kiểm tra danh sách phòng trống từ hệ thống...</p>
                  </div>
                ) : availableRooms.length === 0 ? (
                  <div style={{ padding: '1.25rem', textAlign: 'center', background: '#fffbeb', borderRadius: '8px', color: '#b45309', border: '1px solid #fef3c7' }}>
                    <AlertCircle size={26} style={{ color: '#d97706', margin: '0 auto 0.4rem' }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem' }}>Không tìm thấy phòng trống phù hợp vào ca này!</p>
                    <p style={{ fontSize: '0.78125rem', marginTop: '0.25rem', color: '#92400e' }}>
                      Các phòng đều đã kín lịch, đang có đơn khác chờ duyệt hoặc không đủ sức chứa cho {siSo} sinh viên. Vui lòng chọn ngày hoặc ca khác.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Tabs Lọc theo Tòa nhà */}
                    <div style={{ marginBottom: '0.75rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginRight: '0.25rem' }}>Tòa nhà:</span>
                        <button
                          type="button"
                          onClick={() => setSelectedBuilding('ALL')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.78125rem',
                            fontWeight: 600,
                            border: selectedBuilding === 'ALL' ? '1.5px solid #1d4ed8' : '1px solid #cbd5e1',
                            background: selectedBuilding === 'ALL' ? '#1d4ed8' : '#ffffff',
                            color: selectedBuilding === 'ALL' ? '#ffffff' : '#334155',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>Tất cả</span>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '1px 5px',
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
                              onClick={() => setSelectedBuilding(b.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.78125rem',
                                fontWeight: 600,
                                border: isBuildingActive ? '1.5px solid #1d4ed8' : '1px solid #cbd5e1',
                                background: isBuildingActive ? '#1d4ed8' : '#ffffff',
                                color: isBuildingActive ? '#ffffff' : '#334155',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span>{b.name}</span>
                              <span style={{
                                fontSize: '0.7rem',
                                padding: '1px 5px',
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

                    {/* Lưới các thẻ phòng trống (Room Cards Grid) */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                      gap: '0.65rem',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      padding: '2px'
                    }}>
                      {displayedRooms.map(r => {
                        const isSelected = selectedRoom?.maPhong === r.maPhong;
                        return (
                          <div
                            key={r.maPhong}
                            onClick={() => setSelectedRoom(r)}
                            style={{
                              border: isSelected ? '2px solid #1d4ed8' : '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '0.65rem 0.75rem',
                              background: isSelected ? '#eff6ff' : '#ffffff',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? '0 2px 8px rgba(29, 78, 216, 0.15)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.925rem', color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                                {r.tenPhong || r.maPhong}
                              </span>
                              {isSelected && (
                                <span style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  background: '#1d4ed8',
                                  color: '#ffffff',
                                  padding: '1px 6px',
                                  borderRadius: '10px'
                                }}>
                                  <Check size={11} /> Đã chọn
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span>{r.tenToaNha || `Tòa ${r.maToaNha || ''}`}</span>
                              <span>•</span>
                              <span>Sức chứa: <strong style={{ color: '#0f172a' }}>{r.sucChua}</strong> chỗ</span>
                            </div>

                            <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: '0.6875rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: '#f1f5f9',
                                color: '#475569'
                              }}>
                                {r.loaiPhong || 'Lý thuyết'}
                              </span>
                              {siSo > 0 && r.sucChua >= siSo && (
                                <span style={{
                                  fontSize: '0.6875rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  fontWeight: 600
                                }}>
                                  Đủ chỗ (+{r.sucChua - siSo})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Reason */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Lý do xin đổi ca <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={lyDo}
                  onChange={e => setLyDo(e.target.value)}
                  placeholder="Nhập lý do đổi ca chi tiết..."
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  disabled={submitting}
                  style={{ padding: '0.55rem 1.25rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedRoom || loadingRooms}
                  style={{
                    padding: '0.55rem 1.5rem',
                    background: (!selectedRoom || loadingRooms) ? '#94a3b8' : '#1d4ed8',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: (!selectedRoom || loadingRooms) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>Gửi đơn đổi ca</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
