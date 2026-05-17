import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiExternalLink,
  FiFlag,
  FiMapPin,
  FiNavigation,
  FiPhone,
  FiUser,
} from 'react-icons/fi';
import NavigationMap from '../components/ride/NavigationMap';
import RideStatusBottomCard from '../components/ride/RideStatusBottomCard';
import CancelReasonModal from '../components/ride/CancelReasonModal';
import { useRideStream } from '../hooks/useRideStream';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import * as rideService from '../services/rideService';
import { buildGoogleMapsNavUrl, fetchOsrmRoute } from '../utils/routeFetcher';
import { getRideParticipantRole, isRideRequester } from '../utils/rideParticipant';

const PICKUP_STATUSES = ['DRIVER_ACCEPTED', 'DRIVER_ARRIVING'];

function decimalToNumber(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function RideInProgressPage() {
  const { id: rideId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [initialRide, setInitialRide] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
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
      .finally(() => { if (!cancelled) setInitialLoading(false); });
    return () => { cancelled = true; };
  }, [rideId, showToast]);

  const role = useMemo(() => getRideParticipantRole(ride, user), [ride, user]);
  const isRequester = useMemo(() => isRideRequester(ride, user?.id), [ride, user?.id]);

  const phase = useMemo(() => {
    if (!ride) return 'full';
    if (role === 'DRIVER' && PICKUP_STATUSES.includes(ride.status)) return 'pickup';
    return 'trip';
  }, [ride, role]);

  useEffect(() => {
    if (role !== 'DRIVER' || phase !== 'pickup') {
      setDriverPosition(null);
      return undefined;
    }
    if (!('geolocation' in navigator)) return undefined;
    const watchId = navigator.geolocation.watchPosition(
      (geolocationPosition) =>
        setDriverPosition([geolocationPosition.coords.latitude, geolocationPosition.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    watchIdRef.current = watchId;
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [role, phase]);

  const { originLngLat, destinationLngLat, stopsLatLng, mapStops, routeCoords } = useMemo(() => {
    const empty = {
      originLngLat: null,
      destinationLngLat: null,
      stopsLatLng: [],
      mapStops: [],
      routeCoords: [],
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
      };
    }

    return {
      originLngLat: o,
      destinationLngLat: d,
      stopsLatLng: ss,
      mapStops: ss,
      routeCoords: [o, ...ss.map((s) => [s.lng, s.lat]), d],
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
    if (
      ride.status === 'WAITING_DRIVER' &&
      (ride.requesterId === user?.id || role === 'CARONA')
    ) {
      navigate(`/home/rides/${ride.id}/waiting`, { replace: true });
    } else if (ride.status === 'COMPLETED') {
      navigate(`/home/rides/${ride.id}/summary`, { replace: true });
    } else if (ride.status === 'CANCELLED') {
      showToast('Corrida cancelada.', 'info');
      navigate(`/home/rides/${ride.id}/summary`, { replace: true });
    }
  }, [ride, navigate, user, role, showToast]);

  const handleTransition = async (nextStatus, successMessage) => {
    setActionLoading(true);
    try {
      await rideService.transitionRideStatus(rideId, nextStatus);
      if (successMessage) showToast(successMessage, 'success');
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao atualizar status.';
      showToast(message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async (reason) => {
    setCancelLoading(true);
    try {
      await rideService.cancelRideWithReason(rideId, reason);
      showToast('Corrida cancelada.', 'success');
      navigate('/home', { replace: true });
    } catch (err) {
      const message = err?.response?.data?.error || 'Erro ao cancelar a corrida.';
      showToast(message, 'error');
    } finally {
      setCancelLoading(false);
      setShowCancel(false);
    }
  };

  if (initialLoading && !ride) {
    return <div className="max-w-md mx-auto px-4 py-12 text-center text-text-main/70">Carregando corrida...</div>;
  }

  if (!ride) {
    return <div className="max-w-md mx-auto px-4 py-12 text-center text-text-main">Corrida não encontrada.</div>;
  }

  const otherParty =
    role === 'DRIVER' ? ride.requester : ride.driver;
  const otherPartyLabel =
    role === 'DRIVER' ? 'Passageiro' : 'Motorista';

  return (
    <div className="relative min-h-[calc(100dvh-6rem)] text-text-main">
      <CancelReasonModal
        open={showCancel}
        role={role || 'PASSENGER'}
        loading={cancelLoading}
        onClose={() => setShowCancel(false)}
        onConfirm={handleConfirmCancel}
      />

      <div className="fixed inset-x-0 top-0 bottom-72 z-0">
        <NavigationMap
          origin={originLngLat}
          destination={destinationLngLat}
          stops={mapStops}
          routeData={routeData}
          phase={phase}
          userPosition={driverPosition}
          trackUserPosition={role === 'PASSENGER' || role === 'CARONA'}
        />
      </div>

      <div className="relative z-10 px-4 pt-6 pb-72">
        <div className="rounded-2xl border border-border-muted bg-surface-input/90 backdrop-blur-md p-4 max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-full bg-brand/20 border border-brand flex items-center justify-center">
              <FiUser className="h-5 w-5 text-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wide text-text-main/55">{otherPartyLabel}</p>
              <p className="text-sm font-semibold truncate">{otherParty?.name ?? '—'}</p>
            </div>
            {otherParty?.phone && (
              <a
                href={`tel:${otherParty.phone}`}
                className="inline-flex items-center gap-1 rounded-lg border border-brand bg-brand/15 px-3 py-1.5 text-xs font-medium text-brand"
              >
                <FiPhone className="h-3 w-3" /> Ligar
              </a>
            )}
          </div>

          {phase === 'pickup' && role === 'DRIVER' && (
            <p className="mb-2 text-xs text-brand/90">
              Indo buscar o passageiro. A rota será atualizada após embarque.
            </p>
          )}

          <div className="space-y-3">
            <div className="flex gap-2">
              <FiMapPin className="mt-0.5 h-4 w-4 text-brand shrink-0" />
              <p className="text-xs truncate">{ride.origin}</p>
            </div>
            {phase !== 'pickup' &&
              stopsLatLng.map((stop, idx) => (
                <div key={ride.stops?.[idx]?.id ?? idx} className="flex gap-2">
                  <FiNavigation className="mt-0.5 h-4 w-4 text-amber-400 shrink-0" />
                  <p className="text-xs truncate">{stop.address}</p>
                </div>
              ))}
            <div className="flex gap-2">
              <FiFlag className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
              <p className="text-xs truncate">{ride.destination}</p>
            </div>
          </div>

          {role === 'DRIVER' && routeCoords.length >= 2 && (
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => navigate(`/home/rides/${rideId}/navigate`)}
                className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand/85"
              >
                Navegar no app
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = buildGoogleMapsNavUrl(routeCoords);
                  if (url) window.open(url, '_blank', 'noopener');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-text-main/65 hover:text-text-main"
              >
                <FiExternalLink className="h-3 w-3" /> Abrir no Google Maps
              </button>
            </div>
          )}
        </div>
      </div>

      <RideStatusBottomCard
        ride={ride}
        role={role === 'CARONA' ? 'PASSENGER' : role}
        passengerMode={isRequester ? 'requester' : 'viewer'}
        loading={actionLoading}
        onArrived={() => handleTransition('DRIVER_ARRIVING', 'Chegada confirmada.')}
        onStart={() => handleTransition('IN_PROGRESS', 'Viagem iniciada.')}
        onComplete={() => handleTransition('COMPLETED', 'Corrida finalizada.')}
        onCancel={() => setShowCancel(true)}
      />
    </div>
  );
}
