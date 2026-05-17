import { FiClock } from 'react-icons/fi';

export default function RideListCard({
  title,
  subtitle,
  meta = null,
  icon = <FiClock className="w-4 h-4 text-text-main/70" />,
  onClick,
  className = '',
}) {
  const isInteractive = typeof onClick === 'function';
  const CardElement = isInteractive ? 'button' : 'article';
  const interactiveClass = isInteractive
    ? 'w-full text-left hover:bg-surface-input/30 transition-colors cursor-pointer'
    : '';

  return (
    <CardElement
      type={isInteractive ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-xl border border-border-muted bg-surface-input/20 px-3 py-3 flex items-center gap-3 ${interactiveClass} ${className}`}
    >
      <div className="w-10 h-10 rounded-lg bg-black/20 border border-border-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm text-gray-100 truncate">{title}</h3>
        {subtitle ? (
          <p className="text-xs text-text-main/60 truncate">{subtitle}</p>
        ) : null}
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </CardElement>
  );
}
