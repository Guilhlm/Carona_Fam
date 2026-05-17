import { useState } from 'react';
import { FiCrosshair, FiMapPin, FiUserPlus, FiX } from 'react-icons/fi';
import AddressAutocompleteField from './AddressAutocompleteField';
import { ADDRESS_OUT_OF_RADIUS_MESSAGE, isWithinCampinas } from '../../utils/campinasGeo';
import { reverseGeocode } from '../../utils/nominatim';

export default function JoinCaronaModal({
  open,
  ride,
  onClose,
  onConfirm,
  onOutOfRadius,
  loading = false,
}) {
  const [addressText, setAddressText] = useState('');
  const [pickedLocation, setPickedLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  if (!open) return null;

  const resetAndClose = () => {
    setAddressText('');
    setPickedLocation(null);
    setIsLocating(false);
    onClose();
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      onOutOfRadius?.('Geolocalização indisponível neste dispositivo.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (geolocationPosition) => {
        const currentLat = geolocationPosition.coords.latitude;
        const currentLng = geolocationPosition.coords.longitude;
        if (!isWithinCampinas(currentLat, currentLng)) {
          setIsLocating(false);
          onOutOfRadius?.(ADDRESS_OUT_OF_RADIUS_MESSAGE);
          return;
        }
        try {
          const resolvedAddress = await reverseGeocode(currentLat, currentLng);
          const addressLabel =
            resolvedAddress || `Lat ${currentLat.toFixed(5)}, Lng ${currentLng.toFixed(5)}`;
          setAddressText(addressLabel);
          setPickedLocation({ label: addressLabel, lon: currentLng, lat: currentLat });
        } catch (reverseGeocodeError) {
          const addressLabel = `Lat ${currentLat.toFixed(5)}, Lng ${currentLng.toFixed(5)}`;
          setAddressText(addressLabel);
          setPickedLocation({ label: addressLabel, lon: currentLng, lat: currentLat });
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        onOutOfRadius?.('Não foi possível obter sua localização. Permita o acesso ao GPS.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSubmit = (formEvent) => {
    formEvent.preventDefault();
    if (!pickedLocation) {
      onOutOfRadius?.('Selecione um endereço de embarque na lista ou use sua localização.');
      return;
    }
    onConfirm({
      pickupAddress: pickedLocation.label,
      pickupLat: pickedLocation.lat,
      pickupLng: pickedLocation.lon,
    });
  };

  const inputClass =
    'w-full rounded-xl border border-border-muted bg-surface-input/90 backdrop-blur-md pl-10 pr-10 py-3 text-sm text-text-main placeholder:text-text-main/45 outline-none focus:border-brand';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar modal"
        className="absolute inset-0 bg-black/70"
        onClick={resetAndClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-2xl border border-border-muted bg-surface-input/95 backdrop-blur-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold inline-flex items-center gap-2">
            <FiUserPlus className="h-4 w-4 text-brand" /> Entrar como carona
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-1 rounded-md text-text-main/70 hover:text-text-main"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-lg border border-border-muted bg-black/20 px-3 py-2 text-sm">
          <p className="text-text-main/60 text-xs mb-1">Destino da viagem</p>
          <p className="text-text-main">{ride?.destination || '—'}</p>
          {ride?.departureAt && (
            <p className="text-text-main/55 text-xs mt-1">
              Saída: {new Date(ride.departureAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs text-text-main/70">
            Onde você deseja ser pego? Seu endereço vira uma parada automática na corrida.
          </p>

          <AddressAutocompleteField
            value={addressText}
            onChange={(nextValue) => {
              setAddressText(nextValue);
              setPickedLocation(null);
            }}
            onPick={({ label, lon, lat }) => {
              setAddressText(label);
              setPickedLocation({ label, lon, lat });
            }}
            onOutOfRadius={() => onOutOfRadius?.(ADDRESS_OUT_OF_RADIUS_MESSAGE)}
            placeholder="Endereço de embarque"
            icon={<FiMapPin className="h-4 w-4" />}
            inputClassName={inputClass}
            minChars={3}
          />

          <button
            type="button"
            onClick={useMyLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-2 text-xs text-brand hover:text-brand/80 disabled:opacity-60"
          >
            <FiCrosshair className={`h-3.5 w-3.5 ${isLocating ? 'animate-pulse' : ''}`} />
            {isLocating ? 'Localizando...' : 'Usar minha localização atual'}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !pickedLocation}
          className="w-full h-11 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand/80 transition-colors disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Confirmar carona'}
        </button>
      </form>
    </div>
  );
}
