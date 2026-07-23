const express = require('express');
const cors = require('cors');
const path = require('path');
const ExcelJS = require('exceljs');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Facteurs de surface pour chaque format (en m²)
const FORMAT_SURFACES = {
  'A4': 0.0625,
  'A3': 0.125,
  'A2': 0.25,
  'A1': 0.5,
  'A0': 1.0
};

// Initialisation
function initDB() {
  try {
    db.loadDatabase();
    console.log('Base de données initialisée (JSON file storage).');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation :', error.message);
  }
}

// API: Recupere toutes les demandes avec leurs documents
app.get('/api/requests', async (req, res) => {
  try {
    const { status, department, search } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (department) filters.department = department;
    if (search) filters.search = search;
    
    const requests = db.getRequests(filters);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Creer un bon de demande
app.post('/api/requests', async (req, res) => {
  try {
    const { requester_name, department, project, request_type, reason, items } = req.body;
    
    if (!requester_name || !department || !project || !request_type || !items || items.length === 0) {
      return res.status(400).json({ error: 'Champs obligatoires manquants.' });
    }
    
    const request = db.createRequest({ requester_name, department, project, request_type, reason, items });
    res.status(201).json({ success: true, requestId: request.id, request_number: request.request_number });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    
    const request = db.completeRequest(parseInt(id), device_used, operator_name);
    if (!request) {
      return res.status(404).json({ error: 'Demande introuvable.' });
    }
    
    res.json({ success: true, message: 'Demande complétée avec succès.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Obtenir des statistiques pour le tableau de bord
app.get('/api/stats', async (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Export Excel avec ExcelJS (haute qualite, formate)
app.get('/api/export', async (req, res) => {
  try {
    const { status, department, search } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (department) filters.department = department;
    if (search) filters.search = search;
    
    const requests = db.getRequests(filters);
    
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
    sheet.addRow(['Recherche:', search || 'Aucune', 'Généré le:', new Date().toLocaleString('fr-FR')]);
    
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
