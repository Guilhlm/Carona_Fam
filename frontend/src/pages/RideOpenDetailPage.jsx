import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiExternalLink,
  FiFlag,
  FiMapPin,
  FiNavigation,
  FiPhone,
  FiUser,
} from 'react-icons/fi';
import NavigationMap from '../components/ride/NavigationMap';
import * as rideService from '../services/rideService';
import { useToast } from '../contexts/ToastContext';
import { buildGoogleMapsNavUrl, fetchOsrmRoute } from '../utils/routeFetcher';

function decimalToNumber(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function RideOpenDetailPage() {
  const { id: rideId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [routeData, setRouteData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    rideService
      .getRideDetail(rideId)
      .then((r) => { if (!cancelled) setRide(r); })
      .catch(() => { if (!cancelled) showToast('Corrida não encontrada ou indisponível.', 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [rideId, showToast]);

  const { originLngLat, destinationLngLat, stopsLatLng, coordinates } = useMemo(() => {
    if (!ride) {
      return { originLngLat: null, destinationLngLat: null, stopsLatLng: [], coordinates: [] };
    }
    const oLng = decimalToNumber(ride.originLng);
    const oLat = decimalToNumber(ride.originLat);
    const dLng = decimalToNumber(ride.destinationLng);
    const dLat = decimalToNumber(ride.destinationLat);
    const sList = (ride.stops || [])
      .map((s) => ({ lat: decimalToNumber(s.lat), lng: decimalToNumber(s.lng), address: s.address }))
      .filter((s) => s.lat != null && s.lng != null);

    const o = oLng != null && oLat != null ? [oLng, oLat] : null;
    const d = dLng != null && dLat != null ? [dLng, dLat] : null;

    const coords =
      o && d
        ? [o, ...sList.map((s) => [s.lng, s.lat]), d]
        : [];

    return { originLngLat: o, destinationLngLat: d, stopsLatLng: sList, coordinates: coords };
  }, [ride]);

  useEffect(() => {
    let cancelled = false;
    if (coordinates.length < 2) return undefined;
    fetchOsrmRoute(coordinates).then((data) => {
      if (!cancelled && data) setRouteData(data);
    });
    return () => { cancelled = true; };
  }, [coordinates]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const accepted = await rideService.acceptOpenRide(rideId);
      showToast('Corrida aceita!', 'success');
      navigate(`/home/rides/${accepted.id}/active`, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.error || 'Erro ao aceitar a corrida.';
      if (status === 409) {
        showToast(message, 'info');
        navigate('/home', { replace: true });
      } else {
        showToast(message, 'error');
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleOpenGoogleMaps = () => {
    const url = buildGoogleMapsNavUrl(coordinates);
    if (url) window.open(url, '_blank', 'noopener');
  };

  if (loading) {
    return <div className="max-w-md mx-auto px-4 py-12 text-center text-text-main/70">Carregando corrida...</div>;
  }

  if (!ride) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center text-text-main">
        <p>Corrida não encontrada.</p>
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="mt-4 rounded-xl border border-border-muted bg-surface-input/30 px-4 py-2 text-sm"
        >
          Voltar
        </button>
      </div>
    );
  }

  const isAvailable = ride.status === 'WAITING_DRIVER' && !ride.driverId;

  return (
    <div className="max-w-md mx-auto px-4 py-4 text-text-main">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex items-center gap-1 text-sm text-text-main/70 hover:text-text-main"
      >
        <FiArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="h-64 rounded-2xl overflow-hidden border border-border-muted mb-4">
        <NavigationMap
          origin={originLngLat}
          destination={destinationLngLat}
          stops={stopsLatLng}
          routeData={routeData}
          trackUserPosition={false}
        />
      </div>

      <div className="rounded-2xl border border-border-muted bg-surface-input/30 p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-11 w-11 rounded-full bg-brand/20 border border-brand flex items-center justify-center">
            <FiUser className="h-5 w-5 text-brand" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{ride.requester?.name ?? 'Passageiro'}</p>
            {ride.requester?.phone && (
              <a
                href={`tel:${ride.requester.phone}`}
                className="inline-flex items-center gap-1 text-xs text-brand"
              >
                <FiPhone className="h-3 w-3" /> {ride.requester.phone}
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-border-muted/60 pt-3">
          <div>
            <p className="text-text-main/60">Distância</p>
            <p className="font-semibold">{ride.distanceKm != null ? `${Number(ride.distanceKm).toFixed(1)} km` : '—'}</p>
          </div>
          <div>
            <p className="text-text-main/60">Tempo est.</p>
            <p className="font-semibold">{ride.estimatedTimeMin != null ? `${ride.estimatedTimeMin} min` : '—'}</p>
          </div>
          <div>
            <p className="text-text-main/60">Valor est.</p>
            <p className="font-semibold">{ride.estimatedValue != null ? `R$ ${Number(ride.estimatedValue).toFixed(2)}` : '—'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border-muted bg-surface-input/20 p-4 space-y-4 mb-4">
        <div className="flex gap-3">
          <FiMapPin className="mt-0.5 h-5 w-5 text-brand shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-text-main/55">Origem</p>
            <p className="text-sm truncate">{ride.origin}</p>
          </div>
        </div>
        {(ride.stops || []).map((stop, idx) => (
          <div key={stop.id ?? idx} className="flex gap-3">
            <FiNavigation className="mt-0.5 h-5 w-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-text-main/55">Parada {idx + 1}</p>
              <p className="text-sm truncate">{stop.address}</p>
            </div>
          </div>
        ))}
        <div className="flex gap-3">
          <FiFlag className="mt-0.5 h-5 w-5 text-green-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-text-main/55">Destino</p>
            <p className="text-sm truncate">{ride.destination}</p>
          </div>
        </div>
      </div>

      {isAvailable ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleAccept}
            disabled={accepting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-4 text-sm font-semibold text-white hover:bg-brand/85 disabled:opacity-60"
          >
            <FiCheckCircle className="h-4 w-4" />
            {accepting ? 'Aceitando...' : 'Aceitar Corrida'}
          </button>
          <button
            type="button"
            onClick={handleOpenGoogleMaps}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-border-muted bg-black/30 py-2 text-xs text-text-main/70 hover:bg-black/40"
          >
            <FiExternalLink className="h-3 w-3" /> Pré-visualizar no Google Maps
          </button>
        </div>
      ) : ride.driverId ? (
        <div className="rounded-xl border border-brand bg-brand/15 px-4 py-3 text-sm text-brand text-center">
          Esta corrida já foi aceita por outro motorista.
        </div>
      ) : (
        <div className="rounded-xl border border-border-muted bg-black/30 px-4 py-3 text-sm text-text-main/70 text-center">
          Esta corrida não está mais disponível.
        </div>
      )}
    </div>
  );
}
