import { useState, useEffect } from 'react';
import * as adminService from '../../services/adminService';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';

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

  const headers = ['Origem', 'Destino', 'Motorista', 'Data', 'Status', 'Passageiros'];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Corridas</h1>
      <div className="mb-4 flex flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Buscar
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativa</option>
          <option value="FINISHED">Finalizada</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
      </div>
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <>
          <Table headers={headers}>
            {result.data.map((ride) => (
              <tr key={ride.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{ride.origin}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{ride.destination}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {ride.driver?.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {ride.departureAt
                    ? new Date(ride.departureAt).toLocaleString('pt-BR')
                    : '-'}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={statusVariant[ride.status] || 'default'}>
                    {statusLabels[ride.status] || ride.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {ride.passengers?.length || 0}
                </td>
              </tr>
            ))}
          </Table>
          {result.pagination.totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Página {result.pagination.page} de {result.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= result.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
