// ─── lib/whatsapp.ts ─────────────────────────────────────────────────────────
// Client-safe helpers for the WhatsApp messaging module. Turns a message
// template plus a ParticipantRow into a personalised wa.me deep link. Mirrors
// the token model used by the Email composer (interpolate) but adds {{college}}
// and targets WhatsApp's click-to-chat URL scheme instead of email.
//
// No server imports — safe to use directly in client components.

import type { ParticipantRow } from "@/lib/automationTypes";
import { isValidPhone } from "@/lib/validation";

/** Country code prepended to bare 10-digit Indian mobile numbers. */
const DEFAULT_COUNTRY_CODE = "91";

/**
 * Normalises a phone number into the digits-only, country-code-prefixed form
 * wa.me expects (e.g. "919876543210"). Returns null when the number is not a
 * valid Indian mobile — those participants can't be messaged.
 *
 * Accepts inputs with spaces, dashes, brackets, a leading +91 / 91 / 0, or a
 * bare 10-digit number, matching the tolerance of isValidPhone().
 */
export function normalisePhoneForWa(phone: string): string | null {
  if (!isValidPhone(phone)) return null;

  const stripped = phone.replace(/[\s\-().]/g, "");
  // Drop any leading +91 / 91 / 0 so we can re-apply a canonical country code.
  const local = stripped.replace(/^(\+91|91|0)/, "");
  return `${DEFAULT_COUNTRY_CODE}${local}`;
}

/**
 * Resolves {{name}}, {{full_name}}, {{team}}, and {{college}} tokens in a
 * template for a single participant. Unknown-value tokens fall back to a dash
 * so a link never contains a literal "{{college}}".
 */
export function interpolateWhatsApp(
  template: string,
  participant: ParticipantRow
): string {
  const firstName =
    participant.participant.split(" ")[0] || participant.participant;

  return template
    .replace(/\{\{name\}\}/g, firstName || "there")
    .replace(/\{\{full_name\}\}/g, participant.participant || "there")
    .replace(/\{\{team\}\}/g, participant.teamNumber || "—")
    .replace(/\{\{college\}\}/g, participant.college || "your college");
}

/** The tokens the composer advertises, with a human-readable description. */
export const WHATSAPP_TOKENS: Array<{ token: string; description: string }> = [
  { token: "{{name}}", description: "First name" },
  { token: "{{full_name}}", description: "Full name" },
  { token: "{{team}}", description: "Team number" },
  { token: "{{college}}", description: "College name" },
];

/** One participant resolved to a ready-to-open WhatsApp deep link. */
export interface WhatsAppTarget {
  participant: ParticipantRow;
  /** Normalised phone (digits only) or null when unmessageable. */
  phone: string | null;
  /** Personalised message text for this participant. */
  message: string;
  /** wa.me deep link, or null when the phone is invalid. */
  link: string | null;
}

/** Builds a wa.me click-to-chat link for a normalised phone + message. */
export function buildWaLink(normalisedPhone: string, message: string): string {
  return `https://wa.me/${normalisedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Resolves every participant to a WhatsAppTarget. Participants with an invalid
 * phone keep a null link so the UI can list them separately as "skipped".
 */
export function buildWhatsAppTargets(
  template: string,
  participants: ParticipantRow[]
): WhatsAppTarget[] {
  return participants.map((participant) => {
    const phone = normalisePhoneForWa(participant.phone);
    const message = interpolateWhatsApp(template, participant);
    return {
      participant,
      phone,
      message,
      link: phone ? buildWaLink(phone, message) : null,
    };
  });
}
