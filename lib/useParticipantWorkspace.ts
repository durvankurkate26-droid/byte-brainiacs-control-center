"use client";

// ─── lib/useParticipantWorkspace.ts ──────────────────────────────────────────
// Owns the Control Center's participant filter + selection state in one place so
// the participant table, bulk-action bar, communication composers, and export
// panel all read from a single coherent source. Nothing here touches the
// database or attendance — it only derives views over the already-loaded roster.
//
// Row identity: selection is keyed by a row's index within the full `all` array.
// Because the filtered rows are the SAME object references from `all`, an
// identity Map resolves each filtered row back to its stable key in O(1). This
// avoids fragile composite string keys (blank emails/duplicate names collide).

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ParticipantRow } from "@/lib/automationTypes";
import type { Team } from "@/lib/types";
import {
  EMPTY_FILTERS,
  buildAttendanceLookup,
  distinctValues,
  filterParticipants,
  hasActiveFilters,
  type ParticipantFilters,
} from "@/lib/participantFilters";

export interface WorkspaceOptions {
  colleges: string[];
  registrationTypes: string[];
  teamNumbers: string[];
}

export interface ParticipantWorkspace {
  filters: ParticipantFilters;
  setFilters: (next: ParticipantFilters) => void;
  patchFilters: (patch: Partial<ParticipantFilters>) => void;
  clearFilters: () => void;
  filtersActive: boolean;

  /** Rows passing the active filters. */
  filtered: ParticipantRow[];
  /** Rows the organiser has explicitly ticked. */
  selected: ParticipantRow[];
  /** The whole roster, unfiltered. */
  all: ParticipantRow[];

  /** Stable key for a row (its index within `all`, as a string). */
  keyOf: (row: ParticipantRow) => string;
  isSelected: (row: ParticipantRow) => boolean;
  toggle: (row: ParticipantRow) => void;
  /** Select every currently-filtered row (adds to any existing selection). */
  selectAllFiltered: () => void;
  clearSelection: () => void;
  selectedCount: number;
  /** True when every filtered row is selected (and there is at least one). */
  allFilteredSelected: boolean;

  attendanceLookup: Map<string, Team>;
  options: WorkspaceOptions;
}

export function useParticipantWorkspace(
  all: ParticipantRow[],
  teams: Team[]
): ParticipantWorkspace {
  const [filters, setFiltersState] = useState<ParticipantFilters>(EMPTY_FILTERS);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Row → stable index key. Rebuilt only when the roster identity changes.
  const keyMap = useMemo(() => {
    const m = new Map<ParticipantRow, string>();
    all.forEach((r, i) => m.set(r, String(i)));
    return m;
  }, [all]);

  // Selection is keyed by index within `all`, so a roster reload (e.g. after a
  // CSV re-import) would leave stale keys pointing at different participants.
  // Reset the selection whenever the roster identity changes to avoid that.
  useEffect(() => {
    setSelectedKeys(new Set());
  }, [all]);

  const keyOf = useCallback(
    (row: ParticipantRow) => keyMap.get(row) ?? "",
    [keyMap]
  );

  const attendanceLookup = useMemo(
    () => buildAttendanceLookup(teams),
    [teams]
  );

  const filtered = useMemo(
    () => filterParticipants(all, filters, attendanceLookup),
    [all, filters, attendanceLookup]
  );

  const selected = useMemo(
    () => all.filter((r) => selectedKeys.has(keyOf(r))),
    [all, selectedKeys, keyOf]
  );

  const options = useMemo<WorkspaceOptions>(
    () => ({
      colleges: distinctValues(all, (r) => r.college),
      registrationTypes: distinctValues(all, (r) => r.registrationType),
      teamNumbers: distinctValues(all, (r) => r.teamNumber),
    }),
    [all]
  );

  const setFilters = useCallback((next: ParticipantFilters) => {
    setFiltersState(next);
  }, []);

  const patchFilters = useCallback((patch: Partial<ParticipantFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearFilters = useCallback(() => setFiltersState(EMPTY_FILTERS), []);

  const isSelected = useCallback(
    (row: ParticipantRow) => selectedKeys.has(keyOf(row)),
    [selectedKeys, keyOf]
  );

  const toggle = useCallback(
    (row: ParticipantRow) => {
      const key = keyOf(row);
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [keyOf]
  );

  const selectAllFiltered = useCallback(() => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const r of filtered) next.add(keyOf(r));
      return next;
    });
  }, [filtered, keyOf]);

  const clearSelection = useCallback(() => setSelectedKeys(new Set()), []);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selectedKeys.has(keyOf(r)));

  return {
    filters,
    setFilters,
    patchFilters,
    clearFilters,
    filtersActive: hasActiveFilters(filters),
    filtered,
    selected,
    all,
    keyOf,
    isSelected,
    toggle,
    selectAllFiltered,
    clearSelection,
    selectedCount: selectedKeys.size,
    allFilteredSelected,
    attendanceLookup,
    options,
  };
}
