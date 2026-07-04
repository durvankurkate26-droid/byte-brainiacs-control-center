// ─── lib/csvExport.ts ────────────────────────────────────────────────────────
// Client-side CSV export helpers. Builds CSV text from in-memory data using the
// papaparse unparser (already a project dependency — no new library) and
// triggers a browser download. Kept UI-free so it can be unit-tested and reused.

import Papa from "papaparse";
import type { ParticipantRow } from "@/lib/automationTypes";
import type { Team } from "@/lib/types";

/**
 * Triggers a browser download of `content` as a file named `filename`.
 * Uses a temporary object URL + anchor click — no dependencies, no server round
 * trip. A BOM is prepended so Excel opens UTF-8 (₹, accents, emoji) correctly.
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(["﻿", content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Appends a YYYY-MM-DD stamp to a base name, e.g. participants-2026-07-04.csv */
export function stampedFilename(base: string, now: Date = new Date()): string {
  const stamp = now.toISOString().slice(0, 10);
  return `${base}-${stamp}.csv`;
}

// ─── Participants export ──────────────────────────────────────────────────────

/**
 * Serialises the participant roster to CSV. Column order is stable and headers
 * are human-readable so the file is presentation-ready for judges/organisers.
 * Includes derived validity flags so invalid contact rows are auditable.
 */
export function participantsToCsv(rows: ParticipantRow[]): string {
  const records = rows.map((r) => ({
    "Team Number": r.teamNumber,
    "Participant Name": r.participant,
    "Email": r.email,
    "Email Valid": r.emailValid ? "yes" : "no",
    "Phone": r.phone,
    "Phone Valid": r.phoneValid ? "yes" : "no",
    "College": r.college,
    "Course": r.course,
    "Registration Type": r.registrationType,
    "Registered At": r.registeredAt,
  }));

  return Papa.unparse(records, { quotes: true });
}

// ─── Attendance export ────────────────────────────────────────────────────────

/**
 * Serialises the teams table to an attendance CSV: one row per team with its
 * members, check-in status, and check-in time. Rows are sorted by team id
 * (numeric-aware) so the export reads in registration order.
 */
export function attendanceToCsv(teams: Team[]): string {
  const sorted = [...teams].sort((a, b) =>
    a.team_id.localeCompare(b.team_id, undefined, { numeric: true })
  );

  const records = sorted.map((t) => ({
    "Team ID": t.team_id,
    "Team Name": t.team_name,
    "Member 1": t.participant_1 ?? "",
    "Member 2": t.participant_2 ?? "",
    "Member 3": t.participant_3 ?? "",
    "Checked In": t.attendance ? "yes" : "no",
    "Check-In Time": t.checkin_time
      ? new Date(t.checkin_time).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "",
  }));

  return Papa.unparse(records, { quotes: true });
}
