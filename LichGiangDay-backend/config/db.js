const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true
});

// Thiết lập múi giờ Việt Nam (UTC+7) cho mọi kết nối tạo trong Pool
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+07:00'");
});

module.exports = pool;
