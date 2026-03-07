import { useCallback, useMemo } from 'react';
import { useNotification } from '../useNotification';
import { useAdminFetch } from './useAdminFetch';
import { useAdminFilters } from './useAdminFilters';
import * as adminService from '../../services/adminService';

const INITIAL_FILTERS = { search: '', filterOrder: '', filterStatus: '' };
const DEFAULT_LIMIT = 2;

export function useAdminVehicles() {
  const { show } = useNotification();
  const { filters, setFilter, page, setPage } = useAdminFilters(INITIAL_FILTERS);

  const queryParams = useMemo(
    () => ({
      page,
      limit: DEFAULT_LIMIT,
      search: (filters.search || '').trim() || undefined,
      isDisabled:
        filters.filterStatus === 'true'
          ? 'true'
          : filters.filterStatus === 'false'
          ? 'false'
          : undefined,
      order:
        filters.filterOrder === 'brand_asc'
          ? 'brand_asc'
          : filters.filterOrder === 'brand_desc'
          ? 'brand_desc'
          : undefined,
    }),
    [page, filters.search, filters.filterStatus, filters.filterOrder]
  );

  const { data: vehicles, pagination, loading, refetch } = useAdminFetch(
    adminService.listVehicles,
    queryParams
  );

  const handleDisable = useCallback(
    async (vehicleId, disable, disabledReason) => {
      try {
        await adminService.disableVehicle(vehicleId, disable, disabledReason);
        refetch(false);
        show(
          disable
            ? 'Veículo desativado com sucesso.'
            : 'Veículo ativado com sucesso.',
          'success'
        );
      } catch (err) {
        show(
          err.response?.data?.error || 'Erro ao desativar/ativar veículo.',
          'error'
        );
      }
    },
    [refetch, show]
  );

  return {
    vehicles,
    pagination,
    loading,
    page,
    setPage,
    filters,
    setFilter,
    handleDisable,
  };
}