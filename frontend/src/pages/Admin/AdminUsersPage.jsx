import { useAdminUsers } from '../../hooks/admin/useAdminUsers';
import AdminFilters from './components/AdminFilters';
import { buildSelects, USERS_SELECTS } from './components/adminFilterConfig';
import AdminCard from './components/AdminCard';
import AdminPagination from './AdminPagination';

export default function AdminUsersPage() {
  const {
    users,
    pagination,
    loading,
    page,
    setPage,
    search,
    setSearch,
    filterBlocked,
    setFilterBlocked,
    filterRole,
    setFilterRole,
    handleBlock,
    handleToggleAdmin,
  } = useAdminUsers();

  const filters = { filterRole, filterBlocked };
  const setFilter = (key, value) => {
    if (key === 'filterRole') setFilterRole(value);
    else setFilterBlocked(value);
  };
  const selects = buildSelects(USERS_SELECTS, filters, setFilter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-text-main">Usuários</h1>
      </div>

      <AdminFilters
        searchPlaceholder="Buscar por nome, email ou RA"
        searchValue={search}
        onSearchChange={setSearch}
        selects={selects}
        loading={loading}
      />

      {loading ? (
        <p className="text-xs md:text-sm text-text-muted">Carregando...</p>
      ) : users.length === 0 ? (
        <p className="text-xs md:text-sm text-text-muted">Nenhum usuário encontrado com os filtros atuais.</p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <AdminCard
              key={user.id}
              variant="user"
              item={user}
              onToggleAdmin={handleToggleAdmin}
              onToggleBlock={handleBlock}
            />
          ))}

          <AdminPagination
            pagination={pagination}
            page={page}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}