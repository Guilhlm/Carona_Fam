export default function ProfileFieldRow({ label, children, className = '' }) {
  return (
    <div
      className={`grid grid-cols-[80px,minmax(0,1fr)] gap-[10px] items-center ${className}`}
    >
      <span className="text-xs text-text-main/60 text-left">{label}</span>
      <div>{children}</div>
    </div>
  );
}
