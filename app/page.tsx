import Link from "next/link";

// The root route is now a marketing-style landing page that introduces the
// platform. All operational surfaces live under /dashboard.

const FEATURES = [
  { icon: "◆", label: "Registration" },
  { icon: "⬡", label: "QR Management" },
  { icon: "@", label: "Communication" },
  { icon: "◈", label: "Attendance" },
  { icon: "▤", label: "Analytics" },
];

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Ambient glow orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-0 h-[32rem] w-[32rem] rounded-full bg-lilac/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full bg-magenta/15 blur-[120px]"
      />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-8">
        <span className="font-mono text-sm tracking-[0.2em] text-lilac">
          02 / BYTE_BRAINIACS
        </span>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-mist transition-colors hover:text-haze"
        >
          Dashboard →
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:px-8">
        <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-lilac/25 bg-lilac/5 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-lilac backdrop-blur-sm animate-fade-in">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-magenta" />
          Hackathon Control Center
        </span>

        <h1 className="font-heading text-5xl font-bold leading-[1.05] tracking-tight text-haze sm:text-7xl animate-fade-in">
          BYTE BRAINIACS
        </h1>
        <p className="mt-4 max-w-2xl font-heading text-2xl font-medium text-transparent sm:text-3xl bg-gradient-to-r from-lilac via-haze to-magenta bg-clip-text animate-fade-in">
          Hackathon Organizer Platform
        </p>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-mist animate-fade-in">
          One cohesive workspace to run your event end to end — registration, QR
          management, communication, attendance, and live analytics.
        </p>

        {/* Feature pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-in">
          {FEATURES.map((f) => (
            <span
              key={f.label}
              className="group inline-flex items-center gap-2 rounded-full border border-lilac/20 bg-lilac/[0.04] px-4 py-2 text-sm text-haze backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-lilac/50 hover:bg-lilac/10"
            >
              <span className="font-mono text-lilac transition-transform duration-200 group-hover:scale-110">
                {f.icon}
              </span>
              {f.label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row animate-fade-in">
          <Link href="/dashboard" className="btn-primary w-full sm:w-auto">
            Launch Dashboard
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/dashboard/attendance"
            className="btn-ghost w-full sm:w-auto"
          >
            View Attendance
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 py-8 text-center sm:px-8">
        <p className="font-mono text-xs tracking-wider text-mist/70">
          Byte Brainiacs · Hackathon Organizer Platform · v1.0
        </p>
      </footer>
    </main>
  );
}
