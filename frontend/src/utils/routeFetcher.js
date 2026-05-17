export async function fetchOsrmRoute(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const coordinatePath = coordinates
    .map(([lng, lat]) => `${Number(lng)},${Number(lat)}`)
    .join(';');
  const requestUrl = `https://router.project-osrm.org/route/v1/driving/${coordinatePath}?geometries=geojson&overview=full`;
  try {
    const apiResponse = await fetch(requestUrl);
    if (!apiResponse.ok) return null;
    const responseBody = await apiResponse.json();
    const firstRoute = responseBody?.routes?.[0];
    if (!firstRoute) return null;
    const geometryCoordinates = firstRoute.geometry.coordinates;
    const longitudes = geometryCoordinates.map((pointPair) => pointPair[0]);
    const latitudes = geometryCoordinates.map((pointPair) => pointPair[1]);
    const boundingBox = [
      Math.min(...longitudes),
      Math.min(...latitudes),
      Math.max(...longitudes),
      Math.max(...latitudes),
    ];
    return {
      geometry: firstRoute.geometry,
      bounds: boundingBox,
      distanceKm: firstRoute.distance ? firstRoute.distance / 1000 : null,
      durationMin: firstRoute.duration ? Math.ceil(firstRoute.duration / 60) : null,
    };
  } catch (fetchError) {
    return null;
  }
}

export function buildGoogleMapsNavUrl(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const [originLng, originLat] = coordinates[0];
  const [destinationLng, destinationLat] = coordinates[coordinates.length - 1];
  const waypointParam = coordinates
    .slice(1, -1)
    .map(([lng, lat]) => `${lat},${lng}`)
    .join('|');
  const queryParams = new URLSearchParams({
    api: '1',
    origin: `${originLat},${originLng}`,
    destination: `${destinationLat},${destinationLng}`,
    travelmode: 'driving',
  });
  if (waypointParam) queryParams.set('waypoints', waypointParam);
  return `https://www.google.com/maps/dir/?${queryParams.toString()}`;
}
