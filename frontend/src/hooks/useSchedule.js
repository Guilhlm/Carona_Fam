import { useCallback, useState } from 'react';
import { prependScheduledRide } from '../utils/scheduledRides';

export function useSchedule({
  query,
  selectedDestination,
  setSelectedDestination,
  mode,
  showToast,
  setScheduledRides,
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedule, setSchedule] = useState({
    departureAt: '',
    returnAt: '',
    passengers: 1,
    allowNewPassengers: false,
  });

  const closeScheduleModal = useCallback(() => {
    setScheduleOpen(false);
    setSchedule({
      departureAt: '',
      returnAt: '',
      passengers: 1,
      allowNewPassengers: false,
    });
  }, []);

  const openScheduleModal = useCallback(() => {
    const raw = query.trim();
    if (!raw) {
      showToast('Digite ou selecione um destino antes de agendar.', 'error');
      return;
    }

    if (!selectedDestination || selectedDestination.label.toLowerCase() !== raw.toLowerCase()) {
      setSelectedDestination({ label: raw, value: raw, coordinates: null });
    }

    setScheduleOpen(true);
  }, [query, selectedDestination, setSelectedDestination, showToast]);

  const handleConfirmSchedule = useCallback(
    (event) => {
      event.preventDefault();
      const destinationLabel = selectedDestination?.label || query.trim();

      if (!destinationLabel) {
        showToast('Selecione um destino para continuar.', 'error');
        return;
      }

      if (!schedule.departureAt) {
        showToast('Escolha o horário de saída.', 'error');
        return;
      }

      const scheduledPayload = {
        id: Date.now(),
        type: mode,
        destination: destinationLabel,
        destinationCoords: selectedDestination?.coordinates || null,
        departureAt: schedule.departureAt,
        returnAt: schedule.returnAt || null,
        passengers: schedule.passengers,
        allowNewPassengers: schedule.allowNewPassengers,
      };

      const next = prependScheduledRide(scheduledPayload);
      setScheduledRides(next);

      showToast('Corrida agendada com sucesso.', 'success');
      closeScheduleModal();
    },
    [closeScheduleModal, mode, query, schedule, selectedDestination, setScheduledRides, showToast]
  );

  return {
    scheduleOpen,
    schedule,
    setSchedule,
    openScheduleModal,
    closeScheduleModal,
    handleConfirmSchedule,
  };
}
