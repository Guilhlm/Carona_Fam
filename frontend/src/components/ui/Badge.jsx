export default function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-surface-input/40 text-text-main border border-border-muted',
    success: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40',
    warning: 'bg-amber-500/20 text-amber-200 border border-amber-500/40',
    danger: 'bg-red-500/20 text-red-200 border border-red-500/40',
    info: 'bg-brand/20 text-brand border border-brand/50',
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium ${
        variants[variant] || variants.default
      }`}
    >
      {children}
    </span>
  );
}