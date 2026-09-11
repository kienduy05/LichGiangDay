import React from 'react';
import RoomCard from './RoomCard';
import { Layers } from 'lucide-react';
import './FloorRow.css';

export default function FloorRow({ floorData, onEditRoom, onDeleteRoom, onToggleStatus }) {
  const { floorLabel, rooms } = floorData;

  return (
    <div className="floor-row-wrapper">
      <div className="floor-badge-column">
        <div className="floor-badge">
          <Layers size={15} className="floor-badge-icon" />
          <span className="floor-badge-text">{floorLabel}</span>
          <span className="floor-room-count">({rooms.length} phòng)</span>
        </div>
      </div>

      <div className="floor-rooms-grid">
        {rooms.map((room) => (
          <RoomCard
            key={room.MaPhong}
            room={room}
            onEdit={onEditRoom}
            onDelete={onDeleteRoom}
            onToggleStatus={onToggleStatus}
          />
        ))}
      </div>
    </div>
  );
}
