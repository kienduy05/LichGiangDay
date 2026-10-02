const db = require('../../config/db');

class ThoiKhoaBieuService {

  // ================================================================
  // 1. Lấy dữ liệu cấu trúc TreeView (Khoa -> BoMon -> LopHocPhan)
  //    Bắt buộc: maHocKy
  //    Lọc thêm: search, filterStatus ('ALL' | 'SCHEDULED' | 'UNSCHEDULED')
  // ================================================================
  static getTreeViewData = async ({ maHocKy, search = '', filterStatus = 'ALL' } = {}) => {
    if (!maHocKy || !maHocKy.trim()) {
      throw new Error('Vui lòng chọn Học kỳ.');
    }

    // 1. Lấy danh sách tất cả các Khoa
    const [khoaRows] = await db.query(`
      SELECT MaKhoa, TenKhoa
      FROM Khoa
      ORDER BY MaKhoa ASC
    `);

    // 2. Lấy danh sách tất cả các Bộ môn
    const [boMonRows] = await db.query(`
      SELECT bm.MaBoMon, bm.TenBoMon, bm.MaKhoa, k.TenKhoa
      FROM BoMon bm
      JOIN Khoa k ON bm.MaKhoa = k.MaKhoa
      ORDER BY bm.MaKhoa ASC, bm.MaBoMon ASC
    `);

    // 3. Lấy danh sách tất cả LHP trong học kỳ + kèm thông tin TKB
    let lhpSql = `
      SELECT
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        lhp.MaMonHoc,
        mh.TenMonHoc,
        mh.SoTinChi,
        lhp.LoaiHoc,
        lhp.SiSoDuKien,
        lhp.SiSoDangKy,
        lhp.MaBoMon,
        bm.MaKhoa,
        lhp.MaGiangVien,
        gv.HoTen AS TenGiangVien,
        lhp.NgayBatDau,
        lhp.NgayKetThuc,
        lhp.SoTuan,
        COUNT(DISTINCT tkb.MaThoiKhoaBieu) AS SoBuoiDaXep
      FROM LopHocPhan lhp
      LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      LEFT JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon
      LEFT JOIN GiangVien gv ON lhp.MaGiangVien = gv.MaGiangVien
      LEFT JOIN ThoiKhoaBieu tkb ON lhp.MaLopHocPhan = tkb.MaLopHocPhan
      WHERE lhp.MaHocKy = ?
    `;

    const params = [maHocKy.trim()];

    if (search && search.trim() !== '') {
      lhpSql += ` AND (lhp.MaLopHocPhan LIKE ? OR lhp.TenLopHocPhan LIKE ? OR mh.TenMonHoc LIKE ? OR lhp.MaMonHoc LIKE ?)`;
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw, kw);
    }

    lhpSql += `
      GROUP BY lhp.MaLopHocPhan, lhp.TenLopHocPhan, lhp.MaMonHoc, mh.TenMonHoc, mh.SoTinChi,
               lhp.LoaiHoc, lhp.SiSoDuKien, lhp.SiSoDangKy, lhp.MaBoMon, bm.MaKhoa,
               lhp.MaGiangVien, gv.HoTen, lhp.NgayBatDau, lhp.NgayKetThuc, lhp.SoTuan
      ORDER BY lhp.MaBoMon ASC, lhp.MaLopHocPhan ASC
    `;

    const [lhpRows] = await db.query(lhpSql, params);

    // 4. Lấy chi tiết các bản ghi ThoiKhoaBieu của các LHP trong học kỳ để gắn tóm tắt lịch
    const [allTkbRows] = await db.query(`
      SELECT
        tkb.MaThoiKhoaBieu,
        tkb.MaLopHocPhan,
        tkb.ThuTrongTuan,
        tkb.MaTiet,
        th.TenTiet,
        tkb.MaPhong,
        ph.TenPhong,
        ph.MaToaNha
      FROM ThoiKhoaBieu tkb
      JOIN LopHocPhan lhp ON tkb.MaLopHocPhan = lhp.MaLopHocPhan
      LEFT JOIN TietHoc th ON tkb.MaTiet = th.MaTiet
      LEFT JOIN PhongHoc ph ON tkb.MaPhong = ph.MaPhong
      WHERE lhp.MaHocKy = ?
      ORDER BY tkb.ThuTrongTuan ASC, tkb.MaTiet ASC
    `, [maHocKy.trim()]);

    // Gom TKB theo MaLopHocPhan
    const tkbMap = {};
    for (const tkb of allTkbRows) {
      if (!tkbMap[tkb.MaLopHocPhan]) {
        tkbMap[tkb.MaLopHocPhan] = [];
      }
      tkbMap[tkb.MaLopHocPhan].push(tkb);
    }

    // Gắn schedules vào từng LHP và lọc theo filterStatus
    const processedLhp = lhpRows.map(lhp => {
      const schedules = tkbMap[lhp.MaLopHocPhan] || [];
      const hasSchedule = schedules.length > 0;
      return {
        ...lhp,
        hasSchedule,
        schedules
      };
    }).filter(lhp => {
      if (filterStatus === 'SCHEDULED') return lhp.hasSchedule;
      if (filterStatus === 'UNSCHEDULED') return !lhp.hasSchedule;
      return true;
    });

    // 5. Xây dựng cây phân cấp Khoa -> BoMon -> LopHocPhan
    const tree = [];
    let totalClassesCount = 0;
    let scheduledClassesCount = 0;
    let unscheduledClassesCount = 0;

    for (const k of khoaRows) {
      const boMonsOfKhoa = boMonRows.filter(bm => bm.MaKhoa === k.MaKhoa);
      const boMonNodes = [];

      let khoaTotal = 0;
      let khoaScheduled = 0;
      let khoaUnscheduled = 0;

      for (const bm of boMonsOfKhoa) {
        const lhpsOfBm = processedLhp.filter(lhp => lhp.MaBoMon === bm.MaBoMon);
        const bmTotal = lhpsOfBm.length;
        const bmScheduled = lhpsOfBm.filter(l => l.hasSchedule).length;
        const bmUnscheduled = bmTotal - bmScheduled;

        khoaTotal += bmTotal;
        khoaScheduled += bmScheduled;
        khoaUnscheduled += bmUnscheduled;

        // Chỉ đưa vào tree nếu có LHP hoặc không có filter tìm kiếm chặt chẽ
        boMonNodes.push({
          MaBoMon: bm.MaBoMon,
          TenBoMon: bm.TenBoMon,
          MaKhoa: bm.MaKhoa,
          totalClasses: bmTotal,
          scheduledClasses: bmScheduled,
          unscheduledClasses: bmUnscheduled,
          lopHocPhans: lhpsOfBm
        });
      }

      totalClassesCount += khoaTotal;
      scheduledClassesCount += khoaScheduled;
      unscheduledClassesCount += khoaUnscheduled;

      tree.push({
        MaKhoa: k.MaKhoa,
        TenKhoa: k.TenKhoa,
        totalClasses: khoaTotal,
        scheduledClasses: khoaScheduled,
        unscheduledClasses: khoaUnscheduled,
        boMons: boMonNodes
      });
    }

    return {
      stats: {
        total: totalClassesCount,
        scheduled: scheduledClassesCount,
        unscheduled: unscheduledClassesCount
      },
      tree
    };
  };

  // ================================================================
  // 2. Lấy danh sách LHP kèm TKB dạng bảng (Table View)
  // ================================================================
  static getAll = async ({
    maHocKy,
    maKhoa = '',
    maBoMon = '',
    maMonHoc = '',
    maPhong = '',
    thuTrongTuan = '',
    filterStatus = 'ALL',
    search = ''
  } = {}) => {
    if (!maHocKy || !maHocKy.trim()) {
      throw new Error('Vui lòng chọn Học kỳ.');
    }

    let sql = `
      SELECT
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        lhp.MaMonHoc,
        mh.TenMonHoc,
        mh.SoTinChi,
        lhp.MaHocKy,
        hk.TenHocKy,
        lhp.LoaiHoc,
        lhp.SiSoDuKien,
        lhp.SiSoDangKy,
        lhp.MaBoMon,
        bm.TenBoMon,
        bm.MaKhoa,
        k.TenKhoa,
        lhp.MaGiangVien,
        gv.HoTen AS TenGiangVien,
        lhp.NgayBatDau,
        lhp.NgayKetThuc,
        lhp.SoTuan,
        lhp.TrangThaiPhanCong,
        COUNT(DISTINCT tkb.MaThoiKhoaBieu) AS SoBuoiDaXep
      FROM LopHocPhan lhp
      LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      LEFT JOIN HocKy hk ON lhp.MaHocKy = hk.MaHocKy
      LEFT JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon
      LEFT JOIN Khoa k ON bm.MaKhoa = k.MaKhoa
      LEFT JOIN GiangVien gv ON lhp.MaGiangVien = gv.MaGiangVien
      LEFT JOIN ThoiKhoaBieu tkb ON lhp.MaLopHocPhan = tkb.MaLopHocPhan
      WHERE lhp.MaHocKy = ?
    `;

    const params = [maHocKy.trim()];

    if (maKhoa && maKhoa.trim() !== '') {
      sql += ` AND bm.MaKhoa = ?`;
      params.push(maKhoa.trim());
    }

    if (maBoMon && maBoMon.trim() !== '') {
      sql += ` AND lhp.MaBoMon = ?`;
      params.push(maBoMon.trim());
    }

    if (maMonHoc && maMonHoc.trim() !== '') {
      sql += ` AND lhp.MaMonHoc = ?`;
      params.push(maMonHoc.trim());
    }

    if (maPhong && maPhong.trim() !== '') {
      sql += ` AND tkb.MaPhong = ?`;
      params.push(maPhong.trim());
    }

    if (thuTrongTuan && thuTrongTuan.trim() !== '') {
      sql += ` AND tkb.ThuTrongTuan = ?`;
      params.push(parseInt(thuTrongTuan, 10));
    }

    if (search && search.trim() !== '') {
      sql += ` AND (lhp.MaLopHocPhan LIKE ? OR lhp.TenLopHocPhan LIKE ? OR mh.TenMonHoc LIKE ? OR mh.MaMonHoc LIKE ?)`;
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw, kw);
    }

    sql += `
      GROUP BY lhp.MaLopHocPhan, lhp.TenLopHocPhan, lhp.MaMonHoc, mh.TenMonHoc, mh.SoTinChi,
               lhp.MaHocKy, hk.TenHocKy, lhp.LoaiHoc, lhp.SiSoDuKien, lhp.SiSoDangKy,
               lhp.MaBoMon, bm.TenBoMon, bm.MaKhoa, k.TenKhoa, lhp.MaGiangVien, gv.HoTen,
               lhp.NgayBatDau, lhp.NgayKetThuc, lhp.SoTuan, lhp.TrangThaiPhanCong
      ORDER BY bm.MaKhoa ASC, lhp.MaBoMon ASC, lhp.MaLopHocPhan ASC
    `;

    const [rows] = await db.query(sql, params);

    // Lấy chi tiết TKB của các lớp này
    const [allTkbRows] = await db.query(`
      SELECT
        tkb.MaThoiKhoaBieu,
        tkb.MaLopHocPhan,
        tkb.ThuTrongTuan,
        tkb.MaTiet,
        th.TenTiet,
        TIME_FORMAT(th.GioBatDau, '%H:%i') AS GioBatDau,
        TIME_FORMAT(th.GioKetThuc, '%H:%i') AS GioKetThuc,
        tkb.MaPhong,
        ph.TenPhong,
        ph.MaToaNha,
        ph.SucChua,
        ph.LoaiPhong,
        tkb.NgayBatDau,
        tkb.NgayKetThuc
      FROM ThoiKhoaBieu tkb
      JOIN LopHocPhan lhp ON tkb.MaLopHocPhan = lhp.MaLopHocPhan
      LEFT JOIN TietHoc th ON tkb.MaTiet = th.MaTiet
      LEFT JOIN PhongHoc ph ON tkb.MaPhong = ph.MaPhong
      WHERE lhp.MaHocKy = ?
      ORDER BY tkb.ThuTrongTuan ASC, tkb.MaTiet ASC
    `, [maHocKy.trim()]);

    const tkbMap = {};
    for (const tkb of allTkbRows) {
      if (!tkbMap[tkb.MaLopHocPhan]) {
        tkbMap[tkb.MaLopHocPhan] = [];
      }
      tkbMap[tkb.MaLopHocPhan].push(tkb);
    }

    return rows.map(lhp => {
      const schedules = tkbMap[lhp.MaLopHocPhan] || [];
      const hasSchedule = schedules.length > 0;
      return {
        ...lhp,
        hasSchedule,
        schedules
      };
    }).filter(lhp => {
      if (filterStatus === 'SCHEDULED') return lhp.hasSchedule;
      if (filterStatus === 'UNSCHEDULED') return !lhp.hasSchedule;
      return true;
    });
  };

  // ================================================================
  // 3. Lấy chi tiết TKB của 1 Lớp học phần
  // ================================================================
  static getByLopHocPhan = async (maLopHocPhan) => {
    // Thông tin cơ bản LHP
    const [lhpRows] = await db.query(`
      SELECT
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        lhp.MaMonHoc,
        mh.TenMonHoc,
        mh.SoTinChi,
        lhp.MaHocKy,
        hk.TenHocKy,
        hk.NamHoc,
        lhp.LoaiHoc,
        lhp.SiSoDuKien,
        lhp.SiSoDangKy,
        lhp.MaBoMon,
        bm.TenBoMon,
        bm.MaKhoa,
        k.TenKhoa,
        lhp.MaGiangVien,
        gv.HoTen AS TenGiangVien,
        lhp.NgayBatDau,
        lhp.NgayKetThuc,
        lhp.SoTuan,
        lhp.TrangThaiPhanCong
      FROM LopHocPhan lhp
      LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      LEFT JOIN HocKy hk ON lhp.MaHocKy = hk.MaHocKy
      LEFT JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon
      LEFT JOIN Khoa k ON bm.MaKhoa = k.MaKhoa
      LEFT JOIN GiangVien gv ON lhp.MaGiangVien = gv.MaGiangVien
      WHERE lhp.MaLopHocPhan = ?
      LIMIT 1
    `, [maLopHocPhan]);

    if (lhpRows.length === 0) {
      throw new Error(`Không tìm thấy lớp học phần có mã '${maLopHocPhan}'.`);
    }

    const lopHocPhan = lhpRows[0];

    // Lấy danh sách lớp sinh viên ghép
    const [lsvList] = await db.query(`
      SELECT lsv.MaLopSinhVien, lsv.TenLopSinhVien
      FROM LopHocPhan_LopSinhVien lhl
      JOIN LopSinhVien lsv ON lhl.MaLopSinhVien = lsv.MaLopSinhVien
      WHERE lhl.MaLopHocPhan = ?
      ORDER BY lsv.MaLopSinhVien ASC
    `, [maLopHocPhan]);

    // Lấy danh sách thời khóa biểu đã xếp
    const [schedules] = await db.query(`
      SELECT
        tkb.MaThoiKhoaBieu,
        tkb.MaLopHocPhan,
        tkb.ThuTrongTuan,
        tkb.MaTiet,
        th.TenTiet,
        TIME_FORMAT(th.GioBatDau, '%H:%i') AS GioBatDau,
        TIME_FORMAT(th.GioKetThuc, '%H:%i') AS GioKetThuc,
        tkb.MaPhong,
        ph.TenPhong,
        ph.MaToaNha,
        tn.TenToaNha,
        ph.SucChua,
        ph.LoaiPhong,
        ph.TrangThai AS TrangThaiPhong,
        tkb.NgayBatDau,
        tkb.NgayKetThuc,
        tkb.TrangThai,
        tkb.ThoiGianSuaDoi,
        tkb.ThoiGianBoMonXacNhan
      FROM ThoiKhoaBieu tkb
      LEFT JOIN TietHoc th ON tkb.MaTiet = th.MaTiet
      LEFT JOIN PhongHoc ph ON tkb.MaPhong = ph.MaPhong
      LEFT JOIN ToaNha tn ON ph.MaToaNha = tn.MaToaNha
      WHERE tkb.MaLopHocPhan = ?
      ORDER BY tkb.ThuTrongTuan ASC, tkb.MaTiet ASC
    `, [maLopHocPhan]);

    return {
      lopHocPhan: {
        ...lopHocPhan,
        lopSinhViens: lsvList
      },
      schedules
    };
  };

  // ================================================================
  // 4. Lưới trạng thái phòng học (Room Selection Grid)
  //    Dùng trong Modal Xếp TKB khi người dùng chọn Thứ & Tiết
  // ================================================================
  static getRoomStatusGrid = async ({
    thuTrongTuan,
    maTiet,
    ngayBatDau,
    ngayKetThuc,
    excludeMaLopHocPhan = '',
    maToaNha = ''
  }) => {
    if (!thuTrongTuan || !maTiet || !ngayBatDau || !ngayKetThuc) {
      throw new Error('Vui lòng cung cấp đầy đủ Thứ, Tiết, Ngày bắt đầu và Ngày kết thúc.');
    }

    const thuVal = parseInt(thuTrongTuan, 10);
    const tietVal = parseInt(maTiet, 10);

    // 1. Lấy toàn bộ danh sách phòng học
    let roomSql = `
      SELECT
        ph.MaPhong,
        ph.TenPhong,
        ph.MaToaNha,
        tn.TenToaNha,
        tn.CoSo,
        ph.SucChua,
        ph.LoaiPhong,
        ph.TrangThai
      FROM PhongHoc ph
      JOIN ToaNha tn ON ph.MaToaNha = tn.MaToaNha
    `;
    const roomParams = [];

    if (maToaNha && maToaNha.trim() !== '') {
      roomSql += ` WHERE ph.MaToaNha = ?`;
      roomParams.push(maToaNha.trim());
    }

    roomSql += ` ORDER BY ph.MaToaNha ASC, ph.MaPhong ASC`;
    const [allRooms] = await db.query(roomSql, roomParams);

    // 2. Tìm các phòng bị trùng lịch trong khung Thứ, Tiết, Ngày này
    let conflictSql = `
      SELECT
        tkb.MaPhong,
        tkb.MaLopHocPhan,
        lhp.TenLopHocPhan,
        mh.TenMonHoc,
        tkb.NgayBatDau,
        tkb.NgayKetThuc
      FROM ThoiKhoaBieu tkb
      JOIN LopHocPhan lhp ON tkb.MaLopHocPhan = lhp.MaLopHocPhan
      LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      WHERE tkb.ThuTrongTuan = ?
        AND tkb.MaTiet = ?
        AND tkb.NgayBatDau <= ?
        AND tkb.NgayKetThuc >= ?
    `;
    const conflictParams = [thuVal, tietVal, ngayKetThuc, ngayBatDau];

    if (excludeMaLopHocPhan && excludeMaLopHocPhan.trim() !== '') {
      conflictSql += ` AND tkb.MaLopHocPhan != ?`;
      conflictParams.push(excludeMaLopHocPhan.trim());
    }

    const [conflictRows] = await db.query(conflictSql, conflictParams);

    const conflictMap = {};
    for (const c of conflictRows) {
      conflictMap[c.MaPhong] = c;
    }

    // 3. Ghép trạng thái vào từng phòng
    const roomsWithStatus = allRooms.map(room => {
      // Nếu phòng bảo trì
      if (room.TrangThai === 'Maintenance') {
        return {
          ...room,
          isAvailable: false,
          statusKey: 'MAINTENANCE',
          statusReason: 'Phòng đang bảo trì',
          occupiedBy: null
        };
      }

      // Nếu phòng đã có lớp học khác
      const conflict = conflictMap[room.MaPhong];
      if (conflict) {
        return {
          ...room,
          isAvailable: false,
          statusKey: 'OCCUPIED',
          statusReason: `Đã bận (${conflict.TenMonHoc || conflict.MaLopHocPhan})`,
          occupiedBy: conflict
        };
      }

      // Phòng trống sẵn sàng
      return {
        ...room,
        isAvailable: true,
        statusKey: 'AVAILABLE',
        statusReason: 'Phòng trống',
        occupiedBy: null
      };
    });

    return roomsWithStatus;
  };

  // ================================================================
  // 5. Kiểm tra Xung đột trước khi lưu (Conflict Check)
  // ================================================================
  static checkConflict = async ({ maLopHocPhan, schedules = [] }) => {
    if (!maLopHocPhan || !Array.isArray(schedules) || schedules.length === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    const conflicts = [];

    // 1. Lấy thông tin lớp học phần và các lớp sinh viên ghép
    const [lhpRows] = await db.query(`
      SELECT MaLopHocPhan, TenLopHocPhan, NgayBatDau, NgayKetThuc, SiSoDuKien
      FROM LopHocPhan WHERE MaLopHocPhan = ? LIMIT 1
    `, [maLopHocPhan]);

    if (lhpRows.length === 0) {
      throw new Error(`Không tìm thấy lớp học phần '${maLopHocPhan}'.`);
    }
    const lhp = lhpRows[0];

    const [lsvRows] = await db.query(`
      SELECT MaLopSinhVien FROM LopHocPhan_LopSinhVien WHERE MaLopHocPhan = ?
    `, [maLopHocPhan]);
    const studentClasses = lsvRows.map(r => r.MaLopSinhVien);

    // 2. Kiểm tra trùng lặp trong chính mảng schedules gửi lên
    const seenSlots = new Set();
    for (let i = 0; i < schedules.length; i++) {
      const s = schedules[i];
      const slotKey = `${s.thuTrongTuan}_${s.maTiet}`;
      if (seenSlots.has(slotKey)) {
        conflicts.push({
          type: 'INTERNAL_SLOT_DUPLICATE',
          message: `Lớp học phần có 2 buổi bị trùng cùng Thứ ${s.thuTrongTuan} và Ca/Tiết ${s.maTiet}.`,
          scheduleIndex: i
        });
      }
      seenSlots.add(slotKey);
    }

    // 3. Kiểm tra trùng phòng học & trùng lịch sinh viên với DB
    for (let i = 0; i < schedules.length; i++) {
      const s = schedules[i];
      const thuVal = parseInt(s.thuTrongTuan, 10);
      const tietVal = parseInt(s.maTiet, 10);
      const startVal = s.ngayBatDau || lhp.NgayBatDau;
      const endVal = s.ngayKetThuc || lhp.NgayKetThuc;

      // 3a. Kiểm tra Phòng học bận
      const [roomConflicts] = await db.query(`
        SELECT
          tkb.MaThoiKhoaBieu,
          tkb.MaLopHocPhan,
          l.TenLopHocPhan,
          mh.TenMonHoc,
          ph.TenPhong
        FROM ThoiKhoaBieu tkb
        JOIN LopHocPhan l ON tkb.MaLopHocPhan = l.MaLopHocPhan
        LEFT JOIN MonHoc mh ON l.MaMonHoc = mh.MaMonHoc
        LEFT JOIN PhongHoc ph ON tkb.MaPhong = ph.MaPhong
        WHERE tkb.MaPhong = ?
          AND tkb.ThuTrongTuan = ?
          AND tkb.MaTiet = ?
          AND tkb.MaLopHocPhan != ?
          AND tkb.NgayBatDau <= ?
          AND tkb.NgayKetThuc >= ?
        LIMIT 1
      `, [s.maPhong, thuVal, tietVal, maLopHocPhan, endVal, startVal]);

      if (roomConflicts.length > 0) {
        const rc = roomConflicts[0];
        conflicts.push({
          type: 'ROOM_CONFLICT',
          message: `Phòng '${rc.TenPhong || s.maPhong}' đã có lớp '${rc.TenMonHoc || rc.MaLopHocPhan}' học vào Thứ ${thuVal} (Tiết ${tietVal}).`,
          scheduleIndex: i,
          details: rc
        });
      }

      // 3b. Kiểm tra Sức chứa phòng
      const [roomInfo] = await db.query(`
        SELECT TenPhong, SucChua, TrangThai FROM PhongHoc WHERE MaPhong = ? LIMIT 1
      `, [s.maPhong]);

      if (roomInfo.length > 0) {
        if (roomInfo[0].TrangThai === 'Maintenance') {
          conflicts.push({
            type: 'ROOM_MAINTENANCE',
            message: `Phòng '${roomInfo[0].TenPhong}' đang trong trạng thái bảo trì, không thể xếp lịch.`,
            scheduleIndex: i
          });
        }
      }

      // 3c. Kiểm tra Lớp sinh viên ghép bị trùng lịch môn khác
      if (studentClasses.length > 0) {
        const placeholders = studentClasses.map(() => '?').join(', ');
        const [studentConflicts] = await db.query(`
          SELECT
            lhl.MaLopSinhVien,
            lsv.TenLopSinhVien,
            lhpOther.MaLopHocPhan,
            mh.TenMonHoc
          FROM LopHocPhan_LopSinhVien lhl
          JOIN LopSinhVien lsv ON lhl.MaLopSinhVien = lsv.MaLopSinhVien
          JOIN LopHocPhan lhpOther ON lhl.MaLopHocPhan = lhpOther.MaLopHocPhan
          JOIN ThoiKhoaBieu tkbOther ON lhpOther.MaLopHocPhan = tkbOther.MaLopHocPhan
          LEFT JOIN MonHoc mh ON lhpOther.MaMonHoc = mh.MaMonHoc
          WHERE lhl.MaLopSinhVien IN (${placeholders})
            AND lhpOther.MaLopHocPhan != ?
            AND tkbOther.ThuTrongTuan = ?
            AND tkbOther.MaTiet = ?
            AND tkbOther.NgayBatDau <= ?
            AND tkbOther.NgayKetThuc >= ?
          LIMIT 3
        `, [...studentClasses, maLopHocPhan, thuVal, tietVal, endVal, startVal]);

        if (studentConflicts.length > 0) {
          for (const sc of studentConflicts) {
            conflicts.push({
              type: 'STUDENT_CLASS_CONFLICT',
              message: `Lớp sinh viên '${sc.TenLopSinhVien}' bị trùng lịch với môn '${sc.TenMonHoc || sc.MaLopHocPhan}' vào Thứ ${thuVal} (Tiết ${tietVal}).`,
              scheduleIndex: i,
              details: sc
            });
          }
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  };

  // ================================================================
  // 6. Lưu Danh sách Thời Khóa Biểu cho Lớp Học Phần (Transaction)
  // ================================================================
  static saveSchedules = async ({ maLopHocPhan, schedules = [] }) => {
    if (!maLopHocPhan || !maLopHocPhan.trim()) {
      throw new Error('Mã lớp học phần không được để trống.');
    }

    const trimmedLhp = maLopHocPhan.trim();

    // 1. Kiểm tra LHP tồn tại
    const [lhpRows] = await db.query(`
      SELECT MaLopHocPhan, TenLopHocPhan, NgayBatDau, NgayKetThuc, MaHocKy
      FROM LopHocPhan WHERE MaLopHocPhan = ? LIMIT 1
    `, [trimmedLhp]);

    if (lhpRows.length === 0) {
      throw new Error(`Không tìm thấy lớp học phần '${trimmedLhp}'.`);
    }
    const lhp = lhpRows[0];

    // 2. Nếu có schedules, validate từng buổi
    if (!Array.isArray(schedules) || schedules.length === 0) {
      // Nếu gửi mảng rỗng -> Xóa toàn bộ lịch TKB của lớp này
      await db.query(`DELETE FROM ThoiKhoaBieu WHERE MaLopHocPhan = ?`, [trimmedLhp]);
      return { success: true, count: 0, schedules: [] };
    }

    // Validate dữ liệu đầu vào
    for (let i = 0; i < schedules.length; i++) {
      const s = schedules[i];
      if (!s.thuTrongTuan || s.thuTrongTuan < 2 || s.thuTrongTuan > 8) {
        throw new Error(`Buổi ${i + 1}: Thứ trong tuần không hợp lệ (2 - 8).`);
      }
      if (!s.maTiet) {
        throw new Error(`Buổi ${i + 1}: Vui lòng chọn Tiết học.`);
      }
      if (!s.maPhong || !s.maPhong.trim()) {
        throw new Error(`Buổi ${i + 1}: Vui lòng chọn Phòng học.`);
      }
    }

    // 3. Kiểm tra xung đột trước khi lưu
    const conflictResult = await this.checkConflict({
      maLopHocPhan: trimmedLhp,
      schedules
    });

    // Nếu có xung đột phòng học hoặc bảo trì -> chặn lưu
    const blockingConflicts = conflictResult.conflicts.filter(
      c => c.type === 'ROOM_CONFLICT' || c.type === 'ROOM_MAINTENANCE' || c.type === 'INTERNAL_SLOT_DUPLICATE'
    );

    if (blockingConflicts.length > 0) {
      throw new Error(blockingConflicts.map(c => c.message).join(' | '));
    }

    // 4. Lưu vào CSDL trong Transaction
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Xóa TKB cũ của lớp này
      await conn.query(`DELETE FROM ThoiKhoaBieu WHERE MaLopHocPhan = ?`, [trimmedLhp]);

      // Thêm các bản ghi TKB mới
      for (let i = 0; i < schedules.length; i++) {
        const s = schedules[i];
        const maTKB = `TKB_${trimmedLhp}_${i + 1}`;
        const startVal = s.ngayBatDau || lhp.NgayBatDau;
        const endVal = s.ngayKetThuc || lhp.NgayKetThuc;

        await conn.query(`
          INSERT INTO ThoiKhoaBieu
            (MaThoiKhoaBieu, MaLopHocPhan, ThuTrongTuan, MaTiet, MaPhong,
             NgayBatDau, NgayKetThuc, TrangThai, ThoiGianSuaDoi)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'Scheduled', NOW())
        `, [
          maTKB,
          trimmedLhp,
          parseInt(s.thuTrongTuan, 10),
          parseInt(s.maTiet, 10),
          s.maPhong.trim(),
          startVal,
          endVal
        ]);
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return await this.getByLopHocPhan(trimmedLhp);
  };

  // ================================================================
  // 7. Xóa toàn bộ lịch TKB của 1 Lớp học phần
  // ================================================================
  static deleteByLopHocPhan = async (maLopHocPhan) => {
    const existing = await this.getByLopHocPhan(maLopHocPhan);
    if (!existing) {
      throw new Error(`Không tìm thấy lớp học phần '${maLopHocPhan}'.`);
    }

    const [result] = await db.query(
      `DELETE FROM ThoiKhoaBieu WHERE MaLopHocPhan = ?`,
      [maLopHocPhan]
    );

    return { success: true, removedCount: result.affectedRows };
  };

  // ================================================================
  // 8. Xóa 1 bản ghi TKB
  // ================================================================
  static deleteScheduleItem = async (maThoiKhoaBieu) => {
    const [rows] = await db.query(
      `SELECT MaThoiKhoaBieu, MaLopHocPhan FROM ThoiKhoaBieu WHERE MaThoiKhoaBieu = ? LIMIT 1`,
      [maThoiKhoaBieu]
    );

    if (rows.length === 0) {
      throw new Error(`Không tìm thấy bản ghi thời khóa biểu '${maThoiKhoaBieu}'.`);
    }

    await db.query(`DELETE FROM ThoiKhoaBieu WHERE MaThoiKhoaBieu = ?`, [maThoiKhoaBieu]);

    return { success: true, maThoiKhoaBieu };
  };

  // ================================================================
  // 9. Lấy dữ liệu dạng Lưới Ma trận (Matrix Grid View)
  //    Thứ (2 -> 8) x Tiết (1 -> 5)
  // ================================================================
  static getMatrixGrid = async ({
    maHocKy,
    maToaNha = '',
    maPhong = '',
    maKhoa = '',
    maBoMon = ''
  }) => {
    if (!maHocKy || !maHocKy.trim()) {
      throw new Error('Vui lòng chọn Học kỳ.');
    }

    let sql = `
      SELECT
        tkb.MaThoiKhoaBieu,
        tkb.MaLopHocPhan,
        lhp.TenLopHocPhan,
        lhp.LoaiHoc,
        lhp.SiSoDuKien,
        lhp.SiSoDangKy,
        mh.MaMonHoc,
        mh.TenMonHoc,
        mh.SoTinChi,
        lhp.MaBoMon,
        bm.TenBoMon,
        bm.MaKhoa,
        k.TenKhoa,
        lhp.MaGiangVien,
        gv.HoTen AS TenGiangVien,
        tkb.ThuTrongTuan,
        tkb.MaTiet,
        th.TenTiet,
        TIME_FORMAT(th.GioBatDau, '%H:%i') AS GioBatDau,
        TIME_FORMAT(th.GioKetThuc, '%H:%i') AS GioKetThuc,
        tkb.MaPhong,
        ph.TenPhong,
        ph.MaToaNha,
        tn.TenToaNha,
        ph.SucChua,
        ph.LoaiPhong,
        tkb.NgayBatDau,
        tkb.NgayKetThuc
      FROM ThoiKhoaBieu tkb
      JOIN LopHocPhan lhp ON tkb.MaLopHocPhan = lhp.MaLopHocPhan
      LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      LEFT JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon
      LEFT JOIN Khoa k ON bm.MaKhoa = k.MaKhoa
      LEFT JOIN GiangVien gv ON lhp.MaGiangVien = gv.MaGiangVien
      LEFT JOIN TietHoc th ON tkb.MaTiet = th.MaTiet
      LEFT JOIN PhongHoc ph ON tkb.MaPhong = ph.MaPhong
      LEFT JOIN ToaNha tn ON ph.MaToaNha = tn.MaToaNha
      WHERE lhp.MaHocKy = ?
    `;

    const params = [maHocKy.trim()];

    if (maToaNha && maToaNha.trim() !== '') {
      sql += ` AND ph.MaToaNha = ?`;
      params.push(maToaNha.trim());
    }

    if (maPhong && maPhong.trim() !== '') {
      sql += ` AND tkb.MaPhong = ?`;
      params.push(maPhong.trim());
    }

    if (maKhoa && maKhoa.trim() !== '') {
      sql += ` AND bm.MaKhoa = ?`;
      params.push(maKhoa.trim());
    }

    if (maBoMon && maBoMon.trim() !== '') {
      sql += ` AND lhp.MaBoMon = ?`;
      params.push(maBoMon.trim());
    }

    sql += ` ORDER BY tkb.ThuTrongTuan ASC, tkb.MaTiet ASC, ph.MaPhong ASC`;

    const [rows] = await db.query(sql, params);

    // Tổ chức dữ liệu theo ma trận cell [thu][tiet]
    const matrix = {};
    for (let thu = 2; thu <= 8; thu++) {
      matrix[thu] = {};
      for (let tiet = 1; tiet <= 5; tiet++) {
        matrix[thu][tiet] = [];
      }
    }

    for (const item of rows) {
      if (matrix[item.ThuTrongTuan] && matrix[item.ThuTrongTuan][item.MaTiet]) {
        matrix[item.ThuTrongTuan][item.MaTiet].push(item);
      }
    }

    return {
      rawList: rows,
      matrix
    };
  };
}

module.exports = ThoiKhoaBieuService;
