import { useMemo } from 'react';
import { BusinessInfo } from '../utils/template';

interface SitePreviewProps {
  html: string;
  info: BusinessInfo;
  onReset: () => void;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'landing-page';

const SitePreview = ({ html, info, onReset }: SitePreviewProps) => {
  const fileName = useMemo(() => `${slugify(info.name)}.html`, [info.name]);

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mt-12 space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-500">Landing page prête</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{info.name}</h2>
          <p className="mt-2 text-sm text-slate-600">{info.address}</p>
          {typeof info.rating === 'number' && (
            <p className="mt-1 text-sm text-slate-600">
              Note Google : <span className="font-semibold text-amber-500">{info.rating.toFixed(1)}</span>
              {typeof info.reviewCount === 'number' && ` · ${info.reviewCount} avis`}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-amber-400"
          >
            Télécharger le HTML
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Nouveau projet
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl shadow-2xl">
        <iframe title={`Aperçu ${info.name}`} srcDoc={html} className="h-[720px] w-full border-0"></iframe>
      </div>
    </section>
  );
};

export default SitePreview;
