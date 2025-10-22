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
