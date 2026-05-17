import { useAdminVehicles } from '../../hooks/admin/useAdminVehicles';
import AdminFilters from './components/AdminFilters';
import { buildSelects, VEHICLES_SELECTS } from './components/adminFilterConfig';
import AdminCard from './components/AdminCard';
import AdminPageShell from './components/AdminPageShell';
import AdminListSection from './components/AdminListSection';
import { ADMIN_CARD_GRID_CLASS } from './components/adminConstants';

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
    <AdminPageShell
      title="Veículos"
      loading={loading}
      isEmpty={!loading && vehicles.length === 0}
      emptyMessage="Nenhum veículo encontrado com os filtros atuais."
      filters={
        <AdminFilters
          searchPlaceholder="Buscar por placa, marca ou motorista"
          searchValue={filters.search}
          onSearchChange={(v) => setFilter('search', v)}
          selects={selects}
          loading={loading}
        />
      }
    >
      <AdminListSection pagination={pagination} page={page} onPageChange={setPage}>
        <div className={ADMIN_CARD_GRID_CLASS}>
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="h-full min-h-0">
              <AdminCard
                variant="vehicle"
                item={vehicle}
                onToggleDisable={handleDisable}
              />
            </div>
          ))}
        </div>
      </AdminListSection>
    </AdminPageShell>
  );
}
