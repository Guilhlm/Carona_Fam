import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNotification } from '../useNotification';
import { useAdminFetch } from './useAdminFetch';
import { useAdminFilters } from './useAdminFilters';
import { useExpandableList } from './useExpandableList';
import * as adminService from '../../services/adminService';

const INITIAL_FILTERS = { search: '', filterOrder: '', filterStatus: '' };
const REVIEWS_PER_PAGE = 2;

function normalizeReviewsResponse(res) {
  return {
    data: Array.isArray(res?.data) ? res.data : [],
    pagination: res?.pagination ?? {},
  };
}

export function useAdminReviews() {
  const { show } = useNotification();
  const { filters, setFilter, page, setPage } = useAdminFilters(INITIAL_FILTERS);

  const queryParams = useMemo(
    () => ({
      page,
      limit: REVIEWS_PER_PAGE,
      search: (filters.search || '').trim() || undefined,
      isDisabled:
        filters.filterStatus === 'true'
          ? 'true'
          : filters.filterStatus === 'false'
          ? 'false'
          : undefined,
      order: filters.filterOrder || undefined,
    }),
    [page, filters.search, filters.filterStatus, filters.filterOrder]
  );

  const { data, pagination, loading: fetchLoading, refetch } = useAdminFetch(
    adminService.listReviews,
    queryParams
  );

  const [overrideResult, setOverrideResult] = useState(null);
  const [loadingNext, setLoadingNext] = useState(false);

  useEffect(() => {
    setOverrideResult(null);
  }, [queryParams]);

  const effectiveData = overrideResult?.data ?? data ?? [];
  const effectivePagination = overrideResult?.pagination ?? pagination ?? {};
  const loading = fetchLoading || loadingNext;

  const fetchNextPage = useCallback(
    async (pageNum) => {
      const res = await adminService.listReviews({ ...queryParams, page: pageNum });
      return normalizeReviewsResponse(res);
    },
    [queryParams]
  );

  const {
    expandedId,
    displayItems: displayReviews,
    handleToggleExpand,
    handlePageChange,
    resetExpand,
  } = useExpandableList({
    items: effectiveData,
    pageSize: REVIEWS_PER_PAGE,
    page,
    setPage,
    currentResult: { data: effectiveData, pagination: effectivePagination },
    setResult: setOverrideResult,
    fetchNextPage,
    setLoading: setLoadingNext,
    getItemId: (r) => r.id,
  });

  const handleDisable = useCallback(
    async (reviewId, disable, disabledReason) => {
      try {
        await adminService.disableReview(reviewId, disable, disabledReason);
        setOverrideResult(null);
        refetch(false);
        show(
          disable
            ? 'Avaliação desativada com sucesso.'
            : 'Avaliação ativada com sucesso.',
          'success'
        );
      } catch (err) {
        show(
          err.response?.data?.error || 'Erro ao desativar/ativar avaliação.',
          'error'
        );
      }
    },
    [refetch, show]
  );

  return {
    displayReviews,
    pagination: effectivePagination,
    loading,
    page,
    setPage,
    filters,
    setFilter,
    resetExpand,
    handleToggleExpand,
    handlePageChange,
    handleDisable,
    expandedId,
  };
}