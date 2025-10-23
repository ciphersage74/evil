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
