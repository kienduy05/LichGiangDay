import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, Ban, CheckCircle2, Clock3, Edit3,
  FileWarning, Lock, RefreshCw, Rocket, XCircle
} from 'lucide-react';

const DAY_LABELS = { 2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật' };

const reasonText = reason => typeof reason === 'string' ? reason : reason?.message || reason?.code || 'Không xác định được nguyên nhân';

export default function XepLichResults({ data, onRefresh, onEdit, onApply, onCancel, onNewSession, actionLoading }) {
  const [activeTab, setActiveTab] = useState('Draft');
  const { phien, dong = [] } = data;
  const grouped = useMemo(() => ({
    Draft: dong.filter(row => row.TrangThai === 'Draft'),
    Unscheduled: dong.filter(row => row.TrangThai === 'Unscheduled'),
    MissingData: dong.filter(row => row.TrangThai === 'MissingData')
  }), [dong]);
  const rows = grouped[activeTab];
  const processing = phien.TrangThai === 'Processing';
  const datedPlan = phien.PhienBanQuyTac >= 2;
  const canEdit = phien.PhienBanQuyTac === 3 && ['Completed', 'CompletedWithWarnings'].includes(phien.TrangThai);
  const canApply = canEdit && grouped.Draft.length > 0;
  const progress = phien.TongSoLop > 0 ? Math.round((phien.SoLopDaXuLy / phien.TongSoLop) * 100) : 0;

  return (
    <div className="xlt-results">
      <div className="xlt-session-summary">
        <div className={`xlt-session-icon ${processing ? 'processing' : ''}`}>
          {processing ? <Clock3 size={22} /> : <Rocket size={22} />}
        </div>
        <div className="xlt-session-main">
          <div className="xlt-session-title-row">
            <div>
              <h3>{processing ? 'Đang tạo phương án thời khóa biểu' : 'Kết quả xếp lịch tự động'}</h3>
              <p>Mã phiên: {phien.MaPhien}</p>
            </div>
            <span className={`xlt-session-status ${phien.TrangThai}`}>{phien.TrangThai}</span>
          </div>
          <div className="xlt-progress-track"><span style={{ width: `${processing ? progress : 100}%` }} /></div>
          <div className="xlt-progress-caption">
            <span>Đã xử lý {phien.SoLopDaXuLy}/{phien.TongSoLop} lớp</span>
            {processing && <strong>{progress}%</strong>}
          </div>
          {processing && phien.MaLopDangXuLy && (
            <p>Đang xét lớp {phien.MaLopDangXuLy} · Đã thử {phien.SoViTriDaThu || 0} vị trí</p>
          )}
        </div>
        <button type="button" className="xlt-icon-button" onClick={onRefresh} title="Cập nhật kết quả">
          <RefreshCw size={18} className={processing ? 'xlt-spin' : ''} />
        </button>
      </div>

      {datedPlan && !processing && (
        <div className="xlt-workload-summary">
          <strong>{grouped.Draft.length} buổi đã xếp · {grouped.Draft.length * 3} tiết</strong>
          <p>Mỗi dòng là một ngày học cụ thể. Các buổi trong cùng nhóm cách nhau ít nhất 2 ngày, tối đa 3 buổi/tuần.</p>
          {(phien.DinhMucNhom || []).map(group => (
            <div key={group.MaNhomXep}>
              <b>Nhóm {group.NhomLop} · {group.KhoaHoc} · {group.SoTinChi} tín chỉ: </b>
              {group.members.map(member => `${member.LoaiHoc} ${grouped.Draft.filter(row => row.MaLopHocPhan === member.MaLopHocPhan).length}/${member.SoBuoiYeuCau} buổi`).join(' · ')}
            </div>
          ))}
        </div>
      )}
      {phien.PhienBanQuyTac !== 3 && !processing && phien.TrangThai !== 'Applied' && (
        <div className="xlt-inline-alert error">Phiên dùng quy tắc cũ. Vui lòng tạo phiên mới để xếp đủ tiết và giữ thứ học cố định.</div>
      )}

      <div className="xlt-result-stats">
        <div className="success"><CheckCircle2 size={18} /><span><strong>{phien.SoLopDaXep}</strong> lớp đã xếp</span></div>
        <div className="warning"><XCircle size={18} /><span><strong>{phien.SoLopKhongXep}</strong> lớp chưa xếp được</span></div>
        <div className="muted"><FileWarning size={18} /><span><strong>{phien.SoLopThieuDuLieu}</strong> lớp thiếu dữ liệu</span></div>
      </div>

      {phien.LoiHeThong && (
        <div className="xlt-inline-alert error"><AlertTriangle size={17} /><span>{phien.LoiHeThong}</span></div>
      )}

      {processing && (
        <div className="xlt-result-actions">
          <span>Đóng cửa sổ vẫn tiếp tục chạy nền. Chọn Hủy phiên để dừng.</span>
          <button type="button" className="xlt-btn danger-ghost" onClick={onCancel} disabled={actionLoading}>
            <Ban size={16} /> {actionLoading ? 'Đang hủy…' : 'Hủy phiên'}
          </button>
        </div>
      )}

      {!processing && (
        <>
          <div className="xlt-tabs">
            <button className={activeTab === 'Draft' ? 'active' : ''} onClick={() => setActiveTab('Draft')}>
              Đã xếp <span>{grouped.Draft.length} buổi</span>
            </button>
            <button className={activeTab === 'Unscheduled' ? 'active' : ''} onClick={() => setActiveTab('Unscheduled')}>
              Chưa xếp được <span>{grouped.Unscheduled.length}</span>
            </button>
            <button className={activeTab === 'MissingData' ? 'active' : ''} onClick={() => setActiveTab('MissingData')}>
              Thiếu dữ liệu <span>{grouped.MissingData.length}</span>
            </button>
          </div>

          <div className="xlt-table-wrap result-table">
            <table className="xlt-table">
              <thead>
                <tr>
                  <th>Lớp học phần</th>
                  {activeTab === 'Draft' ? (
                    <><th>Lịch đề xuất</th><th>Phòng</th><th>{datedPlan ? 'Ngày học' : 'Khoảng ngày'}</th><th>Nguồn</th><th /></>
                  ) : <th>Lý do</th>}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan="6" className="xlt-empty">Không có dữ liệu trong nhóm này.</td></tr>
                ) : rows.map(row => (
                  <tr key={row.MaDong}>
                    <td><strong>{row.MaLopHocPhan}</strong><span>{row.TenMonHoc} · {row.LoaiHoc}</span></td>
                    {activeTab === 'Draft' ? (
                      <>
                        <td><strong>{DAY_LABELS[row.ThuTrongTuan]}</strong><span>{row.TenTiet} · {row.GioBatDau}–{row.GioKetThuc}</span></td>
                        <td><strong>{row.TenPhong || row.MaPhong}</strong><span>{row.MaToaNha || ''}</span></td>
                        <td>{row.ThuCoDinh?.length > 0 && <span>Thứ cố định: {row.ThuCoDinh.map(day => day === 8 ? "CN" : day).join(", ")}</span>}{String(row.NgayBatDau).slice(0, 10)}{!datedPlan && <span>đến {String(row.NgayKetThuc).slice(0, 10)}</span>}</td>
                        <td>
                          <span className={`xlt-source ${row.NguonXep}`}>{row.NguonXep === 'Manual' ? 'Xếp tay' : 'Tự động'}</span>
                          {Boolean(row.DaKhoa) && <span className="xlt-row-lock"><Lock size={12} /> Đã khóa</span>}
                        </td>
                        <td>{canEdit && <button className="xlt-row-action" onClick={() => onEdit(row)}><Edit3 size={15} /> Sửa</button>}</td>
                      </>
                    ) : (
                      <td>
                        <div className="xlt-reason-list">
                          {(row.LyDo || []).map((reason, index) => (
                            <span key={index}><AlertTriangle size={14} /> {reasonText(reason)}</span>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="xlt-result-actions">
            <button type="button" className="xlt-btn secondary" onClick={onNewSession} disabled={actionLoading}>
              Tạo phiên mới
            </button>
            <button type="button" className="xlt-btn danger-ghost" onClick={onCancel} disabled={actionLoading || phien.TrangThai === 'Applied'}>
              <Ban size={16} /> Hủy phiên
            </button>
            <button type="button" className="xlt-btn primary" onClick={onApply} disabled={actionLoading || !canApply}>
              <CheckCircle2 size={16} /> {actionLoading ? 'Đang xử lý…' : `Áp dụng ${phien.SoLopDaXep} lớp`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

