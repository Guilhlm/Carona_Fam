import { FiCalendar } from 'react-icons/fi';

export default function ScheduledRidesList({
  rides,
  showOnlyScheduled,
  onShowPreviousTrips,
  onRideClick,
}) {
  return (
    <section id="scheduled-rides-section" className="mb-8 scroll-mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-xl font-semibold text-gray-100">Suas viagens agendadas</h2>
        {showOnlyScheduled && (
          <button
            type="button"
            onClick={onShowPreviousTrips}
            className="text-xs text-brand hover:text-brand/80 font-medium"
          >
            Mostrar viagens anteriores
          </button>
        )}
      </div>
      {rides.length === 0 ? (
        <div className="rounded-xl border border-border-muted bg-surface-input/20 p-4 text-sm text-text-main/70">
          Você ainda não possui viagens agendadas.
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => (
            <button
              key={ride.id}
              type="button"
              onClick={() => onRideClick(ride)}
              className="w-full rounded-xl border border-border-muted bg-surface-input/20 px-3 py-3 flex items-center gap-3 text-left hover:bg-surface-input/35 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-black/20 border border-border-muted flex items-center justify-center shrink-0">
                <FiCalendar className="w-4 h-4 text-text-main/70" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm text-gray-100 truncate">{ride.destination}</h3>
                <p className="text-xs text-text-main/60 truncate">
                  Saída:{' '}
                  {ride.departureAt ? new Date(ride.departureAt).toLocaleString('pt-BR') : 'Não informada'}
                </p>
                {ride.returnAt && (
                  <p className="text-xs text-text-main/60 truncate">
                    Retorno: {new Date(ride.returnAt).toLocaleString('pt-BR')}
                  </p>
                )}
                <p className="text-xs text-text-main/55 mt-1">
                  {(() => {
                    const n = Number(ride.passengers);
                    const count = Number.isFinite(n) && n > 0 ? n : 1;
                    const base = `${count} ${count === 1 ? 'pessoa' : 'pessoas'}`;
                    return ride.allowNewPassengers ? `${base} · Aceita carona` : base;
                  })()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
