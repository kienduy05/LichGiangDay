import { X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LopHocPhanFormModal({
  isOpen,
  mode,
  formData,
  setFormData,
  boMonList,
  monHocList,
  hocKyList,
  khoaSinhVienList,
  onSubmit,
  onClose,
  formLoading,
  formError,
  formSuccess,
}) {
  if (!isOpen) return null;

  const isEdit = mode === "edit";

  return (
    <div className="modal-overlay">
      <div className="modal-card wide">
        <div className="modal-header">
          <h3 className="modal-title">
            {isEdit ? "Cập Nhật Lớp Học Phần" : "Mở Lớp Học Phần"}
          </h3>
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
          <div className="alert-banner error">
            <AlertCircle size={18} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={onSubmit}>
          
          {/* Row 1: Môn học + Mã lớp học phần */}
          <div className="lhp-form-row">
            {!isEdit && (
              <div className="modal-form-group">
                <label className="modal-label">
                  Môn học <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  className="modal-input"
                  value={formData.maMonHoc}
                  onChange={(e) =>
                    setFormData({ ...formData, maMonHoc: e.target.value })
                  }
                  required
                >
                  <option value="">— Chọn môn học —</option>
                  {monHocList.map((mh) => (
                    <option key={mh.MaMonHoc} value={mh.MaMonHoc}>
                      {mh.MaMonHoc} — {mh.TenMonHoc}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                style={isEdit ? { background: "#f1f5f9", color: "#64748b", cursor: "not-allowed" } : undefined}
              />
            </div>
          </div>

          {/* Tên LHP */}
          <div className="modal-form-group">
            <label className="modal-label">Tên Lớp Học Phần</label>
            <input
              type="text"
              className="modal-input"
              placeholder="VD: Giải tích 1 — Nhóm LT1"
              value={formData.tenLopHocPhan}
              onChange={(e) =>
                setFormData({ ...formData, tenLopHocPhan: e.target.value })
              }
            />
          </div>

          {/* Row 2: Học kỳ + Loại học */}
          <div className="lhp-form-row">
            {!isEdit ? (
              <div className="modal-form-group">
                <label className="modal-label">
                  Học kỳ <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  className="modal-input"
                  value={formData.maHocKy}
                  onChange={(e) =>
                    setFormData({ ...formData, maHocKy: e.target.value })
                  }
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
                <option value="">— Chọn —</option>
                <option value="LT">LT — Lý thuyết</option>
                <option value="BT">BT — Bài tập</option>
                <option value="TH">TH — Thực hành</option>
                <option value="BTL">BTL — Bài tập lớn</option>
              </select>
            </div>
          </div>

          {/* Row 3: Bộ môn + Khóa SV */}
          <div className="lhp-form-row">
            <div className="modal-form-group">
              <label className="modal-label">
                Bộ môn <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                className="modal-input"
                value={formData.maBoMon}
                onChange={(e) =>
                  setFormData({ ...formData, maBoMon: e.target.value })
                }
                required
              >
                <option value="">— Chọn Bộ môn —</option>
                {boMonList.map((bm) => (
                  <option key={bm.MaBoMon} value={bm.MaBoMon}>
                    {bm.TenBoMon} ({bm.MaBoMon})
                  </option>
                ))}
              </select>
            </div>
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
          </div>

          {/* Row 4: Sĩ số DK + ĐK */}
          <div className="lhp-form-row">
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
                max={formData.siSoDuKien !== '' ? formData.siSoDuKien : undefined}
                placeholder="VD: 55"
                value={formData.siSoDangKy ?? ""}
                onChange={(e) => setFormData({ ...formData, siSoDangKy: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-sub)' }}>
                Không được lớn hơn sinh viên dự kiến
              </span>
            </div>
          </div>

          {/* Row 5: Ngày bắt đầu + Kết thúc + Số tuần */}
          <div className="lhp-form-row">
            <div className="modal-form-group">
              <label className="modal-label">
                Ngày bắt đầu <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="date"
                className="modal-input"
                value={formData.ngayBatDau}
                onChange={(e) =>
                  setFormData({ ...formData, ngayBatDau: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, ngayKetThuc: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="modal-form-group" style={{ maxWidth: "200px" }}>
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

          <div className="modal-footer">
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
