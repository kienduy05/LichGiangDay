import { useState } from 'react';
import { X, UserCheck, Calendar, Clock, Building, Send, AlertCircle, CheckCircle2, User } from 'lucide-react';

export default function RequestDayThayModal({ isOpen, onClose, classItem }) {
  if (!isOpen || !classItem) return null;

  const [maGiangVienThay, setMaGiangVienThay] = useState('NQT001');
  const [ngayDayThay, setNgayDayThay] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [noiDung, setNoiDung] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Danh sách giảng viên cùng bộ môn để chọn dạy thay
  const danhSachGV = [
    { maGV: 'NQT001', hoTen: 'TS. Nguyễn Quốc Tuấn', boMon: 'Mạng máy tính và HTTT' },
    { maGV: 'TVN002', hoTen: 'ThS. Trần Văn Nam', boMon: 'Mạng máy tính và HTTT' },
    { maGV: 'LTT003', hoTen: 'TS. Lê Thị Thảo', boMon: 'Khoa học máy tính' },
    { maGV: 'PVH004', hoTen: 'PGS. TS. Phạm Văn Hùng', boMon: 'Công nghệ phần mềm' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setLyDo('');
    setNoiDung('');
    setNgayDayThay('');
    onClose();
  };

  return (
    <div className="lgd-modal-overlay" onClick={handleResetAndClose}>
      <div className="lgd-modal-content" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lgd-modal-header" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <UserCheck size={20} />
            <h3 className="lgd-modal-title">Yêu Cầu Nhờ Giảng Viên Dạy Thay</h3>
          </div>
          <button className="lgd-modal-close" onClick={handleResetAndClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="lgd-modal-body" style={{ padding: '1.5rem' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Gửi Yêu Cầu Dạy Thay Thành Công!</h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Đề xuất nhờ giảng viên dạy thay đã được gửi đến Giảng viên nhận dạy và Trưởng Bộ môn để xác nhận phê duyệt.
              </p>
              <button
                type="button"
                onClick={handleResetAndClose}
                style={{
                  marginTop: '1.25rem',
                  padding: '0.6rem 1.8rem',
                  background: '#7c3aed',
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
              <div style={{ background: '#f5f3ff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #ddd6fe', fontSize: '0.84rem' }}>
                <div style={{ fontWeight: 700, color: '#6d28d9', fontSize: '0.925rem' }}>
                  {classItem.TenLopHocPhan || classItem.TenMonHoc}
                </div>
                <div style={{ marginTop: '0.3rem', color: '#64748b', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Mã lớp: <strong>{classItem.MaLopHocPhan}</strong></span>
                  <span>Thời gian: <strong>Thứ {classItem.ThuTrongTuan}, {classItem.TenTiet}</strong></span>
                  <span>Phòng: <strong>{classItem.TenPhong}</strong></span>
                </div>
              </div>

              {/* Select Lecturer & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Chọn Giảng viên dạy thay <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={maGiangVienThay}
                    onChange={e => setMaGiangVienThay(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', background: '#ffffff' }}
                  >
                    {danhSachGV.map(gv => (
                      <option key={gv.maGV} value={gv.maGV}>
                        {gv.hoTen} ({gv.maGV})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Ngày dạy thay <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={ngayDayThay}
                    onChange={e => setNgayDayThay(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Lý do nhờ dạy thay <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đi công tác đột xuất, tham dự hội thảo chuyên môn..."
                  value={lyDo}
                  onChange={e => setLyDo(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              {/* Syllabus / Content handover */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Nội dung bài giảng chuyển giao <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Ghi rõ nội dung chương bài, tài liệu hoặc bài tập cần giảng viên dạy thay hướng dẫn..."
                  value={noiDung}
                  onChange={e => setNoiDung(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', resize: 'vertical' }}
                />
              </div>

              {/* Note */}
              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={14} color="#7c3aed" />
                <span>Yêu cầu sẽ có hiệu lực sau khi giảng viên nhận dạy thay và Trưởng Bộ môn đồng ý.</span>
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
                  style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none', background: '#7c3aed', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Send size={15} />
                  <span>Gửi Yêu Cầu Dạy Thay</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
