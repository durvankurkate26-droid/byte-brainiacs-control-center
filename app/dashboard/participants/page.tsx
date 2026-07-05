"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";

import type { RawParticipantRow, ParseState } from "@/lib/automationTypes";
import { findMissingColumns, normaliseRow, deriveStats } from "@/lib/csvParse";
import { useDashboard } from "@/components/dashboard/DashboardProvider";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import CsvDropZone from "@/components/automation/CsvDropZone";
import DatasetCard from "@/components/automation/DatasetCard";
import ImportPanel from "@/components/automation/ImportPanel";
import ParticipantWorkspace from "@/components/automation/ParticipantWorkspace";
import ExportPanel from "@/components/automation/ExportPanel";
import EmptyState from "@/components/dashboard/EmptyState";

// Loading skeleton for the participant table.
function TableSkeleton() {
  return (
    <div className="card space-y-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-9 animate-pulse rounded-lg bg-mist/10"
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}

export default function ParticipantsPage() {
  const {
    participants,
    teams,
    loading,
    refetch,
    workspace,
    scopeSets,
    exportScope,
    setExportScope,
    handleBulkEmail,
    handleBulkWhatsApp,
    handleBulkExport,
  } = useDashboard();

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
    <div className="space-y-12">
      <PageHeader
        eyebrow="Database"
        title="Participants"
        description="Import registrations, filter the roster, and act on participants in bulk — email, WhatsApp, or export."
      />

      {/* Import */}
      <Section
        title="Import Participants"
        hint="Upload the registration CSV to populate the database. Teams are synced automatically for QR check-in."
      >
        {parseState.status !== "done" ? (
          <div className="space-y-4">
            <CsvDropZone onFile={handleFile} isParsing={isParsing} />
            {parseState.status === "error" && (
              <div className="card border-magenta/40 p-5">
                <p className="text-sm font-semibold text-magenta">Parse Error</p>
                <p className="mt-1 text-sm text-mist">{parseState.message}</p>
                <button
                  onClick={reset}
                  className="mt-4 rounded-xl border border-lilac/30 px-4 py-2 text-xs uppercase tracking-wider text-lilac transition-colors hover:bg-lilac/10"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
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

      {/* Roster: filters + bulk actions + table */}
      <Section
        title="Participant Database"
        hint={
          loading
            ? "Loading participants…"
            : hasParticipants
            ? "Filter the roster, select participants, and act on them in bulk."
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

      {/* Export */}
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
    </div>
  );
}
