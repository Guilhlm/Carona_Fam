import SectionCard from './SectionCard';

function AccountTypeButton({ active, children, ...props }) {
  const base =
    'flex-1 h-[38px] px-6 rounded-[10px] text-xs font-medium border border-border-muted flex items-center justify-center transition-colors';
  const activeClasses = 'bg-brand text-text-main';
  const inactiveClasses =
    'bg-surface-input/30 text-text-main/70 hover:bg-surface-input/50 disabled:hover:bg-surface-input/30';

  return (
    <button
      type="button"
      className={`${base} ${active ? activeClasses : inactiveClasses}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function AccountTypeSection({ role, updatingRole, onChangeRole }) {
  return (
    <SectionCard className="space-y-4">
      <header className="space-y-2">
        <p className="text-sm font-medium text-text-main">Outras Informações:</p>
        <p className="text-xs text-text-main/70">Tipo de conta atual:</p>
      </header>

      <div className="flex gap-3">
        <AccountTypeButton
          active={role === 'DRIVER'}
          onClick={() => onChangeRole('DRIVER')}
          disabled={updatingRole}
        >
          Motorista
        </AccountTypeButton>
        <AccountTypeButton
          active={role === 'USER'}
          onClick={() => onChangeRole('USER')}
          disabled={updatingRole}
        >
          Passageiro
        </AccountTypeButton>
      </div>

      <p className="text-[11px] text-text-main/60">
        * Lembre-se, caso seja motorista você concordará com os termos de serviço e estará ciente
        sobre os riscos e deveres.
      </p>
    </SectionCard>
  );
}

