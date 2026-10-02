import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, Network, School, User, Mail, Phone } from 'lucide-react';
import './GiangVienComponents.css';

export default function GiangVienFormModal({
  isOpen = false,
  mode = 'create', // 'create' | 'edit'
  formData,
  setFormData,
  khoaList = [],
  boMonList = [],
  onClose,
  onSubmit,
  loading = false,
  error = '',
  success = '',
  warning = ''
}) {
  const [selectedKhoaForFilter, setSelectedKhoaForFilter] = useState('');

  // Khi modal mở hoặc formData.maBoMon thay đổi, tự xác định Khoa tương ứng
  useEffect(() => {
    if (formData.maBoMon) {
      const bm = boMonList.find(b => b.MaBoMon === formData.maBoMon);
      if (bm?.MaKhoa) {
        setSelectedKhoaForFilter(bm.MaKhoa);
      }
    } else {
      setSelectedKhoaForFilter('');
    }
  }, [formData.maBoMon, boMonList, isOpen]);

  if (!isOpen) return null;

  // Lọc danh sách bộ môn theo khoa được chọn trong modal (nếu có chọn khoa)
  const filteredBoMons = selectedKhoaForFilter
    ? boMonList.filter(bm => bm.MaKhoa === selectedKhoaForFilter)
    : boMonList;

  const handleKhoaSelectChange = (e) => {
    const maKhoa = e.target.value;
    setSelectedKhoaForFilter(maKhoa);
    // Nếu bộ môn hiện tại không thuộc khoa mới chọn thì reset bộ môn
    if (maKhoa && formData.maBoMon) {
      const bm = boMonList.find(b => b.MaBoMon === formData.maBoMon);
      if (bm && bm.MaKhoa !== maKhoa) {
        setFormData(prev => ({ ...prev, maBoMon: '' }));
      }
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-card" style={{ maxWidth: '560px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={18} />
            </div>
            <h3 className="modal-title" style={{ margin: 0 }}>
              {mode === 'create' ? 'Thêm Giảng Viên Mới' : 'Cập Nhật Thông Tin Giảng Viên'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Alerts */}
        {success && (
          <div className="alert-banner success">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}
        {warning && (
          <div className="alert-banner warning">
            <AlertCircle size={18} />
            <span>{warning}</span>
          </div>
        )}
        {error && (
          <div className="alert-banner error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit}>
          {/* Mã GV */}
          <div className="modal-form-group">
            <label className="modal-label">
              Mã Giảng Viên <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="modal-input"
              placeholder="VD: GV001, GV.CNTT01..."
              value={formData.maGiangVien}
              onChange={e => setFormData({ ...formData, maGiangVien: e.target.value.toUpperCase() })}
              disabled={mode === 'edit'}
              style={mode === 'edit' ? { background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
              required
            />
            {mode === 'create' && (
              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)', marginTop: '4px', display: 'block' }}>
                Mã giảng viên là mã định danh duy nhất, tự động viết in hoa và không thể thay đổi sau khi tạo.
              </span>
            )}
          </div>

          {/* Họ tên */}
          <div className="modal-form-group">
            <label className="modal-label">
              Họ Tên Giảng Viên <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="modal-input"
              placeholder="VD: TS. Nguyễn Văn A, ThS. Trần Thị B..."
              value={formData.hoTen}
              onChange={e => setFormData({ ...formData, hoTen: e.target.value })}
              required
            />
          </div>

          {/* Email & Phone trong 1 hàng 2 cột */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Email */}
            <div className="modal-form-group">
              <label className="modal-label">
                <Mail size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                Email
              </label>
              <input
                type="email"
                className="modal-input"
                placeholder="giangvien@truong.edu.vn"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* SĐT */}
            <div className="modal-form-group">
              <label className="modal-label">
                <Phone size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                Số Điện Thoại
              </label>
              <input
                type="text"
                className="modal-input"
                placeholder="VD: 0912345678"
                value={formData.soDienThoai}
                onChange={e => setFormData({ ...formData, soDienThoai: e.target.value })}
              />
            </div>
          </div>

          {/* Lọc Khoa (Hỗ trợ chọn Bộ môn) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Khoa */}
            <div className="modal-form-group">
              <label className="modal-label">
                <School size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px', color: '#8b5cf6' }} />
                Khoa trực thuộc (Gợi ý)
              </label>
              <select
                className="modal-input"
                value={selectedKhoaForFilter}
                onChange={handleKhoaSelectChange}
              >
                <option value="">— Tất cả Khoa —</option>
                {khoaList.map(k => (
                  <option key={k.MaKhoa} value={k.MaKhoa}>
                    {k.TenKhoa}
                  </option>
                ))}
              </select>
            </div>

            {/* Bộ môn */}
            <div className="modal-form-group">
              <label className="modal-label">
                <Network size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px', color: '#0ea5e9' }} />
                Bộ Môn công tác
              </label>
              <select
                className="modal-input"
                value={formData.maBoMon}
                onChange={e => setFormData({ ...formData, maBoMon: e.target.value })}
              >
                <option value="">— Chưa phân bộ môn —</option>
                {filteredBoMons.map(bm => (
                  <option key={bm.MaBoMon} value={bm.MaBoMon}>
                    {bm.TenBoMon} ({bm.MaBoMon})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer" style={{ marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              {warning ? 'Đóng' : 'Hủy'}
            </button>
            {!warning && (
              <button
                type="submit"
                className="btn-save"
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" /> Đang lưu...
                  </span>
                ) : (
                  mode === 'create' ? 'Thêm Giảng Viên' : 'Lưu Thay Đổi'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
