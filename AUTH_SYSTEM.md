# Système d'Authentification - CIDI

## Vue d'ensemble

Le système a été entièrement réconçu avec une couche d'authentification robuste basée sur les profils utilisateur. Les profils déterminent les fonctionnalités accessibles.

## Architecture

### Authentification
- **Endpoint POST /api/auth/login**: Connexion utilisateur
- **Endpoint POST /api/auth/signup**: Création de compte
- **Token JWT**: Base64 encodé pour les sessions utilisateur
- **Middleware**: Tous les endpoints API protégés par authentification

### Structure des profils

#### Profil "Demandeur" (Requester)
- Accès à: **Nouveau Bon** uniquement
- Permet de créer des demandes d'impression
- Voir l'interface utilisateur simplifiée

#### Profil "Opérateur" (Operator)
- Accès à: **Suivi des Bons** et **Tableau de Bord**
- Gère les demandes en attente
- Visualise les statistiques et consommation d'impression

## Comptes de démonstration

Deux comptes demo sont disponibles avec le mot de passe `password`:

### Demandeur
- Email: `demo@demandeur.com`
- Profil: Demandeur
- Accès: Formulaire de création de bons

### Opérateur
- Email: `demo@operateur.com`
- Profil: Opérateur
- Accès: Suivi des bons et tableau de bord

## Pages et composants

### Page de connexion (`public/login.html`)
- Formulaire de connexion
- Formulaire de création de compte avec sélection de profil
- Design responsive avec gradient moderne
- Gestion des erreurs

### Page principale (`public/index.html`)
- Menu dynamique selon le profil
- Bouton de déconnexion dans le header
- Affichage des informations utilisateur (nom, initiales, profil)
- Profil switcher supprimé

### Fonctionnalités JavaScript (`public/app.js`)

#### Nouvellesfonctions:
- `initializeApp()`: Vérifie l'authentification et initialise l'app
- `updateMenuVisibility()`: Affiche/masque les menus selon le profil
- `logout()`: Déconnecte l'utilisateur

#### Modifications:
- Ajout du token Bearer dans tous les appels API
- Vérification automatique du localStorage pour le token
- Redirection vers login.html si non authentifié

## Endpoints API protégés

Tous les endpoints ci-dessous nécessitent un header `Authorization: Bearer <token>`:

```
GET  /api/requests
POST /api/requests
PUT  /api/requests/:id/complete
GET  /api/stats
GET  /api/export
```

## Flux d'authentification

1. **Connexion**:
   - L'utilisateur remplit email/password
   - Le serveur valide les credentials
   - Un token JWT est généré et retourné
   - Token et user info sont sauvegardés en localStorage
   - Redirection vers l'app principale

2. **Utilisation**:
   - À chaque chargement de page, app.js vérifie le localStorage
   - Sans token: redirection vers login.html
   - Avec token: initialisation normale

3. **Déconnexion**:
   - Clic sur "Déconnexion"
   - localStorage vidé
   - Redirection vers login.html

## Sécurité

- Les mots de passe ne sont PAS hachés (démo simple, à améliorer en production)
- Les tokens n'expirent pas (à implémenter en production)
- CORS activé (à restreindre en production)
- Pas de HTTPS en développement (requis en production)

## Points d'amélioration future

1. Hachage sécurisé des mots de passe (bcrypt)
2. Expiration des tokens avec refresh tokens
3. Base de données relationnelle (PostgreSQL)
4. Gestion d'erreurs plus robuste
5. Logging et audit trail
6. Two-factor authentication (2FA)
7. Rate limiting sur les endpoints d'auth

## Fichiers modifiés

- ✅ `public/index.html` - Suppression du profile switcher, ajout bouton logout
- ✅ `public/app.js` - Authentification, menu dynamique, auth headers
- ✅ `public/login.html` - Nouvelle page de connexion/inscription
- ✅ `db.js` - Fonctions d'authentification et gestion des utilisateurs
- ✅ `server.js` - Endpoints auth, middleware de protection

## Comment tester

1. Accéder à http://localhost:3000/login.html
2. Connexion avec demo@demandeur.com / password
3. Vérifier que seul "Nouveau Bon" est visible
4. Se déconnecter
5. Connexion avec demo@operateur.com / password
6. Vérifier que "Suivi des Bons" et "Tableau de Bord" sont visibles
7. Vérifier que "Nouveau Bon" n'est pas visible
