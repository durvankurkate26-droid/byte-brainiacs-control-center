"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";

import type {
  RawParticipantRow,
  ParticipantRow,
  CsvStats,
  ParseState,
} from "@/lib/automationTypes";
import { groupByTeam } from "@/lib/csvTeams";
import CsvQRCard from "@/components/CsvQRCard";
import CsvDropZone from "@/components/automation/CsvDropZone";

// ─── Validation helpers (same as control center) ─────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function isValidPhone(phone: string): boolean {
  const stripped = phone.replace(/[\s\-().]/g, "");
  const normalised = stripped.replace(/^(\+91|91|0)/, "");
  return /^[6-9]\d{9}$/.test(normalised);
}

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

export default function GeneratePage() {
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
  const teams =
    parseState.status === "done" ? groupByTeam(parseState.rows) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-haze">
            QR Codes
          </h1>
          <p className="mt-1 text-sm text-mist">
            {parseState.status === "done"
              ? `${teams.length} teams · one QR per team · upload a new CSV to regenerate`
              : "Upload your participant CSV to generate one QR code per team."}
          </p>
        </div>

        {parseState.status === "done" && (
          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={reset}
              className="rounded border border-lilac/30 px-4 py-2 text-xs uppercase tracking-wider text-lilac hover:bg-lilac/10"
            >
              ↺ New CSV
            </button>
            <button
              onClick={() => window.print()}
              className="rounded border border-lilac/30 px-4 py-2 text-xs uppercase tracking-wider text-lilac hover:bg-lilac/10"
            >
              Print All
            </button>
          </div>
        )}
      </div>

      {/* Drop zone */}
      {parseState.status !== "done" && (
        <CsvDropZone onFile={handleFile} isParsing={isParsing} />
      )}

      {/* Error */}
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

      {/* Empty state */}
      {parseState.status === "done" && teams.length === 0 && (
        <div className="rounded border border-lilac/20 p-8 text-center text-mist">
          No teams found. Make sure your CSV has a non-empty{" "}
          <span className="font-medium text-haze">"Team Number"</span> column.
        </div>
      )}

      {/* QR grid */}
      {parseState.status === "done" && teams.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {teams.map((team) => (
            <CsvQRCard key={team.teamId} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}
