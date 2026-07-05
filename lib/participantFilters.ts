// ─── lib/participantFilters.ts ───────────────────────────────────────────────
// Reusable smart-filter model for the Control Center. A single ParticipantFilters
// shape plus a pure filterParticipants() function power the participant workspace,
// bulk actions, and any future filtered view — so filtering behaves identically
// everywhere. Check-in status is resolved by joining a participant's team_number
// against the teams table (the single source of truth for attendance); this file
// never mutates attendance, it only reads it. Client-safe (no server imports).

import type { ParticipantRow } from "@/lib/automationTypes";
import type { Team } from "@/lib/types";

/** Attendance filter tri-state. */
export type AttendanceFilter = "all" | "checkedIn" | "notCheckedIn";

/** The full set of reusable filters applied to the participant roster. */
export interface ParticipantFilters {
  /** Free-text search across name, email, phone, college, and team number. */
  search: string;
  /** Exact college match ("" = all). */
  college: string;
  /** Exact registration-type match ("" = all). */
  registrationType: string;
  /** Exact team-number match ("" = all). */
  teamNumber: string;
  /** Check-in status derived from the participant's team. */
  attendance: AttendanceFilter;
  /** Keep only rows whose email passes validation. */
  validEmailOnly: boolean;
  /** Keep only rows whose phone passes validation. */
  validPhoneOnly: boolean;
}

/** The neutral filter state — matches every participant. */
export const EMPTY_FILTERS: ParticipantFilters = {
  search: "",
  college: "",
  registrationType: "",
  teamNumber: "",
  attendance: "all",
  validEmailOnly: false,
  validPhoneOnly: false,
};

/**
 * Builds a team_id → Team lookup so a participant's check-in status can be
 * resolved in O(1). Keyed by the team id, which equals the participant's
 * team_number (see lib/teams.ts: team_id = team_name = team_number).
 */
export function buildAttendanceLookup(teams: Team[]): Map<string, Team> {
  const map = new Map<string, Team>();
  for (const t of teams) map.set(t.team_id, t);
  return map;
}

/** True when the participant's team exists and is marked present. */
export function isParticipantCheckedIn(
  row: ParticipantRow,
  lookup: Map<string, Team>
): boolean {
  const team = lookup.get(row.teamNumber);
  return team?.attendance === true;
}

/** Distinct, sorted, non-empty values of a field across the rows. */
export function distinctValues(
  rows: ParticipantRow[],
  pick: (r: ParticipantRow) => string
): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const v = pick(r).trim();
    if (v) set.add(v);
  }
  return Array.from(set).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
}

/** True when any filter is narrowing the roster (i.e. not the neutral state). */
export function hasActiveFilters(f: ParticipantFilters): boolean {
  return (
    f.search.trim() !== "" ||
    f.college !== "" ||
    f.registrationType !== "" ||
    f.teamNumber !== "" ||
    f.attendance !== "all" ||
    f.validEmailOnly ||
    f.validPhoneOnly
  );
}

/**
 * Applies every active filter to the roster and returns the matching rows.
 * Pure and side-effect free. Search matches name, email, phone, college, and
 * team number (case-insensitive substring).
 */
export function filterParticipants(
  rows: ParticipantRow[],
  filters: ParticipantFilters,
  lookup: Map<string, Team>
): ParticipantRow[] {
  const q = filters.search.trim().toLowerCase();

  return rows.filter((r) => {
    if (q) {
      const haystack = [
        r.participant,
        r.email,
        r.phone,
        r.college,
        r.teamNumber,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (filters.college && r.college !== filters.college) return false;
    if (filters.registrationType && r.registrationType !== filters.registrationType)
      return false;
    if (filters.teamNumber && r.teamNumber !== filters.teamNumber) return false;
    if (filters.validEmailOnly && !r.emailValid) return false;
    if (filters.validPhoneOnly && !r.phoneValid) return false;

    if (filters.attendance !== "all") {
      const checkedIn = isParticipantCheckedIn(r, lookup);
      if (filters.attendance === "checkedIn" && !checkedIn) return false;
      if (filters.attendance === "notCheckedIn" && checkedIn) return false;
    }

    return true;
  });
}
