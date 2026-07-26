#!/bin/bash

# Script de démarrage pour le portail d'impression

echo "🚀 Démarrage du Portail d'Impression CIDI..."
echo ""

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Vérifier si .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env manquant!"
    echo "📝 Créer un fichier .env basé sur .env.example"
    cp .env.example .env
    echo "✅ Fichier .env créé. Veuillez éditer les paramètres MySQL."
    echo ""
fi

# Vérifier les variables d'environnement
if [ -f ".env" ]; then
    echo "📋 Configuration trouvée:"
    grep -E "^(DB_HOST|DB_USER|DB_NAME|PORT)" .env || echo "Variables non trouvées"
    echo ""
fi

# Démarrer le serveur
echo "✨ Serveur démarrage sur http://localhost:$(grep '^PORT' .env | cut -d'=' -f2 || echo '3000')"
echo ""
npm start
