import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiNavigation } from 'react-icons/fi';
import { isActiveRideStatus } from '../utils/rideNavigation';

function trackPath(scheduled) {
  const rideId = scheduled.rideId || scheduled.ride?.id;
  if (!rideId) return null;
  const status = scheduled.ride?.status || 'WAITING_DRIVER';
  return status === 'WAITING_DRIVER'
    ? `/home/rides/${rideId}/waiting`
    : `/home/rides/${rideId}/active`;
}

export default function JoinedCaronaRidesList({ rides, title = 'Suas caronas' }) {
  const navigate = useNavigate();
  const items = Array.isArray(rides) ? rides : [];

  if (items.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-3">{title}</h2>
      <div className="space-y-3">
        {items.map((ride) => {
          const path = trackPath(ride);
          const inRide =
            ride.status === 'REQUESTED' &&
            path &&
            isActiveRideStatus(ride.ride?.status);

          return (
            <div
              key={ride.id}
              className="rounded-xl border border-brand/30 bg-brand/10 overflow-hidden"
            >
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-wide text-brand mb-1">Carona confirmada</p>
                <h3 className="text-sm font-medium text-gray-100 truncate">
                  {ride.origin ? `${ride.origin} → ` : ''}
                  {ride.destination}
                </h3>
                {ride.creator?.name ? (
                  <p className="text-xs text-text-main/60 mt-0.5">Com {ride.creator.name}</p>
                ) : null}
                <p className="text-xs text-text-main/55 mt-1 flex items-center gap-1">
                  <FiCalendar className="h-3 w-3 shrink-0" />
                  {ride.departureAt
                    ? new Date(ride.departureAt).toLocaleString('pt-BR')
                    : 'Horário não informado'}
                </p>
              </div>
              {inRide ? (
                <div className="border-t border-brand/20 p-2">
                  <button
                    type="button"
                    onClick={() => navigate(path)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand py-2.5 text-xs font-semibold text-white hover:bg-brand/80"
                  >
                    <FiNavigation className="h-3.5 w-3.5" />
                    Acompanhar corrida
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
