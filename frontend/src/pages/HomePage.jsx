import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiCalendar, FiMap, FiSearch, FiTruck, FiUsers } from 'react-icons/fi';
import AddressAutocompleteField from '../components/ride/AddressAutocompleteField';
import PreviousTripsList from '../components/PreviousTripsList';
import ScheduleModal from '../components/ScheduleModal';
import ScheduledRidesList from '../components/ScheduledRidesList';
import OpenRidesForNowSection from '../components/ride/OpenRidesForNowSection';
import ActiveRideBanner from '../components/ride/ActiveRideBanner';
import JoinedCaronaRidesList from '../components/JoinedCaronaRidesList';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useActiveRide } from '../hooks/useActiveRide';
import { useSchedule } from '../hooks/useSchedule';
import * as rideService from '../services/rideService';
import { ADDRESS_OUT_OF_RADIUS_MESSAGE } from '../utils/campinasGeo';
import * as scheduledRideService from '../services/scheduledRideService';
import { isOpenScheduledRide } from '../utils/scheduledRide';
import { filterActiveJoinedCaronas, filterHistoryRides } from '../utils/rideNavigation';

const destinationInputClass =
  'w-full rounded-xl border border-border-muted bg-surface-input/90 backdrop-blur-md pl-10 pr-10 py-3 text-sm text-text-main placeholder:text-text-main/45 outline-none focus:border-brand';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const { activeRide } = useActiveRide();
  const navigate = useNavigate();
  const isDriver = user?.role === 'DRIVER';

  const refreshJoinedCaronas = useCallback(() => {
    if (!isAuthenticated) {
      setJoinedCaronaRides([]);
      return;
    }
    scheduledRideService
      .listJoinedScheduledRides()
      .then((joined) => setJoinedCaronaRides(Array.isArray(joined) ? joined : []))
      .catch(() => setJoinedCaronaRides([]));
  }, [isAuthenticated]);

  const [mode, setMode] = useState('SEARCH');
  const [query, setQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState(null);

  const [rides, setRides] = useState([]);
  const [ridesLoading, setRidesLoading] = useState(true);

  const [scheduledRides, setScheduledRides] = useState([]);
  const [joinedCaronaRides, setJoinedCaronaRides] = useState([]);
  const [scheduledRequestingId, setScheduledRequestingId] = useState(null);
  const [scheduledDeletingId, setScheduledDeletingId] = useState(null);

  const [showOnlyScheduled, setShowOnlyScheduled] = useState(false);

  const {
    scheduleOpen,
    schedule,
    setSchedule,
    locatingOrigin,
    openScheduleModal,
    closeScheduleModal,
    handleConfirmSchedule,
    useMyLocationForOrigin,
  } = useSchedule({
    selectedDestination,
    showToast,
    setScheduledRides,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setScheduledRides([]);
      return;
    }
    let mounted = true;
    Promise.all([
      scheduledRideService.listMyScheduledRides(),
      scheduledRideService.listJoinedScheduledRides(),
    ])
      .then(([mine, joined]) => {
        if (!mounted) return;
        setScheduledRides((Array.isArray(mine) ? mine : []).filter(isOpenScheduledRide));
        setJoinedCaronaRides(Array.isArray(joined) ? joined : []);
      })
      .catch(() => {
        if (!mounted) {
          setScheduledRides([]);
          setJoinedCaronaRides([]);
        }
      });
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    refreshJoinedCaronas();
  }, [refreshJoinedCaronas, activeRide?.id, activeRide?.status]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const onFocus = () => refreshJoinedCaronas();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isAuthenticated, refreshJoinedCaronas]);

  const activeJoinedCaronas = useMemo(
    () => filterActiveJoinedCaronas(joinedCaronaRides),
    [joinedCaronaRides]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setRides([]);
      setRidesLoading(false);
      return;
    }

    let mounted = true;
    setRidesLoading(true);

    rideService
      .getRideHistory()
      .then((data) => {
        if (!mounted) return;
        setRides(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setRides([]);
      })
      .finally(() => {
        if (mounted) setRidesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const previousTrips = useMemo(() => {
    return filterHistoryRides(rides).slice(0, 5).map((ride, index) => {
      const destination = ride.destination || ride.origin || 'Endereço não informado';
      const subtitle = ride.origin && ride.destination ? `${ride.origin} -> ${ride.destination}` : destination;
      return {
        id: ride.id || `ride-${index}`,
        title: destination,
        subtitle,
      };
    });
  }, [rides]);

  const handleScheduledRequestNow = async (ride) => {
    setScheduledRequestingId(ride.id);
    try {
      const created = await scheduledRideService.convertScheduledRideToRide(ride.id);
      showToast('Corrida solicitada! Aguardando motorista.', 'success');
      setScheduledRides((prev) =>
        (Array.isArray(prev) ? prev : []).filter((r) => r.id !== ride.id)
      );
      navigate(`/home/rides/${created.id}/waiting`);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Não foi possível solicitar agora.';
      showToast(msg, 'error');
    } finally {
      setScheduledRequestingId(null);
    }
  };

  const handleScheduledDelete = async (ride) => {
    setScheduledDeletingId(ride.id);
    try {
      await scheduledRideService.deleteScheduledRide(ride.id);
      setScheduledRides((prev) => (Array.isArray(prev) ? prev : []).filter((r) => r.id !== ride.id));
      showToast('Viagem agendada excluída.', 'success');
    } catch (err) {
      let msg = err?.response?.data?.error;
      if (!msg && err?.response?.status === 404) {
        msg = 'Não foi possível excluir (servidor desatualizado). Reinicie o backend.';
      }
      showToast(msg || 'Não foi possível excluir a viagem.', 'error');
    } finally {
      setScheduledDeletingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-100 mb-4">Carona FAM</h1>
          <p className="text-xl text-gray-300 mb-8">Entre para acessar sua home personalizada.</p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="border-2 border-primary-600 text-primary-200 px-8 py-3 rounded-lg font-medium hover:bg-primary-900/20"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28 text-text-main relative">
      <ScheduleModal
        open={scheduleOpen}
        onClose={closeScheduleModal}
        onConfirm={handleConfirmSchedule}
        schedule={schedule}
        setSchedule={setSchedule}
        onOutOfRadius={() => showToast(ADDRESS_OUT_OF_RADIUS_MESSAGE, 'error')}
        onUseMyLocation={useMyLocationForOrigin}
        locatingOrigin={locatingOrigin}
      />

      <ActiveRideBanner />

      {mode !== 'DRIVE' && (
        <JoinedCaronaRidesList rides={activeJoinedCaronas} />
      )}

      <section className="mb-5">
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border-muted p-1 bg-surface-input/30">
          {isDriver ? (
            <>
              <button
                type="button"
                onClick={() => setMode('DRIVE')}
                className={`h-11 rounded-lg text-sm transition-colors ${
                  mode === 'DRIVE'
                    ? 'bg-brand/20 border border-brand text-brand'
                    : 'text-text-main/70 hover:bg-black/20'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <FiTruck className="w-4 h-4" />
                  Iniciar Corrida
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode('SEARCH')}
                className={`h-11 rounded-lg text-sm transition-colors ${
                  mode === 'SEARCH'
                    ? 'bg-brand/20 border border-brand text-brand'
                    : 'text-text-main/70 hover:bg-black/20'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <FiMap className="w-4 h-4" />
                  Buscar Corrida
                </span>
              </button>
            </>
          ) : (
            <div className="col-span-2 h-11 rounded-lg border border-brand bg-brand/20 text-brand text-sm flex items-center justify-center gap-2">
              <FiMap className="w-4 h-4" />
              Buscar Corrida
            </div>
          )}
        </div>
      </section>

      {mode !== 'DRIVE' && (
        <section className="mb-8 relative z-30">
          <div className="rounded-xl border border-border-muted bg-surface-input/30 p-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-2">
            <div className="min-w-0 flex-1">
              <AddressAutocompleteField
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setSelectedDestination(null);
                }}
                onPick={({ label, lon, lat }) => {
                  setQuery(label);
                  setSelectedDestination({
                    label,
                    value: label,
                    coordinates: [lon, lat],
                  });
                }}
                onOutOfRadius={() => showToast(ADDRESS_OUT_OF_RADIUS_MESSAGE, 'error')}
                placeholder="Para onde vamos?"
                icon={<FiSearch className="h-4 w-4" />}
                inputClassName={destinationInputClass}
                minChars={3}
              />
            </div>

            <button
              type="button"
              onClick={openScheduleModal}
              className="h-[46px] shrink-0 self-stretch sm:self-auto sm:h-[46px] px-4 rounded-xl bg-brand text-white text-xs font-medium hover:bg-brand/80 transition-colors whitespace-nowrap"
            >
              Agendar Corrida
            </button>
          </div>
        </section>
      )}

      {isDriver && mode === 'DRIVE' && (
        <>
          <OpenRidesForNowSection />
          <section className="mb-6">
            <button
              type="button"
              onClick={() => navigate('/home/rides/scheduled')}
              className="w-full rounded-xl border border-border-muted bg-surface-input/20 px-4 py-3 text-left hover:bg-surface-input/30 transition-colors"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-100">
                <FiCalendar className="h-4 w-4 text-text-main/80" />
                Ver todas as viagens agendadas
              </span>
              <p className="mt-1 text-xs text-text-main/60">
                Corridas agendadas por todos os usuários na plataforma.
              </p>
            </button>
          </section>
        </>
      )}

      {mode !== 'DRIVE' && (
        <ScheduledRidesList
          rides={scheduledRides}
          showOnlyScheduled={showOnlyScheduled}
          onShowPreviousTrips={() => setShowOnlyScheduled(false)}
          onRequestNow={handleScheduledRequestNow}
          onDelete={handleScheduledDelete}
          requestingId={scheduledRequestingId}
          deletingId={scheduledDeletingId}
        />
      )}

      {mode !== 'DRIVE' && !showOnlyScheduled && (
        <PreviousTripsList ridesLoading={ridesLoading} trips={previousTrips} />
      )}

      <section>
        <h1> </h1>
        <h2 className="text-xl font-semibold text-gray-100 mb-3">Sugestões</h2>
        <div className={`grid gap-3 ${isDriver ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <button
            type="button"
            onClick={() => navigate('/home/rides/available')}
            className="rounded-xl border border-border-muted bg-surface-input/20 p-3 text-left hover:bg-surface-input/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-full border border-border-muted bg-black/20 flex items-center justify-center mb-2">
              <FiMap className="w-4 h-4 text-text-main/80" />
            </div>
            <p className="text-xs text-text-main">Viagens Disponíveis</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/home/rides/scheduled')}
            className="rounded-xl border border-border-muted bg-surface-input/20 p-3 text-left hover:bg-surface-input/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-full border border-border-muted bg-black/20 flex items-center justify-center mb-2">
              <FiCalendar className="w-4 h-4 text-text-main/80" />
            </div>
            <p className="text-xs text-text-main">Viagens Agendadas</p>
          </button>

          {isDriver && (
            <button
              type="button"
              onClick={() => {
                setMode('DRIVE');
                showToast('Modo de dar carona ativado.', 'info');
              }}
              className="rounded-xl border border-border-muted bg-surface-input/20 p-3 text-left hover:bg-surface-input/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-full border border-border-muted bg-black/20 flex items-center justify-center mb-2">
                <FiUsers className="w-4 h-4 text-text-main/80" />
              </div>
              <p className="text-xs text-text-main">Dar carona</p>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
