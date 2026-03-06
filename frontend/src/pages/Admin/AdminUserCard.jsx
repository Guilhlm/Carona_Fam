import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function AdminUserCard({
  user,
  isCurrentUser,
  onToggleAdmin,
  onToggleBlock,
}) {
  const isAdminUser = user.role === 'ADMIN' || user.isAdmin;
  const isBlocked = !!user.isBlocked;

  return (
    <div className="rounded-[10px] border border-border-muted bg-surface-input/30 px-4 py-3 md:px-5 md:py-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Badge no topo apenas em telas md+ */}
        <div className="hidden md:block md:self-start">
          <Badge variant={isBlocked ? 'danger' : 'success'}>
            {isBlocked ? 'Bloqueado' : 'Ativo'}
          </Badge>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 pb-[5px]">
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-medium text-sm md:text-base text-text-main truncate">
                {user.name}
              </p>
              <span className="text-[10px] md:text-xs text-brand uppercase tracking-wide">
                {user.role}
                {user.isAdmin ? ' · ADMIN' : ''}
              </span>
            </div>
            {/* Badge alinhado ao lado do nome apenas em mobile */}
            <div className="md:hidden shrink-0">
              <Badge variant={isBlocked ? 'danger' : 'success'}>
                {isBlocked ? 'Bloqueado' : 'Ativo'}
              </Badge>
            </div>
          </div>
          <p className="text-xs md:text-sm text-text-muted truncate">
            {user.email}
            {user.ra && ` · RA ${user.ra}`}
          </p>
        </div>
      </div>

      {!isCurrentUser && (
        <div className="flex flex-col gap-2 justify-end mt-4 md:mt-0 pt-[5px] w-full md:w-[260px] md:flex-none">
          <Button
            variant={isAdminUser ? 'softDanger' : 'softUnblock'}
            onClick={() => onToggleAdmin(user, !isAdminUser)}
            className="w-full text-xs md:text-sm px-3 py-2"
          >
            {isAdminUser ? 'Remover admin' : 'Tornar admin'}
          </Button>

          <Button
            variant={isBlocked ? 'softUnblock' : 'softDanger'}
            onClick={() => onToggleBlock(user.id, !isBlocked)}
            className="w-full text-xs md:text-sm px-3 py-2"
          >
            {isBlocked ? 'Ativar Usuário' : 'Bloquear Usuário'}
          </Button>
        </div>
      )}
    </div>
  );
}