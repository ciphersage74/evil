# Générateur de page d'accueil locale

Ce projet full-stack crée automatiquement une landing page moderne pour une entreprise locale à partir de sa fiche Google Maps. Il se compose d'un backend Node.js/Express chargé du scraping via Puppeteer et d'un frontend React/TypeScript (Vite + TailwindCSS) pour l'interface utilisateur.

## Structure du projet

```
.
├── backend        # API Express + Puppeteer
└── frontend       # Application React + Vite + Tailwind
```

## Mise en route

### Backend (Node.js / Express / Puppeteer)

1. Installer les dépendances :
   ```bash
   cd backend
   npm install
   ```
2. Lancer le serveur en production :
   ```bash
   npm start
   ```
3. Pour un rechargement automatique en développement :
   ```bash
   npm run dev
   ```

Le serveur écoute par défaut sur [http://localhost:4000](http://localhost:4000) et expose l'endpoint `POST /api/generate-site`.

### Frontend (React / Vite / TailwindCSS)

1. Installer les dépendances :
   ```bash
   cd frontend
   npm install
   ```
2. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```
3. Compiler pour la production :
   ```bash
   npm run build
   ```
4. Prévisualiser le build :
   ```bash
   npm run preview
   ```

Par défaut, Vite démarre sur [http://localhost:5173](http://localhost:5173). Définissez la variable d'environnement `VITE_API_BASE_URL` dans le frontend si l'API backend n'est pas accessible via `http://localhost:4000`.

## Fonctionnement

1. L'utilisateur saisit le nom d'une entreprise dans l'interface React.
2. Le frontend appelle l'API `/api/generate-site` en lui transmettant le nom.
3. Le backend lance Puppeteer en mode headless, recherche la fiche Google Maps correspondante, collecte les informations clés (description, contact, horaires, photos `lh3.googleusercontent.com`, etc.) puis renvoie un objet JSON structuré (`BusinessInfo`).
4. Le frontend injecte ces données dans un template HTML Tailwind moderne et affiche l'aperçu final dans un iframe, avec la possibilité de télécharger le fichier généré.

## Notes importantes

- Le scraping de Google peut nécessiter des ajustements en fonction des changements d'interface ou d'éventuelles pages de consentement. Les sélecteurs utilisés ont été pensés pour couvrir les cas les plus courants.
- Puppeteer nécessite certaines dépendances système (politiques de sandbox). Sur certains environnements (containers, CI), l'utilisation des options `--no-sandbox` et `--disable-setuid-sandbox` peut être indispensable.
- Assurez-vous que le backend dispose des autorisations réseau nécessaires pour accéder à Google.

Bonne génération de landing pages !
