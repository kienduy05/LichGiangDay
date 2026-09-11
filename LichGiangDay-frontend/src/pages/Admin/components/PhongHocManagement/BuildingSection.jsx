import React, { useState } from 'react';
import FloorRow from './FloorRow';
import { Building2, ChevronDown, ChevronUp, CheckCircle, Wrench, Users, Home } from 'lucide-react';
import './BuildingSection.css';

export default function BuildingSection({
  building,
  onEditRoom,
  onDeleteRoom,
  onToggleStatus
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    buildingCode,
    buildingName,
    floors,
    totalRooms,
    totalCapacity,
    readyRooms,
    maintenanceRooms
  } = building;

  return (
    <div className={`building-section-card ${!isExpanded ? 'collapsed' : ''}`}>
      <div
        className="building-header"
        onClick={() => setIsExpanded(!isExpanded)}
        title="Nhấn để thu gọn hoặc mở rộng danh sách tầng"
      >
        <div className="building-header-left">
          <div className="building-icon-wrapper">
            <Building2 size={22} className="building-main-icon" />
          </div>
          <div className="building-title-group">
            <h3 className="building-name">{buildingName}</h3>
            {buildingCode !== 'UNCLASSIFIED' && (
              <span className="building-code-badge">Mã tòa: {buildingCode}</span>
            )}
          </div>
        </div>

        <div className="building-header-right">
          <div className="building-stats-strip">
            <span className="stat-badge total-rooms" title="Tổng số phòng">
              <Home size={13} /> {totalRooms} phòng
            </span>
            <span className="stat-badge total-capacity" title="Tổng sức chứa">
              <Users size={13} /> {totalCapacity} chỗ
            </span>
            <span className="stat-badge status-ready" title="Phòng sẵn sàng">
              <CheckCircle size={13} /> {readyRooms} sẵn sàng
            </span>
            {maintenanceRooms > 0 && (
              <span className="stat-badge status-maintenance" title="Phòng đang bảo trì">
                <Wrench size={13} /> {maintenanceRooms} bảo trì
              </span>
            )}
          </div>

          <button className="expand-toggle-btn" aria-label="Toggle building display">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="building-body">
          {floors.length === 0 ? (
            <div className="building-empty-state">
              <p>Không có phòng học nào phù hợp với bộ lọc hiện tại trong tòa nhà này.</p>
            </div>
          ) : (
            floors.map((floorData) => (
              <FloorRow
                key={floorData.floorNumber}
                floorData={floorData}
                onEditRoom={onEditRoom}
                onDeleteRoom={onDeleteRoom}
                onToggleStatus={onToggleStatus}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
