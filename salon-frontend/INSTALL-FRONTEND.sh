#!/bin/bash

set -e

echo "🎨 Installation du Frontend"
echo "=========================="

if ! command -v node &> /dev/null; then
  echo "❌ Node.js n'est pas installé"
  echo "Installation de Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "📦 Installation des dépendances..."
npm install

echo "🔧 Configuration..."
if [ ! -f .env ]; then
  echo "VITE_API_URL=http://localhost/api" > .env
fi

echo "🏗️ Build production..."
npm run build

echo

echo "✅ Frontend prêt !"
echo "================="
echo "📁 Fichiers dans: dist/"
echo

echo "🚀 Pour déployer:"
echo " sudo cp -r dist/* /var/www/salon-coiffure/"
echo

echo "💻 Pour développement local:"
echo " npm run dev"
echo
