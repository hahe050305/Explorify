// backend/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load root .env first, then let backend/.env override it
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'Explorify',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log(`[DB] Configuring MySQL pool for host: ${dbConfig.host}:${dbConfig.port}, user: ${dbConfig.user}, db: ${dbConfig.database}`);

const pool = mysql.createPool(dbConfig);

let passwordField = 'password';

async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ [DB] Successfully connected to MySQL database: ' + dbConfig.database);

    // ── 1. Check or Create "users" table ──
    const [userColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users';
    `, [dbConfig.database]);

    if (userColumns.length === 0) {
      console.log('ℹ️ [DB] "users" table not found. Creating it now...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      passwordField = 'password_hash';
      console.log('✅ [DB] "users" table created successfully.');
    } else {
      const colNames = userColumns.map(c => c.COLUMN_NAME);
      if (colNames.includes('password_hash')) {
        passwordField = 'password_hash';
      } else if (colNames.includes('password')) {
        passwordField = 'password';
      }
      console.log('✅ [DB] Existing "users" table found with columns:', colNames.join(', '));
      console.log(`ℹ️ [DB] Using password column: "${passwordField}"`);
    }

    // ── 2. Check or Create "orders" table for Razorpay Transactions ──
    const [orderColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders';
    `, [dbConfig.database]);

    if (orderColumns.length === 0) {
      console.log('ℹ️ [DB] "orders" table not found. Creating it now for Razorpay transactions...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id VARCHAR(100) NOT NULL UNIQUE,
          razorpay_order_id VARCHAR(100),
          razorpay_payment_id VARCHAR(100),
          razorpay_signature VARCHAR(255),
          user_id INT,
          user_email VARCHAR(255),
          amount DECIMAL(10, 2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'INR',
          status VARCHAR(50) DEFAULT 'created',
          items TEXT,
          shipping_address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ [DB] "orders" table created successfully.');
    } else {
      console.log('✅ [DB] Existing "orders" table found.');
    }

    connection.release();
    return true;
  } catch (error) {
    console.error('❌ [DB] Error connecting to MySQL:');
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('👉 Access Denied: Please verify your DB_USER and DB_PASSWORD in backend/.env');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`👉 Unknown database '${dbConfig.database}': Please ensure the database exists in MySQL Workbench or create it with: CREATE DATABASE ${dbConfig.database};`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error(`👉 Connection refused at ${dbConfig.host}:${dbConfig.port}. Make sure MySQL Server is running.`);
    } else {
      console.error(error.message || error);
    }
    return false;
  }
}

module.exports = {
  pool,
  initDatabase,
  getPasswordField: () => passwordField,
};
