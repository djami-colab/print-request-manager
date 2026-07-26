# 🗄️ Guide d'Installation - Migration vers MySQL

## Prérequis

- **Node.js** (v14+)
- **MySQL Server** (v5.7+)
- **npm** 

---

## 📋 Étapes d'Installation

### 1️⃣ **Installer MySQL Server sur Windows**

#### Option A : Télécharger depuis MySQL.com
- Aller sur : https://dev.mysql.com/downloads/mysql/
- Télécharger la version **MySQL Installer** pour Windows
- Lancer l'installateur et suivre les étapes
- Mémoriser les credentials (utilisateur: `root`, mot de passe que tu définis)

#### Option B : Utiliser XAMPP/WAMP (Plus simple)
- Télécharger **XAMPP** : https://www.apachefriends.org/
- Installer et lancer Apache + MySQL

---

### 2️⃣ **Vérifier la Connection MySQL**

Ouvrir PowerShell et tester la connexion :

```bash
# Tester la connexion
mysql -h localhost -u root -p

# Si succès, tu verras : mysql>
# Taper : exit
```

---

### 3️⃣ **Préparer le Projet**

1. **Cloner/Extraire le projet** :
   ```bash
   cd C:\PrintRequestApp
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

   ✅ mysql2 est déjà dans package.json

---

### 4️⃣ **Configurer les Variables d'Environnement**

Modifier le fichier `.env` :

```env
# Configuration MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ton_mot_de_passe_mysql
DB_NAME=print_request_db

PORT=3000
NODE_ENV=production
```

⚠️ **Important** : Remplacer `ton_mot_de_passe_mysql` par le mot de passe que tu as défini lors de l'installation de MySQL.

---

### 5️⃣ **Créer la Base de Données et les Tables**

#### Option A : Via MySQL CLI (Recommandé)

```bash
# Ouvrir MySQL
mysql -h localhost -u root -p

# À l'invite MySQL, taper :
SOURCE C:\PrintRequestApp\database.sql;

# Vérifier que tout s'est bien passé :
USE print_request_db;
SHOW TABLES;

# Résultat attendu :
# +-----------------------+
# | Tables_in_print_request_db |
# +-----------------------+
# | projets               |
# | request_items         |
# | requests              |
# | users                 |
# +-----------------------+

# Quitter
EXIT;
```

#### Option B : Via MySQL Workbench (Interface graphique)

1. Ouvrir MySQL Workbench
2. Créer une connexion vers `localhost:3306`
3. Ouvrir le fichier `database.sql`
4. Cliquer sur ▶️ (Execute)

---

### 6️⃣ **Migrer les Données (optionnel)**

Si tu veux importer les anciennes données depuis `data.json` :

```bash
cd C:\PrintRequestApp
node migrate.js
```

**Résultat attendu** :
```
🔄 Démarrage de la migration...
✅ Connexion MySQL établie
📂 Fichier data.json chargé
   - 3 utilisateurs
   - 15 demandes
   - 24 articles
👥 Migration des utilisateurs...
✅ 3 utilisateurs migrés
🏗️ Migration des projets...
✅ 5 projets migrés
📋 Migration des demandes...
✅ 15 demandes migrées
📄 Migration des articles...
✅ 24 articles migrés
✅ 🎉 Migration terminée avec succès!
```

---

### 7️⃣ **Tester Localement**

```bash
# Lancer le serveur
npm start

# Résultat attendu :
# Serveur lancé sur http://localhost:3000
# Connexion MySQL réussie
# Base de données initialisée (MySQL)
```

Accéder à : `http://localhost:3000`

---

### 8️⃣ **Créer un Utilisateur Test (facultatif)**

```bash
# Ouvrir MySQL
mysql -h localhost -u root -p print_request_db

# Ajouter un utilisateur test
INSERT INTO users (name, email, password, profile) VALUES 
('Test User', 'test@example.com', 'password123', 'demandeur');

# Quitter
EXIT;
```

---

## 🚀 **Déploiement sur Serveur Windows (Production)**

### Étape 1 : Préparer le Serveur

1. Installer MySQL Server sur le serveur Windows
2. Créer la base de données : `mysql -u root -p < database.sql`
3. Copier tous les fichiers du projet sur le serveur

### Étape 2 : Configurer le .env pour Production

```env
DB_HOST=<IP_OU_NOM_SERVEUR>
DB_USER=root
DB_PASSWORD=<mot_de_passe_secure>
DB_NAME=print_request_db

PORT=3000
NODE_ENV=production
```

### Étape 3 : Lancer le Serveur avec PM2 (en arrière-plan)

```bash
npm install -g pm2

cd C:\PrintRequestApp

npm install

# Démarrer l'app
pm2 start server.js --name "PrintApp"

# Sauvegarder la configuration
pm2 save

# Lancer au démarrage
pm2 startup

# Afficher les logs
pm2 logs PrintApp
```

### Étape 4 : Configurer le Firewall

```bash
# Ouvrir PowerShell en tant qu'admin
New-NetFirewallRule -DisplayName "PrintApp Port 3000" `
  -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000
```

### Étape 5 : Accéder depuis une autre machine

```
http://<IP_SERVEUR>:3000
```

---

## 📊 **Vérifier l'État de la Base de Données**

```bash
# Ouvrir MySQL
mysql -h localhost -u root -p print_request_db

# Voir les utilisateurs
SELECT * FROM users;

# Voir les projets
SELECT * FROM projets;

# Voir les demandes
SELECT * FROM requests;

# Voir les articles
SELECT * FROM request_items;

# Statistiques
SELECT COUNT(*) as total_requests FROM requests;
SELECT COUNT(*) as total_items FROM request_items;
```

---

## 🔧 **Troubleshooting**

| Erreur | Solution |
|--------|----------|
| `Error: connect ECONNREFUSED 127.0.0.1:3306` | MySQL n'est pas lancé. Lancer le service MySQL |
| `ER_ACCESS_DENIED_FOR_USER` | Vérifier le mot de passe dans `.env` |
| `ER_BAD_DB_ERROR: Unknown database` | Exécuter `database.sql` pour créer la DB |
| `ENOENT: no such file or directory 'data.json'` | Normal après migration, data.json n'est plus utilisé |

---

## ✅ **Checklist Finale**

- [ ] MySQL Server installé et lancé
- [ ] `database.sql` exécuté
- [ ] `.env` configuré avec les bonnes credentials
- [ ] `npm install` complété
- [ ] `npm start` fonctionne
- [ ] Accès à `http://localhost:3000` OK
- [ ] (Optionnel) Données migrées via `node migrate.js`
- [ ] (Production) PM2 configuré

---

## 📞 Support

Si tu rencontres des problèmes :

1. Vérifier les logs : `pm2 logs PrintApp`
2. Vérifier la connexion MySQL
3. Vérifier le `.env`
4. Vérifier le port 3000 n'est pas utilisé : `netstat -ano | findstr :3000`

---

**Bienvenue dans la version MySQL! 🎉**
