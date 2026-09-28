/**
 * Utility parse thông tin phòng học và tòa nhà
 * Hỗ trợ các định dạng mã phòng:
 *  - Format chuẩn theo quy tắc: {số_phòng}_{mã_tòa} (VD: '101_A2', 'P201_A6', '1005_A2')
 *  - Format có tiền tố/gạch ngang: {mã_tòa}-{số_phòng} hoặc P{số_phòng} (VD: 'A1-101', 'P102', '201')
 *  - Phòng trực tuyến/đặc thù: 'ONLINE', 'ZOOM_01', 'HOITRUONG', 'LAB_1',...
 */

export function parseRoomCode(maPhong, maToaNha = '', tenPhong = '', loaiPhong = '') {
  const safeMaPhong = typeof maPhong === 'string' ? maPhong.trim() : '';
  const safeMaToaNha = typeof maToaNha === 'string' ? maToaNha.trim() : '';
  const safeTenPhong = typeof tenPhong === 'string' ? tenPhong.trim() : '';
  const safeLoaiPhong = typeof loaiPhong === 'string' ? loaiPhong.trim() : '';

  // 1. Kiểm tra phòng trực tuyến / online
  const isOnline =
    safeMaToaNha.toUpperCase().includes('ONLINE') ||
    safeMaToaNha.toUpperCase().includes('TRUCTUYEN') ||
    safeMaPhong.toUpperCase().includes('ONLINE') ||
    safeMaPhong.toUpperCase().includes('TRUCTUYEN') ||
    safeMaPhong.toUpperCase().includes('ZOOM') ||
    safeMaPhong.toUpperCase().includes('MEET') ||
    safeTenPhong.toLowerCase().includes('trực tuyến') ||
    safeTenPhong.toLowerCase().includes('online') ||
    safeLoaiPhong.toLowerCase().includes('trực tuyến') ||
    safeLoaiPhong.toLowerCase().includes('online');

  if (isOnline) {
    return {
      buildingCode: safeMaToaNha || 'ONLINE',
      floor: 0,
      floorLabel: 'Phòng trực tuyến',
      roomNumber: 0,
      rawRoomNumber: safeMaPhong || 'ONLINE',
      isOnline: true,
      isUnclassified: !safeMaToaNha && !safeMaPhong
    };
  }

  // 2. Tách phần số phòng & mã tòa nhà nếu có trong chuỗi mã phòng
  let roomPart = safeMaPhong;
  let inferredBuildingCode = safeMaToaNha;

  const lastUnderscoreIndex = safeMaPhong.lastIndexOf('_');
  const lastHyphenIndex = safeMaPhong.lastIndexOf('-');

  if (lastUnderscoreIndex !== -1) {
    roomPart = safeMaPhong.substring(0, lastUnderscoreIndex).trim();
    if (!inferredBuildingCode) {
      inferredBuildingCode = safeMaPhong.substring(lastUnderscoreIndex + 1).trim();
    }
  } else if (lastHyphenIndex !== -1) {
    const partBefore = safeMaPhong.substring(0, lastHyphenIndex).trim();
    const partAfter = safeMaPhong.substring(lastHyphenIndex + 1).trim();
    // Nếu phần sau là số -> phần trước là tòa nhà (vd: A1-201)
    if (/\d/.test(partAfter)) {
      roomPart = partAfter;
      if (!inferredBuildingCode) inferredBuildingCode = partBefore;
    } else {
      roomPart = partBefore;
      if (!inferredBuildingCode) inferredBuildingCode = partAfter;
    }
  }

  // 3. Tách số tầng & số phòng từ roomPart (chỉ lấy các chữ số)
  const numericStr = roomPart.replace(/\D/g, '');

  if (!numericStr) {
    return {
      buildingCode: inferredBuildingCode || 'UNCLASSIFIED',
      floor: 0,
      floorLabel: 'Khu vực chung / Khác',
      roomNumber: 0,
      rawRoomNumber: roomPart || safeMaPhong,
      isOnline: false,
      isUnclassified: !inferredBuildingCode
    };
  }

  // Nếu chỉ có 1-2 chữ số (VD: '1', '02', '12', 'P5') -> Tầng 1
  if (numericStr.length <= 2) {
    const rNum = parseInt(numericStr, 10) || 1;
    return {
      buildingCode: inferredBuildingCode || 'UNCLASSIFIED',
      floor: 1,
      floorLabel: 'Tầng 1',
      roomNumber: rNum,
      rawRoomNumber: roomPart,
      isOnline: false,
      isUnclassified: !inferredBuildingCode
    };
  }

  // Nếu có từ 3 chữ số trở lên (VD: '101' -> Tầng 1 Phòng 1; '202' -> Tầng 2 Phòng 2; '1005' -> Tầng 10 Phòng 5)
  const roomNumStr = numericStr.slice(-2);
  const floorStr = numericStr.slice(0, -2);

  const roomNumber = parseInt(roomNumStr, 10) || 0;
  const floor = parseInt(floorStr, 10) || 1;

  return {
    buildingCode: inferredBuildingCode || 'UNCLASSIFIED',
    floor,
    floorLabel: `Tầng ${floor}`,
    roomNumber,
    rawRoomNumber: roomPart,
    isOnline: false,
    isUnclassified: !inferredBuildingCode
  };
}

/**
 * Gom nhóm danh sách phòng học theo Tòa nhà -> Tầng (Giảm dần) -> Danh sách phòng
 */
export function groupRoomsByBuildingAndFloor(phongHocList = [], toaNhaList = []) {
  const toaNhaMap = new Map();
  toaNhaList.forEach((tn) => {
    if (tn && tn.MaToaNha) {
      toaNhaMap.set(tn.MaToaNha, tn.TenToaNha || tn.MaToaNha);
    }
  });

  const buildingsGroupMap = new Map();

  phongHocList.forEach((room) => {
    const rawMaToaNha = room.MaToaNha?.trim() || '';
    const parsed = parseRoomCode(room.MaPhong, rawMaToaNha, room.TenPhong, room.LoaiPhong);

    // Ưu tiên cao nhất: MaToaNha gắn trực tiếp trên bản ghi phòng học
    let buildingKey = rawMaToaNha || parsed.buildingCode;
    if (!buildingKey || buildingKey === 'UNCLASSIFIED') {
      buildingKey = 'UNCLASSIFIED';
    }

    const isUnclassified = buildingKey === 'UNCLASSIFIED';
    let buildingName = 'Chưa phân loại';
    if (!isUnclassified) {
      buildingName = toaNhaMap.get(buildingKey) || room.TenToaNha || (buildingKey.startsWith('Tòa') ? buildingKey : `Tòa ${buildingKey}`);
    }

    if (!buildingsGroupMap.has(buildingKey)) {
      buildingsGroupMap.set(buildingKey, {
        buildingCode: buildingKey,
        buildingName: buildingName,
        floorsMap: new Map(),
        totalRooms: 0,
        totalCapacity: 0,
        readyRooms: 0,
        maintenanceRooms: 0
      });
    }

    const buildingObj = buildingsGroupMap.get(buildingKey);
    buildingObj.totalRooms += 1;
    buildingObj.totalCapacity += Number(room.SucChua || 0);

    if (room.TrangThai === 'Ready') buildingObj.readyRooms += 1;
    else if (room.TrangThai === 'Maintenance') buildingObj.maintenanceRooms += 1;

    const floorKey = parsed.floorLabel || `Tầng ${parsed.floor}`;
    if (!buildingObj.floorsMap.has(floorKey)) {
      buildingObj.floorsMap.set(floorKey, {
        floorNumber: parsed.floor,
        floorLabel: parsed.floorLabel,
        isOnline: parsed.isOnline,
        rooms: []
      });
    }

    buildingObj.floorsMap.get(floorKey).rooms.push({
      ...room,
      parsedInfo: parsed
    });
  });

  // Chuyển Map thành mảng và sắp xếp
  const resultBuildings = Array.from(buildingsGroupMap.values()).map((buildingObj) => {
    const sortedFloors = Array.from(buildingObj.floorsMap.values())
      .map((floorGroup) => {
        // Sắp xếp các phòng trong tầng theo số phòng tăng dần, sau đó theo mã phòng
        const sortedRooms = [...floorGroup.rooms].sort((a, b) => {
          if (a.parsedInfo.roomNumber !== b.parsedInfo.roomNumber) {
            return a.parsedInfo.roomNumber - b.parsedInfo.roomNumber;
          }
          return (a.MaPhong || '').localeCompare(b.MaPhong || '');
        });

        return {
          floorNumber: floorGroup.floorNumber,
          floorLabel: floorGroup.floorLabel,
          rooms: sortedRooms
        };
      })
      .sort((a, b) => {
        // Tầng có số tầng dương xếp giảm dần (Tầng 5 -> Tầng 1)
        // Tầng 0 (Trực tuyến hoặc Khu vực chung) xếp xuống cuối nếu có nhiều tầng
        if (a.floorNumber === 0 && b.floorNumber !== 0) return 1;
        if (b.floorNumber === 0 && a.floorNumber !== 0) return -1;
        return b.floorNumber - a.floorNumber;
      });

    return {
      ...buildingObj,
      floors: sortedFloors
    };
  });

  // Đưa Tòa chưa phân loại xuống cuối cùng, các tòa khác xếp theo Alphabet
  resultBuildings.sort((a, b) => {
    if (a.buildingCode === 'UNCLASSIFIED') return 1;
    if (b.buildingCode === 'UNCLASSIFIED') return -1;
    return a.buildingCode.localeCompare(b.buildingCode);
  });

  return resultBuildings;
}
