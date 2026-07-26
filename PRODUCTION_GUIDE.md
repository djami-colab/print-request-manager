# Guide de Déploiement en Production

## 📋 Prérequis

- Node.js v16+ 
- MySQL 5.7+
- Un serveur Linux/Windows/Mac pour exécuter l'application

## 🚀 Installation et Configuration

### 1. Cloner le projet et installer les dépendances

```bash
cd /path/to/print-request-manager
npm install
```

### 2. Créer la base de données

```sql
CREATE DATABASE print_request_db;
USE print_request_db;

-- Exécuter le script de création des tables
-- (Utilisez le fichier database.sql)
```

**Via MySQL CLI:**
```bash
mysql -u root -p print_request_db < database.sql
```

**Via Migration Node.js:**
```bash
node migrate.js
```

### 3. Configurer les variables d'environnement

Créer un fichier `.env` à la racine du projet:

```bash
cp .env.example .env
```

Éditer `.env` avec vos paramètres:

```env
# Configuration serveur
PORT=3000
NODE_ENV=production

# Configuration MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_securise
DB_NAME=print_request_db
DB_PORT=3306

# JWT Secret (générer une clé sécurisée)
JWT_SECRET=generez-une-clé-très-longue-et-aléatoire
```

**Générer un JWT_SECRET sécurisé:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Démarrer le serveur

**Mode développement:**
```bash
npm start
```

**Mode production avec PM2 (recommandé):**
```bash
npm install -g pm2

# Lancer l'application
pm2 start server.js --name "print-manager"

# Voir les logs
pm2 logs print-manager

# Redémarrer au démarrage du système
pm2 startup
pm2 save
```

## 🌐 Accès à l'application

Une fois le serveur démarré, accédez à:

```
http://localhost:3000
```

Vous serez redirigé vers la landing page, puis vous pourrez:
- Cliquer sur **"Accéder au Portail"**
- Remplir le formulaire
- Générer et imprimer votre bon

## 📁 Structure des fichiers générés

Les bons imprimés sont stockés dans:
```
bons/
  ├── BON-20260126-120530-MohamedAlami.pdf    (le bon PDF)
  └── BON-20260126-120530-MohamedAlami.json   (métadonnées)
```

## 🔐 Sécurité en Production

1. **Changez JWT_SECRET** - Utilisez une clé très longue et aléatoire
2. **Sécurisez la BD** - Utilisez un mot de passe fort et un utilisateur MySQL limité
3. **HTTPS** - Configurez SSL/TLS avec un reverse proxy (Nginx/Apache)
4. **Firewall** - Limitez l'accès aux ports 3000 et 3306 de votre réseau

## 🔄 Mise à jour

Pour appliquer les migrations de base de données:

```bash
# Nouvelle colonne ajoutée à la table 'projets'
npm run migration:run
```

Ou exécuter manuellement dans MySQL:
```sql
ALTER TABLE projets ADD COLUMN annee INT DEFAULT NULL AFTER unite;
CREATE INDEX idx_annee ON projets(annee);
```

## 📊 Fonctionnalités en Production

### Pour les utilisateurs (Portail public - `/portail`)
- ✅ Remplir un formulaire de demande d'impression
- ✅ Générer un bon d'impression au format PDF
- ✅ Imprimer directement ou télécharger le PDF
- ✅ Aucune authentification requise

### Base de données
- Stockage automatique des métadonnées des demandes
- Sauvegarde des PDFs dans le dossier `bons/`
- Historique complet des demandes

## 🛠️ Dépannage

### Le serveur ne démarre pas
```bash
# Vérifier si le port 3000 est disponible
lsof -i :3000

# Changer le port dans .env
PORT=8080
```

### Erreur de connexion MySQL
```bash
# Vérifier que MySQL est en cours d'exécution
mysql -u root -p -e "SELECT 1"

# Vérifier les paramètres dans .env
```

### Les projets n'apparaissent pas
```bash
# Vérifier que la table 'projets' a des données
mysql -u root -p print_request_db -e "SELECT * FROM projets;"

# Insérer des projets de test si nécessaire
```

## 📈 Optimisations possibles

- Ajouter un cache (Redis) pour la liste des projets
- Implémenter une authentification pour l'admin
- Ajouter des statistiques en temps réel
- Mettre en place un système de notification (email)

## 📞 Support

Pour toute question ou problème, consultez:
- Les logs du serveur: `pm2 logs print-manager`
- La structure de la base de données: `schema.sql`
- Les fichiers de configuration: `.env`

---

**Déployé avec succès!** Votre portail d'impression est maintenant prêt pour la production.
