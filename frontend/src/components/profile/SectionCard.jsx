export default function SectionCard({ children, className = '' }) {
  return (
    <section
      className={`rounded-[10px] border border-white/10 bg-surface-input/30 backdrop-blur-2xl px-4 py-5 md:px-6 md:py-6 ${className}`}
    >
      {children}
    </section>
  );
}