import { FormEvent } from 'react';

interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
}

const SearchBar = ({ query, onQueryChange, onSubmit }: SearchBarProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full flex-col items-center gap-6 rounded-2xl bg-white p-8 shadow-xl"
    >
      <div className="w-full">
        <label htmlFor="businessName" className="text-sm font-medium text-slate-600">
          Nom de l'entreprise
        </label>
        <div className="mt-2 flex w-full flex-col gap-4 sm:flex-row">
          <input
            id="businessName"
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Ex: Boulangerie Dupont Paris"
            className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-800 shadow-inner focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-3 text-base font-semibold text-slate-900 shadow-lg transition hover:bg-amber-400"
          >
            Générer
          </button>
        </div>
      </div>
      <p className="text-center text-sm text-slate-500">
        Entrez le nom complet de l'entreprise tel qu'il apparaît sur Google Maps pour obtenir les informations les plus
        précises.
      </p>
    </form>
  );
};

export default SearchBar;
