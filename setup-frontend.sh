#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

PROJECT_DIR="salon-frontend"

if [ -d "$PROJECT_DIR" ]; then
  echo "ℹ️ Le dossier $PROJECT_DIR existe déjà. Les fichiers seront mis à jour."
else
  echo "🎨 Création du Frontend React..."
  mkdir -p "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

mkdir -p src/api src/components/ui src/components/home src/components/admin src/pages src/utils

cat > package.json <<'EOPKG'
{
  "name": "salon-coiffure-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "react-query": "^3.39.3",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.0",
    "date-fns": "^2.30.0",
    "framer-motion": "^10.16.0",
    "lucide-react": "^0.294.0",
    "recharts": "^2.10.0",
    "react-hook-form": "^7.48.0",
    "moment": "^2.29.4",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
EOPKG

cat > vite.config.js <<'EOVITE'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
EOVITE

cat > tailwind.config.js <<'EOTAIL'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOTAIL

cat > postcss.config.js <<'EOPOST'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOPOST

cat > index.html <<'EOHTML'
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/scissors.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Le Salon Chic</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOHTML

cat > src/api/client.js <<'EOCLIENT'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const entities = {
  Prestation: {
    list: async (orderBy = 'nom') => {
      const { data } = await api.get(`/prestations?orderBy=${orderBy}`)
      return data
    },
    filter: async (filters = {}, orderBy) => {
      const params = new URLSearchParams(filters)
      if (orderBy) params.append('orderBy', orderBy)
      const { data } = await api.get(`/prestations?${params.toString()}`)
      return data
    },
    create: async payload => {
      const { data } = await api.post('/prestations', payload)
      return data
    },
    update: async (id, payload) => {
      const { data } = await api.put(`/prestations?id=${id}`, payload)
      return data
    },
    delete: async id => {
      const { data } = await api.delete(`/prestations?id=${id}`)
      return data
    }
  },

  Coiffeur: {
    list: async (orderBy = 'ordre') => {
      const { data } = await api.get(`/coiffeurs?orderBy=${orderBy}`)
      return data
    },
    filter: async (filters = {}, orderBy) => {
      const params = new URLSearchParams(filters)
      if (orderBy) params.append('orderBy', orderBy)
      const { data } = await api.get(`/coiffeurs?${params.toString()}`)
      return data
    },
    create: async payload => {
      const { data } = await api.post('/coiffeurs', payload)
      return data
    },
    update: async (id, payload) => {
      const { data } = await api.put(`/coiffeurs?id=${id}`, payload)
      return data
    },
    delete: async id => {
      const { data } = await api.delete(`/coiffeurs?id=${id}`)
      return data
    }
  },

  RendezVous: {
    list: async () => {
      const { data } = await api.get('/rendezvous')
      return data
    },
    create: async payload => {
      const { data } = await api.post('/rendezvous', payload)
      return data
    },
    update: async (id, payload) => {
      const { data } = await api.put(`/rendezvous?id=${id}`, payload)
      return data
    },
    delete: async id => {
      const { data } = await api.delete(`/rendezvous?id=${id}`)
      return data
    }
  },

  Avis: {
    list: async () => {
      const { data } = await api.get('/avis')
      return data
    },
    filter: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const { data } = await api.get(`/avis?${params.toString()}`)
      return data
    },
    create: async payload => {
      const { data } = await api.post('/avis', payload)
      return data
    },
    update: async (id, payload) => {
      const { data } = await api.put(`/avis?id=${id}`, payload)
      return data
    },
    delete: async id => {
      const { data } = await api.delete(`/avis?id=${id}`)
      return data
    }
  },

  Galerie: {
    list: async () => {
      const { data } = await api.get('/galerie')
      return data
    },
    create: async payload => {
      const { data } = await api.post('/galerie', payload)
      return data
    },
    delete: async id => {
      const { data } = await api.delete(`/galerie?id=${id}`)
      return data
    }
  },

  Configuration: {
    list: async () => {
      const { data } = await api.get('/configuration')
      return data
    },
    create: async payload => {
      const { data } = await api.post('/configuration', payload)
      return data
    },
    update: async (id, payload) => {
      const { data } = await api.put(`/configuration?id=${id}`, payload)
      return data
    }
  },

  Horaire: {
    list: async () => {
      const { data } = await api.get('/horaires')
      return data
    },
    update: async (id, payload) => {
      const { data } = await api.put(`/horaires?id=${id}`, payload)
      return data
    }
  }
}

export const uploadFile = async file => {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  })

  return data
}

export const auth = {
  login: async (email, password) => {
    if (email === 'admin@lesalon.fr' && password === 'admin123') {
      const token = 'admin-token'
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'admin')
      return { token, role: 'admin', email }
    }
    throw new Error('Identifiants incorrects')
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_role')
    window.location.href = '/'
  },

  me: async () => {
    const email = localStorage.getItem('user_email')
    const role = localStorage.getItem('user_role')
    if (!email) throw new Error('Non connecté')
    return { email, role }
  },

  isAuthenticated: async () => {
    return !!localStorage.getItem('auth_token')
  }
}

export default api
EOCLIENT

cat > src/utils/index.js <<'EOUTILS'
export const createPageUrl = pageName => {
  return `/${pageName.toLowerCase()}`
}

export const formatDate = date => {
  return new Date(date).toLocaleDateString('fr-FR')
}

export const formatPrice = price => {
  return `${Number(price).toFixed(2)}€`
}
EOUTILS

cat > src/main.jsx <<'EOMAIN'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
EOMAIN

cat > src/App.jsx <<'EOAPP'
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import Accueil from './pages/Accueil'
import Prestations from './pages/Prestations'
import Reservation from './pages/Reservation'
import Galerie from './pages/Galerie'
import Avis from './pages/Avis'
import Contact from './pages/Contact'
import Admin from './pages/Admin'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/accueil" replace />} />
        <Route path="accueil" element={<Accueil />} />
        <Route path="prestations" element={<Prestations />} />
        <Route path="reservation" element={<Reservation />} />
        <Route path="galerie" element={<Galerie />} />
        <Route path="avis" element={<Avis />} />
        <Route path="contact" element={<Contact />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}

export default App
EOAPP

cat > src/Layout.jsx <<'EOLAYOUT'
import React, { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { createPageUrl } from './utils'
import { Scissors, Calendar, Image, Star, Phone, Home, Menu, X } from 'lucide-react'

const NAV_ITEMS = [
  { name: 'Accueil', icon: Home, page: 'accueil' },
  { name: 'Prestations', icon: Scissors, page: 'prestations' },
  { name: 'Réservation', icon: Calendar, page: 'reservation' },
  { name: 'Galerie', icon: Image, page: 'galerie' },
  { name: 'Avis', icon: Star, page: 'avis' },
  { name: 'Contact', icon: Phone, page: 'contact' },
].map(item => ({ ...item, path: createPageUrl(item.page) }))

export default function Layout() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const isAdminPage = location.pathname.includes('/admin')

  if (isAdminPage) {
    return <div className="min-h-screen bg-gray-50"><Outlet /></div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all ${
          scrolled ? 'bg-white shadow-lg' : 'bg-gradient-to-r from-amber-900 to-orange-900'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link to="/accueil" className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-700 to-orange-700 p-3 rounded-2xl">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                  Le Salon Chic
                </h1>
                <p className={`text-xs ${scrolled ? 'text-amber-700' : 'text-amber-200'}`}>
                  L'art de la coiffure
                </p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 font-medium transition-colors ${
                    location.pathname === item.path
                      ? scrolled
                        ? 'text-amber-700'
                        : 'text-amber-200'
                      : scrolled
                        ? 'text-gray-700 hover:text-amber-700'
                        : 'text-white hover:text-amber-200'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </nav>

            <button
              onClick={() => setMobileMenuOpen(value => !value)}
              className="lg:hidden p-2"
            >
              {mobileMenuOpen ? (
                <X className={`w-6 h-6 ${scrolled ? 'text-gray-900' : 'text-white'}`} />
              ) : (
                <Menu className={`w-6 h-6 ${scrolled ? 'text-gray-900' : 'text-white'}`} />
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden pb-4">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 py-3 px-4 rounded-lg ${
                    location.pathname === item.path
                      ? 'bg-amber-700 text-white'
                      : scrolled
                        ? 'text-gray-700 hover:bg-amber-50'
                        : 'text-white hover:bg-white/10'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="pt-20 flex-1 bg-gray-50">
        <Outlet />
      </main>

      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scissors className="w-6 h-6 text-amber-500" />
            <h3 className="text-xl font-bold">Le Salon Chic</h3>
          </div>
          <p className="text-gray-400 mb-4">L'art de la coiffure</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <span>📞 01 23 45 67 89</span>
            <span>📧 contact@lesalon.fr</span>
            <span>📍 123 Rue de la Beauté, Paris</span>
          </div>
          <p className="text-gray-500 text-sm mt-6">
            © {new Date().getFullYear()} Le Salon Chic. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}
EOLAYOUT

cat > src/index.css <<'EOCSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f9fafb;
}

#root {
  min-height: 100vh;
}
EOCSS

cat > .env <<'EOENV'
VITE_API_URL=http://localhost/api
EOENV

cat > .env.production <<'EOENVPROD'
VITE_API_URL=/api
EOENVPROD

cat > .gitignore <<'EOGIT'
node_modules
dist
.env.local
.DS_Store
*.log
EOGIT

cat > README.md <<'EOREAD'
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
EOREAD

cat > src/pages/Accueil.jsx <<'EOACCUEIL'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { entities } from '../api/client'
import { Calendar, Star, Clock, Sparkle } from 'lucide-react'

export default function Accueil() {
  const { data: prestations = [] } = useQuery({
    queryKey: ['prestations', 'popular'],
    queryFn: () => entities.Prestation.filter({ populaire: 'true' }),
  })

  const { data: avis = [] } = useQuery({
    queryKey: ['avis', 'valid'],
    queryFn: () => entities.Avis.filter({ valide: 'true' }),
  })

  return (
    <div className="bg-gray-50">
      <section className="relative overflow-hidden bg-gradient-to-r from-amber-900 to-orange-800 text-white">
        <div className="absolute inset-0 opacity-20">
          <Sparkle className="w-full h-full" />
        </div>
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm">
              <Star className="w-4 h-4" /> Salon de Coiffure d'Excellence
            </span>
            <h1 className="text-5xl font-bold leading-tight">L'Art de la Coiffure Moderne</h1>
            <p className="text-lg text-amber-100">
              Sublimez votre style avec nos experts passionnés et profitez d'une expérience beauté premium.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/reservation"
                className="inline-flex items-center gap-2 bg-white text-amber-900 px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-amber-100 transition"
              >
                <Calendar className="w-5 h-5" />
                Prendre rendez-vous
              </Link>
              <Link
                to="/prestations"
                className="inline-flex items-center gap-2 border border-white/40 px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
              >
                Découvrir nos prestations
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Nos Prestations Populaires</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prestations.slice(0, 6).map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition">
                <span className="inline-block bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-sm mb-4">
                  {p.categorie}
                </span>
                <h3 className="text-2xl font-bold mb-2">{p.nom}</h3>
                <p className="text-gray-600 mb-4">{p.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{p.duree} min</span>
                  </div>
                  <span className="text-2xl font-bold text-amber-900">{Number(p.prix).toFixed(2)}€</span>
                </div>
                <Link
                  to={`/reservation?prestation=${p.id}`}
                  className="block text-center bg-gradient-to-r from-amber-700 to-amber-900 text-white py-3 rounded-lg hover:from-amber-800 hover:to-amber-950 transition"
                >
                  Réserver
                </Link>
              </div>
            ))}
            {prestations.length === 0 && (
              <div className="md:col-span-2 lg:col-span-3 text-center text-gray-500">
                Aucune prestation populaire pour le moment.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Ils nous font confiance</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avis.slice(0, 6).map(a => (
              <div key={a.id} className="bg-amber-50 rounded-xl p-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < a.note ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-3 italic">“{a.commentaire}”</p>
                <p className="font-semibold">{a.nom}</p>
              </div>
            ))}
            {avis.length === 0 && (
              <div className="md:col-span-2 lg:col-span-3 text-center text-gray-500">
                Aucun avis validé pour le moment.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
EOACCUEIL

cat > src/pages/Prestations.jsx <<'EOPREST'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { entities } from '../api/client'
import { Clock, Euro } from 'lucide-react'

export default function Prestations() {
  const { data: prestations = [], isLoading } = useQuery({
    queryKey: ['prestations', 'all'],
    queryFn: () => entities.Prestation.list(),
  })

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="text-gray-500">Chargement...</span>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h1 className="text-4xl font-bold">Nos Prestations</h1>
          <p className="text-lg text-gray-600">
            Découvrez notre gamme de prestations personnalisées, conçues pour sublimer votre beauté.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prestations.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-6 shadow-lg">
              {p.populaire && (
                <span className="inline-block bg-gradient-to-r from-amber-600 to-orange-600 text-white px-3 py-1 rounded-full text-sm mb-3">
                  Populaire
                </span>
              )}
              <span className="inline-block bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-sm mb-4">
                {p.categorie}
              </span>
              <h3 className="text-2xl font-bold mb-2">{p.nom}</h3>
              <p className="text-gray-600 mb-4">{p.description}</p>
              <div className="flex items-center justify-between mb-4 p-4 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-700" />
                  <span className="font-medium">{p.duree} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Euro className="w-5 h-5 text-amber-700" />
                  <span className="text-2xl font-bold text-amber-900">{Number(p.prix).toFixed(2)}€</span>
                </div>
              </div>
              <Link
                to={`/reservation?prestation=${p.id}`}
                className="block text-center bg-gradient-to-r from-amber-700 to-amber-900 text-white py-3 rounded-lg hover:from-amber-800 hover:to-amber-950 transition"
              >
                Réserver cette prestation
              </Link>
            </div>
          ))}
          {prestations.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 text-center text-gray-500">
              Aucune prestation disponible pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
EOPREST

for page in Reservation Galerie Avis Contact Admin; do
cat > "src/pages/${page}.jsx" <<EOPAGE
import React from 'react'

export default function ${page}() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">${page}</h1>
        <p className="text-gray-600">Page ${page} - À implémenter</p>
      </div>
    </div>
  )
}
EOPAGE

done

cat > INSTALL-FRONTEND.sh <<'EOINSTALL'
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
EOINSTALL

chmod +x INSTALL-FRONTEND.sh

echo

echo "✅ Frontend créé avec succès !"
echo "=============================="
echo "📁 Dossier: $PROJECT_DIR/"
echo

echo "🚀 Étapes suivantes:"
echo " cd $PROJECT_DIR"
echo " bash INSTALL-FRONTEND.sh"
echo
