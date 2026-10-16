import { useState } from 'react';
import { X, AlertTriangle, Calendar, Clock, Send, AlertCircle, CheckCircle2, Loader2, Link2 } from 'lucide-react';
import { apiSubmitYeuCauNghi } from '../../../utils/apiBienDongLich';

export default function RequestBaoNghiModal({ isOpen, onClose, classItem, onSuccess }) {
  if (!isOpen || !classItem) return null;

  const [lyDo, setLyDo] = useState('');
  const [minhChungUrl, setMinhChungUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lyDo.trim()) {
      setError('Vui lòng nhập lý do báo nghỉ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiSubmitYeuCauNghi({
        loaiYeuCau: 'ABSENCE',
        maBuoiHoc: classItem.MaBuoiHoc,
        lyDo: lyDo.trim(),
        minhChungUrl: minhChungUrl.trim() || null
      });

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Gửi báo nghỉ thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setLyDo('');
    setMinhChungUrl('');
    setError('');
    onClose();
  };

  return (
    <div className="lgd-modal-overlay" onClick={handleResetAndClose}>
      <div className="lgd-modal-content" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lgd-modal-header" style={{ background: 'linear-gradient(135deg, #d97706 0%, #dc2626 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertTriangle size={20} />
            <h3 className="lgd-modal-title">Báo Nghỉ Giảng Dạy</h3>
          </div>
          <button className="lgd-modal-close" onClick={handleResetAndClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="lgd-modal-body" style={{ padding: '1.5rem' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Gửi Báo Nghỉ Thành Công!</h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Đơn báo nghỉ đã được gửi tới Trưởng Bộ Môn để phê duyệt. Sau khi được duyệt, bạn có thể lập lịch dạy bù cho lớp học phần này.
              </p>
              <button
                type="button"
                onClick={handleResetAndClose}
                style={{
                  marginTop: '1.25rem',
                  padding: '0.6rem 1.8rem',
                  background: '#dc2626',
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
              <div style={{ background: '#fef2f2', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #fecaca', fontSize: '0.84rem' }}>
                <div style={{ fontWeight: 700, color: '#b91c1c', fontSize: '0.925rem' }}>
                  {classItem.TenMonHoc || classItem.TenLopHocPhan}
                </div>
                <div style={{ marginTop: '0.3rem', color: '#64748b', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Mã lớp: <strong>{classItem.MaLopHocPhan}</strong></span>
                  <span>Ngày: <strong>{classItem.NgayHoc ? new Date(classItem.NgayHoc).toLocaleDateString('vi-VN') : '-'}</strong></span>
                  <span>Tiết: <strong>{classItem.TenTiet}</strong></span>
                  <span>Phòng: <strong>{classItem.TenPhong}</strong></span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Lý do xin nghỉ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={lyDo}
                  onChange={e => setLyDo(e.target.value)}
                  placeholder="Nhập lý do cụ thể (công tác, ốm, việc gia đình đột xuất...)"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              {/* Evidence URL */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Link minh chứng (nếu có)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="url"
                    value={minhChungUrl}
                    onChange={e => setMinhChungUrl(e.target.value)}
                    placeholder="https://example.com/giay-cong-tac.pdf"
                    style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                  <Link2 size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
              </div>

              {/* Footer actions */}
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
                  style={{ padding: '0.6rem 1.4rem', background: '#dc2626', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>Gửi đơn báo nghỉ</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
