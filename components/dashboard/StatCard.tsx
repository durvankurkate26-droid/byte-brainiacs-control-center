type Accent = "lilac" | "magenta" | "mist" | "haze";

const ACCENT_TEXT: Record<Accent, string> = {
  lilac: "text-lilac",
  magenta: "text-magenta",
  mist: "text-mist",
  haze: "text-haze",
};

const ACCENT_ICON_BG: Record<Accent, string> = {
  lilac: "bg-lilac/15 text-lilac",
  magenta: "bg-magenta/15 text-magenta",
  mist: "bg-mist/10 text-mist",
  haze: "bg-haze/10 text-haze",
};

export interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string;
  hint?: string;
  accent?: Accent;
}

/** A single dashboard metric card. Reused across the Control Center stats row. */
export default function StatCard({
  label,
  value,
  icon,
  hint,
  accent = "lilac",
}: StatCardProps) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString() : value;

  // Long string values (e.g. a formatted timestamp) render a size down so they
  // fit the card without overflowing; numbers and short strings stay prominent.
  const valueSize =
    typeof displayValue === "string" && displayValue.length > 8
      ? "text-lg"
      : "text-3xl";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-lilac/20 bg-lilac/[0.03] p-5">
      <div className="flex items-start justify-between">
        <p className="text-[10px] uppercase tracking-widest text-mist">
          {label}
        </p>
        {icon && (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm ${ACCENT_ICON_BG[accent]}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
      <p
        className={`${valueSize} font-bold tabular-nums leading-tight ${ACCENT_TEXT[accent]}`}
      >
        {displayValue}
      </p>
      {hint && <p className="text-xs text-mist">{hint}</p>}
    </div>
  );
}
