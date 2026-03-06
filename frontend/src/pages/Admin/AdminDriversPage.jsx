import { useState, useEffect } from 'react';
import * as adminService from '../../services/adminService';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import AuthInput from '../../components/ui/AuthInput';

export default function AdminDriversPage() {
  const [result, setResult] = useState({ data: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchDrivers = () => {
    setLoading(true);
    adminService
      .listDrivers({ page, limit: 10, search: search || undefined })
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
    fetchDrivers();
  }, [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDrivers();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-text-main">Motoristas</h1>
        <p className="text-xs md:text-sm text-text-muted mt-1">Acompanhe motoristas, veículos vinculados e status.</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 md:flex-row">
        <div className="flex-1">
          <AuthInput
            type="text"
            placeholder="Buscar por nome ou email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-auto md:min-w-[160px] flex md:items-end">
          <Button
            type="submit"
            variant="brand"
            className="h-[40px] w-full text-sm mt-1 md:mt-0"
          >
            Filtrar
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="text-xs md:text-sm text-text-muted">Carregando...</p>
      ) : result.data.length === 0 ? (
        <p className="text-xs md:text-sm text-text-muted">Nenhum motorista encontrado.</p>
      ) : (
        <div className="space-y-3">
          {result.data.map((driver) => (
            <div
              key={driver.id}
              className="rounded-[10px] border border-border-muted bg-surface-input/30 px-4 py-3 md:px-5 md:py-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm md:text-base text-text-main truncate">
                    {driver.name}
                  </p>
                  <p className="text-xs md:text-sm text-text-muted truncate">
                    {driver.email}
                    {driver.ra && ` · RA ${driver.ra}`}
                  </p>
                </div>
                <Badge variant={driver.isBlocked ? 'danger' : 'success'}>
                  {driver.isBlocked ? 'Bloqueado' : 'Ativo'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[11px] md:text-xs text-text-muted mt-1">
                <span>{driver.vehicles?.length || 0} veículo(s)</span>
                <span>
                  {typeof driver.rideCount === 'number'
                    ? `${driver.rideCount} corridas`
                    : 'Sem corridas registradas'}
                </span>
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