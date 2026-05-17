import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMapViewportPadding } from '../hooks/useMapViewportPadding';
import { useNavigate, useParams } from 'react-router-dom';
import { FiFlag, FiMapPin, FiNavigation, FiPhone, FiUser } from 'react-icons/fi';
import NavigationMap from '../components/ride/NavigationMap';
import RideStatusBottomCard from '../components/ride/RideStatusBottomCard';
import CancelReasonModal from '../components/ride/CancelReasonModal';
import TemporaryDismissCard from '../components/ride/TemporaryDismissCard';
import RideNavigationChoiceCard from '../components/ride/RideNavigationChoiceCard';
import { useRideStream } from '../hooks/useRideStream';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import * as rideService from '../services/rideService';
import { buildGoogleMapsNavUrl, fetchOsrmRoute } from '../utils/routeFetcher';
import { getRideParticipantRole, isRideRequester } from '../utils/rideParticipant';
import {
  PICKUP_RIDE_STATUSES,
  buildPickupRouteCoords,
  getCaronaPickupLngLat,
  resolveDriverPickupTarget,
} from '../utils/rideNavigation';

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
  const [navMode, setNavMode] = useState(null);
  const [driverPosition, setDriverPosition] = useState(null);
  const [viewerPosition, setViewerPosition] = useState(null);
  const watchIdRef = useRef(null);
  const viewerWatchIdRef = useRef(null);
  const mapContainerRef = useRef(null);
  const topPanelEndRef = useRef(null);
  const bottomPanelStartRef = useRef(null);
  const mapViewportPadding = useMapViewportPadding(
    mapContainerRef,
    topPanelEndRef,
    bottomPanelStartRef
  );

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
    if (PICKUP_RIDE_STATUSES.includes(ride.status)) {
      if (role === 'DRIVER' || role === 'CARONA') return 'pickup';
    }
    return 'trip';
  }, [ride, role]);

  const navChoiceResetKey = `${rideId}-${phase}-${ride?.status ?? ''}`;

  useEffect(() => {
    if (role !== 'DRIVER') {
      setNavMode(null);
      return;
    }
    setNavMode(null);
  }, [navChoiceResetKey, role]);

  useEffect(() => {
    if (role !== 'DRIVER') {
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
  }, [role]);

  useEffect(() => {
    if (role !== 'CARONA' || phase !== 'pickup') {
      setViewerPosition(null);
      return undefined;
    }
    if (!('geolocation' in navigator)) return undefined;
    const watchId = navigator.geolocation.watchPosition(
      (geolocationPosition) =>
        setViewerPosition([
          geolocationPosition.coords.latitude,
          geolocationPosition.coords.longitude,
        ]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    viewerWatchIdRef.current = watchId;
    return () => {
      if (viewerWatchIdRef.current != null) {
        navigator.geolocation.clearWatch(viewerWatchIdRef.current);
        viewerWatchIdRef.current = null;
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

    const fullTripRoute = {
      originLngLat: o,
      destinationLngLat: d,
      stopsLatLng: ss,
      mapStops: ss,
      routeCoords: [o, ...ss.map((s) => [s.lng, s.lat]), d],
    };

    if (role === 'DRIVER' && navMode === 'app') {
      return fullTripRoute;
    }

    if (phase === 'pickup') {
      if (role === 'CARONA') {
        const caronaPickup = getCaronaPickupLngLat(ride, user?.id);
        const pickupTarget = caronaPickup || o;
        return {
          originLngLat: pickupTarget,
          destinationLngLat: d,
          stopsLatLng: ss,
          mapStops: [],
          routeCoords: buildPickupRouteCoords(viewerPosition, pickupTarget),
        };
      }

      const nearestPickup = resolveDriverPickupTarget(driverPosition, o, ss);
      const pickupTarget = nearestPickup?.lngLat || o;
      return {
        originLngLat: pickupTarget,
        destinationLngLat: d,
        stopsLatLng: ss,
        mapStops: [],
        routeCoords: buildPickupRouteCoords(driverPosition, pickupTarget),
      };
    }

    return fullTripRoute;
  }, [ride, phase, driverPosition, viewerPosition, role, user?.id, navMode]);

  const mapPhase = role === 'DRIVER' && navMode === 'app' ? 'trip' : phase;

  useEffect(() => {
    let cancelled = false;
    const shouldFetchOsrm =
      routeCoords.length >= 2 && (navMode === 'app' || (role !== 'DRIVER' && role != null));
    if (!shouldFetchOsrm) {
      setRouteData(null);
      return undefined;
    }
    fetchOsrmRoute(routeCoords).then((data) => {
      if (!cancelled && data) setRouteData(data);
    });
    return () => {
      cancelled = true;
    };
  }, [routeCoords, navMode, role]);

  const routeDisplay = useMemo(() => {
    if (role === 'DRIVER') {
      if (navMode === 'app') return 'primary';
      if (navMode === 'google') return 'secondary';
      return 'none';
    }
    return 'primary';
  }, [role, navMode]);

  const handleChooseAppNav = useCallback(() => {
    setNavMode('app');
  }, []);

  const handleChooseGoogleNav = useCallback(() => {
    setNavMode('google');
    const url = buildGoogleMapsNavUrl(routeCoords);
    if (url) {
      window.open(url, '_blank', 'noopener');
    } else {
      showToast('Não foi possível abrir o Google Maps.', 'error');
    }
  }, [routeCoords, showToast]);

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
    <div className="relative min-h-[100dvh] w-full max-w-none overflow-hidden text-text-main">
      <CancelReasonModal
        open={showCancel}
        role={role || 'PASSENGER'}
        loading={cancelLoading}
        onClose={() => setShowCancel(false)}
        onConfirm={handleConfirmCancel}
      />

      <div ref={mapContainerRef} className="fixed inset-0 z-0 h-[100dvh] w-full max-w-none">
        <NavigationMap
          className="size-full"
          origin={originLngLat}
          destination={destinationLngLat}
          stops={mapStops}
          routeData={routeData}
          routeDisplay={routeDisplay}
          phase={mapPhase}
          follow={false}
          userPosition={role === 'DRIVER' ? driverPosition : viewerPosition}
          trackUserPosition={role === 'DRIVER' || role === 'PASSENGER' || role === 'CARONA'}
          viewportPadding={mapViewportPadding}
        />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] flex-col px-4 pointer-events-none">
      <div ref={topPanelEndRef} className="nav-shell shrink-0 pt-5 pb-2">
        {role === 'DRIVER' ? (
          <RideNavigationChoiceCard
            showNavButtons={navMode !== 'app'}
            onChooseApp={handleChooseAppNav}
            onChooseGoogle={handleChooseGoogleNav}
            className="rounded-2xl border border-border-muted bg-surface-input/90 backdrop-blur-md p-4 w-full pointer-events-auto"
          >
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
              Indo buscar o passageiro mais próximo. A rota será atualizada após embarque.
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

          </RideNavigationChoiceCard>
        ) : (
          <TemporaryDismissCard className="rounded-2xl border border-border-muted bg-surface-input/90 backdrop-blur-md p-4 w-full pointer-events-auto">
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

            {phase === 'pickup' && (role === 'CARONA' || role === 'PASSENGER') && (
              <p className="mb-2 text-xs text-brand/90">
                {role === 'CARONA'
                  ? 'O motorista está a caminho do seu ponto de embarque.'
                  : 'O motorista está a caminho. Acompanhe a rota no mapa.'}
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
          </TemporaryDismissCard>
        )}
      </div>

      <div className="min-h-0 flex-1" aria-hidden />

      <div ref={bottomPanelStartRef} className="nav-shell shrink-0 pt-2 pb-24">
        <RideStatusBottomCard
          embedded
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
      </div>
    </div>
  );
}
