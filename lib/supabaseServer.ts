import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// ─── Server-only Supabase client (service role) ──────────────────────────────
// Used exclusively by trusted server routes (e.g. app/api/import-participants)
// to perform privileged writes that the anon client is deliberately denied by
// RLS. The service-role key MUST NOT be prefixed with NEXT_PUBLIC_ — it must
// never reach the browser.
//
// Built lazily via a factory (not a module-level singleton) so that a missing
// key surfaces as a clear 500 at request time — mirroring getTransporter()
// in app/api/send-emails/route.ts — rather than crashing the whole server on
// import when the env var happens to be absent.

export function getServiceSupabase(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Check your .env.local file."
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to your .env.local file " +
        "(Supabase Dashboard → Project Settings → API → service_role). " +
        "Keep it server-only — never expose it to the browser."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      // No session persistence needed for a stateless server client.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
