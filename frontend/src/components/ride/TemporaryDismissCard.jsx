export default function TemporaryDismissCard({ open = true, className = '', children }) {
  if (!open) return null;
  return <div className={className}>{children}</div>;
}
