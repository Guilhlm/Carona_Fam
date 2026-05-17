import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiMapPin,
  FiPlay,
  FiTrash2,
  FiUserMinus,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import * as scheduledRideService from '../services/scheduledRideService';
import JoinCaronaModal from '../components/ride/JoinCaronaModal';
import JoinedCaronaRidesList from '../components/JoinedCaronaRidesList';
import { isOpenScheduledRide } from '../utils/scheduledRide';
import { filterActiveJoinedCaronas } from '../utils/rideNavigation';

function RideRow({
  ride,
  showCreator = false,
  showJoinButton = false,
  showLeaveButton = false,
  showRequestButton = false,
  showDeleteButton = false,
  showAlreadyJoined = false,
  onJoin,
  onLeave,
  onRequest,
  onDelete,
  requesting = false,
  deleting = false,
}) {
  const passengers = Math.max(1, Number(ride.passengers) || 1);
  const joinedCount = (ride.joinedPassengers || []).length;
  const isOpen = isOpenScheduledRide(ride);

  return (
    <li className="rounded-xl border border-border-muted bg-surface-input/20 overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-muted bg-black/20">
          <FiCalendar className="h-4 w-4 text-text-main/70" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium text-gray-100">{ride.destination}</h2>
          {showCreator && ride.creator?.name ? (
            <p className="mt-0.5 text-xs text-text-main/55">Por {ride.creator.name}</p>
          ) : null}
          {ride.origin ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-main/55">
              <FiMapPin className="h-3 w-3 shrink-0" />
              Partida: {ride.origin}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-text-main/60">
            Saída:{' '}
            {ride.departureAt
              ? new Date(ride.departureAt).toLocaleString('pt-BR')
              : 'Horário não informado'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-gray-100">
              <FiUsers className="h-4 w-4 shrink-0 text-gray-200" aria-hidden />
              {passengers + joinedCount} {passengers + joinedCount === 1 ? 'pessoa' : 'pessoas'}
            </span>
            {joinedCount > 0 && (
              <span className="rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1.5 text-xs text-brand">
                {joinedCount} carona{joinedCount === 1 ? '' : 's'}
              </span>
            )}
            {!isOpen && (
              <span className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs text-text-main/70">
                {ride.status === 'REQUESTED' ? 'Em corrida' : 'Cancelada'}
              </span>
            )}
          </div>
        </div>
      </div>

      {(ride.joinedPassengers || []).length > 0 && (
        <div className="border-t border-border-muted/60 bg-black/10 px-3 py-2 space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-text-main/55">Caronas confirmados</p>
          {ride.joinedPassengers.map((jp) => (
            <p key={jp.id} className="text-xs text-text-main/80 flex items-center gap-1">
              <FiMapPin className="h-3 w-3 text-amber-400 shrink-0" />
              <span className="font-medium">{jp.passenger?.name || 'Passageiro'}</span>
              <span className="text-text-main/55"> — {jp.pickupAddress}</span>
            </p>
          ))}
        </div>
      )}

      {(showJoinButton || showLeaveButton || showRequestButton || showDeleteButton || showAlreadyJoined) && (
        <div className="flex gap-2 border-t border-border-muted/60 bg-black/15 p-2">
          {showJoinButton && (
            <button
              type="button"
              onClick={onJoin}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand py-2 text-xs font-semibold text-white hover:bg-brand/80"
            >
              <FiUserPlus className="h-3.5 w-3.5" /> Pedir carona
            </button>
          )}
          {showAlreadyJoined && (
            <div className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand/40 bg-brand/15 py-2 text-xs font-semibold text-brand">
              <FiCheck className="h-3.5 w-3.5" /> Você é carona
            </div>
          )}
          {showLeaveButton && (
            <button
              type="button"
              onClick={onLeave}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-muted bg-black/30 px-3 py-2 text-xs text-text-main/80 hover:bg-black/40"
            >
              <FiUserMinus className="h-3.5 w-3.5" /> Sair
            </button>
          )}
          {showRequestButton && (
            <button
              type="button"
              onClick={onRequest}
              disabled={!isOpen || requesting || deleting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand py-2 text-xs font-semibold text-white hover:bg-brand/80 disabled:opacity-60"
            >
              <FiPlay className="h-3.5 w-3.5" />
              {requesting ? 'Solicitando...' : 'Solicitar agora'}
            </button>
          )}
          {showDeleteButton && (
            <button
              type="button"
              onClick={onDelete}
              disabled={!isOpen || requesting || deleting}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-60 ${showRequestButton ? '' : 'flex-1'}`}
              aria-label="Excluir viagem agendada"
            >
              <FiTrash2 className="h-3.5 w-3.5" />
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export default function ScheduledRidesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isDriver = user?.role === 'DRIVER';

  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState([]);
  const [joined, setJoined] = useState([]);
  const [open, setOpen] = useState([]);
  const [all, setAll] = useState([]);

  const [selectedRide, setSelectedRide] = useState(null);
  const [joining, setJoining] = useState(false);
  const [requestingId, setRequestingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const tasks = [
        scheduledRideService.listMyScheduledRides(),
        scheduledRideService.listJoinedScheduledRides(),
        scheduledRideService.listOpenScheduledRides(),
      ];
      if (isDriver) tasks.push(scheduledRideService.listAllScheduledRides());

      const results = await Promise.all(tasks);
      setMine(Array.isArray(results[0]) ? results[0] : []);
      setJoined(Array.isArray(results[1]) ? results[1] : []);
      setOpen(Array.isArray(results[2]) ? results[2] : []);
      if (isDriver) setAll(Array.isArray(results[3]) ? results[3] : []);
    } catch {
      showToast('Não foi possível carregar viagens agendadas.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isDriver, showToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll, location.key]);

  const handleConfirmJoin = async (payload) => {
    if (!selectedRide) return;
    setJoining(true);
    try {
      await scheduledRideService.joinScheduledRideAsCarona(selectedRide.id, payload);
      showToast('Você entrou como carona nesta viagem.', 'success');
      setSelectedRide(null);
      await loadAll();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Não foi possível entrar como carona.';
      showToast(msg, 'error');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async (ride) => {
    try {
      await scheduledRideService.leaveScheduledRideAsCarona(ride.id);
      showToast('Você saiu desta viagem.', 'success');
      await loadAll();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Não foi possível sair.';
      showToast(msg, 'error');
    }
  };

  const handleDelete = async (ride) => {
    setDeletingId(ride.id);
    try {
      await scheduledRideService.deleteScheduledRide(ride.id);
      showToast('Viagem agendada excluída.', 'success');
      await loadAll();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Não foi possível excluir a viagem.';
      showToast(msg, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRequestNow = async (ride) => {
    setRequestingId(ride.id);
    try {
      const created = await scheduledRideService.convertScheduledRideToRide(ride.id);
      showToast('Corrida solicitada! Aguardando motorista.', 'success');
      navigate(`/home/rides/${created.id}/waiting`);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Não foi possível solicitar agora.';
      showToast(msg, 'error');
    } finally {
      setRequestingId(null);
    }
  };

  const isUserJoined = (ride) =>
    !!(ride.joinedPassengers || []).find((p) => p.passengerId === user?.id);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28 text-text-main">
      <button
        type="button"
        onClick={() => navigate('/home')}
        className="mb-4 inline-flex items-center gap-2 text-sm text-text-main/70 hover:text-text-main"
      >
        <FiArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <h1 className="text-xl font-semibold text-gray-100 mb-1">Viagens agendadas</h1>
      <p className="text-sm text-text-main/65 mb-6">
        {isDriver
          ? 'Todas as corridas agendadas na plataforma e viagens abertas para carona.'
          : 'Suas viagens, viagens onde você entrou como carona e opções para entrar em outras.'}
      </p>

      {loading ? (
        <p className="text-sm text-text-main/60">Carregando...</p>
      ) : (
        <div className="space-y-8">
          {isDriver && (
            <section>
              <h2 className="text-base font-semibold text-gray-100 mb-3">Todas agendadas</h2>
              {all.length === 0 ? (
                <EmptyHint text="Nenhuma viagem agendada na plataforma." />
              ) : (
                <ul className="space-y-3">
                  {all.map((ride) => (
                    <RideRow key={`all-${ride.id}`} ride={ride} showCreator />
                  ))}
                </ul>
              )}
            </section>
          )}

          <JoinedCaronaRidesList
            rides={filterActiveJoinedCaronas(joined)}
            title="Caronas em andamento"
          />

          <section>
            <h2 className="text-base font-semibold text-gray-100 mb-3">Suas viagens</h2>
            {mine.length === 0 ? (
              <EmptyHint text="Você ainda não agendou nenhuma viagem." />
            ) : (
              <ul className="space-y-3">
                {mine.map((ride) => (
                  <RideRow
                    key={`mine-${ride.id}`}
                    ride={ride}
                    showRequestButton
                    showDeleteButton
                    requesting={requestingId === ride.id}
                    deleting={deletingId === ride.id}
                    onRequest={() => handleRequestNow(ride)}
                    onDelete={() => handleDelete(ride)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-100 mb-3">Disponíveis para carona</h2>
            {open.length === 0 ? (
              <EmptyHint text="Nenhuma viagem aberta para novos passageiros no momento." />
            ) : (
              <ul className="space-y-3">
                {open.map((ride) => {
                  const joined = isUserJoined(ride);
                  return (
                    <RideRow
                      key={`open-${ride.id}`}
                      ride={ride}
                      showCreator
                      showJoinButton={!joined}
                      showAlreadyJoined={joined}
                      showLeaveButton={joined}
                      onJoin={() => setSelectedRide(ride)}
                      onLeave={() => handleLeave(ride)}
                    />
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      <JoinCaronaModal
        open={!!selectedRide}
        ride={selectedRide}
        loading={joining}
        onClose={() => setSelectedRide(null)}
        onConfirm={handleConfirmJoin}
        onOutOfRadius={(msg) => showToast(msg, 'error')}
      />
    </div>
  );
}

function EmptyHint({ text }) {
  return (
    <div className="rounded-xl border border-border-muted bg-surface-input/20 p-4 text-sm text-text-main/70">
      {text}
    </div>
  );
}
