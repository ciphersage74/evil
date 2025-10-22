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
