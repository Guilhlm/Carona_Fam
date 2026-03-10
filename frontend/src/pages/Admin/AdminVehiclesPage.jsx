import { useAdminVehicles } from '../../hooks/admin/useAdminVehicles';
import AdminFilters from './components/AdminFilters';
import { buildSelects, VEHICLES_SELECTS } from './components/adminFilterConfig';
import AdminCard from './components/AdminCard';
import AdminPagination from './AdminPagination';

export default function AdminVehiclesPage() {
  const {
    vehicles,
    pagination,
    loading,
    page,
    setPage,
    filters,
    setFilter,
    handleDisable,
  } = useAdminVehicles();

  const selects = buildSelects(VEHICLES_SELECTS, filters, setFilter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-text-main">
          Veículos
        </h1>
      </div>

      <AdminFilters
        searchPlaceholder="Buscar por placa, marca ou motorista"
        searchValue={filters.search}
        onSearchChange={(v) => setFilter('search', v)}
        selects={selects}
        loading={loading}
      />

      {loading ? (
        <p className="text-xs md:text-sm text-text-muted">Carregando...</p>
      ) : vehicles.length === 0 ? (
        <p className="text-xs md:text-sm text-text-muted">
          Nenhum veículo encontrado com os filtros atuais.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vehicles.map((vehicle) => (
              <AdminCard
                key={vehicle.id}
                variant="vehicle"
                item={vehicle}
                onToggleDisable={handleDisable}
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