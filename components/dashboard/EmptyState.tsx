// ─── components/dashboard/EmptyState.tsx ─────────────────────────────────────
// Shared empty-state block for the Control Center. Extracted so every "nothing
// here yet" surface (participants, teams, activity) reads consistently and keeps
// the Afterglow theme.

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  /** Optional call-to-action rendered under the message. */
  action?: React.ReactNode;
  /** Compact variant for smaller panels. */
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title,
  message,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-lilac/25 bg-lilac/[0.02] text-center",
        compact ? "px-4 py-8" : "px-6 py-12",
      ].join(" ")}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lilac/10 text-xl text-lilac">
        {icon}
      </div>
      <p className="text-sm font-semibold text-haze">{title}</p>
      <p className="max-w-md text-xs leading-relaxed text-mist">{message}</p>
      {action}
    </div>
  );
}
