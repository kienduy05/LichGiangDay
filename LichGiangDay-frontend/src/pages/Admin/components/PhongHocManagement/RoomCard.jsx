import React from 'react';
import { Users, Edit, Trash2, Power } from 'lucide-react';
import './RoomCard.css';

export default function RoomCard({ room, onEdit, onDelete, onToggleStatus }) {
  const isReady = room.TrangThai === 'Ready';
  const isMaintenance = room.TrangThai === 'Maintenance';

  let statusClass = 'room-status-other';
  let statusText = 'Khác';
  if (isReady) {
    statusClass = 'room-status-ready';
    statusText = 'Sẵn sàng';
  } else if (isMaintenance) {
    statusClass = 'room-status-maintenance';
    statusText = 'Bảo trì';
  }

  return (
    <div className={`room-card-box ${statusClass}`}>
      <div className="room-card-header">
        <div className="room-card-title-group">
          <span className="room-card-name" title={room.TenPhong}>
            {room.TenPhong || room.MaPhong}
          </span>
          <span className="room-card-code">({room.MaPhong})</span>
        </div>
        <span className={`room-status-dot-badge ${statusClass}`} title={`Trạng thái: ${statusText}`}>
          <span className="dot-indicator"></span>
          {statusText}
        </span>
      </div>

      <div className="room-card-body">
        <div className="room-info-chip">
          <Users size={14} className="info-icon" />
          <span>{room.SucChua || 0} chỗ</span>
        </div>
        {room.LoaiPhong && (
          <div className="room-type-chip" title={`Loại phòng: ${room.LoaiPhong}`}>
            {room.LoaiPhong}
          </div>
        )}
      </div>

      {/* Hover Action Overlay */}
      <div className="room-card-overlay-actions">
        <button
          className="quick-action-btn btn-edit"
          title="Chỉnh sửa phòng"
          onClick={() => onEdit(room)}
        >
          <Edit size={14} />
          <span>Sửa</span>
        </button>

        <button
          className={`quick-action-btn btn-toggle ${isReady ? 'to-maintenance' : 'to-ready'}`}
          title={isReady ? 'Chuyển sang Bảo trì' : 'Chuyển sang Sẵn sàng'}
          onClick={() => onToggleStatus(room.MaPhong)}
        >
          <Power size={14} />
          <span>{isReady ? 'Đổi bảo trì' : 'Đổi mở'}</span>
        </button>

        <button
          className="quick-action-btn btn-delete"
          title="Xóa phòng"
          onClick={() => onDelete(room.MaPhong)}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
