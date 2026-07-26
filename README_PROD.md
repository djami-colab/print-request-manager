# Portail d'Impression CIDI - Version Production

## 🎯 Vue d'ensemble

Application web simple pour gérer les demandes d'impression au CIDI. Les utilisateurs accèdent à un **portail public** pour:
- Remplir un formulaire de demande
- Générer un bon d'impression en PDF
- Imprimer directement

**Aucune authentification requise** - Accès direct pour tous les utilisateurs.

## ⚡ Démarrage rapide

### 1️⃣ Installation (5 min)

```bash
# Cloner le projet
git clone <repo-url>
cd print-request-manager

# Installer les dépendances
npm install

# Copier la configuration
cp .env.example .env

# Éditer .env avec vos paramètres MySQL
nano .env
```

### 2️⃣ Configuration MySQL (2 min)

```bash
# Créer la base de données
mysql -u root -p < database.sql

# Appliquer les migrations
npm run migration:run
```

### 3️⃣ Lancer l'application (1 min)

```bash
npm start
```

**Accédez à:** `http://localhost:3000`

## 📱 Utilisation

### Pour les utilisateurs
1. Allez sur `http://localhost:3000`
2. Cliquez sur **"Accéder au Portail"**
3. Remplissez le formulaire
4. Générez le bon (PDF)
5. Imprimez!

### Structure des pages
- **`/`** - Landing page avec accueil
- **`/portail`** - Formulaire de demande d'impression
- **API `/api/projets/list`** - Liste des projets (public)

## 📂 Fichiers clés

```
project/
├── public/
│   ├── landing.html      ← Page d'accueil
│   ├── portail.html      ← Formulaire public
│   ├── app.js            ← Logique du formulaire
│   ├── style.css         ← Styles
│   └── print.css         ← Styles impression
├── server.js             ← Serveur Express
├── database.sql          ← Schéma BD
├── package.json          ← Dépendances
├── .env                  ← Configuration (à créer)
└── bons/                 ← PDFs générés
```

## 🔧 Variables d'environnement

| Variable | Valeur | Notes |
|----------|--------|-------|
| `PORT` | `3000` | Port du serveur |
| `NODE_ENV` | `production` | Mode production |
| `DB_HOST` | `localhost` | Serveur MySQL |
| `DB_USER` | `root` | Utilisateur MySQL |
| `DB_PASSWORD` | `***` | Mot de passe MySQL |
| `DB_NAME` | `print_request_db` | Nom de la BD |
| `JWT_SECRET` | `***` | Clé secrète JWT |

**Générer JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 Déploiement en production

### Avec PM2 (recommandé)

```bash
# Installer PM2
npm install -g pm2

# Lancer l'application
pm2 start server.js --name "print-manager"

# Logs
pm2 logs print-manager

# Auto-restart au démarrage
pm2 startup
pm2 save
```

### Avec Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t print-manager .
docker run -p 3000:3000 --env-file .env print-manager
```

### Avec Nginx (reverse proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

## 📊 Base de données

### Tables principales

**`projets`**
```sql
CREATE TABLE projets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  intitule VARCHAR(255) UNIQUE,
  unite VARCHAR(100),
  annee INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**`print_requests`**
```sql
CREATE TABLE print_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_number VARCHAR(20) UNIQUE,
  requester_name VARCHAR(100),
  department VARCHAR(100),
  project VARCHAR(255),
  request_type VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🐛 Dépannage

### Le serveur ne démarre pas
```bash
# Vérifier le port
lsof -i :3000

# Libérer le port
kill -9 <PID>

# Ou utiliser un autre port
PORT=8080 npm start
```

### Erreur MySQL
```bash
# Vérifier la connexion
mysql -u root -p -e "SELECT 1"

# Vérifier les paramètres .env
cat .env
```

### Les projets ne s'affichent pas
```bash
# Insérer des projets de test
mysql -u root -p print_request_db << EOF
INSERT INTO projets (intitule, unite, annee) VALUES
('Projet A', 'CIDI', 2026),
('Projet B', 'CIDI', 2026);
EOF
```

## 📝 Logs et monitoring

```bash
# Voir les logs en temps réel
pm2 logs print-manager

# Voir le statut
pm2 status

# Redémarrer
pm2 restart print-manager

# Arrêter
pm2 stop print-manager
```

## 🔒 Sécurité

- ✅ Changez `JWT_SECRET` avec une clé longue et aléatoire
- ✅ Utilisez un mot de passe MySQL fort
- ✅ Limitez l'accès MySQL à localhost
- ✅ Configurez HTTPS en production (Nginx + Let's Encrypt)
- ✅ Maintenez Node.js à jour

## 📞 Support

Consultez:
- `PRODUCTION_GUIDE.md` - Guide détaillé de déploiement
- `schema.sql` - Structure de la base de données
- `server.js` - Code du serveur

---

**Prêt à déployer?** Suivez les **3 étapes du démarrage rapide** ci-dessus! 🚀
