import { useCallback, useEffect, useRef, useState } from 'react';
import * as rideService from '../services/rideService';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_DRIVER, isAdminUser } from '../utils/roles';

export function useOpenRides({ enabled = true } = {}) {
  const { user, isAuthenticated } = useAuth();
  const isDriverOrAdmin = user?.role === ROLE_DRIVER || isAdminUser(user);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const eventSourceRef = useRef(null);

  const fetchInitial = useCallback(async () => {
    if (!enabled || !isAuthenticated || !isDriverOrAdmin) {
      setRides([]);
      return;
    }
    setLoading(true);
    try {
      const openRidesList = await rideService.listOpenRides();
      setRides(Array.isArray(openRidesList) ? openRidesList : []);
    } catch (fetchError) {
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, isAuthenticated, isDriverOrAdmin]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !isDriverOrAdmin) return undefined;

    const eventSource = rideService.openOpenRidesStream();
    eventSourceRef.current = eventSource;

    const handleSnapshot = (sseEvent) => {
      try {
        const snapshotPayload = JSON.parse(sseEvent.data);
        if (Array.isArray(snapshotPayload?.rides)) setRides(snapshotPayload.rides);
      } catch (parseError) {
        setRides((previousRides) => previousRides);
      }
    };

    const handleUpdate = (sseEvent) => {
      try {
        const updatePayload = JSON.parse(sseEvent.data);
        if (!updatePayload) return;
        if (updatePayload.type === 'created' && updatePayload.ride) {
          setRides((previousRides) => {
            if (previousRides.some((rideRecord) => rideRecord.id === updatePayload.ride.id)) {
              return previousRides;
            }
            return [...previousRides, updatePayload.ride];
          });
        } else if (updatePayload.type === 'accepted' || updatePayload.type === 'removed') {
          const removedRideId = updatePayload.rideId ?? updatePayload.ride?.id;
          if (removedRideId) {
            setRides((previousRides) =>
              previousRides.filter((rideRecord) => rideRecord.id !== removedRideId)
            );
          }
        }
      } catch (parseError) {
        setRides((previousRides) => previousRides);
      }
    };

    eventSource.addEventListener('snapshot', handleSnapshot);
    eventSource.addEventListener('update', handleUpdate);

    return () => {
      try {
        eventSource.close();
      } catch (closeError) {
        eventSourceRef.current = null;
      }
      eventSourceRef.current = null;
    };
  }, [enabled, isAuthenticated, isDriverOrAdmin]);

  return { rides, loading, refresh: fetchInitial };
}

export default useOpenRides;
