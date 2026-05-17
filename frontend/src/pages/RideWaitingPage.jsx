import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiLoader, FiMapPin, FiNavigation, FiFlag } from 'react-icons/fi';
import * as rideService from '../services/rideService';
import { useRideStream } from '../hooks/useRideStream';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import CancelReasonModal from '../components/ride/CancelReasonModal';
import { getRideParticipantRole, isRideRequester } from '../utils/rideParticipant';

function statusToHuman(status) {
  switch (status) {
    case 'WAITING_DRIVER': return 'Procurando motorista...';
    case 'DRIVER_ACCEPTED': return 'Motorista a caminho!';
    case 'DRIVER_ARRIVING': return 'Motorista chegou ao local!';
    case 'IN_PROGRESS': return 'Em viagem';
    case 'COMPLETED': return 'Corrida finalizada';
    case 'CANCELLED': return 'Corrida cancelada';
    default: return status;
  }
}

export default function RideWaitingPage() {
  const { id: rideId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [initialRide, setInitialRide] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { ride: streamedRide } = useRideStream(rideId);

  useEffect(() => {
    let cancelled = false;
    rideService
      .getRideDetail(rideId)
      .then((r) => { if (!cancelled) setInitialRide(r); })
      .catch(() => { if (!cancelled) showToast('Não foi possível carregar a corrida.', 'error'); })
      .finally(() => { if (!cancelled) setInitialLoading(false); });
    return () => { cancelled = true; };
  }, [rideId, showToast]);

  const ride = streamedRide || initialRide;
  const participantRole = useMemo(() => getRideParticipantRole(ride, user), [ride, user]);
  const isRequester = useMemo(() => isRideRequester(ride, user?.id), [ride, user?.id]);

  useEffect(() => {
    if (!ride) return;
    if (ride.status === 'DRIVER_ACCEPTED' || ride.status === 'DRIVER_ARRIVING' || ride.status === 'IN_PROGRESS') {
      navigate(`/home/rides/${ride.id}/active`, { replace: true });
    } else if (ride.status === 'COMPLETED') {
      navigate(`/home/rides/${ride.id}/summary`, { replace: true });
    } else if (ride.status === 'CANCELLED') {
      showToast('Corrida cancelada.', 'info');
      navigate('/home', { replace: true });
    }
  }, [ride, navigate, showToast]);

  const stopsLabels = useMemo(
    () => (Array.isArray(ride?.stops) ? ride.stops.map((s) => s.address) : []),
    [ride]
  );

  const handleConfirmCancel = async (reason) => {
    setCancelling(true);
    try {
      await rideService.cancelRideWithReason(rideId, reason);
      showToast('Corrida cancelada.', 'success');
      navigate('/home', { replace: true });
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao cancelar a corrida.';
      showToast(message, 'error');
    } finally {
      setCancelling(false);
      setShowCancel(false);
    }
  };

  if (initialLoading && !ride) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center text-text-main">
        <FiLoader className="mx-auto mb-3 h-8 w-8 animate-spin text-brand" />
        <p className="text-sm text-text-main/70">Carregando sua corrida...</p>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center text-text-main">
        <p className="text-sm text-text-main/70">Corrida não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 text-text-main">
      <CancelReasonModal
        open={showCancel}
        role="PASSENGER"
        loading={cancelling}
        onClose={() => setShowCancel(false)}
        onConfirm={handleConfirmCancel}
      />

      <div className="rounded-2xl border border-border-muted bg-surface-input/30 p-6 text-center mb-6">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand/20 border border-brand">
          <FiLoader className="h-7 w-7 animate-spin text-brand" />
        </div>
        <h1 className="text-lg font-semibold">{statusToHuman(ride.status)}</h1>
        <p className="text-xs text-text-main/70 mt-1">
          {participantRole === 'CARONA'
            ? 'Você acompanha esta carona. Avisaremos quando um motorista aceitar.'
            : 'Te avisaremos assim que um motorista aceitar.'}
        </p>
      </div>

      <div className="rounded-2xl border border-border-muted bg-surface-input/20 p-4 space-y-4 mb-6">
        <div className="flex gap-3">
          <FiMapPin className="mt-0.5 h-5 w-5 text-brand shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-text-main/55">Origem</p>
            <p className="text-sm truncate">{ride.origin}</p>
          </div>
        </div>
        {stopsLabels.map((label, idx) => (
          <div key={idx} className="flex gap-3">
            <FiNavigation className="mt-0.5 h-5 w-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-text-main/55">Parada {idx + 1}</p>
              <p className="text-sm truncate">{label}</p>
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

        {(ride.distanceKm != null || ride.estimatedTimeMin != null || ride.estimatedValue != null) && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-muted/60 text-center text-xs">
            <div>
              <p className="text-text-main/60">Distância</p>
              <p className="font-semibold">{ride.distanceKm != null ? `${Number(ride.distanceKm).toFixed(1)} km` : '—'}</p>
            </div>
            <div>
              <p className="text-text-main/60">Tempo</p>
              <p className="font-semibold">{ride.estimatedTimeMin != null ? `${ride.estimatedTimeMin} min` : '—'}</p>
            </div>
            <div>
              <p className="text-text-main/60">Valor est.</p>
              <p className="font-semibold">{ride.estimatedValue != null ? `R$ ${Number(ride.estimatedValue).toFixed(2)}` : '—'}</p>
            </div>
          </div>
        )}
      </div>

      {isRequester ? (
        <button
          type="button"
          onClick={() => setShowCancel(true)}
          className="w-full rounded-xl border border-red-500/60 bg-red-500/10 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/20"
        >
          Cancelar solicitação
        </button>
      ) : null}
    </div>
  );
}
