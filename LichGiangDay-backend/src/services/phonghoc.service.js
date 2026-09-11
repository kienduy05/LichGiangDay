const db = require('../../config/db');

class PhongHocService {
  /**
   * Lấy danh sách tất cả phòng học JOIN với bảng Tòa Nhà
   */
  static getAll = async () => {
    const [rows] = await db.query(`
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
      ORDER BY ph.MaToaNha ASC, ph.MaPhong ASC
    `);
    return rows;
  };

  /**
   * Lấy thông tin chi tiết 1 phòng học
   */
  static getById = async (maPhong) => {
    const [rows] = await db.query(`
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
      WHERE ph.MaPhong = ?
      LIMIT 1
    `, [maPhong]);
    return rows[0] || null;
  };

  /**
   * Tạo phòng học mới
   */
  static create = async ({ maPhong, tenPhong, maToaNha, sucChua, loaiPhong, trangThai }) => {
    // Kiểm tra xem phòng học đã tồn tại chưa
    const existing = await this.getById(maPhong);
    if (existing) {
      throw new Error(`Mã phòng học '${maPhong}' đã tồn tại trong hệ thống.`);
    }

    // Kiểm tra xem Mã Tòa Nhà có tồn tại không
    const [building] = await db.query(`
      SELECT MaToaNha FROM ToaNha WHERE MaToaNha = ? LIMIT 1
    `, [maToaNha]);
    if (building.length === 0) {
      throw new Error(`Tòa nhà '${maToaNha}' không tồn tại trong hệ thống.`);
    }

    const capacity = Number(sucChua) || 50;
    const status = trangThai || 'Ready';

    await db.query(`
      INSERT INTO PhongHoc (MaPhong, TenPhong, MaToaNha, SucChua, LoaiPhong, TrangThai)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      maPhong.trim().toUpperCase(), 
      tenPhong.trim(), 
      maToaNha.trim().toUpperCase(), 
      capacity, 
      loaiPhong?.trim() || 'Phòng lý thuyết', 
      status
    ]);

    return this.getById(maPhong.trim().toUpperCase());
  };

  /**
   * Cập nhật thông tin phòng học
   */
  static update = async (maPhong, { tenPhong, maToaNha, sucChua, loaiPhong, trangThai }) => {
    const existing = await this.getById(maPhong);
    if (!existing) {
      throw new Error(`Không tìm thấy phòng học có mã '${maPhong}'.`);
    }

    // Nếu đổi sang tòa nhà khác, kiểm tra xem tòa nhà đó có tồn tại không
    if (maToaNha && maToaNha !== existing.MaToaNha) {
      const [building] = await db.query(`
        SELECT MaToaNha FROM ToaNha WHERE MaToaNha = ? LIMIT 1
      `, [maToaNha]);
      if (building.length === 0) {
        throw new Error(`Tòa nhà '${maToaNha}' không tồn tại trong hệ thống.`);
      }
    }

    const capacity = Number(sucChua) || existing.SucChua;
    const buildingCode = maToaNha ? maToaNha.trim().toUpperCase() : existing.MaToaNha;
    const status = trangThai || existing.TrangThai;

    await db.query(`
      UPDATE PhongHoc
      SET TenPhong = ?, MaToaNha = ?, SucChua = ?, LoaiPhong = ?, TrangThai = ?
      WHERE MaPhong = ?
    `, [
      tenPhong.trim(), 
      buildingCode, 
      capacity, 
      loaiPhong?.trim() || null, 
      status, 
      maPhong
    ]);

    return this.getById(maPhong);
  };

  /**
   * Chuyển đổi trạng thái hoạt động nhanh (Ready <-> Maintenance)
   */
  static toggleStatus = async (maPhong) => {
    const existing = await this.getById(maPhong);
    if (!existing) {
      throw new Error(`Không tìm thấy phòng học có mã '${maPhong}'.`);
    }

    const newStatus = existing.TrangThai === 'Ready' ? 'Maintenance' : 'Ready';

    await db.query(`
      UPDATE PhongHoc SET TrangThai = ? WHERE MaPhong = ?
    `, [newStatus, maPhong]);

    return { maPhong, trangThai: newStatus };
  };

  /**
   * Xóa phòng học
   */
  static delete = async (maPhong) => {
    const existing = await this.getById(maPhong);
    if (!existing) {
      throw new Error(`Không tìm thấy phòng học có mã '${maPhong}'.`);
    }

    // Kiểm tra xem phòng học có đang được xếp lịch dạy hay không (bảng LichGiangDay / LopHocPhan)
    const [schedules] = await db.query(`
      SELECT COUNT(*) AS total FROM LichGiangDay WHERE MaPhong = ?
    `, [maPhong]);

    if (schedules[0]?.total > 0) {
      throw new Error(`Không thể xóa phòng học '${maPhong}' vì đang có ${schedules[0].total} buổi học được xếp tại phòng này.`);
    }

    await db.query(`
      DELETE FROM PhongHoc WHERE MaPhong = ?
    `, [maPhong]);

    return { success: true, maPhong };
  };
}

module.exports = PhongHocService;
