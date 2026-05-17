import { useNavigate } from 'react-router-dom';
import { FiNavigation } from 'react-icons/fi';
import RideListCard from './RideListCard';
import { useOpenRides } from '../../hooks/useOpenRides';

export default function OpenRidesForNowSection() {
  const navigate = useNavigate();
  const { rides, loading } = useOpenRides();

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-100 mb-3">Corridas para agora sem motorista</h2>

      {loading ? (
        <div className="rounded-xl border border-border-muted bg-surface-input/20 p-4 text-sm text-text-main/70">
          Buscando corridas abertas...
        </div>
      ) : rides.length === 0 ? (
        <div className="rounded-xl border border-border-muted bg-surface-input/20 p-4 text-sm text-text-main/70">
          Nenhuma corrida disponível no momento. Te avisamos assim que aparecer uma.
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => {
            const title = `${ride.origin} → ${ride.destination}`;
            const subtitleParts = [];
            if (ride.requester?.name) subtitleParts.push(ride.requester.name);
            if (ride.distanceKm != null) subtitleParts.push(`${Number(ride.distanceKm).toFixed(1)} km`);
            if (ride.estimatedTimeMin != null) subtitleParts.push(`${ride.estimatedTimeMin} min`);
            if (ride.estimatedValue != null) subtitleParts.push(`R$ ${Number(ride.estimatedValue).toFixed(2)}`);

            return (
              <RideListCard
                key={ride.id}
                title={title}
                subtitle={subtitleParts.join(' · ')}
                icon={<FiNavigation className="w-4 h-4 text-brand" />}
                onClick={() => navigate(`/home/rides/${ride.id}/preview`)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
