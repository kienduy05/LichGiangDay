import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Search } from 'lucide-react';

export default function XepLichClassList({
  classes,
  selectedIds,
  onSelectedIdsChange,
  search,
  onSearchChange,
  loading
}) {
  const readyRows = useMemo(() => classes.filter(row => row.trangThaiDuLieu === 'Ready'), [classes]);
  const allReadySelected = readyRows.length > 0 && readyRows.every(row => selectedIds.includes(row.MaLopHocPhan));

  const toggleAll = () => {
    onSelectedIdsChange(allReadySelected ? [] : readyRows.map(row => row.MaLopHocPhan));
  };

  const toggleOne = (id) => {
    onSelectedIdsChange(
      selectedIds.includes(id) ? selectedIds.filter(value => value !== id) : [...selectedIds, id]
    );
  };

  return (
    <div className="xlt-class-section">
      <div className="xlt-section-toolbar">
        <div>
          <h3>Lớp học phần chưa xếp lịch</h3>
          <p>Đã chọn {selectedIds.length}/{readyRows.length} lớp đủ dữ liệu</p>
        </div>
        <div className="xlt-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm mã lớp hoặc môn học"
          />
        </div>
      </div>

      <div className="xlt-table-wrap">
        <table className="xlt-table">
          <thead>
            <tr>
              <th className="xlt-check-cell">
                <input type="checkbox" checked={allReadySelected} onChange={toggleAll} disabled={readyRows.length === 0} />
              </th>
              <th>Lớp học phần</th>
              <th>Loại</th>
              <th>Sĩ số</th>
              <th>Định mức</th>
              <th>Trạng thái dữ liệu</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="xlt-empty">Đang tải danh sách lớp học phần…</td></tr>
            ) : classes.length === 0 ? (
              <tr><td colSpan="6" className="xlt-empty">Không có lớp học phần chưa xếp lịch trong phạm vi này.</td></tr>
            ) : classes.map(row => {
              const ready = row.trangThaiDuLieu === 'Ready';
              const size = row.SiSoDangKy || row.SiSoDuKien || 0;
              return (
                <tr key={row.MaLopHocPhan} className={!ready ? 'is-missing' : ''}>
                  <td className="xlt-check-cell">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.MaLopHocPhan)}
                      onChange={() => toggleOne(row.MaLopHocPhan)}
                      disabled={!ready}
                    />
                  </td>
                  <td>
                    <strong>{row.MaLopHocPhan}</strong>
                    <span>{row.TenMonHoc || row.TenLopHocPhan}</span>
                  </td>
                  <td><span className="xlt-type-badge">{row.LoaiHoc}</span></td>
                  <td>{size}</td>
                  <td>{ready ? `${row.SoBuoiMoiTuan} buổi/tuần · ${row.SoTuanDinhMuc} tuần` : '—'}</td>
                  <td>
                    {ready ? (
                      <span className="xlt-status ready"><CheckCircle2 size={14} /> Đủ dữ liệu</span>
                    ) : (
                      <div className="xlt-missing-reasons">
                        <span className="xlt-status missing"><AlertTriangle size={14} /> Thiếu dữ liệu</span>
                        {(row.lyDoThieuDuLieu || []).map(reason => <small key={reason}>{reason}</small>)}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

