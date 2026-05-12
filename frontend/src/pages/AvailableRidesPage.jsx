import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiCalendar, FiMapPin, FiUserPlus, FiUsers } from 'react-icons/fi';
import {
  SCHEDULED_RIDES_KEY,
  filterAvailableScheduledRides,
  safeParseScheduledRides,
} from '../utils/scheduledRides';

export default function AvailableRidesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rides, setRides] = useState([]);

  useEffect(() => {
    const all = safeParseScheduledRides(localStorage.getItem(SCHEDULED_RIDES_KEY));
    setRides(filterAvailableScheduledRides(all));
  }, [location.pathname, location.key]);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28 text-text-main">
      <h1 className="text-xl font-semibold text-gray-100 mb-1">Viagens disponíveis</h1>
      <p className="text-sm text-text-main/65 mb-6">
        Corridas agendadas com mais de uma pessoa ou que aceitam novos passageiros (carona).
      </p>

      {rides.length === 0 ? (
        <div className="rounded-xl border border-border-muted bg-surface-input/20 p-4 text-sm text-text-main/70">
          Nenhuma viagem disponível no momento. Agende uma corrida com mais de uma pessoa ou marque
          &quot;Aceitar carona&quot; na solicitação.
        </div>
      ) : (
        <ul className="space-y-3">
          {rides.map((ride) => {
            const p = Number(ride.passengers);
            const passengers = Number.isFinite(p) && p > 0 ? p : 1;

            const openRequest = () =>
              navigate('/home/rides/request', { state: { scheduledRide: ride } });

            return (
              <li
                key={ride.id}
                className="flex overflow-hidden rounded-xl border border-border-muted bg-surface-input/20"
              >
                <button
                  type="button"
                  onClick={openRequest}
                  className="flex min-w-0 flex-1 items-start gap-3 p-3 text-left transition-colors hover:bg-surface-input/35"
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-muted bg-black/20">
                    <FiCalendar className="h-4 w-4 text-text-main/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-medium text-gray-100">{ride.destination}</h2>
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
                    {ride.returnAt ? (
                      <p className="text-xs text-text-main/60">
                        Retorno: {new Date(ride.returnAt).toLocaleString('pt-BR')}
                      </p>
                    ) : null}
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-gray-100">
                        <FiUsers className="h-4 w-4 shrink-0 text-gray-200" aria-hidden />
                        {passengers} {passengers === 1 ? 'pessoa' : 'pessoas'} no grupo
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={openRequest}
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
