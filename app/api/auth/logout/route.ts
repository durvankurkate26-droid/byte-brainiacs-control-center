// ─── app/api/auth/logout/route.ts ─────────────────────────────────────────────
// POST /api/auth/logout
//
// Clears the session cookie by overwriting it with an immediately-expired value
// carrying the same attributes (path/secure/sameSite), which is what the browser
// requires to actually drop it.

import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/config";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}
