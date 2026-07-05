"use client";

interface BulkActionBarProps {
  /** Rows currently ticked. */
  selectedCount: number;
  /** Rows passing the active filters. */
  filteredCount: number;
  /** True when every filtered row is already selected. */
  allFilteredSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onEmail: () => void;
  onWhatsApp: () => void;
  onExport: () => void;
}

const actionBtn =
  "flex items-center gap-1.5 rounded border px-3 py-1.5 text-[11px] uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Toolbar of bulk actions over the filtered / selected participants. The
 * "active set" — what Email/WhatsApp/Export target — is the selection when any
 * rows are ticked, otherwise the whole filtered view. Actions are disabled only
 * when that set is empty.
 */
export default function BulkActionBar({
  selectedCount,
  filteredCount,
  allFilteredSelected,
  onSelectAll,
  onClearSelection,
  onEmail,
  onWhatsApp,
  onExport,
}: BulkActionBarProps) {
  const activeCount = selectedCount > 0 ? selectedCount : filteredCount;
  const scopeWord = selectedCount > 0 ? "selected" : "filtered";
  const disabled = activeCount === 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-lilac/20 bg-lilac/[0.03] px-4 py-3">
      <p className="text-xs text-mist">
        Acting on{" "}
        <span className="font-semibold text-lilac tabular-nums">
          {activeCount.toLocaleString()}
        </span>{" "}
        {scopeWord} participant{activeCount === 1 ? "" : "s"}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSelectAll}
          disabled={filteredCount === 0 || allFilteredSelected}
          className={`${actionBtn} border-lilac/30 text-lilac hover:bg-lilac/10`}
        >
          ☑ Select all
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          disabled={selectedCount === 0}
          className={`${actionBtn} border-mist/30 text-mist hover:bg-mist/10`}
        >
          ☐ Clear
        </button>

        <span className="mx-1 h-4 w-px bg-lilac/20" aria-hidden="true" />

        <button
          type="button"
          onClick={onEmail}
          disabled={disabled}
          className={`${actionBtn} border-lilac/40 text-lilac hover:bg-lilac/10`}
        >
          @ Email
        </button>
        <button
          type="button"
          onClick={onWhatsApp}
          disabled={disabled}
          className={`${actionBtn} border-lilac/40 text-lilac hover:bg-lilac/10`}
        >
          ✆ WhatsApp
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={disabled}
          className={`${actionBtn} border-magenta/50 bg-magenta/10 text-magenta hover:bg-magenta/20`}
        >
          ↓ Export
        </button>
      </div>
    </div>
  );
}
