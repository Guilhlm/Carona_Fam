import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNotification } from '../useNotification';
import { useAdminFetch } from './useAdminFetch';
import { useAdminFilters } from './useAdminFilters';
import { useExpandableList } from './useExpandableList';
import * as adminService from '../../services/adminService';

const INITIAL_FILTERS = { search: '', filterStatus: '', filterOrder: 'date_desc' };
import { ADMIN_ITEMS_PER_PAGE } from '../../pages/Admin/components/adminConstants';

const RIDES_PER_PAGE = ADMIN_ITEMS_PER_PAGE;

function normalizeRidesResponse(response) {
  const rides = Array.isArray(response?.data) ? response.data : (response?.data?.data ?? []);
  const pagination = response?.pagination ?? response?.data?.pagination ?? {};
  return { data: rides, pagination };
}

const fetchRidesNormalized = async (params) => {
  const response = await adminService.listRides(params);
  return normalizeRidesResponse(response);
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
    getItemId: (rideRecord) => rideRecord.id,
  });

  const handleCancelRide = useCallback(
    async (rideId) => {
      try {
        await adminService.cancelRide(rideId);
        setOverrideResult(null);
        refetch(false);
        show('Corrida cancelada com sucesso.', 'success');
      } catch (cancelError) {
        show(cancelError.response?.data?.error || 'Erro ao cancelar corrida.', 'error');
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