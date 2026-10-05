import { useState } from 'react';
import { X, RefreshCw, Calendar, Clock, Building, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RequestDoiCaModal({ isOpen, onClose, classItem }) {
  if (!isOpen || !classItem) return null;

  const [targetDate, setTargetDate] = useState('');
  const [targetTiet, setTargetTiet] = useState('1');
  const [targetRoom, setTargetRoom] = useState(classItem.TenPhong || '');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setReason('');
    setTargetDate('');
    onClose();
  };

  return (
    <div className="lgd-modal-overlay" onClick={handleResetAndClose}>
      <div className="lgd-modal-content" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lgd-modal-header" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <RefreshCw size={20} />
            <h3 className="lgd-modal-title">Yêu Cầu Xin Đổi Ca / Đổi Lịch Dạy</h3>
          </div>
          <button className="lgd-modal-close" onClick={handleResetAndClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="lgd-modal-body" style={{ padding: '1.5rem' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Gửi Yêu Cầu Thành Công!</h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Yêu cầu xin đổi ca của bạn đã được ghi nhận vào hệ thống và gửi đến Ban Đào tạo / Trưởng Bộ môn để xem xét phê duyệt.
              </p>
              <button
                type="button"
                onClick={handleResetAndClose}
                style={{
                  marginTop: '1.25rem',
                  padding: '0.6rem 1.8rem',
                  background: '#2563eb',
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
              {/* Class Info Box */}
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.925rem' }}>
                  {classItem.TenLopHocPhan || classItem.TenMonHoc}
                </div>
                <div style={{ marginTop: '0.3rem', color: '#64748b', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Mã lớp: <strong>{classItem.MaLopHocPhan}</strong></span>
                  <span>Hiện tại: <strong>Thứ {classItem.ThuTrongTuan}, {classItem.TenTiet}</strong></span>
                  <span>Phòng: <strong>{classItem.TenPhong}</strong></span>
                </div>
              </div>

              {/* Target Shift & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Ngày muốn đổi sang <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Ca / Tiết muốn đổi <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={targetTiet}
                    onChange={e => setTargetTiet(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', background: '#ffffff' }}
                  >
                    <option value="1">Sáng: Tiết 1 - 3 (07:00 - 09:25)</option>
                    <option value="2">Sáng: Tiết 4 - 6 (09:35 - 12:00)</option>
                    <option value="3">Chiều: Tiết 7 - 9 (13:00 - 15:25)</option>
                    <option value="4">Chiều: Tiết 10 - 12 (15:35 - 18:00)</option>
                    <option value="5">Tối: Tiết 13 - 16 (18:00 - 21:30)</option>
                  </select>
                </div>
              </div>

              {/* Room Suggestion */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Phòng học đề xuất (hoặc giữ nguyên)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: P101_A3 hoặc Nhờ PĐT bố trí"
                  value={targetRoom}
                  onChange={e => setTargetRoom(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              {/* Reason */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Lý do xin đổi ca <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Ghi rõ lý do công tác, trùng lịch hội nghị hoặc việc cá nhân..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', resize: 'vertical' }}
                />
              </div>

              {/* Note */}
              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={14} color="#f59e0b" />
                <span>Yêu cầu sẽ được thông báo đến sinh viên lớp học phần sau khi được phê duyệt.</span>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Send size={15} />
                  <span>Gửi Yêu Cầu</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
