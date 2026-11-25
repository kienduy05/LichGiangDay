import React, { useState, useEffect } from 'react';
import {
  Sparkles, X, CheckCircle2, AlertTriangle, ArrowRight,
  RotateCcw, Users, Layers, ShieldCheck, HelpCircle,
  Clock, BookOpen, AlertCircle, ChevronRight, Check
} from 'lucide-react';
import {
  apiPreviewAutoAssign,
  apiApplyAutoAssign
} from '../../../../utils/apiPhanCongGiangVien';

export default function PhanCongAutoModal({
  isOpen,
  onClose,
  maHocKy,
  boMonInfo,
  currentStats,
  onApplied
}) {
  const [step, setStep] = useState('CONFIG'); // 'CONFIG' | 'PREVIEW'
  const [scope, setScope] = useState('ONLY_UNASSIGNED'); // 'ONLY_UNASSIGNED' | 'REASSIGN_ALL'
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Preview Data State
  const [previewData, setPreviewData] = useState(null);
  const [activePreviewTab, setActivePreviewTab] = useState('WORKLOAD'); // 'WORKLOAD' | 'CLASSES' | 'UNASSIGNED'

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep('CONFIG');
      setPreviewData(null);
      setErrorMsg('');
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading && !applying) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, applying, onClose]);

  if (!isOpen) return null;

  // 1. Chạy mô phỏng (Preview)
  const handleStartAnalysis = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await apiPreviewAutoAssign({
        maHocKy,
        scope
      });
      setPreviewData(data);
      setStep('PREVIEW');
      if (data?.unassignedDetails?.length > 0) {
        // Nếu có lớp không gán được, default tab có thể xem workload hoặc unassigned
        setActivePreviewTab('WORKLOAD');
      } else {
        setActivePreviewTab('WORKLOAD');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi chạy thuật toán mô phỏng.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Áp dụng kết quả vào Database (Apply)
  const handleApply = async () => {
    if (!previewData || !previewData.assignments || previewData.assignments.length === 0) {
      setErrorMsg('Không có dữ liệu phân công để áp dụng.');
      return;
    }

    setApplying(true);
    setErrorMsg('');
    try {
      await apiApplyAutoAssign({
        maHocKy,
        assignments: previewData.assignments
      });
      if (onApplied) {
        onApplied(previewData.summary?.assignedClassesCount || previewData.assignments.length);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi áp dụng kết quả phân công.');
    } finally {
      setApplying(false);
    }
  };

  // Tính maxPeriods để vẽ thanh phần trăm so sánh tải
  const maxPeriods = Math.max(
    ...(previewData?.lecturerStats?.map(g => g.totalPeriodsPerWeek) || [1]),
    1
  );

  return (
    <div className="pcgv-modal-overlay" onClick={onClose}>
      <div className="pcgv-auto-modal-content" onClick={e => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="pcgv-auto-modal-header">
          <div className="pcgv-auto-header-left">
            <div className="pcgv-auto-header-icon">
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 className="pcgv-auto-title">Phân Công Giảng Viên Tự Động</h3>
                <span className="pcgv-auto-badge">AI Heuristic Engine</span>
              </div>
              <p className="pcgv-auto-sub">
                Tối ưu hóa phân công tự động cho {boMonInfo?.TenBoMon || 'Bộ môn'} • Học kỳ {maHocKy}
              </p>
            </div>
          </div>
          <button className="pcgv-modal-close" onClick={onClose} disabled={loading || applying}>
            <X size={20} />
          </button>
        </div>

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="pcgv-auto-alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* BODY STEP 1: CONFIG */}
        {step === 'CONFIG' && (
          <div className="pcgv-auto-body">
            {/* KPI Hiện tại */}
            <div className="pcgv-auto-stat-row">
              <div className="pcgv-auto-stat-item">
                <span className="stat-label">Lớp đủ ĐK phân công (TKB + TH)</span>
                <span className="stat-value">{currentStats?.scheduledCount || 0} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ {currentStats?.totalClasses || 0}</span></span>
              </div>
              <div className="pcgv-auto-stat-item">
                <span className="stat-label">Đã phân công</span>
                <span className="stat-value text-emerald">{currentStats?.assignedCount || 0} lớp</span>
              </div>
              <div className="pcgv-auto-stat-item">
                <span className="stat-label">Chờ phân công</span>
                <span className="stat-value text-amber">{currentStats?.unassignedScheduledCount || 0} lớp</span>
              </div>
              <div className="pcgv-auto-stat-item">
                <span className="stat-label">Chưa có TKB (Bỏ qua)</span>
                <span className="stat-value" style={{ color: '#94a3b8' }}>{currentStats?.unscheduledCount || 0} lớp</span>
              </div>
            </div>

            {/* Chế độ phân công */}
            <div className="pcgv-auto-section-title">
              <Layers size={16} />
              <span>Chọn phạm vi phân công</span>
            </div>

            <div className="pcgv-auto-scope-options">
              <div
                className={`pcgv-scope-card ${scope === 'ONLY_UNASSIGNED' ? 'active' : ''}`}
                onClick={() => setScope('ONLY_UNASSIGNED')}
              >
                <div className="pcgv-scope-radio">
                  <div className={`radio-dot ${scope === 'ONLY_UNASSIGNED' ? 'checked' : ''}`} />
                </div>
                <div className="pcgv-scope-content">
                  <div className="pcgv-scope-head">
                    <span className="scope-name">Chỉ phân công các lớp chưa có giảng viên</span>
                    <span className="scope-tag tag-safe">Khuyên dùng</span>
                  </div>
                  <p className="scope-desc">
                    Bảo lưu toàn bộ các lớp đã được phân công giảng viên trước đó. Thuật toán chỉ tìm kiếm giảng viên tối ưu nhất để bù đắp vào các lớp còn lại.
                  </p>
                </div>
              </div>

              <div
                className={`pcgv-scope-card ${scope === 'REASSIGN_ALL' ? 'active' : ''}`}
                onClick={() => setScope('REASSIGN_ALL')}
              >
                <div className="pcgv-scope-radio">
                  <div className={`radio-dot ${scope === 'REASSIGN_ALL' ? 'checked' : ''}`} />
                </div>
                <div className="pcgv-scope-content">
                  <div className="pcgv-scope-head">
                    <span className="scope-name">Phân công lại toàn bộ</span>
                    <span className="scope-tag tag-optimize">Cân bằng tải tối đa</span>
                  </div>
                  <p className="scope-desc">
                    Tính toán lại toàn diện phân bổ số tiết dạy cho từng giảng viên từ đầu để đạt độ đồng đều cao nhất. <em>(Các lớp đã bị Phòng Đào tạo Khóa lịch vẫn được bảo lưu tuyệt đối).</em>
                  </p>
                </div>
              </div>
            </div>

            {/* Các ràng buộc cam kết */}
            <div className="pcgv-auto-rules-box">
              <div className="rules-title">
                <ShieldCheck size={16} color="#4f46e5" />
                <span>Các nguyên tắc vàng được thuật toán tuân thủ 100%:</span>
              </div>
              <ul className="rules-list">
                <li>
                  <strong>Chỉ phân công lớp ĐÃ CÓ TKB:</strong> Tuân thủ nghiêm ngặt quy trình quản lý: <u>phải có lịch học TKB mới được phân công</u>. Các lớp con chưa có TKB (kể cả thuộc cụm lớp) sẽ tự động loại bỏ để chờ xếp lịch xong.
                </li>
                <li>
                  <strong>Ràng buộc cụm lớp gia đình:</strong> Các lớp Lý thuyết (N01), Bài tập (N01.BT1), Thực hành (N01.TH1)... khi đã có lịch <u>bắt buộc được phân cho cùng 1 giảng viên</u>.
                </li>
                <li>
                  <strong>Chuyên môn hóa:</strong> Giảng viên chỉ được phân dạy các môn học đã được kích hoạt trong danh sách <em>Quản lý môn học giảng viên</em>.
                </li>
                <li>
                  <strong>Không trùng lịch:</strong> Tuyệt đối không trùng Thứ, Tiết và khoảng thời gian diễn ra học phần.
                </li>
                <li>
                  <strong>Cân bằng tải (Fair Workload):</strong> Ưu tiên gán cho giảng viên có số tiết dạy trong tuần đang thấp hơn để san đều khối lượng công việc.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* BODY STEP 2: PREVIEW */}
        {step === 'PREVIEW' && previewData && (
          <div className="pcgv-auto-body preview-mode">
            {/* Tóm tắt kết quả mô phỏng */}
            <div className="pcgv-preview-summary-grid">
              <div className="pcgv-preview-sum-card success">
                <div className="sum-icon">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="sum-val">
                    {previewData.summary?.assignedClassesCount} / {previewData.summary?.scheduledClassesCount || previewData.summary?.totalClasses} lớp có TKB
                  </div>
                  <div className="sum-desc">
                    Tỷ lệ thành công: <strong>{previewData.summary?.completionRate}%</strong> ({previewData.summary?.unscheduledClassesCount || 0} lớp chưa có TKB tự động loại trừ)
                  </div>
                </div>
              </div>

              {previewData.summary?.unassignedScheduledClassesCount > 0 ? (
                <div className="pcgv-preview-sum-card warning">
                  <div className="sum-icon">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <div className="sum-val">{previewData.summary?.unassignedScheduledClassesCount} lớp chưa thể gán</div>
                    <div className="sum-desc">Do toàn bộ GV đủ chuyên môn bị trùng lịch dạy ở slot này</div>
                  </div>
                </div>
              ) : (
                <div className="pcgv-preview-sum-card info">
                  <div className="sum-icon">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <div className="sum-val">Phân bổ tối ưu 100%</div>
                    <div className="sum-desc">Toàn bộ {previewData.summary?.assignedClassesCount} lớp đã có lịch đều được phân công hợp lệ</div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-tabs điều hướng kết quả */}
            <div className="pcgv-preview-tabs">
              <button
                className={`preview-tab-btn ${activePreviewTab === 'WORKLOAD' ? 'active' : ''}`}
                onClick={() => setActivePreviewTab('WORKLOAD')}
              >
                <Users size={15} />
                <span>Cân bằng tải giảng viên ({previewData.lecturerStats?.length || 0})</span>
              </button>
              <button
                className={`preview-tab-btn ${activePreviewTab === 'CLASSES' ? 'active' : ''}`}
                onClick={() => setActivePreviewTab('CLASSES')}
              >
                <BookOpen size={15} />
                <span>Chi tiết phân công cụm lớp ({previewData.assignments?.length || 0} lớp)</span>
              </button>
              {previewData.unassignedDetails?.length > 0 && (
                <button
                  className={`preview-tab-btn tab-warning ${activePreviewTab === 'UNASSIGNED' ? 'active' : ''}`}
                  onClick={() => setActivePreviewTab('UNASSIGNED')}
                >
                  <AlertTriangle size={15} />
                  <span>Cụm lớp chưa gán được ({previewData.unassignedDetails?.length})</span>
                </button>
              )}
            </div>

            {/* NỘI DUNG SUB-TAB 1: WORKLOAD */}
            {activePreviewTab === 'WORKLOAD' && (
              <div className="pcgv-preview-tab-content">
                <div className="pcgv-auto-table-container">
                  <table className="pcgv-preview-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                        <th>Giảng viên</th>
                        <th style={{ width: '110px', textAlign: 'center' }}>Số lớp nhận</th>
                        <th style={{ width: '130px', textAlign: 'center' }}>Tải (tiết/tuần)</th>
                        <th>Phân bổ trực quan so sánh</th>
                        <th>Môn học phụ trách</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.lecturerStats?.map((gv, idx) => {
                        const pct = Math.round((gv.totalPeriodsPerWeek / maxPeriods) * 100);
                        return (
                          <tr key={gv.maGiangVien}>
                            <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#1e293b' }}>{gv.hoTen}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{gv.email || gv.maGiangVien}</div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="pcgv-tag-classes">{gv.assignedClassesCount} lớp</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="pcgv-tag-periods">{gv.totalPeriodsPerWeek} tiết/tuần</span>
                            </td>
                            <td>
                              <div className="pcgv-workload-bar-wrap">
                                <div
                                  className="pcgv-workload-bar-fill"
                                  style={{
                                    width: `${Math.max(pct, 6)}%`,
                                    background: pct > 80 ? '#3b82f6' : '#10b981'
                                  }}
                                />
                                <span className="pcgv-workload-bar-text">{pct}%</span>
                              </div>
                            </td>
                            <td>
                              <div className="pcgv-assigned-subjects">
                                {gv.assignedSubjects?.length > 0 ? (
                                  gv.assignedSubjects.map((sub, sIdx) => (
                                    <span key={sIdx} className="sub-badge" title={sub}>
                                      {sub}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Chưa nhận lớp nào</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* NỘI DUNG SUB-TAB 2: CLASSES */}
            {activePreviewTab === 'CLASSES' && (
              <div className="pcgv-preview-tab-content">
                <div className="pcgv-auto-table-container">
                  <table className="pcgv-preview-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                        <th>Mã lớp học phần</th>
                        <th>Cụm gia đình lớp</th>
                        <th>Môn học</th>
                        <th>Giảng viên được phân công</th>
                        <th style={{ width: '130px', textAlign: 'center' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.assignments?.map((item, idx) => (
                        <tr key={item.maLopHocPhan}>
                          <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                          <td>
                            <span className="font-mono text-bold">{item.maLopHocPhan}</span>
                          </td>
                          <td>
                            <span className="pcgv-family-chip">
                              <Layers size={12} />
                              {item.familyKey}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{item.tenMonHoc || item.maMonHoc}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.maMonHoc}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <div className="pcgv-gv-avatar-mini">
                                {item.tenGiangVien?.split(' ').pop()?.charAt(0) || 'G'}
                              </div>
                              <span style={{ fontWeight: 600, color: '#1e293b' }}>{item.tenGiangVien}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {item.isPreserved ? (
                              <span className="pcgv-status-tag tag-preserved">Bảo lưu</span>
                            ) : (
                              <span className="pcgv-status-tag tag-new">Mới gán</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* NỘI DUNG SUB-TAB 3: UNASSIGNED */}
            {activePreviewTab === 'UNASSIGNED' && previewData.unassignedDetails && (
              <div className="pcgv-preview-tab-content">
                <div className="pcgv-unassigned-alert-box">
                  <AlertTriangle size={18} color="#d97706" />
                  <span>
                    Các cụm lớp dưới đây không thể gán tự động do toàn bộ giảng viên đủ chuyên môn môn này bị trùng lịch dạy vào khung giờ tương ứng. Bạn có thể gán thêm chuyên môn cho các giảng viên khác hoặc phân công thủ công.
                  </span>
                </div>

                <div className="pcgv-unassigned-cards">
                  {previewData.unassignedDetails.map((un, idx) => (
                    <div key={idx} className="pcgv-unassigned-card">
                      <div className="un-header">
                        <div className="un-title">
                          <span className="un-name">{un.tenMonHoc || un.maMonHoc}</span>
                          <span className="un-fkey">Cụm: {un.familyKey}</span>
                        </div>
                        <span className="un-tag-fail">Xung đột lịch</span>
                      </div>
                      <div className="un-classes">
                        <strong>Các lớp con trong cụm:</strong>
                        <div className="un-class-chips">
                          {un.classCodes?.map((code, cIdx) => (
                            <span key={cIdx} className="un-class-chip">{code}</span>
                          ))}
                        </div>
                      </div>
                      <div className="un-reason">
                        <strong>Nguyên nhân:</strong> {un.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="pcgv-auto-modal-footer">
          {step === 'CONFIG' ? (
            <>
              <button
                className="pcgv-btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Hủy bỏ
              </button>
              <button
                className="pcgv-btn-start-analysis"
                onClick={handleStartAnalysis}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="pcgv-spinner-small" />
                    <span>Đang phân tích & gom cụm lớp...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Bắt đầu phân tích & Mô phỏng</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                className="pcgv-btn-back"
                onClick={() => setStep('CONFIG')}
                disabled={applying}
              >
                <RotateCcw size={14} />
                <span>Quay lại cấu hình</span>
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="pcgv-btn-cancel"
                  onClick={onClose}
                  disabled={applying}
                >
                  Đóng
                </button>
                <button
                  className="pcgv-btn-apply-results"
                  onClick={handleApply}
                  disabled={applying || !previewData?.assignments?.length}
                >
                  {applying ? (
                    <>
                      <div className="pcgv-spinner-small" />
                      <span>Đang lưu vào CSDL...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Áp dụng kết quả ({previewData?.assignments?.length || 0} lớp)</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

