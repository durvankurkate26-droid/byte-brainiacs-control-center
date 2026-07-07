"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// One-click logout. Clears the session cookie via the logout route, then sends
// the organizer back to /login. `router.refresh()` drops any cached authed
// server state so protected routes re-guard immediately.

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the request fails, fall through to the redirect — the guarded
      // routes will bounce an invalid/absent session back to /login anyway.
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-mist transition-all duration-200 hover:bg-magenta/10 hover:text-haze disabled:opacity-60"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lilac/[0.04] font-mono text-sm text-mist transition-colors group-hover:text-magenta">
        ⏻
      </span>
      {loading ? "Signing out…" : "Log out"}
    </button>
  );
}
