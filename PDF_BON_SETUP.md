# Configuration PDF - Sauvegarde des Bons de Demande

## Vue d'ensemble

Le système est configuré pour **générer et sauvegarder automatiquement les bons de demande en PDF** dans le dossier `/bons` du projet lorsqu'un formulaire est soumis.

## Flux de sauvegarde PDF

### 1. **Soumission du formulaire** (Client - app.js)
Quand un utilisateur remplit et soumet un bon via le formulaire:
- Les données sont collectées (demandeur, département, projet, documents, etc.)
- Un appel à `submitPrintRequest()` est effectué
- Les données sont stockées dans `sessionStorage` pour affichage du bon
- La fonction `generateAndSaveBonPDF()` est appelée après 1 seconde

### 2. **Génération PDF** (Client - app.js)
La fonction `generateAndSaveBonPDF()`:
- Utilise la bibliothèque **html2pdf.js** (CDN)
- Génère du HTML formaté via `generateBonHTML()`
- Crée un élément DOM temporaire avec le HTML
- Convertit le DOM en PDF avec html2pdf
- Convertit le PDF en base64

### 3. **Envoi au serveur** (Client → Serveur)
- Un appel POST est envoyé à `/api/bons/save` avec:
  - `pdfBase64`: le PDF en base64
  - `requester_name`: nom du demandeur
  - `department`: département
  - `project`: projet
  - `operator_name`: nom de l'opérateur
  - `devices`: appareils utilisés
  - `items`: documents imprimés

### 4. **Sauvegarde sur disque** (Serveur - server.js)
L'endpoint `/api/bons/save`:
- Crée un nom de fichier unique: `BON-{DATE}-{HEURE}-{NOM}.pdf`
- Exemple: `BON-20260726-024530-MohamedChiraz.pdf`
- Convertit le base64 en Buffer
- **Sauvegarde le PDF** dans `/bons/` dossier
- Crée un fichier JSON de métadonnées `.json` avec les infos du bon
- Retourne la confirmation au client

## Structure des fichiers sauvegardés

```
/bons/
├── BON-20260726-024530-MohamedChiraz.pdf
├── BON-20260726-024530-MohamedChiraz.json
├── BON-20260726-025000-AliDupont.pdf
├── BON-20260726-025000-AliDupont.json
└── README.md
```

## Format du fichier de métadonnées JSON

Chaque PDF a un fichier `.json` correspondant contenant:

```json
{
  "bon_id": "BON-20260726-024530-MohamedChiraz",
  "timestamp": "2026-07-26T02:45:30.000Z",
  "requester_name": "Mohamed Chiraz",
  "department": "CIDI",
  "project": "Projet A",
  "operator_name": "Ali Dupont",
  "devices": ["Traceur T1600"],
  "items_count": 3
}
```

## Bibliothèques utilisées

### Frontend
- **html2pdf.js** v0.10.1 (CDN)
  - URL: `https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js`
  - Génère des PDF à partir de HTML/DOM
  - Utilisé sur les pages: `index.html`, `bon-public.html`

### Backend
- **fs (Node.js)** - Système de fichiers
- **path (Node.js)** - Gestion des chemins

## API Endpoint

### POST `/api/bons/save`

**Paramètres:**
```json
{
  "pdfBase64": "JVBERi0xLjQKJeLj... (base64 encodé)",
  "requester_name": "Mohamed Chiraz",
  "department": "CIDI",
  "project": "Projet A",
  "operator_name": "Ali Dupont",
  "devices": ["Traceur T1600", "Kyocera 7003i"],
  "items": [
    {
      "document_name": "Plan A3",
      "format": "A3",
      "color_nb": "N&B",
      "pages": 1,
      "copies": 2
    }
  ]
}
```

**Réponse de succès (200):**
```json
{
  "success": true,
  "bon_id": "BON-20260726-024530-MohamedChiraz",
  "filename": "BON-20260726-024530-MohamedChiraz.pdf",
  "message": "Bon sauvegardé avec succès"
}
```

**Réponse d'erreur (400/500):**
```json
{
  "error": "Description de l'erreur"
}
```

## Processus d'utilisation

1. **Remplir le formulaire** dans l'interface web
   - Nom du demandeur
   - Département
   - Projet
   - Type de moyen demandé
   - Documents (nom, format, couleur, pages, copies)
   - Appareils utilisés
   - Nom de l'opérateur

2. **Cliquer sur "Soumettre"**
   - Le formulaire est validé
   - Le bon s'affiche dans une nouvelle fenêtre
   - Le PDF est généré et sauvegardé automatiquement

3. **Le PDF est sauvegardé dans `/bons/`**
   - Fichier PDF avec les données du bon
   - Fichier JSON avec les métadonnées

## Dossiers requis

Assurez-vous que le dossier `/bons/` existe:

```bash
# Créer le dossier s'il n'existe pas
mkdir -p /bons
```

## Dépannage

### Le PDF n'est pas sauvegardé

1. **Vérifier les logs du serveur**
   ```bash
   npm start
   # Chercher les messages: "Erreur lors de la sauvegarde du bon:"
   ```

2. **Vérifier les permissions du dossier `/bons/`**
   ```bash
   ls -la bons/
   # Doit être accessible en écriture
   ```

3. **Vérifier la requête réseau**
   - Ouvrir DevTools (F12)
   - Onglet "Network"
   - Chercher la requête POST `/api/bons/save`
   - Vérifier le statut et la réponse

### Le PDF est corrompu ou vide

1. **Vérifier que html2pdf est chargé**
   - DevTools → Console
   - Taper: `typeof html2pdf`
   - Doit retourner: `"object"`

2. **Vérifier que le HTML du bon est généré**
   - Chercher `generateBonHTML()` dans app.js
   - S'assurer que toutes les données sont présentes

### Erreur: "Cannot read property 'split' of undefined"

- html2pdf.js n'est pas chargé
- Vérifier la connexion CDN
- Alternative: Installer localement via npm

## Maintenance

### Nettoyer les anciens bons

```bash
# Supprimer les bons plus vieux que 30 jours
find bons/ -name "*.pdf" -type f -mtime +30 -delete
find bons/ -name "*.json" -type f -mtime +30 -delete
```

### Archiver les bons

```bash
# Créer une archive ZIP des bons
zip -r bons_archive_$(date +%Y%m%d).zip bons/
```

## Configuration avancée

### Modifier le format du nom de fichier

Éditer `server.js`, ligne ~152:
```javascript
const filename = `BON-${dateStr}-${timeStr}-${sanitizedName}.pdf`;
```

### Modifier le dossier de destination

Éditer `server.js`, ligne ~157:
```javascript
const filepath = path.join(__dirname, 'bons', filename);
// Changer 'bons' par votre dossier
```

### Ajouter compression PDF

Installer un package: `npm install pdfkit`
Et modifier l'endpoint `/api/bons/save`

## Support

Pour plus d'informations ou problèmes:
- Consulter les logs du serveur
- Vérifier la console du navigateur (F12)
- Examiner les fichiers JSON de métadonnées
