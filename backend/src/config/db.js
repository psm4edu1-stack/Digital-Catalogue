const mysql = require('mysql2/promise');
require('dotenv').config();

// Graceful check for MySQL/MariaDB connection credentials
const isConfigured = process.env.DB_HOST && process.env.DB_USER && process.env.DB_DATABASE;

let pool = null;

if (isConfigured) {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    multipleStatements: true,
    decimalNumbers: true,
  });

  pool.getConnection()
    .then((conn) => {
      console.log('MySQL/MariaDB database pool connected successfully.');
      conn.release();
    })
    .catch((err) => {
      console.error('MySQL/MariaDB database pool connection failed:', err.message);
    });

  pool.on('connection', () => {
    // Emitted on new connection acquisition (kept quiet to avoid log spam)
  });
} else {
  console.warn('⚠️ WARNING: MySQL/MariaDB connection variables are not fully configured in backend/.env.');
  console.warn('Backend API will run in sandbox mode using memory or JSON structures.');
}

// Expose a pg-like interface so call sites keep using `result.rows` / `result.rows[0]`.
// For INSERT/UPDATE/DELETE, `insertId` and `affectedRows` are attached too.
module.exports = {
  query: async (text, params) => {
    if (!pool) {
      throw new Error("MySQL/MariaDB client pool is not initialized. Run in mock fallback sandbox mode.");
    }
    const [rows] = await pool.query(text, params);
    if (Array.isArray(rows)) {
      // SELECT result set
      return { rows, rowCount: rows.length, insertId: null, affectedRows: rows.length };
    }
    // ResultSetHeader (INSERT / UPDATE / DELETE)
    return { rows: [], rowCount: rows.affectedRows, insertId: rows.insertId, affectedRows: rows.affectedRows };
  },
  pool,
  isConfigured: !!pool
};
