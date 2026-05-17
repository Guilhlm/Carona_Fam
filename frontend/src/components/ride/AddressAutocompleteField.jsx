import { useEffect, useMemo, useRef, useState } from 'react';
import { FiClock, FiMapPin } from 'react-icons/fi';
import { isWithinCampinas } from '../../utils/campinasGeo';
import { formatSuggestionAddress, searchAddresses } from '../../utils/nominatim';

export default function AddressAutocompleteField({
  value,
  onChange,
  onPick,
  onOutOfRadius,
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

    const debounceTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const suggestionList = await searchAddresses(value);
        setSuggestions(suggestionList);
      } catch (searchError) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [value, open, canSearch]);

  useEffect(() => {
    function handleClickOutside(mouseEvent) {
      if (!wrapRef.current?.contains(mouseEvent.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (location) => {
    const selectedLon = Number(location.lon);
    const selectedLat = Number(location.lat);
    if (!isWithinCampinas(selectedLat, selectedLon)) {
      onOutOfRadius?.();
      return;
    }

    const suggestionLabel = formatSuggestionAddress(location);
    onChange(suggestionLabel);
    onPick({ label: suggestionLabel, lon: selectedLon, lat: selectedLat });
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
          onChange={(inputEvent) => {
            onChange(inputEvent.target.value);
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
            <li className="px-3 py-3 text-xs text-text-main/70">
              Nenhum endereço na região de Campinas para essa busca.
            </li>
          ) : (
            suggestions.map((location) => {
              const suggestionLabel = formatSuggestionAddress(location);
              const cityName =
                location.address?.city ||
                location.address?.town ||
                location.address?.village ||
                location.address?.municipality ||
                '';
              return (
                <li key={location.place_id}>
                  <button
                    type="button"
                    onMouseDown={(mouseEvent) => mouseEvent.preventDefault()}
                    onClick={() => handleSelect(location)}
                    className="flex w-full gap-2 px-3 py-2.5 text-left text-sm hover:bg-black/25"
                  >
                    <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span className="min-w-0">
                      <span className="block text-text-main">{suggestionLabel}</span>
                      <span className="block truncate text-xs text-text-main/60">
                        {cityName}
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
