import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, BookOpen, Network, School, Lock } from 'lucide-react';
import './MonHocComponents.css';

export default function MonHocFormModal({
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
  isBoMonRole = false,
  scopedBoMonId = '',
  departmentFullName = ''
}) {
  const [selectedKhoaForFilter, setSelectedKhoaForFilter] = useState('');

  useEffect(() => {
    if (isBoMonRole && scopedBoMonId) {
      setFormData(prev => ({ ...prev, maBoMon: scopedBoMonId }));
      const bm = boMonList.find(b => b.MaBoMon === scopedBoMonId);
      if (bm?.MaKhoa) {
        setSelectedKhoaForFilter(bm.MaKhoa);
      }
    } else if (formData.maBoMon) {
      const bm = boMonList.find(b => b.MaBoMon === formData.maBoMon);
      if (bm?.MaKhoa) {
        setSelectedKhoaForFilter(bm.MaKhoa);
      }
    } else {
      setSelectedKhoaForFilter('');
    }
  }, [formData.maBoMon, boMonList, isOpen, isBoMonRole, scopedBoMonId, setFormData]);

  if (!isOpen) return null;

  const filteredBoMons = selectedKhoaForFilter
    ? boMonList.filter(bm => bm.MaKhoa === selectedKhoaForFilter)
    : boMonList;

  const currentBmObj = boMonList.find(b => b.MaBoMon === (isBoMonRole ? scopedBoMonId : formData.maBoMon));
  const currentKhoaObj = khoaList.find(k => k.MaKhoa === (currentBmObj?.MaKhoa || selectedKhoaForFilter));

  const handleKhoaSelectChange = (e) => {
    if (isBoMonRole) return;
    const maKhoa = e.target.value;
    setSelectedKhoaForFilter(maKhoa);
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
              <BookOpen size={18} />
            </div>
            <h3 className="modal-title" style={{ margin: 0 }}>
              {mode === 'create' ? 'Thêm Môn Học Mới' : 'Cập Nhật Thông Tin Môn Học'}
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
          {/* Mã MH */}
          <div className="modal-form-group">
            <label className="modal-label">
              Mã Môn Học <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="modal-input"
              placeholder="VD: CNPM01, GT101, CSDL02..."
              value={formData.maMonHoc}
              onChange={e => setFormData({ ...formData, maMonHoc: e.target.value.toUpperCase() })}
              disabled={mode === 'edit'}
              style={mode === 'edit' ? { background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}}
              required
            />
            {mode === 'create' && (
              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)', marginTop: '4px', display: 'block' }}>
                Mã môn học là duy nhất, tự động viết hoa và không thể thay đổi sau khi tạo.
              </span>
            )}
          </div>

          {/* Tên môn học */}
          <div className="modal-form-group">
            <label className="modal-label">
              Tên Môn Học <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="modal-input"
              placeholder="VD: Công nghệ phần mềm, Giải tích 1..."
              value={formData.tenMonHoc}
              onChange={e => setFormData({ ...formData, tenMonHoc: e.target.value })}
              required
            />
          </div>

          {/* Khoa & Bộ môn */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Khoa */}
            <div className="modal-form-group">
              <label className="modal-label">
                <School size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px', color: '#8b5cf6' }} />
                Khoa quản lý {isBoMonRole && '(Cố định)'}
              </label>
              {!isBoMonRole ? (
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
              ) : (
                <div style={{
                  padding: '9px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#475569',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>{currentKhoaObj?.TenKhoa || 'Khoa Công nghệ thông tin'}</span>
                  <Lock size={12} color="#94a3b8" />
                </div>
              )}
            </div>

            {/* Bộ môn */}
            <div className="modal-form-group">
              <label className="modal-label">
                <Network size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px', color: '#0ea5e9' }} />
                Bộ Môn trực thuộc <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {!isBoMonRole ? (
                <select
                  className="modal-input"
                  value={formData.maBoMon}
                  onChange={e => setFormData({ ...formData, maBoMon: e.target.value })}
                  required
                >
                  <option value="">— Chọn bộ môn —</option>
                  {filteredBoMons.map(bm => (
                    <option key={bm.MaBoMon} value={bm.MaBoMon}>
                      {bm.TenBoMon} ({bm.MaBoMon})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{
                  padding: '9px 12px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  color: '#0369a1',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>{departmentFullName || currentBmObj?.TenBoMon || scopedBoMonId}</span>
                  <Lock size={13} color="#0284c7" />
                </div>
              )}
            </div>
          </div>

          {/* Số tín chỉ & Loại môn học */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Số tín chỉ */}
            <div className="modal-form-group">
              <label className="modal-label">
                Số Tín Chỉ <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                className="modal-input"
                placeholder="VD: 3"
                min={1}
                max={20}
                value={formData.soTinChi}
                onChange={e => setFormData({ ...formData, soTinChi: e.target.value })}
                required
              />
            </div>

            {/* Loại môn học */}
            <div className="modal-form-group">
              <label className="modal-label">
                Loại Môn Học
              </label>
              <input
                type="text"
                className="modal-input"
                placeholder="VD: Regular, Thực hành... (mặc định: Regular)"
                value={formData.loaiMonHoc}
                onChange={e => setFormData({ ...formData, loaiMonHoc: e.target.value })}
              />
            </div>
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
                mode === 'create' ? 'Thêm Môn Học' : 'Lưu Thay Đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
