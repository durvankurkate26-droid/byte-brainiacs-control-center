import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import { SESSION_COOKIE, getAuthSecret } from "@/lib/auth/config";
import { verifySessionToken } from "@/lib/auth/session";

// Dedicated auth entry point. Middleware already keeps authenticated users out
// of /login, but we re-check here so a direct render (or a cached middleware
// edge case) still can't show the form to someone already signed in.

export const metadata: Metadata = {
  title: "Sign in — Byte Brainiacs",
  description: "Secure admin access to the Byte Brainiacs organizer platform.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token && (await verifySessionToken(token, getAuthSecret()))) {
    redirect("/dashboard");
  }

  const { next } = await searchParams;
  // Only honour same-origin relative paths to avoid an open-redirect.
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : undefined;

  return <LoginForm next={safeNext} />;
}
