"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Team } from "@/lib/types";
import QRScanner from "@/components/QRScanner";
import SuccessCard from "@/components/SuccessCard";

type ScanState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; team: Team; alreadyMarked: boolean }
  | { status: "not_found"; teamId: string }
  | { status: "error"; message: string };

export default function CheckInPage() {
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });

  const handleScan = useCallback(async (rawTeamId: string) => {
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
    } catch (err) {
      setScanState({
        status: "error",
        message: err instanceof Error ? err.message : "Unexpected error",
      });
    }
  }, []);

  const reset = () => setScanState({ status: "idle" });

  const isPaused = scanState.status !== "idle";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-haze">
          Check-In
        </h1>
        <p className="mt-1 text-sm text-mist">
          Point the camera at a team&apos;s QR code to mark attendance.
        </p>
      </div>

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
        <div className="rounded border border-magenta/40 bg-magenta/5 p-6 text-center">
          <p className="font-semibold text-magenta">Team Not Found</p>
          <p className="mt-1 text-sm text-mist">
            No team matches ID &quot;{scanState.teamId}&quot;.
          </p>
          <button
            onClick={reset}
            className="mt-5 rounded border border-lilac/40 px-5 py-2 text-xs uppercase tracking-wider text-lilac hover:bg-lilac/10"
          >
            Try Again
          </button>
        </div>
      )}

      {scanState.status === "error" && (
        <div className="rounded border border-magenta/40 bg-magenta/5 p-6 text-center">
          <p className="font-semibold text-magenta">Something Went Wrong</p>
          <p className="mt-1 text-sm text-mist">{scanState.message}</p>
          <button
            onClick={reset}
            className="mt-5 rounded border border-lilac/40 px-5 py-2 text-xs uppercase tracking-wider text-lilac hover:bg-lilac/10"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
