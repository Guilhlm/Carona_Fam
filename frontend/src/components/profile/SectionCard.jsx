export default function SectionCard({ children, className = '' }) {
  return (
    <section
      className={`rounded-[10px] border border-border-muted bg-surface-input/10 px-4 py-5 md:px-6 md:py-6 ${className}`}
    >
      {children}
    </section>
  );
}
