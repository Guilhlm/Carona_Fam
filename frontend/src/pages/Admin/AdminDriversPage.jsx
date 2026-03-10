import { useAuth } from '../../contexts/AuthContext';
import { useAdminDrivers } from '../../hooks/admin/useAdminDrivers';
import AdminFilters from './components/AdminFilters';
import { buildSelects, DRIVERS_SELECTS } from './components/adminFilterConfig';
import AdminCard from './components/AdminCard';
import AdminPagination from './AdminPagination';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-text-main">Motoristas</h1>
      </div>

      <AdminFilters
        searchPlaceholder="Buscar por nome ou carro"
        searchValue={filters.search}
        onSearchChange={(v) => setFilter('search', v)}
        selects={selects}
        loading={loading}
      />

      {loading ? (
        <p className="text-xs md:text-sm text-text-muted">Carregando...</p>
      ) : drivers.length === 0 ? (
        <p className="text-xs md:text-sm text-text-muted">
          Nenhum motorista encontrado com os filtros atuais.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {drivers.map((driver) => (
              <AdminCard
                key={driver.id}
                variant="driver"
                item={driver}
                isCurrentUser={driver.id === currentUser?.id}
                onToggleBlock={handleBlock}
              />
            ))}
          </div>

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