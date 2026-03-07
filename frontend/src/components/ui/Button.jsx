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
      'bg-[#9C5252]/25 border border-[#9C5252] text-[#9C5252] hover:bg-[#9C5252]/35',
    softUnblock:
      'bg-[#5F5FAA]/25 border border-[#5F5FAA] text-[#5F5FAA] hover:bg-[#5F5FAA]/35',
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