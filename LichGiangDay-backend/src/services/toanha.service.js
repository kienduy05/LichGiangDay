const db = require('../../config/db');

class ToaNhaService {
  /**
   * Lấy danh sách tất cả các tòa nhà kèm số lượng phòng học thuộc tòa nhà đó
   */
  static getAll = async () => {
    const [rows] = await db.query(`
      SELECT 
        tn.MaToaNha,
        tn.TenToaNha,
        tn.CoSo,
        tn.DiaChi,
        COUNT(ph.MaPhong) AS SoPhongHoc
      FROM ToaNha tn
      LEFT JOIN PhongHoc ph ON tn.MaToaNha = ph.MaToaNha
      GROUP BY tn.MaToaNha, tn.TenToaNha, tn.CoSo, tn.DiaChi
      ORDER BY tn.MaToaNha ASC
    `);
    return rows;
  };

  /**
   * Lấy thông tin chi tiết 1 tòa nhà theo Mã Tòa Nhà
   */
  static getById = async (maToaNha) => {
    const [rows] = await db.query(`
      SELECT * FROM ToaNha WHERE MaToaNha = ? LIMIT 1
    `, [maToaNha]);
    return rows[0] || null;
  };

  /**
   * Tạo tòa nhà mới
   */
  static create = async ({ maToaNha, tenToaNha, coSo, diaChi }) => {
    // Kiểm tra xem Mã Tòa Nhà đã tồn tại chưa
    const existing = await this.getById(maToaNha);
    if (existing) {
      throw new Error(`Mã tòa nhà '${maToaNha}' đã tồn tại trong hệ thống.`);
    }

    await db.query(`
      INSERT INTO ToaNha (MaToaNha, TenToaNha, CoSo, DiaChi)
      VALUES (?, ?, ?, ?)
    `, [maToaNha.trim().toUpperCase(), tenToaNha.trim(), coSo?.trim() || null, diaChi?.trim() || null]);

    return {
      maToaNha: maToaNha.trim().toUpperCase(),
      tenToaNha: tenToaNha.trim(),
      coSo: coSo?.trim() || null,
      diaChi: diaChi?.trim() || null
    };
  };

  /**
   * Cập nhật thông tin tòa nhà
   */
  static update = async (maToaNha, { tenToaNha, coSo, diaChi }) => {
    const existing = await this.getById(maToaNha);
    if (!existing) {
      throw new Error(`Không tìm thấy tòa nhà có mã '${maToaNha}'.`);
    }

    await db.query(`
      UPDATE ToaNha
      SET TenToaNha = ?, CoSo = ?, DiaChi = ?
      WHERE MaToaNha = ?
    `, [tenToaNha.trim(), coSo?.trim() || null, diaChi?.trim() || null, maToaNha]);

    return {
      maToaNha,
      tenToaNha: tenToaNha.trim(),
      coSo: coSo?.trim() || null,
      diaChi: diaChi?.trim() || null
    };
  };

  /**
   * Xóa tòa nhà
   */
  static delete = async (maToaNha) => {
    const existing = await this.getById(maToaNha);
    if (!existing) {
      throw new Error(`Không tìm thấy tòa nhà có mã '${maToaNha}'.`);
    }

    // Kiểm tra xem tòa nhà có chứa phòng học nào không
    const [rooms] = await db.query(`
      SELECT COUNT(*) AS total FROM PhongHoc WHERE MaToaNha = ?
    `, [maToaNha]);

    if (rooms[0]?.total > 0) {
      throw new Error(`Không thể xóa tòa nhà '${maToaNha}' vì đang có ${rooms[0].total} phòng học trực thuộc.`);
    }

    await db.query(`
      DELETE FROM ToaNha WHERE MaToaNha = ?
    `, [maToaNha]);

    return { success: true, maToaNha };
  };
}

module.exports = ToaNhaService;
