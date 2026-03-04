import { useState, useEffect } from 'react';
import * as adminService from '../../services/adminService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

export default function AdminUsersPage() {
  const [result, setResult] = useState({ data: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterBlocked, setFilterBlocked] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    adminService
      .listUsers({
        page,
        limit: 10,
        search: search || undefined,
        isBlocked: filterBlocked === 'true' ? true : filterBlocked === 'false' ? false : undefined,
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
    fetchUsers();
  }, [page, filterBlocked]);

  const handleBlock = async (userId, block) => {
    try {
      await adminService.blockUser(userId, block);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao bloquear');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const headers = ['Nome', 'Email', 'RA', 'Função', 'Status', 'Ações'];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Usuários</h1>
      <div className="mb-4 flex flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Buscar por nome, email ou RA"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Button type="submit">Buscar</Button>
        </form>
        <select
          value={filterBlocked}
          onChange={(e) => {
            setFilterBlocked(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">Todos</option>
          <option value="false">Ativos</option>
          <option value="true">Bloqueados</option>
        </select>
      </div>
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <>
          <Table headers={headers}>
            {result.data.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.ra || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={user.isBlocked ? 'danger' : 'success'}>
                    {user.isBlocked ? 'Bloqueado' : 'Ativo'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.role !== 'ADMIN' && !user.isAdmin && (
                    <Button
                      variant={user.isBlocked ? 'secondary' : 'danger'}
                      onClick={() => handleBlock(user.id, !user.isBlocked)}
                    >
                      {user.isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </Button>
                  )}
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
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  disabled={page >= result.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
