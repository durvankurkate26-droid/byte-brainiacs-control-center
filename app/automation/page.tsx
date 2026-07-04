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
import WhatsAppComposer from "@/components/automation/WhatsAppComposer";
import ExportPanel from "@/components/automation/ExportPanel";
import QuickActions from "@/components/automation/QuickActions";
import AttendanceAnalytics from "@/components/dashboard/AttendanceAnalytics";

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

// ─── Empty + loading states ───────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  message,
}: {
  icon: string;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-lilac/25 bg-lilac/[0.02] px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lilac/10 text-xl text-lilac">
        {icon}
      </div>
      <p className="text-sm font-semibold text-haze">{title}</p>
      <p className="max-w-md text-xs leading-relaxed text-mist">{message}</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded border border-lilac/20 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-8 animate-pulse rounded bg-mist/10"
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ControlCenterPage() {
  // Live dashboard data loaded from the database on open.
  const { participants, teams, stats, loading, error, refetch } =
    useDashboardData();

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

      {/* ── Attendance analytics ──────────────────────────────────────── */}
      <Section
        title="Attendance Analytics"
        hint="Live attendance and data-quality metrics — teams are the source of truth for check-ins."
      >
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
          <AttendanceAnalytics stats={stats} loading={loading} />
        )}
      </Section>

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
        {loading ? (
          <TableSkeleton />
        ) : hasParticipants ? (
          <ParticipantTable rows={participants} />
        ) : (
          <EmptyState
            icon="◆"
            title="No participants yet"
            message="Upload your registration CSV above to populate the database. Teams, QR codes, email, WhatsApp, and analytics all read from it."
          />
        )}
      </Section>

      {/* ── Export (from DB) ──────────────────────────────────────────── */}
      {hasParticipants && (
        <Section
          id="export-data"
          title="Export Data"
          hint="Download the participant roster and live attendance as CSV files for records or reporting."
        >
          <ExportPanel participants={participants} teams={teams} />
        </Section>
      )}

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

      {/* ── WhatsApp (from DB) ────────────────────────────────────────── */}
      {hasParticipants && (
        <Section
          id="whatsapp-composer"
          title="WhatsApp Composer"
          hint="Compose a template and generate personalized WhatsApp click-to-chat links for each participant."
        >
          <WhatsAppComposer participants={participants} />
        </Section>
      )}
    </div>
  );
}
