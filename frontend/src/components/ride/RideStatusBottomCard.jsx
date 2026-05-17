import { FiCheck, FiNavigation, FiPlayCircle, FiX } from 'react-icons/fi';

const STATUS_TITLE = {
  DRIVER_ACCEPTED: 'A caminho do passageiro',
  DRIVER_ARRIVING: 'No local de embarque',
  IN_PROGRESS: 'Viagem em andamento',
};

const STATUS_SUBTITLE = {
  DRIVER_ACCEPTED: 'Toque em "Cheguei" quando estiver no ponto de embarque.',
  DRIVER_ARRIVING: 'Aguardando o passageiro embarcar. Toque em "Iniciar viagem".',
  IN_PROGRESS: 'Boa viagem! Finalize quando chegar ao destino.',
};

function ActionButton({ icon, label, onClick, disabled, tone = 'brand' }) {
  const toneClass =
    tone === 'danger'
      ? 'border-red-500/60 bg-red-500/15 text-red-300 hover:bg-red-500/25'
      : tone === 'success'
        ? 'border-green-500/60 bg-green-500/15 text-green-300 hover:bg-green-500/25'
        : 'border-brand bg-brand/20 text-brand hover:bg-brand/30';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold ${toneClass} disabled:opacity-50`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function RideStatusBottomCard({
  ride,
  role,
  passengerMode = 'requester',
  embedded = false,
  onArrived,
  onStart,
  onComplete,
  onCancel,
  loading = false,
}) {
  if (!ride) return null;
  const { status } = ride;

  const title = STATUS_TITLE[status] ?? status;
  const isViewer = role !== 'DRIVER' && passengerMode === 'viewer';
  const subtitle = isViewer
    ? 'Acompanhe a rota no mapa em tempo real.'
    : STATUS_SUBTITLE[status] ?? '';

  const showCancel =
    !isViewer && ['DRIVER_ACCEPTED', 'DRIVER_ARRIVING'].includes(status);

  const roleLabel =
    role === 'DRIVER'
      ? 'Você é o motorista'
      : isViewer
        ? 'Você está na carona'
        : 'Você é o passageiro';

  return (
    <div className={embedded ? 'w-full' : 'fixed inset-x-0 bottom-24 z-30 px-4'}>
      <div className="w-full rounded-2xl border border-border-muted bg-surface-input/95 backdrop-blur-md shadow-2xl p-4 pointer-events-auto">
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wide text-text-main/55">
            {roleLabel}
          </p>
          <h3 className="text-sm font-semibold text-text-main">{title}</h3>
          {subtitle ? (
            <p className="text-xs text-text-main/65 mt-1">{subtitle}</p>
          ) : null}
        </div>

        {(ride.distanceKm != null || ride.estimatedTimeMin != null || ride.estimatedValue != null) && (
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] border-y border-border-muted/60 py-2 mb-3">
            <div>
              <p className="text-text-main/55">Dist.</p>
              <p className="font-semibold">{ride.distanceKm != null ? `${Number(ride.distanceKm).toFixed(1)} km` : '—'}</p>
            </div>
            <div>
              <p className="text-text-main/55">Tempo</p>
              <p className="font-semibold">{ride.estimatedTimeMin != null ? `${ride.estimatedTimeMin} min` : '—'}</p>
            </div>
            <div>
              <p className="text-text-main/55">Valor</p>
              <p className="font-semibold">{ride.estimatedValue != null ? `R$ ${Number(ride.estimatedValue).toFixed(2)}` : '—'}</p>
            </div>
          </div>
        )}

        {role === 'DRIVER' ? (
          <div className="flex flex-col gap-2">
            {status === 'DRIVER_ACCEPTED' && (
              <ActionButton
                icon={<FiNavigation className="h-4 w-4" />}
                label={loading ? 'Atualizando...' : 'Cheguei ao passageiro'}
                onClick={onArrived}
                disabled={loading}
              />
            )}
            {status === 'DRIVER_ARRIVING' && (
              <ActionButton
                icon={<FiPlayCircle className="h-4 w-4" />}
                label={loading ? 'Iniciando...' : 'Iniciar viagem'}
                onClick={onStart}
                disabled={loading}
              />
            )}
            {status === 'IN_PROGRESS' && (
              <ActionButton
                icon={<FiCheck className="h-4 w-4" />}
                label={loading ? 'Finalizando...' : 'Finalizar corrida'}
                onClick={onComplete}
                disabled={loading}
                tone="success"
              />
            )}
            {showCancel && (
              <ActionButton
                icon={<FiX className="h-4 w-4" />}
                label="Cancelar corrida"
                onClick={onCancel}
                disabled={loading}
                tone="danger"
              />
            )}
          </div>
        ) : !isViewer ? (
          <div className="flex flex-col gap-2">
            {status === 'IN_PROGRESS' && (
              <ActionButton
                icon={<FiCheck className="h-4 w-4" />}
                label={loading ? 'Finalizando...' : 'Finalizar corrida'}
                onClick={onComplete}
                disabled={loading}
                tone="success"
              />
            )}
            {showCancel && (
              <ActionButton
                icon={<FiX className="h-4 w-4" />}
                label="Cancelar corrida"
                onClick={onCancel}
                disabled={loading}
                tone="danger"
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
