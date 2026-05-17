import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as rideService from '../services/rideService';
import * as scheduledRideService from '../services/scheduledRideService';
import { useAuth } from './AuthContext';
import { useRideStream } from '../hooks/useRideStream';
import { inferParticipationRole } from '../utils/rideParticipant';

const ActiveRideContext = createContext(null);

const ACTIVE_STATUSES = new Set([
  'WAITING_DRIVER',
  'DRIVER_ACCEPTED',
  'DRIVER_ARRIVING',
  'IN_PROGRESS',
]);

function isActiveRide(ride) {
  return Boolean(ride && ACTIVE_STATUSES.has(ride.status));
}

export function ActiveRideProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setActiveRide(null);
      return null;
    }
    setLoading(true);
    try {
      let resolvedRide = await rideService.getMyActiveRide();
      if (!isActiveRide(resolvedRide)) {
        const joinedScheduledRides = await scheduledRideService.listJoinedScheduledRides();
        const requestedScheduledRide = (Array.isArray(joinedScheduledRides) ? joinedScheduledRides : []).find(
          (scheduledRow) => scheduledRow.status === 'REQUESTED' && scheduledRow.rideId
        );
        if (requestedScheduledRide?.rideId) {
          try {
            resolvedRide = await rideService.getRideDetail(requestedScheduledRide.rideId);
          } catch (rideDetailError) {
            resolvedRide = null;
          }
        }
      } else if (resolvedRide?.id) {
        try {
          resolvedRide = await rideService.getRideDetail(resolvedRide.id);
        } catch (rideDetailError) {
          resolvedRide = resolvedRide;
        }
      }

      const nextActiveRide = isActiveRide(resolvedRide) ? resolvedRide : null;
      setActiveRide(nextActiveRide);
      return nextActiveRide;
    } catch (refreshError) {
      setActiveRide(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const pollInterval = setInterval(refresh, 5000);
    const handleWindowFocus = () => refresh();
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isAuthenticated, refresh]);

  const { ride: streamRide } = useRideStream(activeRide?.id);

  useEffect(() => {
    if (!streamRide) return;
    if (!ACTIVE_STATUSES.has(streamRide.status)) {
      setActiveRide(null);
      return;
    }
    setActiveRide((previousActiveRide) => {
      const participationRole =
        streamRide.participationRole ||
        previousActiveRide?.participationRole ||
        inferParticipationRole(streamRide, user);
      return participationRole
        ? { ...streamRide, participationRole }
        : streamRide;
    });
  }, [streamRide, user]);

  const contextValue = useMemo(
    () => ({ activeRide, loading, refresh }),
    [activeRide, loading, refresh]
  );

  return (
    <ActiveRideContext.Provider value={contextValue}>{children}</ActiveRideContext.Provider>
  );
}

export function useActiveRide() {
  const contextValue = useContext(ActiveRideContext);
  if (!contextValue) {
    throw new Error('useActiveRide must be used within ActiveRideProvider');
  }
  return contextValue;
}

export default ActiveRideContext;
