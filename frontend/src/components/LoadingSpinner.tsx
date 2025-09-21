interface LoadingSpinnerProps {
  label?: string;
}

const LoadingSpinner = ({ label }: LoadingSpinnerProps) => (
  <div className="flex flex-col items-center gap-4">
    <span className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-amber-400 border-t-transparent"></span>
    {label && <p className="text-sm text-slate-600">{label}</p>}
  </div>
);

export default LoadingSpinner;
