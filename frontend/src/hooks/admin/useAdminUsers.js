import { useCallback, useMemo } from 'react';
import { useNotification } from '../useNotification';
import { useAdminFetch } from './useAdminFetch';
import { useAdminFilters } from './useAdminFilters';
import * as adminService from '../../services/adminService';

const INITIAL_FILTERS = { search: '', filterBlocked: '', filterRole: '' };
import { ADMIN_ITEMS_PER_PAGE } from '../../pages/Admin/components/adminConstants';

const DEFAULT_LIMIT = ADMIN_ITEMS_PER_PAGE;

export function useAdminUsers() {
  const { show } = useNotification();
  const { filters, setFilter, page, setPage } = useAdminFilters(INITIAL_FILTERS);

  const queryParams = useMemo(
    () => ({
      page,
      limit: DEFAULT_LIMIT,
      search: (filters.search || '').trim() || undefined,
      isBlocked:
        filters.filterBlocked === 'true'
          ? true
          : filters.filterBlocked === 'false'
          ? false
          : undefined,
      role: filters.filterRole || undefined,
    }),
    [page, filters.search, filters.filterBlocked, filters.filterRole]
  );

  const { data: users, pagination, loading, refetch } = useAdminFetch(
    adminService.listUsers,
    queryParams
  );

  const handleBlock = useCallback(
    async (userId, block, blockReason) => {
      try {
        await adminService.blockUser(userId, block, blockReason);
        refetch(false);
        show(
          block ? 'Usuário bloqueado com sucesso.' : 'Usuário ativado com sucesso.',
          'success'
        );
      } catch (err) {
        show(err.response?.data?.error || 'Erro ao bloquear usuário.', 'error');
      }
    },
    [refetch, show]
  );

  const handleToggleAdmin = useCallback(
    async (user, makeAdmin) => {
      try {
        const payload = {};
        if (makeAdmin) {
          payload.role = 'ADMIN';
          payload.isAdmin = true;
        } else {
          if (user.role === 'ADMIN') {
            payload.role = 'USER';
          }
          if (user.isAdmin) {
            payload.isAdmin = false;
          }
        }
        await adminService.updateUser(user.id, payload);
        refetch(false);
      } catch (err) {
        show(
          err.response?.data?.error || 'Erro ao atualizar permissões de administrador.',
          'error'
        );
      }
    },
    [refetch, show]
  );

  return {
    users,
    pagination,
    loading,
    page,
    setPage,
    search: filters.search,
    setSearch: (v) => setFilter('search', v),
    filterBlocked: filters.filterBlocked,
    setFilterBlocked: (v) => setFilter('filterBlocked', v),
    filterRole: filters.filterRole,
    setFilterRole: (v) => setFilter('filterRole', v),
    handleBlock,
    handleToggleAdmin,
  };
}