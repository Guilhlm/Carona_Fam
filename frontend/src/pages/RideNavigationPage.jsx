import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCrosshair, FiExternalLink } from 'react-icons/fi';
import NavigationMap from '../components/ride/NavigationMap';
import * as rideService from '../services/rideService';
import { useRideStream } from '../hooks/useRideStream';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { buildGoogleMapsNavUrl, fetchOsrmRoute } from '../utils/routeFetcher';

const PICKUP_STATUSES = ['DRIVER_ACCEPTED', 'DRIVER_ARRIVING'];

function decimalToNumber(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function RideNavigationPage() {
  const { id: rideId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [initialRide, setInitialRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [follow, setFollow] = useState(true);
  const [driverPosition, setDriverPosition] = useState(null);
  const watchIdRef = useRef(null);
  const { ride: streamedRide } = useRideStream(rideId);

  const ride = streamedRide || initialRide;

  useEffect(() => {
    let cancelled = false;
    rideService
      .getRideDetail(rideId)
      .then((r) => { if (!cancelled) setInitialRide(r); })
      .catch(() => { if (!cancelled) showToast('Corrida não encontrada.', 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [rideId, showToast]);

  const role = useMemo(() => {
    if (!ride || !user) return null;
    if (ride.driverId === user.id) return 'DRIVER';
    if (ride.requesterId === user.id) return 'PASSENGER';
    return null;
  }, [ride, user]);

  const phase = useMemo(() => {
    if (!ride) return 'full';
    if (role === 'DRIVER' && PICKUP_STATUSES.includes(ride.status)) return 'pickup';
    return 'trip';
  }, [ride, role]);

  useEffect(() => {
    if (!('geolocation' in navigator)) return undefined;
    const id = navigator.geolocation.watchPosition(
      (pos) => setDriverPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    watchIdRef.current = id;
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const { originLngLat, destinationLngLat, stopsLatLng, mapStops, routeCoords, nextLabel } = useMemo(() => {
    const empty = {
      originLngLat: null,
      destinationLngLat: null,
      stopsLatLng: [],
      mapStops: [],
      routeCoords: [],
      nextLabel: '',
    };
    if (!ride) return empty;

    const oLng = decimalToNumber(ride.originLng);
    const oLat = decimalToNumber(ride.originLat);
    const dLng = decimalToNumber(ride.destinationLng);
    const dLat = decimalToNumber(ride.destinationLat);
    if (oLng == null || oLat == null || dLng == null || dLat == null) return empty;

    const o = [oLng, oLat];
    const d = [dLng, dLat];
    const ss = (ride.stops || [])
      .map((s) => ({ lat: decimalToNumber(s.lat), lng: decimalToNumber(s.lng), address: s.address }))
      .filter((s) => s.lat != null && s.lng != null);

    if (phase === 'pickup') {
      const coords = driverPosition
        ? [[driverPosition[1], driverPosition[0]], o]
        : [o];
      return {
        originLngLat: o,
        destinationLngLat: d,
        stopsLatLng: ss,
        mapStops: [],
        routeCoords: coords,
        nextLabel: `Buscar passageiro em ${ride.origin}`,
      };
    }

    return {
      originLngLat: o,
      destinationLngLat: d,
      stopsLatLng: ss,
      mapStops: ss,
      routeCoords: [o, ...ss.map((s) => [s.lng, s.lat]), d],
      nextLabel: ss[0]?.address || ride.destination,
    };
  }, [ride, phase, driverPosition]);

  useEffect(() => {
    let cancelled = false;
    if (routeCoords.length < 2) {
      setRouteData(null);
      return undefined;
    }
    fetchOsrmRoute(routeCoords).then((data) => {
      if (!cancelled && data) setRouteData(data);
    });
    return () => { cancelled = true; };
  }, [routeCoords]);

  useEffect(() => {
    if (!ride) return;
    if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
      navigate(`/home/rides/${ride.id}/summary`, { replace: true });
    }
  }, [ride, navigate]);

  if (loading || !ride) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black text-text-main">
        Carregando navegação...
      </div>
    );
  }

  const handleOpenGoogleMaps = () => {
    const url = buildGoogleMapsNavUrl(routeCoords);
    if (url) window.open(url, '_blank', 'noopener');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black">
      <header className="relative z-[2] flex shrink-0 items-start gap-2 border-b border-border-muted/50 bg-black/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate(`/home/rides/${rideId}/active`)}
          className="inline-flex items-center gap-2 rounded-xl border border-border-muted bg-surface-input/80 px-3 py-2 text-sm text-text-main"
        >
          <FiArrowLeft className="h-4 w-4" /> Voltar
        </button>
        {phase === 'pickup' && (
          <span className="ml-auto self-center rounded-full bg-brand/20 border border-brand/40 px-3 py-1 text-[11px] font-medium text-brand">
            Indo buscar passageiro
          </span>
        )}
      </header>

      <div className="relative z-[1] min-h-0 flex-1">
        <NavigationMap
          className="absolute inset-0 h-full w-full"
          origin={originLngLat}
          destination={destinationLngLat}
          stops={mapStops}
          routeData={routeData}
          follow={follow}
          phase={phase}
          userPosition={driverPosition}
          trackUserPosition={false}
        />
      </div>

      <footer className="relative z-[2] shrink-0 space-y-2 border-t border-border-muted/50 bg-black/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setFollow((v) => !v)}
          className="mx-auto flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-medium text-white shadow-lg"
        >
          <FiCrosshair className="h-4 w-4" />
          {follow ? 'Seguindo sua posição' : 'Tocar para seguir'}
        </button>
        <div className="rounded-xl border border-border-muted bg-surface-input/95 px-4 py-3 text-xs text-text-main">
          <p className="text-[10px] uppercase tracking-wide text-text-main/55 mb-1">Próximo destino</p>
          <p className="font-semibold truncate">{nextLabel}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-text-main/55">Dist.</p>
              <p className="font-semibold">{ride.distanceKm != null ? `${Number(ride.distanceKm).toFixed(1)} km` : '—'}</p>
            </div>
            <div>
              <p className="text-text-main/55">Tempo</p>
              <p className="font-semibold">{ride.estimatedTimeMin != null ? `${ride.estimatedTimeMin} min` : '—'}</p>
            </div>
            <div>
              <p className="text-text-main/55">Valor</p>
              <p className="font-semibold">{ride.estimatedValue != null ? `R$ ${Number(ride.estimatedValue).toFixed(2)}` : '—'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenGoogleMaps}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-text-main/55 hover:text-text-main/80"
          >
            <FiExternalLink className="h-3 w-3" /> Abrir no Google Maps
          </button>
        </div>
      </footer>
    </div>
  );
}
