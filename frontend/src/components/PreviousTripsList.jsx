import { FiClock } from 'react-icons/fi';

export default function PreviousTripsList({ ridesLoading, trips }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-100 mb-3">Suas viagens anteriores</h2>
      {ridesLoading ? (
        <div className="rounded-xl border border-border-muted bg-surface-input/20 p-4 text-sm text-text-main/70">
          Carregando histórico...
        </div>
      ) : trips.length === 0 ? (
        <div className="rounded-xl border border-border-muted bg-surface-input/20 p-4 text-sm text-text-main/70">
          Você ainda não possui viagens anteriores.
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((ride) => (
            <article
              key={ride.id}
              className="rounded-xl border border-border-muted bg-surface-input/20 px-3 py-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-black/20 border border-border-muted flex items-center justify-center">
                <FiClock className="w-4 h-4 text-text-main/70" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm text-gray-100 truncate">{ride.title}</h3>
                <p className="text-xs text-text-main/60 truncate">{ride.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
