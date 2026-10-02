import React, { useState, useEffect } from 'react';
import { apiGetRoomStatusGrid } from '../../../../utils/apiThoiKhoaBieu';
import {
  Building, CheckCircle2, AlertTriangle, AlertCircle,
  XCircle, Search, RefreshCw, Users, ShieldAlert, DoorOpen
} from 'lucide-react';
import './ThoiKhoaBieuComponents.css';

export default function RoomGridPicker({
  thuTrongTuan,
  maTiet,
  ngayBatDau,
  ngayKetThuc,
  excludeMaLopHocPhan = '',
  selectedMaPhong,
  onSelectRoom,
  siSoDuKien = 0
}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedToaNha, setSelectedToaNha] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Tự động tải danh sách trạng thái phòng khi thông tin thời gian thay đổi
  const fetchRoomStatus = async () => {
    if (!thuTrongTuan || !maTiet || !ngayBatDau || !ngayKetThuc) {
      setRooms([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await apiGetRoomStatusGrid({
        thuTrongTuan,
        maTiet,
        ngayBatDau,
        ngayKetThuc,
        excludeMaLopHocPhan
      });
      setRooms(data || []);
    } catch (err) {
      setError(err.message || 'Không thể kiểm tra trạng thái phòng học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomStatus();
  }, [thuTrongTuan, maTiet, ngayBatDau, ngayKetThuc, excludeMaLopHocPhan]);

  // Danh sách tòa nhà duy nhất để làm tab filter
  const buildings = Array.from(new Set(rooms.map(r => r.MaToaNha))).map(ma => {
    const room = rooms.find(r => r.MaToaNha === ma);
    return {
      MaToaNha: ma,
      TenToaNha: room?.TenToaNha || ma
    };
  });

  // Lọc phòng theo Tòa nhà và Search
  const filteredRooms = rooms.filter(r => {
    const matchBuilding = selectedToaNha === 'ALL' || r.MaToaNha === selectedToaNha;
    const matchSearch = searchTerm.trim() === '' ||
      r.TenPhong.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.MaPhong.toLowerCase().includes(searchTerm.toLowerCase());
    return matchBuilding && matchSearch;
  });

  // Đếm thống kê
  const availableCount = filteredRooms.filter(r => r.isAvailable).length;
  const occupiedCount = filteredRooms.filter(r => r.statusKey === 'OCCUPIED').length;
  const maintenanceCount = filteredRooms.filter(r => r.statusKey === 'MAINTENANCE').length;

  if (!thuTrongTuan || !maTiet) {
    return (
      <div className="room-picker-placeholder">
        <DoorOpen size={32} className="text-muted" />
        <p>Vui lòng chọn <strong>Thứ trong tuần</strong> và <strong>Tiết học</strong> để xem lưới phòng học khả dụng.</p>
      </div>
    );
  }

  return (
    <div className="room-grid-picker-container">
      {/* Header Bar: Bộ lọc Tòa nhà & Thống kê */}
      <div className="room-picker-toolbar">
        <div className="room-picker-tabs">
          <button
            type="button"
            className={`building-tab ${selectedToaNha === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedToaNha('ALL')}
          >
            Tất cả tòa nhà ({rooms.length})
          </button>
          {buildings.map(b => {
            const countInB = rooms.filter(r => r.MaToaNha === b.MaToaNha).length;
            return (
              <button
                key={b.MaToaNha}
                type="button"
                className={`building-tab ${selectedToaNha === b.MaToaNha ? 'active' : ''}`}
                onClick={() => setSelectedToaNha(b.MaToaNha)}
              >
                <Building size={13} />
                <span>{b.TenToaNha} ({countInB})</span>
              </button>
            );
          })}
        </div>

        <div className="room-picker-right-tools">
          <div className="room-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-refresh-rooms"
            title="Làm mới trạng thái phòng"
            onClick={fetchRoomStatus}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Status Badges Legend */}
      <div className="room-picker-legend">
        <div className="legend-item available">
          <span className="dot green"></span>
          <span>Phòng trống ({availableCount})</span>
        </div>
        <div className="legend-item occupied">
          <span className="dot red"></span>
          <span>Đã bận / Có lịch ({occupiedCount})</span>
        </div>
        <div className="legend-item maintenance">
          <span className="dot orange"></span>
          <span>Bảo trì ({maintenanceCount})</span>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="room-picker-loading">
          <RefreshCw size={24} className="spinning" />
          <span>Đang kiểm tra tình trạng phòng học...</span>
        </div>
      ) : error ? (
        <div className="room-picker-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="room-picker-empty">
          <DoorOpen size={28} />
          <span>Không tìm thấy phòng học phù hợp với bộ lọc.</span>
        </div>
      ) : (
        <div className="room-tiles-grid">
          {filteredRooms.map(room => {
            const isSelected = selectedMaPhong === room.MaPhong;
            const isAvailable = room.isAvailable;
            const isCapacityLow = siSoDuKien > 0 && room.SucChua && room.SucChua < siSoDuKien;

            let cardClass = 'room-tile-card';
            if (isSelected) cardClass += ' selected';
            if (!isAvailable) {
              cardClass += room.statusKey === 'MAINTENANCE' ? ' maintenance disabled' : ' occupied disabled';
            } else if (isCapacityLow) {
              cardClass += ' capacity-warning';
            }

            return (
              <div
                key={room.MaPhong}
                className={cardClass}
                onClick={() => {
                  if (isAvailable) {
                    onSelectRoom(room.MaPhong, room);
                  }
                }}
                title={!isAvailable ? room.statusReason : `Chọn phòng ${room.TenPhong}`}
              >
                {/* Header tile: Tên phòng + Status badge */}
                <div className="tile-header">
                  <div className="tile-title-group">
                    <span className="tile-room-name">{room.TenPhong}</span>
                    <span className="tile-building-code">{room.TenToaNha || room.MaToaNha}</span>
                  </div>
                  {isSelected ? (
                    <span className="tile-selected-check">
                      <CheckCircle2 size={16} />
                    </span>
                  ) : !isAvailable ? (
                    <span className={`tile-status-pill ${room.statusKey === 'MAINTENANCE' ? 'orange' : 'red'}`}>
                      {room.statusKey === 'MAINTENANCE' ? 'Bảo trì' : 'Đã bận'}
                    </span>
                  ) : (
                    <span className="tile-status-pill green">Trống</span>
                  )}
                </div>

                {/* Body info: Sức chứa & Loại phòng */}
                <div className="tile-body">
                  <div className="tile-meta-row">
                    <span className="tile-meta-item">
                      <Users size={12} />
                      <span>{room.SucChua || 50} chỗ</span>
                    </span>
                    <span className="tile-room-type">{room.LoaiPhong || 'Phòng học'}</span>
                  </div>

                  {/* Cảnh báo bận hoặc bảo trì */}
                  {!isAvailable && (
                    <div className="tile-occupied-note">
                      {room.statusKey === 'MAINTENANCE' ? (
                        <span><ShieldAlert size={11} /> Đang bảo trì</span>
                      ) : (
                        <span><XCircle size={11} /> {room.occupiedBy?.TenMonHoc ? `Trùng: ${room.occupiedBy.TenMonHoc}` : room.statusReason}</span>
                      )}
                    </div>
                  )}

                  {/* Cảnh báo sức chứa nhỏ hơn sĩ số */}
                  {isAvailable && isCapacityLow && (
                    <div className="tile-capacity-alert" title={`Sức chứa ${room.SucChua} chỗ nhỏ hơn sĩ số dự kiến ${siSoDuKien}`}>
                      <AlertTriangle size={11} />
                      <span>Sức chứa {room.SucChua} &lt; {siSoDuKien}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
