// ─── app/api/send-emails/route.ts ─────────────────────────────────────────────
// POST /api/send-emails
//
// Accepts { subject, body, participants[] }, sends a personalised email to
// every participant whose emailValid flag is true, and returns a structured
// summary. One failed send never aborts the rest of the batch.

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  interpolateTemplate,
  plainTextToHtml,
  validateSendRequest,
  type SendEmailsRequestBody,
  type SendEmailsResponseBody,
  type EmailParticipant,
  type SendResult,
} from "@/lib/email";

// ─── Resend client ────────────────────────────────────────────────────────────
// Instantiated here (not in lib/email.ts) so the SDK import stays server-only.
// The constructor throws at call time if the key is missing, which surfaces as
// a 500 with a clear message rather than a silent wrong-key 403 mid-batch.

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to your .env.local file."
    );
  }
  return new Resend(apiKey);
}

// ─── FROM address ─────────────────────────────────────────────────────────────
// Resend requires a verified domain. During development you can use the
// Resend sandbox address: onboarding@resend.dev (sends only to the account
// owner). Set RESEND_FROM_EMAIL in .env.local once your domain is verified.

function getFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL ?? "Byte Brainiacs <onboarding@resend.dev>"
  );
}

// ─── Per-participant send ─────────────────────────────────────────────────────

async function sendOne(
  resend: Resend,
  from: string,
  rawSubject: string,
  rawBody: string,
  participant: EmailParticipant
): Promise<SendResult> {
  const subject = interpolateTemplate(rawSubject, participant);
  const html = plainTextToHtml(interpolateTemplate(rawBody, participant));

  try {
    const { error } = await resend.emails.send({
      from,
      to: [participant.email],
      subject,
      html,
    });

    if (error) {
      // Resend returns a typed error object on partial failures
      return {
        email: participant.email,
        success: false,
        error: error.message,
      };
    }

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

  // 4. Initialise Resend (fails fast if key missing)
  let resend: Resend;
  let from: string;
  try {
    resend = getResendClient();
    from = getFromAddress();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to initialise email client";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }

  // 5. Send all — sequentially to respect Resend's rate limits on free plans.
  //    Switch to Promise.all with a concurrency limiter for higher-volume plans.
  const results: SendResult[] = [];
  for (const participant of eligible) {
    const result = await sendOne(resend, from, subject, body, participant);
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
