import { useEffect, useRef, useState } from 'react';
import * as rideService from '../services/rideService';

export function useRideStream(rideId) {
  const [ride, setRide] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!rideId) {
      setRide(null);
      setConnected(false);
      return undefined;
    }

    let isCancelled = false;
    setConnected(false);
    setError(null);

    const eventSource = rideService.openRideStream(rideId);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('ready', () => {
      if (!isCancelled) setConnected(true);
    });

    const applyPayload = (sseEvent) => {
      try {
        const eventPayload = JSON.parse(sseEvent.data);
        if (eventPayload?.ride && !isCancelled) setRide(eventPayload.ride);
      } catch (parseError) {
        if (!isCancelled) setError(parseError);
      }
    };

    eventSource.addEventListener('snapshot', applyPayload);
    eventSource.addEventListener('update', applyPayload);

    eventSource.onerror = (streamError) => {
      if (!isCancelled) {
        setConnected(false);
        setError(streamError);
      }
    };

    return () => {
      isCancelled = true;
      try {
        eventSource.close();
      } catch (closeError) {
        eventSourceRef.current = null;
      }
      eventSourceRef.current = null;
    };
  }, [rideId]);

  return { ride, connected, error };
}

export default useRideStream;
