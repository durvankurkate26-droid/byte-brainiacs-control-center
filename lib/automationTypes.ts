// ─── Automation Module Types ────────────────────────────────────────────────
// Kept separate from lib/types.ts so the QR attendance module is untouched.

/** One row as it comes out of PapaParse after header mapping. */
export interface RawParticipantRow {
  "Team Number": string;
  "Participant Name": string;
  "Participant Email": string;
  "Participant Mobile": string;
  "Registration Type": string;
  "College": string;
  "Course": string;
  "Registered At": string;
}

/** Cleaned, validated row stored in component state. */
export interface ParticipantRow {
  teamNumber: string;
  participant: string;
  email: string;
  phone: string;
  registrationType: string;
  college: string;
  course: string;
  registeredAt: string;
  /** True when email passes basic RFC-5322-ish regex. */
  emailValid: boolean;
  /** True when phone is 10 digits (after stripping spaces/dashes/+91 prefix). */
  phoneValid: boolean;
}

/** Derived stats shown in the preview cards. */
export interface CsvStats {
  totalParticipants: number;
  totalTeams: number;
  validEmails: number;
  validPhones: number;
}

/** Discriminated union for the CSV parse lifecycle. */
export type ParseState =
  | { status: "idle" }
  | { status: "parsing" }
  | { status: "done"; rows: ParticipantRow[]; stats: CsvStats; fileName: string; uploadTime: Date }
  | { status: "error"; message: string };

/** One team derived from grouping CSV rows by Team Number. */
export interface CsvTeam {
  teamId: string;
  members: string[];
}
