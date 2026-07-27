const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'print_request_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialiser la base de données
async function loadDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('Connexion MySQL réussie');
    connection.release();
  } catch (error) {
    console.error('Erreur de connexion MySQL:', error.message);
    throw error;
  }
}

// === GESTION DES UTILISATEURS ===

// Fonction de connexion
async function login(email, password) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT id, name, email, profile, created_at FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    connection.release();
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return null;
  }
}

// Fonction de création de compte
async function signup(name, email, password, profile) {
  try {
    const connection = await pool.getConnection();
    
    // Vérifier que l'email n'existe pas déjà
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      connection.release();
      return null;
    }
    
    // Insérer le nouvel utilisateur
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password, profile) VALUES (?, ?, ?, ?)',
      [name, email, password, profile]
    );
    
    connection.release();
    
    return {
      id: result.insertId,
      name,
      email,
      profile,
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur lors de la création de compte:', error);
    return null;
  }
}

// Générer un token simplifié (en base64)
function generateToken(user) {
  const tokenData = {
    userId: user.id,
    email: user.email,
    profile: user.profile,
    iat: Date.now()
  };
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

// Vérifier un token
function verifyToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded;
  } catch {
    return null;
  }
}

// === GESTION DES PROJETS ===

// Ajouter un projet
async function addProject(intitule, unite) {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO projets (intitule, unite) VALUES (?, ?)',
      [intitule, unite]
    );
    connection.release();
    
    return {
      id: result.insertId,
      intitule,
      unite
    };
  } catch (error) {
    console.error('Erreur lors de l\'ajout du projet:', error);
    return null;
  }
}

// Obtenir tous les projets
async function getProjects() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM projets ORDER BY intitule ASC');
    connection.release();
    
    return rows;
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    return [];
  }
}

// Obtenir un projet par ID
async function getProjectById(id) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM projets WHERE id = ?',
      [id]
    );
    connection.release();
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Erreur lors de la récupération du projet:', error);
    return null;
  }
}

// Modifier un projet
async function updateProject(id, intitule, unite) {
  try {
    const connection = await pool.getConnection();
    await connection.execute(
      'UPDATE projets SET intitule = ?, unite = ? WHERE id = ?',
      [intitule, unite, id]
    );
    connection.release();
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la modification du projet:', error);
    return false;
  }
}

// Supprimer un projet
async function deleteProject(id) {
  try {
    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM projets WHERE id = ?', [id]);
    connection.release();
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error);
    return false;
  }
}

// === GESTION DES DEMANDES ===

// Créer une nouvelle demande
async function createRequest(data) {
  let connection;
  try {
    console.log('[v0] Creating request with data:', JSON.stringify(data).substring(0, 100));
    
    connection = await pool.getConnection();
    
    // Générer le numéro de demande
    const now = new Date();
    const year = now.getFullYear();
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM requests WHERE YEAR(created_at) = ?',
      [year]
    );
    const count = countResult[0].count + 1;
    const request_number = `CIDI-${year}-${String(count).padStart(4, '0')}`;
    console.log('[v0] Generated request number:', request_number);
    
    // Insérer la demande
    const [result] = await connection.execute(
      `INSERT INTO requests 
       (request_number, requester_name, department, project, request_type, reason, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [request_number, data.requester_name, data.department, data.project, data.request_type, data.reason || null]
    );
    
    const requestId = result.insertId;
    console.log('[v0] Request inserted with ID:', requestId);
    
    // Insérer les items
    const surfaceMap = { 'A4': 0.0625, 'A3': 0.125, 'A2': 0.25, 'A1': 0.5, 'A0': 1.0 };
    
    for (let item of data.items) {
      const surface = item.pages * item.copies * (surfaceMap[item.format] || 0.0625);
      console.log('[v0] Inserting item:', item.document_name, 'with surface:', surface);
      
      await connection.execute(
        `INSERT INTO request_items 
         (request_id, document_name, format, color_nb, pages, copies, surface_m2, total_pages) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [requestId, item.document_name, item.format, item.color_nb, item.pages, item.copies, surface, item.pages * item.copies]
      );
    }
    
    connection.release();
    console.log('[v0] Request created successfully with ID:', requestId, 'Number:', request_number);
    
    return {
      id: requestId,
      request_number: request_number
    };
  } catch (error) {
    console.error('[v0] Erreur lors de la création de la demande:', error.message);
    console.error('[v0] Full error:', error);
    if (connection) connection.release();
    throw error;
  }
}

// Obtenir toutes les demandes avec filtres
async function getRequests(filters = {}) {
  try {
    const connection = await pool.getConnection();
    
    let query = `
      SELECT r.*, 
             COUNT(ri.id) as total_items,
             SUM(ri.total_pages) as total_pages,
             SUM(ri.surface_m2) as total_surface
      FROM requests r
      LEFT JOIN request_items ri ON r.id = ri.request_id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.status) {
      query += ' AND r.status = ?';
      params.push(filters.status);
    }
    
    if (filters.department) {
      query += ' AND r.department = ?';
      params.push(filters.department);
    }
    
    if (filters.search) {
      query += ` AND (r.requester_name LIKE ? OR r.project LIKE ? OR r.request_number LIKE ?)`;
      const search = `%${filters.search}%`;
      params.push(search, search, search);
    }
    
    query += ` GROUP BY r.id ORDER BY r.created_at DESC`;
    
    const [rows] = await connection.execute(query, params);
    
    // Récupérer les items pour chaque demande
    for (let req of rows) {
      const [items] = await connection.execute(
        'SELECT * FROM request_items WHERE request_id = ?',
        [req.id]
      );
      req.items = items;
    }
    
    connection.release();
    
    return rows;
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    return [];
  }
}

// Finaliser une demande
async function completeRequest(requestId, deviceUsed, operatorName) {
  try {
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      `UPDATE requests 
       SET status = 'completed', device_used = ?, operator_name = ?, completed_at = NOW() 
       WHERE id = ?`,
      [deviceUsed, operatorName, requestId]
    );
    
    connection.release();
    
    return result.affectedRows > 0 ? { id: requestId } : null;
  } catch (error) {
    console.error('Erreur lors de la finalisation de la demande:', error);
    return null;
  }
}

// Obtenir les statistiques
async function getStats() {
  try {
    const connection = await pool.getConnection();
    
    // Statistiques globales
    const [globalStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_requests,
        SUM(ri.total_pages) as total_pages,
        SUM(ri.surface_m2) as total_surface
      FROM requests r
      LEFT JOIN request_items ri ON r.id = ri.request_id
    `);
    
    // Statistiques par département
    const [deptStats] = await connection.execute(`
      SELECT 
        r.department,
        COUNT(DISTINCT r.id) as request_count,
        SUM(ri.total_pages) as pages,
        SUM(ri.surface_m2) as surface
      FROM requests r
      LEFT JOIN request_items ri ON r.id = ri.request_id
      GROUP BY r.department
      ORDER BY surface DESC
    `);
    
    // Statistiques par utilisateur (Top 10)
    const [userStats] = await connection.execute(`
      SELECT 
        r.requester_name,
        r.department,
        COUNT(DISTINCT r.id) as request_count,
        SUM(ri.total_pages) as pages,
        SUM(ri.surface_m2) as surface
      FROM requests r
      LEFT JOIN request_items ri ON r.id = ri.request_id
      GROUP BY r.requester_name, r.department
      ORDER BY surface DESC
      LIMIT 10
    `);
    
    // Statistiques par appareil
    const [deviceStats] = await connection.execute(`
      SELECT 
        r.device_used,
        COUNT(DISTINCT r.id) as count,
        SUM(ri.total_pages) as pages,
        SUM(ri.surface_m2) as surface
      FROM requests r
      LEFT JOIN request_items ri ON r.id = ri.request_id
      WHERE r.status = 'completed' AND r.device_used IS NOT NULL
      GROUP BY r.device_used
      ORDER BY count DESC
    `);
    
    // Timeline (30 derniers jours)
    const [timeline] = await connection.execute(`
      SELECT 
        DATE(r.created_at) as date,
        COUNT(DISTINCT r.id) as count,
        SUM(ri.surface_m2) as surface
      FROM requests r
      LEFT JOIN request_items ri ON r.id = ri.request_id
      WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(r.created_at)
      ORDER BY date ASC
    `);
    
    connection.release();
    
    return {
      global: globalStats[0] || {},
      departments: deptStats,
      users: userStats,
      devices: deviceStats,
      timeline: timeline
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      global: {},
      departments: [],
      users: [],
      devices: [],
      timeline: []
    };
  }
}

module.exports = {
  loadDatabase,
  createRequest,
  getRequests,
  completeRequest,
  getStats,
  login,
  signup,
  generateToken,
  verifyToken,
  addProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  pool // Export pool pour la migration
};
