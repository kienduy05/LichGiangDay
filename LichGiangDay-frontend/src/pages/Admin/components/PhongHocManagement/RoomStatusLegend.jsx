import React from 'react';
import { LayoutGrid, Table } from 'lucide-react';
import './RoomStatusLegend.css';

export default function RoomStatusLegend({ viewMode, setViewMode }) {
  return (
    <div className="diagram-toolbar-container">
      <div className="status-legend-bar">
        <span className="legend-label">Chú thích trạng thái:</span>
        <div className="legend-item legend-ready">
          <span className="legend-dot green"></span>
          <span>Sẵn sàng (Ready)</span>
        </div>
        <div className="legend-item legend-maintenance">
          <span className="legend-dot orange"></span>
          <span>Bảo trì (Maintenance)</span>
        </div>
        <div className="legend-item legend-other">
          <span className="legend-dot gray"></span>
          <span>Khác</span>
        </div>
      </div>

      <div className="view-toggle-btn-group">
        <button
          className={`view-toggle-btn ${viewMode === 'diagram' ? 'active' : ''}`}
          onClick={() => setViewMode('diagram')}
          title="Xem dạng Sơ đồ Tòa nhà -> Tầng -> Phòng"
        >
          <LayoutGrid size={16} />
          <span>Sơ đồ</span>
        </button>
        <button
          className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
          title="Xem dạng Bảng truyền thống"
        >
          <Table size={16} />
          <span>Bảng</span>
        </button>
      </div>
    </div>
  );
}
