import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiCheckCircle, FiFlag, FiHome, FiMapPin, FiNavigation, FiXCircle } from 'react-icons/fi';
import * as rideService from '../services/rideService';
import { useToast } from '../contexts/ToastContext';
import RideReviewSection from '../components/ride/RideReviewSection';

const ACTOR_LABEL = {
  PASSENGER: 'Passageiro',
  DRIVER: 'Motorista',
  ADMIN: 'Administração',
  SYSTEM: 'Sistema',
};

export default function RideSummaryPage() {
  const { id: rideId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    rideService
      .getRideDetail(rideId)
      .then((r) => { if (!cancelled) setRide(r); })
      .catch(() => { if (!cancelled) showToast('Corrida não encontrada.', 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [rideId, showToast]);

  if (loading) {
    return <div className="max-w-md mx-auto px-4 py-12 text-center text-text-main/70">Carregando resumo...</div>;
  }

  if (!ride) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center text-text-main">
        <p>Corrida não encontrada.</p>
      </div>
    );
  }

  const isCancelled = ride.status === 'CANCELLED';
  const finalValue = ride.actualValue ?? ride.estimatedValue;

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-text-main">
      <div className={`rounded-2xl border p-6 text-center mb-6 ${
        isCancelled
          ? 'border-red-500/60 bg-red-500/10'
          : 'border-green-500/60 bg-green-500/10'
      }`}>
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-black/30">
          {isCancelled ? (
            <FiXCircle className="h-8 w-8 text-red-400" />
          ) : (
            <FiCheckCircle className="h-8 w-8 text-green-400" />
          )}
        </div>
        <h1 className="text-lg font-semibold">
          {isCancelled ? 'Corrida cancelada' : 'Corrida concluída'}
        </h1>
        {isCancelled && ride.cancellationReason && (
          <div className="mt-3 rounded-lg bg-black/30 px-3 py-2 text-xs text-text-main/80 text-left">
            <p>
              <span className="text-text-main/55">Cancelado por: </span>
              {ACTOR_LABEL[ride.cancelledBy] ?? ride.cancelledBy ?? '—'}
            </p>
            <p className="mt-1">
              <span className="text-text-main/55">Motivo: </span>
              {ride.cancellationReason}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border-muted bg-surface-input/20 p-4 space-y-4 mb-4">
        <div className="flex gap-3">
          <FiMapPin className="mt-0.5 h-5 w-5 text-brand shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-text-main/55">Origem</p>
            <p className="text-sm truncate">{ride.origin}</p>
          </div>
        </div>
        {(ride.stops || []).map((stop, idx) => (
          <div key={stop.id ?? idx} className="flex gap-3">
            <FiNavigation className="mt-0.5 h-5 w-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-text-main/55">Parada {idx + 1}</p>
              <p className="text-sm truncate">{stop.address}</p>
            </div>
          </div>
        ))}
        <div className="flex gap-3">
          <FiFlag className="mt-0.5 h-5 w-5 text-green-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-text-main/55">Destino</p>
            <p className="text-sm truncate">{ride.destination}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border-muted bg-surface-input/20 p-4 mb-6">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="text-text-main/60">Distância</p>
            <p className="font-semibold">{ride.distanceKm != null ? `${Number(ride.distanceKm).toFixed(1)} km` : '—'}</p>
          </div>
          <div>
            <p className="text-text-main/60">Tempo est.</p>
            <p className="font-semibold">{ride.estimatedTimeMin != null ? `${ride.estimatedTimeMin} min` : '—'}</p>
          </div>
          <div>
            <p className="text-text-main/60">Valor</p>
            <p className="font-semibold">{finalValue != null ? `R$ ${Number(finalValue).toFixed(2)}` : '—'}</p>
          </div>
        </div>

        <div className="mt-4 border-t border-border-muted/60 pt-3 text-xs space-y-1">
          {ride.requester?.name && (
            <p><span className="text-text-main/55">Passageiro: </span>{ride.requester.name}</p>
          )}
          {ride.driver?.name && (
            <p><span className="text-text-main/55">Motorista: </span>{ride.driver.name}</p>
          )}
          {ride.completedAt && (
            <p>
              <span className="text-text-main/55">Concluída em: </span>
              {new Date(ride.completedAt).toLocaleString('pt-BR')}
            </p>
          )}
          {ride.cancelledAt && (
            <p>
              <span className="text-text-main/55">Cancelada em: </span>
              {new Date(ride.cancelledAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      {ride.status === 'COMPLETED' && (
        <div className="mb-6">
          <RideReviewSection rideId={ride.id} />
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate('/home', { replace: true })}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand/85"
      >
        <FiHome className="h-4 w-4" /> Voltar para a home
      </button>
    </div>
  );
}
