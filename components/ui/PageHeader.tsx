// Consistent page title block used across every dashboard page. Big Space
// Grotesk title, optional eyebrow and supporting copy, plus an optional slot
// for page-level actions (e.g. Print on the QR page).

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  eyebrow,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="font-heading text-page-title font-bold text-haze">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-mist">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
