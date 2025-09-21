import { useMemo, useState } from 'react';
import SearchBar from './components/SearchBar';
import LoadingSpinner from './components/LoadingSpinner';
import SitePreview from './components/SitePreview';
import { BusinessInfo, populateTemplate } from './utils/template';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function App() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);

  const handleGenerate = async () => {
    if (!query.trim()) {
      setError('Veuillez saisir un nom d\'entreprise.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedHtml(null);
    setBusinessInfo(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-site`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ businessName: query.trim() })
      });

      const payload = (await response.json()) as BusinessInfo & { error?: string };

      if (!response.ok) {
        throw new Error(payload?.error || 'Une erreur inattendue est survenue.');
      }

      const html = populateTemplate(payload);
      setBusinessInfo(payload);
      setGeneratedHtml(html);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Impossible de générer le site.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setQuery('');
    setGeneratedHtml(null);
    setBusinessInfo(null);
    setError(null);
  };

  const headerSubtitle = useMemo(() => {
    if (businessInfo) {
      return `Landing page générée pour ${businessInfo.name}`;
    }
    return "Générez une page d'accueil moderne à partir d'une fiche Google Maps.";
  }, [businessInfo]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-amber-400">Générateur</p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">Créateur de page d'accueil locale</h1>
          <p className="mt-6 text-lg text-slate-200">{headerSubtitle}</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        {!generatedHtml && !isLoading && (
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            onSubmit={handleGenerate}
          />
        )}

        {isLoading && (
          <div className="mt-12 flex justify-center">
            <LoadingSpinner label="Extraction des données en cours..." />
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 px-6 py-4 text-rose-700">
            {error}
          </div>
        )}

        {generatedHtml && businessInfo && (
          <SitePreview html={generatedHtml} info={businessInfo} onReset={reset} />
        )}
      </main>
    </div>
  );
}

export default App;
