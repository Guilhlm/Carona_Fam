import { FiExternalLink, FiNavigation } from 'react-icons/fi';

export default function RideNavigationChoiceCard({
  open = true,
  showNavButtons = true,
  onChooseApp,
  onChooseGoogle,
  className = '',
  children,
}) {
  if (!open) return null;

  return (
    <div className={className}>
      {children}

      {showNavButtons ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onChooseApp}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand/85"
          >
            <FiNavigation className="h-4 w-4 shrink-0" />
            Navegar no app
          </button>
          <button
            type="button"
            onClick={onChooseGoogle}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-muted bg-black/30 py-3 text-sm font-medium text-text-main hover:bg-black/40"
          >
            <FiExternalLink className="h-4 w-4 shrink-0" />
            Google Maps
          </button>
        </div>
      ) : null}
    </div>
  );
}
