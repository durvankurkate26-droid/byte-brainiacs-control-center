"use client";

import { useMemo, useState } from "react";
import type { ParticipantRow } from "@/lib/automationTypes";
import type { Team } from "@/lib/types";
import {
  buildTeamDetail,
  formatCheckInTime,
  pendingTeams,
  recentCheckIns,
} from "@/lib/teamDetails";
import TeamDetailsModal from "@/components/dashboard/TeamDetailsModal";
import EmptyState from "@/components/dashboard/EmptyState";

interface TeamsSectionProps {
  participants: ParticipantRow[];
  teams: Team[];
  loading: boolean;
}

// ─── Small building blocks ────────────────────────────────────────────────────

function Panel({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-lilac/20 bg-lilac/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-mist">{title}</p>
        {typeof count === "number" && (
          <span className="text-xs font-semibold tabular-nums text-lilac">
            {count.toLocaleString()}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/** A clickable team row used across the activity and directory panels. */
function TeamRow({
  teamId,
  primary,
  secondary,
  present,
  onOpen,
}: {
  teamId: string;
  primary: string;
  secondary: string;
  present: boolean;
  onOpen: (teamId: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(teamId)}
        className="flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left transition-colors hover:bg-lilac/10 focus:bg-lilac/10 focus:outline-none"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-lilac">
            {primary}
          </span>
          <span className="block truncate text-[11px] text-mist">
            {secondary}
          </span>
        </span>
        {present ? (
          <span className="shrink-0 rounded-full bg-magenta/15 px-2 py-0.5 text-[10px] font-medium text-magenta">
            ✓ In
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-mist/15 px-2 py-0.5 text-[10px] font-medium text-mist">
            Pending
          </span>
        )}
      </button>
    </li>
  );
}

function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-9 animate-pulse rounded bg-mist/10"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

/**
 * Team-centric dashboard: recent check-ins, teams not yet checked in, and a
 * searchable directory — every team opens a read-only Team Details modal. All
 * attendance data is read from the teams table; nothing here mutates it.
 */
export default function TeamsSection({
  participants,
  teams,
  loading,
}: TeamsSectionProps) {
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const teamLookup = useMemo(() => {
    const m = new Map<string, Team>();
    for (const t of teams) m.set(t.team_id, t);
    return m;
  }, [teams]);

  const recent = useMemo(() => recentCheckIns(teams, 5), [teams]);
  const pending = useMemo(() => pendingTeams(teams), [teams]);

  const sortedTeams = useMemo(
    () =>
      [...teams].sort((a, b) =>
        a.team_id.localeCompare(b.team_id, undefined, { numeric: true })
      ),
    [teams]
  );

  const directory = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedTeams;
    return sortedTeams.filter(
      (t) =>
        t.team_id.toLowerCase().includes(q) ||
        t.team_name.toLowerCase().includes(q)
    );
  }, [sortedTeams, search]);

  const openDetail = useMemo(
    () =>
      openTeamId
        ? buildTeamDetail(openTeamId, participants, teamLookup.get(openTeamId))
        : null,
    [openTeamId, participants, teamLookup]
  );

  const membersLabel = (teamId: string) => {
    const count = participants.filter((p) => p.teamNumber === teamId).length;
    return `${count} member${count === 1 ? "" : "s"}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Recent Check-Ins">
          <SkeletonRows />
        </Panel>
        <Panel title="Not Yet Checked In">
          <SkeletonRows />
        </Panel>
        <Panel title="Team Directory">
          <SkeletonRows count={6} />
        </Panel>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <EmptyState
        icon="⬡"
        title="No teams yet"
        message="Import your participant CSV to sync teams. Once teams exist you can open any team to see its members, attendance, registration types, and colleges."
        compact
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent check-ins */}
        <Panel title="Recent Check-Ins" count={recent.length}>
          {recent.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-mist">
              No check-ins yet. Teams appear here as they scan in.
            </p>
          ) : (
            <ul className="space-y-1">
              {recent.map((t) => (
                <TeamRow
                  key={t.team_id}
                  teamId={t.team_id}
                  primary={t.team_id}
                  secondary={formatCheckInTime(t.checkin_time)}
                  present
                  onOpen={setOpenTeamId}
                />
              ))}
            </ul>
          )}
        </Panel>

        {/* Pending teams */}
        <Panel title="Not Yet Checked In" count={pending.length}>
          {pending.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-mist">
              🎉 Every team has checked in.
            </p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {pending.map((t) => (
                <TeamRow
                  key={t.team_id}
                  teamId={t.team_id}
                  primary={t.team_id}
                  secondary={membersLabel(t.team_id)}
                  present={false}
                  onOpen={setOpenTeamId}
                />
              ))}
            </ul>
          )}
        </Panel>

        {/* Directory */}
        <Panel title="Team Directory" count={teams.length}>
          <label htmlFor="team-directory-search" className="sr-only">
            Search teams
          </label>
          <input
            id="team-directory-search"
            type="search"
            placeholder="Search team number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2 w-full rounded border border-lilac/30 bg-lilac/5 px-3 py-1.5 text-xs text-haze placeholder-mist/50 outline-none transition-colors focus:border-lilac/60"
          />
          {directory.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-mist">
              No teams match “{search}”.
            </p>
          ) : (
            <ul className="max-h-56 space-y-1 overflow-y-auto">
              {directory.map((t) => (
                <TeamRow
                  key={t.team_id}
                  teamId={t.team_id}
                  primary={t.team_id}
                  secondary={membersLabel(t.team_id)}
                  present={t.attendance}
                  onOpen={setOpenTeamId}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {openDetail && (
        <TeamDetailsModal detail={openDetail} onClose={() => setOpenTeamId(null)} />
      )}
    </>
  );
}
