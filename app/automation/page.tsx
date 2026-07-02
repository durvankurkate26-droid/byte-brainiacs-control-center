"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";

import type { RawParticipantRow, ParseState } from "@/lib/automationTypes";
import { findMissingColumns, normaliseRow, deriveStats } from "@/lib/csvParse";
import { useDashboardData } from "@/lib/useDashboardData";

import CsvDropZone from "@/components/automation/CsvDropZone";
import DatasetCard from "@/components/automation/DatasetCard";
import ImportPanel from "@/components/automation/ImportPanel";
import ParticipantTable from "@/components/automation/ParticipantTable";
import EmailComposer from "@/components/automation/EmailComposer";
import QuickActions from "@/components/automation/QuickActions";
import DashboardStats from "@/components/dashboard/DashboardStats";

// ─── Section shell ───────────────────────────────────────────────────────────

function Section({
  title,
  hint,
  children,
  id,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="space-y-4 scroll-mt-24">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-haze">
          {title}
        </h2>
        {hint && <p className="mt-1 text-xs text-mist">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ControlCenterPage() {
  // Live dashboard data loaded from the database on open.
  const { participants, stats, loading, error, refetch } = useDashboardData();

  // In-memory CSV parse state — feeds the import panel only.
  const [parseState, setParseState] = useState<ParseState>({ status: "idle" });

  const handleFile = useCallback((file: File) => {
    setParseState({ status: "parsing" });

    Papa.parse<RawParticipantRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete(results) {
        const missing = findMissingColumns(results.meta.fields ?? []);
        if (missing.length > 0) {
          setParseState({
            status: "error",
            message: `Missing column(s): ${missing.join(", ")}. Please check your CSV headers.`,
          });
          return;
        }

        const rows = results.data.map(normaliseRow);
        setParseState({
          status: "done",
          rows,
          stats: deriveStats(rows),
          fileName: file.name,
          uploadTime: new Date(),
        });
      },
      error(err) {
        setParseState({
          status: "error",
          message: err.message ?? "Failed to parse CSV.",
        });
      },
    });
  }, []);

  const reset = () => setParseState({ status: "idle" });
  const isParsing = parseState.status === "parsing";
  const hasParticipants = participants.length > 0;

  return (
    <div className="space-y-10">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-haze">
          Hackathon Control Center
        </h1>
        <p className="mt-1 text-sm text-mist">
          Registrations, QR generation, communication, and attendance — driven
          by one participant database.
        </p>
      </div>

      {/* ── Live stats ────────────────────────────────────────────────── */}
      {error ? (
        <div className="rounded border border-magenta/40 bg-magenta/5 p-5">
          <p className="text-sm font-semibold text-magenta">
            Failed to load dashboard
          </p>
          <p className="mt-1 text-xs text-mist">{error}</p>
          <button
            onClick={refetch}
            className="mt-4 rounded border border-lilac/30 px-4 py-2 text-xs uppercase tracking-wider text-lilac hover:bg-lilac/10"
          >
            Retry
          </button>
        </div>
      ) : (
        <DashboardStats stats={stats} loading={loading} />
      )}

      {/* ── Quick actions ─────────────────────────────────────────────── */}
      <QuickActions />

      {/* ── Import ────────────────────────────────────────────────────── */}
      <Section
        title="Import Participants"
        hint="Upload the registration CSV to populate the participant database. Teams are synced automatically for QR check-in."
      >
        {parseState.status !== "done" ? (
          <>
            <CsvDropZone onFile={handleFile} isParsing={isParsing} />
            {parseState.status === "error" && (
              <div className="rounded border border-magenta/40 bg-magenta/5 p-5">
                <p className="text-sm font-semibold text-magenta">Parse Error</p>
                <p className="mt-1 text-xs text-mist">{parseState.message}</p>
                <button
                  onClick={reset}
                  className="mt-4 rounded border border-lilac/30 px-4 py-2 text-xs uppercase tracking-wider text-lilac hover:bg-lilac/10"
                >
                  Try Again
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <DatasetCard
              fileName={parseState.fileName}
              uploadTime={parseState.uploadTime}
              stats={parseState.stats}
              onReset={reset}
            />
            <ImportPanel rows={parseState.rows} onImported={refetch} />
          </div>
        )}
      </Section>

      {/* ── Participants (from DB) ────────────────────────────────────── */}
      <Section
        title="Participant Database"
        hint={
          loading
            ? "Loading participants…"
            : hasParticipants
            ? "Live records from the database. Search and filter the full roster."
            : "No participants yet. Import a CSV above to get started."
        }
      >
        {hasParticipants && <ParticipantTable rows={participants} />}
      </Section>

      {/* ── Email (from DB) ───────────────────────────────────────────── */}
      {hasParticipants && (
        <Section
          id="email-composer"
          title="Email Composer"
          hint="Compose and send personalized emails to the imported participants."
        >
          <EmailComposer participants={participants} />
        </Section>
      )}
    </div>
  );
}
