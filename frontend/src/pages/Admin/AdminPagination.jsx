import Button from '../../components/ui/Button';

export default function AdminPagination({ pagination, page, onPageChange, className = '' }) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const canGoPrev = page > 1;
  const canGoNext = page < pagination.totalPages;

  return (
    <div
      className={`pt-3 flex justify-between items-center text-xs md:text-sm text-text-muted ${className}`.trim()}
    >
      <p>
        Página {pagination.page} de {pagination.totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="brand"
          disabled={!canGoPrev}
          onClick={() => canGoPrev && onPageChange(page - 1)}
          className="h-[32px] px-3 text-xs"
        >Anterior</Button>

        <Button
          variant="brand"
          disabled={!canGoNext}
          onClick={() => canGoNext && onPageChange(page + 1)}
          className="h-[32px] px-3 text-xs"
        >Próxima</Button>

      </div>
    </div>
  );
}