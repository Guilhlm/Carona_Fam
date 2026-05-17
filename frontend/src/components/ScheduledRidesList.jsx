import { FiCalendar, FiPlay, FiTrash2 } from 'react-icons/fi';
import { isOpenScheduledRide } from '../utils/scheduledRide';

export default function ScheduledRidesList({
  rides,
  showOnlyScheduled,
  onShowPreviousTrips,
  onRequestNow,
  onDelete,
  requestingId = null,
  deletingId = null,
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
          {rides.map((ride) => {
            const isOpen = isOpenScheduledRide(ride);
            const isRequesting = requestingId === ride.id;
            const isDeleting = deletingId === ride.id;
            const joinedCount = (ride.joinedPassengers || []).length;

            return (
              <div
                key={ride.id}
                className="rounded-xl border border-border-muted bg-surface-input/20 overflow-hidden"
              >
                <div className="flex items-start gap-3 p-3">
                  <div className="w-10 h-10 rounded-lg bg-black/20 border border-border-muted flex items-center justify-center shrink-0">
                    <FiCalendar className="w-4 h-4 text-text-main/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-gray-100 truncate">
                      {ride.origin ? `${ride.origin} → ` : ''}
                      {ride.destination}
                    </h3>
                    <p className="text-xs text-text-main/60 mt-0.5">
                      Saída:{' '}
                      {ride.departureAt
                        ? new Date(ride.departureAt).toLocaleString('pt-BR')
                        : 'Não informada'}
                    </p>
                    <p className="text-xs text-text-main/55 mt-1">
                      {(() => {
                        const n = Number(ride.passengers);
                        const count = Number.isFinite(n) && n > 0 ? n : 1;
                        const base = `${count + joinedCount} ${count + joinedCount === 1 ? 'pessoa' : 'pessoas'}`;
                        return ride.allowNewPassengers ? `${base} · Aceita carona` : base;
                      })()}
                    </p>
                    {!isOpen && (
                      <p className="text-xs text-amber-400/90 mt-1">Já solicitada ou encerrada</p>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="flex gap-2 border-t border-border-muted/60 bg-black/15 p-2">
                    <button
                      type="button"
                      onClick={() => onRequestNow?.(ride)}
                      disabled={isRequesting || isDeleting}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand py-2 text-xs font-semibold text-white hover:bg-brand/80 disabled:opacity-60"
                    >
                      <FiPlay className="h-3.5 w-3.5" />
                      {isRequesting ? 'Solicitando...' : 'Solicitar agora'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete?.(ride)}
                      disabled={isRequesting || isDeleting}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-60"
                      aria-label="Excluir viagem agendada"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                      {isDeleting ? '...' : 'Excluir'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
