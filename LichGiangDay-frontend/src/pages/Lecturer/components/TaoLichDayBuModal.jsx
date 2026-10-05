import { useState } from 'react';
import { X, CalendarPlus, Calendar, Clock, Building, Send, AlertCircle, CheckCircle2, History } from 'lucide-react';

export default function TaoLichDayBuModal({ isOpen, onClose, defaultClass = null }) {
  if (!isOpen) return null;

  // Danh sách các ca học đã từng báo nghỉ trước đó đang chờ dạy bù
  const caDaNghiList = [
    {
      id: 'N01',
      maLopHocPhan: 'IT1.110.3.2627.1.QT01.K66',
      tenLop: 'Cơ sở dữ liệu 1-1-26 (QT01)',
      ngayNghi: '22/09/2026',
      tietNghi: 'Tiết 7 - 9 (Chiều)',
      phongGoc: 'P101_A3',
      lyDo: 'Đi công tác hội nghị khoa học'
    },
    {
      id: 'N02',
      maLopHocPhan: 'IT1.220.3.2627.1.CN02.K66',
      tenLop: 'Hệ điều hành & Mạng 1-1-26 (CN02)',
      ngayNghi: '15/09/2026',
      tietNghi: 'Tiết 1 - 3 (Sáng)',
      phongGoc: 'P203_A3',
      lyDo: 'Báo nghỉ việc cá nhân đột xuất'
    }
  ];

  const [selectedCaNghiId, setSelectedCaNghiId] = useState(defaultClass?.id || caDaNghiList[0].id);
  const [ngayDayBu, setNgayDayBu] = useState('');
  const [tietDayBu, setTietDayBu] = useState('3');
  const [phongDeXuat, setPhongDeXuat] = useState('P101_A3');
  const [noiDung, setNoiDung] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectedCa = caDaNghiList.find(c => c.id === selectedCaNghiId) || caDaNghiList[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setNgayDayBu('');
    setNoiDung('');
    onClose();
  };

  return (
    <div className="lgd-modal-overlay" onClick={handleResetAndClose}>
      <div className="lgd-modal-content" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lgd-modal-header" style={{ background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CalendarPlus size={22} />
            <div>
              <h3 className="lgd-modal-title">Tạo Lịch Dạy Bù Cho Ca Đã Báo Nghỉ</h3>
              <p style={{ margin: 0, fontSize: '0.78125rem', color: 'rgba(255,255,255,0.85)' }}>
                Đăng ký bù giờ giảng dạy cho các buổi học đã gửi thông báo nghỉ
              </p>
            </div>
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
              <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Tạo Lịch Dạy Bù Thành Công!</h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Đơn đăng ký dạy bù cho lớp <strong>{selectedCa.tenLop}</strong> đã được gửi tới Ban Đào tạo để phê duyệt phòng học và cập nhật vào thời khóa biểu sinh viên.
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
                Hoàn tất & Đóng
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Step 1: Chọn Ca Đã Nghỉ */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.45rem' }}>
                  <History size={15} color="#059669" />
                  <span>Bước 1: Chọn Ca Học Đã Báo Nghỉ Cần Dạy Bù</span>
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {caDaNghiList.map(ca => {
                    const isSelected = ca.id === selectedCaNghiId;
                    return (
                      <div
                        key={ca.id}
                        onClick={() => setSelectedCaNghiId(ca.id)}
                        style={{
                          padding: '0.75rem 0.95rem',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                          background: isSelected ? '#ecfdf5' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: isSelected ? '#065f46' : '#1e293b', fontSize: '0.875rem' }}>
                            {ca.tenLop}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                            Đã nghỉ ngày: <strong style={{ color: '#dc2626' }}>{ca.ngayNghi}</strong> • {ca.tietNghi} (Phòng gốc: {ca.phongGoc})
                          </div>
                          <div style={{ fontSize: '0.71875rem', color: '#6b7280', fontStyle: 'italic', marginTop: '0.15rem' }}>
                            Lý do nghỉ: {ca.lyDo}
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="caNghi"
                          checked={isSelected}
                          onChange={() => setSelectedCaNghiId(ca.id)}
                          style={{ accentColor: '#059669', width: '18px', height: '18px' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Thông tin tổ chức dạy bù */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <CalendarPlus size={15} color="#0284c7" />
                  <span>Bước 2: Thiết Lập Thời Gian & Phòng Học Dạy Bù</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                      Ngày dạy bù đề xuất <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={ngayDayBu}
                      onChange={e => setNgayDayBu(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                      Ca / Tiết dạy bù <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={tietDayBu}
                      onChange={e => setTietDayBu(e.target.value)}
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

                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                    Phòng học đề xuất (hoặc để trống nhờ Ban Đào tạo xếp)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: P101_A3 hoặc Phòng thực hành máy"
                    value={phongDeXuat}
                    onChange={e => setPhongDeXuat(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                    Nội dung bài giảng dạy bù <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    required
                    rows="2"
                    placeholder="Ghi rõ nội dung lý thuyết / bài tập / thực hành dạy bù..."
                    value={noiDung}
                    onChange={e => setNoiDung(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Notice */}
              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                <AlertCircle size={14} color="#059669" />
                <span>Lịch dạy bù sẽ được đồng bộ vào thời khóa biểu sau khi Ban Đào tạo phê duyệt phòng trống.</span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)', color: '#ffffff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Send size={15} />
                  <span>Xác Nhận Tạo Lịch Dạy Bù</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
