import { ArrowLeft, Users, Trash2, Plus, Loader2, UserCheck, Network } from 'lucide-react';

export default function LopHocPhanDetailView({
  detailData, detailLoading, hasPermission,
  onBack, onAttach, onDetach, onAssign
}) {
  if (!detailData) return null;

  const { lopHocPhan, lopSinhVienList = [] } = detailData;
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

  return (
    <div className="lhp-management-container">
      <div className="admin-card" style={{ padding: 0 }}>
        {/* Header */}
        <div className="lhp-detail-header">
          <button className="lhp-detail-back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Quay lại
          </button>
          <div style={{ flex: 1 }}>
            {detailLoading ? (
              <div className="lhp-detail-title">Đang tải...</div>
            ) : (
              <>
                <div className="lhp-detail-title">
                  {lopHocPhan?.MaLopHocPhan}
                  <span style={{ marginLeft: 10, fontSize: '0.88rem', fontWeight: 400, color: 'var(--admin-text-sub)' }}>
                    {lopHocPhan?.TenMonHoc}
                  </span>
                </div>
                <div className="lhp-detail-subtitle">
                  <span className="lhp-badge loaihoc">{lopHocPhan?.LoaiHoc}</span>
                  <span className={`lhp-badge ${lopHocPhan?.TrangThaiPhanCong === 'Assigned' ? 'assigned' : 'unassigned'}`}>
                    {lopHocPhan?.TrangThaiPhanCong === 'Assigned' ? '✓ Đã PC' : '✕ Chưa PC'}
                  </span>
                  {lopHocPhan?.TenBoMon && <span className="lhp-badge bomon"><Network size={11} /> {lopHocPhan.TenBoMon}</span>}
                  {lopHocPhan?.TenKhoaSinhVien && <span className="lhp-badge khoa">{lopHocPhan.TenKhoaSinhVien}</span>}
                </div>
              </>
            )}
          </div>
        </div>

        {detailLoading ? (
          <div className="table-loading-cell" style={{ padding: '40px 20px' }}>
            <Loader2 size={24} className="animate-spin" />
            <span>Đang tải chi tiết...</span>
          </div>
        ) : (
          <>
            {/* Info Grid */}
            <div className="lhp-info-grid">
              <div className="lhp-info-item">
                <div className="lhp-info-label">Tên lớp HP</div>
                <div className="lhp-info-value">{lopHocPhan?.TenLopHocPhan || '—'}</div>
              </div>
              <div className="lhp-info-item">
                <div className="lhp-info-label">Học kỳ</div>
                <div className="lhp-info-value">{lopHocPhan?.TenHocKy} {lopHocPhan?.NamHoc ? `(${lopHocPhan.NamHoc})` : ''}</div>
              </div>
              <div className="lhp-info-item">
                <div className="lhp-info-label">Sĩ số DK / ĐK</div>
                <div className="lhp-info-value">{lopHocPhan?.SiSoDuKien ?? '—'} / {lopHocPhan?.SiSoDangKy ?? '—'}</div>
              </div>
              <div className="lhp-info-item">
                {/*<div className="lhp-info-label">Giảng viên</div>*/}
                <div className="lhp-info-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/*{lopHocPhan?.TenGiangVien || <span style={{ color: 'var(--admin-text-sub)' }}>Chưa phân công</span>}*/}
                  {hasPermission('LopHocPhan', 'CanUpdate') && (
                    <button
                      className={`lhp-assign-btn ${lopHocPhan?.MaGiangVien ? 'unassign' : ''}`}
                      onClick={() => onAssign(lopHocPhan)}
                      style={{ marginLeft: 4 }}
                    >
                      <UserCheck size={12} />
                      {lopHocPhan?.MaGiangVien ? 'Đổi' : 'Phân công'}
                    </button>
                  )}
                </div>
              </div>
              <div className="lhp-info-item">
                <div className="lhp-info-label">Khoảng ngày</div>
                <div className="lhp-info-value">
                  {formatDate(lopHocPhan?.NgayBatDau)} → {formatDate(lopHocPhan?.NgayKetThuc)} ({lopHocPhan?.SoTuan} tuần)
                </div>
              </div>
              {/* <div className="lhp-info-item">
                <div className="lhp-info-label">Số tín chỉ</div>
                <div className="lhp-info-value">{lopHocPhan?.SoTinChi ?? '—'}</div>
              </div> */}
            </div>

            {/* Lớp sinh viên ghép */}
            <div className="lhp-section-header">
              <div className="lhp-section-title">
                <Users size={16} /> Lớp sinh viên ghép ({lopSinhVienList.length})
              </div>
              {hasPermission('LopHocPhan', 'CanUpdate') && (
                <div className="lhp-section-actions">
                  <button className="lhp-section-btn primary" onClick={() => onAttach(lopHocPhan)}>
                    <Plus size={14} /> Gắn thêm
                  </button>
                  {lopSinhVienList.length > 0 && (
                    <button className="lhp-section-btn danger" onClick={() => onDetach(lopHocPhan, lopSinhVienList)}>
                      <Trash2 size={14} /> Gỡ
                    </button>
                  )}
                </div>
              )}
            </div>

            {lopSinhVienList.length === 0 ? (
              <div className="table-empty-cell">Chưa có lớp sinh viên nào được ghép.</div>
            ) : (
              <div className="table-responsive">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '160px' }}>Mã lớp SV</th>
                      <th>Tên lớp sinh viên</th>
                      <th style={{ width: '140px' }}>Khoa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lopSinhVienList.map(lsv => (
                      <tr key={lsv.MaLopSinhVien}>
                        <td><span className="role-badge primary">{lsv.MaLopSinhVien}</span></td>
                        <td style={{ fontWeight: 600 }}>{lsv.TenLopSinhVien}</td>
                        <td style={{ color: 'var(--admin-text-sub)', fontSize: '0.85rem' }}>{lsv.TenKhoa || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
