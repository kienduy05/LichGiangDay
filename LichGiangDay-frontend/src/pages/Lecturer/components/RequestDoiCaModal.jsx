import { useState, useEffect } from 'react';
import { X, RefreshCw, Calendar, Clock, Building, Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { apiSubmitYeuCauNghi } from '../../../utils/apiBienDongLich';
import { apiGetPhongHocList } from '../../../utils/api';

export default function RequestDoiCaModal({ isOpen, onClose, classItem, onSuccess }) {
  if (!isOpen || !classItem) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const siSo = classItem?.SiSoDangKy || 0;
  const [ngayDeXuat, setNgayDeXuat] = useState('');
  const [maTietDeXuat, setMaTietDeXuat] = useState('1');
  const [maPhongDeXuat, setMaPhongDeXuat] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [showSmallRooms, setShowSmallRooms] = useState(false);
  const [phongList, setPhongList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const rooms = await apiGetPhongHocList();
        if (rooms && rooms.length > 0) {
          const readyRooms = rooms.filter(r => r.TrangThai === 'Ready');
          setPhongList(readyRooms);
          // Ưu tiên chọn phòng đủ sức chứa
          const suitableRoom = readyRooms.find(r => (r.SucChua || 0) >= siSo);
          setMaPhongDeXuat(suitableRoom ? suitableRoom.MaPhong : (readyRooms[0]?.MaPhong || ''));
        }
      } catch (err) {
        console.warn('Lỗi tải danh sách phòng:', err);
      }
    };
    fetchRooms();
  }, [siSo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ngayDeXuat || !maTietDeXuat || !maPhongDeXuat || !lyDo.trim()) {
      setError('Vui lòng điền đầy đủ thông tin đề xuất đổi ca.');
      return;
    }

    if (ngayDeXuat < todayStr) {
      setError('Ngày đề xuất đổi ca phải từ hôm nay trở đi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiSubmitYeuCauNghi({
        loaiYeuCau: 'SWAP',
        maBuoiHoc: classItem.MaBuoiHoc,
        ngayDeXuat,
        maTietDeXuat: parseInt(maTietDeXuat, 10),
        maPhongDeXuat,
        lyDo: lyDo.trim()
      });

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Gửi yêu cầu đổi ca thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setNgayDeXuat('');
    setLyDo('');
    setError('');
    onClose();
  };

  return (
    <div className="lgd-modal-overlay" onClick={handleResetAndClose}>
      <div className="lgd-modal-content" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lgd-modal-header" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <RefreshCw size={20} />
            <h3 className="lgd-modal-title">Xin Đổi Ca / Hoán Đổi Lịch Dạy</h3>
          </div>
          <button className="lgd-modal-close" onClick={handleResetAndClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="lgd-modal-body" style={{ padding: '1.5rem' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Gửi Yêu Cầu Đổi Ca Thành Công!</h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Đề xuất đổi ca đã được chuyển đến Trưởng Bộ Môn để xem xét và phê duyệt. Lịch học sẽ tự động được cập nhật sau khi đơn được duyệt.
              </p>
              <button
                type="button"
                onClick={handleResetAndClose}
                style={{
                  marginTop: '1.25rem',
                  padding: '0.6rem 1.8rem',
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
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.84rem' }}>
                  {error}
                </div>
              )}

              {/* Class Info Box */}
              <div style={{ background: '#eff6ff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '0.84rem' }}>
                <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.925rem' }}>
                  {classItem.TenMonHoc || classItem.TenLopHocPhan}
                </div>
                <div style={{ marginTop: '0.3rem', color: '#64748b', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Lịch hiện tại: <strong>{classItem.NgayHoc ? new Date(classItem.NgayHoc).toLocaleDateString('vi-VN') : '-'}</strong></span>
                  <span>{classItem.TenTiet}</span>
                  <span>Phòng: <strong>{classItem.TenPhong}</strong></span>
                </div>
              </div>

              {/* Date & Period */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Ca / Tiết đề xuất <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={maTietDeXuat}
                    onChange={e => setMaTietDeXuat(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  >
                    <option value="1">Tiết 1 - 3 (07:00 - 09:25)</option>
                    <option value="2">Tiết 4 - 6 (09:35 - 12:00)</option>
                    <option value="3">Tiết 7 - 9 (13:00 - 15:25)</option>
                    <option value="4">Tiết 10 - 12 (15:35 - 18:00)</option>
                  </select>
                </div>
              </div>

              {/* Room select */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                    Phòng học đề xuất <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  {siSo > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Lớp: <strong style={{ color: '#0f172a' }}>{siSo} SV</strong>
                      {' · '}
                      <button
                        type="button"
                        onClick={() => setShowSmallRooms(v => !v)}
                        style={{ background: 'none', border: 'none', padding: 0, color: '#3b82f6', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
                      >
                        {showSmallRooms ? 'Ẩn phòng nhỏ' : 'Xem tất cả phòng'}
                      </button>
                    </span>
                  )}
                </div>
                {siSo > 0 && phongList.filter(p => (p.SucChua || 0) >= siSo).length === 0 && (
                  <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '7px', padding: '0.5rem 0.75rem', marginBottom: '0.4rem', fontSize: '0.8rem', color: '#92400e' }}>
                    ⚠️ Không có phòng nào đủ sức chứa cho {siSo} sinh viên. Đang hiển thị toàn bộ phòng.
                  </div>
                )}
                <select
                  required
                  value={maPhongDeXuat}
                  onChange={e => setMaPhongDeXuat(e.target.value)}
                  style={{
                    width: '100%', padding: '0.6rem', borderRadius: '8px', fontSize: '0.875rem',
                    border: `1px solid ${maPhongDeXuat && phongList.find(p => p.MaPhong === maPhongDeXuat && (p.SucChua || 0) < siSo) ? '#f97316' : '#cbd5e1'}`
                  }}
                >
                  {phongList
                    .filter(p => showSmallRooms || siSo === 0 || (p.SucChua || 0) >= siSo)
                    .map(p => {
                      const isSmall = siSo > 0 && (p.SucChua || 0) < siSo;
                      return (
                        <option key={p.MaPhong} value={p.MaPhong} style={{ color: isSmall ? '#ef4444' : undefined }}>
                          {isSmall ? '⚠️ ' : '✓ '}{p.TenPhong || p.MaPhong} ({p.SucChua} chỗ - {p.LoaiPhong})
                        </option>
                      );
                    })
                  }
                </select>
                {maPhongDeXuat && (() => {
                  const selectedP = phongList.find(p => p.MaPhong === maPhongDeXuat);
                  if (selectedP && siSo > 0 && (selectedP.SucChua || 0) < siSo) {
                    return (
                      <p style={{ margin: '0.3rem 0 0', fontSize: '0.77rem', color: '#ea580c' }}>
                        ⚠️ Phòng này chỉ chứa <strong>{selectedP.SucChua}</strong> chỗ, không đủ cho <strong>{siSo}</strong> sinh viên. Yêu cầu sẽ bị từ chối.
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Reason */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Lý do xin đổi ca <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={lyDo}
                  onChange={e => setLyDo(e.target.value)}
                  placeholder="Nhập lý do đổi ca..."
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  disabled={loading}
                  style={{ padding: '0.6rem 1.2rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '0.6rem 1.4rem', background: '#1d4ed8', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
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
