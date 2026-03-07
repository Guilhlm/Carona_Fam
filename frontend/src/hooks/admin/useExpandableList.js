import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Encapsula a lógica de "um item expandido por vez" e prefetch da próxima página ao expandir.
 * Quando o usuário avança de página e já tem itens em pushedItems, usa o merge em vez de refetch.
 *
 * @param {Object} options
 * @param {Array} options.items - Lista atual de itens (da página atual)
 * @param {number} options.pageSize - Tamanho da página (ex: REVIEWS_PER_PAGE)
 * @param {number} options.page - Página atual
 * @param {Function} options.setPage - (nextPage) => void
 * @param {Object} options.currentResult - { data, pagination } do fetch atual
 * @param {Function} options.setResult - (nextResult) => void, para atualizar resultado no parent
 * @param {Function} options.fetchNextPage - (pageNum) => Promise<{ data, pagination }>
 * @param {Function} [options.setLoading] - (boolean) => void, opcional
 * @param {Function} options.getItemId - (item) => id, para comparar itens (ex: (r) => r.id)
 */
export function useExpandableList({
  items,
  pageSize,
  page,
  setPage,
  currentResult,
  setResult,
  fetchNextPage,
  setLoading,
  getItemId = (item) => item?.id,
}) {
  const [expandedId, setExpandedIdState] = useState(null);
  const [pushedItems, setPushedItems] = useState([]);

  const displayItems = useMemo(() => {
    if (!expandedId) return items;
    const expanded = items.find((item) => getItemId(item) === expandedId);
    return expanded ? [expanded] : items.slice(0, 1);
  }, [items, expandedId, getItemId]);

  const handleToggleExpand = useCallback((itemId) => {
    setExpandedIdState((prev) => {
      if (prev === itemId) {
        setPushedItems([]);
        return null;
      }
      return itemId;
    });
  }, []);

  // Preencher pushedItems quando um item é expandido (itens após o expandido na lista)
  useEffect(() => {
    if (!expandedId || pushedItems.length > 0) return;
    const idx = items.findIndex((item) => getItemId(item) === expandedId);
    if (idx >= 0 && idx < items.length - 1) {
      setPushedItems(items.slice(idx + 1));
    }
  }, [expandedId, items, pushedItems.length, getItemId]);

  const handlePageChange = useCallback(
    async (newPage) => {
      if (newPage < page) {
        setExpandedIdState(null);
        setPushedItems([]);
        setPage(newPage);
        return;
      }
      if (newPage > page && pushedItems.length > 0) {
        if (setLoading) setLoading(true);
        try {
          const next = await fetchNextPage(newPage);
          const nextData = Array.isArray(next?.data) ? next.data : [];
          const merged = [...pushedItems, ...nextData];
          setResult({
            data: merged.slice(0, pageSize),
            pagination: next?.pagination ?? currentResult?.pagination ?? {},
          });
          setPushedItems(merged.slice(pageSize));
          setPage(newPage);
          setExpandedIdState(null);
        } catch {
          setResult({ data: [], pagination: {} });
        } finally {
          if (setLoading) setLoading(false);
        }
      } else {
        setExpandedIdState(null);
        setPushedItems([]);
        setPage(newPage);
      }
    },
    [
      page,
      pushedItems,
      pageSize,
      currentResult?.pagination,
      setPage,
      setResult,
      fetchNextPage,
      setLoading,
    ]
  );

  const resetExpand = useCallback(() => {
    setExpandedIdState(null);
    setPushedItems([]);
  }, []);

  return {
    expandedId,
    displayItems,
    handleToggleExpand,
    handlePageChange,
    resetExpand,
  };
}