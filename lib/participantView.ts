// ─── lib/participantView.ts ──────────────────────────────────────────────────
// Bridges the database Participant record (snake_case, from public.participants)
// onto the ParticipantRow shape (camelCase) that the existing UI components and
// the email API already consume. This single mapper is what lets DB-loaded data
// flow into ParticipantTable, EmailComposer, and QR grouping without changing
// those components. Client-safe.

import type { Participant } from "@/lib/types";
import type { ParticipantRow } from "@/lib/automationTypes";
import { isValidEmail, isValidPhone } from "@/lib/validation";

/** Maps one database Participant onto the app's ParticipantRow shape. */
export function toParticipantRow(p: Participant): ParticipantRow {
  const email = p.participant_email ?? "";
  const phone = p.participant_phone ?? "";
  return {
    teamNumber: p.team_number ?? "",
    participant: p.participant_name ?? "",
    email,
    phone,
    registrationType: p.registration_type ?? "",
    college: p.college ?? "",
    course: p.course ?? "",
    registeredAt: p.registered_at ?? "",
    emailValid: isValidEmail(email),
    phoneValid: isValidPhone(phone),
  };
}

/** Maps a list of database Participants onto ParticipantRows. */
export function toParticipantRows(participants: Participant[]): ParticipantRow[] {
  return participants.map(toParticipantRow);
}
