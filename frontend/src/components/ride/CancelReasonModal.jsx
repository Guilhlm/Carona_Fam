import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const REASONS_BY_ROLE = {
  PASSENGER: [
    'Motorista está demorando demais',
    'Mudei de planos',
    'Endereço incorreto',
    'Encontrei outra carona',
  ],
  DRIVER: [
    'Passageiro não apareceu',
    'Endereço inacessível',
    'Problema com o veículo',
    'Emergência pessoal',
  ],
};

export default function CancelReasonModal({ open, role = 'PASSENGER', onClose, onConfirm, loading = false }) {
  const presets = useMemo(() => REASONS_BY_ROLE[role] ?? REASONS_BY_ROLE.PASSENGER, [role]);
  const [selected, setSelected] = useState(presets[0]);
  const [custom, setCustom] = useState('');

  useEffect(() => {
    if (open) {
      setSelected(presets[0]);
      setCustom('');
    }
  }, [open, presets]);

  const isCustom = selected === '__other__';
  const reason = isCustom ? custom.trim() : selected;
  const disabled = loading || !reason;

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/60 px-4 pb-24 sm:items-center sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-reason-title"
    >
      <div className="nav-shell w-full sm:rounded-2xl rounded-t-2xl bg-surface-input border border-border-muted p-5 text-text-main">
        <h2 id="cancel-reason-title" className="text-base font-semibold mb-1">
          Cancelar corrida
        </h2>
        <p className="text-xs text-text-main/70 mb-4">
          Por favor, selecione o motivo do cancelamento.
        </p>

        <div className="space-y-2 mb-3">
          {presets.map((r) => (
            <label
              key={r}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer ${
                selected === r
                  ? 'border-brand bg-brand/15 text-brand'
                  : 'border-border-muted bg-black/20 text-text-main/85 hover:bg-black/30'
              }`}
            >
              <input
                type="radio"
                name="cancel-reason"
                value={r}
                checked={selected === r}
                onChange={() => setSelected(r)}
                className="hidden"
              />
              {r}
            </label>
          ))}
          <label
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer ${
              isCustom
                ? 'border-brand bg-brand/15 text-brand'
                : 'border-border-muted bg-black/20 text-text-main/85 hover:bg-black/30'
            }`}
          >
            <input
              type="radio"
              name="cancel-reason"
              value="__other__"
              checked={isCustom}
              onChange={() => setSelected('__other__')}
              className="hidden"
            />
            Outro
          </label>
        </div>

        {isCustom && (
          <textarea
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            rows={3}
            placeholder="Descreva o motivo"
            className="w-full rounded-xl border border-border-muted bg-black/30 px-3 py-2 text-sm text-text-main outline-none focus:border-brand resize-none mb-4"
          />
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-border-muted bg-black/20 py-2.5 text-sm text-text-main hover:bg-black/30 disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={disabled}
            className="flex-1 rounded-xl border border-red-500/60 bg-red-500/15 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
          >
            {loading ? 'Cancelando...' : 'Confirmar cancelamento'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
