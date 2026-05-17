import RideListCard from './ride/RideListCard';

export default function PreviousTripsList({ ridesLoading, trips }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-100 mb-3">Suas viagens anteriores</h2>
      {ridesLoading ? (
        <div className="rounded-xl border border-border-muted bg-surface-input/20 p-4 text-sm text-text-main/70">
          Carregando histórico...
        </div>
      ) : trips.length === 0 ? (
        <div className="rounded-xl border border-border-muted bg-surface-input/20 p-4 text-sm text-text-main/70">
          Você ainda não possui viagens anteriores.
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((ride) => (
            <RideListCard
              key={ride.id}
              title={ride.title}
              subtitle={ride.subtitle}
              meta={ride.meta}
              onClick={ride.onClick}
            />
          ))}
        </div>
      )}
    </section>
  );
}
