"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Team } from "@/lib/types";

import { useDashboard } from "@/components/dashboard/DashboardProvider";
import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import QRScanner from "@/components/QRScanner";
import SuccessCard from "@/components/SuccessCard";
import AttendanceAnalytics from "@/components/dashboard/AttendanceAnalytics";
import TeamsSection from "@/components/dashboard/TeamsSection";

type ScanState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; team: Team; alreadyMarked: boolean }
  | { status: "not_found"; teamId: string }
  | { status: "error"; message: string };

export default function AttendancePage() {
  const { participants, teams, stats, loading, refetch } = useDashboard();
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });

  const handleScan = useCallback(
    async (rawTeamId: string) => {
      // Avoid re-processing while a previous lookup/update is in flight,
      // or while a result is already on screen.
      setScanState((prev) =>
        prev.status === "loading" ? prev : { status: "loading" }
      );

      const teamId = rawTeamId.trim().toUpperCase();

      try {
        const { data: team, error: fetchError } = await supabase
          .from("teams")
          .select("*")
          .eq("team_id", teamId)
          .maybeSingle();

        if (fetchError) {
          setScanState({ status: "error", message: fetchError.message });
          return;
        }

        if (!team) {
          setScanState({ status: "not_found", teamId });
          return;
        }

        if (team.attendance) {
          setScanState({ status: "success", team, alreadyMarked: true });
          return;
        }

        const checkinTime = new Date().toISOString();
        const { data: updated, error: updateError } = await supabase
          .from("teams")
          .update({ attendance: true, checkin_time: checkinTime })
          .eq("team_id", teamId)
          .eq("attendance", false) // guard against a race with a second scan
          .select()
          .maybeSingle();

        if (updateError) {
          setScanState({ status: "error", message: updateError.message });
          return;
        }

        if (!updated) {
          // Someone else's scan won the race between our read and write —
          // re-fetch so the UI still shows the correct, already-marked state.
          const { data: refetched } = await supabase
            .from("teams")
            .select("*")
            .eq("team_id", teamId)
            .maybeSingle();
          if (refetched) {
            setScanState({
              status: "success",
              team: refetched,
              alreadyMarked: true,
            });
          }
          return;
        }

        setScanState({ status: "success", team: updated, alreadyMarked: false });
        // Refresh the live attendance panels below the scanner.
        refetch();
      } catch (err) {
        setScanState({
          status: "error",
          message: err instanceof Error ? err.message : "Unexpected error",
        });
      }
    },
    [refetch]
  );

  const reset = () => setScanState({ status: "idle" });
  const isPaused = scanState.status !== "idle";

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Check-In"
        title="Attendance"
        description="Scan team QR codes to mark attendance, and watch check-ins land live."
      />

      {/* Scanner */}
      <Section
        title="QR Scanner"
        hint="Point the camera at a team's QR code to mark attendance."
      >
        <div className="mx-auto max-w-md space-y-5">
          {scanState.status === "idle" || scanState.status === "loading" ? (
            <>
              <QRScanner onScan={handleScan} paused={isPaused} />
              {scanState.status === "loading" && (
                <p className="text-center text-sm text-lilac">Looking up team…</p>
              )}
            </>
          ) : null}

          {scanState.status === "success" && (
            <SuccessCard
              team={scanState.team}
              alreadyMarked={scanState.alreadyMarked}
              onScanAnother={reset}
            />
          )}

          {scanState.status === "not_found" && (
            <div className="card border-magenta/40 p-6 text-center">
              <p className="font-semibold text-magenta">Team Not Found</p>
              <p className="mt-1 text-sm text-mist">
                No team matches ID &quot;{scanState.teamId}&quot;.
              </p>
              <button
                onClick={reset}
                className="mt-5 rounded-xl border border-lilac/40 px-5 py-2 text-xs uppercase tracking-wider text-lilac transition-colors hover:bg-lilac/10"
              >
                Try Again
              </button>
            </div>
          )}

          {scanState.status === "error" && (
            <div className="card border-magenta/40 p-6 text-center">
              <p className="font-semibold text-magenta">Something Went Wrong</p>
              <p className="mt-1 text-sm text-mist">{scanState.message}</p>
              <button
                onClick={reset}
                className="mt-5 rounded-xl border border-lilac/40 px-5 py-2 text-xs uppercase tracking-wider text-lilac transition-colors hover:bg-lilac/10"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* Live statistics */}
      <Section
        title="Live Statistics"
        hint="Attendance rate and data-quality metrics update as teams scan in."
      >
        <AttendanceAnalytics stats={stats} loading={loading} />
      </Section>

      {/* Teams & live check-in activity */}
      <Section
        title="Teams & Live Activity"
        hint="Recent check-ins, teams still pending, and a searchable directory."
      >
        <TeamsSection
          participants={participants}
          teams={teams}
          loading={loading}
        />
      </Section>
    </div>
  );
}
