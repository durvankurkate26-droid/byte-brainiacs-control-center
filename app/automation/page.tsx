"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";

import type {
  RawParticipantRow,
  ParticipantRow,
  CsvStats,
  ParseState,
} from "@/lib/automationTypes";

import CsvDropZone from "@/components/automation/CsvDropZone";
import StatsPreview from "@/components/automation/StatsPreview";
import DatasetCard from "@/components/automation/DatasetCard";
import ImportPanel from "@/components/automation/ImportPanel";
import ParticipantTable from "@/components/automation/ParticipantTable";
import EmailComposer from "@/components/automation/EmailComposer";
import QuickActions from "@/components/automation/QuickActions";
import RecentActivity from "@/components/automation/RecentActivity";

// ─── Validation helpers ──────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function isValidPhone(phone: string): boolean {
  const stripped = phone.replace(/[\s\-().]/g, "");
  const normalised = stripped.replace(/^(\+91|91|0)/, "");
  return /^[6-9]\d{9}$/.test(normalised);
}

// ─── Raw row → ParticipantRow ────────────────────────────────────────────────

function normaliseRow(raw: RawParticipantRow): ParticipantRow {
  const email = (raw["Participant Email"] ?? "").trim();
  const phone = (raw["Participant Mobile"] ?? "").trim();
  return {
    teamNumber: (raw["Team Number"] ?? "").trim(),
    participant: (raw["Participant Name"] ?? "").trim(),
    email,
    phone,
    registrationType: (raw["Registration Type"] ?? "").trim(),
    college: (raw["College"] ?? "").trim(),
    course: (raw["Course"] ?? "").trim(),
    registeredAt: (raw["Registered At"] ?? "").trim(),
    emailValid: isValidEmail(email),
    phoneValid: isValidPhone(phone),
  };
}

// ─── Stats derivation ────────────────────────────────────────────────────────

function deriveStats(rows: ParticipantRow[]): CsvStats {
  const uniqueTeams = new Set(rows.map((r) => r.teamNumber).filter(Boolean));
  return {
    totalParticipants: rows.length,
    totalTeams: uniqueTeams.size,
    validEmails: rows.filter((r) => r.emailValid).length,
    validPhones: rows.filter((r) => r.phoneValid).length,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ControlCenterPage() {
  const [parseState, setParseState] = useState<ParseState>({ status: "idle" });

  const handleFile = useCallback((file: File) => {
    setParseState({ status: "parsing" });

    Papa.parse<RawParticipantRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete(results) {
        const required: (keyof RawParticipantRow)[] = [
          "Team Number",
          "Participant Name",
          "Participant Email",
          "Participant Mobile",
          "Registration Type",
          "College",
          "Course",
          "Registered At",
        ];
        const headers = results.meta.fields ?? [];
        const missing = required.filter((col) => !headers.includes(col));

        if (missing.length > 0) {
          setParseState({
            status: "error",
            message: `Missing column(s): ${missing.join(", ")}. Please check your CSV headers.`,
          });
          return;
        }

        const rows = results.data.map(normaliseRow);
        const stats = deriveStats(rows);
        setParseState({
          status: "done",
          rows,
          stats,
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

  return (
    <div className="space-y-8">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-haze">
          Hackathon Control Center
        </h1>
        <p className="mt-1 text-sm text-mist">
          Manage registrations, communication, QR generation and attendance from
          one place.
        </p>
      </div>

      {/* ── Stats — only shown once CSV is loaded ─────────────────────── */}
      {parseState.status === "done" && (
        <StatsPreview stats={parseState.stats} />
      )}

      {/* ── Dataset card / Drop zone ──────────────────────────────────── */}
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
        <DatasetCard
          fileName={parseState.fileName}
          uploadTime={parseState.uploadTime}
          stats={parseState.stats}
          onReset={reset}
        />
      )}

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <QuickActions />

      {/* ── Recent Activity ───────────────────────────────────────────── */}
      <RecentActivity />

      {/* ── Import → Participant table → Email composer (after upload) ── */}
      {parseState.status === "done" && (
        <>
          <hr className="border-lilac/10" />
          <ImportPanel rows={parseState.rows} />
          <hr className="border-lilac/10" />
          <ParticipantTable rows={parseState.rows} />
          <hr className="border-lilac/10" />
          <EmailComposer participants={parseState.rows} />
        </>
      )}
    </div>
  );
}
