import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCrosshair, FiFlag, FiMinus, FiNavigation, FiPlus, FiSearch, FiTrash2, FiUsers } from 'react-icons/fi';
import AddressAutocompleteField from '../components/ride/AddressAutocompleteField';
import CustomSelect from '../components/ui/CustomSelect';
import RideRequestMapLayer from '../components/ride/RideRequestMapLayer';
import { useToast } from '../contexts/ToastContext';
import {
  fetchApproximateLocationFromIp,
  getBestEffortPosition,
  geolocationErrorMessage,
} from '../utils/geolocation';
import { ADDRESS_OUT_OF_RADIUS_MESSAGE } from '../utils/campinasGeo';
import { formatSuggestionAddress, reverseGeocode, searchAddresses } from '../utils/nominatim';
import { useMapViewportPadding } from '../hooks/useMapViewportPadding';
import { flyToVisibleCenter } from '../utils/mapViewport';
import * as rideService from '../services/rideService';

const PASSENGER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const MAX_STOPS = 3;

export default function RideRequestPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [allowNewPassengers, setAllowNewPassengers] = useState(false);

  const [originLatLng, setOriginLatLng] = useState(null);
  const [destinationLatLng, setDestinationLatLng] = useState(null);
  const [geoLatLng, setGeoLatLng] = useState(null);

  const [stops, setStops] = useState([]);

  const [locating, setLocating] = useState(true);
  const [leafletMap, setLeafletMap] = useState(null);
  const [locatingMe, setLocatingMe] = useState(false);
  const mapFitSuppressedRef = useRef(false);
  const mapContainerRef = useRef(null);
  const topPanelEndRef = useRef(null);
  const bottomPanelStartRef = useRef(null);
  const mapViewportPadding = useMapViewportPadding(
    mapContainerRef,
    topPanelEndRef,
    bottomPanelStartRef
  );

  const passengerSelectOptions = useMemo(
    () =>
      PASSENGER_OPTIONS.map((n) => ({
        value: n,
        label: `${n} ${n === 1 ? 'pessoa' : 'pessoas'}`,
      })),
    []
  );

  const allowCaronaOptions = useMemo(
    () => [
      {
        value: false,
        label: 'Não, só o grupo',
        description: 'Apenas quem já está na viagem',
      },
      {
        value: true,
        label: 'Sim, aceitar carona',
        description: 'Novas pessoas podem entrar na viagem',
      },
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!navigator.geolocation) {
        showToast('Geolocalização não disponível neste navegador.', 'error');
        setLocating(false);
        return;
      }

      try {
        const pos = await getBestEffortPosition();
        if (cancelled) return;
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const ll = [lat, lon];
        setGeoLatLng(ll);
        setOriginLatLng((prev) => prev ?? ll);

        try {
          const label = await reverseGeocode(lat, lon);
          if (cancelled) return;
          setOriginText((prev) => (prev.trim() ? prev : label || `${lat.toFixed(5)}, ${lon.toFixed(5)}`));
        } catch {
          if (!cancelled) {
            setOriginText((prev) => (prev.trim() ? prev : `${lat.toFixed(5)}, ${lon.toFixed(5)}`));
          }
        }
      } catch (err) {
        if (cancelled) return;
        const code = typeof err?.code === 'number' ? err.code : 0;

        const ipLoc = await fetchApproximateLocationFromIp();
        if (ipLoc && !cancelled) {
          const { lat, lon } = ipLoc;
          const ll = [lat, lon];
          setGeoLatLng(ll);
          setOriginLatLng((prev) => prev ?? ll);
          try {
            const label = await reverseGeocode(lat, lon);
            if (!cancelled) {
              setOriginText((prev) => (prev.trim() ? prev : label || `${lat.toFixed(5)}, ${lon.toFixed(5)}`));
            }
          } catch {
            if (!cancelled) {
              setOriginText((prev) => (prev.trim() ? prev : `${lat.toFixed(5)}, ${lon.toFixed(5)}`));
            }
          }
          showToast(
            'Localização aproximada pela rede (IP). Ajuste o endereço de partida na busca se precisar.',
            'info'
          );
        } else {
          showToast(geolocationErrorMessage(code), 'error');
        }
      } finally {
        if (!cancelled) setLocating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const stopLatLngs = useMemo(
    () => stops.map((s) => s.latLng).filter((ll) => Array.isArray(ll) && ll.length === 2),
    [stops]
  );

  const mapOrigin = originLatLng ?? geoLatLng;

  const addStop = () => {
    if (stops.length >= MAX_STOPS) {
      showToast(`É possível adicionar no máximo ${MAX_STOPS} paradas.`, 'error');
      return;
    }
    setStops((prev) => [...prev, { id: crypto.randomUUID(), text: '', latLng: null }]);
  };

  const canAddStop = stops.length < MAX_STOPS;

  const updateStop = (id, patch) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeStop = (id) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCenterOnOriginInput = useCallback(async () => {
    if (!leafletMap) {
      showToast('Mapa ainda está carregando.', 'info');
      return;
    }

    const q = originText.trim();
    if (!q) {
      showToast('Digite o local de partida no campo acima.', 'error');
      return;
    }
    if (q.length < 3) {
      showToast('Digite ao menos 3 caracteres para localizar no mapa.', 'error');
      return;
    }

    setLocatingMe(true);
    mapFitSuppressedRef.current = true;
    try {
      const results = await searchAddresses(q);
      const first = results[0];
      if (!first) {
        mapFitSuppressedRef.current = false;
        showToast(
          'Não encontramos esse endereço na região de Campinas. Ajuste o texto ou escolha uma sugestão na lista.',
          'error'
        );
        return;
      }

      const lat = Number(first.lat);
      const lon = Number(first.lon);
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        mapFitSuppressedRef.current = false;
        showToast('Não foi possível posicionar esse endereço. Selecione uma sugestão da busca.', 'error');
        return;
      }

      const ll = [lat, lon];
      const label = formatSuggestionAddress(first);
      setOriginLatLng(ll);
      setOriginText(label);

      const maxZ = leafletMap.getMaxZoom();
      flyToVisibleCenter(leafletMap, ll, maxZ, mapViewportPadding, { duration: 0.45 });

      window.setTimeout(() => {
        mapFitSuppressedRef.current = false;
      }, 750);
    } catch {
      mapFitSuppressedRef.current = false;
      showToast('Erro ao buscar o endereço. Tente novamente.', 'error');
    } finally {
      setLocatingMe(false);
    }
  }, [leafletMap, originText, showToast, mapViewportPadding]);

  const handleOutOfRadius = useCallback(() => {
    showToast(ADDRESS_OUT_OF_RADIUS_MESSAGE, 'error');
  }, [showToast]);

  const inputClass =
    'w-full rounded-xl border border-border-muted bg-surface-input/90 backdrop-blur-md pl-10 pr-10 py-3 text-sm text-text-main placeholder:text-text-main/45 outline-none focus:border-brand';

  return (
    <div className="fixed inset-0 z-0 flex flex-col overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0 z-0">
        <div className="absolute inset-0 size-full pointer-events-auto">
          <RideRequestMapLayer
            originLatLng={mapOrigin}
            stopLatLngs={stopLatLngs}
            destinationLatLng={destinationLatLng}
            onMapReady={setLeafletMap}
            mapFitSuppressedRef={mapFitSuppressedRef}
            viewportPadding={mapViewportPadding}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/25 to-black/60"
          aria-hidden
        />
      </div>

      <div className="absolute inset-0 z-10 flex min-h-0 flex-col px-4 pointer-events-none [&_button]:pointer-events-auto [&_input]:pointer-events-auto [&_select]:pointer-events-auto [&_label]:pointer-events-auto [&_ul]:pointer-events-auto [&_a]:pointer-events-auto">
        <div ref={topPanelEndRef} className="nav-shell shrink-0 pt-5 pb-2">
        <div className="space-y-3">
          <AddressAutocompleteField
            value={originText}
            onChange={setOriginText}
            onPick={({ lat, lon }) => {
              setOriginLatLng([lat, lon]);
            }}
            onOutOfRadius={handleOutOfRadius}
            placeholder="Local de Partida"
            icon={<FiSearch className="h-4 w-4" />}
            inputClassName={inputClass}
          />

          <AddressAutocompleteField
            value={destinationText}
            onChange={setDestinationText}
            onPick={({ lat, lon }) => {
              setDestinationLatLng([lat, lon]);
            }}
            onOutOfRadius={handleOutOfRadius}
            placeholder="Destino Final"
            icon={<FiFlag className="h-4 w-4" />}
            inputClassName={inputClass}
          />

          {stops.map((stop, index) => (
            <div key={stop.id} className="flex gap-2">
              <div className="min-w-0 flex-1">
                <AddressAutocompleteField
                  value={stop.text}
                  onChange={(v) => updateStop(stop.id, { text: v, latLng: null })}
                  onPick={({ label, lat, lon }) => {
                    updateStop(stop.id, { text: label, latLng: [lat, lon] });
                  }}
                  onOutOfRadius={handleOutOfRadius}
                  placeholder={`Parada ${index + 1}`}
                  icon={<FiNavigation className="h-4 w-4" />}
                  inputClassName={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => removeStop(stop.id)}
                className="shrink-0 self-start rounded-xl border border-border-muted bg-surface-input/90 px-3 py-3 text-text-main/70 hover:bg-black/30 hover:text-text-main"
                aria-label={`Remover parada ${index + 1}`}
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex gap-2 items-stretch">
            <div className="min-w-0 flex-1">
              <CustomSelect
                value={passengers}
                onChange={(v) => setPassengers(Number(v))}
                options={passengerSelectOptions}
                placeholder="Pessoas no grupo"
                aria-label="Quantidade de pessoas a bordo"
                size="sm"
                className="h-full"
              />
            </div>
            <button
              type="button"
              onClick={addStop}
              disabled={!canAddStop}
              className="shrink-0 self-center rounded-xl bg-brand px-4 py-3 text-xs font-medium text-white hover:bg-brand/85 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canAddStop ? 'Adicionar Parada' : `Máx. ${MAX_STOPS} paradas`}
            </button>
          </div>

          <div className="rounded-xl border border-border-muted bg-surface-input/90 px-3 py-3 space-y-2.5">
            <div className="flex gap-3 items-start">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand/40 bg-brand/15 text-brand"
                aria-hidden
              >
                <FiUsers className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-text-main leading-tight">Aceitar carona</p>
                <p className="text-xs text-text-main/65 leading-snug mt-1">
                  Permite que outras pessoas peçam vaga nesta viagem.
                </p>
              </div>
            </div>
            <CustomSelect
              value={allowNewPassengers}
              onChange={setAllowNewPassengers}
              options={allowCaronaOptions}
              placeholder="Selecione uma opção"
              aria-label="Aceitar carona na viagem"
              size="sm"
              className="w-full"
            />
          </div>

        </div>

        </div>

        <div className="relative min-h-0 flex-1">
          <div className="pointer-events-auto absolute bottom-0 right-0 flex flex-col items-end gap-2">
            <div className="flex flex-col overflow-hidden rounded-xl border border-border-muted bg-surface-input/95 shadow-lg backdrop-blur-md">
              <button
                type="button"
                aria-label="Aproximar mapa"
                onClick={() => leafletMap?.zoomIn()}
                className="flex h-11 w-11 items-center justify-center text-text-main hover:bg-black/25 active:bg-black/35"
              >
                <FiPlus className="h-5 w-5" />
              </button>
              <div className="h-px bg-border-muted" />
              <button
                type="button"
                aria-label="Afastar mapa"
                onClick={() => leafletMap?.zoomOut()}
                className="flex h-11 w-11 items-center justify-center text-text-main hover:bg-black/25 active:bg-black/35"
              >
                <FiMinus className="h-5 w-5" />
              </button>
            </div>
            <button
              type="button"
              aria-label="Centralizar mapa no endereço de partida"
              disabled={locatingMe}
              onClick={handleCenterOnOriginInput}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-muted bg-surface-input/95 text-text-main shadow-lg backdrop-blur-md hover:bg-black/25 active:bg-black/35 disabled:opacity-50"
            >
              <FiCrosshair className={`h-5 w-5 ${locatingMe ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>

        <div ref={bottomPanelStartRef} className="nav-shell shrink-0 pb-24 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={async () => {
              if (submitting) return;
              if (!originText.trim()) {
                showToast('Informe o local de partida.', 'error');
                return;
              }
              const origin = originLatLng ?? geoLatLng;
              if (!Array.isArray(origin) || origin.length !== 2) {
                showToast('Selecione um endereço de partida válido na busca.', 'error');
                return;
              }
              if (!destinationText.trim()) {
                showToast('Informe o destino final.', 'error');
                return;
              }
              if (!Array.isArray(destinationLatLng) || destinationLatLng.length !== 2) {
                showToast('Selecione um destino válido na busca para continuar.', 'error');
                return;
              }

              const invalidStop = stops.find(
                (s) => !s.text.trim() || !Array.isArray(s.latLng) || s.latLng.length !== 2
              );
              if (invalidStop) {
                showToast('Selecione um endereço válido para cada parada.', 'error');
                return;
              }

              setSubmitting(true);
              try {
                const ride = await rideService.requestNewRide({
                  origin: originText.trim(),
                  originLat: origin[0],
                  originLng: origin[1],
                  destination: destinationText.trim(),
                  destinationLat: destinationLatLng[0],
                  destinationLng: destinationLatLng[1],
                  stops: stops.map((s) => ({
                    address: s.text.trim(),
                    lat: s.latLng[0],
                    lng: s.latLng[1],
                  })),
                });

                navigate(`/home/rides/${ride.id}/waiting`, { replace: true });
              } catch (err) {
                const status = err?.response?.status;
                const message = err?.response?.data?.error || 'Erro ao solicitar viagem.';
                if (status === 409 && err?.response?.data?.rideId) {
                  showToast('Você já possui uma corrida em andamento.', 'info');
                  navigate(`/home/rides/${err.response.data.rideId}/waiting`, { replace: true });
                } else {
                  showToast(message, 'error');
                }
              } finally {
                setSubmitting(false);
              }
            }}
            className="w-full rounded-xl bg-brand py-4 text-sm font-semibold text-white shadow-lg shadow-black/30 hover:bg-brand/85 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Solicitando...' : 'Solicitar Viagem'}
          </button>
        </div>
      </div>

      {locating && (
        <div className="pointer-events-none fixed left-1/2 top-24 z-20 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-xs text-text-main backdrop-blur-sm">
          Obtendo sua localização…
        </div>
      )}
    </div>
  );
}