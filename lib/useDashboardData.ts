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
import type { Participant } from "@/lib/types";
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
}

export interface DashboardData {
  participants: ParticipantRow[];
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
};

function deriveStats(
  rows: ParticipantRow[],
  totalTeams: number,
  checkedInTeams: number
): DashboardStats {
  return {
    totalParticipants: rows.length,
    totalTeams,
    validEmails: rows.filter((r) => r.emailValid).length,
    validPhones: rows.filter((r) => r.phoneValid).length,
    checkedInTeams,
  };
}

export function useDashboardData(): DashboardData {
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [participantsRes, teamsRes, presentRes] = await Promise.all([
        supabase
          .from("participants")
          .select("*")
          .order("team_number", { ascending: true }),
        supabase
          .from("teams")
          .select("team_id", { count: "exact", head: true }),
        supabase
          .from("teams")
          .select("team_id", { count: "exact", head: true })
          .eq("attendance", true),
      ]);

      if (participantsRes.error) {
        setError(participantsRes.error.message);
        return;
      }
      if (teamsRes.error) {
        setError(teamsRes.error.message);
        return;
      }
      if (presentRes.error) {
        setError(presentRes.error.message);
        return;
      }

      const rows = toParticipantRows(
        (participantsRes.data as Participant[]) ?? []
      );
      setParticipants(rows);
      setStats(deriveStats(rows, teamsRes.count ?? 0, presentRes.count ?? 0));
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

  return { participants, stats, loading, error, refetch: load };
}
