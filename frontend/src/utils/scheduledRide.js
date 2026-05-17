export function isOpenScheduledRide(ride) {
  if (!ride) return false;
  const normalizedStatus = String(ride.status || 'OPEN').toUpperCase();
  return normalizedStatus === 'OPEN';
}
