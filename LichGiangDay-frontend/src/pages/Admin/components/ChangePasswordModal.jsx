import React from 'react';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ChangePasswordModal({
  isOpen,
  onClose,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
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
          <h3 className="modal-title">Đổi Mật Khẩu</h3>
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
            <label className="modal-label">Mật khẩu hiện tại</label>
            <input
              type="password"
              className="modal-input"
              placeholder="Nhập mật khẩu hiện tại"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Mật khẩu mới</label>
            <input
              type="password"
              className="modal-input"
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Nhập lại mật khẩu mới</label>
            <input
              type="password"
              className="modal-input"
              placeholder="Xác nhận lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                  <Loader2 size={16} className="animate-spin" /> Đang xử lý...
                </span>
              ) : (
                'Đổi Mật Khẩu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
