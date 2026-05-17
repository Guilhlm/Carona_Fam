import { useCallback, useMemo } from 'react';
import { useNotification } from '../useNotification';
import { useAdminFetch } from './useAdminFetch';
import { useAdminFilters } from './useAdminFilters';
import * as adminService from '../../services/adminService';

const INITIAL_FILTERS = { search: '', filterOrder: 'name_asc', filterStatus: '' };
import { ADMIN_ITEMS_PER_PAGE } from '../../pages/Admin/components/adminConstants';

const DEFAULT_LIMIT = ADMIN_ITEMS_PER_PAGE;

export function useAdminDrivers() {
  const { show } = useNotification();
  const { filters, setFilter, page, setPage } = useAdminFilters(INITIAL_FILTERS);

  const queryParams = useMemo(
    () => ({
      page,
      limit: DEFAULT_LIMIT,
      search: (filters.search || '').trim() || undefined,
      isBlocked:
        filters.filterStatus === 'true'
          ? 'true'
          : filters.filterStatus === 'false'
          ? 'false'
          : undefined,
    }),
    [page, filters.search, filters.filterStatus]
  );

  const { data: rawDrivers, pagination, loading, refetch } = useAdminFetch(
    adminService.listDrivers,
    queryParams
  );

  const drivers = useMemo(() => {
    let list = rawDrivers ?? [];
    if (filters.filterOrder === 'name_asc') {
      list = [...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    } else if (filters.filterOrder === 'name_desc') {
      list = [...list].sort((a, b) => (b.name ?? '').localeCompare(a.name ?? ''));
    }
    return list;
  }, [rawDrivers, filters.filterOrder]);

  const handleBlock = useCallback(
    async (userId, block, blockReason) => {
      const reason = String(blockReason ?? '').trim();
      if (block && !reason) {
        show('Informe o motivo do bloqueio do motorista.', 'error');
        return;
      }

      try {
        await adminService.blockUser(userId, block, reason || undefined);
        refetch(false);
        show(
          block ? 'Motorista bloqueado com sucesso.' : 'Motorista ativado com sucesso.',
          'success'
        );
      } catch (err) {
        show(err.response?.data?.error || 'Erro ao bloquear motorista.', 'error');
      }
    },
    [refetch, show]
  );

  return {
    drivers,
    pagination,
    loading,
    page,
    setPage,
    filters,
    setFilter,
    handleBlock,
  };
}