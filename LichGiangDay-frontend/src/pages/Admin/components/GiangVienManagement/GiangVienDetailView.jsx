import React from 'react';
import {
  ArrowLeft, Edit2, Network, School, BookMarked, CalendarDays,
  Clock, Link, Unlink, Mail, Phone, Loader2, BookOpen
} from 'lucide-react';
import './GiangVienComponents.css';

export default function GiangVienDetailView({
  detailData,
  loading = false,
  activeTab = 'lophocphan',
  setActiveTab,
  onBack,
  onEdit,
  hasPermission = () => true
}) {
  const {
    giangVien,
    lopHocPhanList = [],
    yeuCauNghiList = [],
    dayThayList = [],
    dayBuList = []
  } = detailData || {};

  const initials = giangVien?.HoTen
    ? giangVien.HoTen.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase()
    : 'GV';

  return (
    <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* 1. Header Profile Banner */}
      <div className="gv-detail-header" style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--admin-card-border, #e2e8f0)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
      }}>
        <button
          type="button"
          className="gv-detail-back-btn"
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
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#ffffff',
            fontSize: '1.25rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
          }}>
            {initials}
          </div>

          <div style={{ flex: 1 }}>
            {loading ? (
              <div className="gv-detail-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Đang tải dữ liệu hồ sơ...</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--admin-text-main, #0f172a)' }}>
                    {giangVien?.HoTen}
                  </h2>
                  <span className="gv-code-pill" style={{ fontSize: '0.82rem', padding: '2px 8px' }}>
                    {giangVien?.MaGiangVien}
                  </span>
                  <span className={`status-badge ${giangVien?.TrangThai === 'Active' ? 'active' : 'inactive'}`}>
                    {giangVien?.TrangThai === 'Active' ? 'Đang công tác' : 'Tạm dừng công tác'}
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
                  {/* Bộ môn */}
                  <span className={`gv-bomon-badge ${!giangVien?.MaBoMon ? 'empty' : ''}`} style={{ fontSize: '0.8rem' }}>
                    <Network size={12} />
                    {giangVien?.TenBoMon || 'Chưa phân bộ môn'}
                  </span>

                  {/* Khoa */}
                  {giangVien?.TenKhoa && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                      <School size={13} color="#8b5cf6" />
                      {giangVien.TenKhoa}
                    </span>
                  )}

                  {/* Tài khoản */}
                  <span className={`gv-account-badge ${giangVien?.DaLienKetTaiKhoan ? 'linked' : 'unlinked'}`}>
                    {giangVien?.DaLienKetTaiKhoan ? (
                      <><Link size={11} /> Có tài khoản người dùng</>
                    ) : (
                      <><Unlink size={11} /> Chưa liên kết tài khoản</>
                    )}
                  </span>

                  {/* Email */}
                  {giangVien?.Email && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={12} color="#94a3b8" />
                      {giangVien.Email}
                    </span>
                  )}

                  {/* SĐT */}
                  {giangVien?.SoDienThoai && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} color="#94a3b8" />
                      {giangVien.SoDienThoai}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {hasPermission('GiangVien', 'CanUpdate') && giangVien && (
          <button
            type="button"
            className="action-btn edit"
            style={{ padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', height: 'auto' }}
            onClick={() => onEdit(giangVien)}
          >
            <Edit2 size={15} /> Sửa thông tin
          </button>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className="gv-tab-bar" style={{
        display: 'flex',
        borderBottom: '1px solid var(--admin-card-border, #e2e8f0)',
        background: '#ffffff',
        padding: '0 16px'
      }}>
        <button
          type="button"
          className={`gv-tab-btn ${activeTab === 'lophocphan' ? 'active' : ''}`}
          onClick={() => setActiveTab('lophocphan')}
        >
          <BookMarked size={15} style={{ marginRight: 6, verticalAlign: '-2px' }} />
          Lớp học phần phụ trách ({lopHocPhanList.length})
        </button>

        <button
          type="button"
          className={`gv-tab-btn ${activeTab === 'yeucaunghi' ? 'active' : ''}`}
          onClick={() => setActiveTab('yeucaunghi')}
        >
          <CalendarDays size={15} style={{ marginRight: 6, verticalAlign: '-2px' }} />
          Lịch sử Yêu cầu nghỉ ({yeuCauNghiList.length})
        </button>

        <button
          type="button"
          className={`gv-tab-btn ${activeTab === 'daythay' ? 'active' : ''}`}
          onClick={() => setActiveTab('daythay')}
        >
          <Clock size={15} style={{ marginRight: 6, verticalAlign: '-2px' }} />
          Dạy thay / Dạy bù ({dayThayList.length + dayBuList.length})
        </button>
      </div>

      {/* 3. Tab Contents */}
      {loading ? (
        <div className="table-loading-cell" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Loader2 size={32} className="animate-spin text-blue-500" style={{ margin: '0 auto 12px' }} />
          <span>Đang tải thông tin chi tiết giảng viên...</span>
        </div>
      ) : (
        <div className="table-responsive">
          {/* TAB 1: LỚP HỌC PHẦN */}
          {activeTab === 'lophocphan' && (
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>Mã Lớp HP</th>
                  <th>Tên Lớp Học Phần / Môn Học</th>
                  <th style={{ width: '140px' }}>Học Kỳ</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Hình Thức</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Phân Công</th>
                </tr>
              </thead>
              <tbody>
                {lopHocPhanList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="table-empty-cell" style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <BookOpen size={36} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                      <p>Giảng viên hiện chưa được phân công phụ trách lớp học phần nào.</p>
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
                        <div style={{ fontWeight: 600, color: 'var(--admin-text-main)', fontSize: '0.88rem' }}>
                          {lhp.TenLopHocPhan || lhp.MaLopHocPhan}
                        </div>
                        <div style={{ color: 'var(--admin-text-sub)', fontSize: '0.8rem' }}>
                          {lhp.TenMonHoc}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>
                        {lhp.TenHocKy || lhp.MaHocKy}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="role-badge">{lhp.LoaiHoc || 'Chính khóa'}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${lhp.TrangThaiPhanCong === 'Assigned' ? 'active' : ''}`}>
                          {lhp.TrangThaiPhanCong === 'Assigned' ? 'Đã gán' : lhp.TrangThaiPhanCong || 'Mặc định'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 2: YÊU CẦU NGHỈ */}
          {activeTab === 'yeucaunghi' && (
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Mã Yêu Cầu</th>
                  <th style={{ width: '130px' }}>Loại Đề Xuất</th>
                  <th>Lý Do Xin Nghỉ</th>
                  <th style={{ width: '130px' }}>Ngày Học</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {yeuCauNghiList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="table-empty-cell" style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <CalendarDays size={36} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                      <p>Giảng viên chưa gửi yêu cầu xin nghỉ dạy nào.</p>
                    </td>
                  </tr>
                ) : (
                  yeuCauNghiList.map((ycn) => (
                    <tr key={ycn.MaYeuCauNghi}>
                      <td>
                        <span className="role-badge primary" style={{ fontWeight: 600 }}>
                          {ycn.MaYeuCauNghi}
                        </span>
                      </td>
                      <td>
                        <span className="role-badge">{ycn.LoaiYeuCau}</span>
                      </td>
                      <td style={{ fontSize: '0.86rem', color: 'var(--admin-text-sub)' }}>
                        {ycn.LyDo}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {ycn.NgayHoc ? new Date(ycn.NgayHoc).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${ycn.TrangThai === 'Approved' ? 'active' : ycn.TrangThai === 'Rejected' ? 'inactive' : ''}`}>
                          {ycn.TrangThai === 'Approved' ? 'Đã duyệt' : ycn.TrangThai === 'Rejected' ? 'Từ chối' : 'Chờ duyệt'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 3: DẠY THAY / DẠY BÙ */}
          {activeTab === 'daythay' && (
            <div>
              {/* Danh sách Dạy Thay */}
              <div style={{ padding: '14px 20px 6px', fontWeight: 700, fontSize: '0.88rem', color: 'var(--admin-text-main)' }}>
                Phân Công Dạy Thay ({dayThayList.length})
              </div>
              {dayThayList.length > 0 ? (
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '150px' }}>Mã Phân Công</th>
                      <th style={{ width: '130px' }}>Ngày Dạy Thay</th>
                      <th>Lớp Học Phần</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayThayList.map(dt => (
                      <tr key={dt.MaPhanCongDayThay}>
                        <td>
                          <span className="role-badge primary" style={{ fontWeight: 600 }}>
                            {dt.MaPhanCongDayThay}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {dt.NgayHoc ? new Date(dt.NgayHoc).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>
                          {dt.MaLopHocPhan}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="status-badge active">
                            {dt.TrangThai}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="table-empty-cell" style={{ padding: '20px', fontSize: '0.84rem' }}>
                  Không có lịch sử phân công dạy thay.
                </div>
              )}

              {/* Danh sách Dạy Bù */}
              <div style={{ padding: '18px 20px 6px', fontWeight: 700, fontSize: '0.88rem', color: 'var(--admin-text-main)', borderTop: '1px solid #f1f5f9' }}>
                Đăng Ký Dạy Bù ({dayBuList.length})
              </div>
              {dayBuList.length > 0 ? (
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '150px' }}>Mã Đăng Ký</th>
                      <th style={{ width: '130px' }}>Ngày Đề Xuất</th>
                      <th>Lớp Học Phần</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayBuList.map(db => (
                      <tr key={db.MaDangKyDayBu}>
                        <td>
                          <span className="role-badge primary" style={{ fontWeight: 600 }}>
                            {db.MaDangKyDayBu}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {db.NgayDeXuat ? new Date(db.NgayDeXuat).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--admin-text-sub)' }}>
                          {db.MaLopHocPhan}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`status-badge ${db.TrangThai === 'Approved' ? 'active' : ''}`}>
                            {db.TrangThai === 'Approved' ? 'Đã duyệt' : db.TrangThai || 'Chờ duyệt'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="table-empty-cell" style={{ padding: '20px', fontSize: '0.84rem' }}>
                  Không có lịch sử đăng ký dạy bù.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
