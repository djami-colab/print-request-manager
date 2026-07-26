const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_FILE = path.join(__dirname, 'data.json');

async function migrate() {
  console.log('🔄 Démarrage de la migration de data.json vers MySQL...\n');
  
  try {
    // Créer la pool MySQL
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'print_request_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    const connection = await pool.getConnection();
    console.log('✅ Connexion MySQL établie\n');
    
    // Lire le fichier data.json
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    console.log(`📂 Fichier data.json chargé\n`);
    console.log(`  - ${data.users.length} utilisateurs`);
    console.log(`  - ${data.requests.length} demandes`);
    console.log(`  - ${data.requestItems.length} articles\n`);
    
    // Migrer les utilisateurs
    console.log('👥 Migration des utilisateurs...');
    for (let user of data.users) {
      try {
        await connection.execute(
          `INSERT INTO users (id, name, email, password, profile, created_at) 
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          [user.id, user.name, user.email, user.password, user.profile, user.created_at]
        );
      } catch (error) {
        console.log(`  ⚠️ Utilisateur ${user.email} : ${error.message.substring(0, 50)}`);
      }
    }
    console.log(`✅ ${data.users.length} utilisateurs migrés\n`);
    
    // Extraire et migrer les projets uniques
    const uniqueProjects = new Map();
    data.requests.forEach(req => {
      if (req.project) {
        uniqueProjects.set(req.project, req.project);
      }
    });
    
    console.log('🏗️ Migration des projets...');
    for (let project of uniqueProjects.values()) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO projets (intitule, unite) VALUES (?, 'CIDI')`,
          [project]
        );
      } catch (error) {
        console.log(`  ⚠️ Projet ${project} : ${error.message.substring(0, 50)}`);
      }
    }
    console.log(`✅ ${uniqueProjects.size} projets migrés\n`);
    
    // Migrer les demandes
    console.log('📋 Migration des demandes...');
    for (let request of data.requests) {
      try {
        await connection.execute(
          `INSERT INTO requests 
           (id, request_number, requester_name, department, project, request_type, reason, device_used, operator_name, status, created_at, completed_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status = VALUES(status)`,
          [
            request.id,
            request.request_number,
            request.requester_name,
            request.department,
            request.project,
            request.request_type,
            request.reason,
            request.device_used,
            request.operator_name,
            request.status,
            request.created_at,
            request.completed_at
          ]
        );
      } catch (error) {
        console.log(`  ⚠️ Demande ${request.request_number} : ${error.message.substring(0, 50)}`);
      }
    }
    console.log(`✅ ${data.requests.length} demandes migrées\n`);
    
    // Migrer les articles
    console.log('📄 Migration des articles...');
    for (let item of data.requestItems) {
      try {
        await connection.execute(
          `INSERT INTO request_items 
           (id, request_id, document_name, format, color_nb, pages, copies, surface_m2, total_pages) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE document_name = VALUES(document_name)`,
          [
            item.id,
            item.request_id,
            item.document_name,
            item.format,
            item.color_nb,
            item.pages,
            item.copies,
            item.surface_m2,
            item.total_pages
          ]
        );
      } catch (error) {
        console.log(`  ⚠️ Article ${item.id} : ${error.message.substring(0, 50)}`);
      }
    }
    console.log(`✅ ${data.requestItems.length} articles migrés\n`);
    
    connection.release();
    await pool.end();
    
    console.log('✅ 🎉 Migration terminée avec succès!\n');
    console.log('📊 Résumé:');
    console.log(`   - ${data.users.length} utilisateurs`);
    console.log(`   - ${uniqueProjects.size} projets`);
    console.log(`   - ${data.requests.length} demandes`);
    console.log(`   - ${data.requestItems.length} articles\n`);
    console.log('✨ Votre application est maintenant prête avec MySQL!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  }
}

migrate();
