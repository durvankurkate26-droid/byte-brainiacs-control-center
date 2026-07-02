// ─── lib/teams.ts ────────────────────────────────────────────────────────────
// Derives public.teams rows from imported participants. The import route calls
// this after upserting participants so the teams table (which drives QR
// check-in and the attendance dashboard) stays in sync with the single source
// of truth. Client-safe (no server imports).
//
// Per Sprint 2 spec: team_id = team_name = team_number. The first three member
// names fill participant_1..3; teams with more than three members keep only the
// first three (the teams table has three participant slots). attendance and
// checkin_time are intentionally NOT set here — see TeamSyncRow in lib/types.ts.

import type { ParticipantInsert, TeamSyncRow } from "@/lib/types";

/**
 * Groups participants by team_number and produces one TeamSyncRow per team.
 * Order of members within a team follows their order in the input array.
 * Rows with a blank team_number are skipped.
 */
export function deriveTeams(participants: ParticipantInsert[]): TeamSyncRow[] {
  const membersByTeam = new Map<string, string[]>();

  for (const p of participants) {
    const teamId = p.team_number.trim();
    if (!teamId) continue;
    const name = p.participant_name.trim();
    const existing = membersByTeam.get(teamId);
    if (existing) {
      existing.push(name);
    } else {
      membersByTeam.set(teamId, [name]);
    }
  }

  return Array.from(membersByTeam.entries())
    .map(([teamId, members]) => ({
      team_id: teamId,
      team_name: teamId,
      participant_1: members[0] ?? "",
      participant_2: members[1] ?? null,
      participant_3: members[2] ?? null,
    }))
    .sort((a, b) =>
      a.team_id.localeCompare(b.team_id, undefined, { numeric: true })
    );
}
