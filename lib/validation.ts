// ─── lib/validation.ts ───────────────────────────────────────────────────────
// Shared field-validation helpers. Previously duplicated inline in the
// automation and generate pages — kept here as the single source of truth so
// CSV import, the participant view mapper, and any future module validate
// identically. Client-safe (no server imports).

/** True when the value looks like a valid email (basic RFC-5322-ish check). */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * True when the value is a valid Indian mobile number.
 * Strips spaces/dashes/brackets and an optional +91 / 91 / 0 prefix, then
 * requires 10 digits starting 6–9.
 */
export function isValidPhone(phone: string): boolean {
  const stripped = phone.replace(/[\s\-().]/g, "");
  const normalised = stripped.replace(/^(\+91|91|0)/, "");
  return /^[6-9]\d{9}$/.test(normalised);
}
