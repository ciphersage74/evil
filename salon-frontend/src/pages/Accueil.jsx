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
