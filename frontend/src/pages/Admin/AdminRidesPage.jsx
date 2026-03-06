import { useState, useEffect } from 'react';
import * as adminService from '../../services/adminService';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import AuthInput from '../../components/ui/AuthInput';

const statusLabels = {
  ACTIVE: 'Ativa',
  FINISHED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

const statusVariant = {
  ACTIVE: 'info',
  FINISHED: 'success',
  CANCELLED: 'danger',
};

export default function AdminRidesPage() {
  const [result, setResult] = useState({ data: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchRides = () => {
    setLoading(true);
    adminService
      .listRides({
        page,
        limit: 10,
        status: statusFilter || undefined,
        search: search || undefined,
      })
      .then((res) => {
        setResult({
          data: res.data || [],
          pagination: res.pagination || {},
        });
      })
      .catch(() => setResult({ data: [], pagination: {} }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRides();
  }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRides();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-text-main">Corridas</h1>
        <p className="text-xs md:text-sm text-text-muted mt-1"> Visualize corridas criadas, status e detalhes principais.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <form onSubmit={handleSearch} className="flex-1 flex flex-col gap-2">
          <AuthInput
            type="text"
            placeholder="Buscar por origem, destino ou motorista"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex">
            <Button
              type="submit"
              variant="brand"
              className="h-[40px] w-full text-sm"
            >
              Filtrar
            </Button>
          </div>
        </form>

        <div className="md:w-[200px]">
          <div className="flex items-center h-[40px] rounded-[10px] border border-border-muted bg-surface-input/20 backdrop-blur-2xl px-3 text-xs md:text-sm text-text-muted">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-full bg-transparent text-xs md:text-sm text-text-main focus:outline-none"
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativa</option>
              <option value="FINISHED">Finalizada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-xs md:text-sm text-text-muted">Carregando...</p>
      ) : result.data.length === 0 ? (
        <p className="text-xs md:text-sm text-text-muted">Nenhuma corrida encontrada.</p>
      ) : (
        <div className="space-y-3">
          {result.data.map((ride) => (
            <div
              key={ride.id}
              className="rounded-[10px] border border-border-muted bg-surface-input/30 px-4 py-3 md:px-5 md:py-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm md:text-base text-text-main truncate">
                    {ride.origin} → {ride.destination}
                  </p>
                  <p className="text-xs md:text-sm text-text-muted truncate">
                    Motorista: {ride.driver?.name || 'Não informado'}
                  </p>
                </div>
                <Badge variant={statusVariant[ride.status] || 'default'}>
                  {statusLabels[ride.status] || ride.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[11px] md:text-xs text-text-muted mt-1">
                <span>
                  {ride.departureAt
                    ? new Date(ride.departureAt).toLocaleString('pt-BR')
                    : '-'}
                </span>
                <span>{ride.passengers?.length || 0} passageiro(s)</span>
              </div>
            </div>
          ))}

          {result.pagination.totalPages > 1 && (
            <div className="pt-1 flex justify-between items-center text-xs md:text-sm text-text-muted">
              <p>
                Página {result.pagination.page} de {result.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-[32px] px-3 text-xs"
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  disabled={page >= result.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-[32px] px-3 text-xs"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}