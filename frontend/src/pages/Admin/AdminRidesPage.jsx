import { useAdminRides } from '../../hooks/admin/useAdminRides';
import AdminFilters from './components/AdminFilters';
import { buildSelects, RIDES_SELECTS } from './components/adminFilterConfig';
import AdminCard from './components/AdminCard';
import AdminPagination from './AdminPagination';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-text-main">Corridas</h1>
      </div>

      <AdminFilters
        searchPlaceholder="Buscar por origem, destino, motorista ou passageiro"
        searchValue={filters.search}
        onSearchChange={(v) => handleFilterChange('search', v)}
        selects={selects}
        loading={loading}
      />

      {loading ? (
        <p className="text-xs md:text-sm text-text-muted">Carregando...</p>
      ) : displayRides.length === 0 ? (
        <p className="text-xs md:text-sm text-text-muted">
          Nenhuma corrida encontrada com os filtros atuais.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayRides.map((ride) => (
              <div
                key={ride.id}
                className={expandedId === ride.id ? 'md:col-span-2' : ''}
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

          <AdminPagination
            pagination={pagination}
            page={page}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}