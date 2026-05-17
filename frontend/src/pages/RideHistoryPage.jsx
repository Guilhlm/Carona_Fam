import { useState, useEffect } from 'react';
import * as rideService from '../services/rideService';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { filterHistoryRides } from '../utils/rideNavigation';

const statusLabels = {
  WAITING_DRIVER: 'Aguardando motorista',
  DRIVER_ACCEPTED: 'Motorista aceito',
  DRIVER_ARRIVING: 'Motorista a caminho',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};

const statusVariant = {
  WAITING_DRIVER: 'warning',
  DRIVER_ACCEPTED: 'info',
  DRIVER_ARRIVING: 'info',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export default function RideHistoryPage() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rideService
      .getRideHistory()
      .then((rides) => setRides(filterHistoryRides(rides)))
      .catch(() => setRides([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Histórico de Corridas</h1>
      {rides.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          Nenhuma corrida encontrada.
        </Card>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => {
            const dateValue = ride.completedAt ?? ride.cancelledAt ?? ride.requestedAt ?? ride.departureAt;
            return (
              <Card key={ride.id} className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{ride.origin} → {ride.destination}</p>
                    <p className="text-sm text-gray-500 truncate">
                      Passageiro: {ride.requester?.name ?? '—'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      Motorista: {ride.driver?.name ?? '—'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {dateValue ? new Date(dateValue).toLocaleString('pt-BR') : '—'}
                    </p>
                  </div>
                  <Badge variant={statusVariant[ride.status] || 'default'}>
                    {statusLabels[ride.status] || ride.status}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
