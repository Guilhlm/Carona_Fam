import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiCheck, FiMapPin, FiUserPlus, FiUsers } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import * as scheduledRideService from '../services/scheduledRideService';
import JoinCaronaModal from '../components/ride/JoinCaronaModal';

export default function AvailableRidesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [joining, setJoining] = useState(false);

  const loadRides = useCallback(() => {
    setLoading(true);
    return scheduledRideService
      .listOpenScheduledRides()
      .then((data) => setRides(Array.isArray(data) ? data : []))
      .catch(() => {
        setRides([]);
        showToast('Não foi possível carregar viagens disponíveis.', 'error');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    loadRides();
  }, [loadRides, location.key]);

  const handleOpenJoin = (ride) => setSelectedRide(ride);
  const handleCloseJoin = () => setSelectedRide(null);

  const handleConfirmJoin = async (payload) => {
    if (!selectedRide) return;
    setJoining(true);
    try {
      await scheduledRideService.joinScheduledRideAsCarona(selectedRide.id, payload);
      showToast('Você entrou como carona nesta viagem.', 'success');
      setSelectedRide(null);
      await loadRides();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Não foi possível entrar como carona.';
      showToast(msg, 'error');
    } finally {
      setJoining(false);
    }
  };

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

      <h1 className="text-xl font-semibold text-gray-100 mb-1">Viagens disponíveis</h1>
      <p className="text-sm text-text-main/65 mb-6">
        Viagens agendadas por outros usuários que aceitam carona. Sua localização vira uma parada
        automática na corrida. Só é possível entrar antes do motorista aceitar.
      </p>

      {loading ? (
        <p className="text-sm text-text-main/60">Carregando...</p>
      ) : rides.length === 0 ? (
        <div className="rounded-xl border border-border-muted bg-surface-input/20 p-4 text-sm text-text-main/70 space-y-2">
          <p>Nenhuma viagem agendada aberta no momento.</p>
          <p className="text-text-main/55 text-xs">
            Peça a outro usuário agendar uma corrida e marcar &quot;Sim, aceitar carona&quot;. Suas
            próprias viagens não aparecem aqui.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rides.map((ride) => {
            const passengers = Math.max(1, Number(ride.passengers) || 1);
            const joinedCount = (ride.joinedPassengers || []).length;
            const alreadyJoined = !!(ride.joinedPassengers || []).find(
              (p) => p.passengerId === user?.id
            );

            return (
              <li
                key={ride.id}
                className="flex overflow-hidden rounded-xl border border-border-muted bg-surface-input/20"
              >
                <button
                  type="button"
                  onClick={() => !alreadyJoined && handleOpenJoin(ride)}
                  disabled={alreadyJoined}
                  className="flex min-w-0 flex-1 items-start gap-3 p-3 text-left transition-colors hover:bg-surface-input/35 disabled:cursor-default"
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-muted bg-black/20">
                    <FiCalendar className="h-4 w-4 text-text-main/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-medium text-gray-100">{ride.destination}</h2>
                    {ride.creator?.name ? (
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
                        {passengers + joinedCount}{' '}
                        {passengers + joinedCount === 1 ? 'pessoa' : 'pessoas'}
                      </span>
                      {joinedCount > 0 && (
                        <span className="rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1.5 text-xs text-brand">
                          {joinedCount} carona{joinedCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {alreadyJoined ? (
                  <div className="flex w-[4.75rem] shrink-0 flex-col items-center justify-center gap-1.5 border-l border-border-muted bg-brand/20 px-1.5 py-3 text-brand">
                    <FiCheck className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="text-center text-[11px] font-semibold leading-tight">
                      Você é
                      <br />
                      carona
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenJoin(ride)}
                    className="flex w-[4.75rem] shrink-0 flex-col items-center justify-center gap-1.5 border-l border-border-muted bg-brand px-1.5 py-3 text-white transition-colors hover:bg-brand/80 active:bg-brand/70"
                    aria-label="Pedir carona nesta viagem"
                  >
                    <FiUserPlus className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="text-center text-[11px] font-semibold leading-tight">
                      Pedir
                      <br />
                      carona
                    </span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <JoinCaronaModal
        open={!!selectedRide}
        ride={selectedRide}
        loading={joining}
        onClose={handleCloseJoin}
        onConfirm={handleConfirmJoin}
        onOutOfRadius={(msg) => showToast(msg, 'error')}
      />
    </div>
  );
}
