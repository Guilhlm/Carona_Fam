import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapReadyBridge({ onMapReady }) {
  const map = useMap();
  useEffect(() => {
    onMapReady?.(map);
    return () => onMapReady?.(null);
  }, [map, onMapReady]);
  return null;
}

const SP_FALLBACK = [-23.5505, -46.6333];

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      map.invalidateSize();
    });
    return () => cancelAnimationFrame(id);
  }, [map]);
  return null;
}

/**
 * @param {{ points: [number, number][], partida: [number, number] | null, paradas: [number, number][], destino: [number, number] | null }} props
 */
function MapViewSync({ points, mapFitSuppressedRef }) {
  const map = useMap();
  useEffect(() => {
    if (mapFitSuppressedRef?.current) return;

    const valid = (points || []).filter((p) => Array.isArray(p) && p.length === 2);
    if (valid.length >= 2) {
      const bounds = L.latLngBounds(valid);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16, animate: true });
      return;
    }
    if (valid.length === 1) {
      map.setView(valid[0], 15, { animate: true });
      return;
    }
    map.setView(SP_FALLBACK, 12, { animate: false });
  }, [points, map, mapFitSuppressedRef]);
  return null;
}

export default function RideRequestMapLayer({
  partidaLatLng,
  paradaLatLngs = [],
  destinoLatLng,
  onMapReady,
  mapFitSuppressedRef,
}) {
  const points = useMemo(
    () =>
      [partidaLatLng, ...paradaLatLngs, destinoLatLng].filter(
        (p) => Array.isArray(p) && p.length === 2
      ),
    [partidaLatLng, paradaLatLngs, destinoLatLng]
  );

  const center = partidaLatLng?.length === 2
    ? partidaLatLng
    : destinoLatLng?.length === 2
      ? destinoLatLng
      : paradaLatLngs[0]?.length === 2
        ? paradaLatLngs[0]
        : SP_FALLBACK;

  const zoom = points.length > 0 ? 15 : 12;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={3}
      maxZoom={18}
      className="h-full w-full z-0 [&_.leaflet-container]:touch-none [&_.leaflet-container]:cursor-grab [&_.leaflet-grab]:cursor-grabbing"
      style={{ minHeight: '100%' }}
      attributionControl={false}
      zoomControl={false}
      scrollWheelZoom
      dragging
      touchZoom
      doubleClickZoom
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        maxZoom={18}
        maxNativeZoom={18}
      />
      <InvalidateOnMount />
      <MapReadyBridge onMapReady={onMapReady} />
      <MapViewSync points={points} mapFitSuppressedRef={mapFitSuppressedRef} />

      {partidaLatLng?.length === 2 && (
        <CircleMarker
          center={partidaLatLng}
          radius={9}
          pathOptions={{
            color: '#ffffff',
            fillColor: '#5F5FAA',
            fillOpacity: 1,
            weight: 2,
          }}
        />
      )}

      {paradaLatLngs.map((ll, idx) =>
        ll?.length === 2 ? (
          <CircleMarker
            key={`p-${idx}`}
            center={ll}
            radius={8}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#f59e0b',
              fillOpacity: 1,
              weight: 2,
            }}
          />
        ) : null
      )}

      {destinoLatLng?.length === 2 && (
        <CircleMarker
          center={destinoLatLng}
          radius={9}
          pathOptions={{
            color: '#ffffff',
            fillColor: '#22c55e',
            fillOpacity: 1,
            weight: 2,
          }}
        />
      )}
    </MapContainer>
  );
}
