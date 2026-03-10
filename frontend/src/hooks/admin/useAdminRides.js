import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNotification } from '../useNotification';
import { useAdminFetch } from './useAdminFetch';
import { useAdminFilters } from './useAdminFilters';
import { useExpandableList } from './useExpandableList';
import * as adminService from '../../services/adminService';

const INITIAL_FILTERS = { search: '', filterStatus: '', filterOrder: 'date_desc' };
const RIDES_PER_PAGE = 10;

function normalizeRidesResponse(res) {
  const list = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? []);
  const pag = res?.pagination ?? res?.data?.pagination ?? {};
  return { data: list, pagination: pag };
}

const fetchRidesNormalized = async (params) => {
  const res = await adminService.listRides(params);
  return normalizeRidesResponse(res);
};

export function useAdminRides() {
  const { show } = useNotification();
  const { filters, setFilter, page, setPage } = useAdminFilters(INITIAL_FILTERS);

  const queryParams = useMemo(
    () => ({
      page,
      limit: RIDES_PER_PAGE,
      status: filters.filterStatus || undefined,
      search: (filters.search || '').trim() || undefined,
      order: filters.filterOrder || undefined,
    }),
    [page, filters.filterStatus, filters.search, filters.filterOrder]
  );

  const { data, pagination, loading: fetchLoading, refetch } = useAdminFetch(
    fetchRidesNormalized,
    queryParams
  );

  const [overrideResult, setOverrideResult] = useState(null);
  const [loadingNext, setLoadingNext] = useState(false);

  useEffect(() => {
    setOverrideResult(null);
  }, [queryParams]);

  const effectiveData = overrideResult?.data ?? data ?? [];
  const effectivePagination = overrideResult?.pagination ?? pagination ?? {};

  // Ordenação feita no backend; frontend usa os dados já ordenados
  const rides = effectiveData;

  const loading = fetchLoading || loadingNext;

  const fetchNextPage = useCallback(
    async (pageNum) => {
      return fetchRidesNormalized({ ...queryParams, page: pageNum });
    },
    [queryParams]
  );

  const {
    expandedId,
    displayItems: displayRides,
    handleToggleExpand,
    handlePageChange,
    resetExpand,
  } = useExpandableList({
    items: rides,
    pageSize: RIDES_PER_PAGE,
    page,
    setPage,
    currentResult: { data: rides, pagination: effectivePagination },
    setResult: setOverrideResult,
    fetchNextPage,
    setLoading: setLoadingNext,
    getItemId: (r) => r.id,
  });

  const handleCancelRide = useCallback(
    async (rideId) => {
      try {
        await adminService.cancelRide(rideId);
        setOverrideResult(null);
        refetch(false);
        show('Corrida cancelada com sucesso.', 'success');
      } catch (err) {
        show(err.response?.data?.error || 'Erro ao cancelar corrida.', 'error');
      }
    },
    [refetch, show]
  );

  return {
    displayRides,
    pagination: effectivePagination,
    loading,
    page,
    setPage,
    filters,
    setFilter,
    resetExpand,
    handleToggleExpand,
    handlePageChange,
    handleCancelRide,
    expandedId,
  };
}