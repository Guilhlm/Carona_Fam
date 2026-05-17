export default function AdminPageShell({
  title,
  filters,
  loading,
  isEmpty,
  emptyMessage = 'Nenhum registro encontrado com os filtros atuais.',
  children,
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full gap-4 md:gap-5 overflow-hidden">
      <h1 className="shrink-0 text-lg md:text-xl font-semibold text-text-main">{title}</h1>

      {filters ? <div className="shrink-0">{filters}</div> : null}

      <div className="flex flex-1 min-h-0 flex-col min-w-0 overflow-hidden">
        {loading ? (
          <p className="text-xs md:text-sm text-text-muted">Carregando...</p>
        ) : isEmpty ? (
          <p className="text-xs md:text-sm text-text-muted">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
