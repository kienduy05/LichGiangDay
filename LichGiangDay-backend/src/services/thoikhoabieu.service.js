
const db = require('../../config/db');
const XLSX = require('xlsx');

class ThoiKhoaBieuService {

  // ================================================================
  // 1. Lấy dữ liệu cấu trúc TreeView (Khoa -> BoMon -> LopHocPhan)
  //    Bắt buộc: maHocKy
  //    Lọc thêm: search, filterStatus ('ALL' | 'SCHEDULED' | 'UNSCHEDULED')
  // ================================================================
  static getTreeViewData = async ({ maHocKy, search = '', filterStatus = 'ALL', maBoMon = '' } = {}) => {
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
        DATE_FORMAT(lhp.NgayBatDau, '%Y-%m-%d') AS NgayBatDau,
        DATE_FORMAT(lhp.NgayKetThuc, '%Y-%m-%d') AS NgayKetThuc,
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

    if (maBoMon && maBoMon.trim() !== '') {
      lhpSql += ` AND lhp.MaBoMon = ?`;
      params.push(maBoMon.trim());
    }

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
        ph.MaToaNha,
        DATE_FORMAT(tkb.NgayBatDau, '%Y-%m-%d') AS NgayBatDau,
        DATE_FORMAT(tkb.NgayKetThuc, '%Y-%m-%d') AS NgayKetThuc
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
        DATE_FORMAT(tkb.NgayBatDau, '%Y-%m-%d') AS NgayBatDau,
        DATE_FORMAT(tkb.NgayKetThuc, '%Y-%m-%d') AS NgayKetThuc
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
        DATE_FORMAT(tkb.NgayBatDau, '%Y-%m-%d') AS NgayBatDau,
        DATE_FORMAT(tkb.NgayKetThuc, '%Y-%m-%d') AS NgayKetThuc,
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
      SELECT MaLopHocPhan, TenLopHocPhan, NgayBatDau, NgayKetThuc, MaHocKy, TrangThaiPhanCong
      FROM LopHocPhan WHERE MaLopHocPhan = ? LIMIT 1
    `, [trimmedLhp]);

    if (lhpRows.length === 0) {
      throw new Error(`Không tìm thấy lớp học phần '${trimmedLhp}'.`);
    }
    const lhp = lhpRows[0];

    if (lhp.TrangThaiPhanCong === 'Locked') {
      throw new Error(`Thời khóa biểu của lớp '${lhp.TenLopHocPhan || lhp.MaLopHocPhan}' đã được KHÓA CHÍNH THỨC. Không thể thay đổi lịch học.`);
    }

    // 2. Nếu có schedules, validate từng buổi
    if (!Array.isArray(schedules) || schedules.length === 0) {
      // Nếu gửi mảng rỗng -> Xóa toàn bộ lịch TKB của lớp này
      await db.query(`DELETE FROM BuoiHoc WHERE MaLopHocPhan = ?`, [trimmedLhp]);
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

      // Khóa theo học kỳ để tuần tự hóa các thao tác ghi lịch trong cùng phạm vi.
      await conn.query('SELECT MaHocKy FROM HocKy WHERE MaHocKy = ? FOR UPDATE', [lhp.MaHocKy]);

      // Xóa các buổi học cũ của TKB lớp này
      await conn.query(`DELETE FROM BuoiHoc WHERE MaLopHocPhan = ?`, [trimmedLhp]);

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

    if (existing.TrangThaiPhanCong === 'Locked') {
      throw new Error(`Thời khóa biểu lớp '${existing.TenLopHocPhan || existing.MaLopHocPhan}' đã được KHÓA CHÍNH THỨC. Không thể xóa thời khóa biểu.`);
    }

    // 1. Xóa các buổi học của lớp học phần này
    await db.query(`DELETE FROM BuoiHoc WHERE MaLopHocPhan = ?`, [maLopHocPhan]);

    // 2. Xóa thời khóa biểu của lớp học phần
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
      `SELECT tkb.MaThoiKhoaBieu, tkb.MaLopHocPhan, lhp.TrangThaiPhanCong, lhp.TenLopHocPhan
       FROM ThoiKhoaBieu tkb
       JOIN LopHocPhan lhp ON tkb.MaLopHocPhan = lhp.MaLopHocPhan
       WHERE tkb.MaThoiKhoaBieu = ? LIMIT 1`,
      [maThoiKhoaBieu]
    );

    if (rows.length === 0) {
      throw new Error(`Không tìm thấy bản ghi thời khóa biểu '${maThoiKhoaBieu}'.`);
    }

    if (rows[0].TrangThaiPhanCong === 'Locked') {
      throw new Error(`Thời khóa biểu của lớp '${rows[0].TenLopHocPhan || rows[0].MaLopHocPhan}' đã được KHÓA CHÍNH THỨC. Không thể xóa buổi học.`);
    }

    // 1. Xóa các buổi học liên kết với bản ghi TKB này
    await db.query(`DELETE FROM BuoiHoc WHERE MaThoiKhoaBieu = ?`, [maThoiKhoaBieu]);

    // 2. Xóa bản ghi Thời khóa biểu
    await db.query(`DELETE FROM ThoiKhoaBieu WHERE MaThoiKhoaBieu = ?`, [maThoiKhoaBieu]);

    return { success: true, maThoiKhoaBieu };
  };

  // ================================================================
  // 9. Lấy dữ liệu dạng Lưới Ma trận (Matrix Grid View)
  //    Thứ (2 -> 8) x Tiết (1 -> 5)
  // ================================================================
  static getMatrixGrid = async ({
    maHocKy = '',
    maToaNha = '',
    maPhong = '',
    maKhoa = '',
    maBoMon = '',
    maGiangVien = '',
    loaiHoc = '',
    search = '',
    tuNgay = '',
    denNgay = ''
  } = {}) => {
    let rows = [];

    // Nếu người dùng chọn tuần / khoảng ngày cụ thể (màn hình Lịch Giảng Dạy & Học Tập):
    // Ưu tiên truy vấn từ BuoiHoc để phản ánh các biến động thực tế (Báo nghỉ, Đổi ca, Dạy thay, Dạy bù)
    if (tuNgay && tuNgay.trim() !== '' && denNgay && denNgay.trim() !== '') {
      const tu = tuNgay.trim();
      const den = denNgay.trim();

      // 1. Lấy tất cả các buổi học thực tế trong tuần từ bảng BuoiHoc
      let bhSql = `
        SELECT
          bh.MaBuoiHoc,
          bh.MaThoiKhoaBieu,
          bh.MaLopHocPhan,
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
          bh.MaGiangVien,
          gv.HoTen AS TenGiangVien,
          bh.MaGiangVienGoc,
          gvGoc.HoTen AS TenGiangVienGoc,
          IF(DAYOFWEEK(bh.NgayHoc) = 1, 8, DAYOFWEEK(bh.NgayHoc)) AS ThuTrongTuan,
          DATE_FORMAT(bh.NgayHoc, '%Y-%m-%d') AS NgayHoc,
          bh.MaTiet,
          th.TenTiet,
          TIME_FORMAT(th.GioBatDau, '%H:%i') AS GioBatDau,
          TIME_FORMAT(th.GioKetThuc, '%H:%i') AS GioKetThuc,
          bh.MaPhong,
          ph.TenPhong,
          ph.MaToaNha,
          tn.TenToaNha,
          ph.SucChua,
          ph.LoaiPhong,
          DATE_FORMAT(lhp.NgayBatDau, '%Y-%m-%d') AS NgayBatDau,
          DATE_FORMAT(lhp.NgayKetThuc, '%Y-%m-%d') AS NgayKetThuc,
          bh.LoaiBuoiHoc,
          bh.TrangThai,
          bh.DaDayBu,
          bh.GhiChu,
          bh.NgayGocDoiCa,
          bh.MaTietGocDoiCa,
          bh.MaPhongGocDoiCa
        FROM BuoiHoc bh
        JOIN LopHocPhan lhp ON bh.MaLopHocPhan = lhp.MaLopHocPhan
        LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
        LEFT JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon
        LEFT JOIN Khoa k ON bm.MaKhoa = k.MaKhoa
        LEFT JOIN GiangVien gv ON bh.MaGiangVien = gv.MaGiangVien
        LEFT JOIN GiangVien gvGoc ON bh.MaGiangVienGoc = gvGoc.MaGiangVien
        LEFT JOIN TietHoc th ON bh.MaTiet = th.MaTiet
        LEFT JOIN PhongHoc ph ON bh.MaPhong = ph.MaPhong
        LEFT JOIN ToaNha tn ON ph.MaToaNha = tn.MaToaNha
        WHERE bh.NgayHoc >= ? AND bh.NgayHoc <= ? AND (bh.TrangThai IS NULL OR bh.TrangThai != 'Cancelled')
      `;

      const bhParams = [tu, den];

      if (maHocKy && maHocKy.trim() !== '') {
        bhSql += ` AND lhp.MaHocKy = ?`;
        bhParams.push(maHocKy.trim());
      }
      if (maToaNha && maToaNha.trim() !== '') {
        bhSql += ` AND ph.MaToaNha = ?`;
        bhParams.push(maToaNha.trim());
      }
      if (maPhong && maPhong.trim() !== '') {
        bhSql += ` AND bh.MaPhong = ?`;
        bhParams.push(maPhong.trim());
      }
      if (maKhoa && maKhoa.trim() !== '') {
        bhSql += ` AND bm.MaKhoa = ?`;
        bhParams.push(maKhoa.trim());
      }
      if (maBoMon && maBoMon.trim() !== '') {
        bhSql += ` AND lhp.MaBoMon = ?`;
        bhParams.push(maBoMon.trim());
      }
      if (maGiangVien && maGiangVien.trim() !== '') {
        bhSql += ` AND (bh.MaGiangVien = ? OR bh.MaGiangVienGoc = ?)`;
        bhParams.push(maGiangVien.trim(), maGiangVien.trim());
      }
      if (loaiHoc && loaiHoc.trim() !== '') {
        bhSql += ` AND lhp.LoaiHoc = ?`;
        bhParams.push(loaiHoc.trim().toUpperCase());
      }
      if (search && search.trim() !== '') {
        bhSql += ` AND (lhp.MaLopHocPhan LIKE ? OR lhp.TenLopHocPhan LIKE ? OR mh.TenMonHoc LIKE ? OR gv.HoTen LIKE ? OR ph.TenPhong LIKE ?)`;
        const kw = `%${search.trim()}%`;
        bhParams.push(kw, kw, kw, kw, kw);
      }

      const [bhRows] = await db.query(bhSql, bhParams);

      // 2. Lấy các lớp học phần chưa khóa lịch (chưa sinh BuoiHoc) từ ThoiKhoaBieu
      let tkbSql = `
        SELECT
          NULL AS MaBuoiHoc,
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
          NULL AS MaGiangVienGoc,
          NULL AS TenGiangVienGoc,
          tkb.ThuTrongTuan,
          NULL AS NgayHoc,
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
          DATE_FORMAT(tkb.NgayBatDau, '%Y-%m-%d') AS NgayBatDau,
          DATE_FORMAT(tkb.NgayKetThuc, '%Y-%m-%d') AS NgayKetThuc,
          'Regular' AS LoaiBuoiHoc,
          'Normal' AS TrangThai,
          0 AS DaDayBu,
          NULL AS GhiChu,
          NULL AS NgayGocDoiCa,
          NULL AS MaTietGocDoiCa,
          NULL AS MaPhongGocDoiCa
        FROM ThoiKhoaBieu tkb
        JOIN LopHocPhan lhp ON tkb.MaLopHocPhan = lhp.MaLopHocPhan
        LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
        LEFT JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon
        LEFT JOIN Khoa k ON bm.MaKhoa = k.MaKhoa
        LEFT JOIN GiangVien gv ON lhp.MaGiangVien = gv.MaGiangVien
        LEFT JOIN TietHoc th ON tkb.MaTiet = th.MaTiet
        LEFT JOIN PhongHoc ph ON tkb.MaPhong = ph.MaPhong
        LEFT JOIN ToaNha tn ON ph.MaToaNha = tn.MaToaNha
        WHERE (lhp.TrangThaiPhanCong != 'Locked' OR lhp.TrangThaiPhanCong IS NULL)
          AND tkb.NgayKetThuc >= ?
          AND tkb.NgayBatDau <= ?
      `;

      const tkbParams = [tu, den];

      if (maHocKy && maHocKy.trim() !== '') {
        tkbSql += ` AND lhp.MaHocKy = ?`;
        tkbParams.push(maHocKy.trim());
      }
      if (maToaNha && maToaNha.trim() !== '') {
        tkbSql += ` AND ph.MaToaNha = ?`;
        tkbParams.push(maToaNha.trim());
      }
      if (maPhong && maPhong.trim() !== '') {
        tkbSql += ` AND tkb.MaPhong = ?`;
        tkbParams.push(maPhong.trim());
      }
      if (maKhoa && maKhoa.trim() !== '') {
        tkbSql += ` AND bm.MaKhoa = ?`;
        tkbParams.push(maKhoa.trim());
      }
      if (maBoMon && maBoMon.trim() !== '') {
        tkbSql += ` AND lhp.MaBoMon = ?`;
        tkbParams.push(maBoMon.trim());
      }
      if (maGiangVien && maGiangVien.trim() !== '') {
        tkbSql += ` AND lhp.MaGiangVien = ?`;
        tkbParams.push(maGiangVien.trim());
      }
      if (loaiHoc && loaiHoc.trim() !== '') {
        tkbSql += ` AND lhp.LoaiHoc = ?`;
        tkbParams.push(loaiHoc.trim().toUpperCase());
      }
      if (search && search.trim() !== '') {
        tkbSql += ` AND (lhp.MaLopHocPhan LIKE ? OR lhp.TenLopHocPhan LIKE ? OR mh.TenMonHoc LIKE ? OR gv.HoTen LIKE ? OR ph.TenPhong LIKE ?)`;
        const kw = `%${search.trim()}%`;
        tkbParams.push(kw, kw, kw, kw, kw);
      }

      const [tkbRows] = await db.query(tkbSql, tkbParams);

      // Điền ngày học cụ thể cho các lớp chưa khóa
      const baseMonday = new Date(tu);
      tkbRows.forEach(item => {
        const offset = Math.max(0, Math.min(6, (item.ThuTrongTuan || 2) - 2));
        const dayDate = new Date(baseMonday);
        dayDate.setDate(dayDate.getDate() + offset);
        const y = dayDate.getFullYear();
        const m = String(dayDate.getMonth() + 1).padStart(2, '0');
        const d = String(dayDate.getDate()).padStart(2, '0');
        item.NgayHoc = `${y}-${m}-${d}`;
      });

      rows = [...bhRows, ...tkbRows];
    } else {
      // Trường hợp không truyền khoảng ngày cụ thể: fallback về ThoiKhoaBieu
      let sql = `
        SELECT
          NULL AS MaBuoiHoc,
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
          NULL AS MaGiangVienGoc,
          NULL AS TenGiangVienGoc,
          tkb.ThuTrongTuan,
          NULL AS NgayHoc,
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
          DATE_FORMAT(tkb.NgayBatDau, '%Y-%m-%d') AS NgayBatDau,
          DATE_FORMAT(tkb.NgayKetThuc, '%Y-%m-%d') AS NgayKetThuc,
          'Regular' AS LoaiBuoiHoc,
          'Normal' AS TrangThai,
          0 AS DaDayBu,
          NULL AS GhiChu,
          NULL AS NgayGocDoiCa,
          NULL AS MaTietGocDoiCa,
          NULL AS MaPhongGocDoiCa
        FROM ThoiKhoaBieu tkb
        JOIN LopHocPhan lhp ON tkb.MaLopHocPhan = lhp.MaLopHocPhan
        LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
        LEFT JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon
        LEFT JOIN Khoa k ON bm.MaKhoa = k.MaKhoa
        LEFT JOIN GiangVien gv ON lhp.MaGiangVien = gv.MaGiangVien
        LEFT JOIN TietHoc th ON tkb.MaTiet = th.MaTiet
        LEFT JOIN PhongHoc ph ON tkb.MaPhong = ph.MaPhong
        LEFT JOIN ToaNha tn ON ph.MaToaNha = tn.MaToaNha
        WHERE 1=1
      `;

      const params = [];

      if (maHocKy && maHocKy.trim() !== '') {
        sql += ` AND lhp.MaHocKy = ?`;
        params.push(maHocKy.trim());
      }
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
      if (maGiangVien && maGiangVien.trim() !== '') {
        sql += ` AND lhp.MaGiangVien = ?`;
        params.push(maGiangVien.trim());
      }
      if (loaiHoc && loaiHoc.trim() !== '') {
        sql += ` AND lhp.LoaiHoc = ?`;
        params.push(loaiHoc.trim().toUpperCase());
      }
      if (search && search.trim() !== '') {
        sql += ` AND (lhp.MaLopHocPhan LIKE ? OR lhp.TenLopHocPhan LIKE ? OR mh.TenMonHoc LIKE ? OR gv.HoTen LIKE ? OR ph.TenPhong LIKE ?)`;
        const kw = `%${search.trim()}%`;
        params.push(kw, kw, kw, kw, kw);
      }

      const [dbRows] = await db.query(sql, params);
      rows = dbRows;
    }

    // Sắp xếp dữ liệu theo thứ tự hiển thị chuẩn
    rows.sort((a, b) => {
      if (a.ThuTrongTuan !== b.ThuTrongTuan) return a.ThuTrongTuan - b.ThuTrongTuan;
      if (a.MaTiet !== b.MaTiet) return a.MaTiet - b.MaTiet;
      return (a.MaPhong || '').localeCompare(b.MaPhong || '');
    });

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

  // ================================================================
  // 10. [BOMON ĐỘC QUYỀN] Lấy danh sách Lớp học phần cần phân công
  //     Bắt buộc: maHocKy, maBoMon (lấy từ req.user.username)
  // ================================================================
  static getBomonAssignableClasses = async ({ maHocKy, maBoMon, search = '', filterStatus = 'ALL' } = {}) => {
    if (!maHocKy || !maHocKy.trim()) {
      throw new Error('Vui lòng chọn Học kỳ.');
    }
    if (!maBoMon || !maBoMon.trim()) {
      throw new Error('Không xác định được Bộ môn của người dùng.');
    }

    // Lấy thông tin Bộ môn
    const [bmRows] = await db.query(`
      SELECT bm.MaBoMon, bm.TenBoMon, bm.MaKhoa, k.TenKhoa
      FROM BoMon bm
      JOIN Khoa k ON bm.MaKhoa = k.MaKhoa
      WHERE bm.MaBoMon = ? LIMIT 1
    `, [maBoMon.trim()]);

    const boMonInfo = bmRows[0] || { MaBoMon: maBoMon, TenBoMon: maBoMon };

    // 1. Lấy tất cả LHP thuộc Bộ môn trong học kỳ
    let sql = `
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
        lhp.KhoaHoc,
        lhp.TrangThaiPhanCong,
        lhp.MaGiangVien,
        gv.HoTen AS TenGiangVien,
        gv.Email AS EmailGiangVien,
        lhp.NgayBatDau,
        lhp.NgayKetThuc,
        lhp.SoTuan,
        COUNT(DISTINCT tkb.MaThoiKhoaBieu) AS SoBuoiDaXep
      FROM LopHocPhan lhp
      LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      LEFT JOIN GiangVien gv ON lhp.MaGiangVien = gv.MaGiangVien
      LEFT JOIN ThoiKhoaBieu tkb ON lhp.MaLopHocPhan = tkb.MaLopHocPhan
      WHERE lhp.MaHocKy = ? AND lhp.MaBoMon = ?
    `;

    const params = [maHocKy.trim(), maBoMon.trim()];

    if (search && search.trim() !== '') {
      sql += ` AND (lhp.MaLopHocPhan LIKE ? OR lhp.TenLopHocPhan LIKE ? OR mh.TenMonHoc LIKE ? OR gv.HoTen LIKE ?)`;
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw, kw);
    }

    sql += ` GROUP BY lhp.MaLopHocPhan, lhp.TenLopHocPhan, lhp.MaMonHoc, mh.TenMonHoc, mh.SoTinChi,
                      lhp.LoaiHoc, lhp.SiSoDuKien, lhp.SiSoDangKy, lhp.MaBoMon, lhp.KhoaHoc,
                      lhp.TrangThaiPhanCong, lhp.MaGiangVien, gv.HoTen, gv.Email,
                      lhp.NgayBatDau, lhp.NgayKetThuc, lhp.SoTuan`;
    sql += ` ORDER BY lhp.TrangThaiPhanCong ASC, lhp.MaLopHocPhan ASC`;

    const [classRows] = await db.query(sql, params);

    // 2. Lấy chi tiết Thời khóa biểu của tất cả các lớp này
    const [scheduleRows] = await db.query(`
      SELECT
        tkb.MaThoiKhoaBieu,
        tkb.MaLopHocPhan,
        tkb.ThuTrongTuan,
        tkb.MaTiet,
        tt.TenTiet,
        tt.GioBatDau,
        tt.GioKetThuc,
        tkb.MaPhong,
        ph.TenPhong,
        ph.MaToaNha,
        tn.TenToaNha,
        tkb.NgayBatDau,
        tkb.NgayKetThuc
      FROM ThoiKhoaBieu tkb
      JOIN LopHocPhan lhp ON tkb.MaLopHocPhan = lhp.MaLopHocPhan
      JOIN TietHoc tt ON tkb.MaTiet = tt.MaTiet
      JOIN PhongHoc ph ON tkb.MaPhong = ph.MaPhong
      LEFT JOIN ToaNha tn ON ph.MaToaNha = tn.MaToaNha
      WHERE lhp.MaHocKy = ? AND lhp.MaBoMon = ?
      ORDER BY tkb.ThuTrongTuan ASC, tkb.MaTiet ASC
    `, [maHocKy.trim(), maBoMon.trim()]);

    // Gom schedules theo MaLopHocPhan
    const schedulesByClass = {};
    for (const sc of scheduleRows) {
      if (!schedulesByClass[sc.MaLopHocPhan]) {
        schedulesByClass[sc.MaLopHocPhan] = [];
      }
      schedulesByClass[sc.MaLopHocPhan].push(sc);
    }

    // Ghép schedules vào từng class
    const enhancedClasses = classRows.map(c => {
      const schedules = schedulesByClass[c.MaLopHocPhan] || [];
      const hasSchedule = schedules.length > 0;
      const isAssigned = !!c.MaGiangVien;
      const isLocked = c.TrangThaiPhanCong === 'Locked';
      return {
        ...c,
        schedules,
        hasSchedule,
        isAssigned,
        isLocked,
        statusGroup: !hasSchedule ? 'UNSCHEDULED' : (isLocked ? 'LOCKED' : (isAssigned ? 'ASSIGNED' : 'UNASSIGNED'))
      };
    });

    // Lọc theo filterStatus nếu có
    let filteredList = enhancedClasses;
    if (filterStatus === 'UNASSIGNED') {
      // Các lớp ĐÃ CÓ LỊCH nhưng CHƯA PHÂN CÔNG (Cần xử lý gấp)
      filteredList = enhancedClasses.filter(c => c.hasSchedule && !c.isAssigned);
    } else if (filterStatus === 'ASSIGNED') {
      // Các lớp đã phân công (chưa khóa hoặc đã khóa)
      filteredList = enhancedClasses.filter(c => c.isAssigned);
    } else if (filterStatus === 'LOCKED') {
      // Các lớp đã bị khóa bởi PĐT/Admin
      filteredList = enhancedClasses.filter(c => c.isLocked);
    } else if (filterStatus === 'SCHEDULED') {
      // Tất cả lớp đã có lịch
      filteredList = enhancedClasses.filter(c => c.hasSchedule);
    } else if (filterStatus === 'UNSCHEDULED') {
      // Các lớp chưa có lịch TKB
      filteredList = enhancedClasses.filter(c => !c.hasSchedule);
    }

    // Thống kê KPIs cho Bộ môn (Chỉ tính phân công cho các lớp đã có TKB)
    const totalClasses = enhancedClasses.length;
    const scheduledCount = enhancedClasses.filter(c => c.hasSchedule).length;
    const assignedCount = enhancedClasses.filter(c => c.hasSchedule && c.isAssigned).length;
    const lockedCount = enhancedClasses.filter(c => c.hasSchedule && c.isLocked).length;
    const unassignedScheduledCount = enhancedClasses.filter(c => c.hasSchedule && !c.isAssigned).length;
    const unscheduledCount = enhancedClasses.filter(c => !c.hasSchedule).length;

    // Đếm số giảng viên trong bộ môn đã nhận ít nhất 1 lớp có lịch TKB
    const assignedLecturerSet = new Set();
    enhancedClasses.forEach(c => {
      if (c.hasSchedule && c.MaGiangVien) assignedLecturerSet.add(c.MaGiangVien);
    });

    const [totalGvRows] = await db.query(
      `SELECT COUNT(*) AS total FROM GiangVien WHERE MaBoMon = ? AND TrangThai = 'Active'`,
      [maBoMon.trim()]
    );
    const totalLecturersInDept = totalGvRows[0]?.total || 0;

    return {
      boMonInfo,
      stats: {
        totalClasses,
        scheduledCount,
        assignedCount,
        lockedCount,
        unassignedScheduledCount,
        unscheduledCount,
        assignedLecturersCount: assignedLecturerSet.size,
        totalLecturersInDept,
        completionRate: scheduledCount > 0 ? Math.round((assignedCount / scheduledCount) * 100) : 0
      },
      classes: filteredList
    };
  };

  // ================================================================
  // 11. [BOMON ĐỘC QUYỀN] Quét kiểm tra tình trạng khả dụng của GV
  //     đối với 1 Lớp học phần cụ thể (Conflict Detection Engine)
  // ================================================================
  static getLecturerAvailabilityForClass = async ({ maLopHocPhan, maBoMon } = {}) => {
    if (!maLopHocPhan || !maLopHocPhan.trim()) {
      throw new Error('Mã lớp học phần không được để trống.');
    }
    if (!maBoMon || !maBoMon.trim()) {
      throw new Error('Không xác định được Bộ môn của người dùng.');
    }

    // 1. Lấy thông tin lớp học phần mục tiêu
    const [lhpRows] = await db.query(`
      SELECT
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        lhp.MaMonHoc,
        mh.TenMonHoc,
        mh.SoTinChi,
        lhp.LoaiHoc,
        lhp.SiSoDangKy,
        lhp.SiSoDuKien,
        lhp.MaBoMon,
        lhp.MaHocKy,
        hk.TenHocKy,
        hk.NamHoc,
        lhp.MaGiangVien,
        gv.HoTen AS TenGiangVienHienTai
      FROM LopHocPhan lhp
      LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      LEFT JOIN HocKy hk ON lhp.MaHocKy = hk.MaHocKy
      LEFT JOIN GiangVien gv ON lhp.MaGiangVien = gv.MaGiangVien
      WHERE lhp.MaLopHocPhan = ? AND lhp.MaBoMon = ? LIMIT 1
    `, [maLopHocPhan.trim(), maBoMon.trim()]);

    if (lhpRows.length === 0) {
      throw new Error(`Không tìm thấy lớp học phần '${maLopHocPhan}' thuộc bộ môn của bạn.`);
    }

    const targetClass = lhpRows[0];

    // 2. Lấy danh sách lịch học TKB của lớp này
    const [targetSchedules] = await db.query(`
      SELECT
        tkb.MaThoiKhoaBieu,
        tkb.ThuTrongTuan,
        tkb.MaTiet,
        tt.TenTiet,
        tt.GioBatDau,
        tt.GioKetThuc,
        tkb.MaPhong,
        ph.TenPhong,
        ph.MaToaNha,
        tn.TenToaNha,
        tkb.NgayBatDau,
        tkb.NgayKetThuc
      FROM ThoiKhoaBieu tkb
      JOIN TietHoc tt ON tkb.MaTiet = tt.MaTiet
      JOIN PhongHoc ph ON tkb.MaPhong = ph.MaPhong
      LEFT JOIN ToaNha tn ON ph.MaToaNha = tn.MaToaNha
      WHERE tkb.MaLopHocPhan = ?
      ORDER BY tkb.ThuTrongTuan ASC, tkb.MaTiet ASC
    `, [maLopHocPhan.trim()]);

    if (targetSchedules.length === 0) {
      return {
        targetClass,
        hasSchedule: false,
        message: 'Lớp học phần này chưa được xếp lịch TKB nên chưa thể phân công giảng viên.',
        availableLecturers: [],
        conflictedLecturers: []
      };
    }

    // 3. Lấy tất cả giảng viên thuộc Bộ môn đang Active
    const [lecturerRows] = await db.query(`
      SELECT
        gv.MaGiangVien,
        gv.HoTen,
        gv.Email,
        gv.SoDienThoai,
        gv.MaBoMon,
        bm.TenBoMon
      FROM GiangVien gv
      LEFT JOIN BoMon bm ON gv.MaBoMon = bm.MaBoMon
      WHERE gv.MaBoMon = ? AND gv.TrangThai = 'Active'
      ORDER BY gv.HoTen ASC
    `, [maBoMon.trim()]);

    // 4. Lấy tất cả các lịch học của TẤT CẢ giảng viên trong học kỳ này (ngoại trừ lớp mục tiêu)
    const [otherAssignedSchedules] = await db.query(`
      SELECT
        lhp.MaGiangVien,
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        mh.TenMonHoc,
        tkb.ThuTrongTuan,
        tkb.MaTiet,
        tt.TenTiet,
        tt.GioBatDau,
        tt.GioKetThuc,
        tkb.MaPhong,
        ph.TenPhong,
        tkb.NgayBatDau,
        tkb.NgayKetThuc
      FROM LopHocPhan lhp
      JOIN ThoiKhoaBieu tkb ON lhp.MaLopHocPhan = tkb.MaLopHocPhan
      JOIN TietHoc tt ON tkb.MaTiet = tt.MaTiet
      JOIN PhongHoc ph ON tkb.MaPhong = ph.MaPhong
      LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      WHERE lhp.MaHocKy = ?
        AND lhp.MaGiangVien IS NOT NULL
        AND lhp.MaLopHocPhan != ?
    `, [targetClass.MaHocKy, maLopHocPhan.trim()]);

    // Gom lịch theo MaGiangVien
    const schedulesByLecturer = {};
    for (const item of otherAssignedSchedules) {
      if (!schedulesByLecturer[item.MaGiangVien]) {
        schedulesByLecturer[item.MaGiangVien] = [];
      }
      schedulesByLecturer[item.MaGiangVien].push(item);
    }

    // 5. Quét xung đột và tính tải giảng dạy cho từng giảng viên
    const availableLecturers = [];
    const conflictedLecturers = [];

    for (const gv of lecturerRows) {
      const gvOtherSchedules = schedulesByLecturer[gv.MaGiangVien] || [];
      const conflicts = [];

      // Kiểm tra xung đột giữa từng slot của target class với các slot gv đã có
      for (const tSlot of targetSchedules) {
        for (const oSlot of gvOtherSchedules) {
          // Trùng Thứ và Tiết
          if (tSlot.ThuTrongTuan === oSlot.ThuTrongTuan && tSlot.MaTiet === oSlot.MaTiet) {
            // Kiểm tra giao thoa khoảng thời gian [NgayBatDau, NgayKetThuc]
            const tStart = new Date(tSlot.NgayBatDau);
            const tEnd = new Date(tSlot.NgayKetThuc);
            const oStart = new Date(oSlot.NgayBatDau);
            const oEnd = new Date(oSlot.NgayKetThuc);

            const isOverlap = (tStart <= oEnd && tEnd >= oStart);

            if (isOverlap) {
              const thuLabels = { 2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật' };
              conflicts.push({
                conflictedWithClass: oSlot.TenLopHocPhan || oSlot.MaLopHocPhan,
                subjectName: oSlot.TenMonHoc,
                thuLabel: thuLabels[oSlot.ThuTrongTuan] || `Thứ ${oSlot.ThuTrongTuan}`,
                tietLabel: oSlot.TenTiet,
                roomName: oSlot.TenPhong,
                reason: `Trùng giờ với lớp "${oSlot.TenLopHocPhan || oSlot.MaLopHocPhan}" (${thuLabels[oSlot.ThuTrongTuan]}, ${oSlot.TenTiet} tại P.${oSlot.TenPhong})`
              });
            }
          }
        }
      }

      // Đếm số lớp độc nhất và tổng số tiết/tuần hiện tại của GV
      const uniqueClassSet = new Set(gvOtherSchedules.map(s => s.MaLopHocPhan));
      const currentClassCount = uniqueClassSet.size;
      const totalPeriodsPerWeek = gvOtherSchedules.length * 3; // Tiết tiêu chuẩn 3 tiết/buổi

      const gvData = {
        ...gv,
        isCurrentlyAssigned: targetClass.MaGiangVien === gv.MaGiangVien,
        currentClassCount,
        totalPeriodsPerWeek,
        conflictsCount: conflicts.length,
        conflicts
      };

      if (conflicts.length === 0) {
        availableLecturers.push(gvData);
      } else {
        conflictedLecturers.push(gvData);
      }
    }

    // Sắp xếp GV khả dụng: GV đang được gán lên đầu, tiếp theo là GV có ít tiết/tuần nhất (cân bằng tải)
    availableLecturers.sort((a, b) => {
      if (a.isCurrentlyAssigned) return -1;
      if (b.isCurrentlyAssigned) return 1;
      return a.totalPeriodsPerWeek - b.totalPeriodsPerWeek || a.HoTen.localeCompare(b.HoTen);
    });

    return {
      targetClass,
      targetSchedules,
      hasSchedule: true,
      availableCount: availableLecturers.length,
      conflictedCount: conflictedLecturers.length,
      availableLecturers,
      conflictedLecturers
    };
  };

  // ================================================================
  // 12. [BOMON ĐỘC QUYỀN] Xem trước Thời khóa biểu tuần của Giảng viên
  // ================================================================
  static getLecturerWeeklySchedule = async ({ maGiangVien, maHocKy, maBoMon, userId } = {}) => {
    if (!maGiangVien && userId) {
      const [gvFound] = await db.query('SELECT MaGiangVien FROM GiangVien WHERE UserId = ? LIMIT 1', [userId]);
      if (gvFound.length > 0) {
        maGiangVien = gvFound[0].MaGiangVien;
      }
    }

    if (!maGiangVien || !maGiangVien.trim()) {
      throw new Error('Vui lòng cung cấp mã giảng viên.');
    }
    if (!maHocKy || !maHocKy.trim()) {
      const [hkRows] = await db.query('SELECT MaHocKy FROM HocKy ORDER BY NgayBatDau DESC LIMIT 1');
      if (hkRows.length > 0) {
        maHocKy = hkRows[0].MaHocKy;
      } else {
        throw new Error('Vui lòng chọn Học kỳ.');
      }
    }

    const [gvRows] = await db.query(`
      SELECT gv.MaGiangVien, gv.HoTen, gv.Email, gv.SoDienThoai, bm.TenBoMon
      FROM GiangVien gv
      LEFT JOIN BoMon bm ON gv.MaBoMon = bm.MaBoMon
      WHERE gv.MaGiangVien = ? LIMIT 1
    `, [maGiangVien.trim()]);

    if (gvRows.length === 0) {
      throw new Error('Không tìm thấy giảng viên.');
    }

    const [rows] = await db.query(`
      SELECT
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        mh.TenMonHoc,
        lhp.LoaiHoc,
        lhp.SiSoDangKy,
        tkb.ThuTrongTuan,
        tkb.MaTiet,
        tt.TenTiet,
        tt.GioBatDau,
        tt.GioKetThuc,
        tkb.MaPhong,
        ph.TenPhong,
        tn.TenToaNha,
        tkb.NgayBatDau,
        tkb.NgayKetThuc
      FROM ThoiKhoaBieu tkb
      JOIN LopHocPhan lhp ON tkb.MaLopHocPhan = lhp.MaLopHocPhan
      JOIN TietHoc tt ON tkb.MaTiet = tt.MaTiet
      JOIN PhongHoc ph ON tkb.MaPhong = ph.MaPhong
      LEFT JOIN ToaNha tn ON ph.MaToaNha = tn.MaToaNha
      LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      WHERE lhp.MaGiangVien = ? AND lhp.MaHocKy = ?
      ORDER BY tkb.ThuTrongTuan ASC, tkb.MaTiet ASC
    `, [maGiangVien.trim(), maHocKy.trim()]);

    // Tạo ma trận [thu][tiet]
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
      lecturer: gvRows[0],
      totalClasses: new Set(rows.map(r => r.MaLopHocPhan)).size,
      totalPeriodsPerWeek: rows.length * 3,
      scheduleList: rows,
      matrix
    };
  };

  // ================================================================
  // 13. [BOMON ĐỘC QUYỀN] Thống kê Tải Giảng Dạy toàn bộ Giảng viên
  // ================================================================
  static getBomonWorkloadSummary = async ({ maBoMon, maHocKy } = {}) => {
    if (!maBoMon || !maBoMon.trim()) {
      throw new Error('Không xác định được Bộ môn.');
    }
    if (!maHocKy || !maHocKy.trim()) {
      throw new Error('Vui lòng chọn Học kỳ.');
    }

    // 1. Lấy tất cả giảng viên trong bộ môn
    const [lecturers] = await db.query(`
      SELECT
        gv.MaGiangVien,
        gv.HoTen,
        gv.Email,
        gv.SoDienThoai,
        gv.TrangThai
      FROM GiangVien gv
      WHERE gv.MaBoMon = ? AND gv.TrangThai = 'Active'
      ORDER BY gv.HoTen ASC
    `, [maBoMon.trim()]);

    // 2. Lấy tất cả các lớp đã phân công cho giảng viên trong kỳ
    const [assignedSchedules] = await db.query(`
      SELECT
        lhp.MaGiangVien,
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        mh.TenMonHoc,
        lhp.LoaiHoc,
        mh.SoTinChi,
        lhp.SiSoDangKy,
        tkb.ThuTrongTuan,
        tkb.MaTiet,
        tt.TenTiet,
        ph.TenPhong
      FROM LopHocPhan lhp
      LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      LEFT JOIN ThoiKhoaBieu tkb ON lhp.MaLopHocPhan = tkb.MaLopHocPhan
      LEFT JOIN TietHoc tt ON tkb.MaTiet = tt.MaTiet
      LEFT JOIN PhongHoc ph ON tkb.MaPhong = ph.MaPhong
      WHERE lhp.MaBoMon = ? AND lhp.MaHocKy = ? AND lhp.MaGiangVien IS NOT NULL
      ORDER BY lhp.MaGiangVien ASC, lhp.MaLopHocPhan ASC
    `, [maBoMon.trim(), maHocKy.trim()]);

    // Gom dữ liệu theo Giảng viên
    const classesByGv = {};
    for (const row of assignedSchedules) {
      if (!classesByGv[row.MaGiangVien]) {
        classesByGv[row.MaGiangVien] = {};
      }
      if (!classesByGv[row.MaGiangVien][row.MaLopHocPhan]) {
        classesByGv[row.MaGiangVien][row.MaLopHocPhan] = {
          maLopHocPhan: row.MaLopHocPhan,
          tenLopHocPhan: row.TenLopHocPhan,
          tenMonHoc: row.TenMonHoc,
          loaiHoc: row.LoaiHoc,
          soTinChi: row.SoTinChi,
          siSo: row.SiSoDangKy,
          slots: []
        };
      }
      if (row.ThuTrongTuan) {
        const thuLabels = { 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5', 6: 'T6', 7: 'T7', 8: 'CN' };
        classesByGv[row.MaGiangVien][row.MaLopHocPhan].slots.push({
          thuLabel: thuLabels[row.ThuTrongTuan] || `T${row.ThuTrongTuan}`,
          tietLabel: row.TenTiet,
          phong: row.TenPhong
        });
      }
    }

    const STANDARD_QUOTA_PERIODS = 12; // Định mức chuẩn 12 tiết/tuần

    const workloadList = lecturers.map(gv => {
      const gvClassesMap = classesByGv[gv.MaGiangVien] || {};
      const classList = Object.values(gvClassesMap);
      const totalClasses = classList.length;

      // Tính tổng số tiết/tuần (mỗi slot TKB = 3 tiết)
      let totalPeriodsPerWeek = 0;
      classList.forEach(c => {
        totalPeriodsPerWeek += (c.slots.length > 0 ? c.slots.length * 3 : 3);
      });

      const quotaPercent = Math.round((totalPeriodsPerWeek / STANDARD_QUOTA_PERIODS) * 100);

      return {
        ...gv,
        totalClasses,
        totalPeriodsPerWeek,
        standardQuota: STANDARD_QUOTA_PERIODS,
        quotaPercent,
        classList
      };
    });

    // Sắp xếp theo số tiết giảm dần
    workloadList.sort((a, b) => b.totalPeriodsPerWeek - a.totalPeriodsPerWeek || a.HoTen.localeCompare(b.HoTen));

    return {
      totalLecturers: lecturers.length,
      assignedLecturersCount: workloadList.filter(w => w.totalClasses > 0).length,
      unassignedLecturersCount: workloadList.filter(w => w.totalClasses === 0).length,
      workloadList
    };
  };

  // ================================================================
  // 14. [BOMON ĐỘC QUYỀN] Thực hiện phân công Giảng viên vào Lớp HP
  // ================================================================
  static assignLecturerToClass = async ({ maLopHocPhan, maGiangVien, maBoMon, allowOverride = false } = {}) => {
    if (!maLopHocPhan || !maLopHocPhan.trim()) {
      throw new Error('Mã lớp học phần không được để trống.');
    }
    if (!maGiangVien || !maGiangVien.trim()) {
      throw new Error('Vui lòng chọn Giảng viên cần phân công.');
    }
    if (!maBoMon || !maBoMon.trim()) {
      throw new Error('Không xác định được Bộ môn của người dùng.');
    }

    // 1. Xác thực Lớp học phần thuộc đúng Bộ môn
    const [lhpRows] = await db.query(`
      SELECT MaLopHocPhan, TenLopHocPhan, MaMonHoc, MaBoMon, MaHocKy, TrangThaiPhanCong
      FROM LopHocPhan
      WHERE MaLopHocPhan = ? AND MaBoMon = ? LIMIT 1
    `, [maLopHocPhan.trim(), maBoMon.trim()]);

    if (lhpRows.length === 0) {
      throw new Error(`Lớp học phần '${maLopHocPhan}' không tồn tại hoặc không thuộc quyền quản lý của Bộ môn bạn.`);
    }

    const targetClass = lhpRows[0];

    // Chặn thay đổi nếu lớp đã bị Admin/PĐT khóa
    if (targetClass.TrangThaiPhanCong === 'Locked') {
      throw new Error(`Thời khóa biểu của lớp '${targetClass.TenLopHocPhan || targetClass.MaLopHocPhan}' đã được Phòng Đào Tạo chốt và KHÓA LỊCH. Bộ môn không thể thay đổi phân công giảng viên.`);
    }

    // 2. Xác thực Giảng viên thuộc Bộ môn & Active
    const [gvRows] = await db.query(`
      SELECT MaGiangVien, HoTen, MaBoMon, TrangThai
      FROM GiangVien
      WHERE MaGiangVien = ? LIMIT 1
    `, [maGiangVien.trim()]);

    if (gvRows.length === 0) {
      throw new Error(`Không tìm thấy giảng viên có mã '${maGiangVien}'.`);
    }

    const gv = gvRows[0];
    if (gv.TrangThai !== 'Active') {
      throw new Error(`Giảng viên '${gv.HoTen}' đang ở trạng thái '${gv.TrangThai}', không thể phân công.`);
    }

    // 3. Kiểm tra xung đột trùng lịch (nếu không allowOverride)
    if (!allowOverride) {
      const availability = await ThoiKhoaBieuService.getLecturerAvailabilityForClass({
        maLopHocPhan: targetClass.MaLopHocPhan,
        maBoMon
      });

      const conflicted = availability.conflictedLecturers.find(c => c.MaGiangVien === maGiangVien.trim());
      if (conflicted) {
        const firstConflict = conflicted.conflicts[0];
        const err = new Error(
          `Trùng lịch dạy: Giảng viên ${gv.HoTen} đã có lịch dạy lớp "${firstConflict.conflictedWithClass}" vào ${firstConflict.thuLabel}, ${firstConflict.tietLabel} tại ${firstConflict.roomName}.`
        );
        err.statusCode = 409;
        err.conflictDetails = conflicted.conflicts;
        throw err;
      }
    }

    // 4. Thực hiện Cập nhật trong LopHocPhan & BuoiHoc
    await db.query(`
      UPDATE LopHocPhan
      SET MaGiangVien = ?, TrangThaiPhanCong = 'Assigned'
      WHERE MaLopHocPhan = ?
    `, [maGiangVien.trim(), maLopHocPhan.trim()]);

    // Cập nhật đồng bộ BuoiHoc (nếu đã có dữ liệu buổi học)
    await db.query(`
      UPDATE BuoiHoc
      SET MaGiangVien = ?
      WHERE MaLopHocPhan = ?
    `, [maGiangVien.trim(), maLopHocPhan.trim()]);

    return {
      maLopHocPhan: targetClass.MaLopHocPhan,
      tenLopHocPhan: targetClass.TenLopHocPhan,
      maGiangVien: gv.MaGiangVien,
      tenGiangVien: gv.HoTen,
      trangThaiPhanCong: 'Assigned'
    };
  };

  // ================================================================
  // 15. [BOMON ĐỘC QUYỀN] Hủy phân công Giảng viên khỏi Lớp HP
  // ================================================================
  static unassignLecturerFromClass = async ({ maLopHocPhan, maBoMon } = {}) => {
    if (!maLopHocPhan || !maLopHocPhan.trim()) {
      throw new Error('Mã lớp học phần không được để trống.');
    }
    if (!maBoMon || !maBoMon.trim()) {
      throw new Error('Không xác định được Bộ môn của người dùng.');
    }

    // Xác thực Lớp học phần thuộc đúng Bộ môn
    const [lhpRows] = await db.query(`
      SELECT MaLopHocPhan, TenLopHocPhan, MaGiangVien, TrangThaiPhanCong
      FROM LopHocPhan
      WHERE MaLopHocPhan = ? AND MaBoMon = ? LIMIT 1
    `, [maLopHocPhan.trim(), maBoMon.trim()]);

    if (lhpRows.length === 0) {
      throw new Error(`Lớp học phần '${maLopHocPhan}' không tồn tại hoặc không thuộc Bộ môn của bạn.`);
    }

    // Chặn hủy phân công nếu lớp đã bị Admin/PĐT khóa
    if (lhpRows[0].TrangThaiPhanCong === 'Locked') {
      throw new Error(`Thời khóa biểu của lớp '${lhpRows[0].TenLopHocPhan || lhpRows[0].MaLopHocPhan}' đã được Phòng Đào Tạo chốt và KHÓA LỊCH. Bộ môn không thể hủy phân công giảng viên.`);
    }

    await db.query(`
      UPDATE LopHocPhan
      SET MaGiangVien = NULL, TrangThaiPhanCong = 'Unassigned'
      WHERE MaLopHocPhan = ?
    `, [maLopHocPhan.trim()]);

    await db.query(`
      UPDATE BuoiHoc
      SET MaGiangVien = NULL
      WHERE MaLopHocPhan = ?
    `, [maLopHocPhan.trim()]);

    return {
      maLopHocPhan: maLopHocPhan.trim(),
      trangThaiPhanCong: 'Unassigned'
    };
  };

  // ================================================================
  // 16. [ADMIN / PHONGDAOTAO] Khóa lịch Lớp học phần & Phát sinh BuoiHoc chính thức
  // ================================================================
  static lockScheduleForClass = async ({ maLopHocPhan } = {}) => {
    if (!maLopHocPhan || !maLopHocPhan.trim()) {
      throw new Error('Mã lớp học phần không được để trống.');
    }

    // 1. Kiểm tra Lớp học phần
    const [lhpRows] = await db.query(`
      SELECT lhp.MaLopHocPhan, lhp.TenLopHocPhan, lhp.MaGiangVien, lhp.MaBoMon,
             lhp.NgayBatDau, lhp.NgayKetThuc, lhp.TrangThaiPhanCong,
             gv.HoTen AS TenGiangVien
      FROM LopHocPhan lhp
      LEFT JOIN GiangVien gv ON lhp.MaGiangVien = gv.MaGiangVien
      WHERE lhp.MaLopHocPhan = ? LIMIT 1
    `, [maLopHocPhan.trim()]);

    if (lhpRows.length === 0) {
      throw new Error(`Lớp học phần '${maLopHocPhan}' không tồn tại.`);
    }

    const lhp = lhpRows[0];
    if (!lhp.MaGiangVien) {
      throw new Error(`Lớp học phần '${lhp.TenLopHocPhan || lhp.MaLopHocPhan}' chưa được Bộ môn phân công giảng viên. Vui lòng phân công giảng viên trước khi khóa lịch.`);
    }

    // 2. Lấy danh sách TKB của lớp này
    const [schedules] = await db.query(`
      SELECT MaThoiKhoaBieu, ThuTrongTuan, MaTiet, MaPhong, NgayBatDau, NgayKetThuc
      FROM ThoiKhoaBieu
      WHERE MaLopHocPhan = ?
      ORDER BY ThuTrongTuan ASC, MaTiet ASC
    `, [lhp.MaLopHocPhan]);

    if (schedules.length === 0) {
      throw new Error(`Lớp học phần '${lhp.TenLopHocPhan || lhp.MaLopHocPhan}' chưa có lịch học thời khóa biểu. Không thể khóa lịch.`);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 3. Đánh dấu trạng thái 'Locked'
      await conn.query(`
        UPDATE LopHocPhan
        SET TrangThaiPhanCong = 'Locked'
        WHERE MaLopHocPhan = ?
      `, [lhp.MaLopHocPhan]);

      await conn.query(`
        UPDATE ThoiKhoaBieu
        SET TrangThai = 'Locked', ThoiGianBoMonXacNhan = NOW()
        WHERE MaLopHocPhan = ?
      `, [lhp.MaLopHocPhan]);

      // 4. Phát sinh danh sách BuoiHoc chính thức cho toàn bộ học kỳ nếu chưa có
      const [existingBh] = await conn.query(
        `SELECT COUNT(*) as count FROM BuoiHoc WHERE MaLopHocPhan = ?`,
        [lhp.MaLopHocPhan]
      );

      if (existingBh[0].count === 0) {
        const buoiHocRows = [];
        let seq = 1;

        for (const sc of schedules) {
          const rawStart = String(sc.NgayBatDau || lhp.NgayBatDau).slice(0, 10);
          const rawEnd = String(sc.NgayKetThuc || lhp.NgayKetThuc).slice(0, 10);

          const [sY, sM, sD] = rawStart.split('-').map(Number);
          const [eY, eM, eD] = rawEnd.split('-').map(Number);

          // Khởi tạo tại 12h trưa để tránh hoàn toàn mọi vấn đề lệch múi giờ
          let curr = new Date(sY, sM - 1, sD, 12, 0, 0);
          const endLimit = new Date(eY, eM - 1, eD, 23, 59, 59);

          // Quy đổi Thứ trong tuần sang getDay() của JavaScript:
          // Thứ 2 (2) -> 1 (Monday)
          // Thứ 3 (3) -> 2 (Tuesday)
          // Thứ 4 (4) -> 3 (Wednesday)
          // Thứ 5 (5) -> 4 (Thursday)
          // Thứ 6 (6) -> 5 (Friday)
          // Thứ 7 (7) -> 6 (Saturday)
          // Chủ nhật (8) -> 0 (Sunday)
          const targetDay = sc.ThuTrongTuan === 8 ? 0 : sc.ThuTrongTuan - 1;

          while (curr.getDay() !== targetDay) {
            curr.setDate(curr.getDate() + 1);
          }

          while (curr <= endLimit) {
            const y = curr.getFullYear();
            const m = String(curr.getMonth() + 1).padStart(2, '0');
            const d = String(curr.getDate()).padStart(2, '0');
            const ngayHocStr = `${y}-${m}-${d}`;
            const dateCompact = `${y}${m}${d}`;

            const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
            const maBuoiHoc = `BH_${dateCompact}_${randHex}_${seq++}`;

            buoiHocRows.push([
              maBuoiHoc,
              lhp.MaLopHocPhan,
              lhp.MaGiangVien,
              sc.MaThoiKhoaBieu,
              ngayHocStr,
              sc.MaTiet,
              sc.MaPhong,
              'Regular',
              'Normal'
            ]);

            curr.setDate(curr.getDate() + 7);
          }
        }

        // Tối ưu hóa: Bulk Insert tất cả các buổi học trong 1 query duy nhất thay vì lặp từng câu
        if (buoiHocRows.length > 0) {
          const CHUNK_SIZE = 500;
          for (let i = 0; i < buoiHocRows.length; i += CHUNK_SIZE) {
            const chunk = buoiHocRows.slice(i, i + CHUNK_SIZE);
            await conn.query(`
              INSERT INTO BuoiHoc (
                MaBuoiHoc, MaLopHocPhan, MaGiangVien, MaThoiKhoaBieu,
                NgayHoc, MaTiet, MaPhong, LoaiBuoiHoc, TrangThai
              ) VALUES ?
            `, [chunk]);
          }
        }
      }

      await conn.commit();

      return {
        success: true,
        maLopHocPhan: lhp.MaLopHocPhan,
        tenLopHocPhan: lhp.TenLopHocPhan,
        tenGiangVien: lhp.TenGiangVien,
        trangThai: 'Locked',
        message: `Đã khóa thời khóa biểu lớp '${lhp.TenLopHocPhan || lhp.MaLopHocPhan}' thành công. Toàn bộ lịch dạy chính thức đã được chốt!`
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  };

  // ================================================================
  // 17. [ADMIN / PHONGDAOTAO] Mở khóa lịch Lớp học phần (Unlock)
  // ================================================================
  static unlockScheduleForClass = async ({ maLopHocPhan } = {}) => {
    throw new Error('Tính năng mở khóa lịch đã bị vô hiệu hóa hoàn toàn. Lịch học một khi đã khóa sẽ được chốt vĩnh viễn.');
  };

  // ================================================================
  // 18. [ADMIN / PHONGDAOTAO] Khóa đồng loạt tất cả các lớp đã phân công trong học kỳ
  // ================================================================
  static lockAllAssignedClasses = async ({ maHocKy, maKhoa, maBoMon } = {}) => {
    if (!maHocKy || !maHocKy.trim()) {
      throw new Error('Vui lòng chọn Học kỳ.');
    }

    let sql = `
      SELECT lhp.MaLopHocPhan, lhp.TenLopHocPhan, lhp.MaGiangVien, lhp.NgayBatDau, lhp.NgayKetThuc
      FROM LopHocPhan lhp
      LEFT JOIN BoMon bm ON lhp.MaBoMon = bm.MaBoMon
      WHERE lhp.MaHocKy = ?
        AND lhp.MaGiangVien IS NOT NULL
        AND (lhp.TrangThaiPhanCong IS NULL OR lhp.TrangThaiPhanCong != 'Locked')
        AND EXISTS (SELECT 1 FROM ThoiKhoaBieu tkb WHERE tkb.MaLopHocPhan = lhp.MaLopHocPhan)
    `;
    const params = [maHocKy.trim()];

    if (maKhoa && maKhoa.trim()) {
      sql += ` AND bm.MaKhoa = ?`;
      params.push(maKhoa.trim());
    }
    if (maBoMon && maBoMon.trim()) {
      sql += ` AND lhp.MaBoMon = ?`;
      params.push(maBoMon.trim());
    }

    const [rows] = await db.query(sql, params);
    if (!rows || rows.length === 0) {
      return {
        success: true,
        lockedCount: 0,
        message: 'Hiện không có lớp học phần nào đã phân công cần khóa.'
      };
    }

    const lhpIds = rows.map(r => r.MaLopHocPhan);
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Cập nhật trạng thái Locked hàng loạt cho LopHocPhan
      await conn.query(
        `UPDATE LopHocPhan SET TrangThaiPhanCong = 'Locked' WHERE MaLopHocPhan IN (?)`,
        [lhpIds]
      );

      // 2. Cập nhật trạng thái Locked hàng loạt cho ThoiKhoaBieu
      await conn.query(
        `UPDATE ThoiKhoaBieu SET TrangThai = 'Locked', ThoiGianBoMonXacNhan = NOW() WHERE MaLopHocPhan IN (?)`,
        [lhpIds]
      );

      // 3. Lấy toàn bộ schedules của các lớp cần khóa
      const [allSchedules] = await conn.query(`
        SELECT MaThoiKhoaBieu, MaLopHocPhan, ThuTrongTuan, MaTiet, MaPhong, NgayBatDau, NgayKetThuc
        FROM ThoiKhoaBieu
        WHERE MaLopHocPhan IN (?)
        ORDER BY MaLopHocPhan, ThuTrongTuan, MaTiet
      `, [lhpIds]);

      // 4. Kiểm tra những lớp nào đã có BuoiHoc trong DB
      const [existingBh] = await conn.query(
        `SELECT DISTINCT MaLopHocPhan FROM BuoiHoc WHERE MaLopHocPhan IN (?)`,
        [lhpIds]
      );
      const existingLhpSet = new Set(existingBh.map(b => b.MaLopHocPhan));

      const lhpMap = new Map();
      rows.forEach(r => lhpMap.set(r.MaLopHocPhan, r));

      const schedulesByLhp = new Map();
      allSchedules.forEach(sc => {
        if (!schedulesByLhp.has(sc.MaLopHocPhan)) {
          schedulesByLhp.set(sc.MaLopHocPhan, []);
        }
        schedulesByLhp.get(sc.MaLopHocPhan).push(sc);
      });

      // 5. Sinh toàn bộ danh sách BuoiHoc trong bộ nhớ RAM
      const allBuoiHocRows = [];
      let seq = 1;

      for (const [lhpId, scList] of schedulesByLhp.entries()) {
        if (existingLhpSet.has(lhpId)) continue;
        const lhp = lhpMap.get(lhpId);
        if (!lhp || !lhp.MaGiangVien) continue;

        for (const sc of scList) {
          const rawStart = String(sc.NgayBatDau || lhp.NgayBatDau).slice(0, 10);
          const rawEnd = String(sc.NgayKetThuc || lhp.NgayKetThuc).slice(0, 10);
          const [sY, sM, sD] = rawStart.split('-').map(Number);
          const [eY, eM, eD] = rawEnd.split('-').map(Number);

          let curr = new Date(sY, sM - 1, sD, 12, 0, 0);
          const endLimit = new Date(eY, eM - 1, eD, 23, 59, 59);
          const targetDay = sc.ThuTrongTuan === 8 ? 0 : sc.ThuTrongTuan - 1;

          while (curr.getDay() !== targetDay) {
            curr.setDate(curr.getDate() + 1);
          }

          while (curr <= endLimit) {
            const y = curr.getFullYear();
            const m = String(curr.getMonth() + 1).padStart(2, '0');
            const d = String(curr.getDate()).padStart(2, '0');
            const ngayHocStr = `${y}-${m}-${d}`;
            const dateCompact = `${y}${m}${d}`;

            const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
            const maBuoiHoc = `BH_${dateCompact}_${randHex}_${seq++}`;

            allBuoiHocRows.push([
              maBuoiHoc,
              lhp.MaLopHocPhan,
              lhp.MaGiangVien,
              sc.MaThoiKhoaBieu,
              ngayHocStr,
              sc.MaTiet,
              sc.MaPhong,
              'Regular',
              'Normal'
            ]);

            curr.setDate(curr.getDate() + 7);
          }
        }
      }

      // 6. Bulk insert toàn bộ BuoiHoc theo lô (chunks 500 rows) cực nhanh
      const CHUNK_SIZE = 500;
      for (let i = 0; i < allBuoiHocRows.length; i += CHUNK_SIZE) {
        const chunk = allBuoiHocRows.slice(i, i + CHUNK_SIZE);
        await conn.query(`
          INSERT INTO BuoiHoc (
            MaBuoiHoc, MaLopHocPhan, MaGiangVien, MaThoiKhoaBieu,
            NgayHoc, MaTiet, MaPhong, LoaiBuoiHoc, TrangThai
          ) VALUES ?
        `, [chunk]);
      }

      await conn.commit();

      return {
        success: true,
        lockedCount: rows.length,
        buoiHocCount: allBuoiHocRows.length,
        message: `Đã chốt & khóa thành công toàn bộ ${rows.length} lớp học phần đã được phân công!`
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  };

  // ================================================================
  // 19. IMPORT THỜI KHÓA BIỂU TOÀN DIỆN (LỚP HỌC PHẦN + LỊCH HỌC)
  // ================================================================

  /**
   * Chuẩn hóa chuỗi tiết từ Excel thành MaTiet (1..4) khớp với bảng TietHoc
   */
  static mapExcelTietToMaTiet(rawTiet) {
    if (!rawTiet) return null;
    const str = String(rawTiet).replace(/\s+/g, '');
    if (str.includes('1,2,3') || str === '1-3' || str.startsWith('1,')) return 1;
    if (str.includes('4,5,6') || str === '4-6' || str.startsWith('4,')) return 2;
    if (str.includes('7,8,9') || str === '7-9' || str.startsWith('7,')) return 3;
    if (str.includes('10,11,12') || str === '10-12' || str.startsWith('10,')) return 4;

    const firstNum = parseInt(str.match(/\d+/)?.[0], 10);
    if (firstNum >= 1 && firstNum <= 3) return 1;
    if (firstNum >= 4 && firstNum <= 6) return 2;
    if (firstNum >= 7 && firstNum <= 9) return 3;
    if (firstNum >= 10 && firstNum <= 12) return 4;
    return null;
  }

  /**
   * Phân tích khoảng thời gian (DD/MM-DD/MM/YY) thành YYYY-MM-DD
   */
  static parseDateRange(str, defaultStart, defaultEnd) {
    if (!str) return { startDate: defaultStart, endDate: defaultEnd };
    let cleaned = String(str)
      .replace(/[\r\n\t]+/g, ' ')
      .trim()
      .replace(/\s*(?:–|—|->|đến|den)\s*/gi, '-')
      .replace(/\s+/g, '');

    const m = cleaned.match(/^(\d{1,2})[\/\.](\d{1,2})(?:[\/\.](\d{2,4}))?-(\d{1,2})[\/\.](\d{1,2})(?:[\/\.](\d{2,4}))?$/);
    if (!m) return { startDate: defaultStart, endDate: defaultEnd };

    let [, sD, sM, sY, eD, eM, eY] = m;
    const fallbackYear = (defaultStart && String(defaultStart).slice(0, 4)) || new Date().getFullYear().toString();

    if (eY && eY.length === 2) eY = '20' + eY;
    if (!eY) eY = fallbackYear;

    if (sY && sY.length === 2) sY = '20' + sY;
    if (!sY) sY = eY;

    const startDate = `${sY}-${String(sM).padStart(2, '0')}-${String(sD).padStart(2, '0')}`;
    const endDate = `${eY}-${String(eM).padStart(2, '0')}-${String(eD).padStart(2, '0')}`;
    return { startDate, endDate };
  }

  /**
   * Chuẩn hóa mã phòng học, nhận diện phòng trực tuyến -> ONLINE
   * Xử lý triệt để lỗi dấu cách, xuống dòng trong Excel (VD: "603- A7", "603 - A7", "603\nA7" -> "603-A7")
   * Riêng phòng có hậu tố NCT (VD: "201A5 NCT(80)", "202A5 NCT") thì giữ nguyên khoảng trắng
   */
  static normalizeRoom(raw) {
    if (!raw) return '';
    let s = String(raw).replace(/[\r\n\t]+/g, ' ').trim();
    if (/trực\s*tuyến|online|zoom|meet|teams/i.test(s)) {
      return 'ONLINE';
    }
    // Bỏ tiền tố Phòng, P., P (nếu sau đó là số phòng)
    s = s.replace(/^(?:phòng|p)[\.\s]*(?=\d)/iu, '');

    // RIÊNG VỚI CÁC PHÒNG CÓ HẬU TỐ NCT (VD: "201A5 NCT(80)", "202A5 NCT", "203A5 NCT"):
    // Chuẩn hóa về đúng định dạng: {số_phòng}A5 NCT
    if (/NCT/i.test(s)) {
      s = s.replace(/[_/\\–—]/g, '-').replace(/\s*-\s*/g, '-');
      s = s.replace(/\s+/g, ' ').trim().toUpperCase();
      s = s.replace(/^(\d+)\s*[- ]\s*A5\s*[- ]\s*NCT/i, '$1A5 NCT');
      s = s.replace(/\s+\(/g, '(');
      return s;
    }

    // Với các phòng thông thường (VD: "603- A7", "104-A5", "406-A3"):
    // Thay thế các ký tự gạch nối đặc biệt hoặc gạch dưới, gạch chéo
    s = s.replace(/[_/\\–—]/g, '-');
    // Xóa sạch khoảng trắng xung quanh dấu gạch ngang (VD: "603- A7" -> "603-A7")
    s = s.replace(/\s*-\s*/g, '-');
    // Nếu giữa số phòng và tên tòa chỉ có dấu cách (VD: "603 A7" -> "603-A7")
    s = s.replace(/^(\d+)\s+([a-zA-Z0-9]+.*)$/, '$1-$2');
    // Xóa mọi khoảng trắng còn sót lại và viết hoa
    s = s.replace(/\s+/g, '').toUpperCase();
    return s;
  }

  /**
   * Sinh mã lớp học phần chuẩn: [Mã học phần]-[Hậu tố lớp tín chỉ]
   * Ví dụ:
   *  - IT1.233.3 và An ninh mạng-1-1-25(N01) -> IT1.233.3-1-1-25(N01)
   *  - IT1.233.3 và An ninh mạng-1-1-25(N01.BT1) -> IT1.233.3-1-1-25(N01.BT1)
   */
  static generateMaLopHocPhan(cleanMaMonHoc, lopMonTinChi) {
    if (!lopMonTinChi) return cleanMaMonHoc || '';
    const safeLop = String(lopMonTinChi).trim();
    const match = safeLop.match(/-\s*(\d+.*)$/);
    let suffix = '';
    if (match) {
      suffix = `-${match[1].trim()}`;
    } else if (safeLop.includes('-')) {
      suffix = `-${safeLop.substring(safeLop.indexOf('-') + 1).trim()}`;
    } else {
      suffix = `-${safeLop}`;
    }
    return cleanMaMonHoc ? `${cleanMaMonHoc}${suffix}` : suffix.replace(/^-/, '');
  }

  /**
   * Đọc và phân tích file Excel Thời khóa biểu, đối soát CSDL và trả về danh sách xem trước
   */
  static previewImportThoiKhoaBieu = async ({ fileBuffer, maHocKy, maBoMon = '' }) => {
    if (!maHocKy || !maHocKy.trim()) {
      throw new Error('Vui lòng chọn Học kỳ trước khi tải file.');
    }

    // 1. Lấy thông tin học kỳ
    const [hkRows] = await db.query(
      `SELECT MaHocKy, TenHocKy, NamHoc, NgayBatDau, NgayKetThuc FROM HocKy WHERE MaHocKy = ? LIMIT 1`,
      [maHocKy]
    );
    if (hkRows.length === 0) {
      throw new Error(`Không tìm thấy học kỳ '${maHocKy}'.`);
    }
    const hocKy = hkRows[0];
    const defaultStart = hocKy.NgayBatDau ? String(hocKy.NgayBatDau).slice(0, 10) : '2025-08-11';
    const defaultEnd = hocKy.NgayKetThuc ? String(hocKy.NgayKetThuc).slice(0, 10) : '2025-12-31';

    // 2. Đảm bảo phòng ONLINE luôn tồn tại trong CSDL để không lỗi khóa ngoại
    try {
      await db.query(`
        INSERT IGNORE INTO ToaNha (MaToaNha, TenToaNha, CoSo) 
        VALUES ('ONLINE', 'Trực tuyến', 'Hà Nội')
      `);
      await db.query(`
        INSERT IGNORE INTO PhongHoc (MaPhong, TenPhong, MaToaNha, SucChua, LoaiPhong, TrangThai) 
        VALUES ('ONLINE', 'Phòng học trực tuyến (Zoom/Teams)', 'ONLINE', 9999, 'LT', 'Available')
      `);
    } catch (e) {
      // Bỏ qua nếu đã tồn tại
    }

    // 3. Tải danh mục Môn học, Phòng học, Bộ môn từ CSDL
    const [monHocRows] = await db.query(`SELECT MaMonHoc, TenMonHoc, SoTinChi, MaBoMon FROM MonHoc`);
    const monHocMap = new Map();
    monHocRows.forEach(m => monHocMap.set(m.MaMonHoc, m));

    const [phongHocRows] = await db.query(`SELECT MaPhong, TenPhong, SucChua, LoaiPhong, TrangThai FROM PhongHoc`);
    const phongHocMap = new Map();
    phongHocRows.forEach(p => phongHocMap.set(p.MaPhong, p));

    const [boMonRows] = await db.query(`SELECT MaBoMon, TenBoMon FROM BoMon`);
    const boMonList = boMonRows;

    const [existingLhpRows] = await db.query(
      `SELECT MaLopHocPhan, TenLopHocPhan FROM LopHocPhan WHERE MaHocKy = ?`,
      [maHocKy]
    );
    const existingLhpMap = new Map();
    existingLhpRows.forEach(l => existingLhpMap.set(l.MaLopHocPhan, l));

    // Lấy toàn bộ các khung TKB hiện có trong học kỳ để quét trùng lịch phòng học (Room Conflict)
    const [existingScheduleRows] = await db.query(`
      SELECT 
        tkb.MaThoiKhoaBieu,
        tkb.MaLopHocPhan,
        lhp.TenLopHocPhan,
        tkb.ThuTrongTuan,
        tkb.MaTiet,
        tkb.MaPhong,
        tkb.NgayBatDau,
        tkb.NgayKetThuc
      FROM ThoiKhoaBieu tkb
      JOIN LopHocPhan lhp ON tkb.MaLopHocPhan = lhp.MaLopHocPhan
      WHERE lhp.MaHocKy = ?
    `, [maHocKy]);

    // Hàm tiện ích kiểm tra giao thoa khoảng thời gian [NgayBatDau, NgayKetThuc]
    const isDateOverlap = (s1, e1, s2, e2) => {
      if (!s1 || !e1 || !s2 || !e2) return true;
      const dS1 = new Date(s1).getTime();
      const dE1 = new Date(e1).getTime();
      const dS2 = new Date(s2).getTime();
      const dE2 = new Date(e2).getTime();
      return !(dE1 < dS2 || dS1 > dE2);
    };

    // 4. Đọc dữ liệu từ file Excel
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (!rows || rows.length === 0) {
      throw new Error('File Excel không có dữ liệu.');
    }

    // Hàm tiện ích chuẩn hóa chuỗi ô Excel
    const norm = (s) => String(s || '').replace(/[\r\n\s]+/g, ' ').trim().toLowerCase();

    // 5. Nhận diện Bộ môn từ các dòng tiêu đề (Preamble rows)
    let detectedBoMon = maBoMon || '';
    for (let r = 0; r < Math.min(10, rows.length); r++) {
      const rowStr = rows[r].map(c => norm(c)).join(' ');
      if (rowStr.includes('đơn vị đảm nhận') || rowStr.includes('bộ môn')) {
        if (rowStr.includes('mạng') || rowStr.includes('httt') || rowStr.includes('mht')) {
          detectedBoMon = 'MHT';
        } else if (rowStr.includes('phần mềm') || rowStr.includes('cnpm') || rowStr.includes('cpm')) {
          detectedBoMon = 'CPM';
        } else if (rowStr.includes('khoa học máy tính') || rowStr.includes('khmt')) {
          detectedBoMon = 'KHM';
        }
      }
    }
    if (!detectedBoMon && boMonList.length > 0) {
      detectedBoMon = boMonList[0].MaBoMon;
    }

    // 6. Tìm dòng tiêu đề bảng (Header Row)
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(20, rows.length); r++) {
      const rowStr = rows[r].map(c => norm(c)).join('|');
      if ((rowStr.includes('lớp môn tín chỉ') || rowStr.includes('lớp học phần') || rowStr.includes('lớp môn')) &&
        (rowStr.includes('mã học phần') || rowStr.includes('mã môn') || rowStr.includes('stt') || rowStr.includes('thứ'))) {
        headerRowIdx = r;
        break;
      }
    }

    if (headerRowIdx === -1) {
      throw new Error('Không nhận diện được dòng tiêu đề bảng trong file Excel. Vui lòng kiểm tra lại cấu trúc file (cần có các cột Mã học phần, Lớp môn tín chỉ, Thời gian, Thứ...).');
    }

    // Kiểm tra xem tiêu đề bảng là 1 dòng hay 2 dòng (dòng dưới chứa Tiết, Phòng)
    const nextRowStr = headerRowIdx + 1 < rows.length ? rows[headerRowIdx + 1].map(c => norm(c)).join('|') : '';
    const isTwoRowHeader = nextRowStr.includes('tiết') || nextRowStr.includes('phòng');
    const dataStartIdx = isTwoRowHeader ? headerRowIdx + 2 : headerRowIdx + 1;

    // Quét ánh xạ cột
    let colStt = -1, colMaHocPhan = -1, colSoTC = -1, colLopMon = -1;
    let colSvDuKien = -1, colSvDangKy = -1, colKieuHoc = -1, colGiangVien = -1;
    let colThoiGian = -1, colSoTuan = -1, colKhoa = -1;

    const maxCols = Math.max(rows[headerRowIdx].length, isTwoRowHeader && rows[headerRowIdx + 1] ? rows[headerRowIdx + 1].length : 0);

    for (let c = 0; c < maxCols; c++) {
      const cell1 = norm(rows[headerRowIdx]?.[c]);
      const cell2 = isTwoRowHeader ? norm(rows[headerRowIdx + 1]?.[c]) : '';
      const combined = `${cell1} ${cell2}`.trim();

      // Lưu ý: Kiểm tra colLopMon TRƯỚC colSoTC để tránh "Lớp môn tín chỉ" bị nhận nhầm thành Số TC
      if (colLopMon === -1 && (combined.includes('lớp môn tín chỉ') || combined.includes('lớp học phần') || combined.includes('lớp môn') || (combined.includes('tên lớp') && !combined.includes('sinh viên')))) {
        colLopMon = c;
      } else if (colMaHocPhan === -1 && (combined.includes('mã học phần') || combined.includes('mã môn') || combined.includes('mã hp') || combined === 'mhp')) {
        colMaHocPhan = c;
      } else if (colSoTC === -1 && (combined === 'số tc' || combined === 'stc' || combined.includes('số tín chỉ') || (combined.includes('tín chỉ') && !combined.includes('lớp') && !combined.includes('môn')))) {
        colSoTC = c;
      } else if (colStt === -1 && (combined === 'stt' || combined.startsWith('stt ') || combined.startsWith('stt.'))) {
        colStt = c;
      } else if (combined.includes('sv dk') || combined.includes('sv dự kiến') || combined.includes('svdk')) {
        if (colSvDuKien === -1) colSvDuKien = c;
        else colSvDangKy = c;
      } else if (combined.includes('sv đk') || combined.includes('sv đăng ký') || combined.includes('đăng ký')) {
        colSvDangKy = c;
      } else if (colKieuHoc === -1 && (combined.includes('kiểu học') || combined.includes('loại học') || combined.includes('hình thức'))) {
        colKieuHoc = c;
      } else if (colGiangVien === -1 && (combined.includes('giảng viên') || combined.includes('cán bộ') || combined.includes('gv'))) {
        colGiangVien = c;
      } else if (colThoiGian === -1 && (combined.includes('thời gian') || combined.includes('tuần học') || combined.includes('đợt học') || combined.includes('ngày học'))) {
        colThoiGian = c;
      } else if (colSoTuan === -1 && (combined.includes('số tuần') || combined === 'tuần')) {
        colSoTuan = c;
      } else if (colKhoa === -1 && (combined === 'khóa' || combined.includes('khóa học') || combined === 'k')) {
        colKhoa = c;
      }
    }

    // Nhận diện các cột Thứ (Thứ 2..Thứ 7)
    const weekdayColumns = [];
    for (let c = 0; c < maxCols; c++) {
      const cell1 = norm(rows[headerRowIdx]?.[c]);
      const cell2 = isTwoRowHeader ? norm(rows[headerRowIdx + 1]?.[c]) : '';

      const m = cell1.match(/thứ\s*([2-7])/i) || cell2.match(/thứ\s*([2-7])/i);
      if (m) {
        const thu = parseInt(m[1], 10);
        let colTiet = c;
        let colPhong = c + 1;

        if (isTwoRowHeader) {
          const sub1 = norm(rows[headerRowIdx + 1]?.[c]);
          const sub2 = norm(rows[headerRowIdx + 1]?.[c + 1]);
          if (sub1.includes('phòng')) {
            colPhong = c;
            colTiet = c + 1;
          }
        }

        weekdayColumns.push({ thu, colTiet, colPhong });
      }
    }

    // 7. Gom nhóm dữ liệu: Lớp cha và các khung lịch con
    const parsedClasses = [];
    let currentClass = null;
    let lastSeenMaMonHoc = '';
    let lastSeenKhoaHoc = '';
    let currentClassThoiGian = '';
    let currentClassSoTuan = null;

    for (let r = dataStartIdx; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      // Kiểm tra các dòng chân trang / ghi chú cuối bảng (Footer/Note rows) để dừng đọc
      const rowJoinedNorm = row.map(c => norm(c)).filter(Boolean).join(' ');
      if (!rowJoinedNorm) continue;

      const isFooterRow = (
        rowJoinedNorm.startsWith('ghi chú') ||
        rowJoinedNorm.startsWith('chú ý') ||
        rowJoinedNorm.startsWith('lưu ý') ||
        rowJoinedNorm.startsWith('chú thích') ||
        rowJoinedNorm.startsWith('tổng cộng') ||
        rowJoinedNorm.startsWith('tổng số') ||
        rowJoinedNorm.includes('mọi thắc mắc') ||
        rowJoinedNorm.includes('kế hoạch đào tạo') ||
        rowJoinedNorm.includes('trưởng phòng đào tạo') ||
        rowJoinedNorm.includes('p.trưởng phòng') ||
        rowJoinedNorm.includes('phó trưởng phòng') ||
        rowJoinedNorm.includes('hà nội, ngày') ||
        rowJoinedNorm.includes('người lập biểu') ||
        rowJoinedNorm.includes('ký tên')
      );

      if (isFooterRow) {
        if (parsedClasses.length > 0) {
          // Đã đọc xong bảng dữ liệu và chạm phần Ghi chú / Chữ ký cuối trang -> dừng đọc
          break;
        }
        continue;
      }

      const rawStt = colStt !== -1 ? String(row[colStt] || '').trim() : '';
      const rawMaHocPhan = colMaHocPhan !== -1 ? String(row[colMaHocPhan] || '').replace(/[\r\n\s]+/g, '').trim() : '';
      const rawLopMon = colLopMon !== -1 ? String(row[colLopMon] || '').trim() : '';

      if (rawMaHocPhan) {
        lastSeenMaMonHoc = rawMaHocPhan;
      }

      const rawThoiGian = colThoiGian !== -1 ? String(row[colThoiGian] || '').trim() : '';
      const parsedSoTuan = colSoTuan !== -1 ? parseInt(row[colSoTuan], 10) : NaN;
      const rawSoTuan = !isNaN(parsedSoTuan) && parsedSoTuan > 0 ? parsedSoTuan : null;

      // Kiểm tra xem dòng này có tên Lớp môn tín chỉ -> Bắt đầu một lớp học phần mới
      if (rawLopMon) {
        currentClassThoiGian = rawThoiGian;
        currentClassSoTuan = rawSoTuan;

        const maMonToUse = rawMaHocPhan || lastSeenMaMonHoc;
        const generatedMaLop = this.generateMaLopHocPhan(maMonToUse, rawLopMon);

        const kieuHocRaw = colKieuHoc !== -1 ? String(row[colKieuHoc] || '').trim().toUpperCase() : 'LT';
        let loaiHoc = 'LT';
        if (['LT', 'BT', 'TH', 'BTL'].includes(kieuHocRaw)) {
          loaiHoc = kieuHocRaw;
        } else if (rawLopMon.includes('.BT') || rawLopMon.includes('(BT')) {
          loaiHoc = 'BT';
        } else if (rawLopMon.includes('.TH') || rawLopMon.includes('(TH')) {
          loaiHoc = 'TH';
        }

        const svDkNum = colSvDuKien !== -1 ? parseInt(row[colSvDuKien], 10) : 100;
        const svDangKyNum = colSvDangKy !== -1 ? parseInt(row[colSvDangKy], 10) : svDkNum;
        const rawKhoa = colKhoa !== -1 ? String(row[colKhoa] || '').trim() : '';
        if (rawKhoa) lastSeenKhoaHoc = rawKhoa;

        currentClass = {
          tempId: `cls_${parsedClasses.length + 1}`,
          stt: rawStt || String(parsedClasses.length + 1),
          maLopHocPhan: generatedMaLop,
          tenLopHocPhan: rawLopMon,
          maMonHoc: maMonToUse,
          loaiHoc: loaiHoc,
          siSoDuKien: !isNaN(svDkNum) ? svDkNum : 100,
          siSoDangKy: !isNaN(svDangKyNum) ? svDangKyNum : (!isNaN(svDkNum) ? svDkNum : 100),
          khoaHoc: rawKhoa || lastSeenKhoaHoc || '',
          maBoMon: detectedBoMon,
          schedules: []
        };
        parsedClasses.push(currentClass);
      } else if (currentClass) {
        // Dòng phụ của lớp hiện tại: Nếu dòng này có thời gian hoặc số tuần mới thì cập nhật
        if (rawThoiGian) {
          currentClassThoiGian = rawThoiGian;
        }
        if (rawSoTuan !== null) {
          currentClassSoTuan = rawSoTuan;
        }
      }

      // Trích xuất khung lịch từ dòng hiện tại (dù là dòng đầu lớp hay dòng phụ của lớp)
      if (currentClass) {
        // Nếu dòng phụ bị merge ô Thời gian/Số tuần trong Excel, kế thừa giá trị gần nhất của lớp này
        const thoiGianToUse = rawThoiGian || currentClassThoiGian;
        const soTuanToUse = rawSoTuan !== null ? rawSoTuan : (currentClassSoTuan !== null ? currentClassSoTuan : 3);
        const { startDate, endDate } = this.parseDateRange(thoiGianToUse, defaultStart, defaultEnd);

        // Duyệt qua các cột Thứ để lấy tiết và phòng
        weekdayColumns.forEach(w => {
          const rawTietVal = String(row[w.colTiet] || '').trim();
          const rawPhongVal = String(row[w.colPhong] || '').trim();

          if (rawTietVal) {
            const maTiet = this.mapExcelTietToMaTiet(rawTietVal);
            const maPhong = this.normalizeRoom(rawPhongVal) || 'ONLINE';

            currentClass.schedules.push({
              tempId: `sc_${currentClass.tempId}_${currentClass.schedules.length + 1}`,
              thuTrongTuan: w.thu,
              rawTiet: rawTietVal,
              maTiet: maTiet || 1,
              rawPhong: rawPhongVal || 'ONLINE',
              maPhong: maPhong,
              ngayBatDau: startDate,
              ngayKetThuc: endDate,
              soTuan: soTuanToUse
            });
          }
        });
      }
    }

    if (parsedClasses.length === 0) {
      throw new Error('Không trích xuất được lớp học phần nào từ file Excel. Vui lòng kiểm tra lại cấu trúc tiêu đề các cột.');
    }

    // 8. Hậu xử lý & Đối soát CSDL (Validation)
    let soLopHopLe = 0;
    let soLopLoi = 0;
    const seenMaLop = new Set();

    // Thu thập danh sách phẳng tất cả khung lịch trong file Excel để đối soát trùng phòng nội bộ
    const allFileSchedules = [];
    parsedClasses.forEach(c => {
      (c.schedules || []).forEach(sc => {
        allFileSchedules.push({
          tempId: sc.tempId,
          classTempId: c.tempId,
          maLopHocPhan: c.maLopHocPhan,
          tenLopHocPhan: c.tenLopHocPhan,
          thuTrongTuan: sc.thuTrongTuan,
          maTiet: sc.maTiet,
          maPhong: sc.maPhong,
          ngayBatDau: sc.ngayBatDau,
          ngayKetThuc: sc.ngayKetThuc
        });
      });
    });

    const validatedClasses = parsedClasses.map(cls => {
      const errors = [];
      const warnings = [];

      // Tính ngày bắt đầu, ngày kết thúc và số tuần tổng thể của lớp
      if (cls.schedules.length > 0) {
        let minStart = cls.schedules[0].ngayBatDau;
        let maxEnd = cls.schedules[0].ngayKetThuc;

        // Tránh cộng dồn số tuần của các buổi học song song trong cùng một đợt thời gian
        const distinctPeriodWeeks = new Map();

        cls.schedules.forEach(sc => {
          if (sc.ngayBatDau < minStart) minStart = sc.ngayBatDau;
          if (sc.ngayKetThuc > maxEnd) maxEnd = sc.ngayKetThuc;

          const periodKey = `${sc.ngayBatDau}_${sc.ngayKetThuc}`;
          if (!distinctPeriodWeeks.has(periodKey) || sc.soTuan > distinctPeriodWeeks.get(periodKey)) {
            distinctPeriodWeeks.set(periodKey, sc.soTuan || 0);
          }
        });

        let totalWeeks = 0;
        distinctPeriodWeeks.forEach(w => { totalWeeks += w; });

        cls.ngayBatDau = minStart;
        cls.ngayKetThuc = maxEnd;
        cls.soTuan = totalWeeks > 0 ? totalWeeks : 15;
      } else {
        cls.ngayBatDau = defaultStart;
        cls.ngayKetThuc = defaultEnd;
        cls.soTuan = 15;
        warnings.push('Lớp này không có lịch học (Thứ, Tiết, Phòng) nào trong file Excel.');
      }

      // Kiểm tra môn học trong DB
      const monHoc = monHocMap.get(cls.maMonHoc);
      if (monHoc) {
        cls.tenMonHoc = monHoc.TenMonHoc;
        cls.soTinChi = monHoc.SoTinChi;
        if (monHoc.MaBoMon) cls.maBoMon = monHoc.MaBoMon;
      } else {
        errors.push(`Mã học phần '${cls.maMonHoc}' chưa tồn tại trong danh mục Môn học.`);
        cls.tenMonHoc = 'Chưa xác định';
        cls.soTinChi = 3;
      }

      // Kiểm tra trùng mã lớp trong file
      if (seenMaLop.has(cls.maLopHocPhan)) {
        errors.push(`Trùng lặp Mã lớp '${cls.maLopHocPhan}' với lớp khác trong cùng file.`);
      }
      seenMaLop.add(cls.maLopHocPhan);

      // Kiểm tra lớp đã tồn tại trong CSDL
      if (existingLhpMap.has(cls.maLopHocPhan)) {
        warnings.push(`Lớp '${cls.maLopHocPhan}' đã tồn tại trong CSDL (sẽ ghi đè/cập nhật lại).`);
      }

      // Kiểm tra từng khung lịch
      cls.schedules.forEach(sc => {
        if (!sc.maTiet) {
          errors.push(`Tiết học '${sc.rawTiet}' (Thứ ${sc.thuTrongTuan}) không nhận diện được ca học hợp lệ.`);
        }
        if (!sc.maPhong) {
          errors.push(`Chưa có phòng học cho Thứ ${sc.thuTrongTuan}.`);
        } else if (sc.maPhong !== 'ONLINE' && !phongHocMap.has(sc.maPhong)) {
          errors.push(`Phòng học '${sc.maPhong}' chưa tồn tại trong danh mục Phòng học.`);
        }

        // KIỂM TRA TRÙNG LỊCH PHÒNG HỌC (Room Conflict - Miễn trừ phòng ONLINE)
        if (sc.maPhong && sc.maPhong !== 'ONLINE' && sc.maTiet && sc.thuTrongTuan) {
          // A. Quét trùng với các lớp khác trong cùng file Excel
          const conflictInFile = allFileSchedules.find(other =>
            other.classTempId !== cls.tempId &&
            other.maPhong === sc.maPhong &&
            other.thuTrongTuan === sc.thuTrongTuan &&
            other.maTiet === sc.maTiet &&
            isDateOverlap(sc.ngayBatDau, sc.ngayKetThuc, other.ngayBatDau, other.ngayKetThuc)
          );

          if (conflictInFile) {
            errors.push(
              `Trùng phòng ${sc.maPhong} (Thứ ${sc.thuTrongTuan}, Ca ${sc.maTiet}) với lớp '${conflictInFile.tenLopHocPhan || conflictInFile.maLopHocPhan}' trong file Excel (${conflictInFile.ngayBatDau} - ${conflictInFile.ngayKetThuc}).`
            );
          }

          // B. Quét trùng với các lớp đã có trong CSDL (loại trừ chính bản thân lớp nếu đang cập nhật)
          const conflictInDB = existingScheduleRows.find(dbSc =>
            dbSc.MaLopHocPhan !== cls.maLopHocPhan &&
            dbSc.MaPhong === sc.maPhong &&
            dbSc.ThuTrongTuan === sc.thuTrongTuan &&
            dbSc.MaTiet === sc.maTiet &&
            isDateOverlap(sc.ngayBatDau, sc.ngayKetThuc, dbSc.NgayBatDau, dbSc.NgayKetThuc)
          );

          if (conflictInDB) {
            const dbStart = String(dbSc.NgayBatDau).slice(0, 10);
            const dbEnd = String(dbSc.NgayKetThuc).slice(0, 10);
            errors.push(
              `Trùng phòng ${sc.maPhong} (Thứ ${sc.thuTrongTuan}, Ca ${sc.maTiet}) với lớp '${conflictInDB.TenLopHocPhan || conflictInDB.MaLopHocPhan}' đã có trong CSDL (${dbStart} - ${dbEnd}).`
            );
          }
        }
      });

      const isValid = errors.length === 0;
      if (isValid) soLopHopLe++;
      else soLopLoi++;

      return {
        ...cls,
        isValid,
        errors,
        warnings
      };
    });

    return {
      detectedBoMon,
      tongSoLop: validatedClasses.length,
      tongSoKhungLich: validatedClasses.reduce((sum, c) => sum + c.schedules.length, 0),
      soLopHopLe,
      soLopLoi,
      classes: validatedClasses,
      danhSachMonHoc: monHocRows,
      danhSachPhongHoc: phongHocRows
    };
  };

  /**
   * Lưu toàn bộ Lớp học phần và các khung Thời khóa biểu vào CSDL trong một Transaction
   */
  static saveImportedThoiKhoaBieu = async ({ userId, maHocKy, maBoMon, classes = [] }) => {
    if (!maHocKy || !maHocKy.trim()) {
      throw new Error('Vui lòng chọn Học kỳ để lưu.');
    }
    if (!Array.isArray(classes) || classes.length === 0) {
      throw new Error('Không có dữ liệu lớp học phần hợp lệ để lưu.');
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Đảm bảo có phòng ONLINE trong CSDL trước khi lưu các bản ghi ThoiKhoaBieu
      await conn.query(`
        INSERT IGNORE INTO ToaNha (MaToaNha, TenToaNha, CoSo) 
        VALUES ('ONLINE', 'Trực tuyến', 'Hà Nội')
      `);
      await conn.query(`
        INSERT IGNORE INTO PhongHoc (MaPhong, TenPhong, MaToaNha, SucChua, LoaiPhong, TrangThai) 
        VALUES ('ONLINE', 'Phòng học trực tuyến (Zoom/Teams)', 'ONLINE', 9999, 'LT', 'Available')
      `);

      // Kiểm tra xung đột trùng phòng học với các lớp KHÁC đã lưu trong CSDL
      const targetClassCodes = classes.map(c => c.maLopHocPhan).filter(Boolean);
      let queryOtherSql = `
        SELECT tkb.MaPhong, tkb.ThuTrongTuan, tkb.MaTiet, tkb.NgayBatDau, tkb.NgayKetThuc, lhp.TenLopHocPhan, tkb.MaLopHocPhan
        FROM ThoiKhoaBieu tkb
        JOIN LopHocPhan lhp ON tkb.MaLopHocPhan = lhp.MaLopHocPhan
        WHERE lhp.MaHocKy = ? AND tkb.MaPhong != 'ONLINE'
      `;
      const queryParams = [maHocKy];
      if (targetClassCodes.length > 0) {
        queryOtherSql += ` AND tkb.MaLopHocPhan NOT IN (?)`;
        queryParams.push(targetClassCodes);
      }
      const [existingOtherSchedules] = await conn.query(queryOtherSql, queryParams);

      const allSchedulesToSave = [];
      classes.forEach(c => {
        (c.schedules || []).forEach(sc => {
          if (sc.maPhong && sc.maPhong !== 'ONLINE' && sc.maTiet && sc.thuTrongTuan) {
            allSchedulesToSave.push({
              maLopHocPhan: c.maLopHocPhan,
              tenLopHocPhan: c.tenLopHocPhan,
              thuTrongTuan: sc.thuTrongTuan,
              maTiet: sc.maTiet,
              maPhong: sc.maPhong,
              ngayBatDau: sc.ngayBatDau || c.ngayBatDau,
              ngayKetThuc: sc.ngayKetThuc || c.ngayKetThuc
            });
          }
        });
      });

      for (const sc of allSchedulesToSave) {
        const conflict = existingOtherSchedules.find(dbSc =>
          dbSc.MaPhong === sc.maPhong &&
          dbSc.ThuTrongTuan === sc.thuTrongTuan &&
          dbSc.MaTiet === sc.maTiet &&
          !(new Date(sc.ngayKetThuc) < new Date(dbSc.NgayBatDau) || new Date(sc.ngayBatDau) > new Date(dbSc.NgayKetThuc))
        );
        if (conflict) {
          throw new Error(
            `Xung đột trùng phòng: Phòng '${sc.maPhong}' đã có lớp '${conflict.TenLopHocPhan || conflict.MaLopHocPhan}' học vào Thứ ${sc.thuTrongTuan}, Ca ${sc.maTiet} trong CSDL. Vui lòng kiểm tra lại.`
          );
        }
      }

      const validClasses = classes.filter(cls => cls.maLopHocPhan && cls.maMonHoc);
      let createdClassesCount = 0;
      let createdSchedulesCount = 0;

      if (validClasses.length > 0) {
        const allLhpCodes = validClasses.map(c => c.maLopHocPhan);

        // 1. Kiểm tra hàng loạt lớp nào đã tồn tại (1 query duy nhất)
        const [existingRows] = await conn.query(
          `SELECT MaLopHocPhan FROM LopHocPhan WHERE MaLopHocPhan IN (?)`,
          [allLhpCodes]
        );
        const existingSet = new Set(existingRows.map(r => r.MaLopHocPhan));

        // 2. Chuẩn bị dữ liệu Bulk Upsert LopHocPhan
        const lhpValues = validClasses.map(cls => {
          const maBoMonVal = cls.maBoMon || maBoMon || 'MHT';
          if (!existingSet.has(cls.maLopHocPhan)) {
            createdClassesCount++;
          }
          return [
            cls.maLopHocPhan,
            cls.tenLopHocPhan,
            cls.maMonHoc,
            maHocKy,
            cls.loaiHoc || 'LT',
            cls.siSoDuKien || 100,
            cls.siSoDangKy || 100,
            cls.ngayBatDau,
            cls.ngayKetThuc,
            cls.soTuan || 15,
            maBoMonVal,
            cls.khoaHoc || null,
            'Unassigned'
          ];
        });

        const CHUNK_SIZE = 500;
        for (let i = 0; i < lhpValues.length; i += CHUNK_SIZE) {
          const chunk = lhpValues.slice(i, i + CHUNK_SIZE);
          await conn.query(`
            INSERT INTO LopHocPhan (
              MaLopHocPhan, TenLopHocPhan, MaMonHoc, MaHocKy, LoaiHoc,
              SiSoDuKien, SiSoDangKy, NgayBatDau, NgayKetThuc, SoTuan,
              MaBoMon, KhoaHoc, TrangThaiPhanCong
            ) VALUES ?
            ON DUPLICATE KEY UPDATE
              TenLopHocPhan = VALUES(TenLopHocPhan),
              MaMonHoc = VALUES(MaMonHoc),
              LoaiHoc = VALUES(LoaiHoc),
              SiSoDuKien = VALUES(SiSoDuKien),
              SiSoDangKy = VALUES(SiSoDangKy),
              KhoaHoc = VALUES(KhoaHoc),
              NgayBatDau = VALUES(NgayBatDau),
              NgayKetThuc = VALUES(NgayKetThuc),
              SoTuan = VALUES(SoTuan),
              MaBoMon = VALUES(MaBoMon)
          `, [chunk]);
        }

        // 3. Xóa các khung TKB cũ của toàn bộ danh sách lớp này (1 query duy nhất)
        await conn.query(
          `DELETE FROM ThoiKhoaBieu WHERE MaLopHocPhan IN (?)`,
          [allLhpCodes]
        );

        // 4. Chuẩn bị dữ liệu Bulk Insert ThoiKhoaBieu
        const tkbValues = [];
        const usedTkbIds = new Set();

        for (const cls of validClasses) {
          if (!Array.isArray(cls.schedules)) continue;
          for (const sc of cls.schedules) {
            if (!sc.thuTrongTuan || !sc.maTiet || !sc.maPhong) continue;

            const cleanCode = cls.maLopHocPhan.replace(/[^a-zA-Z0-9]/g, '_');
            let maTkb;
            do {
              const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
              maTkb = `TKB_${cleanCode}_T${sc.thuTrongTuan}_C${sc.maTiet}_${randHex}`;
            } while (usedTkbIds.has(maTkb));
            usedTkbIds.add(maTkb);

            tkbValues.push([
              maTkb,
              cls.maLopHocPhan,
              sc.thuTrongTuan,
              sc.maTiet,
              sc.maPhong,
              sc.ngayBatDau || cls.ngayBatDau,
              sc.ngayKetThuc || cls.ngayKetThuc,
              'Scheduled'
            ]);
            createdSchedulesCount++;
          }
        }

        for (let i = 0; i < tkbValues.length; i += CHUNK_SIZE) {
          const chunk = tkbValues.slice(i, i + CHUNK_SIZE);
          await conn.query(`
            INSERT INTO ThoiKhoaBieu (
              MaThoiKhoaBieu, MaLopHocPhan, ThuTrongTuan, MaTiet,
              MaPhong, NgayBatDau, NgayKetThuc, TrangThai
            ) VALUES ?
          `, [chunk]);
        }
      }

      await conn.commit();

      return {
        success: true,
        soLopDaLuu: classes.length,
        soLopMoi: createdClassesCount,
        soKhungLichDaLuu: createdSchedulesCount,
        message: `Đã import và lưu thành công ${classes.length} Lớp học phần và ${createdSchedulesCount} khung Thời khóa biểu vào CSDL!`
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  };

  // ================================================================
  // 19. [BOMON] PHÂN CÔNG GIẢNG VIÊN TỰ ĐỘNG - XEM TRƯỚC (PREVIEW)
  //     - Gom cụm Lớp gia đình (LT, BT, TH) cùng 1 giảng viên
  //     - Ràng buộc chuyên môn theo GiangVien_MonHoc
  //     - Quét tuyệt đối không trùng Thứ, Tiết, Ngày
  //     - Cân bằng tải đều giờ dạy giữa các giảng viên
  // ================================================================
  static autoAssignLecturersPreview = async ({ maHocKy, maBoMon, scope = 'ONLY_UNASSIGNED' } = {}) => {
    if (!maHocKy || !maHocKy.trim()) {
      throw new Error('Vui lòng chọn Học kỳ.');
    }
    if (!maBoMon || !maBoMon.trim()) {
      throw new Error('Không xác định được Bộ môn cần phân công.');
    }

    const cleanMaHocKy = maHocKy.trim();
    const cleanMaBoMon = maBoMon.trim();

    // 1. Lấy danh sách Giảng viên đang Active của Bộ môn
    const [lecturers] = await db.query(`
      SELECT gv.MaGiangVien, gv.HoTen, gv.Email, gv.SoDienThoai
      FROM GiangVien gv
      WHERE gv.MaBoMon = ? AND gv.TrangThai = 'Active'
      ORDER BY gv.HoTen ASC
    `, [cleanMaBoMon]);

    if (lecturers.length === 0) {
      throw new Error(`Bộ môn '${cleanMaBoMon}' hiện không có giảng viên nào ở trạng thái Hoạt động (Active).`);
    }

    // 2. Lấy danh sách Môn học từng Giảng viên có thể dạy (từ GiangVien_MonHoc)
    const [qualifications] = await db.query(`
      SELECT gvm.MaGiangVien, gvm.MaMonHoc, mh.TenMonHoc
      FROM GiangVien_MonHoc gvm
      JOIN GiangVien gv ON gvm.MaGiangVien = gv.MaGiangVien
      JOIN MonHoc mh ON gvm.MaMonHoc = mh.MaMonHoc
      WHERE gv.MaBoMon = ?
    `, [cleanMaBoMon]);

    const qualifiedGvsByMon = {};
    const gvSubjectsMap = {};
    for (const q of qualifications) {
      if (!qualifiedGvsByMon[q.MaMonHoc]) qualifiedGvsByMon[q.MaMonHoc] = [];
      qualifiedGvsByMon[q.MaMonHoc].push(q.MaGiangVien);

      if (!gvSubjectsMap[q.MaGiangVien]) gvSubjectsMap[q.MaGiangVien] = [];
      gvSubjectsMap[q.MaGiangVien].push({ maMonHoc: q.MaMonHoc, tenMonHoc: q.TenMonHoc });
    }

    // 3. Lấy tất cả Lớp học phần của Bộ môn trong học kỳ
    const [classes] = await db.query(`
      SELECT
        lhp.MaLopHocPhan,
        lhp.TenLopHocPhan,
        lhp.MaMonHoc,
        mh.TenMonHoc,
        mh.SoTinChi,
        lhp.LoaiHoc,
        lhp.SiSoDuKien,
        lhp.SiSoDangKy,
        lhp.TrangThaiPhanCong,
        lhp.MaGiangVien,
        gv.HoTen AS TenGiangVienHienTai
      FROM LopHocPhan lhp
      LEFT JOIN MonHoc mh ON lhp.MaMonHoc = mh.MaMonHoc
      LEFT JOIN GiangVien gv ON lhp.MaGiangVien = gv.MaGiangVien
      WHERE lhp.MaHocKy = ? AND lhp.MaBoMon = ?
      ORDER BY lhp.MaLopHocPhan ASC
    `, [cleanMaHocKy, cleanMaBoMon]);

    if (classes.length === 0) {
      throw new Error(`Không tìm thấy lớp học phần nào của Bộ môn '${cleanMaBoMon}' trong học kỳ '${cleanMaHocKy}'.`);
    }

    // 4. Lấy toàn bộ lịch TKB của các lớp này
    const [schedules] = await db.query(`
      SELECT
        tkb.MaThoiKhoaBieu,
        tkb.MaLopHocPhan,
        tkb.ThuTrongTuan,
        tkb.MaTiet,
        tt.TenTiet,
        ph.TenPhong,
        tkb.NgayBatDau,
        tkb.NgayKetThuc
      FROM ThoiKhoaBieu tkb
      JOIN LopHocPhan lhp ON tkb.MaLopHocPhan = lhp.MaLopHocPhan
      JOIN TietHoc tt ON tkb.MaTiet = tt.MaTiet
      LEFT JOIN PhongHoc ph ON tkb.MaPhong = ph.MaPhong
      WHERE lhp.MaHocKy = ? AND lhp.MaBoMon = ?
      ORDER BY tkb.ThuTrongTuan ASC, tkb.MaTiet ASC
    `, [cleanMaHocKy, cleanMaBoMon]);

    const schedulesByClass = {};
    for (const s of schedules) {
      if (!schedulesByClass[s.MaLopHocPhan]) schedulesByClass[s.MaLopHocPhan] = [];
      schedulesByClass[s.MaLopHocPhan].push(s);
    }

    // 5. Gom cụm Lớp Gia Đình (Class Family)
    // Quy tắc: Mã như IT0.016.2-1-1-25(N01.BT1) -> IT0.016.2-1-1-25(N01)
    const getFamilyKey = (code) => {
      if (!code) return '';
      return code.replace(/\.([a-zA-Z0-9_]+)\)$/, ')');
    };

    const familiesMap = {};
    for (const c of classes) {
      const clsSchedules = schedulesByClass[c.MaLopHocPhan] || [];
      const fKey = getFamilyKey(c.MaLopHocPhan);

      if (!familiesMap[fKey]) {
        familiesMap[fKey] = {
          familyKey: fKey,
          maMonHoc: c.MaMonHoc,
          tenMonHoc: c.TenMonHoc,
          soTinChi: c.SoTinChi || 3,
          classes: [],
          schedules: [],
          isLocked: false,
          existingLecturerId: null,
          existingLecturerName: null
        };
      }

      const fam = familiesMap[fKey];
      fam.classes.push({
        ...c,
        schedules: clsSchedules,
        hasSchedule: clsSchedules.length > 0
      });

      if (c.TrangThaiPhanCong === 'Locked') {
        fam.isLocked = true;
      }
      if (c.MaGiangVien) {
        fam.existingLecturerId = c.MaGiangVien;
        fam.existingLecturerName = c.TenGiangVienHienTai;
      }

      fam.schedules.push(...clsSchedules);
    }

    const families = Object.values(familiesMap);

    // 6. Khởi tạo đối tượng theo dõi trạng thái tải và slot bận của từng Giảng viên
    const gvState = {};
    for (const gv of lecturers) {
      gvState[gv.MaGiangVien] = {
        maGiangVien: gv.MaGiangVien,
        hoTen: gv.HoTen,
        email: gv.Email,
        assignedClasses: [],
        assignedFamilies: [],
        totalPeriodsPerWeek: 0,
        busySlots: [],
        qualifiedSubjects: gvSubjectsMap[gv.MaGiangVien] || []
      };
    }

    // Helper kiểm tra giao nhau giữa 2 khoảng thời gian Date
    const isDateOverlap = (startA, endA, startB, endB) => {
      if (!startA || !endA || !startB || !endB) return true;
      const sA = new Date(startA);
      const eA = new Date(endA);
      const sB = new Date(startB);
      const eB = new Date(endB);
      return (sA <= eB && eA >= sB);
    };

    // Helper kiểm tra xung đột trùng lịch giữa tập slot mới và danh sách slot bận
    const checkScheduleConflict = (newSlots, busySlots) => {
      for (const nSlot of newSlots) {
        for (const bSlot of busySlots) {
          if (nSlot.ThuTrongTuan === bSlot.ThuTrongTuan && nSlot.MaTiet === bSlot.MaTiet) {
            if (isDateOverlap(nSlot.NgayBatDau, nSlot.NgayKetThuc, bSlot.NgayBatDau, bSlot.NgayKetThuc)) {
              return {
                conflict: true,
                newSlot: nSlot,
                busySlot: bSlot
              };
            }
          }
        }
      }
      return { conflict: false };
    };

    const assignments = [];
    const unassignedDetails = [];
    const familiesToAssign = [];

    // 7. Xử lý các lớp theo chế độ Scope
    for (const fam of families) {
      const famPeriods = fam.schedules.length * 3;

      // TH1: Cụm lớp không có lịch TKB nào -> Không thể phân công
      if (fam.schedules.length === 0) {
        unassignedDetails.push({
          familyKey: fam.familyKey,
          maMonHoc: fam.maMonHoc,
          tenMonHoc: fam.tenMonHoc,
          classCodes: fam.classes.map(c => c.MaLopHocPhan),
          reason: 'Cụm lớp chưa được xếp lịch Thời khóa biểu (TKB trống).'
        });
        continue;
      }

      // TH2: Cụm lớp đã bị Khóa lịch (Locked) -> Luôn bảo lưu GV hiện tại
      if (fam.isLocked) {
        if (fam.existingLecturerId && gvState[fam.existingLecturerId]) {
          const gv = gvState[fam.existingLecturerId];
          gv.totalPeriodsPerWeek += famPeriods;
          gv.assignedFamilies.push(fam.familyKey);
          gv.busySlots.push(...fam.schedules);
          for (const c of fam.classes) {
            if (!c.hasSchedule) continue; // Chỉ gán cho các lớp ĐÃ CÓ TKB
            gv.assignedClasses.push(c.MaLopHocPhan);
            assignments.push({
              maLopHocPhan: c.MaLopHocPhan,
              tenLopHocPhan: c.TenLopHocPhan,
              maMonHoc: c.MaMonHoc,
              tenMonHoc: c.TenMonHoc,
              maGiangVien: gv.maGiangVien,
              tenGiangVien: gv.hoTen,
              familyKey: fam.familyKey,
              isPreserved: true,
              preserveReason: 'Đã khóa lịch (Locked)'
            });
          }
        } else {
          unassignedDetails.push({
            familyKey: fam.familyKey,
            maMonHoc: fam.maMonHoc,
            tenMonHoc: fam.tenMonHoc,
            classCodes: fam.classes.map(c => c.MaLopHocPhan),
            reason: 'Lớp đã bị khóa lịch nhưng chưa có giảng viên hợp lệ.'
          });
        }
        continue;
      }

      // TH3: Chế độ ONLY_UNASSIGNED và cụm này đã có GV được gán
      if (scope === 'ONLY_UNASSIGNED' && fam.existingLecturerId && gvState[fam.existingLecturerId]) {
        const gv = gvState[fam.existingLecturerId];
        gv.totalPeriodsPerWeek += famPeriods;
        gv.assignedFamilies.push(fam.familyKey);
        gv.busySlots.push(...fam.schedules);
        for (const c of fam.classes) {
          if (!c.hasSchedule) continue; // Chỉ gán cho các lớp ĐÃ CÓ TKB
          gv.assignedClasses.push(c.MaLopHocPhan);
          assignments.push({
            maLopHocPhan: c.MaLopHocPhan,
            tenLopHocPhan: c.TenLopHocPhan,
            maMonHoc: c.MaMonHoc,
            tenMonHoc: c.TenMonHoc,
            maGiangVien: gv.maGiangVien,
            tenGiangVien: gv.hoTen,
            familyKey: fam.familyKey,
            isPreserved: true,
            preserveReason: 'Đã phân công trước đó'
          });
        }
        continue;
      }

      // Còn lại: Cụm lớp cần chạy thuật toán tự động gán
      familiesToAssign.push(fam);
    }

    // 8. Sắp xếp thứ tự ưu tiên gán các Family (Heuristic)
    // - Ít GV đủ chuyên môn gán trước
    // - Nhiều slot / tiết TKB gán trước
    // - Nhiều lớp con trong cụm gán trước
    familiesToAssign.sort((a, b) => {
      const candA = (qualifiedGvsByMon[a.maMonHoc] || []).length;
      const candB = (qualifiedGvsByMon[b.maMonHoc] || []).length;
      if (candA !== candB) return candA - candB;
      if (b.schedules.length !== a.schedules.length) {
        return b.schedules.length - a.schedules.length;
      }
      return b.classes.length - a.classes.length;
    });

    // 9. Vòng lặp phân công từng Family
    const thuLabels = { 2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật' };

    for (const fam of familiesToAssign) {
      const candidateGvIds = qualifiedGvsByMon[fam.maMonHoc] || [];

      // Kiểm tra xem có GV nào được phân công dạy môn này không
      if (candidateGvIds.length === 0) {
        unassignedDetails.push({
          familyKey: fam.familyKey,
          maMonHoc: fam.maMonHoc,
          tenMonHoc: fam.tenMonHoc,
          classCodes: fam.classes.map(c => c.MaLopHocPhan),
          reason: `Chưa có giảng viên nào trong bộ môn đăng ký dạy môn "${fam.tenMonHoc || fam.maMonHoc}" (Quản lý môn học giảng viên).`
        });
        continue;
      }

      // Lọc các GV không bị trùng lịch ở BẤT KỲ slot nào của cả gia đình lớp
      const eligibleCandidates = [];
      const conflictDescriptions = [];

      for (const gvId of candidateGvIds) {
        const gv = gvState[gvId];
        if (!gv) continue;

        const conflictCheck = checkScheduleConflict(fam.schedules, gv.busySlots);
        if (conflictCheck.conflict) {
          const bs = conflictCheck.busySlot;
          conflictDescriptions.push(
            `${gv.hoTen} trùng slot ${thuLabels[bs.ThuTrongTuan] || 'Thứ ' + bs.ThuTrongTuan} (${bs.TenTiet || bs.MaTiet})`
          );
        } else {
          eligibleCandidates.push(gv);
        }
      }

      // Nếu tất cả GV dạy môn này đều bị trùng lịch
      if (eligibleCandidates.length === 0) {
        unassignedDetails.push({
          familyKey: fam.familyKey,
          maMonHoc: fam.maMonHoc,
          tenMonHoc: fam.tenMonHoc,
          classCodes: fam.classes.map(c => c.MaLopHocPhan),
          reason: `Toàn bộ ${candidateGvIds.length} GV chuyên môn đều bị trùng lịch dạy ở các slot của cụm lớp này (${conflictDescriptions.slice(0, 2).join('; ')}).`
        });
        continue;
      }

      // Chọn ứng viên tối ưu nhất: Min-Workload Greedy
      // 1. Tải tiết/tuần thấp nhất
      // 2. Số lớp đã nhận ít nhất
      // 3. Tên theo bảng chữ cái
      eligibleCandidates.sort((a, b) => {
        if (a.totalPeriodsPerWeek !== b.totalPeriodsPerWeek) {
          return a.totalPeriodsPerWeek - b.totalPeriodsPerWeek;
        }
        if (a.assignedClasses.length !== b.assignedClasses.length) {
          return a.assignedClasses.length - b.assignedClasses.length;
        }
        return a.hoTen.localeCompare(b.hoTen);
      });

      const chosenGv = eligibleCandidates[0];
      const famPeriods = fam.schedules.length * 3;

      // Cập nhật tải & slot bận của GV
      chosenGv.totalPeriodsPerWeek += famPeriods;
      chosenGv.assignedFamilies.push(fam.familyKey);
      chosenGv.busySlots.push(...fam.schedules);

      // Gán các lớp con trong gia đình lớp ĐÃ CÓ LỊCH TKB cho Giảng viên này
      // (Loại bỏ các lớp con chưa có TKB, tuân thủ đúng trình tự phải có lịch mới phân công)
      for (const c of fam.classes) {
        if (!c.hasSchedule) continue; // Bỏ qua lớp chưa có TKB
        chosenGv.assignedClasses.push(c.MaLopHocPhan);
        assignments.push({
          maLopHocPhan: c.MaLopHocPhan,
          tenLopHocPhan: c.TenLopHocPhan,
          maMonHoc: c.MaMonHoc,
          tenMonHoc: c.TenMonHoc,
          maGiangVien: chosenGv.maGiangVien,
          tenGiangVien: chosenGv.hoTen,
          familyKey: fam.familyKey,
          isPreserved: false
        });
      }
    }

    // 10. Tổng hợp thống kê giảng viên
    const lecturerStats = Object.values(gvState).map(gv => {
      // Tập môn học thực tế được gán trong đợt này
      const assignedSubjSet = new Set();
      assignments
        .filter(a => a.maGiangVien === gv.maGiangVien)
        .forEach(a => assignedSubjSet.add(a.tenMonHoc || a.maMonHoc));

      return {
        maGiangVien: gv.maGiangVien,
        hoTen: gv.hoTen,
        email: gv.email,
        assignedClassesCount: gv.assignedClasses.length,
        totalPeriodsPerWeek: gv.totalPeriodsPerWeek,
        assignedFamiliesCount: gv.assignedFamilies.length,
        qualifiedSubjectsCount: gv.qualifiedSubjects.length,
        assignedSubjects: Array.from(assignedSubjSet)
      };
    });

    // Sắp xếp thống kê theo số tiết/tuần giảm dần để tiện theo dõi
    lecturerStats.sort((a, b) => b.totalPeriodsPerWeek - a.totalPeriodsPerWeek);

    const totalClasses = classes.length;
    const scheduledClassesCount = classes.filter(c => schedulesByClass[c.MaLopHocPhan]?.length > 0).length;
    const unscheduledClassesCount = totalClasses - scheduledClassesCount;
    const assignedClassesCount = assignments.length;
    const unassignedScheduledClassesCount = scheduledClassesCount - assignedClassesCount;
    const completionRate = scheduledClassesCount > 0 ? Math.round((assignedClassesCount / scheduledClassesCount) * 100) : 0;

    return {
      maHocKy: cleanMaHocKy,
      maBoMon: cleanMaBoMon,
      scope,
      summary: {
        totalClasses,
        scheduledClassesCount,
        unscheduledClassesCount,
        totalFamilies: families.length,
        assignedClassesCount,
        unassignedScheduledClassesCount,
        unassignedFamiliesCount: unassignedDetails.length,
        completionRate
      },
      lecturerStats,
      assignments,
      unassignedDetails
    };
  };

  // ================================================================
  // 20. [BOMON] ÁP DỤNG KẾT QUẢ PHÂN CÔNG TỰ ĐỘNG VÀO DATABASE
  // ================================================================
  static applyAutoAssign = async ({ maHocKy, maBoMon, assignments = [] } = {}) => {
    if (!maHocKy || !maHocKy.trim()) {
      throw new Error('Vui lòng chọn Học kỳ.');
    }
    if (!maBoMon || !maBoMon.trim()) {
      throw new Error('Không xác định được Bộ môn.');
    }
    if (!Array.isArray(assignments) || assignments.length === 0) {
      throw new Error('Danh sách phân công trống, không có dữ liệu để áp dụng.');
    }

    const cleanMaHocKy = maHocKy.trim();
    const cleanMaBoMon = maBoMon.trim();

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const assignMap = new Map();
      for (const item of assignments) {
        if (item.maLopHocPhan && item.maGiangVien) {
          assignMap.set(item.maLopHocPhan.trim(), item.maGiangVien.trim());
        }
      }

      const targetIds = Array.from(assignMap.keys());
      let updatedCount = 0;

      if (targetIds.length > 0) {
        // 1. Lọc trong 1 query duy nhất các lớp đủ điều kiện (đúng bộ môn, học kỳ, chưa khóa, đã có TKB)
        const [eligibleRows] = await conn.query(`
          SELECT MaLopHocPhan
          FROM LopHocPhan
          WHERE MaLopHocPhan IN (?)
            AND MaBoMon = ?
            AND MaHocKy = ?
            AND (TrangThaiPhanCong IS NULL OR TrangThaiPhanCong != 'Locked')
            AND EXISTS (SELECT 1 FROM ThoiKhoaBieu tkb WHERE tkb.MaLopHocPhan = LopHocPhan.MaLopHocPhan)
        `, [targetIds, cleanMaBoMon, cleanMaHocKy]);

        const idsToUpdate = eligibleRows.map(r => r.MaLopHocPhan);
        updatedCount = idsToUpdate.length;

        if (idsToUpdate.length > 0) {
          const caseClauses = [];
          const caseParams = [];

          for (const maLhp of idsToUpdate) {
            caseClauses.push('WHEN ? THEN ?');
            caseParams.push(maLhp, assignMap.get(maLhp));
          }

          const caseSql = `CASE MaLopHocPhan ${caseClauses.join(' ')} END`;

          // 2. Bulk update LopHocPhan trong 1 query duy nhất
          await conn.query(
            `UPDATE LopHocPhan SET MaGiangVien = ${caseSql}, TrangThaiPhanCong = 'Assigned' WHERE MaLopHocPhan IN (?)`,
            [...caseParams, idsToUpdate]
          );

          // 3. Bulk update đồng bộ BuoiHoc trong 1 query duy nhất
          await conn.query(
            `UPDATE BuoiHoc SET MaGiangVien = ${caseSql} WHERE MaLopHocPhan IN (?)`,
            [...caseParams, idsToUpdate]
          );
        }
      }

      await conn.commit();

      return {
        success: true,
        updatedCount,
        totalRequested: assignments.length,
        message: `Đã áp dụng thành công phân công cho ${updatedCount} lớp học phần!`
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  };
}

module.exports = ThoiKhoaBieuService;

