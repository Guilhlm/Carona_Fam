import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
import { formatSuggestionAddress, reverseGeocode, searchAddresses } from '../utils/nominatim';
import { leafletToHomeCoords, prependScheduledRide } from '../utils/scheduledRides';

const PASSENGER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

function coordsHomeToLeaflet(coords) {
  if (!Array.isArray(coords) || coords.length !== 2) return null;
  const [lon, lat] = coords.map(Number);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  return [lat, lon];
}

export default function RideRequestPage() {
  const location = useLocation();
  const { showToast } = useToast();
  const scheduledRide = location.state?.scheduledRide;

  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [allowNewPassengers, setAllowNewPassengers] = useState(false);

  const [partidaLatLng, setPartidaLatLng] = useState(null);
  const [destinoLatLng, setDestinoLatLng] = useState(null);
  const [geoLatLng, setGeoLatLng] = useState(null);

  const [stops, setStops] = useState([]);

  const [locating, setLocating] = useState(true);
  const [leafletMap, setLeafletMap] = useState(null);
  const [locatingMe, setLocatingMe] = useState(false);
  const mapFitSuppressedRef = useRef(false);

  const scheduleSummary = useMemo(() => {
    if (!scheduledRide) return null;
    const parts = [];
    if (scheduledRide.departureAt) {
      parts.push(`Saída: ${new Date(scheduledRide.departureAt).toLocaleString('pt-BR')}`);
    }
    if (scheduledRide.returnAt) {
      parts.push(`Retorno: ${new Date(scheduledRide.returnAt).toLocaleString('pt-BR')}`);
    }
    return parts.length ? parts.join(' · ') : null;
  }, [scheduledRide]);

  const passengerSelectOptions = useMemo(
    () =>
      PASSENGER_OPTIONS.map((n) => ({
        value: n,
        label: `${n} ${n === 1 ? 'pessoa' : 'pessoas'}`,
      })),
    []
  );

  useEffect(() => {
    if (!scheduledRide) return;
    if (scheduledRide.destination) {
      setDestinationText(String(scheduledRide.destination));
      setDestinoLatLng(coordsHomeToLeaflet(scheduledRide.destinationCoords));
    }
    if (scheduledRide.origin) {
      setOriginText(String(scheduledRide.origin));
      const oll = coordsHomeToLeaflet(scheduledRide.originCoords);
      if (oll) setPartidaLatLng(oll);
    }
    const p = Number(scheduledRide.passengers);
    if (Number.isFinite(p) && p >= 1 && p <= 8) setPassengers(p);
    setAllowNewPassengers(scheduledRide.allowNewPassengers === true);
  }, [scheduledRide]);

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
        setPartidaLatLng((prev) => prev ?? ll);

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
          setPartidaLatLng((prev) => prev ?? ll);
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

  const paradaLatLngs = useMemo(
    () => stops.map((s) => s.latLng).filter((ll) => Array.isArray(ll) && ll.length === 2),
    [stops]
  );

  const mapPartida = partidaLatLng ?? geoLatLng;

  const addStop = () => {
    setStops((prev) => [...prev, { id: crypto.randomUUID(), text: '', latLng: null }]);
  };

  const updateStop = (id, patch) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeStop = (id) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCenterOnPartidaInput = useCallback(async () => {
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
        showToast('Não encontramos esse endereço. Ajuste o texto ou escolha uma sugestão na lista.', 'error');
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
      setPartidaLatLng(ll);
      setOriginText(label);

      const maxZ = leafletMap.getMaxZoom();
      leafletMap.flyTo(ll, maxZ, { duration: 0.45 });

      window.setTimeout(() => {
        mapFitSuppressedRef.current = false;
      }, 750);
    } catch {
      mapFitSuppressedRef.current = false;
      showToast('Erro ao buscar o endereço. Tente novamente.', 'error');
    } finally {
      setLocatingMe(false);
    }
  }, [leafletMap, originText, showToast]);

  const inputClass =
    'w-full rounded-xl border border-border-muted bg-surface-input/90 backdrop-blur-md pl-10 pr-10 py-3 text-sm text-text-main placeholder:text-text-main/45 outline-none focus:border-brand';

  return (
    <div className="relative min-h-[calc(100dvh-6rem)] w-full">
      <div className="fixed inset-x-0 top-0 bottom-24 z-0">
        <div className="absolute inset-0 h-full w-full pointer-events-auto">
          <RideRequestMapLayer
            partidaLatLng={mapPartida}
            paradaLatLngs={paradaLatLngs}
            destinoLatLng={destinoLatLng}
            onMapReady={setLeafletMap}
            mapFitSuppressedRef={mapFitSuppressedRef}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/25 to-black/60"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex min-h-[calc(100dvh-6rem)] flex-col px-4 pt-5 pb-6 pointer-events-none [&_button]:pointer-events-auto [&_input]:pointer-events-auto [&_select]:pointer-events-auto [&_label]:pointer-events-auto [&_ul]:pointer-events-auto [&_a]:pointer-events-auto">
        <div className="space-y-3">
          <AddressAutocompleteField
            value={originText}
            onChange={setOriginText}
            onPick={({ lat, lon }) => {
              setPartidaLatLng([lat, lon]);
            }}
            placeholder="Local de Partida"
            icon={<FiSearch className="h-4 w-4" />}
            inputClassName={inputClass}
          />

          <AddressAutocompleteField
            value={destinationText}
            onChange={setDestinationText}
            onPick={({ lat, lon }) => {
              setDestinoLatLng([lat, lon]);
            }}
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
              className="shrink-0 self-center rounded-xl bg-brand px-4 py-3 text-xs font-medium text-white hover:bg-brand/85 transition-colors"
            >
              Adicionar Paradas
            </button>
          </div>

          <div className="rounded-xl border border-border-muted bg-surface-input/90 px-3 py-3 space-y-3">
            <div className="flex gap-3 items-start">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand/40 bg-brand/15 text-brand"
                aria-hidden
              >
                <FiUsers className="h-5 w-5" />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-text-main leading-tight">Aceitar carona</p>
                <p className="text-xs text-text-main/65 leading-snug mt-1">
                  Deixe outras pessoas pedirem vaga nesta viagem (aparece em &quot;Viagens disponíveis&quot;).
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAllowNewPassengers(true)}
                className={`min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-medium border transition-colors text-left ${
                  allowNewPassengers
                    ? 'border-brand bg-brand/25 text-brand ring-1 ring-brand/30'
                    : 'border-border-muted bg-black/30 text-text-main/80 hover:bg-black/40'
                }`}
              >
                <span className="block font-semibold">Sim, aceitar carona</span>
                <span className="block text-[11px] font-normal text-text-main/60 mt-0.5">
                  Novas pessoas podem entrar
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAllowNewPassengers(false)}
                className={`min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-medium border transition-colors text-left ${
                  !allowNewPassengers
                    ? 'border-brand bg-brand/25 text-text-main ring-1 ring-brand/30'
                    : 'border-border-muted bg-black/30 text-text-main/80 hover:bg-black/40'
                }`}
              >
                <span className="block font-semibold">Não, só o grupo</span>
                <span className="block text-[11px] font-normal text-text-main/60 mt-0.5">
                  Apenas quem já está na viagem
                </span>
              </button>
            </div>
          </div>

          {scheduleSummary && (
            <p className="rounded-xl border border-border-muted/80 bg-black/30 px-3 py-2 text-xs text-text-main/80 backdrop-blur-sm">
              {scheduleSummary}
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-col items-stretch gap-5 pt-8">
          <div className="pointer-events-auto flex flex-col items-end gap-2 self-end">
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
              onClick={handleCenterOnPartidaInput}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-muted bg-surface-input/95 text-text-main shadow-lg backdrop-blur-md hover:bg-black/25 active:bg-black/35 disabled:opacity-50"
            >
              <FiCrosshair className={`h-5 w-5 ${locatingMe ? 'animate-pulse' : ''}`} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!destinationText.trim()) {
                showToast('Informe o destino final.', 'error');
                return;
              }
              const partida = partidaLatLng ?? geoLatLng;
              const payload = {
                id: Date.now(),
                type: 'REQUEST',
                origin: originText.trim() || null,
                destination: destinationText.trim(),
                originCoords: leafletToHomeCoords(partida),
                destinationCoords: leafletToHomeCoords(destinoLatLng),
                departureAt: scheduledRide?.departureAt || null,
                returnAt: scheduledRide?.returnAt || null,
                passengers,
                allowNewPassengers,
                createdAt: new Date().toISOString(),
              };
              prependScheduledRide(payload);
              showToast('Solicitação de viagem registrada (demo).', 'success');
            }}
            className="w-full rounded-xl bg-brand py-4 text-sm font-semibold text-white shadow-lg shadow-black/30 hover:bg-brand/85 transition-colors"
          >
            Solicitar Viagem
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