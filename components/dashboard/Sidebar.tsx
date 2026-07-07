"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import LogoutButton from "@/components/auth/LogoutButton";

// Professional sidebar navigation. Desktop renders a fixed rail; mobile renders
// a top bar with a collapsible drawer. The active route is highlighted from the
// current pathname.

interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** Match nested routes too (used only for the /dashboard overview root). */
  exact?: boolean;
}

const NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: "▤", exact: true },
  { label: "Participants", href: "/dashboard/participants", icon: "◆" },
  { label: "Communication", href: "/dashboard/communication", icon: "@" },
  { label: "QR Center", href: "/dashboard/qr", icon: "⬡" },
  { label: "Attendance", href: "/dashboard/attendance", icon: "◈" },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={[
              "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-gradient-to-r from-lilac/20 to-lilac/5 text-haze shadow-[inset_0_0_0_1px_rgba(157,140,255,0.3)]"
                : "text-mist hover:bg-lilac/10 hover:text-haze",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-8 w-8 items-center justify-center rounded-lg font-mono text-sm transition-colors",
                active
                  ? "bg-lilac/20 text-lilac"
                  : "bg-lilac/[0.04] text-mist group-hover:text-lilac",
              ].join(" ")}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lilac to-magenta font-heading text-sm font-bold text-void shadow-glow">
        BB
      </span>
      <span className="font-heading text-sm font-semibold leading-tight text-haze">
        Byte Brainiacs
        <span className="block font-sans text-[11px] font-normal text-mist">
          Organizer Platform
        </span>
      </span>
    </Link>
  );
}

function Footer() {
  return (
    <div className="flex flex-col gap-4">
      <LogoutButton />
      <div className="border-t border-lilac/10 px-2 pt-4">
        <p className="font-mono text-[11px] tracking-wider text-mist">
          Byte Brainiacs
        </p>
        <p className="font-mono text-[11px] tracking-wider text-mist/60">
          Version 1.0
        </p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────────────────── */}
      <header
        data-app-chrome
        className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden"
      >
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-lilac/20 text-haze transition-colors hover:bg-lilac/10"
        >
          <span className="text-lg">☰</span>
        </button>
      </header>

      {/* ── Mobile drawer ──────────────────────────────────────────────── */}
      {open && (
        <div data-app-chrome className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-void/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <aside className="glass absolute inset-y-0 left-0 flex w-72 flex-col gap-6 p-5 shadow-card-hover">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-lilac/20 text-haze transition-colors hover:bg-lilac/10"
              >
                ✕
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            <div className="mt-auto">
              <Footer />
            </div>
          </aside>
        </div>
      )}

      {/* ── Desktop rail ───────────────────────────────────────────────── */}
      <aside
        data-app-chrome
        className="glass fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-8 p-5 lg:flex"
      >
        <Brand />
        <NavLinks pathname={pathname} />
        <div className="mt-auto">
          <Footer />
        </div>
      </aside>
    </>
  );
}
