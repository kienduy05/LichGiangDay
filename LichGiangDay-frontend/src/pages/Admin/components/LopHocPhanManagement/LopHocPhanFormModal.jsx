import React, { useMemo } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2, Network, BookOpen, Lock, Calendar, Layers, Hash, School } from "lucide-react";
import './LopHocPhanComponents.css';

export default function LopHocPhanFormModal({
  isOpen,
  mode,
  formData,
  setFormData,
  boMonList = [],
  monHocList = [],
  hocKyList = [],
  khoaSinhVienList = [],
  onSubmit,
  onClose,
  formLoading,
  formError,
  setFormError,
  formSuccess,
  isBoMonRole = false,
  scopedBoMonId = '',
  departmentFullName = ''
}) {
  if (!isOpen) return null;

  const isEdit = mode === "edit";

  const clearErr = () => {
    if (setFormError) setFormError("");
  };

  // Xác định mã bộ môn hiệu lực
  const effectiveBoMon = isBoMonRole && scopedBoMonId ? scopedBoMonId : formData.maBoMon;

  // Lọc danh sách môn học theo bộ môn được chọn
  const availableMonHocs = useMemo(() => {
    if (!effectiveBoMon) return [];
    return (monHocList || []).filter(mh => mh.MaBoMon === effectiveBoMon);
  }, [monHocList, effectiveBoMon]);

  // Bộ môn hiện tại
  const currentBmObj = boMonList.find(b => b.MaBoMon === effectiveBoMon);

  // Xử lý khi đổi bộ môn
  const handleBoMonChange = (e) => {
    clearErr();
    const newBm = e.target.value;
    setFormData(prev => {
      const currentMh = monHocList.find(m => m.MaMonHoc === prev.maMonHoc);
      const isMhValidForNewBm = currentMh && currentMh.MaBoMon === newBm;
      return {
        ...prev,
        maBoMon: newBm,
        maMonHoc: isMhValidForNewBm ? prev.maMonHoc : '',
        tenLopHocPhan: isMhValidForNewBm ? prev.tenLopHocPhan : ''
      };
    });
  };

  // Xử lý khi chọn môn học
  const handleMonHocChange = (e) => {
    clearErr();
    const selectedMaMonHoc = e.target.value;
    const mh = monHocList.find((m) => m.MaMonHoc === selectedMaMonHoc);
    setFormData((prev) => ({
      ...prev,
      maMonHoc: selectedMaMonHoc,
      maBoMon: mh?.MaBoMon || prev.maBoMon,
      tenLopHocPhan: prev.tenLopHocPhan || (mh ? mh.TenMonHoc : "")
    }));
  };

  const handleHocKyChange = (e) => {
    clearErr();
    const selectedHk = e.target.value;
    const hk = hocKyList.find((h) => h.MaHocKy === selectedHk);
    const nbd = hk?.NgayBatDau ? String(hk.NgayBatDau).split("T")[0] : "";
    const nkt = hk?.NgayKetThuc ? String(hk.NgayKetThuc).split("T")[0] : "";
    const st =
      nbd && nkt && new Date(nkt) >= new Date(nbd)
        ? Math.ceil((new Date(nkt) - new Date(nbd)) / (7 * 24 * 60 * 60 * 1000))
        : "";

    setFormData((prev) => ({
      ...prev,
      maHocKy: selectedHk,
      ngayBatDau: nbd || prev.ngayBatDau,
      ngayKetThuc: nkt || prev.ngayKetThuc,
      soTuan: st || prev.soTuan
    }));
  };

  const handleNgayBatDauChange = (e) => {
    clearErr();
    const nbd = e.target.value;
    const nkt = formData.ngayKetThuc;
    const st =
      nbd && nkt && new Date(nkt) >= new Date(nbd)
        ? Math.ceil((new Date(nkt) - new Date(nbd)) / (7 * 24 * 60 * 60 * 1000))
        : formData.soTuan;
    setFormData((prev) => ({
      ...prev,
      ngayBatDau: nbd,
      soTuan: st
    }));
  };

  const handleNgayKetThucChange = (e) => {
    clearErr();
    const nkt = e.target.value;
    const nbd = formData.ngayBatDau;
    const st =
      nbd && nkt && new Date(nkt) >= new Date(nbd)
        ? Math.ceil((new Date(nkt) - new Date(nbd)) / (7 * 24 * 60 * 60 * 1000))
        : formData.soTuan;
    setFormData((prev) => ({
      ...prev,
      ngayKetThuc: nkt,
      soTuan: st
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card wide" style={{ maxWidth: '640px' }}>
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
              <Layers size={18} />
            </div>
            <h3 className="modal-title" style={{ margin: 0 }}>
              {isEdit ? "Cập Nhật Lớp Học Phần" : "Mở Lớp Học Phần Mới"}
            </h3>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        {formSuccess && (
          <div className="alert-banner success">
            <CheckCircle2 size={18} />
            <span>{formSuccess}</span>
          </div>
        )}
        {formError && (
          <div className="alert-banner error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
            {setFormError && (
              <button
                type="button"
                onClick={() => setFormError("")}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}
                title="Đóng thông báo"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        <form onSubmit={onSubmit}>
          {/* ══════════ KHỐI 1: BỘ MÔN VÀ MÔN HỌC (CHỌN BỘ MÔN TRƯỚC) ══════════ */}
          <div className="lhp-form-row">
            {/* 1. Bộ môn */}
            <div className="modal-form-group">
              <label className="modal-label">
                <Network size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px', color: '#0ea5e9' }} />
                Bộ môn quản lý <span style={{ color: "#ef4444" }}>*</span>
              </label>
              {!isBoMonRole && !isEdit ? (
                <select
                  className="modal-input"
                  value={formData.maBoMon}
                  onChange={handleBoMonChange}
                  required
                >
                  <option value="">— Chọn Bộ môn trước —</option>
                  {boMonList.map((bm) => (
                    <option key={bm.MaBoMon} value={bm.MaBoMon}>
                      {bm.TenBoMon} ({bm.MaBoMon})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{
                  padding: '9px 12px',
                  background: isBoMonRole ? '#f0f9ff' : '#f8fafc',
                  border: isBoMonRole ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: isBoMonRole ? '#0369a1' : '#475569',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>{departmentFullName || currentBmObj?.TenBoMon || effectiveBoMon || 'Chưa chọn'}</span>
                  <Lock size={13} color={isBoMonRole ? '#0284c7' : '#94a3b8'} />
                </div>
              )}
            </div>

            {/* 2. Môn học (Load theo Bộ môn) */}
            <div className="modal-form-group">
              <label className="modal-label">
                <BookOpen size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px', color: '#2563eb' }} />
                Môn học <span style={{ color: "#ef4444" }}>*</span>
              </label>
              {!isEdit ? (
                <select
                  className="modal-input"
                  value={formData.maMonHoc}
                  onChange={handleMonHocChange}
                  disabled={!effectiveBoMon}
                  required
                  style={!effectiveBoMon ? { background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' } : {}}
                >
                  {!effectiveBoMon ? (
                    <option value="">— Vui lòng chọn Bộ môn trước —</option>
                  ) : (
                    <>
                      <option value="">— Chọn môn học ({availableMonHocs.length} môn) —</option>
                      {availableMonHocs.map((mh) => (
                        <option key={mh.MaMonHoc} value={mh.MaMonHoc}>
                          {mh.MaMonHoc} — {mh.TenMonHoc} ({mh.SoTinChi || 0} TC)
                        </option>
                      ))}
                    </>
                  )}
                </select>
              ) : (
                <div style={{
                  padding: '9px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#334155',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>{formData.maMonHoc} — {monHocList.find(m => m.MaMonHoc === formData.maMonHoc)?.TenMonHoc || formData.tenLopHocPhan}</span>
                  <Lock size={13} color="#94a3b8" />
                </div>
              )}
            </div>
          </div>

          {/* ══════════ KHỐI 2: MÃ & TÊN LỚP HỌC PHẦN ══════════ */}
          <div className="lhp-form-row">
            <div className="modal-form-group">
              <label className="modal-label">
                Mã lớp học phần <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                className="modal-input"
                placeholder="VD: IT1.106.3.N03"
                value={formData.maLopHocPhan}
                onChange={(e) =>
                  setFormData({ ...formData, maLopHocPhan: e.target.value })
                }
                required
                disabled={isEdit}
                style={
                  isEdit
                    ? {
                        background: "#f1f5f9",
                        color: "#64748b",
                        cursor: "not-allowed",
                      }
                    : undefined
                }
              />
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Tên Lớp Học Phần</label>
              <input
                type="text"
                className="modal-input"
                placeholder="VD: An ninh mạng - 1-25 (QT01)"
                value={formData.tenLopHocPhan}
                onChange={(e) =>
                  setFormData({ ...formData, tenLopHocPhan: e.target.value })
                }
              />
            </div>
          </div>

          {/* ══════════ KHỐI 3: HỌC KỲ & LOẠI HỌC ══════════ */}
          <div className="lhp-form-row">
            {!isEdit ? (
              <div className="modal-form-group">
                <label className="modal-label">
                  Học kỳ <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  className="modal-input"
                  value={formData.maHocKy}
                  onChange={handleHocKyChange}
                  required
                >
                  <option value="">— Chọn Học kỳ —</option>
                  {hocKyList.map((hk) => (
                    <option key={hk.MaHocKy} value={hk.MaHocKy}>
                      {hk.TenHocKy} {hk.NamHoc ? `(${hk.NamHoc})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="modal-form-group">
                <label className="modal-label">Học kỳ (khóa cứng)</label>
                <input
                  type="text"
                  className="modal-input"
                  value={formData.maHocKy}
                  disabled
                  style={{
                    background: "#f1f5f9",
                    color: "#64748b",
                    cursor: "not-allowed",
                  }}
                />
              </div>
            )}
            <div className="modal-form-group">
              <label className="modal-label">
                Loại học <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                className="modal-input"
                value={formData.loaiHoc}
                onChange={(e) =>
                  setFormData({ ...formData, loaiHoc: e.target.value })
                }
                required
              >
                <option value="">— Chọn Loại học —</option>
                <option value="LT">LT — Lý thuyết</option>
                <option value="BT">BT — Bài tập</option>
                <option value="TH">TH — Thực hành</option>
                <option value="BTL">BTL — Bài tập lớn</option>
              </select>
            </div>
          </div>

          {/* ══════════ KHỐI 4: KHÓA SV & SĨ SỐ ══════════ */}
          <div className="lhp-form-row">
            <div className="modal-form-group">
              <label className="modal-label">Khóa sinh viên</label>
              <select
                className="modal-input"
                value={formData.khoaHoc}
                onChange={(e) =>
                  setFormData({ ...formData, khoaHoc: e.target.value })
                }
              >
                <option value="">— Không chọn —</option>
                {khoaSinhVienList.map((k) => (
                  <option key={k.MaKhoaSinhVien} value={k.MaKhoaSinhVien}>
                    {k.TenKhoaSinhVien}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Sinh viên dự kiến</label>
              <input
                type="number"
                className="modal-input"
                min="0"
                placeholder="VD: 60"
                value={formData.siSoDuKien ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, siSoDuKien: e.target.value })
                }
              />
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Sinh viên đăng ký</label>
              <input
                type="number"
                className="modal-input"
                min="0"
                placeholder="VD: 55"
                value={formData.siSoDangKy ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, siSoDangKy: e.target.value })
                }
              />
            </div>
          </div>

          {/* ══════════ KHỐI 5: THỜI GIAN & SỐ TUẦN ══════════ */}
          <div className="lhp-form-row">
            <div className="modal-form-group">
              <label className="modal-label">
                Ngày bắt đầu <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="date"
                className="modal-input"
                value={formData.ngayBatDau}
                onChange={handleNgayBatDauChange}
                required
              />
            </div>
            <div className="modal-form-group">
              <label className="modal-label">
                Ngày kết thúc <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="date"
                className="modal-input"
                value={formData.ngayKetThuc}
                onChange={handleNgayKetThucChange}
                required
              />
            </div>
            <div className="modal-form-group">
              <label className="modal-label">
                Số tuần <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="number"
                className="modal-input"
                min="1"
                placeholder="VD: 15"
                value={formData.soTuan}
                onChange={(e) =>
                  setFormData({ ...formData, soTuan: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '20px' }}>
            <button type="button" onClick={onClose} className="btn-cancel">
              Hủy
            </button>
            <button type="submit" className="btn-save" disabled={formLoading}>
              {formLoading ? (
                <span
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Loader2 size={16} className="animate-spin" /> Đang lưu...
                </span>
              ) : isEdit ? (
                "Lưu Thay Đổi"
              ) : (
                "Mở Lớp Học Phần"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
