import { useState, useEffect } from 'react';
import { X, UserCheck, Calendar, Clock, Building, Send, AlertCircle, CheckCircle2, Loader2, Users } from 'lucide-react';
import { apiSubmitYeuCauNghi, apiGetDongNghiepTrong } from '../../../utils/apiBienDongLich';

export default function RequestDayThayModal({ isOpen, onClose, classItem, onSuccess }) {
  if (!isOpen || !classItem) return null;

  const [colleagues, setColleagues] = useState([]);
  const [selectedGv, setSelectedGv] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [loadingColleagues, setLoadingColleagues] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchFreeColleagues = async () => {
      setLoadingColleagues(true);
      setError('');
      try {
        const list = await apiGetDongNghiepTrong(classItem.MaBuoiHoc);
        setColleagues(list || []);
        if (list && list.length > 0) {
          setSelectedGv(list[0].MaGiangVien);
        }
      } catch (err) {
        console.warn('Lỗi tải danh sách đồng nghiệp rảnh:', err);
      } finally {
        setLoadingColleagues(false);
      }
    };

    if (classItem?.MaBuoiHoc) {
      fetchFreeColleagues();
    }
  }, [classItem?.MaBuoiHoc]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGv) {
      setError('Vui lòng chọn giảng viên dạy thay.');
      return;
    }
    if (!lyDo.trim()) {
      setError('Vui lòng nhập lý do nhờ dạy thay.');
      return;
    }

    if (classItem?.NgayHoc) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const parts = String(classItem.NgayHoc).slice(0, 10).split('-').map(Number);
      const sessionDate = new Date(parts[0], parts[1] - 1, parts[2]);
      const diffDays = Math.round((sessionDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      if (diffDays < 3) {
        setError('Theo quy định, buổi học phải trước ít nhất 3 ngày tính từ hôm nay mới được phép nhờ dạy thay.');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      await apiSubmitYeuCauNghi({
        loaiYeuCau: 'SUBSTITUTE',
        maBuoiHoc: classItem.MaBuoiHoc,
        maGiangVienDeXuat: selectedGv,
        lyDo: lyDo.trim()
      });

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Gửi yêu cầu dạy thay thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setLyDo('');
    setError('');
    onClose();
  };

  return (
    <div className="lgd-modal-overlay" onClick={handleResetAndClose}>
      <div className="lgd-modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lgd-modal-header" style={{ background: 'linear-gradient(135deg, #0891b2 0%, #0284c7 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <UserCheck size={20} />
            <h3 className="lgd-modal-title">Nhờ Đồng Nghiệp Dạy Thay</h3>
          </div>
          <button className="lgd-modal-close" onClick={handleResetAndClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="lgd-modal-body" style={{ padding: '1.5rem' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#cffafe', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Gửi Yêu Cầu Dạy Thay Thành Công!</h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Yêu cầu đã được chuyển tới Trưởng Bộ Môn để phê duyệt phân công dạy thay. Giờ giảng sẽ được tính cho giảng viên dạy thay sau khi được duyệt.
              </p>
              <button
                type="button"
                onClick={handleResetAndClose}
                style={{
                  marginTop: '1.25rem',
                  padding: '0.6rem 1.8rem',
                  background: '#0891b2',
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
              <div style={{ background: '#ecfeff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #a5f3fc', fontSize: '0.84rem' }}>
                <div style={{ fontWeight: 700, color: '#0e7490', fontSize: '0.925rem' }}>
                  {classItem.TenMonHoc || classItem.TenLopHocPhan}
                </div>
                <div style={{ marginTop: '0.3rem', color: '#64748b', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Ngày: <strong>{classItem.NgayHoc ? new Date(classItem.NgayHoc).toLocaleDateString('vi-VN') : '-'}</strong></span>
                  <span>{classItem.TenTiet}</span>
                  <span>Phòng: <strong>{classItem.TenPhong}</strong></span>
                </div>
              </div>

              {/* Select Colleague */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Chọn đồng nghiệp dạy thay (Cùng bộ môn, không trùng lịch) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {loadingColleagues ? (
                  <div style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.84rem' }}>
                    <Loader2 size={16} className="animate-spin" /> Đang tìm đồng nghiệp rảnh ca này...
                  </div>
                ) : colleagues.length === 0 ? (
                  <div style={{ padding: '0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#b45309', fontSize: '0.84rem' }}>
                    Không có đồng nghiệp nào cùng bộ môn rảnh ca này. Bạn nên sử dụng hình thức <strong>Báo nghỉ</strong> và sau đó đăng ký <strong>Dạy bù</strong>.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedGv}
                    onChange={e => setSelectedGv(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  >
                    {colleagues.map(c => (
                      <option key={c.MaGiangVien} value={c.MaGiangVien}>
                        {c.HoTen} ({c.MaGiangVien}) - {c.Email || 'Bộ môn'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Reason */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Lý do nhờ dạy thay <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={lyDo}
                  onChange={e => setLyDo(e.target.value)}
                  placeholder="Nhập lý do chi tiết..."
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  disabled={submitting}
                  style={{ padding: '0.6rem 1.2rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || colleagues.length === 0}
                  style={{ padding: '0.6rem 1.4rem', background: '#0891b2', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>Gửi đơn nhờ dạy thay</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
