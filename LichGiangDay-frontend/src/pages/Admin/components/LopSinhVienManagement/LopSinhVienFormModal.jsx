import React from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, Users, School } from 'lucide-react';
import './LopSinhVienComponents.css';

export default function LopSinhVienFormModal({
  isOpen = false,
  mode = 'create', // 'create' | 'edit'
  formData,
  setFormData,
  khoaList = [],
  onClose,
  onSubmit,
  loading = false,
  error = '',
  success = ''
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-card" style={{ maxWidth: '520px' }}>
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
              <Users size={18} />
            </div>
            <h3 className="modal-title" style={{ margin: 0 }}>
              {mode === 'create' ? 'Thêm Lớp Sinh Viên Mới' : 'Cập Nhật Lớp Sinh Viên'}
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
        {error && (
          <div className="alert-banner error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit}>
          {/* Mã lớp sinh viên */}
          <div className="modal-form-group">
            <label className="modal-label">
              Mã Lớp Sinh Viên <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="modal-input"
              placeholder="VD: CNPM62A, KTMT63B..."
              value={formData.maLopSinhVien}
              onChange={e => setFormData({ ...formData, maLopSinhVien: e.target.value.toUpperCase() })}
              disabled={mode === 'edit'}
              style={mode === 'edit' ? { background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
              required
            />
            {mode === 'create' && (
              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)', marginTop: '4px', display: 'block' }}>
                Mã lớp là duy nhất, tự động viết hoa và không thể thay đổi sau khi tạo.
              </span>
            )}
          </div>

          {/* Tên lớp sinh viên */}
          <div className="modal-form-group">
            <label className="modal-label">
              Tên Lớp Sinh Viên <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="modal-input"
              placeholder="VD: Lớp Công nghệ phần mềm K62A"
              value={formData.tenLopSinhVien}
              onChange={e => setFormData({ ...formData, tenLopSinhVien: e.target.value })}
              required
            />
          </div>

          {/* Khoa quản lý */}
          <div className="modal-form-group">
            <label className="modal-label">
              <School size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px', color: '#8b5cf6' }} />
              Khoa Trực Thuộc <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="modal-input"
              value={formData.maKhoa}
              onChange={e => setFormData({ ...formData, maKhoa: e.target.value })}
              required
            >
              <option value="">— Chọn khoa quản lý —</option>
              {khoaList.map(k => (
                <option key={k.MaKhoa} value={k.MaKhoa}>
                  {k.TenKhoa} ({k.MaKhoa})
                </option>
              ))}
            </select>
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              Hủy
            </button>
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
                mode === 'create' ? 'Thêm Lớp Sinh Viên' : 'Lưu Thay Đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
