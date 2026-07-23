// Variables globales
let currentProfile = 'demandeur';
let currentTab = 'new';
let currentRequests = [];
let chartInstances = {};

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  renderLucideIcons();
  
  // Charger les données après initialisation
  setTimeout(() => {
    loadRequests();
    if (currentProfile === 'operateur') {
      loadStats();
    }
  }, 100);
});

function initializeApp() {
  console.log('[v0] App initialized');
  
  // Vérifier l'authentification
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    // Rediriger vers la page de connexion
    window.location.href = '/login.html';
    return;
  }
  
  try {
    const user = JSON.parse(userStr);
    currentProfile = user.profile;
    
    // Mettre à jour l'interface avec les infos utilisateur
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('user-avatar-initials').textContent = initials;
    document.getElementById('user-profile-title').textContent = 
      user.profile === 'operateur' ? 'Opérateur CIDI' : 'Demandeur CIDI';
    document.getElementById('user-profile-sub').textContent = 
      user.profile === 'operateur' ? 'Accès Opérateur' : 'Accès Standard';
    
    // Afficher/masquer les onglets selon le profil
    updateMenuVisibility();
    
    // Sélectionner le premier onglet visible
    if (currentProfile === 'demandeur') {
      switchTab('new');
    } else {
      switchTab('list');
    }
    
    // Ajouter une première ligne de document
    if (document.getElementById('document-rows-container').querySelectorAll('tr').length === 0) {
      addDocumentRow();
    }
  } catch (error) {
    console.error('[v0] Error parsing user:', error);
    logout();
  }
}

// Fonction pour mettre à jour la visibilité des menus selon le profil
function updateMenuVisibility() {
  const menuNew = document.getElementById('menu-new');
  const menuList = document.getElementById('menu-list');
  const menuStats = document.getElementById('menu-stats');
  
  if (!menuNew || !menuList || !menuStats) return;
  
  if (currentProfile === 'demandeur') {
    // Demandeur: voir seulement "Nouveau Bon"
    menuNew.style.display = 'flex';
    menuList.style.display = 'none';
    menuStats.style.display = 'none';
  } else if (currentProfile === 'operateur') {
    // Opérateur: voir "Suivi des Bons" et "Tableau de Bord"
    menuNew.style.display = 'none';
    menuList.style.display = 'flex';
    menuStats.style.display = 'flex';
  }
}

// Fonction de déconnexion
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// Changement d'onglet
function switchTab(tabName) {
  currentTab = tabName;
  
  // Masquer tous les onglets
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active-tab');
  });
  
  // Masquer les items de menu
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Afficher l'onglet sélectionné
  const activeTab = document.getElementById(`tab-${tabName}`);
  if (activeTab) {
    activeTab.classList.add('active-tab');
  }
  
  // Activer le bouton de menu
  const menuBtn = document.getElementById(`menu-${tabName}`);
  if (menuBtn) {
    menuBtn.classList.add('active');
  }
  
  // Mettre à jour le titre
  const titles = {
    'new': 'Créer une demande d\'impression',
    'list': 'Suivi des bons de demande',
    'stats': 'Tableau de bord et statistiques'
  };
  
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = titles[tabName];
  
  const pageSubtitle = document.getElementById('page-subtitle');
  if (pageSubtitle) {
    if (tabName === 'new') {
      pageSubtitle.textContent = 'Remplissez les détails pour générer votre bon de commande d\'impression.';
    } else if (tabName === 'list') {
      pageSubtitle.textContent = 'Consultez et gérez vos demandes d\'impression.';
    } else if (tabName === 'stats') {
      pageSubtitle.textContent = 'Visualisez les statistiques et la consommation d\'impression.';
    }
  }
  
  // Recharger les données si nécessaire
  if (tabName === 'list') {
    loadRequests();
  } else if (tabName === 'stats') {
    loadStats();
  }
}

// Soumettre une demande d'impression
async function submitPrintRequest(event) {
  event.preventDefault();
  
  const requesterName = document.getElementById('requester_name').value;
  const department = document.getElementById('department').value;
  const project = document.getElementById('project').value;
  const reason = document.getElementById('reason').value;
  
  // Récupérer les types de moyens (checkboxes)
  const requestTypeCheckboxes = document.querySelectorAll('input[name="request_type"]:checked');
  if (requestTypeCheckboxes.length === 0) {
    alert('Veuillez sélectionner au moins un type de moyen demandé.');
    return;
  }
  
  const requestTypes = Array.from(requestTypeCheckboxes).map(cb => cb.value);
  
  // Récupérer les imprimantes sélectionnées
  const printerCheckboxes = document.querySelectorAll('input[name="printer"]:checked');
  const printers = Array.from(printerCheckboxes).map(cb => cb.value);
  
  // Récupérer les items (documents)
  const items = [];
  const itemsContainer = document.getElementById('document-rows-container');
  
  if (!itemsContainer) {
    alert('Erreur: conteneur de documents non trouvé.');
    return;
  }
  
  const itemRows = itemsContainer.querySelectorAll('tr');
  
  if (itemRows.length === 0) {
    alert('Veuillez ajouter au moins un document.');
    return;
  }
  
  itemRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 6) return; // Passer les lignes incomplètes
    
    // Récupérer les valeurs de chaque cellule
    const documentName = cells[1].querySelector('input').value;
    const format = cells[2].querySelector('select').value;
    const colorNb = cells[3].querySelector('select').value;
    const pages = parseInt(cells[4].querySelector('input').value) || 1;
    const copies = parseInt(cells[5].querySelector('input').value) || 1;
    
    if (documentName && format && colorNb) {
      items.push({
        document_name: documentName,
        format: format,
        color_nb: colorNb,
        pages: pages,
        copies: copies
      });
    }
  });
  
  if (items.length === 0) {
    alert('Veuillez ajouter au moins un document avec les informations complètes.');
    return;
  }
  
  try {
    // Sauvegarder les données pour affichage du bon
    const bonData = {
      requester_name: requesterName,
      department: department,
      project: project,
      request_type: requestTypes,
      reason: reason,
      printers: printers,
      items: items
    };
    
    // Stocker dans sessionStorage pour la page du bon
    sessionStorage.setItem('bonData', JSON.stringify(bonData));
    
    // Envoyer au serveur
    const token = localStorage.getItem('token');
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        requester_name: requesterName,
        department: department,
        project: project,
        request_type: requestTypes.join(', '),
        reason: reason,
        items: items
      })
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la création de la demande');
    }
    
    const data = await response.json();
    
    // Ouvrir la page du bon dans un nouvel onglet/fenêtre
    window.open('/bon-impression.html', 'bon_impression', 'width=950,height=1200');
    
    // Réinitialiser le formulaire après un court délai
    setTimeout(() => {
      const form = document.getElementById('form-print-request');
      if (form) form.reset();
      
      const docContainer = document.getElementById('document-rows-container');
      if (docContainer) {
        docContainer.innerHTML = '';
        addDocumentRow();
      }
      
      loadRequests();
    }, 500);
  } catch (error) {
    console.error('[v0] Error submitting request:', error);
    alert('Erreur: ' + error.message);
  }
}

// Ajouter une ligne de document
function addDocumentRow() {
  const container = document.getElementById('document-rows-container');
  
  if (!container) {
    console.error('[v0] Document rows container not found');
    return;
  }
  
  const rowIndex = container.querySelectorAll('tr').length + 1;
  
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${rowIndex}</td>
    <td><input type="text" placeholder="Ex: Plan A3 Projet" required></td>
    <td>
      <select required>
        <option value="">Sélectionner...</option>
        <option value="A4">A4</option>
        <option value="A3">A3</option>
        <option value="A2">A2</option>
        <option value="A1">A1</option>
        <option value="A0">A0</option>
      </select>
    </td>
    <td>
      <select required>
        <option value="">Sélectionner...</option>
        <option value="N&B">N&B</option>
        <option value="Couleur">Couleur</option>
      </select>
    </td>
    <td><input type="number" min="1" value="1" required></td>
    <td><input type="number" min="1" value="1" required></td>
    <td><button type="button" class="btn btn-danger btn-sm" onclick="removeDocumentRow(this)">Supprimer</button></td>
  `;
  container.appendChild(row);
  renderLucideIcons();
}

// Supprimer une ligne de document
function removeDocumentRow(button) {
  const row = button.closest('tr');
  if (!row) return;
  
  row.remove();
  
  // Renuméroter les lignes
  const container = document.getElementById('document-rows-container');
  if (!container) return;
  
  const rows = container.querySelectorAll('tr');
  rows.forEach((row, idx) => {
    const firstCell = row.querySelector('td');
    if (firstCell) firstCell.textContent = idx + 1;
  });
}

// Fonction alias pour les filtres
async function fetchRequests() {
  loadRequests();
}

// Charger les demandes
async function loadRequests() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/requests', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Erreur lors du chargement');
    
    currentRequests = await response.json();
    
    // Compter les demandes en attente
    const pendingCount = currentRequests.filter(r => r.status === 'pending').length;
    const badge = document.getElementById('badge-pending');
    if (badge) {
      if (pendingCount > 0) {
        badge.textContent = pendingCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
    
    renderRequests();
  } catch (error) {
    console.error('[v0] Error loading requests:', error);
  }
}

// Afficher les demandes
function renderRequests() {
  const tbody = document.getElementById('requests-list-container');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  currentRequests.forEach(req => {
    const row = document.createElement('tr');
    const statusText = req.status === 'completed' ? 'Traité' : 'En attente';
    const statusClass = req.status === 'completed' ? 'status-completed' : 'status-pending';
    
    row.innerHTML = `
      <td>${req.request_number}</td>
      <td>${new Date(req.created_at).toLocaleDateString('fr-FR')}</td>
      <td>${req.requester_name}</td>
      <td>${req.department}</td>
      <td>${req.project}</td>
      <td>${req.request_type}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>${req.total_items || 0}</td>
      <td>${req.sum_pages || 0}</td>
      <td>${(req.sum_surface || 0).toFixed(2)}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="viewRequestDetails(${req.id})">Détails</button>
        ${currentProfile === 'operateur' && req.status === 'pending' ? `
          <button class="btn btn-primary btn-sm" onclick="completeRequest(${req.id})">Finaliser</button>
        ` : ''}
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Voir les détails d'une demande
async function viewRequestDetails(requestId) {
  const request = currentRequests.find(r => r.id === requestId);
  if (!request) return;
  
  const modal = document.getElementById('modal-operator');
  if (modal) {
    // Remplir les informations récapitulatives
    document.getElementById('modal-req-id').value = request.id;
    document.getElementById('modal-summary-num').textContent = request.request_number;
    document.getElementById('modal-summary-name').textContent = request.requester_name;
    document.getElementById('modal-summary-dept').textContent = request.department;
    document.getElementById('modal-summary-project').textContent = request.project;
    document.getElementById('modal-summary-type').textContent = request.request_type;
    
    // Remplir le tableau des items
    let itemsHTML = '';
    if (request.items) {
      itemsHTML = request.items.map(item => `
        <tr>
          <td>${item.document_name}</td>
          <td>${item.format}</td>
          <td>${item.color_nb}</td>
          <td>${item.pages}</td>
          <td>${item.copies}</td>
        </tr>
      `).join('');
    }
    const printItemsBody = document.getElementById('print-items-body');
    if (printItemsBody) {
      printItemsBody.innerHTML = itemsHTML;
    }
    
    modal.style.display = 'flex';
  }
}

// Finaliser une demande
async function completeRequest(requestId) {
  const deviceUsed = prompt('Appareil utilisé:');
  const operatorName = prompt('Nom de l\'opérateur:');
  
  if (!deviceUsed || !operatorName) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/requests/${requestId}/complete`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ device_used: deviceUsed, operator_name: operatorName })
    });
    
    if (!response.ok) throw new Error('Erreur lors de la finalisation');
    
    alert('Demande finalisée avec succès!');
    loadRequests();
  } catch (error) {
    console.error('[v0] Error completing request:', error);
    alert('Erreur: ' + error.message);
  }
}

// Exporter une demande
function exportRequest(requestId) {
  window.location.href = `/api/export?search=${currentRequests.find(r => r.id === requestId)?.request_number}`;
}

// Charger les statistiques
async function loadStats() {
  try {
    // Vérifier que le tab statistiques est visible
    const statsTab = document.getElementById('tab-stats');
    if (!statsTab || !statsTab.classList.contains('active-tab')) {
      return; // Pas besoin de charger si pas visible
    }
    
    const token = localStorage.getItem('token');
    const response = await fetch('/api/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Erreur lors du chargement des stats');
    
    const data = await response.json();
    if (data && data.global) {
      renderStats(data);
    }
  } catch (error) {
    console.error('[v0] Error loading stats:', error);
  }
}

// Afficher les statistiques
function renderStats(data) {
  // Cartes KPI
  const kpiTotal = document.getElementById('kpi-total-requests');
  const kpiPending = document.getElementById('kpi-pending-requests');
  const kpiPages = document.getElementById('kpi-total-pages');
  const kpiSurface = document.getElementById('kpi-total-surface');
  
  if (kpiTotal) kpiTotal.textContent = data.global.total_requests;
  if (kpiPending) kpiPending.textContent = data.global.pending_requests;
  if (kpiPages) kpiPages.textContent = data.global.total_pages;
  if (kpiSurface) kpiSurface.textContent = (data.global.total_surface || 0).toFixed(2) + ' m²';
  
  // Graphiques
  if (document.getElementById('chart-dept-surface')) {
    renderDepartmentChart(data.departments);
  }
  if (document.getElementById('chart-dept-requests')) {
    renderTopUsersChart(data.users);
  }
  if (document.getElementById('chart-devices')) {
    renderDeviceChart(data.devices);
  }
  if (document.getElementById('chart-timeline')) {
    renderTimelineChart(data.timeline);
  }
}

// Graphique par département (surface)
function renderDepartmentChart(departments) {
  const ctx = document.getElementById('chart-dept-surface');
  if (!ctx) return;
  
  if (chartInstances.deptSurface) {
    chartInstances.deptSurface.destroy();
  }
  
  chartInstances.deptSurface = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: departments.map(d => d.department),
      datasets: [{
        label: 'Surface (m²)',
        data: departments.map(d => d.surface),
        backgroundColor: '#3b82f6'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });
}

// Graphique des top utilisateurs
function renderTopUsersChart(users) {
  const ctx = document.getElementById('chart-dept-requests');
  if (!ctx) return;
  
  if (chartInstances.topUsers) {
    chartInstances.topUsers.destroy();
  }
  
  chartInstances.topUsers = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: users.map(u => u.requester_name),
      datasets: [{
        data: users.map(u => u.surface),
        backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// Graphique des appareils
function renderDeviceChart(devices) {
  const ctx = document.getElementById('chart-devices');
  if (!ctx) return;
  
  if (chartInstances.devices) {
    chartInstances.devices.destroy();
  }
  
  chartInstances.devices = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: devices.map(d => d.device_used || 'Non spécifié'),
      datasets: [{
        data: devices.map(d => d.count),
        backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// Graphique de la timeline
function renderTimelineChart(timeline) {
  const ctx = document.getElementById('chart-timeline');
  if (!ctx) return;
  
  if (chartInstances.timeline) {
    chartInstances.timeline.destroy();
  }
  
  chartInstances.timeline = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeline.map(t => new Date(t.date).toLocaleDateString('fr-FR')),
      datasets: [{
        label: 'Surface (m²)',
        data: timeline.map(t => t.surface),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } }
    }
  });
}

// Fermer la modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

// Fermer modal en cliquant dehors
window.onclick = (event) => {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
};

// Rendu des icônes Lucide
function renderLucideIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}
