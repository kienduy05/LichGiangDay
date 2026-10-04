import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, AlertCircle, Loader2, Network, School, User, Mail, Phone,
  Lock, Link, Unlink, UserPlus, KeyRound, UserCheck
} from 'lucide-react';
import {
  apiGetAvailableAccountsForGiangVien,
  apiCreateAndLinkGiangVienAccount
} from '../../../../utils/api';
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
  warning = '',
  isBoMonRole = false,
  scopedBoMonId = '',
  onRefresh
}) {
  const [selectedKhoaForFilter, setSelectedKhoaForFilter] = useState('');

  // Trạng thái quản lý liên kết tài khoản
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [isChangingAccount, setIsChangingAccount] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [createAccountLoading, setCreateAccountLoading] = useState(false);
  const [createAccountError, setCreateAccountError] = useState('');
  const [createAccountSuccess, setCreateAccountSuccess] = useState('');

  // Khi modal mở hoặc formData.maBoMon thay đổi, tự xác định Khoa tương ứng
  useEffect(() => {
    if (isBoMonRole && scopedBoMonId) {
      const bm = boMonList.find(b => b.MaBoMon === scopedBoMonId);
      if (bm?.MaKhoa) {
        setSelectedKhoaForFilter(bm.MaKhoa);
      }
      setFormData(prev => ({ ...prev, maBoMon: scopedBoMonId }));
    } else if (formData.maBoMon) {
      const bm = boMonList.find(b => b.MaBoMon === formData.maBoMon);
      if (bm?.MaKhoa) {
        setSelectedKhoaForFilter(bm.MaKhoa);
      }
    } else {
      setSelectedKhoaForFilter('');
    }
  }, [formData.maBoMon, boMonList, isOpen, isBoMonRole, scopedBoMonId]);

  // Tải danh sách tài khoản khả dụng khi mở modal ở chế độ Edit
  useEffect(() => {
    if (isOpen && mode === 'edit' && formData.maGiangVien) {
      loadAvailableAccounts();
      setIsChangingAccount(false);
      setShowQuickCreate(false);
      setCreateAccountError('');
      setCreateAccountSuccess('');
      setNewUsername(formData.maGiangVien.toLowerCase());
      setNewPassword('123456');
    }
  }, [isOpen, mode, formData.maGiangVien]);

  const loadAvailableAccounts = async () => {
    if (!formData.maGiangVien) return;
    setLoadingAccounts(true);
    try {
      const list = await apiGetAvailableAccountsForGiangVien(formData.maGiangVien);
      setAvailableAccounts(list || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách tài khoản khả dụng:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleKhoaSelectChange = (e) => {
    if (isBoMonRole) return;
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

  // Chọn tài khoản từ dropdown
  const handleSelectAccount = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setFormData(prev => ({
        ...prev,
        userId: '',
        username: '',
        userFullName: '',
        userRole: ''
      }));
      return;
    }
    const found = availableAccounts.find(a => a.UserId === selectedId);
    setFormData(prev => ({
      ...prev,
      userId: selectedId,
      username: found?.Username || '',
      userFullName: found?.FullName || '',
      userRole: found?.RoleName || found?.Role || ''
    }));
    setIsChangingAccount(false);
  };

  // Hủy liên kết tài khoản
  const handleUnlinkAccount = () => {
    setFormData(prev => ({
      ...prev,
      userId: '',
      username: '',
      userFullName: '',
      userRole: ''
    }));
    setIsChangingAccount(false);
  };

  // Tạo nhanh tài khoản mới cho giảng viên
  const handleQuickCreateAccount = async () => {
    setCreateAccountError('');
    setCreateAccountSuccess('');
    if (!newUsername.trim()) {
      setCreateAccountError('Vui lòng nhập tên tài khoản (Username).');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setCreateAccountError('Mật khẩu tối thiểu 6 ký tự.');
      return;
    }

    setCreateAccountLoading(true);
    try {
      const result = await apiCreateAndLinkGiangVienAccount(formData.maGiangVien, {
        username: newUsername.trim(),
        password: newPassword,
        fullName: formData.hoTen,
        email: formData.email
      });
      setCreateAccountSuccess(`Đã tạo và liên kết tài khoản @${result.Username || newUsername.trim()} thành công!`);
      setFormData(prev => ({
        ...prev,
        userId: result.UserId,
        username: result.Username,
        userFullName: result.UserFullName,
        userRole: result.RoleName || result.UserRole
      }));
      setShowQuickCreate(false);
      await loadAvailableAccounts();
      if (onRefresh) onRefresh();
    } catch (err) {
      setCreateAccountError(err.message || 'Tạo tài khoản thất bại.');
    } finally {
      setCreateAccountLoading(false);
    }
  };

  if (!isOpen) return null;

  // Lọc danh sách bộ môn theo khoa được chọn trong modal (nếu có chọn khoa)
  const filteredBoMons = selectedKhoaForFilter
    ? boMonList.filter(bm => bm.MaKhoa === selectedKhoaForFilter)
    : boMonList;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-card" style={{ maxWidth: '580px' }}>
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

          {/* Lọc Khoa & Bộ môn */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Khoa */}
            <div className="modal-form-group">
              <label className="modal-label">
                <School size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px', color: '#8b5cf6' }} />
                Khoa trực thuộc
              </label>
              <select
                className="modal-input"
                value={selectedKhoaForFilter}
                onChange={handleKhoaSelectChange}
                disabled={isBoMonRole}
                style={isBoMonRole ? { background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
              >
                {!isBoMonRole && <option value="">— Tất cả Khoa —</option>}
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
                Bộ Môn công tác {isBoMonRole && <Lock size={12} style={{ display: 'inline', marginLeft: '4px', color: '#64748b' }} />}
              </label>
              <select
                className="modal-input"
                value={formData.maBoMon}
                onChange={e => setFormData({ ...formData, maBoMon: e.target.value })}
                disabled={isBoMonRole}
                style={isBoMonRole ? { background: '#f8fafc', color: '#0f172a', fontWeight: '600', cursor: 'not-allowed' } : {}}
              >
                {!isBoMonRole && <option value="">— Chưa phân bộ môn —</option>}
                {filteredBoMons.map(bm => (
                  <option key={bm.MaBoMon} value={bm.MaBoMon}>
                    {bm.TenBoMon} ({bm.MaBoMon})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════ */}
          {/* LIÊN KẾT TÀI KHOẢN NGƯỜI DÙNG (ÁP DỤNG TRONG PHẦN CẬP NHẬT) */}
          {/* ═════════════════════════════════════════════════════════ */}
          {mode === 'edit' && (
            <div className={`gv-account-link-section ${formData.userId ? 'is-linked' : 'is-unlinked'}`}>
              {/* Header của block */}
              <div className="gv-account-link-header">
                <div className="gv-account-link-title">
                  {formData.userId ? (
                    <UserCheck size={18} color="#16a34a" />
                  ) : (
                    <Unlink size={18} color="#d97706" />
                  )}
                  <span>Tài Khoản Đăng Nhập Hệ Thống</span>
                </div>
                <span className={`gv-account-link-status ${formData.userId ? 'linked' : 'unlinked'}`}>
                  {formData.userId ? (
                    <><CheckCircle2 size={12} /> Đã liên kết</>
                  ) : (
                    <><AlertCircle size={12} /> Chưa liên kết</>
                  )}
                </span>
              </div>

              {createAccountSuccess && (
                <div className="alert-banner success" style={{ marginBottom: '10px', fontSize: '0.82rem', padding: '8px 12px' }}>
                  <CheckCircle2 size={15} />
                  <span>{createAccountSuccess}</span>
                </div>
              )}

              {/* Trường hợp A: Đang có tài khoản liên kết */}
              {formData.userId && !isChangingAccount ? (
                <div className="gv-linked-card">
                  <div className="gv-linked-user-info">
                    <div className="gv-linked-avatar">
                      {(formData.username || formData.hoTen || 'U')[0].toUpperCase()}
                    </div>
                    <div className="gv-linked-details">
                      <div className="gv-linked-username-row">
                        <span className="gv-linked-username">@{formData.username || 'user'}</span>
                        <span className="gv-linked-role-pill">
                          {formData.userRole || 'Giảng viên'}
                        </span>
                      </div>
                      <div className="gv-linked-subtext">
                        {formData.userFullName ? `${formData.userFullName}` : formData.hoTen}
                        {formData.email ? ` • ${formData.email}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="gv-account-actions">
                    <button
                      type="button"
                      onClick={() => setIsChangingAccount(true)}
                      className="gv-btn-change-acc"
                      title="Chọn tài khoản khác để liên kết"
                    >
                      Đổi tài khoản
                    </button>
                    <button
                      type="button"
                      onClick={handleUnlinkAccount}
                      className="gv-btn-unlink"
                      title="Gỡ liên kết tài khoản này khỏi giảng viên"
                    >
                      <Unlink size={13} /> Hủy liên kết
                    </button>
                  </div>
                </div>
              ) : (
                /* Trường hợp B: Chưa liên kết hoặc đang chọn đổi tài khoản */
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
                    {isChangingAccount
                      ? 'Chọn tài khoản khác từ danh sách tài khoản khả dụng:'
                      : 'Liên kết với tài khoản người dùng để giảng viên đăng nhập xem lịch và gửi báo nghỉ:'}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <select
                        className="modal-input"
                        value={formData.userId || ''}
                        onChange={handleSelectAccount}
                        disabled={loadingAccounts}
                        style={{ height: '38px', fontSize: '0.85rem' }}
                      >
                        <option value="">— Chọn tài khoản người dùng khả dụng —</option>
                        {availableAccounts.map(acc => (
                          <option key={acc.UserId} value={acc.UserId}>
                            @{acc.Username} — {acc.FullName || 'Không tên'} ({acc.RoleName || acc.Role})
                          </option>
                        ))}
                      </select>
                      {loadingAccounts && (
                        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                          <Loader2 size={16} className="animate-spin" color="#64748b" />
                        </div>
                      )}
                    </div>

                    {isChangingAccount && (
                      <button
                        type="button"
                        onClick={() => setIsChangingAccount(false)}
                        className="btn-cancel"
                        style={{ height: '38px', padding: '0 12px', fontSize: '0.8rem' }}
                      >
                        Hủy đổi
                      </button>
                    )}
                  </div>

                  {/* Toggle tạo nhanh tài khoản mới */}
                  {!isChangingAccount && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuickCreate(!showQuickCreate);
                          setCreateAccountError('');
                          setCreateAccountSuccess('');
                        }}
                        className="gv-btn-quick-create-toggle"
                      >
                        <UserPlus size={14} />
                        {showQuickCreate ? 'Đóng form tạo nhanh' : '+ Tạo nhanh tài khoản mới cho giảng viên này'}
                      </button>

                      {showQuickCreate && (
                        <div className="gv-quick-create-card">
                          <div className="gv-quick-create-card-title">
                            <KeyRound size={14} />
                            Tạo tài khoản đăng nhập tự động
                          </div>

                          {createAccountError && (
                            <div className="alert-banner error" style={{ margin: '6px 0 10px', fontSize: '0.8rem', padding: '6px 10px' }}>
                              <AlertCircle size={14} />
                              <span>{createAccountError}</span>
                            </div>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                                Tên tài khoản (Username) <span style={{ color: '#ef4444' }}>*</span>
                              </label>
                              <input
                                type="text"
                                className="modal-input"
                                placeholder="VD: gv.001"
                                value={newUsername}
                                onChange={e => setNewUsername(e.target.value)}
                                style={{ height: '34px', fontSize: '0.82rem' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                                Mật khẩu khởi tạo
                              </label>
                              <input
                                type="text"
                                className="modal-input"
                                placeholder="123456"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                style={{ height: '34px', fontSize: '0.82rem' }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              * Mặc định quyền <strong style={{ color: '#2563eb' }}>GIANGVIEN</strong>, mật khẩu mặc định 123456.
                            </span>
                            <button
                              type="button"
                              onClick={handleQuickCreateAccount}
                              disabled={createAccountLoading}
                              className="btn-save"
                              style={{ padding: '6px 14px', fontSize: '0.78rem', height: '32px' }}
                            >
                              {createAccountLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <Loader2 size={13} className="animate-spin" /> Đang tạo...
                                </span>
                              ) : (
                                'Tạo & Liên Kết Ngay'
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
