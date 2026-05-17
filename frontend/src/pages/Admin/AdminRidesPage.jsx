import { useAdminRides } from '../../hooks/admin/useAdminRides';
import AdminFilters from './components/AdminFilters';
import { buildSelects, RIDES_SELECTS } from './components/adminFilterConfig';
import AdminCard from './components/AdminCard';
import AdminPageShell from './components/AdminPageShell';
import AdminListSection from './components/AdminListSection';
import { ADMIN_CARD_GRID_CLASS } from './components/adminConstants';

export default function AdminRidesPage() {
  const {
    displayRides,
    pagination,
    loading,
    page,
    filters,
    setFilter,
    resetExpand,
    handlePageChange,
    handleToggleExpand,
    handleCancelRide,
    expandedId,
  } = useAdminRides();

  const handleFilterChange = (key, value) => {
    setFilter(key, value);
    resetExpand();
  };

  const selects = buildSelects(
    RIDES_SELECTS,
    filters,
    (k, v) => handleFilterChange(k, v)
  );

  return (
    <AdminPageShell
      title="Corridas"
      loading={loading}
      isEmpty={!loading && displayRides.length === 0}
      emptyMessage="Nenhuma corrida encontrada com os filtros atuais."
      filters={
        <AdminFilters
          searchPlaceholder="Buscar por origem, destino, motorista ou passageiro"
          searchValue={filters.search}
          onSearchChange={(v) => handleFilterChange('search', v)}
          selects={selects}
          loading={loading}
        />
      }
    >
      <AdminListSection pagination={pagination} page={page} onPageChange={handlePageChange}>
        <div className={ADMIN_CARD_GRID_CLASS}>
          {displayRides.map((ride) => (
            <div
              key={ride.id}
              className={`h-full min-h-0 ${expandedId === ride.id ? 'md:col-span-2' : ''}`}
            >
              <AdminCard
                variant="ride"
                item={ride}
                expanded={expandedId === ride.id}
                onToggleExpand={handleToggleExpand}
                onCancelRide={handleCancelRide}
              />
            </div>
          ))}
        </div>
      </AdminListSection>
    </AdminPageShell>
  );
}
