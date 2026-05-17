export const CAMPINAS_CENTER = {
  lat: -22.9056,
  lon: -47.0608,
};

export const SERVICE_RADIUS_KM = 67;

const EARTH_RADIUS_KM = 6371;
const KM_PER_DEGREE_LATITUDE = 111;

function distanceKm(latitudeA, longitudeA, latitudeB, longitudeB) {
  const latitudeRadiansA = (latitudeA * Math.PI) / 180;
  const latitudeRadiansB = (latitudeB * Math.PI) / 180;
  const deltaLatRadians = ((latitudeB - latitudeA) * Math.PI) / 180;
  const deltaLonRadians = ((longitudeB - longitudeA) * Math.PI) / 180;
  const haversineTerm =
    Math.sin(deltaLatRadians / 2) ** 2 +
    Math.cos(latitudeRadiansA) * Math.cos(latitudeRadiansB) * Math.sin(deltaLonRadians / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversineTerm), Math.sqrt(1 - haversineTerm));
}

function buildBoundsFromRadius() {
  const deltaLatDegrees = SERVICE_RADIUS_KM / KM_PER_DEGREE_LATITUDE;
  const deltaLonDegrees =
    SERVICE_RADIUS_KM / (KM_PER_DEGREE_LATITUDE * Math.cos((CAMPINAS_CENTER.lat * Math.PI) / 180));

  return {
    minLat: CAMPINAS_CENTER.lat - deltaLatDegrees,
    maxLat: CAMPINAS_CENTER.lat + deltaLatDegrees,
    minLon: CAMPINAS_CENTER.lon - deltaLonDegrees,
    maxLon: CAMPINAS_CENTER.lon + deltaLonDegrees,
  };
}

export const CAMPINAS_BOUNDS = buildBoundsFromRadius();

export const CAMPINAS_NOMINATIM_VIEWBOX = `${CAMPINAS_BOUNDS.minLon},${CAMPINAS_BOUNDS.minLat},${CAMPINAS_BOUNDS.maxLon},${CAMPINAS_BOUNDS.maxLat}`;

export const ADDRESS_OUT_OF_RADIUS_MESSAGE =
  'Endereço fora da área de atendimento. Escolha um local em Campinas e região (Americana, Nova Odessa, Piracicaba, etc.).';

export function isWithinCampinas(latitude, longitude) {
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);
  if (!Number.isFinite(numericLatitude) || !Number.isFinite(numericLongitude)) return false;

  return (
    distanceKm(CAMPINAS_CENTER.lat, CAMPINAS_CENTER.lon, numericLatitude, numericLongitude) <=
    SERVICE_RADIUS_KM
  );
}

export function filterLocationsInCampinas(locations) {
  if (!Array.isArray(locations)) return [];
  return locations.filter((location) =>
    isWithinCampinas(Number(location.lat), Number(location.lon))
  );
}
