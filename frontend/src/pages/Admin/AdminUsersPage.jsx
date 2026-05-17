import { useAdminUsers } from '../../hooks/admin/useAdminUsers';
import AdminFilters from './components/AdminFilters';
import { buildSelects, USERS_SELECTS } from './components/adminFilterConfig';
import AdminCard from './components/AdminCard';
import AdminPageShell from './components/AdminPageShell';
import AdminListSection from './components/AdminListSection';
import { ADMIN_CARD_GRID_CLASS } from './components/adminConstants';

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
    <AdminPageShell
      title="Usuários"
      loading={loading}
      isEmpty={!loading && users.length === 0}
      emptyMessage="Nenhum usuário encontrado com os filtros atuais."
      filters={
        <AdminFilters
          searchPlaceholder="Buscar por nome, email ou RA"
          searchValue={search}
          onSearchChange={setSearch}
          selects={selects}
          loading={loading}
        />
      }
    >
      <AdminListSection pagination={pagination} page={page} onPageChange={setPage}>
        <div className={ADMIN_CARD_GRID_CLASS}>
          {users.map((user) => (
            <div key={user.id} className="h-full min-h-0">
              <AdminCard
                variant="user"
                item={user}
                onToggleAdmin={handleToggleAdmin}
                onToggleBlock={handleBlock}
              />
            </div>
          ))}
        </div>
      </AdminListSection>
    </AdminPageShell>
  );
}
