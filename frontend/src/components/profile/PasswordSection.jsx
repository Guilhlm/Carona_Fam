import { useState } from 'react';
import { FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import SectionCard from './SectionCard';

function StaticField({ label, value }) {
  return (
    <div className="space-y-3">
      <span className="text-xs text-text-main/60 text-left block">{label}</span>
      <div className="flex items-center h-[55px] rounded-[10px] border border-border-muted bg-surface-input/20 backdrop-blur-2xl px-3 text-sm text-text-main/70">
        <span className="truncate w-full">{value}</span>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder, isVisible, onToggleVisibility }) {
  return (
    <div className="space-y-3">
      <span className="text-xs text-text-main/60 text-left block">{label}</span>
      <div className="flex items-center gap-3 h-[55px] rounded-[10px] border border-border-muted bg-surface-input/20 backdrop-blur-2xl px-3 text-sm text-text-muted">
        <span className="text-text-muted/60 flex items-center justify-center">
          <FiLock className="h-4 w-4" />
        </span>
        <input
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent placeholder:text-text-muted/60 text-text-main focus:outline-none"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="text-text-muted/60 hover:text-text-muted flex items-center justify-center pr-4"
        >
          {isVisible ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function PasswordSection({
  displayEmail,
  displayName,
  newPassword,
  confirmPassword,
  onChangeNewPassword,
  onChangeConfirmPassword,
  changingPassword,
  onSubmit,
}) {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <SectionCard className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm font-medium text-text-main">Alterar minha Senha:</p>
        <p className="text-xs text-brand">
          Utilize letras, números e caracteres especiais. A senha deve conter no mínimo 6
          caracteres.
        </p>
        <p className="text-[11px] text-text-main/70">
          Exemplos: Rugg@@70&nbsp;&nbsp;1S7l2ak&nbsp;&nbsp;Q6la0ly4
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-3">
          <StaticField label="Login:" value={displayEmail} />
          <StaticField label="Nome:" value={displayName} />
          <div className="mt-6 pt-1 space-y-3">
            <PasswordField
              label="Nova Senha:"
              value={newPassword}
              onChange={onChangeNewPassword}
              placeholder="Crie uma nova senha"
              isVisible={showNewPassword}
              onToggleVisibility={() => setShowNewPassword((prev) => !prev)}
            />
            <PasswordField
              label="Confirmar Senha:"
              value={confirmPassword}
              onChange={onChangeConfirmPassword}
              placeholder="Repita a nova senha"
              isVisible={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={changingPassword}
            className="w-full h-[54px] rounded-[10px] bg-brand text-text-main hover:text-text-main/80 text-sm font-medium flex items-center justify-center hover:bg-brand/70 disabled:bg-brand/20 disabled:text-text-main/60 disabled:hover:bg-brand/20 disabled:cursor-not-allowed transition-colors"
          >
            {changingPassword ? 'Alterando senha...' : 'Atualizar sua Senha'}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
