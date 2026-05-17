import { useMemo } from 'react';
import { FiCrosshair, FiMapPin, FiSearch, FiUsers, FiX } from 'react-icons/fi';
import AddressAutocompleteField from './ride/AddressAutocompleteField';
import CustomSelect from './ui/CustomSelect';

const SCHEDULE_PASSENGER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const fieldInputClass =
  'w-full rounded-lg border border-border-muted bg-black/20 pl-10 pr-10 py-2.5 text-sm text-text-main placeholder:text-text-main/45 outline-none focus:border-brand';

export default function ScheduleModal({
  open,
  onClose,
  onConfirm,
  schedule,
  setSchedule,
  onOutOfRadius,
  onUseMyLocation,
  locatingOrigin = false,
}) {
  const schedulePassengerOptions = useMemo(
    () =>
      SCHEDULE_PASSENGER_OPTIONS.map((n) => ({
        value: n,
        label: `${n} ${n === 1 ? 'pessoa' : 'pessoas'}`,
      })),
    []
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar modal"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <form
        onSubmit={onConfirm}
        className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-border-muted bg-surface-input/95 backdrop-blur-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Agendar Corrida</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-text-main/70 hover:text-text-main"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-xs text-text-main/70">Local de partida</span>
          <AddressAutocompleteField
            value={schedule.originText}
            onChange={(v) =>
              setSchedule((s) => ({
                ...s,
                originText: v,
                originCoords: null,
              }))
            }
            onPick={({ label, lon, lat }) =>
              setSchedule((s) => ({
                ...s,
                originText: label,
                originCoords: [lon, lat],
              }))
            }
            onOutOfRadius={onOutOfRadius}
            placeholder="De onde você sai?"
            icon={<FiMapPin className="h-4 w-4" />}
            inputClassName={fieldInputClass}
            minChars={3}
          />
          <button
            type="button"
            onClick={onUseMyLocation}
            disabled={locatingOrigin}
            className="inline-flex items-center gap-2 text-xs text-brand hover:text-brand/80 disabled:opacity-60"
          >
            <FiCrosshair className={`h-3.5 w-3.5 ${locatingOrigin ? 'animate-pulse' : ''}`} />
            {locatingOrigin ? 'Localizando...' : 'Usar minha localização atual'}
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-xs text-text-main/70">Destino final</span>
          <AddressAutocompleteField
            value={schedule.destinationText}
            onChange={(v) =>
              setSchedule((s) => ({
                ...s,
                destinationText: v,
                destinationCoords: null,
              }))
            }
            onPick={({ label, lon, lat }) =>
              setSchedule((s) => ({
                ...s,
                destinationText: label,
                destinationCoords: [lon, lat],
              }))
            }
            onOutOfRadius={onOutOfRadius}
            placeholder="Para onde vamos?"
            icon={<FiSearch className="h-4 w-4" />}
            inputClassName={fieldInputClass}
            minChars={3}
          />
        </div>

        <label className="block">
          <span className="text-xs text-text-main/70">Horário de saída</span>
          <input
            type="datetime-local"
            value={schedule.departureAt}
            onChange={(e) => setSchedule((s) => ({ ...s, departureAt: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-border-muted bg-black/20 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        <div className="space-y-1.5">
          <span className="text-xs text-text-main/70">Pessoas no grupo</span>
          <CustomSelect
            value={schedule.passengers}
            onChange={(v) => setSchedule((s) => ({ ...s, passengers: Number(v) }))}
            options={schedulePassengerOptions}
            placeholder="Quantas pessoas?"
            aria-label="Pessoas no grupo"
            size="sm"
            className="w-full"
          />
        </div>

        <div className="rounded-xl border border-border-muted bg-black/25 p-3 space-y-3">
          <div className="flex gap-3 items-start">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand/40 bg-brand/15 text-brand"
              aria-hidden
            >
              <FiUsers className="h-5 w-5" />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-text-main leading-tight">Aceitar carona</p>
              <p className="text-xs text-text-main/65 leading-snug mt-1">
                Deixe outras pessoas pedirem vaga nesta viagem (aparece em &quot;Viagens disponíveis&quot;).
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSchedule((s) => ({ ...s, allowNewPassengers: true }))}
              className={`min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-medium border transition-colors text-left ${
                schedule.allowNewPassengers
                  ? 'border-brand bg-brand/25 text-brand ring-1 ring-brand/30'
                  : 'border-border-muted bg-black/30 text-text-main/80 hover:bg-black/40'
              }`}
            >
              <span className="block font-semibold">Sim, aceitar carona</span>
              <span className="block text-[11px] font-normal text-text-main/60 mt-0.5">
                Novas pessoas podem entrar
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSchedule((s) => ({ ...s, allowNewPassengers: false }))}
              className={`min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-medium border transition-colors text-left ${
                !schedule.allowNewPassengers
                  ? 'border-brand bg-brand/25 text-text-main ring-1 ring-brand/30'
                  : 'border-border-muted bg-black/30 text-text-main/80 hover:bg-black/40'
              }`}
            >
              <span className="block font-semibold">Não, só o grupo</span>
              <span className="block text-[11px] font-normal text-text-main/60 mt-0.5">
                Apenas quem já está na viagem
              </span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full h-11 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand/80 transition-colors"
        >
          Confirmar agendamento
        </button>
      </form>
    </div>
  );
}
