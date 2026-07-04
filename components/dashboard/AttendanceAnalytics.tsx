import StatCard from "@/components/dashboard/StatCard";
import type { DashboardStats as Stats } from "@/lib/useDashboardData";

interface AttendanceAnalyticsProps {
  stats: Stats;
  loading?: boolean;
}

/** Formats an ISO timestamp as a short local date-time, or a dash when null. */
function formatCheckIn(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

/** Skeleton block shown while the dashboard data is loading. */
function SkeletonCard() {
  return (
    <div className="flex h-[112px] flex-col gap-3 rounded-lg border border-lilac/20 bg-lilac/[0.03] p-5">
      <div className="h-2 w-16 animate-pulse rounded bg-mist/15" />
      <div className="mt-2 h-7 w-20 animate-pulse rounded bg-mist/15" />
      <div className="h-2 w-24 animate-pulse rounded bg-mist/10" />
    </div>
  );
}

/**
 * Attendance progress bar — teams checked in vs total, with the percentage
 * called out. Preserves the Afterglow theme (lilac fill on a faint track).
 */
function AttendanceBar({
  checkedIn,
  total,
  pct,
}: {
  checkedIn: number;
  total: number;
  pct: number;
}) {
  return (
    <div className="rounded-lg border border-lilac/20 bg-lilac/[0.03] p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-mist">
            Attendance Rate
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums leading-none text-lilac">
            {pct}%
          </p>
        </div>
        <p className="text-xs text-mist">
          <span className="text-haze">{checkedIn.toLocaleString()}</span> of{" "}
          <span className="text-haze">{total.toLocaleString()}</span> teams
          checked in
        </p>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-lilac/15"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-lilac to-magenta transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Attendance & data-quality analytics for the Control Center. Reuses StatCard
 * for the metric grid. All figures derive from the dashboard data hook, which
 * keeps the teams table as the single source of truth for team-level stats.
 */
export default function AttendanceAnalytics({
  stats,
  loading,
}: AttendanceAnalyticsProps) {
  const pct =
    stats.totalTeams === 0
      ? 0
      : Math.round((stats.checkedInTeams / stats.totalTeams) * 100);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Headline attendance bar */}
      <AttendanceBar
        checkedIn={stats.checkedInTeams}
        total={stats.totalTeams}
        pct={pct}
      />

      {/* Metric grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Total Participants"
          value={stats.totalParticipants}
          icon="◆"
          accent="lilac"
          hint="In the participant database"
        />
        <StatCard
          label="Total Teams"
          value={stats.totalTeams}
          icon="⬡"
          accent="haze"
          hint="Synced from participants"
        />
        <StatCard
          label="Checked In"
          value={`${stats.checkedInTeams} / ${stats.totalTeams}`}
          icon="◈"
          accent="magenta"
          hint="Teams marked present"
        />
        <StatCard
          label="Valid Emails"
          value={stats.validEmails}
          icon="@"
          accent="lilac"
          hint="Eligible for email send"
        />
        <StatCard
          label="Invalid Emails"
          value={stats.invalidEmails}
          icon="⚠"
          accent="mist"
          hint="Blank or malformed"
        />
        <StatCard
          label="Latest Check-In"
          value={formatCheckIn(stats.latestCheckIn)}
          icon="◷"
          accent="haze"
          hint={stats.latestCheckIn ? "Most recent scan" : "No check-ins yet"}
        />
      </div>
    </div>
  );
}
