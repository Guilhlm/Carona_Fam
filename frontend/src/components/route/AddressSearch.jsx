import { useState, useEffect } from 'react';
import {
  ADDRESS_OUT_OF_RADIUS_MESSAGE,
  isWithinCampinas,
} from '../../utils/campinasGeo';
import { formatSuggestionAddress, searchAddresses } from '../../utils/nominatim';

export default function AddressSearch({ placeholder, onAddressSelected, onOutOfRadius }) {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [radiusError, setRadiusError] = useState('');

  useEffect(() => {
    if (search.length < 3) {
      setSuggestions([]);
      setRadiusError('');
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setRadiusError('');
      try {
        const locations = await searchAddresses(search);
        setSuggestions(locations.slice(0, 5));
      } catch (error) {
        console.error('Erro ao buscar endereço:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const notifyOutOfRadius = () => {
    setRadiusError(ADDRESS_OUT_OF_RADIUS_MESSAGE);
    onOutOfRadius?.(ADDRESS_OUT_OF_RADIUS_MESSAGE);
  };

  const selectAddress = (location) => {
    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lon);

    if (!isWithinCampinas(lat, lon)) {
      notifyOutOfRadius();
      return;
    }

    const cleanAddress = formatSuggestionAddress(location);

    setSearch(cleanAddress);
    setSuggestions([]);
    setIsFocused(false);
    setRadiusError('');

    onAddressSelected([lon, lat]);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setRadiusError('');
        }}
        onFocus={() => setIsFocused(true)}
        style={{
          padding: '10px',
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: '4px',
          border: radiusError ? '1px solid #e53e3e' : '1px solid #ccc',
        }}
      />

      {radiusError && (
        <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#e53e3e' }}>{radiusError}</p>
      )}

      {isFocused && suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            listStyle: 'none',
            padding: 0,
            margin: '5px 0 0 0',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          {loading && (
            <li style={{ padding: '10px', color: '#666', fontSize: '13px' }}>
              Buscando...
            </li>
          )}

          {suggestions.map((location) => {
            const shortAddress = formatSuggestionAddress(location);
            const city =
              location.address?.city ||
              location.address?.town ||
              location.address?.village ||
              '';

            return (
              <li
                key={location.place_id}
                onClick={() => selectAddress(location)}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = '#f3f4f6')
                }
                onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
              >
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  {shortAddress}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>
                  {city}{' '}
                  {location.address?.state ? `- ${location.address.state}` : ''}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
