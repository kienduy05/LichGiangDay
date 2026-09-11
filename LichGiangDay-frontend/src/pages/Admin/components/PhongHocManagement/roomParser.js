/**
 * Utility parse mã phòng học theo format {số_phòng}_{mã_tòa_nhà}
 * Ví dụ:
 *  - '101_A2'  => buildingCode: 'A2', floor: 1, roomNumber: 1, rawRoomNumber: '101'
 *  - '202_A2'  => buildingCode: 'A2', floor: 2, roomNumber: 2, rawRoomNumber: '202'
 *  - '1005_A2' => buildingCode: 'A2', floor: 10, roomNumber: 5, rawRoomNumber: '1005'
 *  - 'P101'    => buildingCode: 'UNCLASSIFIED', floor: 0, roomNumber: 0 (Fallback)
 */

export function parseRoomCode(maPhong) {
  if (!maPhong || typeof maPhong !== 'string') {
    return {
      buildingCode: 'UNCLASSIFIED',
      floor: 0,
      roomNumber: 0,
      rawRoomNumber: 'N/A',
      isUnclassified: true
    };
  }

  const lastUnderscoreIndex = maPhong.lastIndexOf('_');
  if (lastUnderscoreIndex === -1) {
    return {
      buildingCode: 'UNCLASSIFIED',
      floor: 0,
      roomNumber: 0,
      rawRoomNumber: maPhong,
      isUnclassified: true
    };
  }

  const roomPart = maPhong.substring(0, lastUnderscoreIndex).trim();
  const buildingCode = maPhong.substring(lastUnderscoreIndex + 1).trim();

  // Tách số tầng & số phòng từ roomPart (chỉ lấy các ký tự số)
  const numericStr = roomPart.replace(/\D/g, '');
  if (!numericStr) {
    return {
      buildingCode: buildingCode || 'UNCLASSIFIED',
      floor: 0,
      roomNumber: 0,
      rawRoomNumber: roomPart,
      isUnclassified: true
    };
  }

  if (numericStr.length <= 2) {
    return {
      buildingCode,
      floor: 1,
      roomNumber: parseInt(numericStr, 10) || 1,
      rawRoomNumber: roomPart,
      isUnclassified: false
    };
  }

  const roomNumStr = numericStr.slice(-2);
  const floorStr = numericStr.slice(0, -2);

  const roomNumber = parseInt(roomNumStr, 10) || 0;
  const floor = parseInt(floorStr, 10) || 1;

  return {
    buildingCode,
    floor,
    roomNumber,
    rawRoomNumber: roomPart,
    isUnclassified: false
  };
}

/**
 * Gom nhóm danh sách phòng học theo Tòa nhà -> Tầng (Giảm dần) -> Danh sách phòng
 */
export function groupRoomsByBuildingAndFloor(phongHocList = [], toaNhaList = []) {
  const toaNhaMap = new Map();
  toaNhaList.forEach((tn) => {
    toaNhaMap.set(tn.MaToaNha, tn.TenToaNha || tn.MaToaNha);
  });

  const buildingsGroupMap = new Map();

  phongHocList.forEach((room) => {
    const parsed = parseRoomCode(room.MaPhong);
    const buildingKey = parsed.isUnclassified
      ? 'UNCLASSIFIED'
      : (room.MaToaNha || parsed.buildingCode);

    if (!buildingsGroupMap.has(buildingKey)) {
      buildingsGroupMap.set(buildingKey, {
        buildingCode: buildingKey,
        buildingName: parsed.isUnclassified
          ? 'Chưa phân loại'
          : (toaNhaMap.get(buildingKey) || `Tòa ${buildingKey}`),
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

    const floorKey = parsed.floor;
    if (!buildingObj.floorsMap.has(floorKey)) {
      buildingObj.floorsMap.set(floorKey, []);
    }

    buildingObj.floorsMap.get(floorKey).push({
      ...room,
      parsedInfo: parsed
    });
  });

  // Chuyển Map thành mảng và sắp xếp
  const resultBuildings = Array.from(buildingsGroupMap.values()).map((buildingObj) => {
    const sortedFloors = Array.from(buildingObj.floorsMap.entries())
      .map(([floorNum, rooms]) => {
        // Sắp xếp các phòng trong tầng theo số phòng tăng dần
        const sortedRooms = [...rooms].sort((a, b) => {
          return a.parsedInfo.roomNumber - b.parsedInfo.roomNumber;
        });

        return {
          floorNumber: floorNum,
          floorLabel: floorNum === 0 ? 'Khác / Chưa rõ' : `Tầng ${floorNum}`,
          rooms: sortedRooms
        };
      })
      .sort((a, b) => b.floorNumber - a.floorNumber); // Tầng cao xếp trước (giảm dần)

    return {
      ...buildingObj,
      floors: sortedFloors
    };
  });

  // Đưa Tòa chưa phân loại xuống cuối, các tòa khác xếp theo Alphabet
  resultBuildings.sort((a, b) => {
    if (a.buildingCode === 'UNCLASSIFIED') return 1;
    if (b.buildingCode === 'UNCLASSIFIED') return -1;
    return a.buildingCode.localeCompare(b.buildingCode);
  });

  return resultBuildings;
}
