"use client";

import type { ScopeMode } from "@/lib/scope";

interface ScopeSelectorProps {
  scope: ScopeMode;
  onChange: (mode: ScopeMode) => void;
  counts: { all: number; filtered: number; selected: number };
  /** When false, the "Filtered" option is hidden (filtered === all). */
  filtersActive: boolean;
  /** Short noun for the tooltip/aria label, e.g. "recipients". */
  label?: string;
}

/**
 * Segmented control letting an organiser point a bulk action at the whole
 * roster, the current filtered view, or the explicit selection. Options that
 * carry no meaning are hidden ("Filtered" when nothing is filtered, "Selected"
 * when nothing is ticked) so the control never offers a redundant choice.
 */
export default function ScopeSelector({
  scope,
  onChange,
  counts,
  filtersActive,
  label = "targets",
}: ScopeSelectorProps) {
  const options: Array<{ mode: ScopeMode; text: string; count: number; show: boolean }> =
    [
      { mode: "all", text: "All", count: counts.all, show: true },
      {
        mode: "filtered",
        text: "Filtered",
        count: counts.filtered,
        show: filtersActive,
      },
      {
        mode: "selected",
        text: "Selected",
        count: counts.selected,
        show: counts.selected > 0,
      },
    ];

  return (
    <div
      className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-lilac/20 bg-lilac/[0.03] p-1"
      role="group"
      aria-label={`Choose ${label}`}
    >
      {options
        .filter((o) => o.show)
        .map((o) => {
          const active = scope === o.mode;
          return (
            <button
              key={o.mode}
              type="button"
              onClick={() => onChange(o.mode)}
              aria-pressed={active}
              className={[
                "rounded-md px-3 py-1.5 text-[11px] uppercase tracking-wider transition-colors",
                active
                  ? "bg-lilac/20 text-lilac"
                  : "text-mist hover:bg-lilac/10 hover:text-haze",
              ].join(" ")}
            >
              {o.text}
              <span className="ml-1.5 tabular-nums opacity-80">
                {o.count.toLocaleString()}
              </span>
            </button>
          );
        })}
    </div>
  );
}
