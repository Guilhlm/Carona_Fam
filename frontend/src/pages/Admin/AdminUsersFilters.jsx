import Button from '../../components/ui/Button';
import AuthInput from '../../components/ui/AuthInput';

export default function AdminUsersFilters({
  search,
  onSearchChange,
  onSubmit,
  filterRole,
  onFilterRoleChange,
  filterBlocked,
  onFilterBlockedChange,
  loading,
}) {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:items-end">
      <form onSubmit={onSubmit} className="flex-1 flex flex-col gap-2">
        <AuthInput
          type="text"
          placeholder="Buscar por nome, email ou RA"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          required={false}
        />
        <div className="flex">
          <Button
            type="submit"
            variant="brand"
            className="h-[40px] w-full text-sm"
            disabled={loading}
          >Filtrar</Button>     
        </div>
      </form>

      <div className="flex gap-2 w-full md:w-auto">
        <div className="flex-1">
          <div className="flex items-center h-[40px] rounded-[10px] border border-border-muted bg-surface-input/20 backdrop-blur-2xl px-3 text-xs md:text-sm text-text-muted">
            <select
              value={filterRole}
              onChange={(e) => onFilterRoleChange(e.target.value)}
              className="w-full h-full bg-transparent text-xs md:text-sm text-text-main focus:outline-none"
            >
              <option value="">Todas as funções</option>
              <option value="USER">Usuários</option>
              <option value="DRIVER">Motoristas</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center h-[40px] rounded-[10px] border border-border-muted bg-surface-input/20 backdrop-blur-2xl px-3 text-xs md:text-sm text-text-muted">
            <select
              value={filterBlocked}
              onChange={(e) => onFilterBlockedChange(e.target.value)}
              className="w-full h-full bg-transparent text-xs md:text-sm text-text-main focus:outline-none"
            >
              <option value="">Todos</option>
              <option value="false">Ativos</option>
              <option value="true">Bloqueados</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}