# 🎨 Frontend React - Salon de Coiffure

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Développement
npm run dev

# Build production
npm run build
```

## 🚀 Déploiement

```bash
npm run build

# Le dossier dist/ contient les fichiers statiques
sudo cp -r dist/* /var/www/salon-coiffure/
```

## ⚙️ Configuration

Éditez `.env.production` pour pointer vers votre API :

```
VITE_API_URL=https://votre-domaine.com/api
```

## 📁 Structure

```
src/
├── api/          # Client API
├── components/   # Composants réutilisables
├── pages/        # Pages de l'app
├── utils/        # Utilitaires
├── App.jsx       # App principale
└── Layout.jsx    # Layout avec header/footer
```

## 🔗 URLs

- Accueil : `/accueil`
- Prestations : `/prestations`
- Réservation : `/reservation`
- Galerie : `/galerie`
- Avis : `/avis`
- Contact : `/contact`
- Admin : `/admin`

## 🔐 Admin

- Email : `admin@lesalon.fr`
- Mot de passe : `admin123`
