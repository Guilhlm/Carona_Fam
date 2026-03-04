import { useState, useEffect } from 'react';
import * as adminService from '../../services/adminService';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';

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
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDrivers();
  };

  const headers = ['Nome', 'Email', 'RA', 'Veículos', 'Corridas', 'Status'];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Motoristas</h1>
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Buscar por nome ou email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 flex-1 max-w-xs"
        />
        <button
          type="submit"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Buscar
        </button>
      </form>
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <>
          <Table headers={headers}>
            {result.data.map((driver) => (
              <tr key={driver.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {driver.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {driver.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {driver.ra || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {driver.vehicles?.length || 0} veículo(s)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {driver.rideCount ?? '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={driver.isBlocked ? 'danger' : 'success'}>
                    {driver.isBlocked ? 'Bloqueado' : 'Ativo'}
                  </Badge>
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
