export function formatSuggestionAddress(location) {
  const ad = location.address || {};
  const street = ad.road || ad.pedestrian || location.display_name?.split(',')[0] || 'Endereço';
  const number = ad.house_number ? `, ${ad.house_number}` : '';
  const neighborhood = ad.neighbourhood || ad.suburb || '';
  return `${street}${number}${neighborhood ? ` - ${neighborhood}` : ''}`;
}

/**
 * Busca endereços no Brasil enquanto o usuário digita.
 * @param {string} query
 * @returns {Promise<object[]>}
 */
export async function searchAddresses(query) {
  const q = query.trim();
  if (q.length < 3) return [];

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
      q
    )}&countrycodes=br&limit=8`,
    {
      headers: {
        'Accept-Language': 'pt-BR',
      },
    }
  );

  if (!response.ok) return [];

  const data = await response.json();
  const unique = new Set();

  const filtered = (Array.isArray(data) ? data : []).filter((location) => {
    const label = formatSuggestionAddress(location);
    if (unique.has(label)) return false;
    unique.add(label);
    return true;
  });

  return filtered.slice(0, 8);
}

export async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=pt-BR`,
    { headers: { 'Accept-Language': 'pt-BR' } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.display_name || null;
}
