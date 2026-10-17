import React, { useState } from 'react';
import {
  User, CheckCircle2, AlertTriangle, AlertCircle, Clock, Building,
  BookOpen, Calendar, Eye, UserPlus, UserMinus, ShieldAlert,
  Loader2, Info, ArrowRight, HelpCircle, Lock
} from 'lucide-react';
import './PhanCongGiangVien.css';

export default function PhanCongInspector({
  selectedClass = null,
  availabilityData = null,
  loadingAvailability = false,
  onAssign,
  onUnassign,
  onPreviewSchedule,
  assigning = false
}) {
  const [confirmConflictModal, setConfirmConflictModal] = useState(null);

  if (!selectedClass) {
    return (
      <div className="pcgv-inspector-panel">
        <div className="pcgv-empty-inspector">
          <div className="pcgv-empty-icon">
            <UserPlus size={32} />
          </div>
          <div>
            <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.05rem' }}>
              Chọn một lớp học phần để bắt đầu phân công
            </h4>
            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.84rem', color: '#64748b', maxWidth: '380px' }}>
              Nhấp vào một lớp học phần ở danh sách bên trái. Hệ thống sẽ tự động quét lịch và gợi ý các giảng viên khả dụng trong bộ môn.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const thuLabels = { 2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật' };
  const loaiHocLabels = { LT: 'Lý thuyết', TH: 'Thực hành', BT: 'Bài tập', BTL: 'Bài tập lớn' };
  const isLocked = selectedClass.isLocked || selectedClass.TrangThaiPhanCong === 'Locked';

  return (
    <div className="pcgv-inspector-panel">
      {/* Active Class Header Card */}
      <div className="pcgv-active-class-card">
        <div className="pcgv-active-class-top">
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Lớp học phần đang xử lý
            </div>
            <h3 className="pcgv-active-class-name">
              {selectedClass.TenLopHocPhan || selectedClass.TenMonHoc}
            </h3>
          </div>
          <span className={`pcgv-item-tag tag-${(selectedClass.LoaiHoc || 'LT').toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
            {loaiHocLabels[selectedClass.LoaiHoc] || selectedClass.LoaiHoc}
          </span>
        </div>

        {/* Meta badges */}
        <div className="pcgv-active-class-meta">
          <span className="pcgv-meta-badge">
            <BookOpen size={13} color="#4f46e5" />
            Mã LHP: <strong>{selectedClass.MaLopHocPhan}</strong>
          </span>
          <span className="pcgv-meta-badge">
            Số TC: <strong>{selectedClass.SoTinChi || 3}</strong>
          </span>
          <span className="pcgv-meta-badge">
            Sĩ số: <strong>{selectedClass.SiSoDangKy || selectedClass.SiSoDuKien || 0} SV</strong>
          </span>
          {isLocked && (
            <span className="pcgv-meta-badge" style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe', fontWeight: 700 }}>
              <Lock size={13} />
              Trạng thái: <strong>ĐÃ KHÓA LỊCH (PĐT)</strong>
            </span>
          )}
        </div>

        {/* Detailed Schedules */}
        {selectedClass.schedules && selectedClass.schedules.length > 0 && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
              Lịch học đã xếp bởi Phòng Đào Tạo:
            </div>
            {selectedClass.schedules.map((sc, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8125rem', color: '#1e293b' }}>
                <Clock size={13} color="#4f46e5" />
                <span><strong>{thuLabels[sc.ThuTrongTuan] || `Thứ ${sc.ThuTrongTuan}`}</strong>, {sc.TenTiet} ({sc.GioBatDau?.slice(0, 5)} - {sc.GioKetThuc?.slice(0, 5)})</span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#0284c7', fontWeight: 600 }}>
                  <Building size={13} />
                  Phòng {sc.TenPhong} ({sc.TenToaNha || 'Khu A'})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Currently Assigned Lecturer Card */}
      {selectedClass.isAssigned && (
        <div className="pcgv-current-gv-banner" style={isLocked ? { background: '#f5f3ff', borderColor: '#ddd6fe' } : {}}>
          <div className="pcgv-current-gv-info">
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: isLocked ? '#7c3aed' : '#10b981',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {isLocked ? <Lock size={18} /> : <User size={20} />}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: isLocked ? '#6d28d9' : '#065f46', fontWeight: 700 }}>
                {isLocked ? 'LỊCH ĐÃ ĐƯỢC PHÒNG ĐÀO TẠO KHÓA' : 'Giảng viên đang phụ trách lớp:'}
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: isLocked ? '#4c1d95' : '#064e3b' }}>
                {selectedClass.TenGiangVien}
              </div>
            </div>
          </div>
          {isLocked ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '0.45rem 0.85rem', background: '#ffffff', color: '#7c3aed',
              borderRadius: '7px', fontSize: '0.78rem', fontWeight: 700,
              border: '1px solid #c4b5fd'
            }}>
              <Lock size={13} /> Lịch đã khóa (Không thể hủy)
            </span>
          ) : (
            <button
              className="pcgv-btn-unassign"
              onClick={() => onUnassign(selectedClass.MaLopHocPhan)}
              disabled={assigning}
              title="Hủy phân công lớp này"
            >
              <UserMinus size={13} />
              <span>Hủy phân công</span>
            </button>
          )}
        </div>
      )}

      {/* Cảnh báo khi lịch đã bị PĐT khóa */}
      {isLocked && (
        <div style={{
          padding: '0.85rem 1.15rem', background: '#faf5ff',
          border: '1px solid #d8b4fe', borderRadius: '10px',
          color: '#581c87', fontSize: '0.84rem', lineHeight: 1.5,
          display: 'flex', alignItems: 'center', gap: '0.65rem'
        }}>
          <Lock size={20} color="#7c3aed" style={{ flexShrink: 0 }} />
          <div>
            <strong>Thời khóa biểu lớp này đã được Phòng Đào Tạo chốt & KHÓA LỊCH TOÀN TRƯỜNG.</strong>
            <div style={{ fontSize: '0.78rem', color: '#6b21a8', marginTop: '2px' }}>
              Bộ môn không thể phân công lại hay hủy phân công. Nếu cần điều chỉnh nhân sự giảng dạy, vui lòng liên hệ Phòng Đào Tạo để mở khóa lịch.
            </div>
          </div>
        </div>
      )}

      {/* Loading Availability state */}
      {loadingAvailability && (
        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#4f46e5' }}>
          <Loader2 size={32} className="animate-spin" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
            Đang quét kiểm tra lịch toàn bộ giảng viên trong bộ môn...
          </span>
        </div>
      )}

      {/* If Class has NO schedule */}
      {!loadingAvailability && (!selectedClass.schedules || selectedClass.schedules.length === 0) && (
        <div style={{ padding: '2rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', textAlign: 'center', color: '#92400e' }}>
          <AlertTriangle size={36} color="#d97706" style={{ margin: '0 auto 0.6rem auto' }} />
          <h4 style={{ margin: 0, color: '#78350f' }}>Lớp học phần này chưa được xếp lịch TKB</h4>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.84rem' }}>
            Phòng Đào Tạo cần tạo lịch học (Thứ, Tiết, Phòng) trước khi Bộ môn tiến hành phân công giảng viên để kiểm tra chống trùng giờ.
          </p>
        </div>
      )}

      {/* Availability Groups */}
      {!loadingAvailability && availabilityData && availabilityData.hasSchedule && (
        <div className="pcgv-gv-groups-container">
          {/* 1. Available Lecturers (GREEN) */}
          <div>
            <div className="pcgv-group-title available">
              <CheckCircle2 size={16} />
              <span>Giảng viên Khả Dụng / Rảnh Lịch ({availabilityData.availableLecturers?.length || 0})</span>
            </div>

            {(!availabilityData.availableLecturers || availabilityData.availableLecturers.length === 0) ? (
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.8125rem', textAlign: 'center', marginTop: '0.5rem' }}>
                Không có giảng viên nào rảnh lịch trong khung giờ này.
              </div>
            ) : (
              <div className="pcgv-gv-cards-grid" style={{ marginTop: '0.65rem' }}>
                {availabilityData.availableLecturers.map(gv => {
                  const isCurrent = gv.isCurrentlyAssigned;
                  return (
                    <div key={gv.MaGiangVien} className="pcgv-gv-card available">
                      <div className="pcgv-gv-card-top">
                        <div>
                          <div className="pcgv-gv-name">{gv.HoTen}</div>
                          <div className="pcgv-gv-contact">{gv.Email || gv.MaGiangVien}</div>
                        </div>
                        {isCurrent && (
                          <span className="pcgv-status-pill status-assigned" style={{ fontSize: '0.6875rem' }}>
                            Đang dạy
                          </span>
                        )}
                      </div>

                      <div className="pcgv-gv-workload">
                        <span>Đang dạy: <strong>{gv.currentClassCount} lớp</strong></span>
                        <span>•</span>
                        <span>Tổng: <strong>{gv.totalPeriodsPerWeek} tiết/tuần</strong></span>
                      </div>

                      <div className="pcgv-gv-actions">
                        <button
                          type="button"
                          className="pcgv-btn-preview-sched"
                          onClick={() => onPreviewSchedule(gv.MaGiangVien, gv.HoTen)}
                          title="Xem lịch tuần của giảng viên này"
                        >
                          <Eye size={12} />
                          <span>Xem lịch tuần</span>
                        </button>

                        {!isCurrent ? (
                          <button
                            type="button"
                            className="pcgv-btn-assign-action"
                            onClick={() => !isLocked && onAssign(selectedClass.MaLopHocPhan, gv.MaGiangVien, false)}
                            disabled={assigning || isLocked}
                            style={isLocked ? { opacity: 0.45, cursor: 'not-allowed', background: '#94a3b8' } : {}}
                            title={isLocked ? 'Lịch đã bị Phòng Đào Tạo khóa' : 'Phân công'}
                          >
                            {isLocked ? <Lock size={13} /> : <UserPlus size={13} />}
                            <span>{isLocked ? 'Đã khóa' : 'Phân công'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="pcgv-btn-unassign"
                            onClick={() => !isLocked && onUnassign(selectedClass.MaLopHocPhan)}
                            disabled={assigning || isLocked}
                            style={isLocked ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                            title={isLocked ? 'Lịch đã bị Phòng Đào Tạo khóa' : 'Bỏ gán'}
                          >
                            {isLocked ? <Lock size={13} /> : <UserMinus size={13} />}
                            <span>{isLocked ? 'Đã khóa' : 'Bỏ gán'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Conflicted Lecturers (RED) */}
          {availabilityData.conflictedLecturers && availabilityData.conflictedLecturers.length > 0 && (
            <div>
              <div className="pcgv-group-title conflicted">
                <AlertCircle size={16} />
                <span>Giảng viên Bị Trùng Lịch ({availabilityData.conflictedLecturers.length})</span>
              </div>

              <div className="pcgv-gv-cards-grid" style={{ marginTop: '0.65rem' }}>
                {availabilityData.conflictedLecturers.map(gv => (
                  <div key={gv.MaGiangVien} className="pcgv-gv-card conflicted">
                    <div className="pcgv-gv-card-top">
                      <div>
                        <div className="pcgv-gv-name" style={{ color: '#991b1b' }}>{gv.HoTen}</div>
                        <div className="pcgv-gv-contact">{gv.Email || gv.MaGiangVien}</div>
                      </div>
                    </div>

                    {/* Conflict reason box */}
                    <div className="pcgv-conflict-alert">
                      <div style={{ fontWeight: 700, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ShieldAlert size={12} />
                        Phát hiện trùng giờ:
                      </div>
                      {gv.conflicts.map((c, cIdx) => (
                        <div key={cIdx}>• {c.reason}</div>
                      ))}
                    </div>

                    <div className="pcgv-gv-actions">
                      <button
                        type="button"
                        className="pcgv-btn-preview-sched"
                        onClick={() => onPreviewSchedule(gv.MaGiangVien, gv.HoTen)}
                      >
                        <Eye size={12} />
                        <span>Xem lịch tuần</span>
                      </button>

                      <button
                        type="button"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.38rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid #f87171',
                          background: isLocked ? '#f1f5f9' : '#fff',
                          color: isLocked ? '#94a3b8' : '#dc2626',
                          cursor: isLocked ? 'not-allowed' : 'pointer'
                        }}
                        disabled={assigning || isLocked}
                        onClick={() => !isLocked && setConfirmConflictModal({
                          maLopHocPhan: selectedClass.MaLopHocPhan,
                          maGiangVien: gv.MaGiangVien,
                          lecturerName: gv.HoTen,
                          conflicts: gv.conflicts
                        })}
                        title={isLocked ? 'Lịch đã bị Phòng Đào Tạo khóa' : 'Bỏ qua cảnh báo để cưỡng chế phân công'}
                      >
                        {isLocked ? <Lock size={12} /> : <AlertTriangle size={12} />}
                        <span>{isLocked ? 'Đã khóa' : 'Cưỡng chế gán'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm Force Assign Modal */}
      {confirmConflictModal && (
        <div className="lgd-modal-overlay" onClick={() => setConfirmConflictModal(null)}>
          <div className="lgd-modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="lgd-modal-header" style={{ background: '#dc2626' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={22} />
                <h3 className="lgd-modal-title">Cảnh báo Xung Đột Lịch Dạy</h3>
              </div>
            </div>
            <div className="lgd-modal-body">
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e293b' }}>
                Giảng viên <strong>{confirmConflictModal.lecturerName}</strong> đang bị trùng lịch với các buổi học sau:
              </p>
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8125rem', color: '#991b1b' }}>
                {confirmConflictModal.conflicts?.map((c, i) => (
                  <div key={i} style={{ marginBottom: '0.25rem' }}>• {c.reason}</div>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>
                Bạn có chắc chắn muốn <strong>Cưỡng chế phân công (Force Override)</strong> giảng viên này vào lớp không?
              </p>
            </div>
            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', background: '#f8fafc' }}>
              <button
                style={{ padding: '0.45rem 1rem', fontSize: '0.84rem', fontWeight: 600, borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                onClick={() => setConfirmConflictModal(null)}
              >
                Hủy bỏ
              </button>
              <button
                style={{ padding: '0.45rem 1rem', fontSize: '0.84rem', fontWeight: 600, borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer' }}
                onClick={() => {
                  const { maLopHocPhan, maGiangVien } = confirmConflictModal;
                  setConfirmConflictModal(null);
                  onAssign(maLopHocPhan, maGiangVien, true);
                }}
              >
                Xác nhận cưỡng chế gán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
