// ─── app/api/send-emails/route.ts ─────────────────────────────────────────────
// POST /api/send-emails
//
// Accepts { subject, body, participants[] }, sends a personalised email to
// every participant whose emailValid flag is true, and returns a structured
// summary. One failed send never aborts the rest of the batch.

import { NextRequest, NextResponse } from "next/server";
import nodemailer, { type Transporter } from "nodemailer";
import {
  interpolateTemplate,
  plainTextToHtml,
  validateSendRequest,
  type SendEmailsRequestBody,
  type SendEmailsResponseBody,
  type EmailParticipant,
  type SendResult,
} from "@/lib/email";

// ─── Gmail SMTP transporter ─────────────────────────────────────────────────
// Built here (not in lib/email.ts) so the SMTP client stays server-only.
// The factory throws at call time if credentials are missing, which surfaces
// as a 500 with a clear message rather than a silent auth failure mid-batch.
//
// GMAIL_APP_PASSWORD must be a Google "App Password" (16 chars, 2FA enabled),
// not the account's normal login password.

function getTransporter(): Transporter {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "GMAIL_USER and GMAIL_APP_PASSWORD must be set. Add them to your .env.local file."
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

// ─── FROM address ─────────────────────────────────────────────────────────────
// Gmail sends as the authenticated account, so the FROM address is derived
// from GMAIL_USER. The display name keeps the branded "Byte Brainiacs" label.

function getFromAddress(): string {
  const user = process.env.GMAIL_USER ?? "";
  return `Byte Brainiacs <${user}>`;
}

// ─── Per-participant send ─────────────────────────────────────────────────────

async function sendOne(
  transporter: Transporter,
  from: string,
  rawSubject: string,
  rawBody: string,
  participant: EmailParticipant
): Promise<SendResult> {
  const subject = interpolateTemplate(rawSubject, participant);
  const html = plainTextToHtml(interpolateTemplate(rawBody, participant));

  try {
    await transporter.sendMail({
      from,
      to: participant.email,
      subject,
      html,
    });

    return { email: participant.email, success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error during send";
    return { email: participant.email, success: false, error: message };
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Parse body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  // 2. Validate
  const validationError = validateSendRequest(rawBody);
  if (validationError) {
    return NextResponse.json(
      { success: false, error: validationError.error },
      { status: 400 }
    );
  }

  const { subject, body, participants } =
    rawBody as SendEmailsRequestBody;

  // 3. Filter to only valid-email participants
  const eligible = participants.filter(
    (p): p is EmailParticipant =>
      typeof p.email === "string" &&
      p.email.trim() !== "" &&
      p.emailValid === true
  );

  if (eligible.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error:
          "No participants with valid email addresses found in the payload.",
      },
      { status: 422 }
    );
  }

  // 4. Initialise the Gmail SMTP transporter (fails fast if credentials missing)
  let transporter: Transporter;
  let from: string;
  try {
    transporter = getTransporter();
    from = getFromAddress();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to initialise email client";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }

  // 5. Send all — sequentially to respect Gmail's SMTP sending limits.
  //    Switch to Promise.all with a concurrency limiter for higher-volume tiers.
  const results: SendResult[] = [];
  for (const participant of eligible) {
    const result = await sendOne(transporter, from, subject, body, participant);
    results.push(result);
  }

  // 6. Collate
  const failures = results.filter((r) => !r.success);
  const sent = results.length - failures.length;

  const response: SendEmailsResponseBody = {
    success: failures.length === 0,
    total: eligible.length,
    sent,
    failed: failures.length,
    failures: failures.map((f) => ({
      email: f.email,
      error: f.error ?? "Unknown error",
    })),
  };

  // Return 207 Multi-Status when there's a mix of success + failure,
  // 200 when all succeeded, 500 when everything failed.
  const status =
    sent === 0 ? 500 : failures.length > 0 ? 207 : 200;

  return NextResponse.json(response, { status });
}
