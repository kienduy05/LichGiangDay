const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function createTables() {
  console.log('--- DB Initialization ---');
  console.log(`Connecting to host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`Target Database: ${process.env.DB_NAME}`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false
      },
      multipleStatements: true
    });

    console.log('✓ Successfully connected to MySQL server.');

    // Drop existing tables cleanly
    console.log('Clearing existing tables...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const [existingTables] = await connection.query('SHOW TABLES');
    for (const tableRow of existingTables) {
      const tableName = Object.values(tableRow)[0];
      await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Existing tables cleared.');

    const sqlFilePath = path.join(__dirname, 'LichGiangDay_Mysql.sql');
    console.log(`Reading SQL script from: ${sqlFilePath}`);
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing SQL script to create tables...');
    await connection.query(sql);

    console.log('✓ Successfully created all tables and constraints in database:', process.env.DB_NAME);

    // Verify created tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableList = tables.map(t => Object.values(t)[0]);
    console.log(`\nCreated ${tableList.length} tables successfully:`);
    tableList.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

  } catch (error) {
    console.error('✗ Error creating tables:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConnection closed.');
    }
  }
}

createTables();
