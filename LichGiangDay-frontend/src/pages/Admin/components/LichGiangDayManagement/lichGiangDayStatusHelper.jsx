import React from 'react';

/**
 * Trả về class CSS và Badge hiển thị trạng thái biến động buổi học
 * @param {Object} item - Thông tin buổi học
 * @returns {{ statusClass: string, statusBadge: React.ReactNode, statusLabel: string }}
 */
export const getStatusCardProps = (item) => {
  if (!item) {
    return { statusClass: 'status-card-normal', statusBadge: null, statusLabel: 'Bình thường' };
  }

  const status = item.TrangThai || 'Normal';
  let statusClass = 'status-card-normal';
  let statusBadge = null;
  let statusLabel = 'Bình thường';

  if (status.includes('_Pending')) {
    statusClass = 'status-card-pending';
    const label = status === 'Absence_Pending'
      ? 'Chờ duyệt nghỉ'
      : status === 'Swap_Pending'
        ? 'Chờ duyệt đổi ca'
        : 'Chờ duyệt dạy thay';
    statusLabel = label;
    statusBadge = (
      <span className="status-badge-pill status-badge-pending" title={`⏳ ${label}`}>
        ⏳ {label}
      </span>
    );
  } else if (status === 'Absent') {
    statusClass = 'status-card-absent';
    const label = `Đã nghỉ ${item.DaDayBu ? '(Đã bù)' : '(Chưa bù)'}`;
    statusLabel = label;
    statusBadge = (
      <span className="status-badge-pill status-badge-absent" title={`⛔ ${label}`}>
        ⛔ {label}
      </span>
    );
  } else if (status === 'Substituted') {
    statusClass = 'status-card-substituted';
    const label = `Dạy thay (${item.TenGiangVien || 'GV'})`;
    statusLabel = label;
    statusBadge = (
      <span className="status-badge-pill status-badge-substituted" title={`🔄 ${label}`}>
        🔄 {label}
      </span>
    );
  } else if (status === 'Swapped') {
    statusClass = 'status-card-swapped';
    statusLabel = 'Đã đổi ca';
    statusBadge = (
      <span className="status-badge-pill status-badge-swapped" title="🔀 Đã đổi ca">
        🔀 Đã đổi ca
      </span>
    );
  } else if (item.LoaiBuoiHoc === 'Makeup') {
    statusClass = 'status-card-makeup';
    statusLabel = 'Dạy bù';
    statusBadge = (
      <span className="status-badge-pill status-badge-makeup" title="➕ Dạy Bù">
        ➕ Dạy Bù
      </span>
    );
  }

  return { statusClass, statusBadge, statusLabel };
};
