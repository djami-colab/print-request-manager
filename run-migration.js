const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🔄 Démarrage de la migration...\n');
  
  try {
    // Créer la connexion MySQL
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
    
    // Lire et exécuter le fichier SQL de migration
    const migrationFile = path.join(__dirname, 'migrations', '001_add_annee_to_projets.sql');
    
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Fichier de migration non trouvé: ${migrationFile}`);
    }
    
    const sqlContent = fs.readFileSync(migrationFile, 'utf-8');
    
    // Diviser le contenu en requêtes individuelles
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));
    
    console.log(`📋 Exécution de ${queries.length} requête(s)\n`);
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      try {
        console.log(`  [${i + 1}/${queries.length}] Exécution...`);
        await connection.execute(query);
        console.log(`  ✅ Succès\n`);
      } catch (error) {
        console.error(`  ❌ Erreur: ${error.message}\n`);
        throw error;
      }
    }
    
    connection.release();
    await pool.end();
    
    console.log('✅ 🎉 Migration terminée avec succès!\n');
    console.log('📝 Résumé:');
    console.log('   ✓ Colonne "annee" ajoutée à la table "projets"');
    console.log('   ✓ Index créé sur la colonne "annee"\n');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  }
}

runMigration();
