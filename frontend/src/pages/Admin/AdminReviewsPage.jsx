import { useAdminReviews } from '../../hooks/admin/useAdminReviews';
import AdminFilters from './components/AdminFilters';
import { buildSelects, REVIEWS_SELECTS } from './components/adminFilterConfig';
import AdminCard from './components/AdminCard';
import AdminPagination from './AdminPagination';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-text-main">
          Reviews
        </h1>
      </div>

      <AdminFilters
        searchPlaceholder="Buscar por comentário ou nome"
        searchValue={filters.search}
        onSearchChange={(v) => handleFilterChange('search', v)}
        selects={selects}
        loading={loading}
      />

      {loading ? (
        <p className="text-xs md:text-sm text-text-muted">Carregando...</p>
      ) : displayReviews.length === 0 ? (
        <p className="text-xs md:text-sm text-text-muted">
          Nenhuma avaliação encontrada com os filtros atuais.
        </p>
      ) : (
        <div className="space-y-3">
          {displayReviews.map((review) => (
            <AdminCard
              key={review.id}
              variant="review"
              item={review}
              expanded={expandedId === review.id}
              onToggleExpand={handleToggleExpand}
              onToggleDisable={handleDisable}
            />
          ))}

          <AdminPagination
            pagination={pagination}
            page={page}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
