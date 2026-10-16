import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar, Clock, BookOpen, AlertCircle, CalendarPlus,
  Bell, LogOut, CheckCircle2, ChevronRight, User, School,
  ArrowRight, ShieldAlert, Sparkles, Filter, X, RefreshCw
} from 'lucide-react';
import {
  apiGetLichGiangVien,
  apiGetYeuCauCuaToi,
  apiHuyYeuCau,
  apiGetCaNghiChuaDayBu,
  apiGetThongBao,
  apiCountThongBaoChuaDoc,
  apiMarkThongBaoDaDoc
} from '../../utils/apiBienDongLich';
import TaoLichDayBuModal from './components/TaoLichDayBuModal';
import './LecturerHome.css';

export default function LecturerHome({ onOpenSchedule }) {
  const { user, logout } = useAuth();

  // State
  const [todayClasses, setTodayClasses] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [caChuaBuList, setCaChuaBuList] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [myRequestsModalOpen, setMyRequestsModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [dayBuModalOpen, setDayBuModalOpen] = useState(false);
  const [selectedCaNghi, setSelectedCaNghi] = useState(null);

  // Filter in My Requests modal
  const [filterLoai, setFilterLoai] = useState('ALL');
  const [filterTrangThai, setFilterTrangThai] = useState('ALL');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().slice(0, 10);

      // 1. Lấy lịch hôm nay
      const mySchedule = await apiGetLichGiangVien({ tuNgay: todayStr, denNgay: todayStr }).catch(() => []);
      setTodayClasses(mySchedule || []);

      // 2. Lấy đơn của tôi
      const requests = await apiGetYeuCauCuaToi().catch(() => []);
      setPendingRequests(requests || []);
      const pendingCount = (requests || []).filter(r => r.TrangThai === 'Pending').length;
      setPendingRequestsCount(pendingCount);

      // 3. Lấy ca nghỉ chưa bù
      const caChuaBu = await apiGetCaNghiChuaDayBu({}).catch(() => []);
      setCaChuaBuList(caChuaBu || []);

      // 4. Lấy thông báo
      const unread = await apiCountThongBaoChuaDoc().catch(() => ({ unreadCount: 0 }));
      setUnreadNotificationsCount(unread?.unreadCount || 0);

      const notifs = await apiGetThongBao().catch(() => []);
      setNotifications(notifs || []);
    } catch (err) {
      console.warn('Load dashboard error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu này không? Buổi học sẽ được hoàn nguyên về bình thường.')) {
      return;
    }
    try {
      await apiHuyYeuCau(id);
      showToast('Đã hủy yêu cầu thành công!');
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Hủy yêu cầu thất bại.');
    }
  };

  const handleOpenDayBuWithCa = (ca) => {
    setSelectedCaNghi(ca);
    setDayBuModalOpen(true);
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await apiMarkThongBaoDaDoc('all');
      setUnreadNotificationsCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, DaDoc: 1 })));
      showToast('Đã đánh dấu tất cả thông báo là đã đọc.');
    } catch (err) {
      console.error(err);
    }
  };

  const hasOverdueMakeup = caChuaBuList.some(c => c.overdueWarning);

  const filteredRequests = pendingRequests.filter(r => {
    if (filterLoai !== 'ALL' && r.LoaiYeuCau !== filterLoai) return false;
    if (filterTrangThai !== 'ALL' && r.TrangThai !== filterTrangThai) return false;
    return true;
  });

  return (
    <div className="lec-home-container">
      {/* Toast */}
      {toastMsg && (
        <div className="lec-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP NAVBAR */}
      <header className="lec-home-header">
        <div className="lec-header-brand">
          <div className="lec-brand-icon">
            <School size={22} />
          </div>
          <div>
            <h1 className="lec-brand-title">CỔNG GIẢNG VIÊN</h1>
            <p className="lec-brand-subtitle">Trường Đại Học Giao Thông Vận Tải</p>
          </div>
        </div>

        <div className="lec-header-actions">
          {/* Notification Bell */}
          <button
            className="lec-notif-btn"
            onClick={() => setNotificationsModalOpen(true)}
            title="Xem thông báo"
          >
            <Bell size={20} />
            {unreadNotificationsCount > 0 && (
              <span className="lec-notif-badge">{unreadNotificationsCount}</span>
            )}
          </button>

          {/* User Profile Pill */}
          <div className="lec-user-pill">
            <div className="lec-user-avatar">
              <User size={18} />
            </div>
            <div className="lec-user-details">
              <span className="lec-user-name">{user?.fullName || 'ThS. Nguyễn Lê Minh'}</span>
              <span className="lec-user-role">Mã GV: {user?.maGiangVien || 'NLM001'}</span>
            </div>
          </div>

          {/* Logout button */}
          <button className="lec-logout-btn" onClick={logout} title="Đăng xuất">
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="lec-home-main">
        {/* HERO GREETING CARD */}
        <section className="lec-hero-banner">
          <div className="lec-hero-text">
            <h2>Xin chào, {user?.fullName || 'Thầy Nguyễn Lê Minh'}! 👋</h2>
            <p>
              Chào mừng bạn đến với Cổng thông tin Giảng dạy cá nhân. Bạn có thể tra cứu lịch dạy theo tuần, gửi yêu cầu báo nghỉ, đổi ca, nhờ đồng nghiệp dạy thay hoặc tổ chức lịch dạy bù.
            </p>
            <div className="lec-profile-chips">
              <span className="lec-chip"><strong>Khoa:</strong> Công Nghệ Thông Tin</span>
              <span className="lec-chip"><strong>Bộ môn:</strong> Mạng máy tính & HTTT</span>
              <span className="lec-chip"><strong>Trạng thái:</strong> <span className="status-dot"></span> Đang hoạt động</span>
            </div>
          </div>

          <div className="lec-summary-widget">
            <div className="lec-widget-header">
              <Clock size={16} />
              <span>HÔM NAY ({new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })})</span>
            </div>
            <div className="lec-widget-body">
              <div className="lec-class-count-large">{todayClasses.length}</div>
              <div className="lec-class-count-desc">buổi giảng dạy được lên lịch trong ngày</div>
            </div>
            {todayClasses.length > 0 && (
              <div className="lec-today-list">
                {todayClasses.map((c, i) => (
                  <div key={i} className="lec-today-item">
                    <span className="today-period">{c.TenTiet}</span>
                    <span className="today-class-name" title={c.TenLopHocPhan}>{c.TenMonHoc || c.TenLopHocPhan}</span>
                    <span className="today-room">{c.TenPhong}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 4 PRIMARY ACTION CARDS */}
        <section className="lec-action-grid">
          {/* Card 1: Xem Lịch Giảng Dạy */}
          <div className="lec-action-card card-schedule" onClick={onOpenSchedule}>
            <div className="card-icon-wrap icon-blue">
              <Calendar size={28} />
            </div>
            <div className="card-content">
              <h3>Xem Lịch Giảng Dạy</h3>
              <p>Tra cứu ma trận thời khóa biểu tuần cá nhân 5 ca × 7 ngày, in lịch và gửi yêu cầu trên từng buổi học.</p>
              <div className="card-cta">
                <span>Vào xem lịch tuần</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>

          {/* Card 2: Yêu Cầu Của Tôi */}
          <div className="lec-action-card card-requests" onClick={() => setMyRequestsModalOpen(true)}>
            <div className="card-icon-wrap icon-amber">
              <BookOpen size={28} />
            </div>
            <div className="card-content">
              <div className="card-title-row">
                <h3>Yêu Cầu Của Tôi</h3>
                {pendingRequestsCount > 0 && (
                  <span className="badge-count-pending">{pendingRequestsCount} chờ duyệt</span>
                )}
              </div>
              <p>Theo dõi tiến trình duyệt đơn Báo nghỉ, Đổi ca, Nhờ dạy thay và hủy đơn khi chưa được phê duyệt.</p>
              <div className="card-cta">
                <span>Xem danh sách đơn ({pendingRequests.length})</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Card 3: Tạo Lịch Dạy Bù */}
          <div className="lec-action-card card-makeup" onClick={() => { setSelectedCaNghi(null); setDayBuModalOpen(true); }}>
            <div className="card-icon-wrap icon-emerald">
              <CalendarPlus size={28} />
            </div>
            <div className="card-content">
              <div className="card-title-row">
                <h3>Tạo Lịch Dạy Bù</h3>
                {caChuaBuList.length > 0 && (
                  <span className={`badge-count-makeup ${hasOverdueMakeup ? 'overdue' : ''}`}>
                    {caChuaBuList.length} ca chưa bù {hasOverdueMakeup && '⚠️'}
                  </span>
                )}
              </div>
              <p>Tra cứu phòng học trống trong 7 ngày theo sức chứa, tự động xác nhận lịch dạy bù theo quy định.</p>
              <div className="card-cta">
                <span>Đăng ký ca bù</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Card 4: Thông Báo */}
          <div className="lec-action-card card-notif" onClick={() => setNotificationsModalOpen(true)}>
            <div className="card-icon-wrap icon-indigo">
              <Bell size={28} />
            </div>
            <div className="card-content">
              <div className="card-title-row">
                <h3>Thông Báo Hệ Thống</h3>
                {unreadNotificationsCount > 0 && (
                  <span className="badge-count-unread">{unreadNotificationsCount} mới</span>
                )}
              </div>
              <p>Nhận thông báo cập nhật kết quả duyệt đơn từ Trưởng bộ môn và can thiệp điều phối từ Phòng Đào Tạo.</p>
              <div className="card-cta">
                <span>Mở hộp thông báo</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        </section>

        {/* CẢNH BÁO CA NGHỈ QUÁ HẠN NẾU CÓ */}
        {hasOverdueMakeup && (
          <section className="lec-warning-banner">
            <AlertCircle size={22} />
            <div style={{ flex: 1 }}>
              <h4>Cảnh báo: Bạn có ca nghỉ quá 14 ngày chưa lập lịch dạy bù!</h4>
              <p>Theo quy chế đào tạo, các buổi học đã báo nghỉ phải được tổ chức dạy bù trong vòng 14 ngày. Vui lòng bấm để chọn ca và đăng ký phòng học ngay.</p>
            </div>
            <button className="btn-resolve-makeup" onClick={() => { setSelectedCaNghi(caChuaBuList[0]); setDayBuModalOpen(true); }}>
              Xử lý ca bù ngay
            </button>
          </section>
        )}
      </main>

      {/* ========================================================
          MODAL: YÊU CẦU CỦA TÔI
          ======================================================== */}
      {myRequestsModalOpen && (
        <div className="lec-modal-backdrop" onClick={() => setMyRequestsModalOpen(false)}>
          <div className="lec-modal-box large" onClick={e => e.stopPropagation()}>
            <div className="lec-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <BookOpen size={20} />
                <h3>Danh Sách Yêu Cầu Giảng Dạy Của Tôi</h3>
              </div>
              <button className="lec-close-btn" onClick={() => setMyRequestsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="lec-modal-toolbar">
              <div className="filter-group">
                <label>Loại yêu cầu:</label>
                <select value={filterLoai} onChange={e => setFilterLoai(e.target.value)}>
                  <option value="ALL">Tất cả loại</option>
                  <option value="ABSENCE">Báo nghỉ</option>
                  <option value="SWAP">Đổi ca</option>
                  <option value="SUBSTITUTE">Nhờ dạy thay</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Trạng thái:</label>
                <select value={filterTrangThai} onChange={e => setFilterTrangThai(e.target.value)}>
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="Pending">Đang chờ duyệt</option>
                  <option value="Approved">Đã duyệt</option>
                  <option value="Rejected">Bị từ chối</option>
                  <option value="Cancelled">Đã hủy</option>
                  <option value="Revoked">Bị thu hồi</option>
                </select>
              </div>

              <button className="btn-refresh" onClick={loadDashboardData} title="Tải lại">
                <RefreshCw size={14} /> Làm mới
              </button>
            </div>

            <div className="lec-modal-body">
              {filteredRequests.length === 0 ? (
                <div className="empty-state">
                  <p>Không tìm thấy yêu cầu nào phù hợp.</p>
                </div>
              ) : (
                <div className="requests-table-wrap">
                  <table className="lec-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Loại yêu cầu</th>
                        <th>Lớp học phần</th>
                        <th>Ca học gốc</th>
                        <th>Đề xuất mới</th>
                        <th>Thời gian gửi</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map(r => (
                        <tr key={r.MaYeuCauNghi}>
                          <td><strong>{r.MaYeuCauNghi}</strong></td>
                          <td>
                            <span className={`tag-type ${r.LoaiYeuCau?.toLowerCase()}`}>
                              {r.LoaiYeuCau === 'ABSENCE' ? 'Báo nghỉ' : r.LoaiYeuCau === 'SWAP' ? 'Đổi ca' : 'Dạy thay'}
                            </span>
                          </td>
                          <td>
                            <div className="cell-class-name">{r.TenMonHoc || r.TenLopHocPhan}</div>
                            <div className="cell-sub">{r.MaLopHocPhan}</div>
                          </td>
                          <td>
                            <div>{r.NgayHoc ? new Date(r.NgayHoc).toLocaleDateString('vi-VN') : '-'}</div>
                            <div className="cell-sub">{r.TenTiet} • {r.TenPhong}</div>
                          </td>
                          <td>
                            {r.LoaiYeuCau === 'SWAP' && (
                              <div>
                                <div>{r.NgayDeXuat ? new Date(r.NgayDeXuat).toLocaleDateString('vi-VN') : '-'}</div>
                                <div className="cell-sub">{r.TenTietDeXuat} • {r.TenPhongDeXuat}</div>
                              </div>
                            )}
                            {r.LoaiYeuCau === 'SUBSTITUTE' && (
                              <div>GV: <strong>{r.TenGiangVienDeXuat || r.MaGiangVienDeXuat}</strong></div>
                            )}
                            {r.LoaiYeuCau === 'ABSENCE' && (
                              <div className="cell-sub">{r.LyDo}</div>
                            )}
                          </td>
                          <td>{r.ThoiGianGuiStr || r.ThoiGianGui}</td>
                          <td>
                            <span className={`tag-status ${r.TrangThai?.toLowerCase()}`}>
                              {r.TrangThai === 'Pending' ? 'Chờ duyệt' :
                               r.TrangThai === 'Approved' ? 'Đã duyệt' :
                               r.TrangThai === 'Rejected' ? 'Từ chối' :
                               r.TrangThai === 'Revoked' ? 'Bị thu hồi' : 'Đã hủy'}
                            </span>
                            {r.LyDoTuChoi && (
                              <div className="rejection-reason" title={r.LyDoTuChoi}>
                                Lý do: {r.LyDoTuChoi}
                              </div>
                            )}
                          </td>
                          <td>
                            {r.TrangThai === 'Pending' && (
                              <button
                                className="btn-cancel-req"
                                onClick={() => handleCancelRequest(r.MaYeuCauNghi)}
                              >
                                Hủy đơn
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: THÔNG BÁO HỆ THỐNG
          ======================================================== */}
      {notificationsModalOpen && (
        <div className="lec-modal-backdrop" onClick={() => setNotificationsModalOpen(false)}>
          <div className="lec-modal-box medium" onClick={e => e.stopPropagation()}>
            <div className="lec-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bell size={20} />
                <h3>Thông Báo Hệ Thống</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {unreadNotificationsCount > 0 && (
                  <button className="btn-mark-all" onClick={handleMarkAllNotifsRead}>
                    Đánh dấu đã đọc tất cả
                  </button>
                )}
                <button className="lec-close-btn" onClick={() => setNotificationsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="lec-modal-body">
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <p>Bạn không có thông báo nào mới.</p>
                </div>
              ) : (
                <div className="notif-list">
                  {notifications.map(n => (
                    <div key={n.MaThongBao} className={`notif-card ${n.DaDoc ? 'read' : 'unread'}`}>
                      <div className="notif-top">
                        <span className="notif-title">{n.TieuDe || 'Thông báo từ hệ thống'}</span>
                        <span className="notif-time">{new Date(n.ThoiGianGui).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="notif-content">{n.NoiDung}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ĐĂNG KÝ DẠY BÙ
          ======================================================== */}
      <TaoLichDayBuModal
        isOpen={dayBuModalOpen}
        onClose={() => { setDayBuModalOpen(false); loadDashboardData(); }}
        defaultClass={selectedCaNghi}
      />
    </div>
  );
}
