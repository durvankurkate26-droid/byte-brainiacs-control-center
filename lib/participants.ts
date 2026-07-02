import type { ParticipantRow } from "@/lib/automationTypes";
import type { ParticipantInsert } from "@/lib/types";

// ─── CSV row → participants insert row ────────────────────────────────────────
// Maps a parsed, validated ParticipantRow (from the automation page) onto the
// shape stored in public.participants. Optional text fields collapse empty
// strings to NULL so the database holds real absences rather than "" values.
//
// participant_email is set to NULL when the CSV value is blank OR fails the
// automation page's emailValid check. NULL emails are treated as distinct by
// the table's unique index, so they are never used as an upsert conflict key.

/** True when a row has an email safe to use as the upsert conflict key. */
export function hasUsableEmail(row: ParticipantRow): boolean {
  return row.emailValid && row.email.trim() !== "";
}

function nullIfEmpty(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function toParticipantInsert(row: ParticipantRow): ParticipantInsert {
  return {
    team_number: row.teamNumber.trim(),
    participant_name: row.participant.trim(),
    participant_email: hasUsableEmail(row) ? row.email.trim() : null,
    participant_phone: nullIfEmpty(row.phone),
    college: nullIfEmpty(row.college),
    registration_type: nullIfEmpty(row.registrationType),
    course: nullIfEmpty(row.course),
    registered_at: nullIfEmpty(row.registeredAt),
  };
}

// ─── Import API contract ──────────────────────────────────────────────────────
// Shared between the import route and the ImportPanel component. Kept in this
// client-safe module (no server imports) so the browser can type the response.

/** Response from POST /api/import-participants. */
export interface ImportResponseBody {
  success: boolean;
  /** Rows received in the request. */
  total: number;
  /** Rows written to the database (after collapsing duplicate emails). */
  imported: number;
  /** Rows whose email was blank/invalid — stored with NULL email, not deduped. */
  invalidEmails: number;
  /** Duplicate email rows in the same file that collapsed into one on upsert. */
  duplicates: number;
  /** Teams upserted into public.teams from the imported participants. */
  teamsSynced: number;
  /** Present only on failure. */
  error?: string;
}
