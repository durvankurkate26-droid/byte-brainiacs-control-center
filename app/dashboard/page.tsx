"use client";

import { useDashboard } from "@/components/dashboard/DashboardProvider";
import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import AttendanceAnalytics from "@/components/dashboard/AttendanceAnalytics";
import TeamsSection from "@/components/dashboard/TeamsSection";
import QuickActions from "@/components/automation/QuickActions";

export default function OverviewPage() {
  const { participants, teams, stats, loading, error, refetch } = useDashboard();

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Dashboard"
        title="Overview"
        description="Live attendance, data quality, and team activity — all driven by one participant database."
      />

      {/* Attendance summary */}
      <Section
        title="Attendance Summary"
        hint="Teams are the source of truth for check-ins."
      >
        {error ? (
          <div className="card border-magenta/40 p-6">
            <p className="text-sm font-semibold text-magenta">
              Failed to load dashboard
            </p>
            <p className="mt-1 text-sm text-mist">{error}</p>
            <button
              onClick={refetch}
              className="mt-4 rounded-xl border border-lilac/30 px-4 py-2 text-xs uppercase tracking-wider text-lilac transition-colors hover:bg-lilac/10"
            >
              Retry
            </button>
          </div>
        ) : (
          <AttendanceAnalytics stats={stats} loading={loading} />
        )}
      </Section>

      {/* Quick actions */}
      <Section
        title="Quick Actions"
        hint="Jump straight into the tools you use most."
      >
        <QuickActions />
      </Section>

      {/* Teams overview + recent activity */}
      {!error && (
        <Section
          title="Teams & Recent Activity"
          hint="Recent check-ins, teams still pending, and a searchable directory. Open any team for members, registration types, and colleges."
        >
          <TeamsSection
            participants={participants}
            teams={teams}
            loading={loading}
          />
        </Section>
      )}
    </div>
  );
}
