import { useAuth } from '../../contexts/AuthContext';
import { useAdminDrivers } from '../../hooks/admin/useAdminDrivers';
import AdminFilters from './components/AdminFilters';
import { buildSelects, DRIVERS_SELECTS } from './components/adminFilterConfig';
import AdminCard from './components/AdminCard';
import AdminPageShell from './components/AdminPageShell';
import AdminListSection from './components/AdminListSection';
import { ADMIN_CARD_GRID_CLASS } from './components/adminConstants';

export default function AdminDriversPage() {
  const { user: currentUser } = useAuth();
  const {
    drivers,
    pagination,
    loading,
    page,
    setPage,
    filters,
    setFilter,
    handleBlock,
  } = useAdminDrivers();

  const selects = buildSelects(DRIVERS_SELECTS, filters, setFilter);

  return (
    <AdminPageShell
      title="Motoristas"
      loading={loading}
      isEmpty={!loading && drivers.length === 0}
      emptyMessage="Nenhum motorista encontrado com os filtros atuais."
      filters={
        <AdminFilters
          searchPlaceholder="Buscar por nome ou carro"
          searchValue={filters.search}
          onSearchChange={(v) => setFilter('search', v)}
          selects={selects}
          loading={loading}
        />
      }
    >
      <AdminListSection pagination={pagination} page={page} onPageChange={setPage}>
        <div className={ADMIN_CARD_GRID_CLASS}>
          {drivers.map((driver) => (
            <div key={driver.id} className="h-full min-h-0">
              <AdminCard
                variant="driver"
                item={driver}
                isCurrentUser={driver.id === currentUser?.id}
                onToggleBlock={handleBlock}
              />
            </div>
          ))}
        </div>
      </AdminListSection>
    </AdminPageShell>
  );
}
