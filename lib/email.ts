// ─── lib/email.ts ────────────────────────────────────────────────────────────
// Server-side email helpers used exclusively by app/api/send-emails/route.ts.
// Intentionally separate from the client-side interpolate() in EmailComposer
// so there is no import across the server/client boundary.

// ─── Types ────────────────────────────────────────────────────────────────────

/** Minimal participant shape the API route cares about. */
export interface EmailParticipant {
  participant: string;
  email: string;
  teamNumber: string;
  emailValid: boolean;
}

/** Per-participant send result. */
export interface SendResult {
  email: string;
  success: boolean;
  error?: string;
}

/** Shape of the JSON body accepted by POST /api/send-emails. */
export interface SendEmailsRequestBody {
  subject: string;
  body: string;
  participants: EmailParticipant[];
}

/** Shape of the JSON response from POST /api/send-emails. */
export interface SendEmailsResponseBody {
  success: boolean;
  total: number;
  sent: number;
  failed: number;
  failures: Array<{ email: string; error: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolves {{name}}, {{full_name}}, and {{team}} tokens in a template string
 * for a given participant.
 *
 * Mirrors the client-side interpolate() in EmailComposer.tsx but runs on the
 * server — kept separate to avoid importing client modules into a Route Handler.
 */
export function interpolateTemplate(
  template: string,
  participant: EmailParticipant
): string {
  const firstName =
    participant.participant.split(" ")[0] || participant.participant;

  return template
    .replace(/\{\{name\}\}/g, firstName)
    .replace(/\{\{full_name\}\}/g, participant.participant)
    .replace(/\{\{team\}\}/g, participant.teamNumber || "—");
}

/**
 * Converts a plain-text email body to minimal, safe HTML.
 *
 * Rules:
 *  - Blank lines (paragraph breaks) → <p> tags
 *  - Single newlines within a paragraph → <br>
 *  - Angle brackets and ampersands are escaped so they render literally
 *    (protects against accidental injection from participant data in tokens)
 *
 * The result is wrapped in a simple styled container so it renders
 * consistently across major email clients without an external template engine.
 */
export function plainTextToHtml(text: string): string {
  // Escape characters that are unsafe inside HTML content
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Split on blank lines to get paragraphs, then join single newlines with <br>
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`);

  const bodyHtml = paragraphs.join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Byte Brainiacs</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:ui-monospace,'Cascadia Code','Segoe UI Mono',monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;border:1px solid #e4e4e7;overflow:hidden;">
          <!-- Header bar -->
          <tr>
            <td style="background:#16101F;padding:20px 32px;">
              <span style="color:#9D8CFF;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;">
                02 / BYTE_BRAINIACS
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;color:#18181b;font-size:14px;line-height:1.7;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #e4e4e7;padding:16px 32px;">
              <span style="color:#71717a;font-size:11px;">
                Byte Brainiacs Hackathon &mdash; Automated Registration Email
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Validates the incoming request body and returns a descriptive error string
 * if anything is wrong, or null if the payload is valid.
 */
export function validateSendRequest(
  body: unknown
): { error: string } | null {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a JSON object." };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.subject !== "string" || b.subject.trim() === "") {
    return { error: "subject is required and must be a non-empty string." };
  }

  if (typeof b.body !== "string" || b.body.trim() === "") {
    return { error: "body is required and must be a non-empty string." };
  }

  if (!Array.isArray(b.participants) || b.participants.length === 0) {
    return { error: "participants must be a non-empty array." };
  }

  return null;
}
