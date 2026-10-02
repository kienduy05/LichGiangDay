import React from 'react';
import {
  ArrowLeft, Edit2, Users, BookOpen, Network, School,
  Calendar, Layers, User, UserCheck, Clock, CheckCircle2,
  AlertCircle, Loader2, GraduationCap
} from 'lucide-react';
import './LopHocPhanComponents.css';

export default function LopHocPhanDetailView({
  detailData,
  detailLoading = false,
  hasPermission = () => true,
  onBack,
  onEdit
}) {
  const { lopHocPhan, lopSinhVienList = [] } = detailData || {};

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('vi-VN');
    } catch {
      return d;
    }
  };

  const isAssigned = lopHocPhan?.TrangThaiPhanCong === 'Assigned';
  const fillRate = lopHocPhan?.SiSoDuKien && lopHocPhan.SiSoDuKien > 0
    ? Math.min(100, Math.round(((lopHocPhan.SiSoDangKy || 0) / lopHocPhan.SiSoDuKien) * 100))
    : 0;

  return (
    <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* 1. Header Profile Banner */}
      <div className="lhp-detail-banner">
        <button
          type="button"
          className="lhp-detail-back-btn"
          onClick={onBack}
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>

        <div className="lhp-detail-main-header">
          <div className="lhp-detail-avatar-box">
            <Layers size={28} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {detailLoading ? (
              <div className="lhp-detail-title">Đang tải dữ liệu chi tiết lớp học phần...</div>
            ) : (
              <>
                <div className="lhp-detail-title-row">
                  <h2 className="lhp-detail-title">
                    {lopHocPhan?.TenLopHocPhan || lopHocPhan?.TenMonHoc || lopHocPhan?.MaLopHocPhan}
                  </h2>
                  <span className="lhp-detail-code-badge">
                    {lopHocPhan?.MaLopHocPhan}
                  </span>
                  <span className={`lhp-badge-status ${isAssigned ? 'assigned' : 'unassigned'}`}>
                    {isAssigned ? '✓ Đã phân công GV' : '⏳ Chưa phân công GV'}
                  </span>
                  {lopHocPhan?.LoaiHoc && (
                    <span className="lhp-badge-loai">
                      {lopHocPhan.LoaiHoc === 'LT' ? 'Lý thuyết' :
                       lopHocPhan.LoaiHoc === 'BT' ? 'Bài tập' :
                       lopHocPhan.LoaiHoc === 'TH' ? 'Thực hành' :
                       lopHocPhan.LoaiHoc === 'BTL' ? 'Bài tập lớn' : lopHocPhan.LoaiHoc}
                    </span>
                  )}
                </div>

                <div className="lhp-detail-meta-row">
                  {/* Môn học */}
                  <span className="lhp-detail-meta-item">
                    <BookOpen size={14} color="#2563eb" />
                    <span>Môn: <b>{lopHocPhan?.TenMonHoc || lopHocPhan?.MaMonHoc}</b></span>
                  </span>

                  {/* Bộ môn */}
                  {lopHocPhan?.TenBoMon && (
                    <span className="lhp-detail-meta-item">
                      <Network size={14} color="#0284c7" />
                      <span>{lopHocPhan.TenBoMon}</span>
                    </span>
                  )}

                  {/* Học kỳ */}
                  {lopHocPhan?.TenHocKy && (
                    <span className="lhp-detail-meta-item">
                      <Calendar size={14} color="#8b5cf6" />
                      <span>{lopHocPhan.TenHocKy} {lopHocPhan.NamHoc ? `(${lopHocPhan.NamHoc})` : ''}</span>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sửa thông tin */}
          {hasPermission('LopHocPhan', 'CanUpdate') && lopHocPhan && onEdit && (
            <button
              type="button"
              className="action-btn edit"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: 'auto',
                fontWeight: '600',
                fontSize: '0.84rem'
              }}
              onClick={() => onEdit(lopHocPhan)}
            >
              <Edit2 size={15} /> Sửa lớp HP
            </button>
          )}
        </div>
      </div>

      {detailLoading ? (
        <div className="table-loading-cell" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Loader2 size={32} className="animate-spin text-blue-500" style={{ margin: '0 auto 12px' }} />
          <span>Đang tải thông tin lớp học phần...</span>
        </div>
      ) : (
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 2. Key Info Cards Grid */}
          <div className="lhp-detail-grid">
            {/* Thẻ 1: Môn học */}
            <div className="lhp-detail-card">
              <div className="lhp-detail-card-label">
                <BookOpen size={14} color="#2563eb" /> Môn Học
              </div>
              <div className="lhp-detail-card-value">
                {lopHocPhan?.TenMonHoc || '—'}
              </div>
              <div className="lhp-detail-card-sub">
                Mã môn: <span className="lhp-code-mini">{lopHocPhan?.MaMonHoc}</span>
              </div>
            </div>

            {/* Thẻ 2: Giảng viên phụ trách */}
            <div className="lhp-detail-card">
              <div className="lhp-detail-card-label">
                <User size={14} color="#16a34a" /> Giảng Viên Phụ Trách
              </div>
              <div className="lhp-detail-card-value" style={{ color: lopHocPhan?.TenGiangVien ? '#0f172a' : '#94a3b8' }}>
                {lopHocPhan?.TenGiangVien || 'Chưa phân công giảng viên'}
              </div>
              <div className="lhp-detail-card-sub">
                Trạng thái: <b>{isAssigned ? 'Đã gán giảng viên' : 'Chưa gán'}</b>
              </div>
            </div>

            {/* Thẻ 3: Sĩ số sinh viên */}
            <div className="lhp-detail-card">
              <div className="lhp-detail-card-label">
                <Users size={14} color="#ea580c" /> Sĩ Số Sinh Viên
              </div>
              <div className="lhp-detail-card-value">
                <b>{lopHocPhan?.SiSoDangKy != null ? lopHocPhan.SiSoDangKy : 0}</b> / {lopHocPhan?.SiSoDuKien || '—'} SV
              </div>
              <div className="lhp-detail-card-sub">
                Tỷ lệ lấp đầy: <b>{fillRate}%</b>
              </div>
            </div>

            {/* Thẻ 4: Thời gian học */}
            <div className="lhp-detail-card">
              <div className="lhp-detail-card-label">
                <Clock size={14} color="#0284c7" /> Thời Gian & Số Tuần
              </div>
              <div className="lhp-detail-card-value">
                {formatDate(lopHocPhan?.NgayBatDau)} → {formatDate(lopHocPhan?.NgayKetThuc)}
              </div>
              <div className="lhp-detail-card-sub">
                Thời lượng: <b>{lopHocPhan?.SoTuan ? `${lopHocPhan.SoTuan} tuần` : 'Chưa xác định'}</b>
              </div>
            </div>

            {/* Thẻ 5: Bộ môn & Khóa */}
            <div className="lhp-detail-card">
              <div className="lhp-detail-card-label">
                <Network size={14} color="#7c3aed" /> Đơn Vị & Khóa SV
              </div>
              <div className="lhp-detail-card-value">
                {lopHocPhan?.TenBoMon || 'Chưa phân bộ môn'}
              </div>
              <div className="lhp-detail-card-sub">
                Khóa: <b>{lopHocPhan?.TenKhoaSinhVien || lopHocPhan?.KhoaHoc || 'Không chọn'}</b>
              </div>
            </div>

            {/* Thẻ 6: Học kỳ */}
            <div className="lhp-detail-card">
              <div className="lhp-detail-card-label">
                <Calendar size={14} color="#e11d48" /> Học Kỳ Áp Dụng
              </div>
              <div className="lhp-detail-card-value">
                {lopHocPhan?.TenHocKy || '—'}
              </div>
              <div className="lhp-detail-card-sub">
                Năm học: <b>{lopHocPhan?.NamHoc || '—'}</b>
              </div>
            </div>
          </div>

          {/* 3. Danh sách Lớp sinh viên ghép */}
          <div className="lhp-detail-section">
            <div className="lhp-detail-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={18} color="#2563eb" />
                <h3 className="lhp-detail-section-title">
                  Lớp Sinh Viên Ghép ({lopSinhVienList.length})
                </h3>
              </div>
            </div>

            {lopSinhVienList.length === 0 ? (
              <div className="table-empty-cell" style={{ padding: '36px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                <Users size={36} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                <p style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>Chưa có lớp sinh viên nào được ghép vào lớp học phần này.</p>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px' }}>Lớp sinh viên ghép giúp quản lý danh sách sinh viên theo dõi buổi học.</p>
              </div>
            ) : (
              <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                      <th style={{ width: '160px' }}>Mã Lớp SV</th>
                      <th>Tên Lớp Sinh Viên</th>
                      <th style={{ width: '220px' }}>Khoa Quản Lý</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lopSinhVienList.map((lsv, idx) => (
                      <tr key={lsv.MaLopSinhVien || idx}>
                        <td style={{ textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                        <td>
                          <span className="role-badge primary" style={{ fontWeight: 600 }}>
                            {lsv.MaLopSinhVien}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                          {lsv.TenLopSinhVien}
                        </td>
                        <td style={{ color: '#475569', fontSize: '0.86rem' }}>
                          <School size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px', color: '#8b5cf6' }} />
                          {lsv.TenKhoa || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="status-badge active" style={{ fontSize: '0.74rem' }}>
                            Đã ghép
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
