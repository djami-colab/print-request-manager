const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

// Structure de la base de données en mémoire
let db = {
  requests: [],
  requestItems: [],
  nextRequestId: 1
};

// Charger les données depuis le fichier
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
      console.log('Base de données chargée depuis le fichier.');
    } else {
      // Initialiser avec des données de démonstration
      seedDemoData();
      saveDatabase();
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la base de données:', error);
    seedDemoData();
  }
}

// Sauvegarder les données
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
  }
}

// Données de démonstration
function seedDemoData() {
  if (db.requests.length > 0) return;
  
  const departments = ['Architecture', 'Structure', 'VRD', 'Essais', 'Équipements', 'DEC', 'Coordination', 'Finance', 'DAS'];
  const names = ['Jean Dupont', 'Marie Curie', 'Pierre Martin', 'Sophie Bernard', 'Thomas Dubois'];
  const projects = ['Tour Signal', 'Pont de l\'Avenir', 'Aménagement VRD'];
  const requestTypes = ['Appareil de tirage de plans', 'Appareil photocopieur', 'Appareil d\'impression'];
  const devices = ['Traceur T1600', 'Traceur T1300', 'Kyocera 7003i'];
  const operators = ['Karim', 'Hassan', 'Rachid'];
  const formats = ['A4', 'A3', 'A2', 'A1', 'A0'];
  const colors = ['Couleur', 'N&B'];
  const surfaceMap = { 'A4': 0.0625, 'A3': 0.125, 'A2': 0.25, 'A1': 0.5, 'A0': 1.0 };
  
  const now = new Date();
  
  for (let i = 1; i <= 10; i++) {
    const createdDate = new Date();
    createdDate.setDate(now.getDate() - (10 - i) * 2);
    
    const reqNum = `CIDI-${createdDate.getFullYear()}-${String(i).padStart(4, '0')}`;
    const isCompleted = Math.random() < 0.7;
    const compDate = isCompleted ? new Date(createdDate.getTime() + 3600 * 1000) : null;
    
    const request = {
      id: db.nextRequestId++,
      request_number: reqNum,
      requester_name: names[Math.floor(Math.random() * names.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      project: projects[Math.floor(Math.random() * projects.length)],
      request_type: requestTypes[Math.floor(Math.random() * requestTypes.length)],
      reason: Math.random() > 0.7 ? 'Documents requis pour validation externe' : null,
      device_used: isCompleted ? devices[Math.floor(Math.random() * devices.length)] : null,
      operator_name: isCompleted ? operators[Math.floor(Math.random() * operators.length)] : null,
      status: isCompleted ? 'completed' : 'pending',
      created_at: createdDate.toISOString(),
      completed_at: compDate ? compDate.toISOString() : null
    };
    
    db.requests.push(request);
    
    // Ajouter 1-3 items
    const itemCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 1; j <= itemCount; j++) {
      const fmt = formats[Math.floor(Math.random() * formats.length)];
      const pages = Math.floor(Math.random() * 10) + 1;
      const copies = Math.floor(Math.random() * 3) + 1;
      
      db.requestItems.push({
        id: db.requestItems.length + 1,
        request_id: request.id,
        document_name: `Document_${j}_${request.project.replace(/\s+/g, '_')}.pdf`,
        format: fmt,
        color_nb: colors[Math.floor(Math.random() * colors.length)],
        pages: pages,
        copies: copies,
        surface_m2: pages * copies * surfaceMap[fmt],
        total_pages: pages * copies
      });
    }
  }
}

// Créer une nouvelle demande
function createRequest(data) {
  const now = new Date();
  const year = now.getFullYear();
  const count = db.requests.filter(r => {
    const createdYear = new Date(r.created_at).getFullYear();
    return createdYear === year;
  }).length + 1;
  
  const request = {
    id: db.nextRequestId++,
    request_number: `CIDI-${year}-${String(count).padStart(4, '0')}`,
    requester_name: data.requester_name,
    department: data.department,
    project: data.project,
    request_type: data.request_type,
    reason: data.reason || null,
    device_used: null,
    operator_name: null,
    status: 'pending',
    created_at: now.toISOString(),
    completed_at: null
  };
  
  db.requests.push(request);
  
  // Ajouter les items
  const surfaceMap = { 'A4': 0.0625, 'A3': 0.125, 'A2': 0.25, 'A1': 0.5, 'A0': 1.0 };
  
  for (let item of data.items) {
    const surface = item.pages * item.copies * (surfaceMap[item.format] || 0.0625);
    
    db.requestItems.push({
      id: db.requestItems.length + 1,
      request_id: request.id,
      document_name: item.document_name,
      format: item.format,
      color_nb: item.color_nb,
      pages: item.pages,
      copies: item.copies,
      surface_m2: surface,
      total_pages: item.pages * item.copies
    });
  }
  
  saveDatabase();
  return request;
}

// Obtenir toutes les demandes avec filtres
function getRequests(filters = {}) {
  let requests = db.requests.map(req => {
    const items = db.requestItems.filter(item => item.request_id === req.id);
    return {
      ...req,
      total_items: items.length,
      sum_pages: items.reduce((sum, item) => sum + item.total_pages, 0),
      sum_surface: items.reduce((sum, item) => sum + item.surface_m2, 0),
      items: items
    };
  });
  
  // Appliquer les filtres
  if (filters.status) {
    requests = requests.filter(r => r.status === filters.status);
  }
  if (filters.department) {
    requests = requests.filter(r => r.department === filters.department);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    requests = requests.filter(r => 
      r.requester_name.toLowerCase().includes(search) ||
      r.project.toLowerCase().includes(search) ||
      r.request_number.toLowerCase().includes(search)
    );
  }
  
  return requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// Finaliser une demande
function completeRequest(requestId, deviceUsed, operatorName) {
  const request = db.requests.find(r => r.id === requestId);
  if (!request) return null;
  
  request.device_used = deviceUsed;
  request.operator_name = operatorName;
  request.status = 'completed';
  request.completed_at = new Date().toISOString();
  
  saveDatabase();
  return request;
}

// Obtenir les statistiques
function getStats() {
  const completedRequests = db.requests.filter(r => r.status === 'completed');
  
  const global = {
    total_requests: db.requests.length,
    pending_requests: db.requests.filter(r => r.status === 'pending').length,
    completed_requests: completedRequests.length,
    total_pages: db.requestItems.reduce((sum, item) => sum + item.total_pages, 0),
    total_surface: db.requestItems.reduce((sum, item) => sum + item.surface_m2, 0)
  };
  
  // Statistiques par département
  const departments = {};
  db.requests.forEach(req => {
    if (!departments[req.department]) {
      departments[req.department] = { department: req.department, request_count: 0, pages: 0, surface: 0 };
    }
    departments[req.department].request_count++;
    const items = db.requestItems.filter(item => item.request_id === req.id);
    departments[req.department].pages += items.reduce((sum, item) => sum + item.total_pages, 0);
    departments[req.department].surface += items.reduce((sum, item) => sum + item.surface_m2, 0);
  });
  
  // Statistiques par utilisateur (Top 10)
  const userStats = {};
  db.requests.forEach(req => {
    const key = `${req.requester_name}_${req.department}`;
    if (!userStats[key]) {
      userStats[key] = { requester_name: req.requester_name, department: req.department, request_count: 0, pages: 0, surface: 0 };
    }
    userStats[key].request_count++;
    const items = db.requestItems.filter(item => item.request_id === req.id);
    userStats[key].pages += items.reduce((sum, item) => sum + item.total_pages, 0);
    userStats[key].surface += items.reduce((sum, item) => sum + item.surface_m2, 0);
  });
  
  const users = Object.values(userStats).sort((a, b) => b.surface - a.surface).slice(0, 10);
  
  // Statistiques par appareil
  const devices = {};
  completedRequests.forEach(req => {
    if (req.device_used) {
      if (!devices[req.device_used]) {
        devices[req.device_used] = { device_used: req.device_used, count: 0, pages: 0, surface: 0 };
      }
      devices[req.device_used].count++;
      const items = db.requestItems.filter(item => item.request_id === req.id);
      devices[req.device_used].pages += items.reduce((sum, item) => sum + item.total_pages, 0);
      devices[req.device_used].surface += items.reduce((sum, item) => sum + item.surface_m2, 0);
    }
  });
  
  // Timeline
  const timeline = {};
  db.requests.forEach(req => {
    const date = new Date(req.created_at).toISOString().split('T')[0];
    if (!timeline[date]) {
      timeline[date] = { date: date, count: 0, surface: 0 };
    }
    timeline[date].count++;
    const items = db.requestItems.filter(item => item.request_id === req.id);
    timeline[date].surface += items.reduce((sum, item) => sum + item.surface_m2, 0);
  });
  
  return {
    global,
    departments: Object.values(departments).sort((a, b) => b.surface - a.surface),
    users,
    devices: Object.values(devices).sort((a, b) => b.count - a.count),
    timeline: Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date)).slice(-30)
  };
}

module.exports = {
  loadDatabase,
  saveDatabase,
  createRequest,
  getRequests,
  completeRequest,
  getStats
};
