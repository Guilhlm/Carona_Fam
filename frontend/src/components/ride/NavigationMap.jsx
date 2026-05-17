import { useEffect, useRef, useState } from 'react';
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    map.fitBounds(
      [
        [bounds[1], bounds[0]],
        [bounds[3], bounds[2]],
      ],
      { padding: [40, 40] }
    );
  }, [bounds, map]);
  return null;
}

function FollowUser({ position, follow }) {
  const map = useMap();
  const lastPanRef = useRef(0);

  useEffect(() => {
    if (!position || !follow) return;
    const now = Date.now();
    if (now - lastPanRef.current < 1200) return;
    lastPanRef.current = now;
    map.setView(position, Math.max(map.getZoom(), 16), { animate: true, duration: 0.4 });
  }, [position, follow, map]);

  return null;
}

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(animationFrameId);
  }, [map]);
  return null;
}

export default function NavigationMap({
  className = '',
  origin,
  destination,
  stops = [],
  routeData,
  follow = false,
  phase = 'full',
  trackUserPosition = true,
  userPosition: externalUserPosition,
}) {
  const [internalUserPosition, setInternalUserPosition] = useState(null);
  const watchIdRef = useRef(null);

  const userPosition = externalUserPosition || internalUserPosition;

  useEffect(() => {
    if (!trackUserPosition) return undefined;
    if (!('geolocation' in navigator)) return undefined;
    const watchId = navigator.geolocation.watchPosition(
      (geolocationPosition) => {
        setInternalUserPosition([
          geolocationPosition.coords.latitude,
          geolocationPosition.coords.longitude,
        ]);
      },
      () => {
        setInternalUserPosition((previousPosition) => previousPosition);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    watchIdRef.current = watchId;
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [trackUserPosition]);

  const originLatLng = Array.isArray(origin) ? [origin[1], origin[0]] : null;
  const destinationLatLng = Array.isArray(destination) ? [destination[1], destination[0]] : null;
  const stopLatLngs = stops
    .map((stopRecord) =>
      stopRecord && stopRecord.lat != null && stopRecord.lng != null
        ? [Number(stopRecord.lat), Number(stopRecord.lng)]
        : null
    )
    .filter(Boolean);

  const isPickupPhase = phase === 'pickup';
  const visibleStops = isPickupPhase ? [] : stopLatLngs;
  const visibleDestination = isPickupPhase ? null : destinationLatLng;

  const center = userPosition || originLatLng || destinationLatLng || [-22.9056, -47.0608];

  return (
    <MapContainer
      center={center}
      zoom={15}
      minZoom={3}
      maxZoom={18}
      className={`h-full w-full ${className}`.trim()}
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

      {routeData?.geometry && (
        <GeoJSON
          key={JSON.stringify(routeData.geometry.coordinates?.[0] ?? '')}
          data={routeData.geometry}
          style={{ color: '#5F5FAA', weight: 6, opacity: 0.85 }}
        />
      )}

      {!routeData && originLatLng && (visibleDestination || isPickupPhase) && (
        <Polyline
          positions={
            isPickupPhase
              ? userPosition
                ? [userPosition, originLatLng]
                : [originLatLng]
              : [originLatLng, ...visibleStops, visibleDestination].filter(Boolean)
          }
          pathOptions={{ color: '#5F5FAA', weight: 4, dashArray: '6 6', opacity: 0.8 }}
        />
      )}

      {originLatLng && (
        <CircleMarker
          center={originLatLng}
          radius={9}
          pathOptions={{ color: '#ffffff', fillColor: '#5F5FAA', fillOpacity: 1, weight: 2 }}
        />
      )}
      {visibleStops.map((stopLatLng, stopIndex) => (
        <CircleMarker
          key={`stop-${stopIndex}`}
          center={stopLatLng}
          radius={8}
          pathOptions={{ color: '#ffffff', fillColor: '#f59e0b', fillOpacity: 1, weight: 2 }}
        />
      ))}
      {visibleDestination && (
        <CircleMarker
          center={visibleDestination}
          radius={9}
          pathOptions={{ color: '#ffffff', fillColor: '#22c55e', fillOpacity: 1, weight: 2 }}
        />
      )}

      {userPosition && (
        <>
          <CircleMarker
            center={userPosition}
            radius={11}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.25, weight: 1 }}
          />
          <CircleMarker
            center={userPosition}
            radius={6}
            pathOptions={{ color: '#ffffff', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}
          />
        </>
      )}

      {!follow && routeData?.bounds && <FitBounds bounds={routeData.bounds} />}
      <FollowUser position={userPosition} follow={follow} />
    </MapContainer>
  );
}
