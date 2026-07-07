// ─── app/api/auth/login/route.ts ──────────────────────────────────────────────
// POST /api/auth/login
//
// Validates { username, password } against the ADMIN_* env vars and, on success,
// sets the signed HttpOnly session cookie. Credentials are compared server-side
// only and are never returned to the client.

import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  getAuthSecret,
  sessionCookieOptions,
  verifyCredentials,
} from "@/lib/auth/config";
import { createSessionToken } from "@/lib/auth/session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { username, password } = (body ?? {}) as {
    username?: unknown;
    password?: unknown;
  };

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 }
    );
  }

  if (!verifyCredentials(username, password)) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  const token = await createSessionToken(
    username,
    getAuthSecret(),
    SESSION_MAX_AGE
  );

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
