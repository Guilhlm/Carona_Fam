import { useEffect, useMemo, useRef, useState } from 'react';
import { FiClock, FiMapPin } from 'react-icons/fi';
import { formatSuggestionAddress, searchAddresses } from '../../utils/nominatim';

/**
 * Campo de texto com sugestões Nominatim conforme o usuário digita (debounce).
 */
export default function AddressAutocompleteField({
  value,
  onChange,
  onPick,
  placeholder = '',
  icon,
  inputClassName = '',
  minChars = 3,
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const canSearch = useMemo(() => value.trim().length >= minChars, [value, minChars]);

  useEffect(() => {
    if (!open || !canSearch) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const list = await searchAddresses(value);
        setSuggestions(list);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value, open, canSearch]);

  useEffect(() => {
    function handleDown(event) {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, []);

  const handleSelect = (location) => {
    const label = formatSuggestionAddress(location);
    const lon = Number(location.lon);
    const lat = Number(location.lat);
    onChange(label);
    onPick({ label, lon, lat });
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div className="relative z-30" ref={wrapRef}>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-text-main/55">
            {icon}
          </span>
        )}
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={inputClassName}
        />
        <FiClock className="pointer-events-none absolute right-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-text-main/45" />
      </div>

      {open && canSearch && (
        <ul className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-56 overflow-y-auto rounded-xl border border-border-muted bg-surface-input/98 shadow-xl backdrop-blur-md">
          {loading ? (
            <li className="px-3 py-3 text-xs text-text-main/70">Buscando endereços…</li>
          ) : suggestions.length === 0 ? (
            <li className="px-3 py-3 text-xs text-text-main/70">Nenhum resultado para essa busca.</li>
          ) : (
            suggestions.map((location) => {
              const label = formatSuggestionAddress(location);
              const city =
                location.address?.city ||
                location.address?.town ||
                location.address?.village ||
                location.address?.municipality ||
                '';
              return (
                <li key={location.place_id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(location)}
                    className="flex w-full gap-2 px-3 py-2.5 text-left text-sm hover:bg-black/25"
                  >
                    <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span className="min-w-0">
                      <span className="block text-text-main">{label}</span>
                      <span className="block truncate text-xs text-text-main/60">
                        {city}
                        {location.address?.state ? ` - ${location.address.state}` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
