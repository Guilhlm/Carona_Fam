import {
  CAMPINAS_NOMINATIM_VIEWBOX,
  filterLocationsInCampinas,
} from './campinasGeo';

export function formatSuggestionAddress(location) {
  const addressData = location.address || {};
  const streetName =
    addressData.road || addressData.pedestrian || location.display_name?.split(',')[0] || 'Endereço';
  const houseNumberSuffix = addressData.house_number ? `, ${addressData.house_number}` : '';
  const neighborhoodName = addressData.neighbourhood || addressData.suburb || '';
  return `${streetName}${houseNumberSuffix}${neighborhoodName ? ` - ${neighborhoodName}` : ''}`;
}

export async function searchAddresses(query) {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 3) return [];

  const apiResponse = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
      trimmedQuery
    )}&countrycodes=br&viewbox=${CAMPINAS_NOMINATIM_VIEWBOX}&bounded=1&limit=12`,
    {
      headers: {
        'Accept-Language': 'pt-BR',
      },
    }
  );

  if (!apiResponse.ok) return [];

  const rawLocations = await apiResponse.json();
  const seenLabels = new Set();

  const locationsInCampinas = filterLocationsInCampinas(Array.isArray(rawLocations) ? rawLocations : []);

  const uniqueLocations = locationsInCampinas.filter((location) => {
    const formattedLabel = formatSuggestionAddress(location);
    if (seenLabels.has(formattedLabel)) return false;
    seenLabels.add(formattedLabel);
    return true;
  });

  return uniqueLocations.slice(0, 8);
}

export async function reverseGeocode(latitude, longitude) {
  const apiResponse = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`,
    { headers: { 'Accept-Language': 'pt-BR' } }
  );
  if (!apiResponse.ok) return null;
  const responseBody = await apiResponse.json();
  return responseBody.display_name || null;
}
