const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  console.log('🔄 Setting up database...\n');
  
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'print_request_db';

  try {
    // First, connect without specifying a database to create it
    console.log(`📌 Connecting to MySQL server at ${host}...`);
    const poolNoDb = mysql.createPool({
      host,
      user,
      password,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });

    const connectionNoDb = await poolNoDb.getConnection();
    console.log('✅ Connected to MySQL server\n');

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split by statements and execute each one
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    console.log('🏗️ Creating database and tables...');
    for (const statement of statements) {
      try {
        await connectionNoDb.execute(statement);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error('❌ Error executing statement:', error.message);
        }
      }
    }
    console.log('✅ Database and tables created/verified\n');

    connectionNoDb.release();
    await poolNoDb.end();

    // Now connect to the database to verify tables
    console.log(`📌 Connecting to database '${database}'...`);
    const pool = mysql.createPool({
      host,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });

    const connection = await pool.getConnection();
    console.log('✅ Connected to database\n');

    // Check tables
    console.log('🔍 Verifying tables...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [database]);

    const expectedTables = ['users', 'projets', 'requests', 'request_items'];
    const existingTables = tables.map(t => t.TABLE_NAME);
    
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(`  ✅ Table '${table}' exists`);
      } else {
        console.log(`  ❌ Table '${table}' is missing`);
      }
    }

    connection.release();
    await pool.end();

    console.log('\n✨ Database setup completed successfully!');
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Open phpMyAdmin`);
    console.log(`   2. Navigate to: ${database}`);
    console.log(`   3. You should see 4 tables: users, projets, requests, request_items`);
    console.log(`\n4️⃣ To migrate data from data.json, run: npm run migrate\n`);

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    console.error('\n📝 Make sure MySQL is running with credentials:');
    console.error(`   Host: ${host}`);
    console.error(`   User: ${user}`);
    console.error(`   Database: ${database}`);
    process.exit(1);
  }
}

setupDatabase();
