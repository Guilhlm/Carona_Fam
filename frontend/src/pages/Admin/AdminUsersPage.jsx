import { useAuth } from '../../contexts/AuthContext';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import AdminUsersFilters from './AdminUsersFilters';
import AdminUserCard from './AdminUserCard';
import AdminUsersPagination from './AdminUsersPagination';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
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
    handleSearchSubmit,
    handleBlock,
    handleToggleAdmin,
  } = useAdminUsers();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-text-main">Usuários</h1>
        <p className="text-xs md:text-sm text-text-muted mt-1">Liste, filtre e gerencie permissões e bloqueios.</p>
      </div>

      <AdminUsersFilters
        search={search}
        onSearchChange={setSearch}
        onSubmit={handleSearchSubmit}
        filterRole={filterRole}
        onFilterRoleChange={(value) => {
          setFilterRole(value);
          setPage(1);
        }}
        filterBlocked={filterBlocked}
        onFilterBlockedChange={(value) => {
          setFilterBlocked(value);
          setPage(1);
        }}
        loading={loading}
      />

      {loading ? (
        <p className="text-xs md:text-sm text-text-muted">Carregando...</p>
      ) : users.length === 0 ? (
        <p className="text-xs md:text-sm text-text-muted">Nenhum usuário encontrado com os filtros atuais.</p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <AdminUserCard
              key={user.id}
              user={user}
              isCurrentUser={user.id === currentUser?.id}
              onToggleAdmin={handleToggleAdmin}
              onToggleBlock={handleBlock}
            />
          ))}

          <AdminUsersPagination
            pagination={pagination}
            page={page}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}