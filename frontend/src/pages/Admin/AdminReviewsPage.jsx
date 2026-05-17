import { useAdminReviews } from '../../hooks/admin/useAdminReviews';
import AdminFilters from './components/AdminFilters';
import { buildSelects, REVIEWS_SELECTS } from './components/adminFilterConfig';
import AdminCard from './components/AdminCard';
import AdminPageShell from './components/AdminPageShell';
import AdminListSection from './components/AdminListSection';
import { ADMIN_CARD_GRID_CLASS } from './components/adminConstants';

export default function AdminReviewsPage() {
  const {
    displayReviews,
    pagination,
    loading,
    page,
    filters,
    setFilter,
    resetExpand,
    handlePageChange,
    handleToggleExpand,
    handleDisable,
    expandedId,
  } = useAdminReviews();

  const handleFilterChange = (key, value) => {
    setFilter(key, value);
    resetExpand();
  };

  const selects = buildSelects(
    REVIEWS_SELECTS,
    filters,
    (k, v) => handleFilterChange(k, v)
  );

  return (
    <AdminPageShell
      title="Reviews"
      loading={loading}
      isEmpty={!loading && displayReviews.length === 0}
      emptyMessage="Nenhuma avaliação encontrada com os filtros atuais."
      filters={
        <AdminFilters
          searchPlaceholder="Buscar por comentário ou nome"
          searchValue={filters.search}
          onSearchChange={(v) => handleFilterChange('search', v)}
          selects={selects}
          loading={loading}
        />
      }
    >
      <AdminListSection pagination={pagination} page={page} onPageChange={handlePageChange}>
        <div className={ADMIN_CARD_GRID_CLASS}>
          {displayReviews.map((review) => (
            <div
              key={review.id}
              className={`h-full min-h-0 ${expandedId === review.id ? 'md:col-span-2' : ''}`}
            >
              <AdminCard
                variant="review"
                item={review}
                expanded={expandedId === review.id}
                onToggleExpand={handleToggleExpand}
                onToggleDisable={handleDisable}
              />
            </div>
          ))}
        </div>
      </AdminListSection>
    </AdminPageShell>
  );
}
