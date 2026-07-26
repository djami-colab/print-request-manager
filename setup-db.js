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

    // Create database
    console.log('🏗️ Creating database...');
    try {
      await connectionNoDb.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ Database '${database}' created/verified`);
    } catch (error) {
      console.error('❌ Error creating database:', error.message);
    }

    // Create tables
    console.log('\n🏗️ Creating tables...');
    const tableStatements = [
      `CREATE TABLE IF NOT EXISTS \`${database}\`.\`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(100) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`profile\` VARCHAR(50) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_email\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      `CREATE TABLE IF NOT EXISTS \`${database}\`.\`projets\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`intitule\` VARCHAR(255) NOT NULL UNIQUE,
        \`unite\` VARCHAR(100) DEFAULT 'CIDI',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_intitule\` (\`intitule\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      `CREATE TABLE IF NOT EXISTS \`${database}\`.\`requests\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`request_number\` VARCHAR(50) NOT NULL UNIQUE,
        \`requester_name\` VARCHAR(100) NOT NULL,
        \`department\` VARCHAR(50) NOT NULL,
        \`project\` VARCHAR(100) NOT NULL,
        \`request_type\` VARCHAR(255) NOT NULL,
        \`reason\` TEXT DEFAULT NULL,
        \`device_used\` VARCHAR(100) DEFAULT NULL,
        \`operator_name\` VARCHAR(100) DEFAULT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'pending',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`completed_at\` TIMESTAMP NULL DEFAULT NULL,
        INDEX \`idx_status\` (\`status\`),
        INDEX \`idx_department\` (\`department\`),
        INDEX \`idx_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      `CREATE TABLE IF NOT EXISTS \`${database}\`.\`request_items\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`request_id\` INT NOT NULL,
        \`document_name\` VARCHAR(255) NOT NULL,
        \`format\` VARCHAR(10) NOT NULL,
        \`color_nb\` VARCHAR(20) NOT NULL,
        \`pages\` INT NOT NULL DEFAULT 1,
        \`copies\` INT NOT NULL DEFAULT 1,
        \`surface_m2\` DOUBLE NOT NULL,
        \`total_pages\` INT NOT NULL,
        FOREIGN KEY (\`request_id\`) REFERENCES \`${database}\`.\`requests\` (\`id\`) ON DELETE CASCADE,
        INDEX \`idx_request_id\` (\`request_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];

    for (const statement of tableStatements) {
      try {
        await connectionNoDb.query(statement);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error('❌ Error creating table:', error.message);
        }
      }
    }
    console.log('✅ All tables created/verified\n');

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
