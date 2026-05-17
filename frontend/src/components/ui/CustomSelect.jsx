import { useEffect, useRef, useState } from 'react';

const triggerBase =
  'flex items-center justify-between w-full h-full rounded-[10px] border border-border-muted bg-surface-input/20 backdrop-blur-2xl px-3 text-left text-text-main focus:outline-none focus:ring-2 focus:ring-brand/50 transition-colors';
const triggerSizeSm = 'text-xs md:text-sm min-h-[40px]';
const triggerSizeMd = 'text-sm min-h-[55px]';
const dropdownBase =
  'absolute left-0 right-0 top-full mt-1 z-50 rounded-[10px] border border-border-muted bg-surface-input py-1 shadow-xl shadow-black/20 max-h-[240px] overflow-y-auto';
const optionBase =
  'w-full px-3 py-2.5 text-left text-sm text-text-main hover:bg-white/10 focus:bg-white/10 focus:outline-none cursor-pointer transition-colors';
const optionSelected = 'bg-white/15 text-text-main';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Selecione...',
  size = 'sm',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const triggerSize = size === 'md' ? triggerSizeMd : triggerSizeSm;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || placeholder}
        disabled={disabled}
        className={`${triggerBase} ${triggerSize} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        <span
          className={
            selectedOption?.isDisabled
              ? 'text-red-500'
              : selectedOption
                ? 'text-text-main'
                : 'text-text-muted'
          }
        >
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 transition-transform ${selectedOption ? 'text-text-main' : 'text-text-muted'} ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className={dropdownBase}
          aria-label={ariaLabel || placeholder}
        >
          {options.map((opt) => (
            <li
              key={String(opt.value)}
              role="option"
              aria-selected={value === opt.value}
              className={`${optionBase} ${value === opt.value ? optionSelected : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <span className={`block ${opt.isDisabled ? 'text-red-500' : 'font-medium'}`}>
                {opt.label}
              </span>
              {opt.description ? (
                <span className="mt-0.5 block text-[11px] text-text-main/60">{opt.description}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}