const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'print_request_db'
};

console.log('[v0] Testing connection with config:', {
  host: config.host,
  user: config.user,
  database: config.database,
  password: config.password ? '***' : 'empty'
});

(async () => {
  try {
    const pool = mysql.createPool(config);
    const connection = await pool.getConnection();
    console.log('[v0] ✓ Connected to MySQL successfully');
    
    // Check if tables exist
    const [tables] = await connection.query("SHOW TABLES");
    console.log('[v0] Tables in database:', tables.map(t => Object.values(t)[0]));
    
    connection.release();
    pool.end();
  } catch (error) {
    console.error('[v0] ✗ Connection error:', error.message);
    process.exit(1);
  }
})();
