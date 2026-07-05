// ─── lib/teamDetails.ts ──────────────────────────────────────────────────────
// Derives a rich, read-only view of a single team by joining the imported
// participants (members, registration types, colleges) against the teams table
// (attendance + check-in time — the single source of truth). Also exposes the
// "recent check-ins" and "not yet checked in" slices the dashboard shows. This
// module only reads attendance; it never mutates it. Client-safe.

import type { ParticipantRow } from "@/lib/automationTypes";
import type { Team } from "@/lib/types";

/** One member of a team, as shown in the Team Details panel. */
export interface TeamMember {
  name: string;
  email: string;
  emailValid: boolean;
  phone: string;
  phoneValid: boolean;
  registrationType: string;
  college: string;
}

/** Everything the Team Details modal needs for one team. */
export interface TeamDetail {
  teamId: string;
  teamName: string;
  attendance: boolean;
  checkinTime: string | null;
  members: TeamMember[];
  /** Distinct, non-empty registration types across the members. */
  registrationTypes: string[];
  /** Distinct, non-empty colleges across the members. */
  colleges: string[];
}

function distinct(values: string[]): string[] {
  const set = new Set<string>();
  for (const v of values) {
    const trimmed = v.trim();
    if (trimmed) set.add(trimmed);
  }
  return Array.from(set).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
}

/**
 * Builds the detail view for `teamId`. Members are drawn from the participants
 * whose team_number matches; attendance and check-in time come from the team
 * row when present (a team with participants but no team row is still shown,
 * defaulting to not-checked-in).
 */
export function buildTeamDetail(
  teamId: string,
  participants: ParticipantRow[],
  team: Team | undefined
): TeamDetail {
  const members: TeamMember[] = participants
    .filter((p) => p.teamNumber === teamId)
    .map((p) => ({
      name: p.participant,
      email: p.email,
      emailValid: p.emailValid,
      phone: p.phone,
      phoneValid: p.phoneValid,
      registrationType: p.registrationType,
      college: p.college,
    }));

  return {
    teamId,
    teamName: team?.team_name ?? teamId,
    attendance: team?.attendance ?? false,
    checkinTime: team?.checkin_time ?? null,
    members,
    registrationTypes: distinct(members.map((m) => m.registrationType)),
    colleges: distinct(members.map((m) => m.college)),
  };
}

/**
 * Teams already checked in, most recent first. Only teams with a check-in
 * timestamp are included; ties fall back to team-id order.
 */
export function recentCheckIns(teams: Team[], limit = 5): Team[] {
  return teams
    .filter((t) => t.attendance && t.checkin_time)
    .sort((a, b) => (b.checkin_time ?? "").localeCompare(a.checkin_time ?? ""))
    .slice(0, limit);
}

/** Teams not yet checked in, in numeric team-id order. */
export function pendingTeams(teams: Team[]): Team[] {
  return teams
    .filter((t) => !t.attendance)
    .sort((a, b) =>
      a.team_id.localeCompare(b.team_id, undefined, { numeric: true })
    );
}

/** Formats an ISO timestamp as a short local date-time, or a dash when null. */
export function formatCheckInTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
