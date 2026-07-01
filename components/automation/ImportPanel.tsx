"use client";

import { useMemo, useState } from "react";
import type { ParticipantRow } from "@/lib/automationTypes";
import type { ImportResponseBody } from "@/lib/participants";

// ─── Import lifecycle ─────────────────────────────────────────────────────────

type ImportState =
  | { status: "idle" }
  | { status: "importing" }
  | { status: "done"; result: ImportResponseBody }
  | { status: "error"; message: string };

interface ImportPanelProps {
  /** Parsed CSV rows to persist into public.participants. */
  rows: ParticipantRow[];
}

// ─── Result summary ───────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "lilac" | "magenta" | "mist";
}) {
  const color =
    accent === "lilac"
      ? "text-lilac"
      : accent === "magenta"
      ? "text-magenta"
      : "text-mist";
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-mist">{label}</p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${color}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function ImportResult({
  result,
  onReset,
}: {
  result: ImportResponseBody;
  onReset: () => void;
}) {
  return (
    <div className="rounded border border-lilac/30 bg-lilac/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-lilac">
          ✔ Imported into Supabase
        </p>
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-lilac/30 px-3 py-1 text-xs uppercase tracking-wider text-lilac transition-colors hover:bg-lilac/10"
        >
          Import Again
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Received" value={result.total} accent="mist" />
        <Stat label="Saved" value={result.imported} accent="lilac" />
        <Stat label="Invalid Email" value={result.invalidEmails} accent="magenta" />
        <Stat label="Duplicates" value={result.duplicates} accent="mist" />
      </div>

      {(result.invalidEmails > 0 || result.duplicates > 0) && (
        <p className="text-xs leading-relaxed text-mist">
          {result.invalidEmails > 0 && (
            <>
              {result.invalidEmails} row(s) had a blank/invalid email and were
              saved with no email (not de-duplicated).{" "}
            </>
          )}
          {result.duplicates > 0 && (
            <>
              {result.duplicates} duplicate email(s) in the file collapsed into a
              single record.
            </>
          )}
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ImportPanel({ rows }: ImportPanelProps) {
  const [state, setState] = useState<ImportState>({ status: "idle" });

  const validCount = useMemo(
    () => rows.filter((r) => r.emailValid && r.email.trim() !== "").length,
    [rows]
  );

  const isImporting = state.status === "importing";

  async function handleImport() {
    if (rows.length === 0) {
      setState({ status: "error", message: "No participants to import." });
      return;
    }

    setState({ status: "importing" });
    try {
      const response = await fetch("/api/import-participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: rows }),
      });

      const data: ImportResponseBody & { error?: string } =
        await response.json();

      if (!response.ok || !data.success) {
        setState({
          status: "error",
          message: data.error ?? "Import failed. Please try again.",
        });
        return;
      }

      setState({ status: "done", result: data });
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Network error — could not reach the import endpoint.",
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-widest text-mist">
          Import Participants
        </h2>
        <span className="text-xs text-mist">
          <span className="text-lilac">{rows.length}</span> row
          {rows.length !== 1 ? "s" : ""} ·{" "}
          <span className="text-lilac">{validCount}</span> with valid email
        </span>
      </div>

      <div className="rounded border border-lilac/20 bg-lilac/[0.03] p-5 space-y-4">
        <p className="text-xs leading-relaxed text-mist">
          Save the uploaded participants into the Supabase{" "}
          <span className="font-medium text-haze">participants</span> table — the
          master record used across QR generation, email, and attendance.
          Re-importing the same CSV updates existing participants instead of
          creating duplicates.
        </p>

        {/* Result panel — after completion */}
        {state.status === "done" && (
          <ImportResult
            result={state.result}
            onReset={() => setState({ status: "idle" })}
          />
        )}

        {/* Inline error */}
        {state.status === "error" && (
          <div className="rounded border border-magenta/40 bg-magenta/5 px-4 py-3">
            <p className="text-xs font-semibold text-magenta">
              {state.message}
            </p>
            <button
              type="button"
              onClick={() => setState({ status: "idle" })}
              className="mt-2 text-[10px] uppercase tracking-wider text-lilac hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action button — hidden once done to keep the summary focused */}
        {state.status !== "done" && (
          <button
            type="button"
            onClick={handleImport}
            disabled={isImporting}
            className={[
              "flex items-center gap-2 rounded border px-5 py-2 text-xs uppercase tracking-wider transition-colors",
              isImporting
                ? "cursor-not-allowed border-mist/20 bg-mist/5 text-mist/40"
                : "border-lilac/50 bg-lilac/10 text-lilac hover:bg-lilac/20",
            ].join(" ")}
          >
            {isImporting ? (
              <>
                <span className="inline-block animate-spin">⟳</span>
                Importing…
              </>
            ) : (
              "Import Participants to Database"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
