// ─── middleware.ts ────────────────────────────────────────────────────────────
// Route guard for the admin dashboard. Runs on the Edge for every request whose
// path matches `config.matcher` below, validates the signed session cookie, and:
//
//   • redirects unauthenticated visitors of protected *pages* to /login,
//   • answers unauthenticated calls to protected *API* routes with 401 JSON,
//   • bounces already-authenticated visitors away from /login to /dashboard.
//
// It only reads and verifies the cookie — it never mints one. No app feature
// (QR attendance, Supabase, email, automation) is touched here.

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, getAuthSecret } from "@/lib/auth/config";
import { verifySessionToken } from "@/lib/auth/session";

// Protected admin pages. Each entry guards the path itself and everything nested
// under it (e.g. "/dashboard" also covers "/dashboard/attendance").
const PROTECTED_PAGE_PREFIXES = [
  "/dashboard",
  "/automation",
  "/checkin",
  "/generate",
];

// Admin API routes that must not be publicly accessible.
const PROTECTED_API_PREFIXES = [
  "/api/import-participants",
  "/api/send-emails",
];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token
    ? await verifySessionToken(token, getAuthSecret())
    : null;
  const isAuthenticated = session !== null;

  // Authenticated users have no reason to see the login page.
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const isProtectedApi = matchesPrefix(pathname, PROTECTED_API_PREFIXES);
  const isProtectedPage = matchesPrefix(pathname, PROTECTED_PAGE_PREFIXES);

  if ((isProtectedApi || isProtectedPage) && !isAuthenticated) {
    // API callers get a machine-readable 401 rather than an HTML redirect.
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Scope middleware execution to exactly the guarded surfaces plus /login.
  matcher: [
    "/dashboard/:path*",
    "/automation/:path*",
    "/checkin/:path*",
    "/generate/:path*",
    "/login",
    "/api/import-participants/:path*",
    "/api/send-emails/:path*",
  ],
};
