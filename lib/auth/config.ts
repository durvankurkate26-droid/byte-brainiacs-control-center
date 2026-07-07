// ─── lib/auth/config.ts ───────────────────────────────────────────────────────
// Auth policy and credential checks driven entirely by server-side env vars.
//
// This module only reads `process.env` and does simple string work, so — like
// ./session — it is safe to import from Edge middleware as well as Node route
// handlers. Nothing here is ever bundled for the browser: it is imported only by
// server code (middleware, API routes, the login server component).

import { constantTimeEqual } from "./session";

/** Name of the HttpOnly session cookie. */
export const SESSION_COOKIE = "bb_session";

/** Session lifetime: 8 hours (one working day). */
export const SESSION_MAX_AGE = 60 * 60 * 8;

/**
 * The HMAC signing secret. Prefer an explicit `AUTH_SECRET`; otherwise derive
 * one from the admin credentials so no additional env var is required to deploy.
 * Deriving from the password means rotating `ADMIN_PASSWORD` automatically
 * invalidates every previously issued session.
 */
export function getAuthSecret(): string {
  const explicit = process.env.AUTH_SECRET;
  if (explicit && explicit.length > 0) return explicit;

  const username = process.env.ADMIN_USERNAME ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  return `bb::${username}::${password}`;
}

/**
 * Constant-time credential check against `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
 * Returns false (never throws) when the env vars are unset, so a misconfigured
 * deployment fails closed rather than granting access.
 */
export function verifyCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUsername || !expectedPassword) return false;

  // Evaluate both comparisons unconditionally to avoid leaking which field was
  // wrong via short-circuiting.
  const usernameOk = constantTimeEqual(username, expectedUsername);
  const passwordOk = constantTimeEqual(password, expectedPassword);
  return usernameOk && passwordOk;
}

/** Cookie attributes shared by the login (set) and logout (clear) routes. */
export function sessionCookieOptions(maxAge: number = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
