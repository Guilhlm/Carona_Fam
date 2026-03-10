export default function AuthInput({
  icon,
  type,
  placeholder,
  value,
  onChange,
  rightElement,
  disabled = false,
  required = true,
  ...rest
}) {
  return (
    <div className="flex items-center gap-3 h-[55px] rounded-[10px] border border-border-muted bg-surface-input/20 backdrop-blur-2xl px-3 text-sm text-text-muted">
      <span className="text-text-muted/60 flex items-center justify-center">
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="flex-1 bg-transparent placeholder:text-text-muted/60 text-text-main focus:outline-none"
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required && !disabled}
        {...rest}
      />
      {rightElement && (
        <span className="text-text-muted/60 flex items-center justify-center">
          {rightElement}
        </span>
      )}
    </div>
  );
}
