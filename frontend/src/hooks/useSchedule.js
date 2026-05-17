import { useCallback, useState } from 'react';
import {
  ADDRESS_OUT_OF_RADIUS_MESSAGE,
  isWithinCampinas,
} from '../utils/campinasGeo';
import { reverseGeocode } from '../utils/nominatim';
import * as scheduledRideService from '../services/scheduledRideService';

const emptyScheduleFields = () => ({
  originText: '',
  originCoords: null,
  destinationText: '',
  destinationCoords: null,
  departureAt: '',
  passengers: 1,
  allowNewPassengers: true,
});

export function useSchedule({
  selectedDestination,
  showToast,
  setScheduledRides,
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedule, setSchedule] = useState(() => emptyScheduleFields());
  const [locatingOrigin, setLocatingOrigin] = useState(false);

  const closeScheduleModal = useCallback(() => {
    setScheduleOpen(false);
    setSchedule(emptyScheduleFields());
    setLocatingOrigin(false);
  }, []);

  const openScheduleModal = useCallback(() => {
    setSchedule((prev) => {
      const next = emptyScheduleFields();
      if (selectedDestination?.label && Array.isArray(selectedDestination.coordinates)) {
        next.destinationText = selectedDestination.label;
        next.destinationCoords = [...selectedDestination.coordinates];
      }
      return next;
    });
    setScheduleOpen(true);
  }, [selectedDestination]);

  const useMyLocationForOrigin = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocalização indisponível neste dispositivo.', 'error');
      return;
    }
    setLocatingOrigin(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        if (!isWithinCampinas(lat, lon)) {
          showToast(ADDRESS_OUT_OF_RADIUS_MESSAGE, 'error');
          setLocatingOrigin(false);
          return;
        }
        try {
          const address = await reverseGeocode(lat, lon);
          const label = address || `Lat ${lat.toFixed(5)}, Lng ${lon.toFixed(5)}`;
          setSchedule((s) => ({
            ...s,
            originText: label,
            originCoords: [lon, lat],
          }));
        } catch {
          setSchedule((s) => ({
            ...s,
            originText: `Lat ${lat.toFixed(5)}, Lng ${lon.toFixed(5)}`,
            originCoords: [lon, lat],
          }));
        } finally {
          setLocatingOrigin(false);
        }
      },
      () => {
        setLocatingOrigin(false);
        showToast('Não foi possível obter sua localização.', 'error');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [showToast]);

  const handleConfirmSchedule = useCallback(
    async (event) => {
      event.preventDefault();

      const originLabel = schedule.originText.trim();
      const destinationLabel = schedule.destinationText.trim();

      if (!originLabel) {
        showToast('Informe o local de partida.', 'error');
        return;
      }
      if (!destinationLabel) {
        showToast('Informe o destino final.', 'error');
        return;
      }

      if (!Array.isArray(schedule.originCoords) || schedule.originCoords.length !== 2) {
        showToast('Selecione um endereço de partida válido na lista de sugestões.', 'error');
        return;
      }
      if (!Array.isArray(schedule.destinationCoords) || schedule.destinationCoords.length !== 2) {
        showToast('Selecione um destino final válido na lista de sugestões.', 'error');
        return;
      }

      const [originLon, originLat] = schedule.originCoords.map(Number);
      const [destLon, destLat] = schedule.destinationCoords.map(Number);

      if (!isWithinCampinas(originLat, originLon)) {
        showToast(ADDRESS_OUT_OF_RADIUS_MESSAGE, 'error');
        return;
      }
      if (!isWithinCampinas(destLat, destLon)) {
        showToast(ADDRESS_OUT_OF_RADIUS_MESSAGE, 'error');
        return;
      }

      if (!schedule.departureAt) {
        showToast('Escolha o horário de saída.', 'error');
        return;
      }

      const departureDate = new Date(schedule.departureAt);
      if (Number.isNaN(departureDate.getTime())) {
        showToast('Data de saída inválida.', 'error');
        return;
      }

      if (departureDate.getTime() < Date.now() - 60 * 1000) {
        showToast('A saída não pode ser agendada para uma data passada.', 'error');
        return;
      }

      try {
        const departureIso = new Date(schedule.departureAt).toISOString();

        const created = await scheduledRideService.createScheduledRide({
          origin: originLabel,
          originLat,
          originLng: originLon,
          destination: destinationLabel,
          destinationLat: destLat,
          destinationLng: destLon,
          departureAt: departureIso,
          passengers: schedule.passengers,
          allowNewPassengers: Boolean(schedule.allowNewPassengers),
        });
        if (setScheduledRides) {
          const row = { ...created, status: created?.status || 'OPEN' };
          setScheduledRides((prev) => [row, ...(Array.isArray(prev) ? prev : [])]);
        }
        showToast(
          schedule.allowNewPassengers
            ? 'Corrida agendada. Outros usuários verão em Viagens disponíveis.'
            : 'Corrida agendada com sucesso.',
          'success'
        );
        closeScheduleModal();
      } catch (err) {
        const msg = err.response?.data?.error || err.message || 'Erro ao agendar corrida.';
        showToast(msg, 'error');
      }
    },
    [closeScheduleModal, schedule, setScheduledRides, showToast]
  );

  return {
    scheduleOpen,
    schedule,
    setSchedule,
    locatingOrigin,
    openScheduleModal,
    closeScheduleModal,
    handleConfirmSchedule,
    useMyLocationForOrigin,
  };
}
