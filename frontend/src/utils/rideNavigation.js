export const ACTIVE_RIDE_STATUSES = new Set([
  'WAITING_DRIVER',
  'DRIVER_ACCEPTED',
  'DRIVER_ARRIVING',
  'IN_PROGRESS',
]);

export const TERMINAL_RIDE_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

export const PICKUP_RIDE_STATUSES = ['DRIVER_ACCEPTED', 'DRIVER_ARRIVING'];

export function isActiveRideStatus(status) {
  return ACTIVE_RIDE_STATUSES.has(status);
}

export function isTerminalRideStatus(status) {
  return TERMINAL_RIDE_STATUSES.has(status);
}

export function filterHistoryRides(rides) {
  return (Array.isArray(rides) ? rides : []).filter((ride) => isTerminalRideStatus(ride.status));
}

export function filterActiveJoinedCaronas(scheduledRides) {
  return (Array.isArray(scheduledRides) ? scheduledRides : []).filter((scheduledRide) => {
    if (scheduledRide.status !== 'REQUESTED' || !scheduledRide.rideId) return false;
    const rideStatus = scheduledRide.ride?.status;
    return rideStatus && isActiveRideStatus(rideStatus);
  });
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Próximo ponto de embarque do motorista: origem do solicitante ou parada de carona mais próxima. */
export function resolveDriverPickupTarget(driverPosition, originLngLat, stopsLatLng = []) {
  const targets = [];
  if (originLngLat) {
    targets.push({ lngLat: originLngLat, label: 'origin' });
  }
  stopsLatLng.forEach((stop, index) => {
    if (stop.lat != null && stop.lng != null) {
      targets.push({
        lngLat: [stop.lng, stop.lat],
        label: stop.address || `Parada ${index + 1}`,
      });
    }
  });

  if (targets.length === 0) return null;
  if (!driverPosition) return targets[0];

  const [driverLat, driverLng] = driverPosition;
  let nearest = targets[0];
  let minDistance = Infinity;

  for (const target of targets) {
    const distance = haversineKm(driverLat, driverLng, target.lngLat[1], target.lngLat[0]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = target;
    }
  }

  return nearest;
}

export function buildPickupRouteCoords(driverPosition, pickupLngLat) {
  if (!pickupLngLat) return [];
  if (driverPosition) {
    return [[driverPosition[1], driverPosition[0]], pickupLngLat];
  }
  return [pickupLngLat];
}

/** Parada de embarque do usuário carona (mesma ordem de ride.stops / passengers). */
export function getCaronaPickupLngLat(ride, userId) {
  if (!ride?.stops?.length || !userId) return null;
  const passengerIndex = (ride.passengers || []).findIndex(
    (link) => link.passengerId === userId && link.status !== 'CANCELLED'
  );
  if (passengerIndex < 0) return null;
  const stop = ride.stops[passengerIndex];
  const lat = Number(stop?.lat);
  const lng = Number(stop?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lng, lat];
}
