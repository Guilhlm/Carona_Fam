export const SCHEDULED_RIDES_KEY = 'carona:home:scheduled-rides';

export function safeParseScheduledRides(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function leafletToHomeCoords(ll) {
  if (!Array.isArray(ll) || ll.length !== 2) return null;
  const [lat, lon] = ll.map(Number);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  return [lon, lat];
}

export function prependScheduledRide(item) {
  const stored = safeParseScheduledRides(localStorage.getItem(SCHEDULED_RIDES_KEY));
  const next = [item, ...stored];
  localStorage.setItem(SCHEDULED_RIDES_KEY, JSON.stringify(next));
  return next;
}

export function filterAvailableScheduledRides(rides) {
  return rides.filter((r) => {
    const p = Number(r.passengers);
    const passengers = Number.isFinite(p) && p > 0 ? p : 1;
    const allow = r.allowNewPassengers === true;
    return passengers > 1 || allow;
  });
  
}