import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { DEFAULT_MAP_VIEWPORT_PADDING, fitMapToPoints } from '../../utils/mapViewport';
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
    const animationFrameId = requestAnimationFrame(() => {
      map.invalidateSize();
    });
    return () => cancelAnimationFrame(animationFrameId);
  }, [map]);
  return null;
}

function InvalidateOnPaddingChange({ viewportPadding }) {
  const map = useMap();
  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      map.invalidateSize();
    });
    return () => cancelAnimationFrame(animationFrameId);
  }, [map, viewportPadding]);
  return null;
}

function MapViewSync({ points, mapFitSuppressedRef, viewportPadding }) {
  const map = useMap();
  const resolvedPadding = viewportPadding ?? DEFAULT_MAP_VIEWPORT_PADDING;

  useEffect(() => {
    if (mapFitSuppressedRef?.current) return;

    const validPoints = (points || []).filter(
      (pointPair) => Array.isArray(pointPair) && pointPair.length === 2
    );
    if (validPoints.length >= 1) {
      fitMapToPoints(map, validPoints, resolvedPadding, { maxZoom: 16, animate: true });
      return;
    }
    map.setView(SP_FALLBACK, 12, { animate: false });
  }, [points, map, mapFitSuppressedRef, resolvedPadding]);

  return null;
}

export default function RideRequestMapLayer({
  originLatLng,
  stopLatLngs = [],
  destinationLatLng,
  onMapReady,
  mapFitSuppressedRef,
  viewportPadding,
}) {
  const points = useMemo(
    () =>
      [originLatLng, ...stopLatLngs, destinationLatLng].filter(
        (pointPair) => Array.isArray(pointPair) && pointPair.length === 2
      ),
    [originLatLng, stopLatLngs, destinationLatLng]
  );

  const center = originLatLng?.length === 2
    ? originLatLng
    : destinationLatLng?.length === 2
      ? destinationLatLng
      : stopLatLngs[0]?.length === 2
        ? stopLatLngs[0]
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
      <InvalidateOnPaddingChange viewportPadding={viewportPadding} />
      <MapReadyBridge onMapReady={onMapReady} />
      <MapViewSync
        points={points}
        mapFitSuppressedRef={mapFitSuppressedRef}
        viewportPadding={viewportPadding}
      />

      {originLatLng?.length === 2 && (
        <CircleMarker
          center={originLatLng}
          radius={9}
          pathOptions={{
            color: '#ffffff',
            fillColor: '#5F5FAA',
            fillOpacity: 1,
            weight: 2,
          }}
        />
      )}

      {stopLatLngs.map((stopLatLng, stopIndex) =>
        stopLatLng?.length === 2 ? (
          <CircleMarker
            key={`stop-${stopIndex}`}
            center={stopLatLng}
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

      {destinationLatLng?.length === 2 && (
        <CircleMarker
          center={destinationLatLng}
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
