"use client";

import { useCallback, useMemo, useState } from "react";
import Papa from "papaparse";

import type { RawParticipantRow, ParseState } from "@/lib/automationTypes";
import { findMissingColumns, normaliseRow, deriveStats } from "@/lib/csvParse";
import { useDashboardData } from "@/lib/useDashboardData";
import { useParticipantWorkspace } from "@/lib/useParticipantWorkspace";
import { defaultScope, type ScopeMode, type ScopeSets } from "@/lib/scope";
import {
  downloadCsv,
  participantsToCsv,
  stampedFilename,
} from "@/lib/csvExport";

import CsvDropZone from "@/components/automation/CsvDropZone";
import DatasetCard from "@/components/automation/DatasetCard";
import ImportPanel from "@/components/automation/ImportPanel";
import ParticipantWorkspace from "@/components/automation/ParticipantWorkspace";
import EmailComposer from "@/components/automation/EmailComposer";
import WhatsAppComposer from "@/components/automation/WhatsAppComposer";
import ExportPanel from "@/components/automation/ExportPanel";
import QuickActions from "@/components/automation/QuickActions";
import AttendanceAnalytics from "@/components/dashboard/AttendanceAnalytics";
import TeamsSection from "@/components/dashboard/TeamsSection";
import EmptyState from "@/components/dashboard/EmptyState";

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

// ─── Loading skeleton ─────────────────────────────────────────────────────────

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

/** Smoothly scrolls an in-page section into view (used by bulk actions). */
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ControlCenterPage() {
  // Live dashboard data loaded from the database on open.
  const { participants, teams, stats, loading, error, refetch } =
    useDashboardData();

  // Shared filter + selection state for the whole participant surface.
  const workspace = useParticipantWorkspace(participants, teams);

  // Per-consumer communication/export scope. Bulk actions set these so that,
  // e.g., "Email" on the toolbar points the composer at the selected/filtered set.
  const [emailScope, setEmailScope] = useState<ScopeMode>("all");
  const [waScope, setWaScope] = useState<ScopeMode>("all");
  const [exportScope, setExportScope] = useState<ScopeMode>("all");

  const scopeSets: ScopeSets = useMemo(
    () => ({
      all: workspace.all,
      filtered: workspace.filtered,
      selected: workspace.selected,
    }),
    [workspace.all, workspace.filtered, workspace.selected]
  );

  // The scope a bulk action should target: the explicit selection when present,
  // otherwise the filtered view (falling back to all when no filters are set).
  const bulkScope = useMemo(
    () => defaultScope(scopeSets, workspace.filtersActive),
    [scopeSets, workspace.filtersActive]
  );

  const handleBulkEmail = useCallback(() => {
    setEmailScope(bulkScope);
    scrollToSection("email-composer");
  }, [bulkScope]);

  const handleBulkWhatsApp = useCallback(() => {
    setWaScope(bulkScope);
    scrollToSection("whatsapp-composer");
  }, [bulkScope]);

  const handleBulkExport = useCallback(() => {
    const rows =
      workspace.selectedCount > 0 ? workspace.selected : workspace.filtered;
    if (rows.length === 0) return;
    const name = workspace.selectedCount > 0 ? "selected" : "filtered";
    downloadCsv(stampedFilename(`participants-${name}`), participantsToCsv(rows));
  }, [workspace.selected, workspace.filtered, workspace.selectedCount]);

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

      {/* ── Teams & check-in activity ─────────────────────────────────── */}
      {!error && (
        <Section
          title="Teams & Check-In Activity"
          hint="Recent check-ins, teams still pending, and a searchable directory. Open any team for members, registration types, and colleges."
        >
          <TeamsSection
            participants={participants}
            teams={teams}
            loading={loading}
          />
        </Section>
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

      {/* ── Participants workspace (filters + bulk actions + table) ────── */}
      <Section
        title="Participant Database"
        hint={
          loading
            ? "Loading participants…"
            : hasParticipants
            ? "Filter the roster, select participants, and act on them in bulk — email, WhatsApp, or export."
            : "No participants yet. Import a CSV above to get started."
        }
      >
        {loading ? (
          <TableSkeleton />
        ) : hasParticipants ? (
          <ParticipantWorkspace
            workspace={workspace}
            onEmail={handleBulkEmail}
            onWhatsApp={handleBulkWhatsApp}
            onExport={handleBulkExport}
          />
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
          hint="Download the participant roster (all, filtered, or selected) and live attendance as CSV files."
        >
          <ExportPanel
            scopeSets={scopeSets}
            scope={exportScope}
            onScopeChange={setExportScope}
            filtersActive={workspace.filtersActive}
            teams={teams}
          />
        </Section>
      )}

      {/* ── Email (from DB) ───────────────────────────────────────────── */}
      {hasParticipants && (
        <Section
          id="email-composer"
          title="Email Composer"
          hint="Compose and send personalized emails to all, filtered, or selected participants."
        >
          <EmailComposer
            scopeSets={scopeSets}
            scope={emailScope}
            onScopeChange={setEmailScope}
            filtersActive={workspace.filtersActive}
          />
        </Section>
      )}

      {/* ── WhatsApp (from DB) ────────────────────────────────────────── */}
      {hasParticipants && (
        <Section
          id="whatsapp-composer"
          title="WhatsApp Composer"
          hint="Generate personalized WhatsApp click-to-chat links for all, filtered, or selected participants."
        >
          <WhatsAppComposer
            scopeSets={scopeSets}
            scope={waScope}
            onScopeChange={setWaScope}
            filtersActive={workspace.filtersActive}
          />
        </Section>
      )}
    </div>
  );
}
