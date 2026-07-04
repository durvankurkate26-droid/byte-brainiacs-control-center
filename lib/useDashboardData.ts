"use client";

// ─── lib/useDashboardData.ts ─────────────────────────────────────────────────
// Loads the Control Center's live data from Supabase: the imported participants
// (mapped to the ParticipantRow shape the UI already uses) plus team totals and
// attendance counts — both read from the teams table so team stats stay
// mutually consistent. Exposes refetch() so the import panel can refresh the
// whole dashboard after a successful CSV import.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toParticipantRows } from "@/lib/participantView";
import type { Participant, Team } from "@/lib/types";
import type { ParticipantRow, CsvStats } from "@/lib/automationTypes";

// totalTeams and checkedInTeams are both sourced from the teams table so they
// stay consistent with each other (checkedIn can never exceed total). It would
// be wrong to derive totalTeams from distinct participant team_numbers while
// counting check-ins from teams — the two tables can diverge and produce
// impossible ratios like 2/1.
export interface DashboardStats extends Omit<CsvStats, "totalTeams"> {
  /** Total rows in the teams table (single source of truth for team counts). */
  totalTeams: number;
  /** Teams whose attendance = true (from the teams table). */
  checkedInTeams: number;
  /** Participants whose email failed validation (blank counts as invalid). */
  invalidEmails: number;
  /** ISO timestamp of the most recent check-in, or null if none yet. */
  latestCheckIn: string | null;
}

export interface DashboardData {
  participants: ParticipantRow[];
  /** Full teams table rows — powers attendance export and analytics. */
  teams: Team[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const EMPTY_STATS: DashboardStats = {
  totalParticipants: 0,
  totalTeams: 0,
  validEmails: 0,
  validPhones: 0,
  checkedInTeams: 0,
  invalidEmails: 0,
  latestCheckIn: null,
};

function deriveStats(
  rows: ParticipantRow[],
  teams: Team[]
): DashboardStats {
  const checkedIn = teams.filter((t) => t.attendance);
  const validEmails = rows.filter((r) => r.emailValid).length;

  // Most recent check-in timestamp across all present teams.
  const latestCheckIn = checkedIn.reduce<string | null>((latest, t) => {
    if (!t.checkin_time) return latest;
    if (!latest || t.checkin_time > latest) return t.checkin_time;
    return latest;
  }, null);

  return {
    totalParticipants: rows.length,
    totalTeams: teams.length,
    validEmails,
    validPhones: rows.filter((r) => r.phoneValid).length,
    checkedInTeams: checkedIn.length,
    invalidEmails: rows.length - validEmails,
    latestCheckIn,
  };
}

export function useDashboardData(): DashboardData {
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Full team rows (not head-only counts) so analytics can derive the
      // latest check-in time and the attendance export can list members. The
      // teams table stays the single source of truth for all team-level stats.
      const [participantsRes, teamsRes] = await Promise.all([
        supabase
          .from("participants")
          .select("*")
          .order("team_number", { ascending: true }),
        supabase
          .from("teams")
          .select("*")
          .order("team_id", { ascending: true }),
      ]);

      if (participantsRes.error) {
        setError(participantsRes.error.message);
        return;
      }
      if (teamsRes.error) {
        setError(teamsRes.error.message);
        return;
      }

      const rows = toParticipantRows(
        (participantsRes.data as Participant[]) ?? []
      );
      const teamRows = (teamsRes.data as Team[]) ?? [];
      setParticipants(rows);
      setTeams(teamRows);
      setStats(deriveStats(rows, teamRows));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { participants, teams, stats, loading, error, refetch: load };
}
