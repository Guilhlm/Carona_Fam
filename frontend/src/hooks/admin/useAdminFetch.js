import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Normaliza a resposta da API para sempre { data: array, pagination: object }.
 * @param {*} res - Resposta bruta do serviço (pode ser { data }, { data: { data, pagination } }, etc.)
 */
function normalizeResponse(res) {
  const data = Array.isArray(res?.data) ? res.data : [];
  const pagination = res?.pagination ?? {};
  return { data, pagination };
}

/**
 * Hook genérico para fetch de listas paginadas no Admin.
 * Chama fetchFn(params) quando params mudam e expõe data, pagination, loading, error e refetch.
 *
 * @param {Function} fetchFn - Função (params) => Promise<{ data?, pagination? }>
 * @param {Object} params - Objeto de query (deve ser memoizado pelo caller, ex: useMemo)
 * @returns {{ data, pagination, loading, error, refetch }}
 */
export function useAdminFetch(fetchFn, params) {
  const [result, setResult] = useState({ data: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsRef = useRef(params);
  const fetchFnRef = useRef(fetchFn);
  paramsRef.current = params;
  fetchFnRef.current = fetchFn;

  const performFetch = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await fetchFnRef.current(paramsRef.current);
      setResult(normalizeResponse(res));
    } catch (err) {
      setError(err);
      setResult({ data: [], pagination: {} });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchFnRef.current(paramsRef.current);
        if (cancelled) return;
        setResult(normalizeResponse(res));
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setResult({ data: [], pagination: {} });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [params]);

  const refetch = useCallback((showLoading = true) => performFetch(showLoading), [performFetch]);

  return {
    data: result.data,
    pagination: result.pagination,
    loading,
    error,
    refetch,
  };
}