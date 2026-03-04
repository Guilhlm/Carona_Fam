export default function AuthInput({
  icon,
  type,
  placeholder,
  value,
  onChange,
  rightElement,
}) {
  return (
    <div className="flex items-center gap-5 h-[70px] rounded-[10px] border border-border-muted bg-surface-input/20 backdrop-blur-2xl px-6 text-sm text-text-muted">
      <span className="text-text-muted/60 flex items-center justify-center">
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="flex-1 bg-transparent placeholder:text-text-muted/60 text-text-main focus:outline-none"
        value={value}
        onChange={onChange}
        required
      />
      {rightElement && (
        <span className="text-text-muted/60 flex items-center justify-center">
          {rightElement}
        </span>
      )}
    </div>
  );
}

