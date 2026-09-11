import React from 'react';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function EditProfileModal({
  isOpen,
  onClose,
  username,
  editFullName,
  setEditFullName,
  editEmail,
  setEditEmail,
  onSubmit,
  loading,
  success,
  error
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">Thay Đổi Thông Tin Cá Nhân</h3>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

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
          <div className="modal-form-group">
            <label className="modal-label">Tên tài khoản (Username)</label>
            <input
              type="text"
              className="modal-input"
              value={username || ''}
              disabled
              style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Họ và Tên</label>
            <input
              type="text"
              className="modal-input"
              placeholder="Nhập họ và tên"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              required
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Địa chỉ Email</label>
            <input
              type="email"
              className="modal-input"
              placeholder="Nhập địa chỉ email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">
              Hủy
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 size={16} className="animate-spin" /> Đang lưu...
                </span>
              ) : (
                'Lưu Thay Đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
