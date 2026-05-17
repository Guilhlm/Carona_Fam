import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { useActiveRide } from '../../hooks/useActiveRide';
import { useAuth } from '../../contexts/AuthContext';
import { getRideParticipantRole } from '../../utils/rideParticipant';

const STATUS_LABEL = {
  WAITING_DRIVER: 'Procurando motorista',
  DRIVER_ACCEPTED: 'Motorista a caminho',
  DRIVER_ARRIVING: 'Motorista chegou',
  IN_PROGRESS: 'Viagem em andamento',
};

export default function ActiveRideBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeRide } = useActiveRide();
  const participantRole = useMemo(
    () => getRideParticipantRole(activeRide, user),
    [activeRide, user]
  );

  if (!activeRide) return null;

  const targetPath =
    activeRide.status === 'WAITING_DRIVER'
      ? `/home/rides/${activeRide.id}/waiting`
      : `/home/rides/${activeRide.id}/active`;

  return (
    <button
      type="button"
      onClick={() => navigate(targetPath)}
      className="mb-4 flex w-full items-center justify-between gap-3 rounded-xl border border-brand bg-brand/15 px-4 py-3 text-left text-text-main hover:bg-brand/25 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-brand">
          {participantRole === 'CARONA' ? 'Sua carona · ' : ''}
          {STATUS_LABEL[activeRide.status] ?? activeRide.status}
        </p>
        <p className="text-sm truncate">
          {activeRide.origin} → {activeRide.destination}
        </p>
      </div>
      <FiArrowRight className="h-5 w-5 text-brand shrink-0" />
    </button>
  );
}
