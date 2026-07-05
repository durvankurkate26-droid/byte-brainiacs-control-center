// A titled content block. Replaces the ad-hoc <Section> that lived inside the
// old Control Center page so every dashboard surface shares one rhythm.

interface SectionProps {
  title: string;
  hint?: string;
  /** Optional trailing controls aligned with the section title. */
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}

export default function Section({
  title,
  hint,
  actions,
  children,
  id,
}: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-section-title font-semibold text-haze">
            {title}
          </h2>
          {hint && <p className="max-w-2xl text-sm text-mist">{hint}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
