// ─── lib/scope.ts ────────────────────────────────────────────────────────────
// Shared "which participants does this action target?" model, reused by the
// Email composer, WhatsApp composer, and Export panel so bulk actions operate
// consistently on the whole roster, the filtered view, or the explicit
// selection. Client-safe.

import type { ParticipantRow } from "@/lib/automationTypes";

export type ScopeMode = "all" | "filtered" | "selected";

export interface ScopeSets {
  all: ParticipantRow[];
  filtered: ParticipantRow[];
  selected: ParticipantRow[];
}

/** Resolves the participant list a given scope mode points at. */
export function resolveScope(mode: ScopeMode, sets: ScopeSets): ParticipantRow[] {
  if (mode === "selected") return sets.selected;
  if (mode === "filtered") return sets.filtered;
  return sets.all;
}

/**
 * Picks the most specific scope that has rows: selected → filtered → all.
 * Used as a sensible default so, e.g., opening the Email composer right after
 * filtering targets the filtered set without an extra click.
 */
export function defaultScope(
  sets: ScopeSets,
  filtersActive: boolean
): ScopeMode {
  if (sets.selected.length > 0) return "selected";
  if (filtersActive && sets.filtered.length !== sets.all.length) return "filtered";
  return "all";
}

/**
 * Downgrades a scope whose option is no longer offered so the UI never points
 * at a hidden/empty set: "selected" falls back once the selection is cleared,
 * "filtered" falls back to "all" once filters are cleared.
 */
export function effectiveScope(
  scope: ScopeMode,
  sets: ScopeSets,
  filtersActive: boolean
): ScopeMode {
  if (scope === "selected" && sets.selected.length === 0) {
    return filtersActive ? "filtered" : "all";
  }
  if (scope === "filtered" && !filtersActive) return "all";
  return scope;
}
