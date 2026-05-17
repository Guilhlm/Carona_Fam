import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveRide } from '../../hooks/useActiveRide';
import { isCaronaViewer } from '../../utils/rideParticipant';

export default function CaronaRideRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { activeRide } = useActiveRide();

  const shouldRedirect = useMemo(
    () => isCaronaViewer(activeRide, user),
    [activeRide, user]
  );

  useEffect(() => {
    if (!activeRide || !user || !shouldRedirect) return;
    const baseRoutePath = `/home/rides/${activeRide.id}`;
    if (location.pathname.startsWith(baseRoutePath)) return;
    const targetPath =
      activeRide.status === 'WAITING_DRIVER' ? `${baseRoutePath}/waiting` : `${baseRoutePath}/active`;
    navigate(targetPath, { replace: true });
  }, [activeRide, user, shouldRedirect, location.pathname, navigate]);

  return null;
}
