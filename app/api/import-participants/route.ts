// ─── app/api/import-participants/route.ts ─────────────────────────────────────
// POST /api/import-participants
//
// Accepts { participants: ParticipantRow[] } (the parsed CSV rows from the
// automation page), maps them onto the participants table, and upserts them
// through the service-role client. Upsert is keyed on participant_email so
// re-importing the same CSV is idempotent for email-bearing rows.

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseServer";
import {
  toParticipantInsert,
  hasUsableEmail,
  type ImportResponseBody,
} from "@/lib/participants";
import { deriveTeams } from "@/lib/teams";
import type { ParticipantRow } from "@/lib/automationTypes";
import type { ParticipantInsert } from "@/lib/types";

// Supabase caps request payloads; chunk large imports to stay well under it.
const BATCH_SIZE = 500;

// ─── Body validation ──────────────────────────────────────────────────────────

function validateBody(
  body: unknown
): { error: string } | { participants: ParticipantRow[] } {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a JSON object." };
  }
  const { participants } = body as { participants?: unknown };
  if (!Array.isArray(participants) || participants.length === 0) {
    return { error: "participants must be a non-empty array." };
  }
  return { participants: participants as ParticipantRow[] };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Parse JSON
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  // 2. Validate shape
  const validated = validateBody(raw);
  if ("error" in validated) {
    return NextResponse.json(
      { success: false, error: validated.error },
      { status: 400 }
    );
  }
  const { participants } = validated;
  const total = participants.length;

  // 3. Map to DB rows and tally rows without a usable email (stored as NULL,
  //    never used as a conflict key).
  const invalidEmails = participants.filter((p) => !hasUsableEmail(p)).length;
  const rows = participants.map(toParticipantInsert);

  // 4. Collapse duplicate non-null emails within this file. Postgres refuses an
  //    ON CONFLICT upsert that would touch the same key twice in one statement,
  //    so keep only the last occurrence of each email. NULL emails are distinct
  //    and pass through untouched.
  const byEmail = new Map<string, ParticipantInsert>();
  const nullEmailRows: ParticipantInsert[] = [];
  for (const row of rows) {
    if (row.participant_email === null) {
      nullEmailRows.push(row);
    } else {
      byEmail.set(row.participant_email, row);
    }
  }
  const deduped = [...byEmail.values(), ...nullEmailRows];
  const duplicates = rows.length - deduped.length;

  // 5. Upsert in batches through the service client.
  let supabase;
  try {
    supabase = getServiceSupabase();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to init database client";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }

  let imported = 0;
  for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
    const batch = deduped.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("participants")
      .upsert(batch, { onConflict: "participant_email" })
      .select("id");

    if (error) {
      return NextResponse.json(
        {
          success: false,
          total,
          imported,
          invalidEmails,
          duplicates,
          teamsSynced: 0,
          error: `Database error after ${imported} row(s): ${error.message}`,
        } satisfies ImportResponseBody,
        { status: 500 }
      );
    }
    imported += data?.length ?? batch.length;
  }

  // 6. Sync the teams table from the imported participants so QR check-in and
  //    the attendance dashboard reflect the current roster. Identity columns
  //    only — attendance/checkin_time are preserved for existing teams (see
  //    deriveTeams / TeamSyncRow). A sync failure is reported but does NOT
  //    discard the successful participant import above.
  const teamRows = deriveTeams(deduped);
  let teamsSynced = 0;
  for (let i = 0; i < teamRows.length; i += BATCH_SIZE) {
    const batch = teamRows.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("teams")
      .upsert(batch, { onConflict: "team_id" })
      .select("team_id");

    if (error) {
      return NextResponse.json(
        {
          success: false,
          total,
          imported,
          invalidEmails,
          duplicates,
          teamsSynced,
          error:
            `Participants imported, but syncing the teams table failed after ` +
            `${teamsSynced} team(s): ${error.message}`,
        } satisfies ImportResponseBody,
        { status: 500 }
      );
    }
    teamsSynced += data?.length ?? batch.length;
  }

  // 7. Success summary
  const response: ImportResponseBody = {
    success: true,
    total,
    imported,
    invalidEmails,
    duplicates,
    teamsSynced,
  };
  return NextResponse.json(response, { status: 200 });
}
