import StatCard from "@/components/dashboard/StatCard";
import type { DashboardStats as Stats } from "@/lib/useDashboardData";

interface DashboardStatsProps {
  stats: Stats;
  loading?: boolean;
}

/** Row of live metric cards driven by database data. */
export default function DashboardStats({ stats, loading }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Participants"
        value={loading ? "—" : stats.totalParticipants}
        icon="◆"
        accent="lilac"
        hint="Imported into the database"
      />
      <StatCard
        label="Teams"
        value={loading ? "—" : stats.totalTeams}
        icon="⬡"
        accent="haze"
        hint="Unique team numbers"
      />
      <StatCard
        label="Checked In"
        value={loading ? "—" : `${stats.checkedInTeams} / ${stats.totalTeams}`}
        icon="◈"
        accent="magenta"
        hint="Teams marked present"
      />
      <StatCard
        label="Valid Emails"
        value={loading ? "—" : stats.validEmails}
        icon="@"
        accent="lilac"
        hint="Eligible for email send"
      />
    </div>
  );
}
