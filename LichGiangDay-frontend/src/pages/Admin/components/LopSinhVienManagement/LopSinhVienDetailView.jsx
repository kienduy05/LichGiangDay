import React from 'react';
import {
  ArrowLeft, Edit2, School, Users, BookMarked,
  CalendarDays, User, Loader2
} from 'lucide-react';
import './LopSinhVienComponents.css';

export default function LopSinhVienDetailView({
  detailData,
  loading = false,
  onBack,
  onEdit,
  hasPermission = () => true
}) {
  const { lopSinhVien, lopHocPhanList = [] } = detailData || {};

  return (
    <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* 1. Header Profile Banner */}
      <div className="lsv-detail-header" style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--admin-card-border, #e2e8f0)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
      }}>
        <button
          type="button"
          className="lsv-detail-back-btn"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#334155',
            fontWeight: 600,
            fontSize: '0.84rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
          }}>
            <Users size={28} />
          </div>

          <div style={{ flex: 1 }}>
            {loading ? (
              <div className="lsv-detail-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Đang tải thông tin lớp sinh viên...</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--admin-text-main, #0f172a)' }}>
                    {lopSinhVien?.TenLopSinhVien}
                  </h2>
                  <span className="lsv-code-pill" style={{ fontSize: '0.82rem', padding: '2px 8px' }}>
                    {lopSinhVien?.MaLopSinhVien}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '8px',
                  flexWrap: 'wrap',
                  fontSize: '0.84rem',
                  color: '#475569'
                }}>
                  {/* Khoa */}
                  {lopSinhVien?.TenKhoa && (
                    <span className="lsv-khoa-badge">
                      <School size={13} color="#8b5cf6" />
                      {lopSinhVien.TenKhoa} ({lopSinhVien.MaKhoa})
                    </span>
                  )}

                  {/* Lớp HP tham gia */}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontWeight: 600 }}>
                    <BookMarked size={13} />
                    Đang tham gia {lopHocPhanList.length} lớp học phần
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {hasPermission('LopSinhVien', 'CanUpdate') && lopSinhVien && (
          <button
            type="button"
            className="action-btn edit"
            style={{ padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', height: 'auto' }}
            onClick={() => onEdit(lopSinhVien)}
          >
            <Edit2 size={15} /> Sửa thông tin
          </button>
        )}
      </div>

      {/* 2. Danh sách Lớp Học Phần mà lớp sinh viên này đang tham gia */}
      <div style={{ padding: '16px 20px 8px', fontWeight: 700, fontSize: '0.92rem', color: 'var(--admin-text-main)' }}>
        Danh Sách Lớp Học Phần Tham Gia ({lopHocPhanList.length})
      </div>

      {loading ? (
        <div className="table-loading-cell" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Loader2 size={32} className="animate-spin text-blue-500" style={{ margin: '0 auto 12px' }} />
          <span>Đang tải thông tin lớp học phần...</span>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th style={{ width: '150px' }}>Mã Lớp HP</th>
                <th>Tên Lớp Học Phần / Môn Học</th>
                <th style={{ width: '140px' }}>Học Kỳ / Năm</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Hình Thức</th>
                <th style={{ width: '180px' }}>Giảng Viên Phụ Trách</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Trạng Thái PC</th>
              </tr>
            </thead>
            <tbody>
              {lopHocPhanList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty-cell" style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <BookMarked size={36} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                    <p>Lớp sinh viên này hiện chưa được xếp vào lớp học phần nào.</p>
                  </td>
                </tr>
              ) : (
                lopHocPhanList.map((lhp) => (
                  <tr key={lhp.MaLopHocPhan}>
                    <td>
                      <span className="role-badge primary" style={{ fontWeight: 600 }}>
                        {lhp.MaLopHocPhan}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--admin-text-main)' }}>
                        {lhp.TenLopHocPhan || lhp.MaLopHocPhan}
                      </div>
                      {lhp.TenMonHoc && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-sub)' }}>
                          {lhp.TenMonHoc} {lhp.SoTinChi ? `(${lhp.SoTinChi} TC)` : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.84rem', color: 'var(--admin-text-sub)' }}>
                      <div>{lhp.TenHocKy || lhp.MaHocKy}</div>
                      {lhp.NamHoc && <div style={{ fontSize: '0.76rem' }}>{lhp.NamHoc}</div>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="role-badge" style={{ fontSize: '0.75rem' }}>
                        {lhp.LoaiHoc || 'Chính khóa'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.84rem', color: 'var(--admin-text-main)' }}>
                      {lhp.TenGiangVien ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} color="#2563eb" />
                          <span>{lhp.TenGiangVien}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa phân công</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className={`status-badge ${lhp.TrangThaiPhanCong === 'Assigned' ? 'active' : ''}`}
                        style={{ fontSize: '0.74rem' }}
                      >
                        {lhp.TrangThaiPhanCong === 'Assigned' ? 'Đã gán GV' : lhp.TrangThaiPhanCong || 'Mặc định'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
