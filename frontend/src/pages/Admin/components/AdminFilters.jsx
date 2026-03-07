import AuthInput from '../../../components/ui/AuthInput';
import CustomSelect from '../../../components/ui/CustomSelect';

/**
 * Filtros genéricos do Admin: busca + N selects configuráveis.
 * @param {string} searchPlaceholder - Placeholder do campo de busca
 * @param {string} searchValue - Valor controlado da busca
 * @param {function} onSearchChange - (value: string) => void
 * @param {Array<{ key: string, value: string, onChange: (v: string) => void, options: Array<{ value, label }>, placeholder?: string, ariaLabel?: string }>} selects - Config de cada select
 * @param {boolean} [loading] - Desabilita os selects quando true
 */
export default function AdminFilters({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  selects = [],
  loading = false,
}) {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:items-end">
      <div className="flex-1">
        <AuthInput
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          required={false}
        />
      </div>

      <div className="flex gap-2 w-full md:w-auto">
        {selects.map((sel) => (
          <div key={sel.key} className="flex-1 min-h-[40px]">
            <CustomSelect
              value={sel.value}
              onChange={sel.onChange}
              options={sel.options}
              placeholder={sel.placeholder}
              size="sm"
              disabled={loading}
              aria-label={sel.ariaLabel}
            />
          </div>
        ))}
      </div>
    </div>
  );
}