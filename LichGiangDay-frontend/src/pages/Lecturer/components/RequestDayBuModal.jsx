import { useState } from 'react';
import { X, PlusCircle, Calendar, Clock, Building, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RequestDayBuModal({ isOpen, onClose, classItem }) {
  if (!isOpen || !classItem) return null;

  const [date, setDate] = useState('');
  const [tiet, setTiet] = useState('3');
  const [room, setRoom] = useState(classItem.TenPhong || '');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setContent('');
    setDate('');
    onClose();
  };

  return (
    <div className="lgd-modal-overlay" onClick={handleResetAndClose}>
      <div className="lgd-modal-content" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lgd-modal-header" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <PlusCircle size={20} />
            <h3 className="lgd-modal-title">Đăng Ký Buổi Dạy Bù</h3>
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
              <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Đăng Ký Dạy Bù Thành Công!</h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Đơn đăng ký dạy bù cho lớp học phần đã được gửi đến Ban Đào tạo để xếp phòng và thông báo thời gian tới sinh viên.
              </p>
              <button
                type="button"
                onClick={handleResetAndClose}
                style={{
                  marginTop: '1.25rem',
                  padding: '0.6rem 1.8rem',
                  background: '#059669',
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
                <div style={{ fontWeight: 700, color: '#047857', fontSize: '0.925rem' }}>
                  {classItem.TenLopHocPhan || classItem.TenMonHoc}
                </div>
                <div style={{ marginTop: '0.3rem', color: '#64748b', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Mã lớp: <strong>{classItem.MaLopHocPhan}</strong></span>
                  <span>Môn học: <strong>{classItem.TenMonHoc}</strong></span>
                  <span>Sĩ số: <strong>{classItem.SiSoDangKy || 0} SV</strong></span>
                </div>
              </div>

              {/* Date & Shift */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Ngày tổ chức dạy bù <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Ca / Tiết học <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={tiet}
                    onChange={e => setTiet(e.target.value)}
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

              {/* Suggested Room */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Phòng học đề xuất (hoặc để trống để PĐT xếp phòng)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: P202_A3 hoặc Hội trường"
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              {/* Teaching Content */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Nội dung dạy bù / Bài giảng <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Ghi rõ nội dung chương/bài giảng hoặc lý thuyết/thực hành dạy bù..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', resize: 'vertical' }}
                />
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
                  style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none', background: '#059669', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Send size={15} />
                  <span>Gửi Đăng Ký Dạy Bù</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
