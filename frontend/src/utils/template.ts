export interface DayHours {
  day: string;
  hours: string | null;
}

export interface BusinessInfo {
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  rating: number | null;
  reviewCount: number | null;
  hours: DayHours[];
  photoUrls: string[];
  mapsUrl: string;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1600&q=80';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHours(hours: DayHours[]): string {
  if (!hours || hours.length === 0) {
    return '<p class="text-slate-500">Horaires non disponibles pour le moment.</p>';
  }

  return `
    <ul class="space-y-2">
      ${hours
        .map(
          (item) => `
            <li class="flex justify-between border-b border-slate-200 pb-2">
              <span class="font-medium text-slate-700">${escapeHtml(item.day)}</span>
              <span class="text-slate-600">${escapeHtml(item.hours ?? 'Fermé')}</span>
            </li>
          `
        )
        .join('')}
    </ul>
  `;
}

function renderGallery(urls: string[], businessName: string): string {
  if (!urls || urls.length === 0) {
    return `
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="relative overflow-hidden rounded-xl bg-slate-200 pt-[65%]"></div>
        <div class="relative overflow-hidden rounded-xl bg-slate-200 pt-[65%]"></div>
        <div class="relative overflow-hidden rounded-xl bg-slate-200 pt-[65%]"></div>
      </div>
    `;
  }

  return `
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      ${urls
        .map(
          (url, index) => `
            <div class="relative overflow-hidden rounded-xl shadow-sm pt-[65%]">
              <img
                src="${url}"
                alt="Photo ${index + 1} de ${escapeHtml(businessName)}"
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

export function populateTemplate(info: BusinessInfo): string {
  const heroImage = info.photoUrls?.[0] ?? FALLBACK_IMAGE;
  const aboutImage = info.photoUrls?.[1] ?? heroImage;
  const galleryImages = info.photoUrls?.slice(2, 9) ?? [];

  const rating =
    typeof info.rating === 'number'
      ? `<div class="mt-4 flex items-center gap-2 text-amber-500">
          <span class="text-2xl font-semibold">${info.rating.toFixed(1)}</span>
          <span class="text-sm text-slate-200">(${info.reviewCount ?? 'N/A'} avis)</span>
        </div>`
      : '';

  const mapsEmbedUrl = info.address
    ? `https://www.google.com/maps?q=${encodeURIComponent(info.address)}&output=embed`
    : info.mapsUrl
      ? `${info.mapsUrl}&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent(info.name)}&output=embed`;

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(info.name)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { font-family: 'Montserrat', sans-serif; background-color: #0f172a; }
      h1, h2, h3, h4, h5, h6 { font-family: 'Playfair Display', serif; }
    </style>
  </head>
  <body class="bg-slate-950 text-slate-100">
    <header class="relative isolate overflow-hidden">
      <div class="absolute inset-0">
        <img src="${heroImage}" alt="${escapeHtml(info.name)}" class="h-full w-full object-cover" />
        <div class="absolute inset-0 bg-slate-900/70"></div>
      </div>
      <div class="relative mx-auto flex min-h-[75vh] max-w-6xl flex-col justify-center px-6 py-24 text-center">
        <span class="text-sm uppercase tracking-[0.5em] text-amber-400">${escapeHtml(info.category || 'Entreprise locale')}</span>
        <h1 class="mt-6 text-4xl font-bold sm:text-5xl md:text-6xl">${escapeHtml(info.name)}</h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg text-slate-200">
          ${escapeHtml(
            info.description ||
              "Découvrez l'excellence et le savoir-faire de notre équipe dédiée à votre satisfaction."
          )}
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="tel:${escapeHtml(info.phone || '')}"
            class="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-900 shadow-lg transition hover:bg-amber-400"
          >
            Nous appeler
          </a>
          <a
            href="${info.mapsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-full border border-amber-400 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-amber-400 transition hover:bg-amber-400 hover:text-slate-900"
          >
            Itinéraire
          </a>
        </div>
        ${rating}
      </div>
    </header>

    <main class="bg-slate-950">
      <section class="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2">
        <div class="flex flex-col justify-center space-y-6">
          <h2 class="text-3xl font-semibold text-amber-400">À propos</h2>
          <p class="text-lg leading-relaxed text-slate-200">
            ${escapeHtml(
              info.description ||
                "Nous mettons toute notre passion au service de nos clients en offrant des prestations sur mesure, réalisées avec soin et professionnalisme."
            )}
          </p>
          <div class="rounded-2xl bg-slate-900/60 p-6">
            <p class="text-sm uppercase tracking-[0.3em] text-amber-500">Coordonnées</p>
            <p class="mt-4 flex items-start gap-3 text-slate-100">
              <span class="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">📍</span>
              <span>${escapeHtml(info.address || 'Adresse non disponible')}</span>
            </p>
            <p class="mt-3 flex items-center gap-3 text-slate-100">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">📞</span>
              <a href="tel:${escapeHtml(info.phone || '')}" class="hover:text-amber-400">
                ${escapeHtml(info.phone || 'Téléphone non disponible')}
              </a>
            </p>
          </div>
        </div>
        <div class="relative overflow-hidden rounded-3xl shadow-2xl">
          <img src="${aboutImage}" alt="${escapeHtml(info.name)}" class="h-full w-full object-cover" />
        </div>
      </section>

      <section class="bg-slate-900/60">
        <div class="mx-auto max-w-6xl px-6 py-24">
          <div class="flex flex-col items-start justify-between gap-6 pb-12 sm:flex-row sm:items-center">
            <h2 class="text-3xl font-semibold text-amber-400">Galerie</h2>
            <p class="max-w-xl text-slate-300">
              Une sélection d'images reflétant l'ambiance et la qualité de ${escapeHtml(info.name)}.
            </p>
          </div>
          ${renderGallery(galleryImages, info.name)}
        </div>
      </section>

      <section class="mx-auto max-w-6xl px-6 py-24">
        <div class="grid gap-12 lg:grid-cols-[2fr,3fr]">
          <div class="rounded-3xl bg-slate-900/60 p-8 shadow-lg">
            <h2 class="text-3xl font-semibold text-amber-400">Horaires</h2>
            <p class="mt-3 text-slate-300">
              Consultez nos disponibilités pour préparer votre prochaine visite.
            </p>
            <div class="mt-8 space-y-6">
              ${renderHours(info.hours)}
            </div>
          </div>
          <div class="overflow-hidden rounded-3xl shadow-xl">
            <iframe
              src="${mapsEmbedUrl}"
              width="100%"
              height="100%"
              style="border:0; min-height: 420px;"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-slate-800 bg-slate-950/80">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-12 text-center sm:flex-row">
        <p class="text-sm text-slate-400">© ${new Date().getFullYear()} ${escapeHtml(info.name)}. Tous droits réservés.</p>
        <a href="${info.mapsUrl}" target="_blank" rel="noopener noreferrer" class="text-sm text-amber-400 hover:text-amber-300">
          Voir sur Google Maps
        </a>
      </div>
    </footer>
  </body>
</html>`;
}
