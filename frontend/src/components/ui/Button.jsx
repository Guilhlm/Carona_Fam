export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) {
  const base = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    brand: 'bg-brand text-text-main hover:bg-brand/70',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    softDanger:
      'bg-[rgba(207,0,0,0.12)] border border-[rgba(207,0,0,0.8)] text-[#CF0000] hover:bg-[rgba(207,0,0,0.2)]',
    softUnblock:
      'bg-[rgba(51,50,50,0.2)] border border-[#799D87] text-[#799D87] hover:bg-[rgba(51,50,50,0.35)]',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}