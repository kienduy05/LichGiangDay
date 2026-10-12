import { useState } from 'react';
import { X, AlertTriangle, Calendar, Clock, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RequestBaoNghiModal({ isOpen, onClose, classItem }) {
  if (!isOpen || !classItem) return null;

  const [ngayNghi, setNgayNghi] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [loaiNghi, setLoaiNghi] = useState('DotXuat');
  const [coKeHoachDayBu, setCoKeHoachDayBu] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setLyDo('');
    setNgayNghi('');
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
                Thông tin báo nghỉ đã được gửi đến Ban Đào tạo & Trưởng Bộ môn. Vui lòng sắp xếp lịch dạy bù sớm nhất để đảm bảo tiến độ học tập của sinh viên.
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
              {/* Class Info Box */}
              <div style={{ background: '#fef2f2', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #fecaca', fontSize: '0.84rem' }}>
                <div style={{ fontWeight: 700, color: '#b91c1c', fontSize: '0.925rem' }}>
                  {classItem.TenLopHocPhan || classItem.TenMonHoc}
                </div>
                <div style={{ marginTop: '0.3rem', color: '#64748b', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Mã lớp: <strong>{classItem.MaLopHocPhan}</strong></span>
                  <span>Thời gian: <strong>Thứ {classItem.ThuTrongTuan}, {classItem.TenTiet}</strong></span>
                  <span>Phòng: <strong>{classItem.TenPhong}</strong></span>
                </div>
              </div>

              {/* Date & Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Ngày xin nghỉ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={ngayNghi}
                    onChange={e => setNgayNghi(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Hình thức nghỉ
                  </label>
                  <select
                    value={loaiNghi}
                    onChange={e => setLoaiNghi(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', background: '#ffffff' }}
                  >
                    <option value="DotXuat">Nghỉ đột xuất (Ốm, việc gia đình)</option>
                    <option value="CongTac">Nghỉ theo kế hoạch công tác</option>
                    <option value="Khac">Lý do khác</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Lý do chi tiết <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Ghi rõ lý do xin nghỉ buổi dạy..."
                  value={lyDo}
                  onChange={e => setLyDo(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', resize: 'vertical' }}
                />
              </div>

              {/* Checkbox plan for makeup */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input
                  type="checkbox"
                  id="chkDayBu"
                  checked={coKeHoachDayBu}
                  onChange={e => setCoKeHoachDayBu(e.target.checked)}
                  style={{ accentColor: '#dc2626', width: '16px', height: '16px' }}
                />
                <label htmlFor="chkDayBu" style={{ fontSize: '0.8125rem', color: '#334155', cursor: 'pointer' }}>
                  Giảng viên cam kết sẽ đăng ký lịch dạy bù sau khi hoàn thành thời gian nghỉ.
                </label>
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
                  style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Send size={15} />
                  <span>Gửi Thông Báo Nghỉ</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
