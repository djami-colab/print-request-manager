# Système d'Autocomplete des Projets

## Vue d'ensemble

Le champ "Projet lié à cette impression" a été transformé en un système de liste déroulante avec autocomplete intelligent. Les utilisateurs peuvent maintenant :

- Sélectionner un projet depuis une liste déroulante
- Taper pour chercher un projet par son nom
- Chercher par n'importe quelle partie du nom du projet
- Naviguer avec les touches clavier (flèches, Entrée, Échap)

## Fonctionnalités

### 1. Dropdown avec Autocomplete
- Le champ devient un input avec un dropdown
- Au clic ou au focus, affiche tous les projets disponibles
- À chaque lettre tapée, filtre les projets en temps réel

### 2. Recherche Flexible
- Recherche par n'importe quelle partie du nom du projet
- Exemple: "Pont" trouve "Construction Pont Oued Sebou"
- Exemple: "Sebou" trouve également le même projet

### 3. Navigation au Clavier
| Touche | Action |
|--------|--------|
| ↓ (Bas) | Sélectionner l'item suivant |
| ↑ (Haut) | Sélectionner l'item précédent |
| Entrée | Valider la sélection |
| Échap | Fermer le dropdown |

### 4. Affichage des Projets
Chaque item du dropdown affiche:
- **Nom du projet** (intitulé)
- **Unité** (ex: CIDI)

## Structure Technique

### Frontend (JavaScript)

#### Variables Globales
```javascript
let allProjects = [];        // Liste de tous les projets
let selectedProjectIndex = -1; // Index du projet sélectionné
```

#### Fonctions Principales

| Fonction | Description |
|----------|-------------|
| `loadProjects()` | Récupère les projets depuis l'API |
| `handleProjectInput(event)` | Gère la saisie de l'utilisateur |
| `filterProjects(searchText)` | Filtre les projets selon le texte |
| `showProjectDropdown(event)` | Affiche le dropdown |
| `hideProjectDropdown()` | Masque le dropdown |
| `selectProject(name, unite)` | Sélectionne un projet |
| `handleProjectKeydown(event)` | Gère la navigation au clavier |
| `updateProjectSelection()` | Met à jour la sélection visuelle |

### Backend (Node.js/Express)

#### API Endpoint
```
GET /api/projets/list
```

**Réponse :**
```json
[
  {
    "id": 1,
    "intitule": "Construction Pont Oued Sebou",
    "unite": "CIDI",
    "created_at": "2026-07-26T10:00:00.000Z"
  },
  ...
]
```

#### Méthode de Base de Données
```javascript
async function getProjects() {
  // Récupère tous les projets depuis MySQL
  // Triés par intitule (A-Z)
  return rows;
}
```

### Styles CSS

#### Classes Principales
```css
.autocomplete-container    /* Conteneur du champ */
.autocomplete-input        /* Input avec border et shadow */
.autocomplete-dropdown     /* Dropdown visible quand .open */
.autocomplete-item         /* Chaque item du dropdown */
.autocomplete-item.selected /* Item sélectionné */
```

#### Comportements
- Transition fluide au focus
- Shadow au survol
- Fond bleu clair sur sélection
- Scroll automatique au clavier

## Exemple d'Utilisation

### 1. L'utilisateur voit le formulaire
```html
<input class="autocomplete-input" placeholder="Tapez le nom du projet...">
```

### 2. Au clic ou focus → affiche le dropdown
```
- Pont Hassan II
  Unité: CIDI
- Construction Pont Oued Sebou
  Unité: CIDI
- Route Casablanca-Fez
  Unité: CIDI
```

### 3. Utilisateur tape "Sebou"
```
- Construction Pont Oued Sebou
  Unité: CIDI
```

### 4. Utilisateur appuie sur Entrée
```
Input: "Construction Pont Oued Sebou"
Dropdown: Fermé
```

## Intégration avec le Formulaire

Le champ projet est intégré au formulaire principal :

```javascript
// Dans submitPrintRequest()
const project = document.getElementById('project').value;
// La valeur du projet est maintenant celle sélectionnée du dropdown
```

## Base de Données

### Table `projets`
```sql
CREATE TABLE projets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  intitule VARCHAR(255) NOT NULL UNIQUE,
  unite VARCHAR(100) DEFAULT 'CIDI',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Initialisation

Les projets sont chargés automatiquement au démarrage de l'application :

```javascript
document.addEventListener('DOMContentLoaded', () => {
  // ...
  setTimeout(() => {
    loadProjects();  // ← Chargement automatique
    loadRequests();
  }, 100);
});
```

## Performance

- **Chargement** : Les projets sont chargés une seule fois au démarrage
- **Filtrage** : En temps réel, sans appels API à chaque lettre
- **Affichage** : Max 300px de hauteur, scrollable si trop de projets

## Prochaines Améliorations Possibles

1. Pagination du dropdown si > 50 projets
2. Cache des projets avec expiration
3. Ajout d'un champ caché pour l'ID du projet
4. Validation du projet sélectionné
5. Compteur de projets trouvés

## Dépannage

### Le dropdown n'affiche rien
- Vérifier que `/api/projets/list` retourne des données
- Vérifier la console pour les erreurs JavaScript
- S'assurer que la table `projets` contient des données

### La recherche ne fonctionne pas
- Vérifier l'orthographe
- Essayer avec une autre partie du nom
- Recharger la page pour actualiser la liste

### Keyboard navigation ne répond pas
- Vérifier que le dropdown est ouvert (classe `open`)
- S'assurer que le focus est sur l'input

---

**Dernière mise à jour**: 26 juillet 2026
**Version**: 1.0
