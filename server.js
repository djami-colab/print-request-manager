const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const ExcelJS = require('exceljs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration de la connexion MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'print_request_db'
};

// Facteurs de surface pour chaque format (en m²)
const FORMAT_SURFACES = {
  'A4': 0.0625,
  'A3': 0.125,
  'A2': 0.25,
  'A1': 0.5,
  'A0': 1.0
};

let pool;

// Connexion et initialisation de la base de données
async function initDB() {
  try {
    // 1. Connexion sans base de donnees pour la creer si elle n'existe pas
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.end();
    
    // 2. Initialisation du pool avec la base de donnees selectionnee
    pool = mysql.createPool(dbConfig);
    console.log('Connecté à la base de données MySQL.');
    
    // 3. Creation des tables si elles n'existent pas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`requests\` (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`request_items\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`request_id\` INT NOT NULL,
        \`document_name\` VARCHAR(255) NOT NULL,
        \`format\` VARCHAR(10) NOT NULL,
        \`color_nb\` VARCHAR(20) NOT NULL,
        \`pages\` INT NOT NULL DEFAULT 1,
        \`copies\` INT NOT NULL DEFAULT 1,
        \`surface_m2\` DOUBLE NOT NULL,
        \`total_pages\` INT NOT NULL,
        FOREIGN KEY (\`request_id\`) REFERENCES \`requests\` (\`id\`) ON DELETE CASCADE,
        INDEX \`idx_request_id\` (\`request_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('Tables validées en base de données.');
    
    // 4. Seeding de donnees de demonstration si la table est vide
    await seedDemoData();
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données :', error.message);
    console.log('Veuillez vous assurer que votre serveur MySQL est démarré sur localhost (port 3306) et que les identifiants dans .env sont corrects.');
  }
}

// Generateur de donnees fictives (Seeding)
async function seedDemoData() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM requests');
    if (rows[0].count > 0) {
      console.log('La base contient déjà des données. Seeding ignoré.');
      return;
    }
    
    console.log('Base vide. Génération de données de démonstration...');
    
    const departments = ['Architecture', 'Structure', 'VRD', 'Essais', 'Équipements', 'DEC', 'Coordination', 'Finance', 'DAS'];
    const names = [
      'Jean Dupont', 'Marie Curie', 'Pierre Martin', 'Sophie Bernard', 'Thomas Dubois',
      'Lucie Robert', 'Antoine Richard', 'Julie Petit', 'Michel Durand', 'Sarah Lefebvre'
    ];
    const projects = ['Tour Signal', 'Pont de l\'Avenir', 'Aménagement VRD Zone Est', 'Stade National', 'Rénovation Siège', 'Éco-quartier Sud'];
    const requestTypes = ['Appareil de tirage de plans', 'Appareil photocopieur', 'Appareil d\'impression'];
    const devices = ['Traceur T1600', 'Traceur T1300', 'Traceur Epson 5600', 'Kyocera 7003i', 'Traceur Xerox', 'Photocopieuse Xerox'];
    const operators = ['Karim', 'Hassan', 'Rachid', 'Fatima'];
    const formats = ['A4', 'A3', 'A2', 'A1', 'A0'];
    const colors = ['Couleur', 'N&B'];
    
    const now = new Date();
    
    // Generer 25 demandes d'impression pour les 30 derniers jours
    for (let i = 1; i <= 25; i++) {
      const createdDate = new Date();
      createdDate.setDate(now.getDate() - (25 - i) * 1.2); // échelonné dans le temps
      
      const reqNum = `CIDI-${createdDate.getFullYear()}-${String(i).padStart(4, '0')}`;
      const name = names[Math.floor(Math.random() * names.length)];
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const proj = projects[Math.floor(Math.random() * projects.length)];
      const type = requestTypes[Math.floor(Math.random() * requestTypes.length)];
      const reason = Math.random() > 0.7 ? "Documents requis pour validation externe (Maîtrise d'ouvrage)" : null;
      
      // 70% de requêtes terminées
      const isCompleted = Math.random() < 0.75;
      const status = isCompleted ? 'completed' : 'pending';
      const device = isCompleted ? devices[Math.floor(Math.random() * devices.length)] : null;
      const opName = isCompleted ? operators[Math.floor(Math.random() * operators.length)] : null;
      const compDate = isCompleted ? new Date(createdDate.getTime() + (Math.random() * 4 + 1) * 3600 * 1000) : null; // complété quelques heures après
      
      // Inserer la demande
      const [res] = await pool.query(
        `INSERT INTO requests (request_number, requester_name, department, project, request_type, reason, device_used, operator_name, status, created_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [reqNum, name, dept, proj, type, reason, device, opName, status, createdDate, compDate]
      );
      
      const requestId = res.insertId;
      
      // Inserer 1 à 3 documents par demande
      const itemsCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 1; j <= itemsCount; j++) {
        const docName = `Pièce_${j}_Dessin_${proj.replace(/\s+/g, '_')}_v${j}.pdf`;
        const fmt = formats[Math.floor(Math.random() * formats.length)];
        const clr = colors[Math.floor(Math.random() * colors.length)];
        const pages = Math.floor(Math.random() * 15) + 1;
        const copies = Math.floor(Math.random() * 5) + 1;
        
        const surface_m2 = pages * copies * FORMAT_SURFACES[fmt];
        const total_pages = pages * copies;
        
        await pool.query(
          `INSERT INTO request_items (request_id, document_name, format, color_nb, pages, copies, surface_m2, total_pages)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [requestId, docName, fmt, clr, pages, copies, surface_m2, total_pages]
        );
      }
    }
    console.log('Seeding réussi : 25 demandes ajoutées.');
  } catch (err) {
    console.error('Erreur lors du seeding :', err);
  }
}

// API: Recupere toutes les demandes avec leurs documents
app.get('/api/requests', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Base de données non initialisée.' });
    
    const { status, department, search, dateStart, dateEnd } = req.query;
    let query = `
      SELECT r.*, 
             COUNT(ri.id) as total_items, 
             SUM(ri.total_pages) as sum_pages, 
             SUM(ri.surface_m2) as sum_surface
      FROM requests r
      LEFT JOIN request_items ri ON r.id = ri.request_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }
    if (department) {
      conditions.push('r.department = ?');
      params.push(department);
    }
    if (search) {
      conditions.push('(r.requester_name LIKE ? OR r.project LIKE ? OR r.request_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (dateStart) {
      conditions.push('DATE(r.created_at) >= ?');
      params.push(dateStart);
    }
    if (dateEnd) {
      conditions.push('DATE(r.created_at) <= ?');
      params.push(dateEnd);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY r.id ORDER BY r.created_at DESC';
    
    const [requests] = await pool.query(query, params);
    
    // Charger les items pour chaque requête
    for (let r of requests) {
      const [items] = await pool.query('SELECT * FROM request_items WHERE request_id = ?', [r.id]);
      r.items = items;
    }
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Creer un bon de demande
app.post('/api/requests', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { requester_name, department, project, request_type, reason, items } = req.body;
    
    if (!requester_name || !department || !project || !request_type || !items || items.length === 0) {
      return res.status(400).json({ error: 'Champs obligatoires manquants.' });
    }
    
    // Generer un numero de demande unique
    const now = new Date();
    const year = now.getFullYear();
    const [countRows] = await connection.query('SELECT COUNT(*) as count FROM requests WHERE YEAR(created_at) = ?', [year]);
    const nextSeq = countRows[0].count + 1;
    const request_number = `CIDI-${year}-${String(nextSeq).padStart(4, '0')}`;
    
    // Inserer l'en-tete
    const [insertResult] = await connection.query(
      `INSERT INTO requests (request_number, requester_name, department, project, request_type, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [request_number, requester_name, department, project, request_type, reason]
    );
    
    const requestId = insertResult.insertId;
    
    // Inserer les pieces detachees
    for (let item of items) {
      const { document_name, format, color_nb, pages, copies } = item;
      const fmtSurface = FORMAT_SURFACES[format] || 0.0625;
      const surface_m2 = pages * copies * fmtSurface;
      const total_pages = pages * copies;
      
      await connection.query(
        `INSERT INTO request_items (request_id, document_name, format, color_nb, pages, copies, surface_m2, total_pages)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [requestId, document_name, format, color_nb, pages, copies, surface_m2, total_pages]
      );
    }
    
    await connection.commit();
    res.status(201).json({ success: true, requestId, request_number });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// API: Valider/Finaliser un bon par l'operateur
app.put('/api/requests/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { device_used, operator_name } = req.body;
    
    if (!device_used || !operator_name) {
      return res.status(400).json({ error: 'L\'appareil utilisé et le nom de l\'opérateur sont requis.' });
    }
    
    const [result] = await pool.query(
      `UPDATE requests 
       SET device_used = ?, operator_name = ?, status = 'completed', completed_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND status = 'pending'`,
      [device_used, operator_name, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Demande introuvable ou déjà complétée.' });
    }
    
    res.json({ success: true, message: 'Demande complétée avec succès.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Obtenir des statistiques pour le tableau de bord
app.get('/api/stats', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Base de données non initialisée.' });
    
    // 1. Totaux generaux (seulement pour les requetes completed pour la consommation reelle)
    const [globalRows] = await pool.query(`
      SELECT 
        COUNT(r.id) as total_requests,
        SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed_requests,
        COALESCE(SUM(ri.total_pages), 0) as total_pages,
        COALESCE(SUM(ri.surface_m2), 0) as total_surface
      FROM requests r
      LEFT JOIN request_items ri ON r.id = ri.request_id
    `);
    
    // 2. Consommation par Departement
    const [deptRows] = await pool.query(`
      SELECT 
        r.department,
        COUNT(DISTINCT r.id) as request_count,
        COALESCE(SUM(ri.total_pages), 0) as pages,
        COALESCE(SUM(ri.surface_m2), 0) as surface
      FROM requests r
      LEFT JOIN request_items ri ON r.id = ri.request_id
      GROUP BY r.department
      ORDER BY surface DESC
    `);
    
    // 3. Consommation par Utilisateur (Top 10)
    const [userRows] = await pool.query(`
      SELECT 
        r.requester_name,
        r.department,
        COUNT(DISTINCT r.id) as request_count,
        COALESCE(SUM(ri.total_pages), 0) as pages,
        COALESCE(SUM(ri.surface_m2), 0) as surface
      FROM requests r
      LEFT JOIN request_items ri ON r.id = ri.request_id
      GROUP BY r.requester_name, r.department
      ORDER BY surface DESC
      LIMIT 10
    `);
    
    // 4. Repartition des Appareils utilises
    const [deviceRows] = await pool.query(`
      SELECT 
        r.device_used,
        COUNT(*) as count,
        COALESCE(SUM(ri.total_pages), 0) as pages,
        COALESCE(SUM(ri.surface_m2), 0) as surface
      FROM requests r
      LEFT JOIN request_items ri ON r.id = ri.request_id
      WHERE r.status = 'completed' AND r.device_used IS NOT NULL
      GROUP BY r.device_used
      ORDER BY count DESC
    `);

    // 5. Evolution de la consommation (Timeline par jour)
    const [timelineRows] = await pool.query(`
      SELECT 
        DATE(r.created_at) as date,
        COUNT(DISTINCT r.id) as count,
        COALESCE(SUM(ri.surface_m2), 0) as surface
      FROM requests r
      LEFT JOIN request_items ri ON r.id = ri.request_id
      GROUP BY DATE(r.created_at)
      ORDER BY date ASC
      LIMIT 30
    `);
    
    res.json({
      global: globalRows[0],
      departments: deptRows,
      users: userRows,
      devices: deviceRows,
      timeline: timelineRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Export Excel avec ExcelJS (haute qualite, formate)
app.get('/api/export', async (req, res) => {
  try {
    if (!pool) return res.status(500).send('Base de données non disponible.');
    
    const { status, department, dateStart, dateEnd } = req.query;
    
    // Recuperer les donnees
    let query = `
      SELECT r.*, 
             COALESCE(SUM(ri.total_pages), 0) as total_pages, 
             COALESCE(SUM(ri.surface_m2), 0) as total_surface
      FROM requests r
      LEFT JOIN request_items ri ON r.id = ri.request_id
    `;
    const params = [];
    const conditions = [];
    
    if (status) { conditions.push('r.status = ?'); params.push(status); }
    if (department) { conditions.push('r.department = ?'); params.push(department); }
    if (dateStart) { conditions.push('DATE(r.created_at) >= ?'); params.push(dateStart); }
    if (dateEnd) { conditions.push('DATE(r.created_at) <= ?'); params.push(dateEnd); }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' GROUP BY r.id ORDER BY r.created_at DESC';
    
    const [requests] = await pool.query(query, params);
    
    // Recuperer les items pour l'explication detaillee
    for (let r of requests) {
      const [items] = await pool.query('SELECT * FROM request_items WHERE request_id = ?', [r.id]);
      r.items = items;
    }
    
    // Creer un classeur Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Antigravity Print Manager';
    workbook.created = new Date();
    
    const sheet = workbook.addWorksheet('Rapport Impressions');
    
    // Parametrage general du quadrillage
    sheet.views = [{ showGridLines: true }];
    
    // Titre du rapport
    sheet.mergeCells('A1:J1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'RAPPORT DE CONSOMMATION PAPIER & SUIVI DES IMPRESSIONS';
    titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' } // Bleu Marine Premium
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 40;
    
    // Ligne vide
    sheet.addRow([]);
    
    // Informations de filtrage
    sheet.addRow(['Filtre Statut:', status || 'Tous', 'Filtre Département:', department || 'Tous']);
    sheet.addRow(['Période:', `${dateStart || 'Début'} au ${dateEnd || 'Fin'}`, 'Généré le:', new Date().toLocaleString('fr-FR')]);
    
    // Formater la zone de métadonnées
    ['A3', 'A4', 'C3', 'C4'].forEach(cellRef => {
      sheet.getCell(cellRef).font = { bold: true, size: 10, color: { argb: 'FF595959' } };
    });
    sheet.addRow([]); // ligne vide
    
    // En-têtes du tableau
    const headers = [
      'N° Bon',
      'Date Création',
      'Demandeur',
      'Département',
      'Projet',
      'Moyen Demandé',
      'Statut',
      'Appareil Utilisé',
      'Total Pages',
      'Surface (m²)'
    ];
    
    const headerRow = sheet.addRow(headers);
    headerRow.height = 28;
    
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2F5597' } // Bleu moyen corporatif
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        right: { style: 'thin', color: { argb: 'FFBFBFBF' } }
      };
    });
    
    // Ajouter les lignes de donnees
    let startRow = 7;
    requests.forEach((req, idx) => {
      const dateStr = new Date(req.created_at).toLocaleDateString('fr-FR');
      const statusText = req.status === 'completed' ? 'Traité' : 'En attente';
      
      const rowData = [
        req.request_number,
        dateStr,
        req.requester_name,
        req.department,
        req.project,
        req.request_type,
        statusText,
        req.device_used || '-',
        parseFloat(req.total_pages),
        parseFloat(req.total_surface)
      ];
      
      const row = sheet.addRow(rowData);
      row.height = 20;
      
      // Zebra striping alternant (blanc / gris clair)
      const bgColor = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF2F2F2';
      
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };
        
        // Alignements
        if (colNumber === 1 || colNumber === 2 || colNumber === 7) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNumber === 9 || colNumber === 10) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }

        // Formats numeriques
        if (colNumber === 9) {
          cell.numFmt = '#,##0';
        }
        if (colNumber === 10) {
          cell.numFmt = '0.0000';
        }
      });
    });
    
    // Ligne des totaux
    const totalRowIndex = sheet.rowCount + 1;
    sheet.mergeCells(`A${totalRowIndex}:H${totalRowIndex}`);
    
    const labelCell = sheet.getCell(`A${totalRowIndex}`);
    labelCell.value = 'TOTAL GÉNÉRAL';
    labelCell.font = { name: 'Segoe UI', bold: true, size: 11 };
    labelCell.alignment = { horizontal: 'right', vertical: 'middle' };
    
    // Formules de somme Excel
    const lastDataRow = totalRowIndex - 1;
    const pageSumCell = sheet.getCell(`I${totalRowIndex}`);
    pageSumCell.value = { formula: `SUM(I7:I${lastDataRow})` };
    pageSumCell.font = { name: 'Segoe UI', bold: true, size: 11 };
    pageSumCell.numFmt = '#,##0';
    pageSumCell.alignment = { horizontal: 'right', vertical: 'middle' };
    
    const surfaceSumCell = sheet.getCell(`J${totalRowIndex}`);
    surfaceSumCell.value = { formula: `SUM(J7:J${lastDataRow})` };
    surfaceSumCell.font = { name: 'Segoe UI', bold: true, size: 11 };
    surfaceSumCell.numFmt = '0.0000';
    surfaceSumCell.alignment = { horizontal: 'right', vertical: 'middle' };
    
    // Styles pour la ligne des totaux (Bordure comptable double en bas, fond gris clair)
    const totalRow = sheet.getRow(totalRowIndex);
    totalRow.height = 24;
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEAEAEA' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'double', color: { argb: 'FF000000' } }
      };
    });
    
    // Ajustement automatique de la largeur des colonnes
    sheet.columns.forEach((column, colIdx) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        // Ignorer la premiere ligne fusionnee
        if (cell.row === 1) return;
        
        let val = '';
        if (cell.value) {
          if (typeof cell.value === 'object' && cell.value.formula) {
            val = '123,456'; // Valeur fictive estimative de taille pour la formule
          } else {
            val = cell.value.toString();
          }
        }
        maxLength = Math.max(maxLength, val.length);
      });
      // Donner un peu d'espace de securite supplémentaire
      column.width = Math.max(maxLength + 4, 12);
    });
    
    // Repondre avec le fichier Excel
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Rapport_Impressions_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    res.status(500).send(`Erreur lors de la génération du fichier Excel : ${error.message}`);
  }
});

// Lancer le serveur
app.listen(PORT, async () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  await initDB();
});
