// ─── lib/csvParse.ts ─────────────────────────────────────────────────────────
// Shared CSV-parsing pieces used by the Control Center import flow. Extracted
// from the old automation/generate pages so header validation, row
// normalisation, and stats derivation live in one place. Client-safe.

import type {
  RawParticipantRow,
  ParticipantRow,
  CsvStats,
} from "@/lib/automationTypes";
import { isValidEmail, isValidPhone } from "@/lib/validation";

/** Columns the uploaded CSV must contain (after header trimming). */
export const REQUIRED_CSV_COLUMNS: (keyof RawParticipantRow)[] = [
  "Team Number",
  "Participant Name",
  "Participant Email",
  "Participant Mobile",
  "Registration Type",
  "College",
  "Course",
  "Registered At",
];

/** Returns the required columns missing from the parsed header list. */
export function findMissingColumns(headers: string[]): string[] {
  return REQUIRED_CSV_COLUMNS.filter((col) => !headers.includes(col));
}

/** Normalises one raw PapaParse row into the app's ParticipantRow shape. */
export function normaliseRow(raw: RawParticipantRow): ParticipantRow {
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

/** Derives the preview stats (participants, teams, valid emails/phones). */
export function deriveStats(rows: ParticipantRow[]): CsvStats {
  const uniqueTeams = new Set(rows.map((r) => r.teamNumber).filter(Boolean));
  return {
    totalParticipants: rows.length,
    totalTeams: uniqueTeams.size,
    validEmails: rows.filter((r) => r.emailValid).length,
    validPhones: rows.filter((r) => r.phoneValid).length,
  };
}
