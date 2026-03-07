import { useCallback, useState } from 'react';

/**
 * Hook genérico para estado de filtros + página no Admin.
 * Ao atualizar qualquer filtro, reseta a página para 1.
 *
 * @param {Object} initialState - Objeto com valores iniciais (ex: { search: '', filterOrder: '', filterStatus: '' })
 * @returns {{ filters, setFilter, page, setPage, resetToFirstPage }}
 */
export function useAdminFilters(initialState) {
  const [filters, setFiltersState] = useState(initialState);
  const [page, setPageState] = useState(1);

  const setFilter = useCallback((key, value) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
    setPageState(1);
  }, []);

  const setPage = useCallback((nextPage) => {
    setPageState(nextPage);
  }, []);

  const resetToFirstPage = useCallback(() => {
    setPageState(1);
  }, []);

  return {
    filters,
    setFilter,
    page,
    setPage,
    resetToFirstPage,
  };
}