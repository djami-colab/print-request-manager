# ✅ Migration MySQL - TERMINÉE

## 📊 Ce qui a été fait

Votre application a été **completement migrée de JSON vers MySQL**. Voici les changements :

### ✨ Nouveaux Fichiers Créés

1. **`database.sql`** - Schéma complet de la base de données MySQL
   - Table `users` - Gestion des utilisateurs
   - Table `projets` - **NEW** Gestion des projets (id, intitulé, unité)
   - Table `requests` - Demandes d'impression
   - Table `request_items` - Articles des demandes

2. **`db.js`** - Remplacé complètement (plus de JSON, 100% MySQL)
   - Connexion MySQL via `mysql2/promise`
   - Toutes les fonctions sont maintenant `async/await`
   - Support complet des CRUD projets

3. **`migrate.js`** - Script de migration automatique
   - Importe automatiquement `data.json` vers MySQL
   - Préserve tous les IDs et données existantes

4. **`.env`** - Configuration des variables d'environnement
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - Facile à configurer pour le serveur Windows

5. **`INSTALLATION_MYSQL.md`** - Guide complet d'installation

### 🔄 Fichiers Modifiés

**`server.js`** - Adaptations pour async/await
- Tous les appels à `db.*()` sont maintenant `await`
- Les routes sont prêtes pour la nature asynchrone de MySQL
- Le serveur écoute sur `0.0.0.0` (accessible depuis réseau)

---

## 🚀 GUIDE DE MISE EN PLACE (WINDOWS OFFLINE)

### ÉTAPE 1 : Installer MySQL sur le Serveur Windows

```bash
# Option A : Installer via MySQL.com
https://dev.mysql.com/downloads/mysql/

# Option B : Utiliser XAMPP (plus simple)
https://www.apachefriends.org/
```

### ÉTAPE 2 : Copier les fichiers sur C:\PrintRequestApp

```
C:\PrintRequestApp\
├── server.js (✅ modifié)
├── db.js (✅ nouveau - MySQL)
├── migrate.js (✅ nouveau)
├── database.sql (✅ nouveau)
├── .env (✅ nouveau)
├── package.json
├── public/
└── ...
```

### ÉTAPE 3 : Créer la base de données

Ouvrir PowerShell et exécuter :

```bash
# Ouvrir MySQL
mysql -h localhost -u root -p

# À l'invite MySQL :
SOURCE C:\PrintRequestApp\database.sql;

# Vérifier :
USE print_request_db;
SHOW TABLES;

# Quitter
EXIT;
```

### ÉTAPE 4 : Configurer le .env

Modifier `C:\PrintRequestApp\.env` :

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<ton_mot_de_passe_mysql>
DB_NAME=print_request_db
PORT=3000
NODE_ENV=production
```

### ÉTAPE 5 : Installer les dépendances

```bash
cd C:\PrintRequestApp
npm install
```

### ÉTAPE 6 : Migrer les données (optionnel)

Si tu veux importer les anciennes données :

```bash
cd C:\PrintRequestApp
node migrate.js
```

**Résultat attendu** :
```
✅ Connexion MySQL établie
📂 Fichier data.json chargé
   - 3 utilisateurs
   - 15 demandes
   - 24 articles
✅ 3 utilisateurs migrés
✅ 5 projets migrés
✅ 15 demandes migrées
✅ 24 articles migrés
✅ 🎉 Migration terminée!
```

### ÉTAPE 7 : Tester localement

```bash
npm start

# Résultat attendu :
# Serveur démarré sur http://0.0.0.0:3000
# Accédez via : http://localhost:3000
# Connexion MySQL réussie
```

Accédez à `http://localhost:3000` dans un navigateur ✅

### ÉTAPE 8 : Lancer l'app en arrière-plan avec PM2

```bash
npm install -g pm2

# Démarrer l'app
pm2 start server.js --name "PrintApp"

# Sauvegarder
pm2 save

# Lancer au démarrage
pm2 startup

# Voir les logs
pm2 logs PrintApp
```

### ÉTAPE 9 : Configurer le Firewall Windows

```bash
# PowerShell en tant qu'admin
New-NetFirewallRule -DisplayName "PrintApp Port 3000" `
  -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000
```

### ÉTAPE 10 : Accédez depuis une autre machine du réseau

```
http://<IP_SERVEUR>:3000
```

Trouvez l'IP du serveur :
```bash
ipconfig
# Cherchez "IPv4 Address" (ex: 192.168.1.100)
```

---

## 📋 Checklist Finale

- [ ] MySQL installé et lancé sur le serveur
- [ ] `database.sql` exécuté (tables créées)
- [ ] `.env` configuré avec le bon mot de passe MySQL
- [ ] `npm install` complété
- [ ] (Optionnel) `node migrate.js` pour importer les anciennes données
- [ ] `npm start` fonctionne sans erreur
- [ ] Accès à `http://localhost:3000` OK
- [ ] PM2 configuré pour lancer au démarrage
- [ ] Firewall Windows autorise le port 3000
- [ ] Accès depuis un autre PC : `http://<IP>:3000` OK

---

## 🎯 Avantages MySQL vs JSON

| Aspect | JSON | MySQL |
|--------|------|-------|
| **Persistance** | Fichier volatile | Base de données robuste |
| **Multi-utilisateurs** | ⚠️ Conflits possibles | ✅ Gestion concurrent |
| **Accès réseau** | Fichier local | ✅ Accès à distance |
| **Requêtes complexes** | Manuelles (filter) | ✅ Requêtes SQL |
| **Performance** | Lent (gros fichiers) | ✅ Rapide (indexés) |
| **Backup** | Manuel | ✅ Outils de backup MySQL |
| **Scalabilité** | Limitée | ✅ Illimitée |

---

## 🔍 Vérifier l'État de la Base de Données

```bash
# Ouvrir MySQL
mysql -h localhost -u root -p print_request_db

# Voir les utilisateurs
SELECT COUNT(*) FROM users;

# Voir les projets
SELECT * FROM projets;

# Voir les demandes
SELECT COUNT(*) FROM requests;

# Voir les articles
SELECT COUNT(*) FROM request_items;

# Quitter
EXIT;
```

---

## 🐛 Troubleshooting

| Erreur | Solution |
|--------|----------|
| `Error: connect ECONNREFUSED` | MySQL n'est pas lancé |
| `ER_ACCESS_DENIED_FOR_USER` | Mauvais mot de passe dans `.env` |
| `Unknown database 'print_request_db'` | Exécuter `database.sql` |
| `ENOENT: no such file or directory '.env'` | Créer le fichier `.env` |

---

## 📞 Questions Fréquentes

**Q: Puis-je garder les ancienne données ?**
A: Oui, exécuter `node migrate.js` les importera automatiquement.

**Q: Puis-je accéder l'app depuis une autre machine ?**
A: Oui, utilisez `http://<IP_SERVEUR>:3000`

**Q: Comment faire un backup de la base de données ?**
A: `mysqldump -u root -p print_request_db > backup.sql`

**Q: Puis-je modifier le port 3000 ?**
A: Oui, dans `.env` : `PORT=8080`

---

## 🎉 Vous êtes Prêt!

Votre application est maintenant **production-ready** avec MySQL!

**Points clés** :
- ✅ Base de données MySQL robuste
- ✅ Table projets pour gestion complète
- ✅ Accès multi-utilisateurs
- ✅ Accès à distance depuis le réseau
- ✅ Prêt pour accès offline complet
- ✅ Données persistantes et sécurisées

Bon déploiement! 🚀
