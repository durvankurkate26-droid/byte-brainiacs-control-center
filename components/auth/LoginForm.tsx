"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Enterprise-style admin sign-in card. Reuses the existing "Afterglow" palette
// and utility classes (glass / btn-primary / font tokens) so it reads as part
// of the same product — no new design system is introduced.

interface LoginFormProps {
  /** Validated same-origin path to return to after a successful sign-in. */
  next?: string;
}

export default function LoginForm({ next }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Invalid username or password.");
        setLoading(false);
        return;
      }

      // Keep the loading state through the navigation so the button doesn't flash
      // back to idle before the dashboard mounts.
      router.replace(next ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      {/* Ambient glow orbs — echo the landing page's atmosphere. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-0 h-[32rem] w-[32rem] rounded-full bg-lilac/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full bg-magenta/15 blur-[120px]"
      />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Brand lockup */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-lilac to-magenta font-heading text-lg font-bold text-void shadow-glow">
            BB
          </span>
          <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight text-haze">
            Byte Brainiacs
          </h1>
          <p className="mt-1 font-sans text-sm text-mist">
            Hackathon Organizer Platform
          </p>
        </div>

        {/* Glassmorphism card */}
        <div className="glass rounded-2xl p-8 shadow-card-hover sm:p-10">
          <div className="mb-6">
            <span className="eyebrow">Admin Access</span>
            <h2 className="mt-2 font-heading text-xl font-semibold text-haze">
              Sign in to continue
            </h2>
            <p className="mt-1 text-sm text-mist">
              Enter your organizer credentials to access the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="username"
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-lilac/20 bg-void/50 px-4 py-3 text-sm text-haze outline-none transition-colors placeholder:text-mist/60 focus:border-lilac/60 focus:bg-void/70 disabled:opacity-60"
                placeholder="admin"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-lilac/20 bg-void/50 px-4 py-3 text-sm text-haze outline-none transition-colors placeholder:text-mist/60 focus:border-lilac/60 focus:bg-void/70 disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="animate-fade-in rounded-xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-haze"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-1 w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span
                    aria-hidden
                    className="h-4 w-4 animate-spin rounded-full border-2 border-void/40 border-t-void"
                  />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <span aria-hidden>→</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center font-mono text-[11px] tracking-wider text-mist/70">
          Byte Brainiacs · Secure Admin Portal · v1.0
        </p>
      </div>
    </main>
  );
}
